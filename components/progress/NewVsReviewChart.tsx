"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyStat } from "@/lib/practice/types";
import { buildWeekSeries, computeYAxisScale, formatWeekDateLabel, selectEvenLabelIndices } from "@/lib/practice/weeklyActivityChart";

// Fixed "past 12 weeks" window rather than the full range selector the main
// activity chart has (This week / 3mo / 6mo / All time) — a deliberate
// scope call: duplicating that whole selector for a second chart on the
// same dashboard adds real UI weight (another pill control, more state)
// for a chart whose job is just "shape of new-vs-review effort recently",
// not a general-purpose explorer. 12 weeks matches the activity chart's own
// original default range. Revisit if a shorter/longer window is requested.
const WEEKS = 12;

// "New correct" uses the site's tint/accent-blue (no existing bucket owns
// this meaning); "review correct" reuses the exact reviewing-bucket teal
// (#2DD4BF) already established for coverage — so "review" reads as the
// same concept in both charts on this dashboard.
const NEW_COLOR = "#00ADB5";
const REVIEW_COLOR = "#2DD4BF";

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

export function NewVsReviewChart({ weeklyStats }: { weeklyStats: WeeklyStat[] }) {
  const { data, ticks, yMax } = useMemo(() => {
    const weeks = buildWeekSeries(weeklyStats, WEEKS);
    const labelIdx = new Set(selectEvenLabelIndices(weeks.length, 5));
    const { max, ticks } = computeYAxisScale(weeks.map((w) => w.newCorrect + w.reviewCorrect));
    const data: BarDatum[] = weeks.map((w, i) => ({
      index: i,
      newCorrect: w.newCorrect,
      reviewCorrect: w.reviewCorrect,
      xLabel: labelIdx.has(i) ? formatWeekDateLabel(w.weekStartISO) : undefined,
      tooltipDate: formatWeekDateLabel(w.weekStartISO),
    }));
    return { data, ticks, yMax: max };
  }, [weeklyStats]);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 className="text-title" style={{ color: "var(--color-text)" }}>
          New vs review
        </h2>
        <div style={{ display: "flex", gap: 14 }}>
          <LegendDot color={NEW_COLOR} label="New correct" />
          <LegendDot color={REVIEW_COLOR} label="Review correct" />
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 12px" }}>Past 12 weeks</p>

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
                category. `interval={0}` still renders every week as its own
                category (so bar spacing/cursor width is computed for all
                12), while `tickFormatter` returns "" for the ~7 unlabeled
                ones — same sparse-label look as before, correct axis type. */}
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
