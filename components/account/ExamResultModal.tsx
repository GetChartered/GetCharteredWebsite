"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { PracticeToolModal } from "@/components/practice/PracticeToolModal";
import { computeExamPassed, getPassMark } from "@/lib/practice/examResults";
import { EXAM_LEVEL_OPTIONS, resolveExamLevel } from "@/lib/practice/examLevels";
import type { ExamLevel } from "@/lib/practice/types";

interface ExamResultModalProps {
  examName: string;
  examCode: string;
  /** The exam's existing scheduled date — shown as "date sat" rather than
   *  re-collected here. Recording a result assumes the user sat the exam on
   *  the date they already registered it for. */
  examDate: string;
  initialGradePercent?: number | null;
  initialExamLevel?: ExamLevel | null;
  onClose: () => void;
  /** Returns whether the save succeeded — the modal shows its own error
   *  state and stays open on failure, same pattern as DeleteAccountForm. */
  onSave: (result: { gradePercent: number; examLevel: ExamLevel }) => Promise<boolean>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Add/edit an exam result — opened from MyExamsSection for either a
 * past-dated Upcoming exam ("Add result") or an already-recorded Previous
 * one ("Edit"). Exam level is always an editable dropdown, pre-filled from
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
  onClose,
  onSave,
}: ExamResultModalProps) {
  const [gradeInput, setGradeInput] = useState(
    typeof initialGradePercent === "number" ? String(initialGradePercent) : ""
  );
  const [examLevel, setExamLevel] = useState<ExamLevel | "">(
    initialExamLevel ?? resolveExamLevel(examCode, examName) ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedGrade = gradeInput.trim() === "" ? null : Number(gradeInput);
  const gradeValid =
    parsedGrade !== null && Number.isFinite(parsedGrade) && parsedGrade >= 0 && parsedGrade <= 100;
  const canSubmit = gradeValid && examLevel !== "";

  const previewPassed =
    gradeValid && examLevel !== "" ? computeExamPassed(parsedGrade, examLevel) : null;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const ok = await onSave({ gradePercent: parsedGrade as number, examLevel: examLevel as ExamLevel });

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
          onChange={(e) => setExamLevel(e.target.value as ExamLevel | "")}
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
        <label htmlFor="exam-result-grade">Grade (%)</label>
        <input
          id="exam-result-grade"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          value={gradeInput}
          onChange={(e) => setGradeInput(e.target.value)}
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
        {gradeInput.trim() !== "" && !gradeValid && (
          <span style={{ fontSize: 12, color: "var(--color-danger)" }}>Enter a number between 0 and 100.</span>
        )}
      </div>

      {previewPassed !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            marginBottom: 20,
            backgroundColor: previewPassed
              ? "color-mix(in srgb, var(--accent-green) 10%, transparent)"
              : "color-mix(in srgb, var(--color-danger) 10%, transparent)",
          }}
        >
          {previewPassed ? (
            <CheckCircle2 size={16} style={{ color: "var(--accent-green)" }} />
          ) : (
            <XCircle size={16} style={{ color: "var(--color-danger)" }} />
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: previewPassed ? "var(--accent-green)" : "var(--color-danger)",
            }}
          >
            {previewPassed ? "Pass" : "Fail"} — pass mark is {getPassMark(examLevel as ExamLevel)}%
          </span>
        </div>
      )}

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
