// Ported 1:1 from GetChartered_app's StudyPlanner/studyPlanWeeks.ts.
import {
  addLocalDays,
  compareLocalDates,
  startOfWeekMonday,
  toLocalDateString,
} from "./calendarUtils";
import type { LocalDateString } from "./types";

export type StudyPlanWeekPositionInput = {
  planStartDate?: LocalDateString;
  currentDate: LocalDateString;
  examDate: LocalDateString;
};

export type StudyPlanWeekPosition = {
  current: number;
  total: number;
  planWeekStart: LocalDateString;
  currentWeekStart: LocalDateString;
  examWeekStart: LocalDateString;
};

export function getStudyPlanWeekPosition({
  planStartDate,
  currentDate,
  examDate,
}: StudyPlanWeekPositionInput): StudyPlanWeekPosition {
  const planWeekStart = startOfWeekMonday(planStartDate ?? currentDate);
  const currentWeekStart = startOfWeekMonday(currentDate);
  const examWeekStart = startOfWeekMonday(examDate);
  const effectiveCurrentWeek =
    compareLocalDates(currentWeekStart, planWeekStart) < 0 ? planWeekStart : currentWeekStart;
  const effectiveExamWeek =
    compareLocalDates(examWeekStart, planWeekStart) < 0 ? planWeekStart : examWeekStart;

  return {
    current: weeksInclusive(planWeekStart, effectiveCurrentWeek),
    total: weeksInclusive(planWeekStart, effectiveExamWeek),
    planWeekStart,
    currentWeekStart: effectiveCurrentWeek,
    examWeekStart: effectiveExamWeek,
  };
}

export function buildPlanWeekStarts({
  planStartDate,
  currentDate,
  examDate,
}: StudyPlanWeekPositionInput): LocalDateString[] {
  const { planWeekStart, examWeekStart } = getStudyPlanWeekPosition({
    planStartDate,
    currentDate,
    examDate,
  });
  const weeks: LocalDateString[] = [];
  for (
    let cursor = planWeekStart;
    compareLocalDates(cursor, examWeekStart) <= 0;
    cursor = addLocalDays(cursor, 7)
  ) {
    weeks.push(cursor);
  }
  return weeks;
}

export function formatWeeksToExam(examDate: LocalDateString, currentDate: LocalDateString = toLocalDateString()) {
  const currentWeekStart = startOfWeekMonday(currentDate);
  const examWeekStart = startOfWeekMonday(examDate);
  const weeks = weeksInclusive(currentWeekStart, examWeekStart);
  return weeks === 1 ? "1 wk to exam" : `${weeks} wks to exam`;
}

function weeksInclusive(startWeek: LocalDateString, endWeek: LocalDateString) {
  const start = startOfWeekMonday(startWeek);
  const end = startOfWeekMonday(endWeek);
  if (compareLocalDates(end, start) <= 0) return 1;
  let count = 1;
  for (let cursor = start; compareLocalDates(cursor, end) < 0; cursor = addLocalDays(cursor, 7)) {
    count += 1;
  }
  return count;
}
