"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addLocalDays,
  parseLocalDate,
  startOfWeekMonday,
} from "@/lib/studyPlanner/calendarUtils";
import type { LocalDateString } from "@/lib/studyPlanner/types";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatWeekRange(weekStart: LocalDateString): string {
  const start = parseLocalDate(weekStart);
  const end = parseLocalDate(addLocalDays(weekStart, 6));
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} ${MONTH_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
}

export function WeekStrip({
  selectedDate,
  today,
  sessionMarkerColors,
  examDateKeys,
  onSelectDate,
}: {
  selectedDate: LocalDateString;
  today: LocalDateString;
  sessionMarkerColors: Map<string, string[]>;
  examDateKeys: Set<string>;
  onSelectDate: (date: LocalDateString) => void;
}) {
  const weekStart = startOfWeekMonday(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => addLocalDays(weekStart, i));

  const shiftWeek = (delta: number) => {
    onSelectDate(addLocalDays(selectedDate, delta * 7));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="planner-week-header">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => shiftWeek(-1)}
          className="planner-week-nav-btn"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="planner-week-label">{formatWeekRange(weekStart)}</span>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => shiftWeek(1)}
          className="planner-week-nav-btn"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="planner-week-grid">
        {days.map((dateKey) => {
          const date = parseLocalDate(dateKey);
          const dayIdx = date.getDay();
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === today;
          const markers = sessionMarkerColors.get(dateKey) ?? [];
          const hasExam = examDateKeys.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={[
                "planner-day-cell",
                isSelected && "planner-day-cell--selected",
                isToday && !isSelected && "planner-day-cell--today",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="planner-day-name">
                {WEEKDAY_LABELS[dayIdx === 0 ? 6 : dayIdx - 1]}
              </span>
              <span className="planner-day-number">{date.getDate()}</span>
              <span className="planner-day-dots">
                {hasExam && <span className="planner-day-dot planner-day-dot--exam" />}
                {markers.slice(0, 3).map((color, i) => (
                  <span
                    key={i}
                    className="planner-day-dot"
                    style={{ backgroundColor: isSelected ? "#fff" : color }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
