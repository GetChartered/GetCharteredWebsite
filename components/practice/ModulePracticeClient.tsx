"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ModuleSelector } from "@/components/practice/ModuleSelector";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { PracticeSummary } from "@/components/practice/PracticeSummary";
import { usePracticeRunner } from "@/hooks/usePracticeRunner";
import { useExamModules } from "@/hooks/useExamModules";

export function ModulePracticeClient() {
  const { loading: modulesLoading, exams, error: modulesError, retry } = useExamModules();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const runner = usePracticeRunner({ mode: "module", numQuestions: 10 });

  const moduleName = useMemo(() => {
    const code = selectedModules[0];
    if (!code) return null;
    for (const exam of exams) {
      const match = exam.modules.find((m) => m.code === code);
      if (match) return match.name || match.code;
    }
    return code;
  }, [selectedModules, exams]);

  if (modulesLoading || runner.step === "loading-questions") {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
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
          Module Practice
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: 24 }}>
          Deep dive into a single module — 10 questions, all from that module.
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
            selectionMode="single"
            title="Choose a module"
            description="Pick the one module you want to focus on."
            startLabel="Start Module Practice"
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

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <PracticeSummary
        questions={runner.questions}
        answers={runner.answers}
        saveStatus={runner.saveStatus}
        onRestart={runner.restart}
        subtitle={moduleName ?? undefined}
        restartLabel="Practice this module again"
        flaggedIds={runner.flaggedIds}
        onReviewFlagged={runner.startDrill}
        onRevisitMistakes={runner.startDrill}
      />
    </div>
  );
}
