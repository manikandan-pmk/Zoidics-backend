
import { NextRequest, NextResponse } from "next/server";

import {
  LeadRepo,
  LeadCallRepo,
  LeadFollowUpRepo,
} from "@/lib/repository";


const allowedStatuses = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
  "lost",
] as const;

const allowedPriorities = ["high", "medium", "low"] as const;
const allowedInterests = ["hot", "warm", "cold"] as const;

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

    const activities = await LeadFollowUpRepo.find({
      where: {
        leadId: id,
        isCompleted: false,
      },
      order: {
        scheduledAt: "DESC",
        id: "DESC",
      },
    });

    const activity = activities.find(
      (item) => item.reminderStatus !== "cancelled",
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...lead,
          activityType: activity?.activityType ?? "follow_up",
          activityNotes: activity?.notes ?? null,
          scheduledAt:
            activity?.scheduledAt ?? lead.nextFollowUpAt,
          reminderStatus: activity?.reminderStatus ?? null,
          reminderSentAt: activity?.reminderSentAt ?? null,
        },
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

    if (
      "priority" in input &&
      (typeof input.priority !== "string" ||
        !allowedPriorities.includes(
          input.priority as (typeof allowedPriorities)[number],
        ))
    ) {
      return fail("Invalid lead priority.", 400);
    }

    if (
      "interestLevel" in input &&
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
      notes: null,
    }),
  );
}
      }

      const hasScheduleChange =
        "nextFollowUpAt" in input ||
        "activityType" in input ||
        "activityNotes" in input;

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

      if (
        hasScheduleChange &&
        activityType === "meeting" &&
        !scheduledAt
      ) {
        throw new Error("MEETING_REQUIRES_DATE");
      }

      if (
        hasScheduleChange &&
        scheduledAt &&
        scheduledAt.getTime() <= Date.now()
      ) {
        throw new Error("FOLLOW_UP_MUST_BE_FUTURE");
      }

      if (hasScheduleChange) {
        // Cancel previous outstanding reminders.
        const activeActivities = await followUpRepository.find({
          where: {
            leadId: lead.id,
            isCompleted: false,
          },
          lock: { mode: "pessimistic_write" },
        });

        for (const activity of activeActivities) {
          activity.reminderStatus = "cancelled";
          await followUpRepository.save(activity);
        }

        if (scheduledAt) {
          const newActivity = followUpRepository.create({
            leadId: lead.id,
            activityType,
            scheduledAt,
            notes: finalActivityNotes,
            isCompleted: false,
            reminderSentAt: null,
            reminderStatus: "pending",
            reminderAttempts: 0,
            reminderError: null,
          });

          await followUpRepository.save(newActivity);

          lead.nextFollowUpAt = scheduledAt;

          if (lead.status !== "converted") {
            lead.status = "follow_up";
          }
        } else if (nextFollowUpAt === null) {
          // Clearing the schedule cancels outstanding reminders.
          lead.nextFollowUpAt = null;
        }
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
        scheduleChanged: hasScheduleChange,
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
    }

    console.error("Lead [id] route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lead. Please try again.",
      },
      { status: 500 },
    );
  }
}
