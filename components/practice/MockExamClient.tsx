"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ExamPicker } from "@/components/practice/ExamPicker";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { PracticeSummary } from "@/components/practice/PracticeSummary";
import { usePracticeRunner } from "@/hooks/usePracticeRunner";
import { useExamModules } from "@/hooks/useExamModules";

const NUM_QUESTIONS = 70;
const TIMER_SECONDS = 90 * 60;
const PASS_MARK = 39;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MockExamClient() {
  const { loading: modulesLoading, exams, error: modulesError, retry } = useExamModules();
  const [selectedExamCode, setSelectedExamCode] = useState<string | null>(null);

  const runner = usePracticeRunner({
    mode: "mock",
    numQuestions: NUM_QUESTIONS,
    timerSeconds: TIMER_SECONDS,
  });

  const selectedExam = exams.find((exam) => exam.code === selectedExamCode) ?? null;

  const handleStart = () => {
    if (!selectedExam) return;
    void runner.start(selectedExam.modules.map((m) => m.code));
  };

  if (modulesLoading || runner.step === "loading-questions") {
    return (
      <div
        className="card"
        style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-tint)" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          {modulesLoading ? "Loading exams…" : "Preparing your mock exam…"}
        </p>
      </div>
    );
  }

  if (runner.step === "idle") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-display" style={{ textAlign: "center", marginBottom: 8 }}>
          Mock Exam
        </h1>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: 24 }}>
          Full exam simulation — pick your exam, then it&apos;s 70 questions in 90 minutes.
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
          <ExamPicker
            exams={exams}
            selectedCode={selectedExamCode}
            onChange={setSelectedExamCode}
            onStart={handleStart}
            starting={false}
            numQuestions={NUM_QUESTIONS}
            timerLabel="90 minutes"
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
          isLast={runner.currentIndex + 1 >= runner.questions.length}
          onAnswered={(result) => runner.handleAnswered(current.questionId, result)}
          onNext={runner.handleNext}
          timerLabel={runner.isDrill ? undefined : formatTime(timeLeft)}
          timerUrgent={!runner.isDrill && timeLeft <= 600}
          isFlagged={runner.flaggedIds.has(current.questionId)}
          onToggleFlag={() => runner.toggleFlag(current.questionId)}
        />
      </div>
    );
  }

  const remaining = runner.timeLeft ?? 0;
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <PracticeSummary
        questions={runner.questions}
        answers={runner.answers}
        saveStatus={runner.saveStatus}
        onRestart={runner.restart}
        subtitle={selectedExam ? `${selectedExam.code} · ${selectedExam.name}` : undefined}
        passMark={runner.isDrill ? undefined : PASS_MARK}
        showModuleBreakdown={!runner.isDrill}
        timedOut={!runner.isDrill && runner.timedOut}
        timeRemainingLabel={
          runner.isDrill || runner.timedOut ? undefined : `Completed with ${formatTime(remaining)} remaining`
        }
        restartLabel="Take another mock exam"
        flaggedIds={runner.flaggedIds}
        onReviewFlagged={runner.startDrill}
        onRevisitMistakes={runner.startDrill}
      />
    </div>
  );
}
