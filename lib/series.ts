import { formatDateOnly, parseDateOnly } from "./dates";

export type SeriesMode = "hard" | "soft";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function parseWeekdays(input: string[]): Weekday[] {
  const map: Record<string, Weekday> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };
  const weekdays = input.map((value) => {
    const key = value.toLowerCase().slice(0, 3);
    const weekday = map[key];
    if (weekday === undefined) {
      throw new Error(`Invalid weekday: ${value}`);
    }
    return weekday;
  });
  return Array.from(new Set(weekdays));
}

export function enumerateSeriesDates(
  startDate: string,
  endDate: string,
  weekdays: Weekday[]
): Date[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (end < start) {
    throw new Error("End date must be after start date.");
  }
  const days = new Set(weekdays);
  const current = new Date(start.getTime());
  const dates: Date[] = [];
  while (current <= end) {
    const weekday = current.getUTCDay() as Weekday;
    if (days.has(weekday)) {
      dates.push(new Date(current.getTime()));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export type CollisionReason = "alreadyReleased" | "alreadyReserved" | "notReleased";

export function evaluateReleaseSeries(
  targetDates: Date[],
  existingReleaseDates: Date[]
): { okDates: Date[]; collisions: string[] } {
  const existing = new Set(existingReleaseDates.map(formatDateOnly));
  const collisions: string[] = [];
  const okDates: Date[] = [];
  for (const date of targetDates) {
    const key = formatDateOnly(date);
    if (existing.has(key)) {
      collisions.push(key);
    } else {
      okDates.push(date);
    }
  }
  return { okDates, collisions };
}

export function evaluateReservationSeries(
  targetDates: Date[],
  releasedDates: Date[],
  reservedDates: Date[]
): { okDates: Date[]; collisions: { date: string; reason: CollisionReason }[] } {
  const released = new Set(releasedDates.map(formatDateOnly));
  const reserved = new Set(reservedDates.map(formatDateOnly));
  const collisions: { date: string; reason: CollisionReason }[] = [];
  const okDates: Date[] = [];
  for (const date of targetDates) {
    const key = formatDateOnly(date);
    if (!released.has(key)) {
      collisions.push({ date: key, reason: "notReleased" });
      continue;
    }
    if (reserved.has(key)) {
      collisions.push({ date: key, reason: "alreadyReserved" });
      continue;
    }
    okDates.push(date);
  }
  return { okDates, collisions };
}
