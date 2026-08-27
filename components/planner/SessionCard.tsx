"use client";

import {
  Sparkles,
  Puzzle,
  Timer,
  Trophy,
  FileClock,
  NotebookPen,
  Clock3,
  Target,
  Play,
  Check,
  Pencil,
} from "lucide-react";
import { optionForSession } from "@/lib/studyPlanner/activityTypes";
import type { StudySession } from "@/lib/studyPlanner/types";

const ICONS = {
  Sparkles,
  Puzzle,
  Timer,
  Trophy,
  FileClock,
  NotebookPen,
} as const;

function formatRelativeTime(time?: string) {
  if (!time) return "Any time";
  const [hStr, mStr] = time.split(":");
  const hour = Number(hStr);
  const min = Number(mStr);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMin = min > 0 ? `:${mStr}` : "";
  return `${displayHour}${displayMin}${ampm}`;
}

export function SessionCard({
  session,
  moduleLabel,
  onEdit,
  onStartPractice,
}: {
  session: StudySession;
  moduleLabel?: string;
  onEdit: () => void;
  onStartPractice?: () => void;
}) {
  const option = optionForSession(session);
  const Icon = ICONS[option.icon];
  const isCompleted = session.status === "completed";
  const canStart =
    session.source !== "personal_study" && !isCompleted && onStartPractice;
  const goal = session.targetQuestionCount
    ? `${session.targetQuestionCount} questions`
    : `${session.durationMinutes} min`;

  return (
    <div
      className={[
        "planner-session-card",
        isCompleted && "planner-session-card--completed",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="planner-session-accent"
        style={{ backgroundColor: option.color }}
      />
      <div
        className="planner-session-icon"
        style={{ backgroundColor: option.background, color: option.color }}
      >
        <Icon size={20} />
      </div>
      <button type="button" className="planner-session-body" onClick={onEdit}>
        <div className="planner-session-title-row">
          <span className="planner-session-title">{option.label}</span>
          {isCompleted && (
            <Check size={15} color="var(--color-success, #10b981)" />
          )}
        </div>
        {(moduleLabel || session.title !== option.label) && (
          <span className="planner-session-subtitle">
            {moduleLabel ?? session.title}
          </span>
        )}
        <div className="planner-session-meta-row">
          <span className="planner-session-meta-item">
            <Clock3 size={13} />
            {formatRelativeTime(session.startTime)}
          </span>
          <span className="planner-session-meta-item">
            <Target size={13} />
            {goal}
          </span>
        </div>
      </button>
      <div className="planner-session-actions">
        {canStart && (
          <button
            type="button"
            className="planner-session-icon-btn planner-session-icon-btn--primary"
            aria-label="Start practice"
            onClick={onStartPractice}
          >
            <Play size={15} />
          </button>
        )}
        <button
          type="button"
          className="planner-session-icon-btn"
          aria-label="Edit session"
          onClick={onEdit}
        >
          <Pencil size={15} />
        </button>
      </div>
    </div>
  );
}
