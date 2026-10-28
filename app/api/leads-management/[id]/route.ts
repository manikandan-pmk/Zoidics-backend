
import { NextRequest, NextResponse } from "next/server";

import {
  LeadRepo,
  LeadCallRepo,
  LeadFollowUpRepo,
} from "@/lib/repository";


const allowedStatuses = [
  "new",
  "contacted",
  "follow_up",
  "meeting",
  "converted",
  "lost",
] as const;

const allowedPriorities = ["high", "medium", "low"] as const;

const allowedInterests = [
  "interested",
  "not_interested",
] as const;

const allowedCallResults = [
  "not_called",
  "answered",
  "no_answer",
  "busy",
  "switched_off",
  "call_back_later",
] as const;

const allowedActivityTypes = ["follow_up", "meeting"] as const;

type PatchInput = Record<string, unknown>;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function fail(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status },
  );
}

function isPlainObject(value: unknown): value is PatchInput {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseNullableText(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const text = value.trim();

  if (text.length > maxLength) return undefined;

  return text || null;
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

async function getLeadId(context: RouteContext) {
  const { id: rawId } = await context.params;

  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const id = Number(rawId);

  return Number.isSafeInteger(id) ? id : null;
}

/**
 * GET /api/leads/[id]
 * Returns lead details and the active follow-up/meeting.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const id = await getLeadId(context);

    if (id === null) {
      return fail("Invalid lead ID.", 400);
    }

    const lead = await LeadRepo.findOne({
      where: { id },
    });

    if (!lead) {
      return fail("Lead not found.", 404);
    }

// Fetch ALL follow-ups and meetings, including completed activities.
    const activities = await LeadFollowUpRepo.find({
      where: {
        leadId: id,
      },
      order: {
        scheduledAt: "DESC",
        id: "DESC",
      },
    });

    // Keep the latest active activity for the existing popup fields.
    const activity = activities.find(
      (item) =>
        !item.isCompleted && item.reminderStatus !== "cancelled",
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...lead,
          activities,
          activityType: activity?.activityType ?? "follow_up",
          activityNotes: activity?.notes ?? null,
          scheduledAt: activity?.scheduledAt ?? lead.nextFollowUpAt,
          reminderStatus: activity?.reminderStatus ?? null,
          reminderSentAt: activity?.reminderSentAt ?? null,
        },
        activities,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(" error:", error);

    return NextResponse.json(
      {
      success: false,
      message: "Failed to load lead.",
      debug:
        error instanceof Error
          ? error.message
          : String(error),
    },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/leads/[id]
 * Updates lead fields, call history and scheduled activities.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const id = await getLeadId(context);

    if (id === null) {
      return fail("Invalid lead ID.", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return fail("Request body must be valid JSON.", 400);
    }

    if (!isPlainObject(body)) {
      return fail("Invalid request body.", 400);
    }

    const input = body;

    const allowedKeys = new Set([
      "status",
      "priority",
      "interestLevel",
      "address",
      "city",
      "nextFollowUpAt",
      "lastCallResult",
      "activityType",
      "activityNotes",
      "resultNotes",
      "activityId",
      "completeActivity",
    ]);

    const unknownKeys = Object.keys(input).filter(
      (key) => !allowedKeys.has(key),
    );

    if (unknownKeys.length > 0) {
      return fail(
        `Unsupported field(s): ${unknownKeys.join(", ")}.`,
        400,
      );
    }

    if (Object.keys(input).length === 0) {
      return fail("Provide at least one field to update.", 400);
    }

    if (
      "status" in input &&
      (typeof input.status !== "string" ||
        !allowedStatuses.includes(
          input.status as (typeof allowedStatuses)[number],
        ))
    ) {
      return fail("Invalid lead status.", 400);
    }
    console.log("[PATCH LEAD DEBUG]", {
  statusReceived: input.status,
  allowedStatuses,
});

   if (
  "priority" in input &&
  input.priority !== null &&
  (typeof input.priority !== "string" ||
    !allowedPriorities.includes(
      input.priority as (typeof allowedPriorities)[number],
    ))
) {
  return fail("Invalid lead priority.", 400);
}

if (
  "interestLevel" in input &&
  input.interestLevel !== null &&
  (typeof input.interestLevel !== "string" ||
    !allowedInterests.includes(
      input.interestLevel as (typeof allowedInterests)[number],
    ))
) {
  return fail("Invalid interest level.", 400);
}

    let address: string | null | undefined;
    let city: string | null | undefined;

    if ("address" in input) {
      address = parseNullableText(input.address, 1000);

      if (address === undefined) {
        return fail(
          "Address must be text with at most 1,000 characters.",
          400,
        );
      }
    }

    if ("city" in input) {
      city = parseNullableText(input.city, 100);

      if (city === undefined) {
        return fail(
          "City must be text with at most 100 characters.",
          400,
        );
      }
    }

    if (
      "lastCallResult" in input &&
      input.lastCallResult !== null &&
      (typeof input.lastCallResult !== "string" ||
        !allowedCallResults.includes(
          input.lastCallResult as (typeof allowedCallResults)[number],
        ))
    ) {
      return fail("Invalid call outcome.", 400);
    }

    if (
      "activityType" in input &&
      (typeof input.activityType !== "string" ||
        !allowedActivityTypes.includes(
          input.activityType as (typeof allowedActivityTypes)[number],
        ))
    ) {
      return fail("Invalid activity type.", 400);
    }

    let nextFollowUpAt: Date | null | undefined;

    if ("nextFollowUpAt" in input) {
      nextFollowUpAt = parseDate(input.nextFollowUpAt);

      if (nextFollowUpAt === undefined) {
        return fail(
          "Provide a valid follow-up date/time or null to clear it.",
          400,
        );
      }

      if (nextFollowUpAt && nextFollowUpAt.getTime() <= Date.now()) {
        return fail(
          "Follow-up date/time must be in the future.",
          400,
        );
      }
    }

    let activityNotes: string | null | undefined;

    if ("activityNotes" in input) {
      activityNotes = parseNullableText(input.activityNotes, 10000);

      if (activityNotes === undefined) {
        return fail(
          "Activity notes must be text with at most 10,000 characters.",
          400,
        );
      }
    }

    let resultNotes: string | null | undefined;

if ("resultNotes" in input) {
  resultNotes = parseNullableText(input.resultNotes, 10000);

  if (resultNotes === undefined) {
    return fail(
      "Result notes must be text with at most 10,000 characters.",
      400
    );
  }
}

    if (
      "activityId" in input &&
      (!Number.isSafeInteger(Number(input.activityId)) ||
        Number(input.activityId) <= 0)
    ) {
      return fail("Invalid activity ID.", 400);
    }

    if (
      "completeActivity" in input &&
      typeof input.completeActivity !== "boolean"
    ) {
      return fail("completeActivity must be a boolean.", 400);
    }

    if (input.completeActivity === true && !("activityId" in input)) {
      return fail("An activity ID is required to complete an activity.", 400);
    }

    const result = await LeadRepo.manager.transaction(async (manager) => {
      const leadRepository = manager.getRepository(LeadRepo.target) as typeof LeadRepo;
      const callRepository = manager.getRepository(LeadCallRepo.target) as typeof LeadCallRepo;
      const followUpRepository = manager.getRepository(LeadFollowUpRepo.target) as typeof LeadFollowUpRepo;

      const lead = await leadRepository.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });

      if (!lead) {
        throw new Error("LEAD_NOT_FOUND");
      }

      const previousStatus = lead.status;

      const currentActivities = await followUpRepository.find({
        where: {
          leadId: lead.id,
          isCompleted: false,
        },
        order: {
          scheduledAt: "DESC",
          id: "DESC",
        },
        lock: { mode: "pessimistic_write" },
      });

      const currentActivity = currentActivities.find(
        (item) => item.reminderStatus !== "cancelled",
      );

      // Complete only the activity explicitly selected by the UI.
      // Keep its original notes and scheduled date as history.
      if (input.completeActivity === true) {
        const activity = await followUpRepository.findOne({
          where: {
            id: Number(input.activityId),
            leadId: lead.id,
          },
          lock: { mode: "pessimistic_write" },
        });

        if (!activity) {
          throw new Error("ACTIVITY_NOT_FOUND");
        }

        if (activity.isCompleted || activity.reminderStatus === "cancelled") {
          throw new Error("ACTIVITY_ALREADY_COMPLETED");
        }

        activity.resultNotes = resultNotes ?? null;
        activity.isCompleted = true;
        await followUpRepository.save(activity);
      }

      // Update lead information.
      if ("status" in input) {
        lead.status = input.status as typeof lead.status;
      }

      if ("priority" in input) {
        lead.priority = input.priority as typeof lead.priority;
      }

      if ("interestLevel" in input) {
        lead.interestLevel =
          input.interestLevel as typeof lead.interestLevel;
      }

      if ("address" in input) {
        lead.address = address ?? null;
      }

      if ("city" in input) {
        lead.city = city ?? null;
      }

      // Record the call outcome.
      if (
        "lastCallResult" in input &&
        input.lastCallResult !== null
      ) {
        const callResult =
          input.lastCallResult as (typeof allowedCallResults)[number];

        lead.lastCallResult = callResult;

        if (callResult !== "not_called") {
  lead.lastContactedAt = new Date();

  await callRepository.save(
    callRepository.create({
      leadId: lead.id,
      result: callResult,
      notes: resultNotes ?? null,
    }),
  );
}
      }


      // Keep interest and priority consistent with the final call result.
if (lead.lastCallResult !== "answered") {
  lead.interestLevel = null;
  lead.priority = null;
} else if (lead.interestLevel === "interested") {
  lead.priority = lead.priority ?? "medium";
} else {
  lead.priority = null;
}

      const scheduledAt =
        nextFollowUpAt !== undefined
          ? nextFollowUpAt
          : currentActivity?.scheduledAt ?? lead.nextFollowUpAt;

      const activityType = (
        "activityType" in input
          ? input.activityType
          : currentActivity?.activityType ?? "follow_up"
      ) as (typeof allowedActivityTypes)[number];

      const finalActivityNotes =
        activityNotes !== undefined
          ? activityNotes
          : currentActivity?.notes ?? null;

      // The frontend may submit the current activity fields on every save.
      // Create a new history row only if the schedule actually changed.
      const hasScheduleInput =
        "nextFollowUpAt" in input ||
        "activityType" in input ||
        "activityNotes" in input;

      const scheduleActuallyChanged =
        hasScheduleInput &&
        input.completeActivity !== true &&
        (
          !currentActivity ||
          (nextFollowUpAt !== undefined &&
            nextFollowUpAt?.getTime() !== currentActivity.scheduledAt?.getTime()) ||
          ("activityType" in input &&
            activityType !== currentActivity.activityType) ||
          ("activityNotes" in input &&
            (finalActivityNotes ?? null) !== (currentActivity.notes ?? null))
        );

      if (
        scheduleActuallyChanged &&
        activityType === "meeting" &&
        !scheduledAt
      ) {
        throw new Error("MEETING_REQUIRES_DATE");
      }

      if (
        scheduleActuallyChanged &&
        scheduledAt &&
        scheduledAt.getTime() <= Date.now()
      ) {
        throw new Error("FOLLOW_UP_MUST_BE_FUTURE");
      }

      if (scheduleActuallyChanged) {
        if (scheduledAt) {
          const newActivity = followUpRepository.create({
            leadId: lead.id,
            activityType,
            scheduledAt,
            notes: finalActivityNotes,
            resultNotes: null,
            isCompleted: false,
            reminderSentAt: null,
            reminderStatus: "pending",
            reminderAttempts: 0,
            reminderError: null,
          });

          await followUpRepository.save(newActivity);
          lead.nextFollowUpAt = scheduledAt;

          // Automatically set follow_up only when the user did not explicitly
          // choose a lead status in this request.
          if (
            !("status" in input) &&
            lead.status !== "converted" &&
            lead.status !== "lost"
          ) {
            lead.status = "follow_up";
          }
        } else if (nextFollowUpAt === null) {
          // Clear the summary date only; preserve activity history.
          lead.nextFollowUpAt = null;
        }
      }

      // If an activity was completed, point the lead summary at the next
      // remaining active activity rather than the completed one.
      if (input.completeActivity === true) {
        const remainingActivities = await followUpRepository.find({
          where: { leadId: lead.id, isCompleted: false },
          order: { scheduledAt: "ASC", id: "ASC" },
        });
        const nextActivity = remainingActivities.find(
          (item) => item.reminderStatus !== "cancelled",
        );
        lead.nextFollowUpAt = nextActivity?.scheduledAt ?? null;
      }

      const contactedStatuses: string[] = [
        "contacted",
        "interested",
        "follow_up",
      ];

      const enteringContactedState =
        contactedStatuses.includes(lead.status) &&
        previousStatus !== lead.status;

      if (enteringContactedState && !lead.lastContactedAt) {
        lead.lastContactedAt = new Date();
      }

      const savedLead = await leadRepository.save(lead);

      const latestActivities = await followUpRepository.find({
        where: {
          leadId: lead.id,
          isCompleted: false,
        },
        order: {
          scheduledAt: "DESC",
          id: "DESC",
        },
      });

      const latestActivity = latestActivities.find(
        (item) => item.reminderStatus !== "cancelled",
      );

      return {
        lead: savedLead,
        activity: latestActivity,
        scheduleChanged: scheduleActuallyChanged,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead updated successfully.",
        data: {
          ...result.lead,
          activityType: result.activity?.activityType ?? null,
          activityNotes: result.activity?.notes ?? null,
          scheduledAt:
            result.activity?.scheduledAt ??
            result.lead.nextFollowUpAt,
          reminderStatus: result.activity?.reminderStatus ?? null,
          reminderSentAt: result.activity?.reminderSentAt ?? null,
          scheduleChanged: result.scheduleChanged,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LEAD_NOT_FOUND") {
        return fail("Lead not found.", 404);
      }

      if (error.message === "MEETING_REQUIRES_DATE") {
        return fail(
          "A meeting requires a scheduled date and time.",
          400,
        );
      }

      if (error.message === "FOLLOW_UP_MUST_BE_FUTURE") {
        return fail(
          "Follow-up date/time must be in the future.",
          400,
        );
      }

      if (error.message === "ACTIVITY_NOT_FOUND") {
        return fail("Activity not found for this lead.", 404);
      }

      if (error.message === "ACTIVITY_ALREADY_COMPLETED") {
        return fail("This activity is already completed or cancelled.", 409);
      }
    }

    console.error("Lead [id] route error:", error);
    console.error("[PATCH LEAD UPDATE ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lead. Please try again.",
      },
      { status: 500 },
    );
  }
}
