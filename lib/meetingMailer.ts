import nodemailer from "nodemailer";

const recipients = (process.env.MEETING_REMINDER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type MeetingReminder = {
  id: number;
  businessName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  scheduledAt: Date;
  notes: string | null;
};

export async function sendMeetingReminder(meeting: MeetingReminder) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are missing.");
  }

  if (recipients.length === 0) {
    throw new Error("No meeting reminder recipients are configured.");
  }

  const meetingTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(meeting.scheduledAt));

  await transporter.sendMail({
    from: `"Meeting Reminders" <${process.env.SMTP_USER}>`,
    to: recipients,
    subject: `Meeting reminder: ${meeting.businessName}`,
    text: [
      "Meeting reminder",
      "",
      `Business: ${meeting.businessName}`,
      `Contact person: ${meeting.contactPerson ?? "Not provided"}`,
      `Phone: ${meeting.phone ?? "Not provided"}`,
      `Email: ${meeting.email ?? "Not provided"}`,
      `City: ${meeting.city ?? "Not provided"}`,
      `Meeting scheduled for: ${meetingTime}`,
      `Notes: ${meeting.notes ?? "No notes"}`,
      "",
      "This is an automated reminder from your lead management system.",
    ].join("\n"),
  });
}