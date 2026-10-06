"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";
import { computeExamPassed, getPassMark, toOutcome } from "@/lib/practice/examResults";
import { EXAM_LEVEL_OPTIONS, resolveExamLevel } from "@/lib/practice/examLevels";
import type { ExamLevel, ExamOutcome } from "@/lib/practice/types";

interface ExamResultModalProps {
  examName: string;
  examCode: string;
  /** The exam's existing scheduled date — shown as "date sat" rather than
   *  re-collected here. Recording a result assumes the user sat the exam on
   *  the date they already registered it for. */
  examDate: string;
  initialGradePercent?: number | null;
  initialExamLevel?: ExamLevel | null;
  initialOutcome?: ExamOutcome | null;
  onClose: () => void;
  /** Returns whether the save succeeded — the modal shows its own error
   *  state and stays open on failure, same pattern as DeleteAccountForm. */
  onSave: (result: {
    gradePercent: number | null;
    examLevel: ExamLevel | null;
    outcome: ExamOutcome | null;
  }) => Promise<boolean>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Add/edit an exam result — opened from MyExamsSection for either a
 * past-dated Upcoming exam ("Add result") or an already-recorded Previous
 * one ("Edit"). Pass/fail is always stored (`outcome`), as it stood on the
 * day: a later pass-mark change must never turn a pass into a fail. The
 * grade is optional; entering one with a level pre-selects Pass or Fail from
 * the current pass mark, which the user can still change. Exam level is an editable dropdown, pre-filled from
 * lib/practice/examLevels.ts's best-effort guess rather than trusted
 * outright — see that file's header comment for why it isn't fully
 * reliable yet.
 */
export function ExamResultModal({
  examName,
  examCode,
  examDate,
  initialGradePercent,
  initialExamLevel,
  initialOutcome,
  onClose,
  onSave,
}: ExamResultModalProps) {
  const [gradeInput, setGradeInput] = useState(
    typeof initialGradePercent === "number" ? String(initialGradePercent) : ""
  );
  const [examLevel, setExamLevel] = useState<ExamLevel | "">(
    initialExamLevel ?? resolveExamLevel(examCode, examName) ?? ""
  );
  // Rows saved before `outcome` existed fall back to the pass mark.
  const [outcome, setOutcome] = useState<ExamOutcome | null>(
initialOutcome === undefined ? toOutcome(computeExamPassed(initialGradePercent, initialExamLevel)) : initialOutcome
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedGrade = gradeInput.trim() === "" ? null : Number(gradeInput);
  const gradeValid =
    parsedGrade !== null && Number.isFinite(parsedGrade) && parsedGrade >= 0 && parsedGrade <= 100;
  const gradeInvalid = parsedGrade !== null && !gradeValid;

  const fromPassMark =
    gradeValid && examLevel !== "" ? computeExamPassed(parsedGrade, examLevel) : null;
  const canSubmit = !gradeInvalid && outcome !== null;

  // A grade + level pre-selects Pass/Fail from the pass mark; the user can
  // still change it afterwards.
  const preselect = (nextGrade: string, nextLevel: ExamLevel | "") => {
    const g = nextGrade.trim() === "" ? null : Number(nextGrade);
    if (g === null || !Number.isFinite(g) || g < 0 || g > 100 || nextLevel === "") return;
    const passed = computeExamPassed(g, nextLevel);
    if (passed !== null) setOutcome(toOutcome(passed));
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const ok = await onSave({
      gradePercent: gradeValid ? parsedGrade : null,
      examLevel: examLevel === "" ? null : examLevel,
      outcome,
    });

    setSubmitting(false);
    if (ok) {
      onClose();
    } else {
      setError("Couldn't save your result — try again.");
    }
  };

  return (
    <PracticeToolModal title="Exam result" onClose={onClose} maxWidth={420}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{examName}</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
          Sat {formatDate(examDate)}
        </p>
      </div>

      <div className="exam-result-field">
        <label htmlFor="exam-result-level">Exam level</label>
        <select
          id="exam-result-level"
          value={examLevel}
          onChange={(e) => {
            const next = e.target.value as ExamLevel | "";
            setExamLevel(next);
            preselect(gradeInput, next);
          }}
          style={{
            height: 44,
            padding: "0 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            fontSize: 14,
          }}
        >
          <option value="">Select level…</option>
          {EXAM_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} (pass at {getPassMark(opt.value)}%)
            </option>
          ))}
        </select>
      </div>

      <div className="exam-result-field">
        <label htmlFor="exam-result-grade">Grade (%) — optional</label>
        <input
          id="exam-result-grade"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          value={gradeInput}
          onChange={(e) => {
            setGradeInput(e.target.value);
            preselect(e.target.value, examLevel);
          }}
          placeholder="0–100"
          style={{
            height: 44,
            padding: "0 14px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${
              gradeInput.trim() !== "" && !gradeValid ? "var(--color-danger)" : "var(--color-border-subtle)"
            }`,
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            fontSize: 14,
          }}
        />
        {gradeInvalid && (
          <span style={{ fontSize: 12, color: "var(--color-danger)" }}>Enter a number between 0 and 100.</span>
        )}
      </div>

      <div className="exam-result-field">
        <span id="exam-result-outcome-label" className="exam-result-field-label">Did you pass?</span>
        <div role="radiogroup" aria-labelledby="exam-result-outcome-label" style={{ display: "flex", gap: 12 }}>
          {(["pass", "fail"] as const).map((value) => {
            const selected = outcome === value;
            const color = value === "pass" ? "var(--accent-green)" : "var(--color-danger)";
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setOutcome(value)}
                style={{
                  flex: 1,
                  height: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${selected ? color : "var(--color-border-subtle)"}`,
                  backgroundColor: selected
                    ? `color-mix(in srgb, ${color} 10%, transparent)`
                    : "var(--color-card)",
                  color: selected ? color : "var(--color-text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {value === "pass" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {value === "pass" ? "Pass" : "Fail"}
              </button>
            );
          })}
        </div>
        {fromPassMark !== null && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {fromPassMark ? "Pass" : "Fail"} at the current pass mark ({getPassMark(examLevel as ExamLevel)}%).
            Change it if your result said otherwise.
          </span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
            color: "var(--color-danger)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <Button variant="outline" size="md" fullWidth onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" size="md" fullWidth onClick={() => void handleSubmit()} disabled={!canSubmit} loading={submitting}>
          Save result
        </Button>
      </div>
    </PracticeToolModal>
  );
}
