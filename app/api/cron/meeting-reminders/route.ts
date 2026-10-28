
import { NextRequest, NextResponse } from "next/server";
import { LeadRepo, LeadFollowUpRepo } from "@/lib/repository";
import { sendMeetingReminder } from "@/lib/meetingMailer";

function indiaDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const todayInIndia = indiaDateKey(new Date());

    // Fetch both Follow-up and Meeting activities.
    const activities = await LeadFollowUpRepo.find({
      where: [
        {
          activityType: "follow_up",
          isCompleted: false,
          reminderStatus: "pending",
        },
        {
          activityType: "meeting",
          isCompleted: false,
          reminderStatus: "pending",
        },
      ],
      order: {
        scheduledAt: "ASC",
        id: "ASC",
      },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const activity of activities) {
      const scheduledAt = new Date(activity.scheduledAt);

      // Process only activities scheduled for today in India.
      if (
        indiaDateKey(scheduledAt) !== todayInIndia ||
        activity.reminderSentAt
      ) {
        skipped++;
        continue;
      }

      try {
        const lead = await LeadRepo.findOne({
          where: { id: activity.leadId },
        });

        if (!lead) {
          throw new Error(`Lead ${activity.leadId} was not found.`);
        }

        await sendMeetingReminder({
          id: activity.id,
          activityType: activity.activityType,
          businessName: lead.businessName,
          contactPerson: lead.contactPerson,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          scheduledAt,
          notes: activity.notes,
        });

        activity.reminderStatus = "sent";
        activity.reminderSentAt = new Date();
        activity.reminderError = null;
        activity.reminderAttempts += 1;

        await LeadFollowUpRepo.save(activity);
        sent++;
      } catch (error) {
        activity.reminderStatus = "failed";
        activity.reminderError =
          error instanceof Error
            ? error.message
            : "Email delivery failed";
        activity.reminderAttempts += 1;

        await LeadFollowUpRepo.save(activity);
        failed++;

        console.error(
          `Reminder failed for ${activity.activityType} activity ${activity.id}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      date: todayInIndia,
      sent,
      failed,
      skipped,
    });
  } catch (error) {
    console.error("Follow-up reminder cron failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process follow-up reminders.",
      },
      { status: 500 },
    );
  }
}
