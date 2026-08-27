// Ported 1:1 from GetChartered_app's StudyPlanner/sessionQueries.ts.
import { compareLocalDates, monthKeyOf, startOfWeekMonday } from "./calendarUtils";
import type { StudySession, StudySessionFilters } from "./types";

function matchesOneOrMany<T extends string>(value: T, filter?: T | T[]) {
  if (filter == null) return true;
  return Array.isArray(filter) ? filter.includes(value) : value === filter;
}

export function filterStudySessions(
  sessions: StudySession[],
  filters: StudySessionFilters = {}
): StudySession[] {
  return sessions.filter((session) => {
    if (filters.courseId && session.courseId !== filters.courseId) return false;
    if (filters.examId && session.examId !== filters.examId) return false;
    if (filters.moduleId && session.moduleId !== filters.moduleId) return false;
    if (!matchesOneOrMany(session.status, filters.status)) return false;
    if (!matchesOneOrMany(session.activityType, filters.activityType)) return false;
    if (filters.fromDate && compareLocalDates(session.localDate, filters.fromDate) < 0) return false;
    if (filters.toDate && compareLocalDates(session.localDate, filters.toDate) > 0) return false;
    return true;
  });
}

export function sortStudySessions(sessions: StudySession[]): StudySession[] {
  return [...sessions].sort((a, b) => {
    const dateOrder = compareLocalDates(a.localDate, b.localDate);
    if (dateOrder !== 0) return dateOrder;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

export function groupStudySessionsByDay(sessions: StudySession[]) {
  return groupByDateKey(sessions, (session) => session.localDate);
}

export function groupStudySessionsByWeek(sessions: StudySession[]) {
  return groupByDateKey(sessions, (session) => startOfWeekMonday(session.localDate));
}

export function groupStudySessionsByMonth(sessions: StudySession[]) {
  return groupByDateKey(sessions, (session) => monthKeyOf(session.localDate));
}

function groupByDateKey(
  sessions: StudySession[],
  getKey: (session: StudySession) => string
): Record<string, StudySession[]> {
  return sortStudySessions(sessions).reduce<Record<string, StudySession[]>>((groups, session) => {
    const key = getKey(session);
    groups[key] = groups[key] ?? [];
    groups[key].push(session);
    return groups;
  }, {});
}

export function findCompletedSessionForPlan(
  planned: StudySession,
  completedSessions: StudySession[]
): StudySession | null {
  return (
    completedSessions.find(
      (session) =>
        session.status === "completed" &&
        session.plannedSessionId === planned.id
    ) ??
    completedSessions.find(
      (session) =>
        session.status === "completed" &&
        session.courseId === planned.courseId &&
        session.examId === planned.examId &&
        session.moduleId === planned.moduleId &&
        session.activityType === planned.activityType &&
        session.localDate === planned.localDate
    ) ??
    null
  );
}
