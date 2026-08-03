"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui";
import { BrandedLoader } from "@/components/BrandedLoader";
import { useExamModules } from "@/hooks/useExamModules";
import { useExamPrep } from "@/hooks/useExamPrep";
import { computePrimaryExamCode } from "@/lib/practice/examPrep";

const COURSE = "ACA";

interface ExamRow {
  /** Stable local identity, independent of which exam is picked (so
   *  changing a row's exam mid-edit doesn't get treated as a different
   *  row). */
  key: string;
  /** "" = not picked yet — not synced to the backend until Save. */
  examCode: string;
  /** "YYYY-MM-DD", or "" = not set yet. */
  examDate: string;
}

let rowKeyCounter = 0;
function nextRowKey(): string {
  rowKeyCounter += 1;
  return `new-${rowKeyCounter}`;
}

/**
 * "My Exams" — lets a user register one or more real exam sittings (a
 * specific exam + a specific date), mirroring GetChartered_app's Edit Exam
 * Dates screen but as a standard web form (add/remove rows, native date
 * inputs) rather than a mobile bottom-sheet port. Backs the same
 * GET/POST/DELETE /exam-prep contract the app uses, which is what the
 * Leaderboard's default exam and the Progress page's Next Exam tile now key
 * off.
 *
 * Explicit Save, not auto-save-on-every-change: `rows` is the editable draft
 * (add/remove/edit freely, nothing hits the backend), `savedRows` is a
 * snapshot of the last backend-confirmed state (seeded once from GET
 * /exam-prep, replaced with the new confirmed state after every successful
 * Save). Save diffs the two: rows in `savedRows` no longer present in
 * `rows` — or present but with a changed examCode — get DELETEd (a changed
 * examCode is a different backend entry, not an in-place edit, since the
 * backend upserts by (course, examCode)); every currently-named row gets
 * POSTed (an upsert, so this naturally covers new rows, unchanged rows
 * re-confirming their isPrimary flag, and the "new" half of a changed
 * examCode). `isDirty` (rows vs savedRows) drives both the Save button's
 * disabled state and the "unsaved changes" indicator.
 *
 * The exam picker is no longer locked once a row has a saved entry — that
 * lock existed only because there was previously no way to delete the old
 * entry when switching exams (confirmed via a live Gateway probe: DELETE
 * /exam-prep 404'd). Now that DELETE exists, switching is just "delete old
 * code, save new code" like any other edit, handled by the diff above.
 */
export function MyExamsSection() {
  const { exams, loading: examsLoading, error: examsError } = useExamModules();
  const { examPrep, loading: examPrepLoading, error: examPrepError, saveExamPrep, deleteExamPrep } = useExamPrep();

  const [rows, setRows] = useState<ExamRow[]>([]);
  const [savedRows, setSavedRows] = useState<ExamRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Seed local rows from the backend's real list exactly once, the first
  // time it finishes loading — never again, so a later refresh (triggered
  // by saveExamPrep/deleteExamPrep updating their own state) doesn't
  // clobber in-progress local edits. Adjusted during render (React's
  // documented pattern for "reset/derive state from a prop change") rather
  // than in a useEffect — a setState called synchronously inside an effect
  // body trips this codebase's React Compiler purity lint.
  if (!seeded && !examPrepLoading) {
    setSeeded(true);
    const seededRows = examPrep.map((e) => ({ key: e.examCode, examCode: e.examCode, examDate: e.examDate ?? "" }));
    setRows(seededRows);
    setSavedRows(seededRows);
  }

  const isDirty = useMemo(() => {
    const savedByKey = new Map(savedRows.map((r) => [r.key, r]));
    const currentKeys = new Set(rows.map((r) => r.key));
    if (savedRows.some((r) => !currentKeys.has(r.key))) return true; // a saved row was removed
    return rows.some((r) => {
      const saved = savedByKey.get(r.key);
      return !saved || saved.examCode !== r.examCode || saved.examDate !== r.examDate;
    });
  }, [rows, savedRows]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    // Saved rows no longer present, or present under a different examCode
    // (delete the OLD code specifically — the new one is a separate
    // upsert below, not an update to the same backend entry).
    const toDelete = savedRows.filter((saved) => {
      const current = rows.find((r) => r.key === saved.key);
      return !current || current.examCode !== saved.examCode;
    });

    const named = rows.filter((r) => r.examCode);
    const primaryCode = computePrimaryExamCode(
      named.map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
    );

    const [deleteResults, saveResults] = await Promise.all([
      Promise.all(toDelete.map((r) => deleteExamPrep({ course: COURSE, examCode: r.examCode }))),
      Promise.all(
        named.map((r) =>
          saveExamPrep({
            course: COURSE,
            examCode: r.examCode,
            examDate: r.examDate || undefined,
            isPrimary: r.examCode === primaryCode,
          })
        )
      ),
    ]);

    setSaving(false);

    if (deleteResults.some((ok) => !ok) || saveResults.some((ok) => !ok)) {
      setSaveError("Some changes couldn't be saved — try again.");
      return;
    }

    // Everything succeeded — the new confirmed snapshot is exactly the
    // rows that were just named/saved (unnamed rows never persist, and
    // anything deleted is already gone from `rows` or superseded above).
    setSavedRows(named.map((r) => ({ key: r.key, examCode: r.examCode, examDate: r.examDate })));
  };

  const updateRow = (key: string, patch: Partial<ExamRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: nextRowKey(), examCode: "", examDate: "" }]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const primaryCode = computePrimaryExamCode(
    rows.filter((r) => r.examCode).map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
  );

  const loading = examsLoading || examPrepLoading;

  if (loading) {
    return (
      <div className="card" style={{ padding: 32, display: "flex", justifyContent: "center" }}>
        <BrandedLoader size={48} />
      </div>
    );
  }

  if (examsError || exams.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          {examsError || "No exams are available right now — check back soon."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {examPrepError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
            color: "var(--color-danger)",
            fontSize: 13,
          }}
        >
          <AlertTriangle size={16} />
          {examPrepError}
        </div>
      )}

      {rows.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
            You haven&apos;t set up any exams yet. Add one to power your Progress countdown and Leaderboard default.
          </p>
        </div>
      )}

      {rows.map((row) => {
        const isPrimary = !!row.examCode && row.examCode === primaryCode;
        const otherCodes = new Set(rows.filter((r) => r.key !== row.key && r.examCode).map((r) => r.examCode));

        return (
          <div
            key={row.key}
            className="card"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={row.examCode}
                onChange={(e) => updateRow(row.key, { examCode: e.target.value })}
                aria-label="Exam"
                style={{ ...fieldStyle, flex: "1 1 220px" }}
              >
                <option value="">Choose an exam…</option>
                {exams
                  .filter((exam) => !otherCodes.has(exam.code))
                  .map((exam) => (
                    <option key={exam.code} value={exam.code}>
                      {exam.name || exam.code}
                    </option>
                  ))}
              </select>

              <input
                type="date"
                value={row.examDate}
                onChange={(e) => updateRow(row.key, { examDate: e.target.value })}
                aria-label="Exam date"
                style={{ ...fieldStyle, flex: "0 1 170px" }}
              />

              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label="Remove exam"
                className="exam-row-remove"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all var(--transition-normal)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {isPrimary && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-gold)" }}>
                <Star size={13} fill="var(--accent-gold)" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Primary — shown on your Progress page and defaults your Leaderboard
                </span>
              </div>
            )}
            {!isPrimary && row.examCode && !row.examDate && (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Add a date to power your countdown.
              </p>
            )}
          </div>
        );
      })}

      {/* Actions and save-status feedback on their own lines — previously
          shared one wrapping row, where the status text read as if it were
          just trailing off the buttons rather than a distinct piece of
          feedback. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRow}>
            Add exam
          </Button>
          <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={!isDirty} loading={saving}>
            Save
          </Button>
        </div>
        {!saving && isDirty && !saveError && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>You have unsaved changes</span>
        )}
        {!saving && saveError && (
          <span style={{ fontSize: 12, color: "var(--color-danger)" }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  // Explicit height (rather than relying on padding alone) so the select and
  // date input line up pixel-for-pixel with the 36px remove button next to
  // them — native <select>/<input type="date"> intrinsic height varies
  // slightly by browser otherwise.
  height: 36,
  padding: "0 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text)",
  fontSize: 14,
  minWidth: 0,
};
