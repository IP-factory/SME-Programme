import type { ScheduleSlot } from "../drizzle/schema";

export const PROGRAMME_TIMEZONE = "Africa/Lagos";
export const BOARDROOM_MEETING_COUNT = 3;
export const APPLY_MEETING_COUNT = 3;
export const LEARN_MEETING_COUNT = 5;

export type SlotKind = "Decide" | "Learn" | "Apply";
export type SlotDefinition = {
  kind: SlotKind;
  sessionNumber: number;
  startAt: Date;
  endAt: Date;
  timezone: string;
  capacity: number;
};

const BLACKOUT_DATES = new Set(["2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12"]);
const APPLY_ROTATION: Array<{ weekday: number; hour: number; minute: number }> = [
  { weekday: 5, hour: 18, minute: 0 },
  { weekday: 6, hour: 17, minute: 0 },
  { weekday: 0, hour: 18, minute: 0 },
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function atLagosTime(year: number, month: number, day: number, hour: number, minute: number) {
  // Lagos is UTC+1 throughout the 2026 programme window.
  return new Date(Date.UTC(year, month - 1, day, hour - 1, minute));
}

function dateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROGRAMME_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

function addCalendarDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function overlaps(startAt: Date, endAt: Date, busyRanges: Array<{ start: Date; end: Date }>) {
  return busyRanges.some((busy) => startAt < busy.end && endAt > busy.start);
}

export function isBlackoutDate(date: Date) {
  const parts = dateParts(date);
  return BLACKOUT_DATES.has(dateKey(parts.year, parts.month, parts.day));
}

export function getAvailabilityWindow(kind: SlotKind) {
  return {
    start: kind === "Decide" ? new Date("2026-08-24T00:00:00.000Z") : new Date("2026-09-04T00:00:00.000Z"),
    end: new Date("2026-10-31T23:59:59.999Z"),
  };
}

function decideTimes(weekday: number) {
  if (weekday === 1 || weekday === 2) return [[7, 0], [18, 0]];
  if (weekday === 4) return [[7, 0], [21, 30]];
  if (weekday === 5) return [[7, 0], [18, 0]];
  if (weekday === 6) return [[10, 0]];
  if (weekday === 0) return [[18, 0]];
  return [];
}

function learnTimes(weekday: number) {
  if (weekday === 5) return [[18, 0]];
  if (weekday === 6) return [[17, 0]];
  if (weekday === 0) return [[18, 0]];
  return [];
}

function applyTimeForWeek(weekNumber: number) {
  return APPLY_ROTATION[weekNumber % APPLY_ROTATION.length];
}

export function generateSlotDefinitions(kind: SlotKind, options?: { start?: Date; end?: Date }): SlotDefinition[] {
  const window = getAvailabilityWindow(kind);
  const start = options?.start ?? window.start;
  const end = options?.end ?? window.end;
  const definitions: SlotDefinition[] = [];
  let current = new Date(start);
  let learnSession = 1;
  let applyWeek = 0;
  let lastLearnAnchor = "";

  while (current <= end) {
    const parts = dateParts(current);
    const key = dateKey(parts.year, parts.month, parts.day);
    if (!BLACKOUT_DATES.has(key)) {
      if (kind === "Decide") {
        for (const [hour, minute] of decideTimes(parts.weekday)) {
          const startAt = atLagosTime(parts.year, parts.month, parts.day, hour, minute);
          definitions.push({ kind, sessionNumber: 1, startAt, endAt: new Date(startAt.getTime() + 90 * 60 * 1000), timezone: PROGRAMME_TIMEZONE, capacity: 1 });
        }
      }
      if (kind === "Learn") {
        const times = learnTimes(parts.weekday);
        const anchor = parts.weekday === 5 ? key : dateKey(parts.year, parts.month, parts.day - (parts.weekday === 6 ? 1 : 2));
        if (parts.weekday === 5 && lastLearnAnchor && (new Date(current).getTime() - new Date(lastLearnAnchor).getTime()) >= 14 * 24 * 60 * 60 * 1000) learnSession += 1;
        if (parts.weekday === 5) lastLearnAnchor = key;
        if (learnSession <= LEARN_MEETING_COUNT) {
          for (const [hour, minute] of times) {
            const startAt = atLagosTime(parts.year, parts.month, parts.day, hour, minute);
            definitions.push({ kind, sessionNumber: learnSession, startAt, endAt: new Date(startAt.getTime() + 90 * 60 * 1000), timezone: PROGRAMME_TIMEZONE, capacity: 30 });
          }
        }
        void anchor;
      }
      if (kind === "Apply") {
        const startOfProgramme = new Date("2026-09-04T00:00:00.000Z");
        const weekNumber = Math.floor((current.getTime() - startOfProgramme.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const rotation = applyTimeForWeek(Math.max(0, weekNumber));
        if (parts.weekday === rotation.weekday) {
          const startAt = atLagosTime(parts.year, parts.month, parts.day, rotation.hour, rotation.minute);
          definitions.push({ kind, sessionNumber: Math.min(weekNumber + 1, APPLY_MEETING_COUNT), startAt, endAt: new Date(startAt.getTime() + 90 * 60 * 1000), timezone: PROGRAMME_TIMEZONE, capacity: 8 });
        }
        applyWeek = weekNumber;
      }
    }
    current = addCalendarDays(current, 1);
  }

  return definitions.filter((definition) => definition.startAt >= start && definition.startAt <= end).slice(0, kind === "Decide" ? 200 : 30);
}

export function filterAvailableSlotRows<T extends Pick<ScheduleSlot, "startAt" | "endAt" | "status" | "capacity" | "bookedCount">>(rows: T[], busyRanges: Array<{ start: Date; end: Date }> = []) {
  return rows.filter((row) => row.status === "Open" && row.bookedCount < row.capacity && !overlaps(new Date(row.startAt), new Date(row.endAt), busyRanges));
}

export function requiredMeetingsForPackage(packageName: "Foundation" | "Engine Room" | "Boardroom") {
  if (packageName === "Boardroom") return { kind: "Decide" as const, count: BOARDROOM_MEETING_COUNT };
  if (packageName === "Engine Room") return { kind: "Apply" as const, count: APPLY_MEETING_COUNT };
  return { kind: "Learn" as const, count: LEARN_MEETING_COUNT };
}
