"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import {
  STREAK_WEEKDAY_LABELS,
  buildRecentWeeksStreakDays,
  computeStreak,
  mergeDailyBreakdowns,
} from "@/lib/practice/progressStats";
import type { WeeklyStat } from "@/lib/practice/types";

const WEEKS_BACK = 3;
// Circles are responsive (grid column width), not a fixed px size — capped
// at CIRCLE_MAX so they read as comfortable/large on this card's real
// rendered width instead of tiny and pinned to one side (the previous fixed
// 40px/14px-gap row nearly filled the card's *narrowest* possible width —
// the auto-fit minmax(340px,1fr) 2-column row's floor — and then just sat
// stranded with dead space on anything wider, which is most real viewports).
const CIRCLE_MAX = 52;
const CIRCLE_GAP = 14;
// Reserved column width for the per-week "X/7" badge to the right of each
// row (see WEEK_SUMMARY_WIDTH usage below) — the weekday header row reserves
// the same width in an empty spacer so its 7 columns line up exactly with
// the circles beneath them.
const WEEK_SUMMARY_WIDTH = 40;

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
 * Grid is 3 weeks (this week + the 2 immediately before it, oldest row on
 * top, current week on the bottom) — see buildRecentWeeksStreakDays.
 *
 * Each week row is `[7-column day grid] [X/7 badge]`: the day grid is
 * `flex: 1`, so it actually fills whatever width this card has (rather than
 * a fixed-size cluster of circles sitting off to one side with a dead
 * margin next to it), and each circle is capped at CIRCLE_MAX rather than
 * literally stretching to fill — the extra room becomes comfortable
 * breathing space between circles instead of oversized circles. The
 * X/7 badge uses the freed-up space on the right meaningfully (per-week
 * completion at a glance) rather than leaving it empty or just re-centering
 * the old small grid.
 */
export function StreakCard({
  weeklyStats,
  examFilterActive,
}: {
  weeklyStats: WeeklyStat[];
  /** True when the top-level exam-scope filter is narrowing the rest of the
   *  dashboard. This card deliberately ignores it — streak reflects overall
   *  practice habit, not exam-specific mastery — so it's the one place on
   *  the page that shows a caption explaining why it *didn't* move when
   *  everything else did. Optional/defaults to false so existing callers
   *  (tests, etc.) that don't pass it still render the same as before. */
  examFilterActive?: boolean;
}) {
  const streak = useMemo(() => computeStreak(mergeDailyBreakdowns(weeklyStats)), [weeklyStats]);
  const weeks = useMemo(() => buildRecentWeeksStreakDays(weeklyStats, WEEKS_BACK), [weeklyStats]);

  const totalDays = weeks.reduce((sum, week) => sum + week.length, 0);
  const doneCount = weeks.reduce((sum, week) => sum + week.filter((d) => d.done).length, 0);

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
          {examFilterActive && (
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              Not filtered by exam — reflects all practice
            </p>
          )}
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: CIRCLE_GAP, flex: 1 }}>
            {STREAK_WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Spacer matching the X/7 badge column below, so the 7 day
              columns stay aligned between the header and every week row. */}
          <div style={{ width: WEEK_SUMMARY_WIDTH, flexShrink: 0 }} />
        </div>

        {weeks.map((week, weekIndex) => {
          const weekDone = week.filter((d) => d.done).length;
          return (
            <div key={weekIndex} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: CIRCLE_GAP, flex: 1 }}>
                {week.map((day) => (
                  <div key={day.dateISO} style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        width: `min(100%, ${CIRCLE_MAX}px)`,
                        aspectRatio: "1",
                        borderRadius: "50%",
                        border: `3px solid ${day.isToday ? "var(--color-tint)" : "transparent"}`,
                        padding: 2,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                            fontSize: 13,
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
              <span
                style={{
                  width: WEEK_SUMMARY_WIDTH,
                  flexShrink: 0,
                  textAlign: "right",
                  fontSize: 13,
                  fontWeight: 600,
                  color: weekDone > 0 ? "var(--color-text)" : "var(--color-text-muted)",
                }}
              >
                {weekDone}/7
              </span>
            </div>
          );
        })}

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
          {doneCount} of {totalDays} days practiced in the past {WEEKS_BACK} weeks
        </p>
      </div>
    </div>
  );
}
