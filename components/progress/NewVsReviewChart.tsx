"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { Range } from "@/components/progress/WeeklyActivityChart";
import type { WeeklyStat } from "@/lib/practice/types";
import {
  MONTHS_IN_FRAME,
  WEEKS_PAST_3_MONTHS,
  buildAllTimeMonthlySeries,
  buildCurrentWeekNewReviewDailySeries,
  buildMonthlySeries,
  buildWeekSeries,
  computeYAxisScale,
  formatDayLabel,
  formatFullDate,
  formatMonthFullLabel,
  formatMonthLabel,
  formatWeekDateLabel,
  selectEvenLabelIndices,
} from "@/lib/practice/weeklyActivityChart";

// "Correct new questions" uses the same brand teal as WeeklyActivityChart's
// LINE_COLOR (#0F9BAF) — this chart sits directly beside/above that one on
// the Progress dashboard, so matching its teal keeps "new correct" reading
// as the same brand colour across both charts. "Review questions correct"
// is a lighter green (--accent-green, #4ADE80) — a genuinely different hue
// (not another teal/blue shade) so the two stacked bar segments are
// distinguishable at a glance.
const NEW_COLOR = "#0F9BAF";
const REVIEW_COLOR = "#4ADE80";

type BarDatum = {
  index: number;
  newCorrect: number;
  reviewCorrect: number;
  xLabel: string | undefined;
  tooltipDate: string;
};

function StackedTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BarDatum }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        fontSize: 12,
        minWidth: 130,
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>{d.tooltipDate}</div>
      <div style={{ color: NEW_COLOR }}>New correct: {d.newCorrect}</div>
      <div style={{ color: REVIEW_COLOR }}>Review correct: {d.reviewCorrect}</div>
    </div>
  );
}

export function NewVsReviewChart({
  weeklyStats,
  range,
  examCodes,
}: {
  weeklyStats: WeeklyStat[];
  range: Range;
  /** Selected exam codes from the top-level exam-scope filter, or null when
   *  it's inactive. Unlike WeeklyActivitySection's "week" range, this
   *  chart's "week" range CAN be exam-scoped — dailyNewCorrectByExam/
   *  dailyReviewCorrectByExam exist even though there's no session-count
   *  equivalent. */
  examCodes: Set<string> | null;
}) {
  // Mirrors WeeklyActivitySection's own range → data-source switch exactly
  // (same helpers, same tick-density/label-format calls per range), so the
  // two charts' x-axes always agree once the shared `range` changes.
  // "week" is a real Mon-through-today daily breakdown (backed by the
  // backend's dailyNewCorrect/dailyReviewCorrect maps — see
  // buildCurrentWeekNewReviewDailySeries's doc comment), day-labeled the
  // same way WeeklyActivitySection's own "week" view is (formatDayLabel,
  // every day labeled, tooltip via formatFullDate) rather than the earlier
  // single collapsed bar this range used before that data existed.
  const { data, ticks, yMax, frameLabel } = useMemo(() => {
    if (range === "week") {
      const days = buildCurrentWeekNewReviewDailySeries(weeklyStats, undefined, examCodes);
      const labelIdx = new Set(selectEvenLabelIndices(days.length, days.length));
      const { max, ticks } = computeYAxisScale(days.map((d) => d.newCorrect + d.reviewCorrect));
      const data: BarDatum[] = days.map((d, i) => ({
        index: i,
        newCorrect: d.newCorrect,
        reviewCorrect: d.reviewCorrect,
        xLabel: labelIdx.has(i) ? formatDayLabel(d.dateISO) : undefined,
        tooltipDate: formatFullDate(d.dateISO),
      }));
      return { data, ticks, yMax: max, frameLabel: "This week" };
    }

    if (range === "3m") {
      const weeks = buildWeekSeries(weeklyStats, WEEKS_PAST_3_MONTHS, undefined, undefined, examCodes);
      const labelIdx = new Set(selectEvenLabelIndices(weeks.length, 5));
      const { max, ticks } = computeYAxisScale(weeks.map((w) => w.newCorrect + w.reviewCorrect));
      const data: BarDatum[] = weeks.map((w, i) => ({
        index: i,
        newCorrect: w.newCorrect,
        reviewCorrect: w.reviewCorrect,
        xLabel: labelIdx.has(i) ? formatWeekDateLabel(w.weekStartISO) : undefined,
        tooltipDate: formatWeekDateLabel(w.weekStartISO),
      }));
      return { data, ticks, yMax: max, frameLabel: "Past 3 months" };
    }

    if (range === "6m") {
      const months = buildMonthlySeries(weeklyStats, MONTHS_IN_FRAME, undefined, undefined, examCodes);
      const labelIdx = new Set(selectEvenLabelIndices(months.length, months.length));
      const { max, ticks } = computeYAxisScale(months.map((m) => m.newCorrect + m.reviewCorrect));
      const data: BarDatum[] = months.map((m, i) => ({
        index: i,
        newCorrect: m.newCorrect,
        reviewCorrect: m.reviewCorrect,
        xLabel: labelIdx.has(i) ? formatMonthLabel(m.monthKey) : undefined,
        tooltipDate: formatMonthFullLabel(m.monthKey),
      }));
      return { data, ticks, yMax: max, frameLabel: "Past 6 months" };
    }

    const months = buildAllTimeMonthlySeries(weeklyStats, undefined, examCodes);
    const labelIdx = new Set(selectEvenLabelIndices(months.length, 6));
    const { max, ticks } = computeYAxisScale(months.map((m) => m.newCorrect + m.reviewCorrect));
    const data: BarDatum[] = months.map((m, i) => ({
      index: i,
      newCorrect: m.newCorrect,
      reviewCorrect: m.reviewCorrect,
      xLabel: labelIdx.has(i) ? formatMonthLabel(m.monthKey) : undefined,
      tooltipDate: formatMonthFullLabel(m.monthKey),
    }));
    return { data, ticks, yMax: max, frameLabel: "All time" };
  }, [weeklyStats, range, examCodes]);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 className="text-title" style={{ color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
          New vs review correct questions
          <InfoTooltip label="About this chart">
            New = first-time correct answers. Review = correct answers on questions you&apos;ve seen before.
          </InfoTooltip>
        </h2>
        <div style={{ display: "flex", gap: 14 }}>
          <LegendDot color={NEW_COLOR} label="Correct new questions" />
          <LegendDot color={REVIEW_COLOR} label="Review questions correct" />
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 12px" }}>{frameLabel}</p>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
            {/* type="category" (not "number") — this is a BarChart, and a
                numeric axis leaves recharts without a defined category band
                per bar. That's what was causing the cursor-highlight
                rectangle and the last bar/tooltip to misbehave near the
                right edge: with no band width to work from, recharts'
                edge-case sizing went wrong specifically for the final
                category. `interval={0}` still renders every point as its
                own category regardless of range (so bar spacing/cursor
                width is computed for all of them), while `tickFormatter`
                returns "" for whichever ones selectEvenLabelIndices left
                unlabeled — same sparse-label look as before, correct axis
                type. */}
            <XAxis
              dataKey="index"
              type="category"
              interval={0}
              tickFormatter={(value: number) => data.find((d) => d.index === value)?.xLabel ?? ""}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={{ stroke: "var(--color-border-subtle)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, yMax]}
              ticks={ticks}
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip content={<StackedTooltip />} cursor={{ fill: "var(--color-border-subtle)", opacity: 0.4 }} />
            <Bar dataKey="newCorrect" stackId="a" fill={NEW_COLOR} radius={[0, 0, 0, 0]} maxBarSize={22} />
            <Bar dataKey="reviewCorrect" stackId="a" fill={REVIEW_COLOR} radius={[3, 3, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-secondary)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color, display: "inline-block" }} />
      {label}
    </span>
  );
}
