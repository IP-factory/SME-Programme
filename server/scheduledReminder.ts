import { Request, Response } from "express";
import { getDb } from "./db";
import { registrations, emailLogs, scheduleBookings, scheduleSlots, scheduledReminderDeliveries } from "../drizzle/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { deliverEmail } from "./email";
import { buildBrandedEmailHtml } from "./emailTemplates";
import { generateICS } from "./ics";
import { createHash, timingSafeEqual } from "crypto";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { BRAND } from "../shared/brand";

const HOUR = 60 * 60 * 1000;
const REMINDER_WINDOW_EARLY_MS = 30 * 60 * 1000;
const REMINDER_WINDOW_LATE_MS = 30 * 60 * 1000;
export const OWNER_APPROVAL_REQUIRED_FOR_REMINDERS = true;

export function reminderWindow(now = new Date()) {
  return {
    start: new Date(now.getTime() + 24 * HOUR - REMINDER_WINDOW_EARLY_MS),
    end: new Date(now.getTime() + 24 * HOUR + REMINDER_WINDOW_LATE_MS),
  };
}

export function reminderDeliveryKey(bookingId: number) {
  return `booking:${bookingId}:24h`;
}

export function automatedReminderPolicy() {
  return {
    automatedDispatchEnabled: !OWNER_APPROVAL_REQUIRED_FOR_REMINDERS,
    message: `${BRAND.programmeShortName} 24-hour session reminders require ${BRAND.facilitatorFirstName}'s explicit approval before delivery.`,
  } as const;
}

function isDuplicateReminderError(error: unknown) {
  const candidate = error as { code?: string; errno?: number } | undefined;
  return candidate?.code === "ER_DUP_ENTRY" || candidate?.errno === 1062;
}

/**
 * Off Manus, scheduled endpoints are called by the host's cron with `Authorization: Bearer <CRON_SECRET>`.
 * Without a configured secret this check refuses every call.
 */
export function isAuthorisedCronRequest(authorization: string | undefined, secret = ENV.cronSecret) {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization.slice("Bearer ".length)), digest(secret));
}

/** On Manus, scheduled tasks call in with a platform-issued cron session. */
async function isManusScheduledTask(req: Request) {
  try {
    const caller = await sdk.authenticateRequest(req);
    return Boolean(caller.isCron && caller.taskUid);
  } catch {
    return false;
  }
}

export async function handleScheduledReminder(req: Request, res: Response) {
  try {
    if (!isAuthorisedCronRequest(req.get("authorization")) && !(await isManusScheduledTask(req))) {
      return res.status(403).json({ error: "Cron execution required" });
    }

    if (OWNER_APPROVAL_REQUIRED_FOR_REMINDERS) {
      return res.status(202).json({
        ok: true,
        dispatched: 0,
        approvalRequired: true,
        message: automatedReminderPolicy().message,
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection error" });
    }

    const window = reminderWindow();
    const bookings = await db.select({
      bookingId: scheduleBookings.id,
      registrationId: registrations.id,
      fullName: registrations.fullName,
      email: registrations.email,
      kind: scheduleSlots.kind,
      sessionNumber: scheduleSlots.sessionNumber,
      startAt: scheduleSlots.startAt,
      endAt: scheduleSlots.endAt,
      timezone: scheduleSlots.timezone,
      calendarStatus: scheduleBookings.calendarStatus,
    })
      .from(scheduleBookings)
      .innerJoin(scheduleSlots, eq(scheduleBookings.slotId, scheduleSlots.id))
      .innerJoin(registrations, eq(scheduleBookings.registrationId, registrations.id))
      .where(and(
        eq(scheduleBookings.status, "Confirmed"),
        eq(registrations.status, "Accepted"),
        eq(registrations.depositPaid, "Paid"),
        gte(scheduleSlots.startAt, window.start),
        lt(scheduleSlots.startAt, window.end),
      ));

    if (bookings.length === 0) {
      return res.json({ ok: true, dispatched: 0, message: "No confirmed participant sessions fall within the 24-hour reminder window." });
    }

    const results = [] as Array<{ bookingId: number; status: "Sent" | "Failed" | "Skipped" }>;
    for (const booking of bookings) {
      const deliveryKey = reminderDeliveryKey(booking.bookingId);
      try {
        await db.insert(scheduledReminderDeliveries).values({
          bookingId: booking.bookingId,
          reminderType: "24h",
          deliveryKey,
          status: "Pending",
        });
      } catch (error) {
        if (isDuplicateReminderError(error)) {
          results.push({ bookingId: booking.bookingId, status: "Skipped" });
          continue;
        }
        throw error;
      }

      const sessionTitle = `${BRAND.programmeName} ${booking.kind} session ${booking.sessionNumber}`;
      const dateLabel = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: booking.timezone,
      }).format(new Date(booking.startAt));
      const icsContent = generateICS({
        title: sessionTitle,
        description: `Your ${BRAND.programmeName} session reminder. Please use the Google Calendar invitation already sent to you for joining details.`,
        startTime: new Date(booking.startAt),
        endTime: new Date(booking.endAt),
        location: "Google Calendar invitation / Participant Portal",
      });
      const subject = `${BRAND.programmeName} — 24-hour reminder: ${booking.kind} session ${booking.sessionNumber}`;
      const body = `Dear ${booking.fullName},\n\nThis is a kindly reminder that your ${BRAND.programmeName} ${booking.kind} session ${booking.sessionNumber} is scheduled for ${dateLabel}.\n\nYour Google Calendar invitation contains the joining details. A calendar file is also attached for your convenience. If you experience any difficulty, kindly reply directly to this email.\n\nWarm regards,\n\n${BRAND.facilitatorName}\nFacilitator, ${BRAND.programmeName} — Strategy & Innovation Genius Track`;
      const firstName = booking.fullName.trim().split(/\s+/)[0] || booking.fullName;
      const html = buildBrandedEmailHtml({
        label: "24-hour session reminder",
        title: `${booking.kind} session ${booking.sessionNumber}`,
        preheader: `Your ${BRAND.programmeName} session is scheduled for ${dateLabel}.`,
        greeting: `Dear ${firstName},`,
        paragraphs: [`This is a kindly reminder that your ${BRAND.programmeName} session is approaching.`],
        details: [{ label: "Scheduled for", value: dateLabel }],
        callout: "Your Google Calendar invitation contains the joining details. A calendar file is also attached for your convenience.",
        footerNote: "If you experience a difficulty, kindly reply directly to this email.",
      });
      const delivery = await deliverEmail({
        to: booking.email,
        subject,
        body,
        html,
        icsContent,
        icsFilename: `${BRAND.programmeName.replace(/\s+/g, "_")}_${booking.kind}_Session_${booking.sessionNumber}_Reminder.ics`,
      });
      const [emailResult] = await db.insert(emailLogs).values({
        registrationId: booking.registrationId,
        recipientEmail: booking.email,
        subject,
        body,
        status: delivery.status,
      });
      const emailLogId = Number(emailResult.insertId);
      const sent = delivery.status === "Sent";
      await db.update(scheduledReminderDeliveries).set({
        status: sent ? "Sent" : "Failed",
        emailLogId,
        sentAt: sent ? new Date() : null,
        errorMessage: sent ? null : "The configured email providers did not accept the reminder for delivery.",
      }).where(eq(scheduledReminderDeliveries.deliveryKey, deliveryKey));
      results.push({ bookingId: booking.bookingId, status: sent ? "Sent" : "Failed" });
    }

    return res.json({
      ok: true,
      dispatched: results.filter((result) => result.status === "Sent").length,
      skipped: results.filter((result) => result.status === "Skipped").length,
      results,
    });
  } catch (error) {
    console.error("[Scheduled reminder] Callback failed:", error);
    return res.status(500).json({
      error: "Unable to process the reminder callback.",
    });
  }
}
