"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AccuracyDatum } from "@/lib/practice/progressStats";
import type { PracticeExamGroup } from "@/lib/practice/types";

// Accuracy bands reuse the exact same three coverage-scale hex values used
// everywhere else on this dashboard (Coverage bars/donut: learning=#93C5FD,
// reviewing=#2DD4BF, mastered=#009D9E) rather than a red/green traffic-light
// scheme, which doesn't appear anywhere else in this app's palette. Same
// "under 50 / 50-75 / 75+" split as before, just remapped onto the
// learning->reviewing->mastered progression so "more teal" reads as "more
// accurate" consistently with what those colors already mean on the
// Coverage section. Sort order (weakest at top) still carries most of the
// signal; the band color is a secondary, at-a-glance reinforcement.
function bandColor(accuracy: number): string {
  if (accuracy < 50) return "#93C5FD";
  if (accuracy < 75) return "#2DD4BF";
  return "#009D9E";
}

function AccuracyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AccuracyDatum }> }) {
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
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: "var(--color-text-secondary)" }}>
        {d.accuracy}% · {d.totalCorrect}/{d.totalAnswered} correct
      </div>
    </div>
  );
}

const ROW_HEIGHT = 32;
const DEFAULT_LIMIT = 10;
const LABEL_WIDTH = 140;

// Recharts' default YAxis tick wraps long category labels onto a second
// line (its built-in <Text> auto-wrap, triggered once a label doesn't fit
// `width`) rather than truncating — that's what was cramping row spacing
// for names like "Professional Ethics and Conduct". A foreignObject with a
// real HTML div gets proper CSS ellipsis truncation instead, plus a native
// `title` attribute for the full name on hover (no custom tooltip needed).
function ModuleNameTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (x == null || y == null || !payload) return null;
  return (
    <foreignObject x={x - LABEL_WIDTH} y={y - 10} width={LABEL_WIDTH - 8} height={20}>
      <div
        title={payload.value}
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "right",
          lineHeight: "20px",
        }}
      >
        {payload.value}
      </div>
    </foreignObject>
  );
}

export function AccuracyByModuleChart({
  data,
  exams,
  examFilter,
  onExamFilterChange,
}: {
  data: AccuracyDatum[];
  exams: PracticeExamGroup[];
  /** Controlled — shared with the Coverage donut so both move together
   *  (same GET /courses exam->module mapping backs both). */
  examFilter: string;
  onExamFilterChange: (code: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  // Reset the "Show all" expansion when the shared filter changes — the
  // React-docs "adjusting state during render" pattern (not a useEffect:
  // setState synchronously inside an effect body trips this codebase's
  // React Compiler purity lint, since it causes an extra cascading render).
  const [prevExamFilter, setPrevExamFilter] = useState(examFilter);
  if (examFilter !== prevExamFilter) {
    setPrevExamFilter(examFilter);
    setShowAll(false);
  }

  const filtered = useMemo(
    () => (examFilter === "All" ? data : data.filter((d) => d.examCode === examFilter)),
    [data, examFilter]
  );
  const visible = showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  const height = Math.max(160, visible.length * ROW_HEIGHT + 24);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 className="text-title" style={{ color: "var(--color-text)" }}>
          Accuracy by module
        </h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 12px" }}>
        Weakest first — modules you haven&apos;t attempted yet aren&apos;t shown.
      </p>

      {/* Exam filter — same pill style as LeaderboardClient's exam picker. */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["All", ...exams.map((e) => e.code)].map((code) => {
          const isSelected = code === examFilter;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onExamFilterChange(code)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: `2px solid ${isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"}`,
                backgroundColor: isSelected
                  ? "color-mix(in srgb, var(--color-tint) 10%, var(--color-card))"
                  : "var(--color-card)",
                color: isSelected ? "var(--color-tint)" : "var(--color-text)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {code}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {data.length === 0
            ? "Practice a few modules to see how your accuracy compares across them."
            : `No practiced modules in ${examFilter} yet.`}
        </p>
      ) : (
        <>
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visible} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={LABEL_WIDTH}
                  tick={<ModuleNameTick />}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip content={<AccuracyTooltip />} cursor={{ fill: "var(--color-border-subtle)", opacity: 0.4 }} />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {visible.map((d) => (
                    <Cell key={d.module} fill={bandColor(d.accuracy)} />
                  ))}
                  <LabelList
                    dataKey="accuracy"
                    position="right"
                    formatter={(value: string | number | boolean | null | undefined) => `${value}%`}
                    style={{ fontSize: 11, fill: "var(--color-text-secondary)", fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                marginTop: 8,
                border: "none",
                background: "transparent",
                color: "var(--color-tint)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Show all {filtered.length}
            </button>
          )}
        </>
      )}
    </div>
  );
}
