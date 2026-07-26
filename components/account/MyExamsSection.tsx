"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Loader2, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useExamModules } from "@/hooks/useExamModules";
import { useExamPrep } from "@/hooks/useExamPrep";
import { computePrimaryExamCode } from "@/lib/practice/examPrep";

const COURSE = "ACA";

interface ExamRow {
  /** Stable local identity, independent of which exam is picked (so
   *  changing a row's exam mid-edit doesn't get treated as a different
   *  row). */
  key: string;
  /** "" = not picked yet — not synced to the backend until set. */
  examCode: string;
  /** "YYYY-MM-DD", or "" = not set yet. */
  examDate: string;
  /** True once this row has a confirmed real backend entry (seeded from
   *  GET /exam-prep, or successfully saved at least once). The exam picker
   *  locks once this is true — see the note above the component. */
  isSaved: boolean;
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
 * inputs) rather than a mobile bottom-sheet port. Backs the same POST/GET
 * /exam-prep contract the app uses, which is what the Leaderboard's default
 * exam and the Progress page's Next Exam tile now key off.
 *
 * Row list is seeded ONLY from GET /exam-prep's real entries — never from
 * the course's full exam list (confirmed via direct re-audit + a live probe
 * of the backend Gateway).
 *
 * Known limitation, inherited from the app itself (confirmed live: DELETE
 * /exam-prep returns 404 "Not Found" from the Gateway, while GET/POST both
 * return 401 "Unauthorized" — i.e. those routes exist and this one simply
 * doesn't): there is no way to delete a saved entry server-side, ever.
 * "Remove" here only stops showing/syncing that row locally — the backend
 * entry persists and will reappear on next load. This is exactly why the
 * exam picker below LOCKS once a row has a real saved entry (`isSaved`):
 * switching an existing row to a different exam used to silently orphan
 * the old backend entry (upsert-by-examCode targets a new key, the old key
 * is never told to go away), and repeated edits during testing are the
 * likely explanation for accounts that already show more rows than the
 * user meant to add. Locking the picker stops the accumulation going
 * forward; it can't retroactively clean up entries already created.
 */
export function MyExamsSection() {
  const { exams, loading: examsLoading, error: examsError } = useExamModules();
  const { examPrep, loading: examPrepLoading, error: examPrepError, saveExamPrep } = useExamPrep();

  const [rows, setRows] = useState<ExamRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Seed local rows from the backend's real list exactly once, the first
  // time it finishes loading — never again, so a later refresh (triggered
  // by saveExamPrep updating its own state) doesn't clobber in-progress
  // local edits. Adjusted during render (React's documented pattern for
  // "reset/derive state from a prop change") rather than in a useEffect —
  // a setState called synchronously inside an effect body trips this
  // codebase's React Compiler purity lint, since it causes an extra
  // cascading render (same pattern already used in AccuracyByModuleChart.tsx).
  if (!seeded && !examPrepLoading) {
    setSeeded(true);
    setRows(
      examPrep.map((e) => ({ key: e.examCode, examCode: e.examCode, examDate: e.examDate ?? "", isSaved: true }))
    );
  }

  const syncAll = useCallback(
    async (nextRows: ExamRow[]) => {
      const named = nextRows.filter((r) => r.examCode);
      if (named.length === 0) return;

      setSaving(true);
      setSaveError(null);

      // Recompute which exam is primary across the FULL current set on
      // every change (nearest upcoming date wins), matching the app's own
      // syncExamPrep — which resyncs every named exam any time any one of
      // them changes, so isPrimary flags never drift out of sync with each
      // other on the backend.
      const primaryCode = computePrimaryExamCode(
        named.map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
      );

      const results = await Promise.all(
        named.map((r) =>
          saveExamPrep({
            course: COURSE,
            examCode: r.examCode,
            examDate: r.examDate || undefined,
            isPrimary: r.examCode === primaryCode,
          })
        )
      );

      setSaving(false);
      if (results.some((ok) => !ok)) {
        setSaveError("Some changes couldn't be saved — try again.");
      }

      // Lock the exam picker on every row that just saved successfully —
      // see the component doc comment for why (prevents future orphaned
      // backend entries from in-place exam switching, since there's no way
      // to ever delete the old one).
      const savedKeys = new Set(named.filter((_, i) => results[i]).map((r) => r.key));
      if (savedKeys.size > 0) {
        setRows((prev) => prev.map((r) => (savedKeys.has(r.key) ? { ...r, isSaved: true } : r)));
      }
    },
    [saveExamPrep]
  );

  const updateRow = (key: string, patch: Partial<ExamRow>) => {
    const next = rows.map((r) => (r.key === key ? { ...r, ...patch } : r));
    setRows(next);
    void syncAll(next);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: nextRowKey(), examCode: "", examDate: "", isSaved: false }]);
  };

  const removeRow = (key: string) => {
    const next = rows.filter((r) => r.key !== key);
    setRows(next);
    void syncAll(next);
  };

  const primaryCode = computePrimaryExamCode(
    rows.filter((r) => r.examCode).map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
  );

  const loading = examsLoading || examPrepLoading;

  if (loading) {
    return (
      <div className="card" style={{ padding: 32, display: "flex", justifyContent: "center" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--color-tint)" }} />
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
            backgroundColor: "rgba(239, 68, 68, 0.08)",
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
                disabled={row.isSaved}
                aria-label="Exam"
                title={row.isSaved ? "To switch exams, remove this row and add a new one." : undefined}
                style={{
                  ...fieldStyle,
                  flex: "1 1 220px",
                  opacity: row.isSaved ? 0.7 : 1,
                  cursor: row.isSaved ? "not-allowed" : "pointer",
                }}
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
                title={
                  row.isSaved
                    ? "Removes it from this list on this device — there's currently no way to delete a saved exam from the server, so it may reappear if the list reloads."
                    : undefined
                }
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRow}>
          Add exam
        </Button>
        {saving && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <Loader2 size={13} className="animate-spin" /> Saving…
          </span>
        )}
        {!saving && saveError && (
          <span style={{ fontSize: 12, color: "var(--color-danger)" }}>{saveError}</span>
        )}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text)",
  fontSize: 14,
  minWidth: 0,
};
