"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addLocalDays,
  addLocalMonths,
  parseLocalDate,
  startOfWeekMonday,
  toLocalDateString,
} from "@/lib/studyPlanner/calendarUtils";
import type { LocalDateString } from "@/lib/studyPlanner/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  visibleMonth,
  selectedDate,
  today,
  sessionMarkerColors,
  examDateKeys,
  onVisibleMonthChange,
  onSelectDate,
}: {
  visibleMonth: LocalDateString;
  selectedDate: LocalDateString;
  today: LocalDateString;
  sessionMarkerColors: Map<string, string[]>;
  examDateKeys: Set<string>;
  onVisibleMonthChange: (date: LocalDateString) => void;
  onSelectDate: (date: LocalDateString) => void;
}) {
  const monthAnchor = parseLocalDate(visibleMonth);
  const monthStart = toLocalDateString(
    new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1),
  );
  const gridStart = startOfWeekMonday(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addLocalDays(gridStart, i));
  const monthLabel = monthAnchor.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="planner-month-calendar">
      <div className="planner-month-header">
        <span className="planner-month-title">{monthLabel}</span>
        <div className="planner-month-nav">
          <button
            type="button"
            aria-label="Previous month"
            className="planner-week-nav-btn"
            onClick={() => onVisibleMonthChange(addLocalMonths(visibleMonth, -1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="planner-week-nav-btn"
            onClick={() => onVisibleMonthChange(addLocalMonths(visibleMonth, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="planner-month-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="planner-month-weekday-label">
            {label}
          </span>
        ))}
      </div>

      <div className="planner-month-grid">
        {days.map((dateKey) => {
          const date = parseLocalDate(dateKey);
          const inMonth = date.getMonth() === monthAnchor.getMonth();
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
                "planner-month-cell",
                isSelected && "planner-month-cell--selected",
                isToday && !isSelected && "planner-month-cell--today",
                !inMonth && "planner-month-cell--dim",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{date.getDate()}</span>
              {(hasExam || markers.length > 0) && (
                <span className="planner-day-dots">
                  {hasExam && <span className="planner-day-dot planner-day-dot--exam" />}
                  {markers.slice(0, 3).map((color, i) => (
                    <span
                      key={i}
                      className="planner-day-dot"
                      style={{
                        backgroundColor: isSelected ? "#fff" : color,
                      }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="planner-today-link"
        onClick={() => {
          onVisibleMonthChange(today);
          onSelectDate(today);
        }}
      >
        Jump to today
      </button>
    </div>
  );
}
