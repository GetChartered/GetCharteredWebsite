"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Puzzle,
  Timer,
  Trophy,
  FileClock,
  NotebookPen,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  STUDY_TYPE_OPTIONS,
  optionForSession,
} from "@/lib/studyPlanner/activityTypes";
import {
  compareLocalDates,
  isLocalDateString,
  toLocalDateString,
} from "@/lib/studyPlanner/calendarUtils";
import type {
  LocalDateString,
  LocalTimeString,
  RecurrenceRule,
  StudySession,
  StudySessionDraft,
} from "@/lib/studyPlanner/types";

const ICONS = {
  Sparkles,
  Puzzle,
  Timer,
  Trophy,
  FileClock,
  NotebookPen,
} as const;

type RecurrenceOption = "once" | "daily" | "weekly";

function recurrenceRuleFor(
  option: RecurrenceOption,
): RecurrenceRule | undefined {
  if (option === "daily") return { frequency: "daily", interval: 1 };
  if (option === "weekly") return { frequency: "weekly", interval: 1 };
  return undefined;
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function AddStudySessionModal({
  open,
  selectedDate,
  courseId,
  examOptions,
  moduleOptions,
  selectedExamId,
  editingSession,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  selectedDate: LocalDateString;
  courseId: string;
  examOptions: { code: string; name: string }[];
  moduleOptions: { code: string; name: string }[];
  selectedExamId?: string;
  editingSession?: StudySession | null;
  onClose: () => void;
  onSave: (
    draft: StudySessionDraft,
    recurrence: RecurrenceOption,
  ) => Promise<void>;
  onDelete?: (session: StudySession) => Promise<void>;
}) {
  const initialOption = optionForSession(editingSession);
  const [typeKey, setTypeKey] = useState(initialOption.key);
  const selectedOption = useMemo(
    () => STUDY_TYPE_OPTIONS.find((o) => o.key === typeKey) ?? STUDY_TYPE_OPTIONS[0],
    [typeKey],
  );
  const [title, setTitle] = useState(editingSession?.title ?? initialOption.label);
  const [date, setDate] = useState<LocalDateString>(
    editingSession?.localDate ?? selectedDate,
  );
  const [time, setTime] = useState<string>(editingSession?.startTime ?? "09:00");
  const [duration, setDuration] = useState(
    String(editingSession?.durationMinutes ?? initialOption.defaultDuration),
  );
  const [targetQuestions, setTargetQuestions] = useState(
    String(
      editingSession?.targetQuestionCount ??
        initialOption.targetQuestions ??
        "",
    ),
  );
  const [examId, setExamId] = useState(
    editingSession?.examId ?? selectedExamId ?? "",
  );
  const [moduleId, setModuleId] = useState(editingSession?.moduleId ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceOption>("once");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const option = optionForSession(editingSession);
    setTypeKey(option.key);
    setTitle(editingSession?.title ?? option.label);
    setDate(editingSession?.localDate ?? selectedDate);
    setTime(editingSession?.startTime ?? "09:00");
    setDuration(
      String(editingSession?.durationMinutes ?? option.defaultDuration),
    );
    setTargetQuestions(
      String(editingSession?.targetQuestionCount ?? option.targetQuestions ?? ""),
    );
    setExamId(editingSession?.examId ?? selectedExamId ?? "");
    setModuleId(editingSession?.moduleId ?? "");
    setRecurrence("once");
    setError(null);
  }, [editingSession, open, selectedDate, selectedExamId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const isPersonal = selectedOption.source === "personal_study";
  const showModule = selectedOption.showModule === true;
  const showTarget = selectedOption.showTarget === true;
  const showDuration = selectedOption.showDuration === true;

  const pickType = (key: string) => {
    const option =
      STUDY_TYPE_OPTIONS.find((o) => o.key === key) ?? STUDY_TYPE_OPTIONS[0];
    setTypeKey(key);
    setTitle(option.label);
    setDuration(String(option.defaultDuration));
    setTargetQuestions(String(option.targetQuestions ?? ""));
    setRecurrence(
      option.activityKind === "daily_challenge" ? "daily" : "once",
    );
  };

  const save = async () => {
    if (!isLocalDateString(date)) {
      setError("Use a valid date.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Use a time in HH:MM format.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const derivedStatus =
        editingSession?.status ??
        (isPersonal && compareLocalDates(date, toLocalDateString()) < 0
          ? "completed"
          : "planned");

      await onSave(
        {
          id: editingSession?.id,
          courseId: isPersonal ? "PERSONAL" : courseId,
          examId:
            selectedOption.activityKind === "quick_practice" || isPersonal
              ? undefined
              : examId || undefined,
          moduleId: moduleId || undefined,
          title: title.trim() || selectedOption.label,
          activityType: selectedOption.activityType,
          activityKind: selectedOption.activityKind,
          source: selectedOption.source,
          status: derivedStatus,
          localDate: date,
          startTime: time as LocalTimeString,
          durationMinutes: parsePositiveInteger(
            duration,
            selectedOption.defaultDuration,
          ),
          targetQuestionCount:
            showTarget &&
            (selectedOption.targetQuestions || targetQuestions.trim())
              ? parsePositiveInteger(
                  targetQuestions,
                  selectedOption.targetQuestions ?? 1,
                )
              : undefined,
          completedAt:
            derivedStatus === "completed"
              ? editingSession?.completedAt ?? new Date().toISOString()
              : undefined,
          recurrenceRule: recurrenceRuleFor(recurrence),
        },
        recurrence,
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save study session.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrent = async () => {
    if (!editingSession || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(editingSession);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editingSession ? "Edit study session" : "Plan study session"}
      className="planner-modal-backdrop"
    >
      <div onClick={(e) => e.stopPropagation()} className="planner-modal">
        <div className="planner-modal-header">
          <h2 className="planner-modal-title">
            {editingSession ? "Edit Study" : "Plan Study"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="planner-session-icon-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div className="planner-modal-body">
          <div className="planner-type-grid">
            {STUDY_TYPE_OPTIONS.map((option) => {
              const Icon = ICONS[option.icon];
              const active = option.key === typeKey;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => pickType(option.key)}
                  className={[
                    "planner-type-tile",
                    active && "planner-type-tile--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    active
                      ? {
                          backgroundColor: option.color,
                          borderColor: option.color,
                        }
                      : undefined
                  }
                >
                  <span
                    className="planner-type-tile-icon"
                    style={{
                      backgroundColor: active
                        ? "rgba(255,255,255,0.2)"
                        : option.background,
                      color: active ? "#fff" : option.color,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <span
                    style={{
                      color: active ? "#fff" : "var(--color-text)",
                    }}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="planner-field">
            <span className="planner-field-label">Title</span>
            <input
              className="planner-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedOption.label}
            />
          </label>

          <div className="planner-field-row">
            <label className="planner-field">
              <span className="planner-field-label">Date</span>
              <input
                type="date"
                className="planner-input"
                value={date}
                onChange={(e) =>
                  isLocalDateString(e.target.value) && setDate(e.target.value)
                }
              />
            </label>
            <label className="planner-field">
              <span className="planner-field-label">Time</span>
              <input
                type="time"
                className="planner-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
          </div>

          {!isPersonal &&
            examOptions.length > 0 &&
            selectedOption.activityKind !== "quick_practice" && (
              <label className="planner-field">
                <span className="planner-field-label">Exam</span>
                <select
                  className="planner-input"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                >
                  <option value="">No specific exam</option>
                  {examOptions.map((exam) => (
                    <option key={exam.code} value={exam.code}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

          {showModule && moduleOptions.length > 0 && (
            <label className="planner-field">
              <span className="planner-field-label">Module</span>
              <select
                className="planner-input"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
              >
                <option value="">No specific module</option>
                {moduleOptions.map((mod) => (
                  <option key={mod.code} value={mod.code}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="planner-field-row">
            {showTarget && (
              <label className="planner-field">
                <span className="planner-field-label">Target questions</span>
                <input
                  type="number"
                  min={1}
                  className="planner-input"
                  value={targetQuestions}
                  onChange={(e) => setTargetQuestions(e.target.value)}
                />
              </label>
            )}
            {(showDuration || !showTarget) && (
              <label className="planner-field">
                <span className="planner-field-label">Duration (min)</span>
                <input
                  type="number"
                  min={1}
                  className="planner-input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </label>
            )}
          </div>

          <label className="planner-field">
            <span className="planner-field-label">Repeats</span>
            <select
              className="planner-input"
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as RecurrenceOption)
              }
              disabled={Boolean(editingSession)}
            >
              <option value="once">Just this once</option>
              <option value="daily">Daily for the next 8 weeks</option>
              <option value="weekly">Weekly for the next 8 weeks</option>
            </select>
          </label>

          {error && (
            <p
              style={{
                color: "var(--accent-red)",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div className="planner-modal-footer">
          {editingSession && onDelete ? (
            <button
              type="button"
              className="planner-delete-btn"
              onClick={deleteCurrent}
              disabled={saving}
            >
              <Trash2 size={16} />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" size="md" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={save} disabled={saving}>
              {saving
                ? "Saving..."
                : editingSession
                  ? "Save changes"
                  : "Add to plan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
