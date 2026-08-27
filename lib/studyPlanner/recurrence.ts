// Ported 1:1 from GetChartered_app's StudyPlanner/recurrence.ts.
import {
  addLocalDays,
  addLocalMonths,
  compareLocalDates,
  parseLocalDate,
} from "./calendarUtils";
import type { LocalDateString, RecurrenceRule, Weekday } from "./types";

function isInRange(
  date: LocalDateString,
  rangeStart: LocalDateString,
  rangeEnd: LocalDateString
) {
  return compareLocalDates(date, rangeStart) >= 0 && compareLocalDates(date, rangeEnd) <= 0;
}

function reachedRuleEnd(
  date: LocalDateString,
  occurrencesSeen: number,
  rule: RecurrenceRule
) {
  if (rule.count != null && occurrencesSeen >= rule.count) return true;
  if (rule.untilDate != null && compareLocalDates(date, rule.untilDate) > 0) return true;
  return false;
}

function normaliseInterval(rule: RecurrenceRule) {
  return Math.max(1, Math.floor(rule.interval || 1));
}

export function expandRecurrenceDates(args: {
  startDate: LocalDateString;
  rule?: RecurrenceRule;
  rangeStart: LocalDateString;
  rangeEnd: LocalDateString;
}): LocalDateString[] {
  const { startDate, rule, rangeStart, rangeEnd } = args;

  if (!rule) {
    return isInRange(startDate, rangeStart, rangeEnd) ? [startDate] : [];
  }

  const interval = normaliseInterval(rule);
  const dates: LocalDateString[] = [];
  let seen = 0;

  if (rule.frequency === "daily") {
    for (
      let cursor = startDate;
      compareLocalDates(cursor, rangeEnd) <= 0 && !reachedRuleEnd(cursor, seen, rule);
      cursor = addLocalDays(cursor, interval)
    ) {
      seen += 1;
      if (isInRange(cursor, rangeStart, rangeEnd)) dates.push(cursor);
    }
    return dates;
  }

  if (rule.frequency === "monthly") {
    for (
      let cursor = startDate;
      compareLocalDates(cursor, rangeEnd) <= 0 && !reachedRuleEnd(cursor, seen, rule);
      cursor = addLocalMonths(cursor, interval)
    ) {
      seen += 1;
      if (isInRange(cursor, rangeStart, rangeEnd)) dates.push(cursor);
    }
    return dates;
  }

  const start = parseLocalDate(startDate);
  const weekdays: Set<Weekday> = rule.byWeekday?.length
    ? new Set(rule.byWeekday)
    : new Set([start.getDay() as Weekday]);

  for (
    let cursor = startDate;
    compareLocalDates(cursor, rangeEnd) <= 0 && !reachedRuleEnd(cursor, seen, rule);
    cursor = addLocalDays(cursor, 1)
  ) {
    const dayDiff = Math.floor(
      (parseLocalDate(cursor).getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekIndex = Math.floor(dayDiff / 7);
    const isActiveWeek = weekIndex >= 0 && weekIndex % interval === 0;
    const isActiveWeekday = weekdays.has(parseLocalDate(cursor).getDay() as Weekday);

    if (!isActiveWeek || !isActiveWeekday) continue;

    seen += 1;
    if (isInRange(cursor, rangeStart, rangeEnd)) dates.push(cursor);
  }

  return dates;
}
