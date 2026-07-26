"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuestionAnswerResult } from "@/components/practice/QuestionCard";
import type {
  AttemptPayload,
  BackendPracticeMode,
  PracticeQuestion,
  StartSessionResponse,
} from "@/lib/practice/types";

export type RunnerStep = "idle" | "loading-questions" | "in-progress" | "summary";
export type SaveStatus = "saving" | "saved" | "error";

export type PracticeRunnerConfig = {
  mode: BackendPracticeMode;
  numQuestions: number;
  /** When set, the session auto-ends when this many seconds elapse. */
  timerSeconds?: number;
};

/**
 * Shared session mechanics for every practice mode (Quick, Module, Focus,
 * Timed, Mock): fetch a question batch, track answers, optionally run a
 * countdown timer, and batch-record attempts at the end. Mode-specific
 * concerns (module selection UI, summary decorations) stay in each page's
 * own component — this hook only owns the parts that are identical across
 * all five modes, proven first by Quick Practice.
 */
export function usePracticeRunner(config: PracticeRunnerConfig) {
  const { mode, numQuestions, timerSeconds } = config;

  const [step, setStep] = useState<RunnerStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerResult>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving");
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds ?? null);
  const [timedOut, setTimedOut] = useState(false);
  // Per-session, not persisted — matches GetChartered_app's flag behaviour
  // (flags reset on a fresh session, never saved anywhere durable).
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  // True while running a "Revisit Mistakes" / "Review flagged" drill
  // (see startDrill) — untimed regardless of the mode's normal timerSeconds.
  const [isDrill, setIsDrill] = useState(false);

  const start = useCallback(
    async (modules: string[]) => {
      setStep("loading-questions");
      setError(null);
      try {
        const res = await fetch("/api/practice/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modules, mode, numQuestions }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          setError(
            (data && typeof data.error === "string" && data.error) ||
              "Couldn't start a practice session. Please try again."
          );
          setStep("idle");
          return;
        }

        const parsed = data as StartSessionResponse;
        setSessionId(parsed.sessionId);
        setQuestions(parsed.questions);
        setCurrentIndex(0);
        setAnswers({});
        setFlaggedIds(new Set());
        setIsDrill(false);
        setTimedOut(false);
        setTimeLeft(timerSeconds ?? null);
        setStep("in-progress");
      } catch {
        setError("Couldn't start a practice session. Please try again.");
        setStep("idle");
      }
    },
    [mode, numQuestions, timerSeconds]
  );

  // Replays a specific set of already-known questions (Revisit Mistakes /
  // Review Flagged) without a new /api/practice/start fetch — the questions
  // are already in hand from the session that just finished. Gets a fresh
  // client-side sessionId (nothing server-side validates that a sessionId
  // was minted by a prior /start call — see app/api/practice/start &
  // finish's routes — so this is a legitimate new attempt batch, recorded
  // normally on finish like any other session). Always untimed, regardless
  // of the mode's configured timerSeconds: setting timeLeft to null makes
  // the countdown/auto-expiry effects below no-op, so a drill on a Timed or
  // Mock session never restarts that mode's full countdown.
  const startDrill = useCallback((drillQuestions: PracticeQuestion[]) => {
    setSessionId(crypto.randomUUID());
    setQuestions(drillQuestions);
    setCurrentIndex(0);
    setAnswers({});
    setIsDrill(true);
    setTimedOut(false);
    setTimeLeft(null);
    setStep("in-progress");
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const finishSession = useCallback(
    async (finalAnswers: Record<string, QuestionAnswerResult>) => {
      setAnswers(finalAnswers);
      setStep("summary");
      setSaveStatus("saving");

      if (!sessionId) {
        setSaveStatus("error");
        return;
      }

      const attempts: AttemptPayload[] = questions.map((q) => {
        const result = finalAnswers[q.questionId];
        const isCorrect = result?.isCorrect ?? false;
        return {
          module: q.module,
          questionId: q.questionId,
          isCorrect,
          marksAwarded: isCorrect ? 1 : 0,
          marksAvailable: 1,
          answeredAt: result?.answeredAt ?? Date.now(),
          questionText: q.questionText,
          questionExplanation: q.explanation ?? undefined,
          topic: q.topic ?? undefined,
          timeTaken: result?.timeTakenSec,
        };
      });

      try {
        const res = await fetch("/api/practice/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, mode, attempts }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
        if (!res.ok) {
          console.error("[usePracticeRunner] failed to save attempts", res.status);
        }
      } catch (err) {
        console.error("[usePracticeRunner] failed to save attempts", err);
        setSaveStatus("error");
      }
    },
    [sessionId, questions, mode]
  );

  const handleAnswered = useCallback((questionId: string, result: QuestionAnswerResult) => {
    setAnswers((prev) => ({ ...prev, [questionId]: result }));
  }, []);

  const handleNext = useCallback(() => {
    const isLast = currentIndex + 1 >= questions.length;
    if (isLast) {
      // Answering and clicking "Next" are separate user actions with a
      // render in between, so `answers` is already up to date here.
      void finishSession(answers);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions.length, finishSession, answers]);

  const restart = useCallback(() => {
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setFlaggedIds(new Set());
    setIsDrill(false);
    setError(null);
    setTimedOut(false);
    setTimeLeft(timerSeconds ?? null);
    setStep("idle");
  }, [timerSeconds]);

  // Countdown — recreated each tick, mirroring the mobile app's own timer
  // pattern (GetChartered_app's timedPractice.tsx / mockExam.tsx).
  useEffect(() => {
    if (step !== "in-progress" || timerSeconds == null) return;
    if (timeLeft === null || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => (t === null ? null : t - 1)), 1000);
    return () => clearInterval(id);
  }, [step, timeLeft, timerSeconds]);

  // Auto-end on expiry: unanswered questions count as incorrect, then finish
  // exactly as a normal completion would. The state updates are deferred to
  // a microtask (rather than called synchronously at the top of the effect)
  // to avoid the cascading-render footgun React flags for direct setState
  // calls in an effect body.
  useEffect(() => {
    if (step !== "in-progress" || timerSeconds == null) return;
    if (timeLeft !== 0) return;

    void Promise.resolve().then(() => {
      setTimedOut(true);
      const filled: Record<string, QuestionAnswerResult> = { ...answers };
      for (const q of questions) {
        if (!filled[q.questionId]) {
          filled[q.questionId] = {
            selectedKeys: [],
            isCorrect: false,
            timeTakenSec: 0,
            answeredAt: Date.now(),
          };
        }
      }
      void finishSession(filled);
    });
  }, [timeLeft, step, timerSeconds, answers, questions, finishSession]);

  return {
    step,
    error,
    questions,
    currentIndex,
    answers,
    saveStatus,
    timeLeft,
    timedOut,
    isDrill,
    flaggedIds,
    toggleFlag,
    start,
    startDrill,
    handleAnswered,
    handleNext,
    restart,
  };
}
