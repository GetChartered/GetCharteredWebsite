// Ported 1:1 from GetChartered_app's StudyPlanner/calendarUtils.ts — pure
// local-date math, no framework dependency, so no changes were needed to
// bring it to the website.
import type { LocalDateString } from "./types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDateString(value: string): value is LocalDateString {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function toLocalDateString(date = new Date()): LocalDateString {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` as LocalDateString;
}

export function parseLocalDate(dateKey: LocalDateString): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function compareLocalDates(a: LocalDateString, b: LocalDateString): number {
  return a.localeCompare(b);
}

export function addLocalDays(dateKey: LocalDateString, days: number): LocalDateString {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

export function addLocalMonths(dateKey: LocalDateString, months: number): LocalDateString {
  const date = parseLocalDate(dateKey);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months, 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return toLocalDateString(date);
}

export function startOfWeekMonday(dateKey: LocalDateString): LocalDateString {
  const date = parseLocalDate(dateKey);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toLocalDateString(date);
}

export function monthKeyOf(dateKey: LocalDateString): string {
  return dateKey.slice(0, 7);
}
