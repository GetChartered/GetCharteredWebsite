"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, CalendarPlus, ChevronDown, Percent, Target, TrendingUp } from "lucide-react";
import { Button, StatTile } from "@/components/ui";
import { BrandedLoader } from "@/components/BrandedLoader";
import { useExamModules } from "@/hooks/useExamModules";
import { useExamPrep } from "@/hooks/useExamPrep";
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
import { ExamScopeFilter } from "@/components/progress/ExamScopeFilter";
import { StreakCard } from "@/components/progress/StreakCard";
import { WeeklyActivitySection, type Range } from "@/components/progress/WeeklyActivityChart";
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
          backgroundColor: visual.bg ?? `color-mix(in srgb, ${visual.tint} 20%, var(--color-card))`,
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
  // My Exams — the source of the top-level exam-scope filter's checkbox
  // options (deliberately NOT the full GET /courses exam list; see
  // ExamScopeFilter's own comment on why that's a narrower, intentional
  // scope). examPrepError is deliberately not treated as a page-blocking
  // error: if it fails, myExamCodes below just comes back empty, which
  // means examFilterActive is false and the whole page behaves exactly as
  // it did before this filter existed — graceful degradation rather than a
  // second failure mode blocking a page whose core data (progressError)
  // loaded fine.
  const { examPrep, loading: examPrepLoading } = useExamPrep();
  // Shared between the Accuracy chart's exam pills and the Coverage donut
  // below it — GET /courses (via useExamModules) already gives us the full
  // exam->module mapping (the same one ModuleSelector's accordion groups
  // use), so scoping the donut to a selected exam is pure client-side
  // filtering of data already fetched, not a new backend dependency.
  const [examFilter, setExamFilter] = useState<string>("All");
  // Shared between WeeklyActivitySection and NewVsReviewChart so picking a
  // range in one updates both — see NewVsReviewChart.tsx for how it maps
  // each range onto its own window/tick density.
  const [range, setRange] = useState<Range>("week");

  // Top-level exam-scope filter (ExamScopeFilter, rendered at the top of
  // the page below) — the set of My Exams codes currently checked.
  // Defaults to "every configured exam selected" the first time examPrep
  // finishes loading. Adjusted during render (same pattern MyExamsSection
  // uses to seed its own rows from a backend list exactly once) rather than
  // a useEffect — a setState called synchronously inside an effect body
  // trips this codebase's React Compiler purity lint.
  const [selectedExamCodes, setSelectedExamCodes] = useState<Set<string>>(new Set());
  const [examPrepSeeded, setExamPrepSeeded] = useState(false);
  if (!examPrepSeeded && !examPrepLoading) {
    setExamPrepSeeded(true);
    setSelectedExamCodes(new Set(examPrep.map((e) => e.examCode)));
  }

  const myExamCodes = useMemo(() => new Set(examPrep.map((e) => e.examCode)), [examPrep]);
  // "Active" = the user has actually narrowed the selection away from the
  // full "everything selected" default (including narrowing all the way to
  // nothing) — while everything's selected, every scoped metric below
  // behaves exactly as it did before this filter existed, so there's no
  // visible change just from having My Exams configured.
  const examFilterActive = myExamCodes.size > 0 && selectedExamCodes.size !== myExamCodes.size;
  const scopedExamCodes = examFilterActive ? selectedExamCodes : null;

  const loading = modulesLoading || progressLoading || examPrepLoading;
  const error = modulesError || progressError;

  // The exam list every exam-scoped section below (Accuracy by module's
  // tabs, the Coverage donut, the Coverage list) draws from — narrowed to
  // the top-level filter's selection when active, otherwise the full
  // syllabus exam list exactly as before. Accuracy by module's own
  // single-select tabs then further narrow WITHIN this list (see
  // filteredExams below) — the two filters compose rather than compete.
  const relevantExams = useMemo(
    () => (examFilterActive ? exams.filter((exam) => selectedExamCodes.has(exam.code)) : exams),
    [exams, examFilterActive, selectedExamCodes]
  );

  // If the top-level filter narrows relevantExams away from whatever
  // Accuracy by module's tab is currently pointed at, fall back to "All"
  // rather than silently keeping a tab selected that no longer has a
  // matching section to show. Same "adjust state during render" pattern as
  // the examPrep seeding above — tracks the last-seen selectedExamCodes
  // reference (a new Set every change, per setSelectedExamCodes's
  // immutable-update usage) so this only re-checks when the filter
  // actually changes, not on every unrelated render.
  const [syncedSelectedExamCodes, setSyncedSelectedExamCodes] = useState(selectedExamCodes);
  if (selectedExamCodes !== syncedSelectedExamCodes) {
    setSyncedSelectedExamCodes(selectedExamCodes);
    if (examFilter !== "All" && !relevantExams.some((exam) => exam.code === examFilter)) {
      setExamFilter("All");
    }
  }

  // moduleStats feeds Questions Done, Overall Accuracy, Accuracy by module,
  // and (via coverageTotals/orderedCoverageExams below) the Coverage donut
  // and list — scoping it here once means the top-level exam filter
  // automatically reaches all four without each one needing its own
  // filtering logic. Overall Accuracy specifically can't be recomputed from
  // examBreakdown the way Weekly Activity's score can (examBreakdown has no
  // totalAnswered/totalCorrect — just newCorrect/reviewCorrect/score, no
  // denominator to divide by), so this moduleStats-based scoping is the
  // only structurally sound way to filter it; it happens to also be exactly
  // what Questions Done needs.
  const moduleStats = useMemo(() => {
    const courseFiltered = (progressData?.moduleStats ?? []).filter((m) => m.course === COURSE);
    if (!scopedExamCodes) return courseFiltered;
    return courseFiltered.filter((m) => scopedExamCodes.has(m.module.split("-")[0] ?? m.module));
  }, [progressData, scopedExamCodes]);

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

  // Full syllabus exam names, independent of the top-level filter — used
  // both for the Coverage sections' titles (unchanged) and for
  // ExamScopeFilter's checkbox labels (which need real names for exams the
  // top-level filter itself might currently be narrowing away).
  const examNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    for (const exam of exams) map[exam.code] = exam.name || exam.code;
    return map;
  }, [exams]);

  const accuracyData = useMemo(
    () => buildAccuracyByModule(moduleStats, moduleNameByCode),
    [moduleStats, moduleNameByCode]
  );

  const filteredExams = useMemo(
    () => (examFilter === "All" ? relevantExams : relevantExams.filter((exam) => exam.code === examFilter)),
    [relevantExams, examFilter]
  );

  const coverageTotals = useMemo(() => {
    const moduleCodes = filteredExams.flatMap((exam) => exam.modules.map((m) => m.code));
    return buildCoverageTotals(moduleCodes, moduleStats, moduleQuestionCounts);
  }, [filteredExams, moduleStats, moduleQuestionCounts]);

  const coverageScopeLabel =
    examFilter === "All"
      ? "Whole syllabus, every module combined."
      : `${examFilter} modules only${filteredExams[0]?.name ? ` — ${filteredExams[0].name}` : ""}.`;

  // Coverage list order — the exam matching the Accuracy chart's selected
  // tab moves to the top; "All" leaves the original order alone (there's no
  // single matching section for "All" to promote). ExamCoverageSection
  // itself handles the matching open/close reaction to examFilter — see its
  // own comment.
  const orderedCoverageExams = useMemo(() => {
    if (examFilter === "All") return relevantExams;
    const idx = relevantExams.findIndex((exam) => exam.code === examFilter);
    if (idx <= 0) return relevantExams;
    return [relevantExams[idx], ...relevantExams.slice(0, idx), ...relevantExams.slice(idx + 1)];
  }, [relevantExams, examFilter]);

  if (loading) {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <BrandedLoader message="Loading your progress…" />
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
      <ExamScopeFilter
        examCodes={Array.from(myExamCodes)}
        examNameByCode={examNameByCode}
        selected={selectedExamCodes}
        onChange={setSelectedExamCodes}
      />

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
          // Clickable through to My Exams (app/my-account#my-exams) — that's
          // where the exam/date driving this countdown is actually set, same
          // destination as the "Set up your exams" empty state below.
          <Link href="/my-account#my-exams" style={{ textDecoration: "none" }}>
            <div
              className="card card-hover"
              style={{ padding: 20, textAlign: "center", height: "100%", cursor: "pointer" }}
            >
              <div
                className="rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ width: 44, height: 44, backgroundColor: "var(--accent-green)" + "20" }}
              >
                <Calendar size={20} style={{ color: "var(--accent-green)" }} />
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)" }}>{nextExam.value}</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Next Exam</p>
              {nextExam.caption && (
                <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{nextExam.caption}</p>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/my-account#my-exams" style={{ textDecoration: "none" }}>
            <div
              className="card card-hover"
              style={{ padding: 20, textAlign: "center", height: "100%", cursor: "pointer" }}
            >
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
      <WeeklyActivitySection
        weeklyStats={progressData?.weeklyStats ?? []}
        range={range}
        onRangeChange={setRange}
        examCodes={scopedExamCodes}
      />

      {/* Streak paired above New vs Review as a 2-column row (alignItems:
          "stretch" so StreakCard's height:"100%" actually fills the row —
          both read as similarly-weighted "recent activity" cards rather
          than Streak being a separate full-width block competing with the
          hero chart above it for attention). */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "stretch" }}>
        <StreakCard weeklyStats={progressData?.weeklyStats ?? []} examFilterActive={examFilterActive} />
        <NewVsReviewChart weeklyStats={progressData?.weeklyStats ?? []} range={range} examCodes={scopedExamCodes} />
      </div>

      {/* The remaining two secondary/glanceable charts — same responsive
          `auto-fit, minmax(340px, 1fr)` idiom as the row above, naturally
          forming 2 columns on wide viewports and collapsing to 1 on narrow
          ones. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
        <AccuracyByModuleChart
          data={accuracyData}
          exams={relevantExams}
          examFilter={examFilter}
          onExamFilterChange={setExamFilter}
        />
        <CoverageBreakdownChart totals={coverageTotals} scopeLabel={coverageScopeLabel} />
      </div>

      {/* Coverage — matches GetChartered_app's ModuleCoverageCard title
          exactly. Exams are grouped into collapsible <details>/<summary>
          accordions (same pattern as ModuleSelector's exam groups /
          FaqAccordion). Sections can still be manually opened/closed
          independently of each other — collapsing one to scan another
          doesn't hide a third you already had open — but selecting a tab in
          Accuracy by module now overrides that: the matching section jumps
          to the top and opens, every other section closes, same shared
          examFilter state Accuracy by module and the Coverage donut above
          already use (see ExamCoverageSection's own comment for how). */}
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
          {orderedCoverageExams.map((exam, i) => (
            <ExamCoverageSection
              key={exam.code}
              exam={exam}
              moduleStats={moduleStats}
              moduleQuestionCounts={moduleQuestionCounts}
              defaultOpen={i === 0}
              examFilter={examFilter}
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
  examFilter,
}: {
  exam: PracticeExamGroup;
  moduleStats: ModuleStat[];
  moduleQuestionCounts: Record<string, number>;
  defaultOpen: boolean;
  /** Selected tab from Accuracy by module (shared state, lifted to
   *  ProgressDashboardClient — same value CoverageBreakdownChart's scope
   *  already reacts to). When it changes to a specific exam code, this
   *  section force-opens if it's the match and force-closes otherwise;
   *  switching back to "All" reverts every section to its own
   *  defaultOpen. Manual toggling (the summary onClick below) still works
   *  normally in between filter changes. */
  examFilter: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Adjust state during render (same pattern AccuracyByModuleChart uses for
  // its own examFilter-driven reset) rather than a useEffect — a setState
  // called synchronously inside an effect body trips this codebase's React
  // Compiler purity lint, since it causes an extra cascading render.
  const [syncedFilter, setSyncedFilter] = useState(examFilter);
  if (examFilter !== syncedFilter) {
    setSyncedFilter(examFilter);
    setOpen(examFilter === "All" ? defaultOpen : examFilter === exam.code);
  }

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
