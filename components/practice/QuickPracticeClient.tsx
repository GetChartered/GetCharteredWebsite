"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ModuleSelector } from "@/components/practice/ModuleSelector";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { PracticeSummary } from "@/components/practice/PracticeSummary";
import { usePracticeRunner } from "@/hooks/usePracticeRunner";
import { useExamModules } from "@/hooks/useExamModules";
import { useState } from "react";

export function QuickPracticeClient() {
  const { loading: modulesLoading, exams, error: modulesError, retry } = useExamModules();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectionInitialised, setSelectionInitialised] = useState(false);

  // Default to "all modules" the first time the exam tree loads.
  if (!selectionInitialised && exams.length > 0) {
    setSelectionInitialised(true);
    setSelectedModules(exams.flatMap((exam) => exam.modules.map((m) => m.code)));
  }

  const runner = usePracticeRunner({ mode: "quick_practice", numQuestions: 10 });

  if (modulesLoading || runner.step === "loading-questions") {
    return (
      <div
        className="card"
        style={{
          padding: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-tint)" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          {modulesLoading ? "Loading modules…" : "Preparing your questions…"}
        </p>
      </div>
    );
  }

  if (runner.step === "idle") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-display" style={{ textAlign: "center", marginBottom: 8 }}>
          Quick Practice
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--color-text-secondary)",
            marginBottom: 24,
          }}
        >
          A mixed set of 10 questions across the modules you choose.
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
          />
        )}
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

  // runner.step === "summary"
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <PracticeSummary
        questions={runner.questions}
        answers={runner.answers}
        saveStatus={runner.saveStatus}
        onRestart={runner.restart}
        flaggedIds={runner.flaggedIds}
        onReviewFlagged={runner.startDrill}
        onRevisitMistakes={runner.startDrill}
      />
    </div>
  );
}
