"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { BrandedLoader } from "@/components/BrandedLoader";
import { ModuleSelector } from "@/components/practice/ModuleSelector";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { PracticeSummary } from "@/components/practice/PracticeSummary";
import { usePracticeRunner } from "@/hooks/usePracticeRunner";
import { useExamModules } from "@/hooks/useExamModules";

// The 2-minute preset keeps its original fixed 10-question feel. No fixed
// question count was specified for the two longer presets, so they run
// "unlimited" questions and rely on the clock alone to end the session.
// ASSUMPTION, flagged for confirmation: a fixed 10 questions would make 10
// minutes trivially easy compared to 2, so unlimited felt like the closer
// match to "beat the clock" — but this is a guess, not a confirmed product
// spec.
//
// numQuestions on the unlimited presets is just the INITIAL fetch size, not
// a hard cap — usePracticeRunner's loopQuestions option tops this batch up
// in the background as it runs low (see REFILL_WATERMARK there), so this
// only needs to be "comfortably more than a fast session will get through
// before the first top-up lands", not "more than anyone could ever answer".
// No existing data on real answer pacing exists in this codebase (checked),
// so this is an estimate: ~12 seconds/question is fast but plausible for a
// single-select multiple-choice question (read + click), i.e. 5
// questions/minute, giving 25 for 5 minutes and 50 for 10.
const DURATION_PRESETS = [
  { minutes: 2, seconds: 120, numQuestions: 10, unlimited: false },
  { minutes: 5, seconds: 300, numQuestions: 25, unlimited: true },
  { minutes: 10, seconds: 600, numQuestions: 50, unlimited: true },
] as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TimedPracticeClient() {
  const { loading: modulesLoading, exams, error: modulesError, retry } = useExamModules();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectionInitialised, setSelectionInitialised] = useState(false);
  const [durationIndex, setDurationIndex] = useState(0);

  if (!selectionInitialised && exams.length > 0) {
    setSelectionInitialised(true);
    setSelectedModules(exams.flatMap((exam) => exam.modules.map((m) => m.code)));
  }

  const duration = DURATION_PRESETS[durationIndex];

  const runner = usePracticeRunner({
    mode: "quick_practice",
    numQuestions: duration.numQuestions,
    timerSeconds: duration.seconds,
    loopQuestions: duration.unlimited,
  });

  if (modulesLoading || runner.step === "loading-questions") {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <BrandedLoader message={modulesLoading ? "Loading modules…" : "Preparing your questions…"} />
      </div>
    );
  }

  if (runner.step === "idle") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-display" style={{ textAlign: "center", marginBottom: 8 }}>
          Timed Practice
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: 24 }}>
          Beat the clock — choose your time limit, then answer as many questions as you can across
          the modules you pick.
        </p>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 className="text-title" style={{ color: "var(--color-text)", marginBottom: 4 }}>
            Choose your time limit
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
            {duration.unlimited
              ? "Questions keep coming until the clock runs out."
              : `A fixed set of ${duration.numQuestions} questions to beat.`}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {DURATION_PRESETS.map((preset, index) => {
              const isSelected = index === durationIndex;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => setDurationIndex(index)}
                  aria-pressed={isSelected}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: "14px 8px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${isSelected ? "var(--color-tint)" : "var(--color-border-subtle)"}`,
                    backgroundColor: isSelected
                      ? "color-mix(in srgb, var(--color-tint) 8%, var(--color-card))"
                      : "var(--color-card)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Always mounted (visibility, not conditional render) so its
                      height is reserved either way — otherwise the number/label
                      shift vertically depending on whether this card is selected. */}
                  <Check
                    size={14}
                    style={{ color: "var(--color-tint)", visibility: isSelected ? "visible" : "hidden" }}
                  />
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)" }}>
                    {preset.minutes}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>minutes</span>
                </button>
              );
            })}
          </div>
        </div>

        {(modulesError || runner.error) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(247, 59, 59, 0.08)",
              border: "1px solid var(--accent-red)",
              color: "var(--accent-red)",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{modulesError || runner.error}</span>
            {modulesError && (
              <Button variant="ghost" size="sm" onClick={retry}>
                Retry
              </Button>
            )}
          </div>
        )}

        {exams.length > 0 && (
          <ModuleSelector
            exams={exams}
            selected={selectedModules}
            onChange={setSelectedModules}
            onStart={() => void runner.start(selectedModules)}
            starting={false}
            title="Choose your modules"
            description="Timed Practice mixes questions across whichever modules you pick."
            startLabel="Start Timed Practice"
          />
        )}
      </div>
    );
  }

  if (runner.step === "in-progress") {
    const current = runner.questions[runner.currentIndex];
    if (!current) return null;
    const timeLeft = runner.timeLeft ?? 0;
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <QuestionCard
          key={current.questionId}
          question={current}
          questionNumber={runner.currentIndex + 1}
          totalQuestions={runner.questions.length}
          isLast={!(duration.unlimited && !runner.isDrill) && runner.currentIndex + 1 >= runner.questions.length}
          hideProgress={duration.unlimited && !runner.isDrill}
          onAnswered={(result) => runner.handleAnswered(current.questionId, result)}
          onNext={runner.handleNext}
          timerLabel={runner.isDrill ? undefined : formatTime(timeLeft)}
          timerUrgent={!runner.isDrill && timeLeft <= 20}
          isFlagged={runner.flaggedIds.has(current.questionId)}
          onToggleFlag={() => runner.toggleFlag(current.questionId)}
        />
      </div>
    );
  }

  const remaining = runner.timeLeft ?? 0;
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <PracticeSummary
        questions={runner.questions}
        answers={runner.answers}
        saveStatus={runner.saveStatus}
        onRestart={runner.restart}
        timedOut={!runner.isDrill && runner.timedOut}
        timeRemainingLabel={
          runner.isDrill || runner.timedOut ? undefined : `Completed with ${formatTime(remaining)} remaining`
        }
        flaggedIds={runner.flaggedIds}
        onReviewFlagged={runner.startDrill}
        onRevisitMistakes={runner.startDrill}
      />
    </div>
  );
}
