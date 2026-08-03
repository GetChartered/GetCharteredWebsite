"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Home,
  Loader2,
  AlertTriangle,
  Flag,
  RotateCcw,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { PracticeQuestion } from "@/lib/practice/types";
import type { QuestionAnswerResult } from "@/components/practice/QuestionCard";

type SaveStatus = "saving" | "saved" | "error";

type PracticeSummaryProps = {
  questions: PracticeQuestion[];
  answers: Record<string, QuestionAnswerResult>;
  saveStatus: SaveStatus;
  onRestart: () => void;
  /** Overrides the default "Practice complete!" heading. */
  title?: string;
  /** Extra line under the heading — e.g. the module name for Module Practice. */
  subtitle?: string;
  /** True when the session ended because a timer expired (Timed/Mock). */
  timedOut?: boolean;
  /** Shown when the session finished before any timer ran out, e.g. "Completed with 1:23 remaining". */
  timeRemainingLabel?: string;
  /** When set, shows a PASS/FAIL banner comparing the score to this mark (Mock Exam). */
  passMark?: number;
  /** Groups the question list by module and shows a per-module accuracy row (Mock Exam). */
  showModuleBreakdown?: boolean;
  restartLabel?: string;
  exitHref?: string;
  exitLabel?: string;
  /** Questions flagged during the session (usePracticeRunner's flaggedIds). */
  flaggedIds?: Set<string>;
  /** Replays just the flagged questions — pass runner.startDrill. */
  onReviewFlagged?: (questions: PracticeQuestion[]) => void;
  /** Replays just the incorrectly-answered questions — pass runner.startDrill. */
  onRevisitMistakes?: (questions: PracticeQuestion[]) => void;
};

export function PracticeSummary({
  questions,
  answers,
  saveStatus,
  onRestart,
  title,
  subtitle,
  timedOut = false,
  timeRemainingLabel,
  passMark,
  showModuleBreakdown = false,
  restartLabel = "Practice again",
  exitHref = "/practice",
  exitLabel = "Back to Practice",
  flaggedIds,
  onReviewFlagged,
  onRevisitMistakes,
}: PracticeSummaryProps) {
  // Which question rows are expanded to show the full review (question,
  // your answer, correct answer, explanation) — a Set, not a single active
  // id, so multiple can be open at once (matches this codebase's own
  // "several can stay open independently" accordion convention, e.g.
  // ProgressDashboardClient's Coverage list sections). All the data shown
  // when expanded (options, correctKeys, explanation, the user's
  // selectedKeys) is already sitting in the `questions`/`answers` props
  // this component already receives from the live session — nothing new is
  // fetched.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (questionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const total = questions.length;
  const correctCount = questions.filter((q) => answers[q.questionId]?.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = passMark != null ? correctCount >= passMark : null;

  const flaggedQuestions = useMemo(
    () => (flaggedIds ? questions.filter((q) => flaggedIds.has(q.questionId)) : []),
    [questions, flaggedIds]
  );
  const incorrectQuestions = useMemo(
    () => questions.filter((q) => !answers[q.questionId]?.isCorrect),
    [questions, answers]
  );

  const accColor =
    passMark != null
      ? passed
        ? "var(--accent-green)"
        : "var(--accent-red)"
      : accuracy >= 70
        ? "var(--accent-green)"
        : accuracy >= 40
          ? "var(--accent-gold)"
          : "var(--accent-red)";

  const heading = title ?? (timedOut ? "Time's up!" : "Practice complete!");

  const moduleBreakdown = useMemo(() => {
    if (!showModuleBreakdown) return [];
    const map = new Map<string, { correct: number; total: number }>();
    for (const q of questions) {
      const entry = map.get(q.module) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (answers[q.questionId]?.isCorrect) entry.correct += 1;
      map.set(q.module, entry);
    }
    return Array.from(map.entries()).map(([module, stats]) => ({ module, ...stats }));
  }, [showModuleBreakdown, questions, answers]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 20,
        alignItems: "start",
      }}
    >
      <div className="card" style={{ padding: 24, textAlign: "left" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>
          Review your answers
        </h3>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10 }}>
          Tap a question to see the correct answer and explanation.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map((q, i) => {
            const result = answers[q.questionId];
            const correct = result?.isCorrect ?? false;
            const selectedKeys = result?.selectedKeys ?? [];
            const isExpanded = expandedIds.has(q.questionId);

            return (
              <div
                key={q.questionId}
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "var(--color-card-alt)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(q.questionId)}
                  aria-expanded={isExpanded}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {correct ? (
                    <CheckCircle2
                      size={18}
                      style={{ color: "var(--accent-green)", flexShrink: 0, marginTop: 2 }}
                    />
                  ) : (
                    <XCircle
                      size={18}
                      style={{ color: "var(--accent-red)", flexShrink: 0, marginTop: 2 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: isExpanded ? undefined : 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {i + 1}. {q.questionText}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{q.module}</span>
                      {q.topic && (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>· {q.topic}</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{
                      color: "var(--color-text-muted)",
                      flexShrink: 0,
                      marginTop: 2,
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease",
                    }}
                  />
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 14px 14px" }}>
                    {q.scenario && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--color-text-secondary)",
                          fontStyle: "italic",
                          padding: 10,
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-card)",
                          marginBottom: 10,
                        }}
                      >
                        {q.scenario}
                      </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {q.options.map((option) => {
                        const isCorrectKey = q.correctKeys.includes(option.key);
                        const wasSelected = selectedKeys.includes(option.key);
                        const state: "correct" | "incorrect" | "default" = isCorrectKey
                          ? "correct"
                          : wasSelected
                            ? "incorrect"
                            : "default";

                        const borderColor =
                          state === "correct"
                            ? "var(--accent-green)"
                            : state === "incorrect"
                              ? "var(--accent-red)"
                              : "var(--color-border-subtle)";
                        const backgroundColor =
                          state === "correct"
                            ? "rgba(74, 222, 128, 0.1)"
                            : state === "incorrect"
                              ? "rgba(247, 59, 59, 0.08)"
                              : "var(--color-card)";

                        return (
                          <div
                            key={option.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 12px",
                              borderRadius: "var(--radius-md)",
                              border: `2px solid ${borderColor}`,
                              backgroundColor,
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: q.questionType === "multiple_response" ? 5 : 999,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                border: `2px solid ${borderColor}`,
                                backgroundColor:
                                  state === "correct"
                                    ? "var(--accent-green)"
                                    : state === "incorrect"
                                      ? "var(--accent-red)"
                                      : "transparent",
                                color: state === "default" ? "var(--color-text-secondary)" : "#fff",
                              }}
                            >
                              {state === "correct" ? (
                                <Check size={12} />
                              ) : state === "incorrect" ? (
                                <X size={12} />
                              ) : (
                                option.key
                              )}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--color-text)", flex: 1 }}>{option.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border-subtle)",
                        }}
                      >
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>
                          Explanation
                        </p>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <h2 className="text-display" style={{ marginBottom: 4 }}>
          {heading}
        </h2>

        {subtitle && (
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-tint)", marginBottom: 4 }}>
            {subtitle}
          </p>
        )}

        {passMark != null && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: accColor,
              margin: "12px 0 0",
            }}
          >
            {passed ? "PASS" : "FAIL"}
          </p>
        )}

        <p
          style={{
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.1,
            color: accColor,
            margin: "16px 0 4px",
          }}
        >
          {accuracy}%
        </p>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-text-secondary)",
            marginBottom: 4,
          }}
        >
          {correctCount} / {total} correct
          {passMark != null ? ` · pass mark ${passMark}/${total}` : ""}
        </p>

        {(timedOut || timeRemainingLabel) && (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              marginBottom: 4,
            }}
          >
            {timedOut ? "Unanswered questions were marked incorrect." : timeRemainingLabel}
          </p>
        )}

        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          {saveStatus === "saving" && (
            <>
              <Loader2 size={12} className="animate-spin" /> Saving your results…
            </>
          )}
          {saveStatus === "saved" && <>Results saved</>}
          {saveStatus === "error" && (
            <span style={{ color: "var(--accent-red)", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <AlertTriangle size={12} /> Couldn&apos;t save results — they weren&apos;t recorded on your account.
            </span>
          )}
        </p>

        {showModuleBreakdown && moduleBreakdown.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text)",
                textAlign: "left",
                marginBottom: 10,
              }}
            >
              By module
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 8,
              }}
            >
              {moduleBreakdown.map(({ module, correct, total: moduleTotal }) => {
                const moduleAcc = moduleTotal > 0 ? Math.round((correct / moduleTotal) * 100) : 0;
                return (
                  <div
                    key={module}
                    style={{
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: 10,
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>{module}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-tint)" }}>{moduleAcc}%</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {correct}/{moduleTotal}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 320,
            margin: "0 auto",
          }}
        >
          {incorrectQuestions.length > 0 && onRevisitMistakes && (
            <Button
              variant="outline"
              size="lg"
              leftIcon={RotateCcw}
              onClick={() => onRevisitMistakes(incorrectQuestions)}
              fullWidth
            >
              Revisit mistakes ({incorrectQuestions.length})
            </Button>
          )}
          {flaggedQuestions.length > 0 && onReviewFlagged && (
            <Button
              variant="outline"
              size="lg"
              leftIcon={Flag}
              onClick={() => onReviewFlagged(flaggedQuestions)}
              fullWidth
            >
              Review flagged ({flaggedQuestions.length})
            </Button>
          )}
          <Button variant="primary" size="lg" leftIcon={RefreshCw} onClick={onRestart} fullWidth>
            {restartLabel}
          </Button>
        </div>
      </div>

      {/* Deliberately outside both cards, left-aligned to match "Review your
          answers"'s left edge rather than sitting centered among the primary
          action buttons in the right column — this is a way out of the
          summary, not one of the session-driven actions grouped above. */}
      <div style={{ gridColumn: "1 / -1" }}>
        <Link href={exitHref} style={{ textDecoration: "none" }}>
          <Button variant="outline" size="lg" leftIcon={Home}>
            {exitLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
