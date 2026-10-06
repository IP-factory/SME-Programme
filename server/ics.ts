import { BRAND } from "../shared/brand";
import { ENV } from "./_core/env";
export interface ICSOptions {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
  url?: string;
}

export function generateICS(options: ICSOptions): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const now = formatDate(new Date());
  const dtstart = formatDate(options.startTime);
  const dtend = formatDate(options.endTime);
  const uid = `${BRAND.programmeName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@${new URL(ENV.appOrigin).hostname}`;
  
  const description = options.description.replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${BRAND.programmeFullName}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${options.title}`,
    `DESCRIPTION:${description}`,
    options.location ? `LOCATION:${options.location}` : "LOCATION:Google Meet / Online",
    options.url ? `URL:${options.url}` : "",
    options.organizerName && options.organizerEmail 
      ? `ORGANIZER;CN="${options.organizerName}":mailto:${options.organizerEmail}` 
      : `ORGANIZER;CN=\"${BRAND.senderDisplayName}\":mailto:${BRAND.administrationMailbox}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${options.title} starts in 24 hours`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
