"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, ArrowRight, Flag, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { PracticeToolbar } from "@/components/practice/PracticeToolbar";
import { usePracticePreferences } from "@/hooks/usePracticePreferences";
import type { PracticeQuestion } from "@/lib/practice/types";

export type QuestionAnswerResult = {
  selectedKeys: string[];
  isCorrect: boolean;
  timeTakenSec: number;
  answeredAt: number;
};

type QuestionCardProps = {
  question: PracticeQuestion;
  questionNumber: number;
  totalQuestions: number;
  isLast: boolean;
  onAnswered: (result: QuestionAnswerResult) => void;
  onNext: () => void;
  /** Formatted countdown (e.g. "1:23"), shown in the header when set (Timed/Mock). */
  timerLabel?: string;
  /** Styles the timer red once time is running low. */
  timerUrgent?: boolean;
  /** Session-only, not persisted — matches GetChartered_app's flag behavior. */
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  /**
   * Hides "of {totalQuestions}" and the progress bar — for Timed Practice's
   * unlimited-question presets, where totalQuestions is really just the
   * size of the internally pre-fetched batch, not a real session target.
   */
  hideProgress?: boolean;
};

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((k) => setB.has(k));
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  isLast,
  onAnswered,
  onNext,
  timerLabel,
  timerUrgent = false,
  isFlagged = false,
  onToggleFlag,
  hideProgress = false,
}: QuestionCardProps) {
  const prefs = usePracticePreferences();
  // Lazy initializer — computed once per mount. QuestionCard remounts per
  // question (key={question.questionId} at every call site), so this
  // reshuffles exactly once per question rather than on every re-render.
  const [displayOptions] = useState(() =>
    prefs.shuffleOrder ? shuffled(question.options) : question.options
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Stamped in an effect (not during render, which must stay pure) — this
  // component remounts per question via `key={question.questionId}`, so the
  // effect fires once per question.
  const shownAtRef = useRef<number | null>(null);
  useEffect(() => {
    shownAtRef.current = Date.now();
  }, []);

  const isMultiSelect = question.questionType === "multiple_response";
  const canSubmit = isMultiSelect && selectedKeys.length === question.selectCount;

  const grade = (keys: string[]) => {
    const correct = arraysEqualAsSets(keys, question.correctKeys);
    setSelectedKeys(keys);
    setAnswered(true);
    setIsCorrect(correct);
    // Only ever invoked from click handlers (never during render), so
    // reading the clock here is safe despite the lint rule's default caution.
    // eslint-disable-next-line react-hooks/purity
    const answeredAt = Date.now();
    const timeTakenSec = shownAtRef.current
      ? Math.max(0, Math.round((answeredAt - shownAtRef.current) / 1000))
      : 0;
    onAnswered({ selectedKeys: keys, isCorrect: correct, timeTakenSec, answeredAt });
  };

  const handleOptionClick = (key: string) => {
    if (answered) return;

    if (!isMultiSelect) {
      grade([key]);
      return;
    }

    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const optionState = (key: string): "default" | "correct" | "incorrect" | "missed" => {
    // "Answer feedback" preference off → skip the correct/incorrect
    // highlighting on the options themselves; the Correct/Incorrect banner
    // below still always shows.
    if (!answered || !prefs.showCorrectFlash) return "default";
    const isCorrectKey = question.correctKeys.includes(key);
    const wasSelected = selectedKeys.includes(key);
    if (isCorrectKey) return "correct";
    if (wasSelected && !isCorrectKey) return "incorrect";
    return "default";
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}
      >
        <span
          style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}
        >
          {hideProgress ? `Question ${questionNumber}` : `Question ${questionNumber} of ${totalQuestions}`}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {timerLabel && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                fontWeight: 700,
                color: timerUrgent ? "var(--accent-red)" : "var(--color-text)",
              }}
            >
              <Clock size={14} />
              {timerLabel}
            </span>
          )}
          {question.topic && (
            <span
              className="badge badge-info"
              style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
            >
              <Flag size={11} />
              {question.topic}
            </span>
          )}
          <PracticeToolbar
            taxTableRef={question.taxTableRef}
            isFlagged={isFlagged}
            onToggleFlag={onToggleFlag ?? (() => {})}
            prefs={prefs}
          />
        </div>
      </div>

      {!hideProgress && (
        <div
          style={{
            width: "100%",
            height: 4,
            borderRadius: 999,
            backgroundColor: "var(--color-border-subtle)",
            marginBottom: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((questionNumber - 1) / totalQuestions) * 100}%`,
              height: "100%",
              backgroundColor: "var(--color-tint)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {question.scenario && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-secondary)",
            marginBottom: 16,
            padding: 12,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-card-alt)",
            fontStyle: "italic",
          }}
        >
          {question.scenario}
        </p>
      )}

      <h3
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        {question.questionText}
      </h3>

      {isMultiSelect && !answered && (
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-secondary)",
            marginBottom: 12,
          }}
        >
          Select {question.selectCount} answer{question.selectCount === 1 ? "" : "s"} (
          {selectedKeys.length}/{question.selectCount} selected)
        </p>
      )}

      <div
        style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}
      >
        {displayOptions.map((option) => {
          const state = optionState(option.key);
          const isSelected = selectedKeys.includes(option.key);

          const borderColor =
            state === "correct"
              ? "var(--accent-green)"
              : state === "incorrect"
                ? "var(--accent-red)"
                : isSelected
                  ? "var(--color-tint)"
                  : "var(--color-border-subtle)";

          const backgroundColor =
            state === "correct"
              ? "rgba(74, 222, 128, 0.1)"
              : state === "incorrect"
                ? "rgba(247, 59, 59, 0.08)"
                : isSelected
                  ? "color-mix(in srgb, var(--color-tint) 8%, var(--color-card))"
                  : "var(--color-card)";

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleOptionClick(option.key)}
              disabled={answered}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${borderColor}`,
                backgroundColor,
                cursor: answered ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: isMultiSelect ? 6 : 999,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  border: `2px solid ${borderColor}`,
                  backgroundColor:
                    state === "correct"
                      ? "var(--accent-green)"
                      : state === "incorrect"
                        ? "var(--accent-red)"
                        : isSelected
                          ? "var(--color-tint)"
                          : "transparent",
                  color:
                    state === "correct" || state === "incorrect" || isSelected
                      ? "#fff"
                      : "var(--color-text-secondary)",
                }}
              >
                {state === "correct" ? (
                  <Check size={14} />
                ) : state === "incorrect" ? (
                  <X size={14} />
                ) : (
                  option.key
                )}
              </span>
              <span style={{ fontSize: 14, color: "var(--color-text)", flex: 1 }}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {isMultiSelect && !answered && (
        <Button
          variant="primary"
          size="md"
          onClick={() => grade(selectedKeys)}
          disabled={!canSubmit}
          fullWidth
        >
          Submit answer
        </Button>
      )}

      {answered && (
        <>
          {/* "Answer feedback" preference gates this whole colored banner
              (including the Correct/Incorrect label) — previously only the
              option highlighting respected the toggle while this banner
              always rendered regardless, which was the bug. The
              explanation is independently gated by "Show explanations":
              it still renders (in a neutral, non-colored box) even when
              feedback is off, since hiding it too would silently fold two
              separate preferences into one. */}
          {prefs.showCorrectFlash && (
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                backgroundColor: isCorrect
                  ? "rgba(74, 222, 128, 0.1)"
                  : "rgba(247, 59, 59, 0.08)",
                border: `1px solid ${
                  isCorrect ? "var(--accent-green)" : "var(--accent-red)"
                }`,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: isCorrect ? "var(--accent-green)" : "var(--accent-red)",
                  marginBottom: question.explanation && prefs.showExplanations ? 8 : 0,
                }}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </p>
              {question.explanation && prefs.showExplanations && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {question.explanation}
                </p>
              )}
            </div>
          )}

          {!prefs.showCorrectFlash && question.explanation && prefs.showExplanations && (
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-card-alt)",
                border: "1px solid var(--color-border-subtle)",
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                {question.explanation}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            rightIcon={ArrowRight}
            onClick={onNext}
            fullWidth
          >
            {isLast ? "See results" : "Next question"}
          </Button>
        </>
      )}
    </div>
  );
}
