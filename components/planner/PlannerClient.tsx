"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { useStudySessions } from "@/hooks/useStudySessions";
import { WeekStrip } from "@/components/planner/WeekStrip";
import { MonthCalendar } from "@/components/planner/MonthCalendar";
import { SessionCard } from "@/components/planner/SessionCard";
import { AddStudySessionModal } from "@/components/planner/AddStudySessionModal";
import { optionForSession } from "@/lib/studyPlanner/activityTypes";
import {
  addLocalDays,
  compareLocalDates,
  parseLocalDate,
  toLocalDateString,
} from "@/lib/studyPlanner/calendarUtils";
import { groupStudySessionsByDay } from "@/lib/studyPlanner/sessionQueries";
import type {
  LocalDateString,
  StudySession,
  StudySessionDraft,
} from "@/lib/studyPlanner/types";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const EMPTY: StudySession[] = [];

function createLocalId() {
  return `study_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatHeading(dateKey: LocalDateString, today: LocalDateString) {
  if (dateKey === today) return "Today";
  const d = parseLocalDate(dateKey);
  return DAY_LABELS[d.getDay()];
}

function formatSubheading(dateKey: LocalDateString, today: LocalDateString) {
  if (dateKey === today) {
    const d = parseLocalDate(dateKey);
    return `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  }
  const d = parseLocalDate(dateKey);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function PlannerClient({
  courseId,
  examOptions,
  moduleOptions,
  examDateByCode,
}: {
  courseId: string;
  examOptions: { code: string; name: string }[];
  moduleOptions: { code: string; name: string }[];
  examDateByCode: Record<string, string>;
}) {
  const router = useRouter();
  const today = toLocalDateString();
  const [selectedDate, setSelectedDate] = useState<LocalDateString>(today);
  const [visibleMonth, setVisibleMonth] = useState<LocalDateString>(today);
  const [view, setView] = useState<"week" | "month">("week");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(
    null,
  );

  const { sessions, loading, createSession, editSession, deleteSession } =
    useStudySessions();

  const visibleSessions = useMemo(
    () =>
      examFilter === "all"
        ? sessions
        : sessions.filter((s) => s.examId === examFilter),
    [sessions, examFilter],
  );
  const sessionsByDay = useMemo(
    () => groupStudySessionsByDay(visibleSessions),
    [visibleSessions],
  );
  const sessionMarkerColors = useMemo(() => {
    const map = new Map<string, string[]>();
    visibleSessions.forEach((session) => {
      const colors = map.get(session.localDate) ?? [];
      map.set(session.localDate, [
        ...colors,
        optionForSession(session).color,
      ]);
    });
    return map;
  }, [visibleSessions]);
  const examDateKeys = useMemo(() => {
    const dates = Object.entries(examDateByCode)
      .filter(([code]) => examFilter === "all" || code === examFilter)
      .map(([, date]) => date);
    return new Set(dates);
  }, [examDateByCode, examFilter]);

  const daySessions = sessionsByDay[selectedDate] ?? EMPTY;
  const plannedSessions = daySessions.filter((s) => s.status === "planned");
  const completedSessions = daySessions.filter((s) => s.status === "completed");
  const moduleLabelByCode = useMemo(
    () => Object.fromEntries(moduleOptions.map((m) => [m.code, m.name])),
    [moduleOptions],
  );

  const openCreate = (date: LocalDateString = selectedDate) => {
    setSelectedDate(date);
    setEditingSession(null);
    setModalOpen(true);
  };
  const openEdit = (session: StudySession) => {
    setEditingSession(session);
    setModalOpen(true);
  };
  const selectDate = (date: LocalDateString) => {
    setSelectedDate(date);
    setVisibleMonth(date);
  };

  const startPractice = (session: StudySession) => {
    const option = optionForSession(session);
    if (option.route) router.push(option.route);
  };

  const save = async (
    draft: StudySessionDraft,
    recurrence: "once" | "daily" | "weekly",
  ) => {
    if (editingSession) {
      await editSession(editingSession, draft);
      return;
    }
    const dates =
      recurrence === "once"
        ? [draft.localDate]
        : expandDates(draft.localDate, recurrence);
    for (const date of dates) {
      await createSession(
        { ...draft, id: undefined, localDate: date },
        { createId: createLocalId },
      );
    }
    selectDate(draft.localDate);
  };

  const isPast = compareLocalDates(selectedDate, today) < 0;

  return (
    <div className="planner-layout">
      {/* ---- Left column: calendar & filters ---- */}
      <div className="card planner-controls-card">
        {examOptions.length > 0 && (
          <div className="planner-exam-filter-row">
            <button
              type="button"
              className={[
                "planner-exam-chip",
                examFilter === "all" && "planner-exam-chip--selected",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setExamFilter("all")}
            >
              All Exams
            </button>
            {examOptions.map((exam) => (
              <button
                key={exam.code}
                type="button"
                className={[
                  "planner-exam-chip",
                  examFilter === exam.code && "planner-exam-chip--selected",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setExamFilter(exam.code)}
              >
                {exam.name}
              </button>
            ))}
          </div>
        )}

        <div className="planner-view-toggle-row">
          {view === "week" ? (
            <WeekStrip
              selectedDate={selectedDate}
              today={today}
              sessionMarkerColors={sessionMarkerColors}
              examDateKeys={examDateKeys}
              onSelectDate={selectDate}
            />
          ) : (
            <MonthCalendar
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              today={today}
              sessionMarkerColors={sessionMarkerColors}
              examDateKeys={examDateKeys}
              onVisibleMonthChange={setVisibleMonth}
              onSelectDate={selectDate}
            />
          )}
          <button
            type="button"
            className="planner-view-btn"
            onClick={() => setView(view === "week" ? "month" : "week")}
          >
            {view === "week" ? (
              <>
                <LayoutGrid size={16} />
                Month view
              </>
            ) : (
              <>
                <CalendarDays size={16} />
                Week view
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---- Right column: day detail ---- */}
      <div className="card planner-day-card">
        <div className="planner-day-header">
          <div>
            <h2 className="planner-day-heading">
              {formatHeading(selectedDate, today)}
            </h2>
            <p className="planner-day-subheading">
              {formatSubheading(selectedDate, today)}
            </p>
          </div>
          {!isPast && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openCreate(selectedDate)}
            >
              <Plus size={16} style={{ marginRight: 6 }} />
              Plan Study
            </Button>
          )}
        </div>

        {loading ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: 14,
            }}
          >
            Loading your plan...
          </p>
        ) : (
          <>
            {plannedSessions.length > 0 && (
              <div className="planner-session-list">
                <span className="planner-session-list-label">
                  {plannedSessions.length === daySessions.length
                    ? "Planned"
                    : "Upcoming"}
                </span>
                {plannedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    moduleLabel={
                      session.moduleId
                        ? moduleLabelByCode[session.moduleId]
                        : undefined
                    }
                    onEdit={() => openEdit(session)}
                    onStartPractice={() => startPractice(session)}
                  />
                ))}
              </div>
            )}

            {completedSessions.length > 0 && (
              <div className="planner-session-list">
                <span className="planner-session-list-label">Completed</span>
                {completedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    moduleLabel={
                      session.moduleId
                        ? moduleLabelByCode[session.moduleId]
                        : undefined
                    }
                    onEdit={() => openEdit(session)}
                  />
                ))}
              </div>
            )}

            {daySessions.length === 0 && (
              <div className="planner-empty-state">
                <div className="planner-empty-icon">
                  <CalendarDays size={22} />
                </div>
                <p className="planner-empty-title">
                  {isPast ? "No study recorded" : "No study planned"}
                </p>
                <p className="planner-empty-desc">
                  {isPast
                    ? "Nothing was recorded for this day."
                    : "Tap 'Plan Study' to schedule a practice session or add personal study time."}
                </p>
                {!isPast && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreate(selectedDate)}
                  >
                    <Plus size={16} style={{ marginRight: 6 }} />
                    Plan Study
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AddStudySessionModal
        open={modalOpen}
        selectedDate={selectedDate}
        courseId={courseId}
        examOptions={examOptions}
        moduleOptions={moduleOptions}
        selectedExamId={examFilter === "all" ? undefined : examFilter}
        editingSession={editingSession}
        onClose={() => setModalOpen(false)}
        onSave={save}
        onDelete={(session) => deleteSession(session.id)}
      />
    </div>
  );
}

function expandDates(
  startDate: LocalDateString,
  recurrence: "daily" | "weekly",
): LocalDateString[] {
  const dates: LocalDateString[] = [];
  const step = recurrence === "daily" ? 1 : 7;
  const count = recurrence === "daily" ? 56 : 8;
  for (let i = 0; i < count; i++) {
    dates.push(addLocalDays(startDate, i * step));
  }
  return dates;
}
