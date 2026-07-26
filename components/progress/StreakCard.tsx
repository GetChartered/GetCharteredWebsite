"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { buildCurrentWeekStreakDays, computeStreak, mergeDailyBreakdowns } from "@/lib/practice/progressStats";
import type { WeeklyStat } from "@/lib/practice/types";

/**
 * Visual style ported from GetChartered_app's components/profile/
 * ProfileDailyCard.tsx (title + subtitle, flame pill, day grid) — but the
 * NUMBER and grid are the website's own already-correct backend-driven
 * streak (computeStreak() over WeeklyStat.dailyBreakdown), not the app's
 * device-local AsyncStorage session-count definition. Per the app audit,
 * those are two genuinely different streak definitions computed from
 * different data sources; this only reuses the app's presentation, not its
 * numbers.
 *
 * Grid is 7 days (current week only), not the app's 14 — see
 * buildCurrentWeekStreakDays's doc comment for why day-level data isn't
 * treated as reliable further back than the current week in this codebase.
 *
 * Sized to sit as a square-ish peer of NewVsReviewChart in a 2-column row
 * (padding 24 matches that card exactly; height fills the grid cell via
 * height:"100%" so both stay the same height even though NewVsReviewChart's
 * own content is naturally taller) — centered day grid + a summary line
 * fill that footprint instead of a thin full-width strip.
 */
export function StreakCard({ weeklyStats }: { weeklyStats: WeeklyStat[] }) {
  const streak = useMemo(() => computeStreak(mergeDailyBreakdowns(weeklyStats)), [weeklyStats]);
  const days = useMemo(() => buildCurrentWeekStreakDays(weeklyStats), [weeklyStats]);
  const doneCount = days.filter((d) => d.done).length;

  const streakActive = streak >= 1;
  const streakColor = streakActive ? "var(--accent-gold)" : "var(--color-text)";

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 className="text-title" style={{ color: "var(--color-text)" }}>
            Daily Streak
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
            Keep up the momentum
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-card-alt)",
          }}
        >
          <Flame size={20} style={{ color: streakColor }} fill={streakActive ? streakColor : "transparent"} />
          <span style={{ fontSize: 18, fontWeight: 700, color: streakColor }}>{streak}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
          {days.map((day) => (
            <div key={day.dateISO} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", letterSpacing: 0.5 }}>
                {day.label}
              </span>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: `3px solid ${day.isToday ? "var(--color-tint)" : "transparent"}`,
                  padding: 2,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: day.done ? "var(--accent-green)" : "var(--color-border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: day.done ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    {day.dayNum}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", marginTop: 20 }}>
          {doneCount} of 7 days practiced this week
        </p>
      </div>
    </div>
  );
}
