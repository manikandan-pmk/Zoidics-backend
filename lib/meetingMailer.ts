import nodemailer from "nodemailer";

const recipients = (process.env.MEETING_REMINDER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

type MeetingReminder = {
  id: number;
  activityType: "follow_up" | "meeting";
  businessName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  scheduledAt: Date;
  notes: string | null;
};

export async function sendMeetingReminder(meeting: MeetingReminder) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("SMTP credentials are missing.");
  }

  if (recipients.length === 0) {
    throw new Error("No meeting reminder recipients are configured.");
  }

  const activityLabel =
    meeting.activityType === "meeting" ? "Meeting" : "Follow-up";

  const activityTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(meeting.scheduledAt));

  await transporter.sendMail({
    from: `"Zoidics Reminders" <${process.env.GMAIL_USER}>`,
    to: recipients,
    subject: `${activityLabel} Reminder: ${meeting.businessName}`,
    text: [
      `${activityLabel} Reminder`,
      "",
      `Business: ${meeting.businessName}`,
      `Contact person: ${meeting.contactPerson ?? "Not provided"}`,
      `Phone: ${meeting.phone ?? "Not provided"}`,
      `Email: ${meeting.email ?? "Not provided"}`,
      `City: ${meeting.city ?? "Not provided"}`,
      `${activityLabel} scheduled for: ${activityTime}`,
      `Notes: ${meeting.notes ?? "No notes"}`,
      "",
      "This is an automated reminder from your lead management system.",
    ].join("\n"),
  });
}
