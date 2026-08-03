"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Play, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui";
import { BrandedLoader } from "@/components/BrandedLoader";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { PracticeSummary } from "@/components/practice/PracticeSummary";
import { usePracticeRunner } from "@/hooks/usePracticeRunner";
import { useExamModules } from "@/hooks/useExamModules";
import { useProgressData } from "@/hooks/useProgressData";
import { rankWeakModules } from "@/lib/practice/weakModules";

const COURSE = "ACA";

export function FocusPracticeClient() {
  const { loading: modulesLoading, exams, error: modulesError } = useExamModules();
  const { loading: progressLoading, data: progressData } = useProgressData();

  const [focusModules, setFocusModules] = useState<string[] | null>(null);
  const [personalised, setPersonalised] = useState(false);

  const runner = usePracticeRunner({ mode: "focus_areas", numQuestions: 10 });

  // Computed once, after both the exam tree and progress data have settled.
  // The random fallback shuffle is an impure operation, so it stays inside
  // this effect; the resulting setState calls are deferred to a microtask
  // (rather than called synchronously at the top of the effect) to avoid the
  // cascading-render footgun React flags for direct setState in an effect.
  useEffect(() => {
    if (modulesLoading || progressLoading || focusModules !== null) return;
    if (exams.length === 0) return;

    void Promise.resolve().then(() => {
      const weak = rankWeakModules(progressData?.moduleStats ?? [], COURSE, 2);
      let codes = weak;
      let isPersonalised = true;

      if (codes.length < 2) {
        const allCodes = exams.flatMap((exam) => exam.modules.map((m) => m.code));
        const remaining = allCodes.filter((c) => !codes.includes(c));
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        codes = [...codes, ...remaining].slice(0, 2);
        isPersonalised = false;
      }

      setPersonalised(isPersonalised);
      setFocusModules(codes);
    });
  }, [modulesLoading, progressLoading, exams, progressData, focusModules]);

  const moduleName = (code: string) => {
    for (const exam of exams) {
      const match = exam.modules.find((m) => m.code === code);
      if (match) return match.name || match.code;
    }
    return code;
  };

  const loading = modulesLoading || progressLoading || focusModules === null;

  if (loading || runner.step === "loading-questions") {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <BrandedLoader
          message={runner.step === "loading-questions" ? "Preparing your questions…" : "Finding your focus areas…"}
        />
      </div>
    );
  }

  if (runner.step === "idle") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-display" style={{ textAlign: "center", marginBottom: 8 }}>
          Focus Areas
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: 24 }}>
          10 questions targeting the modules you need the most work on.
        </p>

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
          </div>
        )}

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 173, 181, 0.12)",
                flexShrink: 0,
              }}
            >
              {personalised ? (
                <TrendingUp size={18} style={{ color: "var(--accent-blue)" }} />
              ) : (
                <Sparkles size={18} style={{ color: "var(--accent-blue)" }} />
              )}
            </div>
            <div>
              <h2 className="text-title" style={{ color: "var(--color-text)" }}>
                {personalised ? "Your weakest areas" : "Getting you started"}
              </h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {personalised
                  ? "These are your weakest areas based on your practice history."
                  : "Practice more to unlock personalised focus areas — for now, here's a mix to get you going."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {(focusModules ?? []).map((code) => (
              <div
                key={code}
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "var(--color-card-alt)",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                  {moduleName(code)}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{code}</p>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            leftIcon={Play}
            onClick={() => void runner.start(focusModules ?? [])}
            disabled={!focusModules || focusModules.length === 0}
            fullWidth
          >
            Start Focus Practice
          </Button>
        </div>
      </div>
    );
  }

  if (runner.step === "in-progress") {
    const current = runner.questions[runner.currentIndex];
    if (!current) return null;
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <QuestionCard
          key={current.questionId}
          question={current}
          questionNumber={runner.currentIndex + 1}
          totalQuestions={runner.questions.length}
          isLast={runner.currentIndex + 1 >= runner.questions.length}
          onAnswered={(result) => runner.handleAnswered(current.questionId, result)}
          onNext={runner.handleNext}
          isFlagged={runner.flaggedIds.has(current.questionId)}
          onToggleFlag={() => runner.toggleFlag(current.questionId)}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <PracticeSummary
        questions={runner.questions}
        answers={runner.answers}
        saveStatus={runner.saveStatus}
        onRestart={runner.restart}
        restartLabel="Practice these areas again"
        flaggedIds={runner.flaggedIds}
        onReviewFlagged={runner.startDrill}
        onRevisitMistakes={runner.startDrill}
      />
    </div>
  );
}
