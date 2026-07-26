"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CalendarPlus, ChevronDown, Loader2, Percent, Target, TrendingUp } from "lucide-react";
import { Button, StatTile } from "@/components/ui";
import { useExamModules } from "@/hooks/useExamModules";
import { useProgressData } from "@/hooks/useProgressData";
import {
  buildAccuracyByModule,
  buildCoverageBarData,
  buildCoverageTotals,
  buildModuleCoverage,
  currentWeek,
  mergeDailyBreakdowns,
  type CoverageBucket,
} from "@/lib/practice/progressStats";
import { getExamVisual } from "@/lib/practice/examVisuals";
import { StreakCard } from "@/components/progress/StreakCard";
import { WeeklyActivitySection } from "@/components/progress/WeeklyActivityChart";
import { AccuracyByModuleChart } from "@/components/progress/AccuracyByModuleChart";
import { CoverageBreakdownChart } from "@/components/progress/CoverageBreakdownChart";
import { NewVsReviewChart } from "@/components/progress/NewVsReviewChart";
import type { NextExamDisplay } from "@/lib/practice/examWindow";
import type { ModuleStat, PracticeExamGroup } from "@/lib/practice/types";

const COURSE = "ACA";

// Exact hex values confirmed directly from GetChartered_app's
// components/progress/ModuleCoverageCard.tsx `COVERAGE_COLORS` constant —
// a superseded prior version of this file mapped these onto the website's
// own green/blue/gold accent vars instead, which was wrong: the app doesn't
// use green for "mastered" or gold for "learning" at all. Kept as local
// hex constants (matching the app's own pattern of a file-local colour
// object) rather than new global CSS vars in globals.css.
const BUCKET_COLORS: Record<CoverageBucket, string> = {
  notStarted: "#E5E7EB",
  learning: "#93C5FD",
  reviewing: "#2DD4BF",
  mastered: "#009D9E",
};

// Ported from the app's barTrack/barSegment: a real stacked bar with visible
// segments, always — including a full "notStarted"-coloured fill for a
// module with zero progress. The previous website version fell through to a
// bare, colourless div in that case, which is the bug this replaces.
function CoverageBar({
  segments,
  barTotal,
}: {
  segments: { key: CoverageBucket; value: number }[];
  barTotal: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: "var(--color-border-subtle)",
      }}
    >
      {segments.map((seg, idx) => (
        <div
          key={seg.key}
          style={{
            width: `${(seg.value / barTotal) * 100}%`,
            height: "100%",
            backgroundColor: BUCKET_COLORS[seg.key],
            marginRight: idx < segments.length - 1 ? 2 : 0,
          }}
        />
      ))}
    </div>
  );
}

function LegendDot({ color, label, outlined = false }: { color: string; label: string; outlined?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-secondary)" }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: color,
          display: "inline-block",
          // "Not Started" (#E5E7EB) is pale grey — needs a visible ring
          // against a light card, matching the app's legendDotOutlined.
          ...(outlined ? { border: "1px solid #D1D5DB" } : {}),
        }}
      />
      {label}
    </span>
  );
}

// Compact card, not a full-width row — several sit side by side in a grid so
// a desktop viewport shows many modules at once. Always visible, no
// accordion — the whole point of this section is glanceable coverage.
function ModuleCoverageCard({
  code,
  name,
  examCode,
  moduleStats,
  moduleQuestionCounts,
}: {
  code: string;
  name: string;
  examCode: string;
  moduleStats: ModuleStat[];
  moduleQuestionCounts: Record<string, number>;
}) {
  const coverage = buildModuleCoverage(code, moduleStats, moduleQuestionCounts);
  const { segments, barTotal, caption } = buildCoverageBarData(coverage);
  const visual = getExamVisual(examCode);
  const Icon = visual.icon;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-subtle)",
        backgroundColor: "var(--color-card-alt)",
        display: "flex",
        gap: 12,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          backgroundColor: visual.tint + "20",
        }}
      >
        <Icon size={18} style={{ color: visual.tint }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={name !== code ? `${name} (${code})` : code}
        >
          {name}
        </p>

        <div style={{ marginTop: 8 }}>
          <CoverageBar segments={segments} barTotal={barTotal} />
        </div>

        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary)",
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}

export function ProgressDashboardClient({ nextExam }: { nextExam: NextExamDisplay }) {
  const { loading: modulesLoading, exams, moduleQuestionCounts, error: modulesError } = useExamModules();
  const { loading: progressLoading, data: progressData, error: progressError, retry } = useProgressData();
  // Shared between the Accuracy chart's exam pills and the Coverage donut
  // below it — GET /courses (via useExamModules) already gives us the full
  // exam->module mapping (the same one ModuleSelector's accordion groups
  // use), so scoping the donut to a selected exam is pure client-side
  // filtering of data already fetched, not a new backend dependency.
  const [examFilter, setExamFilter] = useState<string>("All");

  const loading = modulesLoading || progressLoading;
  const error = modulesError || progressError;

  const moduleStats = useMemo(
    () => (progressData?.moduleStats ?? []).filter((m) => m.course === COURSE),
    [progressData]
  );

  const dailyCounts = useMemo(
    () => mergeDailyBreakdowns(progressData?.weeklyStats ?? []),
    [progressData]
  );

  const thisWeek = useMemo(() => currentWeek(progressData?.weeklyStats ?? []), [progressData]);

  const totalAnswered = useMemo(
    () => moduleStats.reduce((sum, m) => sum + m.totalAnswered, 0),
    [moduleStats]
  );

  const overallAccuracy = useMemo(() => {
    const totalCorrect = moduleStats.reduce((sum, m) => sum + m.totalCorrect, 0);
    return totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  }, [moduleStats, totalAnswered]);

  const moduleNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const exam of exams) {
      for (const m of exam.modules) map[m.code] = m.name || m.code;
    }
    return map;
  }, [exams]);

  const accuracyData = useMemo(
    () => buildAccuracyByModule(moduleStats, moduleNameByCode),
    [moduleStats, moduleNameByCode]
  );

  const filteredExams = useMemo(
    () => (examFilter === "All" ? exams : exams.filter((exam) => exam.code === examFilter)),
    [exams, examFilter]
  );

  const coverageTotals = useMemo(() => {
    const moduleCodes = filteredExams.flatMap((exam) => exam.modules.map((m) => m.code));
    return buildCoverageTotals(moduleCodes, moduleStats, moduleQuestionCounts);
  }, [filteredExams, moduleStats, moduleQuestionCounts]);

  const coverageScopeLabel =
    examFilter === "All"
      ? "Whole syllabus, every module combined."
      : `${examFilter} modules only${filteredExams[0]?.name ? ` — ${filteredExams[0].name}` : ""}.`;

  if (loading) {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-tint)" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading your progress…</p>
      </div>
    );
  }

  if (error && moduleStats.length === 0 && !thisWeek) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <AlertTriangle size={28} style={{ color: "var(--accent-red)", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-text)", marginBottom: 16 }}>{error}</p>
        <Button variant="primary" size="md" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  const hasAnyHistory = moduleStats.length > 0 || Object.keys(dailyCounts).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {!hasAnyHistory && (
        <div
          className="card"
          style={{
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--color-text-secondary)",
          }}
        >
          <TrendingUp size={20} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
          <p style={{ fontSize: 14 }}>
            No practice history yet — complete a session to start building your progress dashboard.
          </p>
        </div>
      )}

      {/* Overall stats — "Questions Done"/"Next Exam" match GetChartered_app's
          StatisticPanel usage in app/(protected)/(tabs)/progress.tsx;
          "Overall Accuracy" is a website-only third tile (the app's own row
          has "Current Streak" here instead, which lives in the richer
          StreakCard further down this page instead of being repeated as a
          plain number too). Next Exam shows a real countdown once the user
          has a primary exam-prep entry (My Exams, app/my-account); until
          then it's a direct "Set up your exams" CTA rather than the old
          target_exam_window bucket estimate — see
          lib/practice/examWindow.ts's doc comment for why that fallback was
          dropped entirely rather than kept as a secondary state. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatTile
          icon={Target}
          label="Questions Done"
          value={String(totalAnswered)}
          color="var(--accent-blue)"
        />
        <StatTile
          icon={Percent}
          label="Overall Accuracy"
          value={`${overallAccuracy}%`}
          color="var(--accent-gold)"
        />
        {nextExam.kind === "countdown" ? (
          <StatTile
            icon={Calendar}
            label="Next Exam"
            value={nextExam.value}
            caption={nextExam.caption}
            color="var(--accent-green)"
          />
        ) : (
          <Link href="/my-account" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: 20, textAlign: "center", height: "100%", cursor: "pointer" }}>
              <div
                className="rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ width: 44, height: 44, backgroundColor: "var(--accent-green)" + "20" }}
              >
                <CalendarPlus size={20} style={{ color: "var(--accent-green)" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-tint)" }}>Set up your exams</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>Next Exam</p>
            </div>
          </Link>
        )}
      </div>

      {/* Weekly activity is the "hero" chart — it already carries its own
          range selector (This week/3mo/6mo/All time), tooltip and Score/
          Correct summary, and is the one chart that actually benefits from
          real width (smoother curve, more legible date labels across a
          many-month "All time" series). Full-width own row rather than
          sharing a column with a secondary chart. */}
      <WeeklyActivitySection weeklyStats={progressData?.weeklyStats ?? []} />

      {/* Streak paired above New vs Review as a 2-column row (alignItems:
          "stretch" so StreakCard's height:"100%" actually fills the row —
          both read as similarly-weighted "recent activity" cards rather
          than Streak being a separate full-width block competing with the
          hero chart above it for attention). */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "stretch" }}>
        <StreakCard weeklyStats={progressData?.weeklyStats ?? []} />
        <NewVsReviewChart weeklyStats={progressData?.weeklyStats ?? []} />
      </div>

      {/* The remaining two secondary/glanceable charts — same responsive
          `auto-fit, minmax(340px, 1fr)` idiom as the row above, naturally
          forming 2 columns on wide viewports and collapsing to 1 on narrow
          ones. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
        <AccuracyByModuleChart
          data={accuracyData}
          exams={exams}
          examFilter={examFilter}
          onExamFilterChange={setExamFilter}
        />
        <CoverageBreakdownChart totals={coverageTotals} scopeLabel={coverageScopeLabel} />
      </div>

      {/* Coverage — matches GetChartered_app's ModuleCoverageCard title
          exactly. Exams are grouped into collapsible <details>/<summary>
          accordions (same pattern as ModuleSelector's exam groups /
          FaqAccordion), but unlike ModuleSelector's single-open-at-a-time
          state, each section tracks its own open/closed state independently
          so several can be open together — collapsing one exam to scan
          another shouldn't hide a third you already had open. */}
      <div>
        <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 8 }}>
          Coverage
        </h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <LegendDot color={BUCKET_COLORS.mastered} label="Mastered" />
          <LegendDot color={BUCKET_COLORS.reviewing} label="Reviewing" />
          <LegendDot color={BUCKET_COLORS.learning} label="Learning" />
          <LegendDot color={BUCKET_COLORS.notStarted} label="Not Started" outlined />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exams.map((exam, i) => (
            <ExamCoverageSection
              key={exam.code}
              exam={exam}
              moduleStats={moduleStats}
              moduleQuestionCounts={moduleQuestionCounts}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamCoverageSection({
  exam,
  moduleStats,
  moduleQuestionCounts,
  defaultOpen,
}: {
  exam: PracticeExamGroup;
  moduleStats: ModuleStat[];
  moduleQuestionCounts: Record<string, number>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const startedCount = exam.modules.filter(
    (m) => (moduleStats.find((s) => s.module === m.code)?.totalAnswered ?? 0) > 0
  ).length;

  return (
    <details open={open} className="card" style={{ padding: "16px 18px" }}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text)", flexShrink: 0 }}>
            {exam.code}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={exam.name}
          >
            {exam.name}
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: startedCount > 0 ? "var(--color-tint)" : "var(--color-text-muted)",
            }}
          >
            {startedCount}/{exam.modules.length} modules started
          </span>
          <ChevronDown
            size={18}
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
              color: "var(--color-text-secondary)",
            }}
          />
        </span>
      </summary>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {exam.modules.map((module) => (
          <ModuleCoverageCard
            key={module.code}
            code={module.code}
            name={module.name || module.code}
            examCode={exam.code}
            moduleStats={moduleStats}
            moduleQuestionCounts={moduleQuestionCounts}
          />
        ))}
      </div>
    </details>
  );
}
