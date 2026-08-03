"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CoverageBucket } from "@/lib/practice/progressStats";
import type { CoverageTotals } from "@/lib/practice/progressStats";

// A donut, not a stacked bar: this card is the whole-course "zoom out"
// counterpart to the per-module coverage bars below it, and a single ring
// reads as "one syllabus" more immediately than a bar would — the part-of-
// a-whole framing (mastered/reviewing/learning/not-started slices of one
// total) is exactly what a pie/donut is for, and the center label gives a
// natural home for the one headline number ("how much have I touched").
const BUCKET_COLORS: Record<CoverageBucket, string> = {
  notStarted: "#E5E7EB",
  learning: "#93C5FD",
  reviewing: "#2DD4BF",
  mastered: "#009D9E",
};

const BUCKET_LABELS: Record<CoverageBucket, string> = {
  mastered: "Mastered",
  reviewing: "Reviewing",
  learning: "Learning",
  notStarted: "Not Started",
};

const BUCKET_ORDER: CoverageBucket[] = ["mastered", "reviewing", "learning", "notStarted"];

// Matches the fixed pixel size the donut's wrapping <div> is given below
// (width: DONUT_SIZE, height: DONUT_SIZE) — used to tell which half of the
// donut a hovered segment is in.
const DONUT_SIZE = 160;

type Slice = { key: CoverageBucket; label: string; value: number };

function DonutTooltip({
  active,
  payload,
  total,
  coordinate,
}: {
  active?: boolean;
  payload?: Array<{ payload: Slice }>;
  total: number;
  // Injected by recharts (not passed explicitly in JSX below) — the hovered
  // segment's position within the chart's own coordinate space.
  coordinate?: { x: number; y: number };
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;

  // Recharts' default Pie/Donut tooltip positioning lands close enough to
  // the segment's own coordinate that, on a small donut like this one, it
  // overlaps the "touched %" label sitting in the center — there's no
  // "position near the cursor" behavior for polar charts the way Cartesian
  // charts get. Nudging the tooltip further out — right when the hovered
  // segment is in the donut's left half, left when it's in the right half —
  // clears both the segment itself and the center label, and adapts to
  // whichever side is actually hovered rather than sitting in one fixed
  // spot. The nudge distance is roughly the donut's own radius, enough to
  // clear the outer edge regardless of exactly where within the segment's
  // arc recharts placed `coordinate`.
  const hoveredLeftHalf = (coordinate?.x ?? DONUT_SIZE / 2) < DONUT_SIZE / 2;
  const shiftX = hoveredLeftHalf ? 70 : -70;

  return (
    <div
      style={{
        transform: `translateX(${shiftX}px)`,
        background: "var(--color-card)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{d.label}</div>
      <div style={{ color: "var(--color-text-secondary)" }}>
        {d.value} questions · {pct}%
      </div>
    </div>
  );
}

export function CoverageBreakdownChart({ totals, scopeLabel }: { totals: CoverageTotals; scopeLabel: string }) {
  const slices: Slice[] = BUCKET_ORDER.map((key) => ({ key, label: BUCKET_LABELS[key], value: totals[key] })).filter(
    (s) => s.value > 0
  );

  if (totals.total === 0) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 8 }}>
          Coverage breakdown
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Start practising to see how much of the syllabus you&apos;ve covered.
        </p>
      </div>
    );
  }

  const touchedPct = Math.round(((totals.mastered + totals.reviewing + totals.learning) / totals.total) * 100);

  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 className="text-title" style={{ color: "var(--color-text)" }}>
        Coverage breakdown
      </h2>
      {/* Scoped to whichever exam is selected in the Accuracy chart's pills
          above (shared state, lifted to ProgressDashboardClient) — makes it
          visible that this donut just moved, not just a static caption. */}
      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 12px" }}>{scopeLabel}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: DONUT_SIZE, height: DONUT_SIZE, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="62%"
                outerRadius="95%"
                paddingAngle={slices.length > 1 ? 2 : 0}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={BUCKET_COLORS[s.key]} />
                ))}
              </Pie>
              {/* allowEscapeViewBox: DonutTooltip shifts itself well outside
                  the pie's own small viewBox (see its comment) — without
                  this, recharts clips the tooltip back to that viewBox and
                  the shift has no visible effect. */}
              <Tooltip
                content={<DonutTooltip total={totals.total} />}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)" }}>{touchedPct}%</span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>touched</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 140 }}>
          {BUCKET_ORDER.map((key) => {
            const value = totals[key];
            const pct = totals.total > 0 ? Math.round((value / totals.total) * 100) : 0;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: BUCKET_COLORS[key],
                      flexShrink: 0,
                      ...(key === "notStarted" ? { border: "1px solid #D1D5DB" } : {}),
                    }}
                  />
                  {BUCKET_LABELS[key]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                  {value} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
