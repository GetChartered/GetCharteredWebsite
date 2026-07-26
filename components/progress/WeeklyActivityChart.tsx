"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { WeeklyStat } from "@/lib/practice/types";
import {
  MONTHS_IN_FRAME,
  WEEKS_PAST_3_MONTHS,
  buildAllTimeMonthlySeries,
  buildCurrentWeekDailySeries,
  buildMonthlySeries,
  buildWeekSeries,
  computeYAxisScale,
  formatDayLabel,
  formatFullDate,
  formatMonthFullLabel,
  formatMonthLabel,
  formatWeekDateLabel,
  getCurrentWeekStat,
  selectEvenLabelIndices,
} from "@/lib/practice/weeklyActivityChart";

// Exact brand teals from GetChartered_app's components/progress/
// WeeklyActivityChart.tsx — "the two brand teals given for this chart
// specifically: line/current-dot in the brighter of the two, area fill in
// the deeper one (also used elsewhere in this app as the 'mastered'
// coverage colour)".
const LINE_COLOR = "#0F9BAF";
const FILL_COLOR = "#009D9E";
const FILL_OPACITY = 0.14;
const ACTIVE_TOGGLE_BG = "#526D82";

type Range = "week" | "3m" | "6m" | "all";
type Metric = "score" | "sessions";

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "3m", label: "3 months" },
  { key: "6m", label: "6 months" },
  { key: "all", label: "All time" },
];

type RenderPoint = {
  index: number;
  value: number;
  correct?: number;
  isCurrent: boolean;
  xLabel: string | undefined;
  tooltipDate: string;
};

function CurrentDot(props: { cx?: number; cy?: number; index?: number; payload?: RenderPoint }) {
  const { cx, cy, index, payload } = props;
  if (cx == null || cy == null || !payload?.isCurrent) {
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} fill="none" />;
  }
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={LINE_COLOR} stroke="#fff" strokeWidth={2} />;
}

function ChartTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload: RenderPoint }>;
  metric: Metric;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        fontSize: 12,
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>{point.tooltipDate}</div>
      {metric === "sessions" ? (
        <div style={{ color: "var(--color-text-secondary)" }}>
          {point.value} session{point.value === 1 ? "" : "s"}
        </div>
      ) : (
        <>
          <div style={{ color: LINE_COLOR, fontWeight: 600 }}>Score: {point.value}</div>
          {point.correct != null && (
            <div style={{ color: "var(--color-text-secondary)" }}>Correct: {point.correct}</div>
          )}
        </>
      )}
    </div>
  );
}

export function WeeklyActivitySection({ weeklyStats }: { weeklyStats: WeeklyStat[] }) {
  const [range, setRange] = useState<Range>("week");

  const currentWeekStat = useMemo(() => getCurrentWeekStat(weeklyStats), [weeklyStats]);

  const { points, ticks, yMax, frameLabel, metric, note } = useMemo(() => {
    if (range === "week") {
      const days = buildCurrentWeekDailySeries(weeklyStats);
      const labelIdx = new Set(selectEvenLabelIndices(days.length, days.length));
      const values = days.map((d) => d.sessions);
      const { max, ticks } = computeYAxisScale(values);
      const points: RenderPoint[] = days.map((d, i) => ({
        index: i,
        value: d.sessions,
        isCurrent: d.isCurrent,
        xLabel: labelIdx.has(i) ? formatDayLabel(d.dateISO) : undefined,
        tooltipDate: formatFullDate(d.dateISO),
      }));
      return {
        points,
        ticks,
        yMax: max,
        frameLabel: "This week",
        metric: "sessions" as Metric,
        note: "Daily session counts — per-day score isn't available from the backend, only weekly totals.",
      };
    }

    if (range === "3m") {
      const weeks = buildWeekSeries(weeklyStats, WEEKS_PAST_3_MONTHS);
      const labelIdx = new Set(selectEvenLabelIndices(weeks.length, 5));
      const { max, ticks } = computeYAxisScale(weeks.map((w) => w.score));
      const points: RenderPoint[] = weeks.map((w, i) => ({
        index: i,
        value: w.score,
        correct: w.correct,
        isCurrent: w.isCurrent,
        xLabel: labelIdx.has(i) ? formatWeekDateLabel(w.weekStartISO) : undefined,
        tooltipDate: formatWeekDateLabel(w.weekStartISO),
      }));
      return { points, ticks, yMax: max, frameLabel: "Past 3 months", metric: "score" as Metric, note: undefined };
    }

    if (range === "6m") {
      const months = buildMonthlySeries(weeklyStats, MONTHS_IN_FRAME);
      const labelIdx = new Set(selectEvenLabelIndices(months.length, months.length));
      const { max, ticks } = computeYAxisScale(months.map((m) => m.score));
      const points: RenderPoint[] = months.map((m, i) => ({
        index: i,
        value: m.score,
        correct: m.correct,
        isCurrent: m.isCurrent,
        xLabel: labelIdx.has(i) ? formatMonthLabel(m.monthKey) : undefined,
        tooltipDate: formatMonthFullLabel(m.monthKey),
      }));
      return { points, ticks, yMax: max, frameLabel: "Past 6 months", metric: "score" as Metric, note: undefined };
    }

    const months = buildAllTimeMonthlySeries(weeklyStats);
    const labelIdx = new Set(selectEvenLabelIndices(months.length, 6));
    const { max, ticks } = computeYAxisScale(months.map((m) => m.score));
    const points: RenderPoint[] = months.map((m, i) => ({
      index: i,
      value: m.score,
      correct: m.correct,
      isCurrent: m.isCurrent,
      xLabel: labelIdx.has(i) ? formatMonthLabel(m.monthKey) : undefined,
      tooltipDate: formatMonthFullLabel(m.monthKey),
    }));
    return { points, ticks, yMax: max, frameLabel: "All time", metric: "score" as Metric, note: undefined };
  }, [weeklyStats, range]);

  const labeledIndices = points.filter((p) => p.xLabel != null).map((p) => p.index);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 className="text-title" style={{ color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
          Weekly activity
          {note && (
            <InfoTooltip label="About this chart">{note}</InfoTooltip>
          )}
        </h2>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div style={{ display: "flex", gap: 24, margin: "16px 0 4px" }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-tint)" }}>{currentWeekStat.score}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Score</p>
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>{currentWeekStat.correct}</p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Correct</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 8px" }}>{frameLabel}</p>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis
              dataKey="index"
              type="number"
              domain={[0, Math.max(points.length - 1, 1)]}
              ticks={labeledIndices}
              tickFormatter={(value: number) => points.find((p) => p.index === value)?.xLabel ?? ""}
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
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as unknown as Array<{ payload: RenderPoint }>}
                  metric={metric}
                />
              )}
              cursor={{ stroke: "var(--color-border-subtle)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill={FILL_COLOR}
              fillOpacity={FILL_OPACITY}
              dot={CurrentDot}
              activeDot={{ r: 5, fill: LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RangeToggle({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        borderRadius: 999,
        backgroundColor: "var(--color-border-subtle)",
        padding: 3,
        gap: 2,
      }}
    >
      {RANGE_OPTIONS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              backgroundColor: active ? ACTIVE_TOGGLE_BG : "transparent",
              color: active ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
