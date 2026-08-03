"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /**
   * When true (only meaningful alongside timerSeconds), reaching the end of
   * the fetched question batch loops back to the first question instead of
   * ending the session, as long as the countdown is still running — used by
   * Timed Practice's 5/10-minute presets so the session keeps serving
   * questions until the clock runs out rather than stopping at a fixed
   * count. `numQuestions` is sized for typical pacing, not a worst case, so
   * a low-watermark background refill (see REFILL_WATERMARK below) tops the
   * batch up before it runs out for most sessions; looping back is a safety
   * net for the rare case someone blazes through faster than the refill can
   * keep up, or the selected module is too small to refill from at all. Has
   * no effect during an untimed "Revisit Mistakes"/"Review flagged" drill
   * (startDrill sets timeLeft to null), which always ends normally at the
   * end of its question list.
   */
  loopQuestions?: boolean;
};

// Once fewer than this many unseen questions remain in the fetched batch,
// fetch another `numQuestions`-sized batch in the background so the session
// (usually) never has to fall back to looping. This mirrors the *shape* of
// GetChartered_app's reservoir low-watermark refill (Learning/reservoir.ts),
// but at a much simpler scale: the app refills small batches frequently to
// stay resilient to a flaky mobile connection dropping mid-session; here
// there's no such connection risk, so one big-enough initial fetch plus one
// occasional top-up is the right shape, not a steady drip of small refills.
const REFILL_WATERMARK = 5;

/**
 * Shared session mechanics for every practice mode (Quick, Module, Focus,
 * Timed, Mock): fetch a question batch, track answers, optionally run a
 * countdown timer, and batch-record attempts at the end. Mode-specific
 * concerns (module selection UI, summary decorations) stay in each page's
 * own component — this hook only owns the parts that are identical across
 * all five modes, proven first by Quick Practice.
 */
export function usePracticeRunner(config: PracticeRunnerConfig) {
  const { mode, numQuestions, timerSeconds, loopQuestions } = config;

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
  // Remembered so the low-watermark refill effect below can re-request more
  // questions for the same module selection without the caller passing it
  // again — only meaningful alongside loopQuestions.
  const [activeModules, setActiveModules] = useState<string[]>([]);
  // In-flight guard: refs (not state) so a refill already underway is
  // visible to the effect immediately, without waiting for a re-render.
  const refillingRef = useRef(false);
  // Set once a refill attempt comes back with nothing new (the module is too
  // small to top up from) — stops retrying every question thereafter and
  // leaves handleNext's loop-back as the only fallback for the rest of this
  // session.
  const refillExhaustedRef = useRef(false);

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
        setActiveModules(modules);
        refillingRef.current = false;
        refillExhaustedRef.current = false;
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
    const reachedEnd = currentIndex + 1 >= questions.length;
    if (reachedEnd) {
      // timeLeft (not the static config.timerSeconds) is what's null during
      // an untimed "Revisit Mistakes"/"Review flagged" drill, so gating on
      // it here keeps drills ending normally instead of looping.
      if (loopQuestions && timeLeft !== null && timeLeft > 0) {
        setCurrentIndex(0);
        return;
      }
      // Answering and clicking "Next" are separate user actions with a
      // render in between, so `answers` is already up to date here.
      void finishSession(answers);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, questions.length, finishSession, answers, loopQuestions, timeLeft]);

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
    setActiveModules([]);
    refillingRef.current = false;
    refillExhaustedRef.current = false;
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

  // Low-watermark background refill — the safety net behind loopQuestions'
  // initial batch. Once fewer than REFILL_WATERMARK unseen questions remain
  // (and the clock is still running, which also excludes untimed drills —
  // startDrill sets timeLeft to null), fetch one more `numQuestions`-sized
  // batch in the background and append whatever's genuinely new, so a
  // faster-than-expected run rarely has to fall back to looping. One fetch
  // at a time (refillingRef) and it gives up retrying for the rest of the
  // session once a fetch comes back with nothing new to add
  // (refillExhaustedRef) — a small module has no more fresh content to
  // offer, and looping is the correct fallback from then on, not repeated
  // network calls that would keep coming back empty.
  useEffect(() => {
    if (step !== "in-progress" || !loopQuestions) return;
    const clockRunning = timeLeft !== null && timeLeft > 0;
    if (!clockRunning) return;
    if (refillingRef.current || refillExhaustedRef.current) return;
    if (questions.length - (currentIndex + 1) >= REFILL_WATERMARK) return;
    if (activeModules.length === 0) return;

    refillingRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/practice/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modules: activeModules, mode, numQuestions }),
        });
        const data = await res.json().catch(() => null);
        const parsed = res.ok && data ? (data as StartSessionResponse) : null;

        if (parsed) {
          setQuestions((prev) => {
            const seen = new Set(prev.map((q) => q.questionId));
            const fresh = parsed.questions.filter((q) => !seen.has(q.questionId));
            if (fresh.length === 0) {
              refillExhaustedRef.current = true;
              return prev;
            }
            return [...prev, ...fresh];
          });
        } else {
          // A failed refill fetch isn't itself proof the module is
          // exhausted (could be a transient network error), but retrying
          // every subsequent question would be its own kind of unnecessary
          // network usage — looping is a perfectly good fallback here too.
          refillExhaustedRef.current = true;
        }
      } catch {
        refillExhaustedRef.current = true;
      } finally {
        refillingRef.current = false;
      }
    })();
  }, [step, loopQuestions, timeLeft, questions.length, currentIndex, activeModules, mode, numQuestions]);

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
