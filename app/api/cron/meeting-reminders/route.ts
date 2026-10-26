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
    const now = new Date();
    const todayInIndia = indiaDateKey(now);

    const activities = await LeadFollowUpRepo.find({
      where: {
        activityType: "meeting",
        isCompleted: false,
        reminderStatus: "pending",
      },
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

      // Only send reminders for meetings scheduled today in India.
      if (
        indiaDateKey(scheduledAt) !== todayInIndia ||
        scheduledAt.getTime() > now.getTime() ||
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

        // Send the email before marking the reminder as sent.
        await sendMeetingReminder({
          id: activity.id,
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
          error instanceof Error ? error.message : "Email delivery failed";
        activity.reminderAttempts += 1;

        await LeadFollowUpRepo.save(activity);
        failed++;

        console.error(
          `Meeting reminder failed for activity ${activity.id}:`,
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
    console.error("Meeting reminder cron failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to process meeting reminders." },
      { status: 500 },
    );
  }
}