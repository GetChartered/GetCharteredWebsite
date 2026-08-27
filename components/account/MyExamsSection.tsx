"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Star, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { BrandedLoader } from "@/components/BrandedLoader";
import { ExamResultModal } from "@/components/account/ExamResultModal";
import { useExamModules } from "@/hooks/useExamModules";
import { useExamPrep } from "@/hooks/useExamPrep";
import { computePrimaryExamCode } from "@/lib/practice/examPrep";
import { computeExamPassed } from "@/lib/practice/examResults";
import { EXAM_LEVEL_LABELS } from "@/lib/practice/examLevels";
import type { ExamLevel, ExamPrepEntry } from "@/lib/practice/types";

const COURSE = "ACA";

type Tab = "upcoming" | "previous";

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

function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return d.getTime() < startOfToday.getTime();
}

/**
 * "My Exams" — two tabs: Upcoming (register a real exam sitting: exam +
 * date, mirroring GetChartered_app's Edit Exam Dates screen) and Previous
 * (recorded results for exams the user has actually sat — a website-only
 * addition; the app has no equivalent, see backend-reference/
 * updateExamResult.md). Backs the same GET/POST/DELETE /exam-prep contract
 * the app uses for scheduling, extended with `sat`/`gradePercent`/
 * `examLevel` for results — see lib/practice/types.ts's ExamPrepEntry.
 *
 * Explicit Save for scheduling, not auto-save-on-every-change: `rows` is the
 * editable draft (add/remove/edit freely, nothing hits the backend),
 * `savedRows` is a snapshot of the last backend-confirmed state (seeded
 * once from GET /exam-prep — deliberately excluding already-sat entries,
 * which belong to the Previous tab instead, not the scheduling draft — and
 * replaced with the new confirmed state after every successful Save). Save
 * diffs the two: rows in `savedRows` no longer present in `rows` — or
 * present but with a changed examCode — get DELETEd (a changed examCode is
 * a different backend entry, not an in-place edit, since the backend
 * upserts by (course, examCode)); every currently-named row gets POSTed (an
 * upsert, so this naturally covers new rows, unchanged rows re-confirming
 * their isPrimary flag, and the "new" half of a changed examCode). `isDirty`
 * (rows vs savedRows) drives both the Save button's disabled state and the
 * "unsaved changes" indicator.
 *
 * Recording a result (ExamResultModal) is a separate, immediately-saved
 * action from the scheduling Save button above — it POSTs sat:true plus the
 * entered grade/level for one exam right away (with its own toast), rather
 * than being folded into the batched scheduling diff. Only offered on a
 * row that exactly matches its saved counterpart (not locally dirty) so the
 * result is always recorded against a real, already-confirmed exam date.
 */
export function MyExamsSection() {
  const { exams, loading: examsLoading, error: examsError } = useExamModules();
  const { examPrep, loading: examPrepLoading, error: examPrepError, saveExamPrep, deleteExamPrep } = useExamPrep();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [savedRows, setSavedRows] = useState<ExamRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resultModalExamCode, setResultModalExamCode] = useState<string | null>(null);

  // Seed local rows from the backend's real *unsat* entries exactly once,
  // the first time it finishes loading — never again, so a later refresh
  // (triggered by saveExamPrep/deleteExamPrep updating their own state)
  // doesn't clobber in-progress local edits. Adjusted during render (React's
  // documented pattern for "reset/derive state from a prop change") rather
  // than in a useEffect — a setState called synchronously inside an effect
  // body trips this codebase's React Compiler purity lint.
  if (!seeded && !examPrepLoading) {
    setSeeded(true);
    const seededRows = examPrep
      .filter((e) => !e.sat)
      .map((e) => ({ key: e.examCode, examCode: e.examCode, examDate: e.examDate ?? "" }));
    setRows(seededRows);
    setSavedRows(seededRows);
  }

  const examNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const exam of exams) map.set(exam.code, exam.name || exam.code);
    return map;
  }, [exams]);

  const previousEntries = useMemo(() => examPrep.filter((e) => e.sat), [examPrep]);

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
      const message = "Some changes couldn't be saved — try again.";
      setSaveError(message);
      showToast(message, "error");
      return;
    }

    // Everything succeeded — the new confirmed snapshot is exactly the
    // rows that were just named/saved (unnamed rows never persist, and
    // anything deleted is already gone from `rows` or superseded above).
    setSavedRows(named.map((r) => ({ key: r.key, examCode: r.examCode, examDate: r.examDate })));
    showToast("Your exams have been saved", "success");
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

  // The exam currently open in ExamResultModal, if any — sourced from
  // whichever tab it was opened from (a saved Upcoming row, matched by
  // examCode against the live examPrep list for its confirmed examDate; or
  // an existing Previous entry directly).
  const resultModalEntry: ExamPrepEntry | undefined = resultModalExamCode
    ? examPrep.find((e) => e.examCode === resultModalExamCode)
    : undefined;

  const handleSaveResult = async (result: { gradePercent: number; examLevel: ExamLevel }): Promise<boolean> => {
    if (!resultModalEntry) return false;

    const ok = await saveExamPrep({
      course: COURSE,
      examCode: resultModalEntry.examCode,
      examDate: resultModalEntry.examDate,
      isPrimary: resultModalEntry.isPrimary,
      sat: true,
      gradePercent: result.gradePercent,
      examLevel: result.examLevel,
    });

    if (ok) {
      // Newly-sat exams drop out of the scheduling draft — they now belong
      // to the Previous tab (sourced live from examPrep, not this draft).
      const code = resultModalEntry.examCode;
      setRows((prev) => prev.filter((r) => r.examCode !== code));
      setSavedRows((prev) => prev.filter((r) => r.examCode !== code));
      showToast("Exam result saved", "success");
    } else {
      showToast("Couldn't save your result — try again.", "error");
    }

    return ok;
  };

  const loading = examsLoading || examPrepLoading;

  if (loading) {
    return (
      <div style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}>
        <BrandedLoader size={48} />
      </div>
    );
  }

  if (examsError || exams.length === 0) {
    return (
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14, padding: "8px 0" }}>
        {examsError || "No exams are available right now — check back soon."}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="exam-tabs">
        <button
          type="button"
          className={`exam-tab${activeTab === "upcoming" ? " active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={`exam-tab${activeTab === "previous" ? " active" : ""}`}
          onClick={() => setActiveTab("previous")}
        >
          Previous
        </button>
      </div>

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

      {activeTab === "upcoming" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, padding: "8px 0" }}>
              You haven&apos;t set up any exams yet. Add one to power your Progress countdown and Leaderboard default.
            </p>
          )}

          <div className="my-exams-grid">
            {rows.map((row) => {
              const isPrimary = !!row.examCode && row.examCode === primaryCode;
              const otherCodes = new Set(rows.filter((r) => r.key !== row.key && r.examCode).map((r) => r.examCode));

              // Only offer "Add result" once this exact row is confirmed on
              // the backend (not a pending local edit) and its date has
              // passed — recording a result against an unsaved date/exam
              // choice would silently record it against whatever the
              // *previous* save actually stored.
              const savedMatch = savedRows.find((r) => r.key === row.key);
              const isRowSaved =
                !!savedMatch && savedMatch.examCode === row.examCode && savedMatch.examDate === row.examDate;
              const canAddResult = isRowSaved && !!row.examCode && isPastDate(row.examDate);

              return (
                <div
                  key={row.key}
                  className="exam-card"
                  style={{
                    borderLeft: isPrimary ? "3px solid var(--color-tint)" : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove exam"
                    className="exam-card-remove"
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      transition: "all var(--transition-normal)",
                    }}
                  >
                    <X size={14} />
                  </button>

                  <div style={{ paddingRight: 28 }}>
                    <select
                      value={row.examCode}
                      onChange={(e) => updateRow(row.key, { examCode: e.target.value })}
                      aria-label="Exam"
                      style={examNameFieldStyle}
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
                      style={examDateFieldStyle}
                    />

                    {isPrimary && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-gold)", marginTop: 10 }}>
                        <Star size={13} fill="var(--accent-gold)" />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Primary exam</span>
                      </div>
                    )}
                    {!isPrimary && row.examCode && !row.examDate && (
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10 }}>
                        Add a date to power your countdown.
                      </p>
                    )}

                    {canAddResult && (
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ marginTop: 10 }}
                        onClick={() => setResultModalExamCode(row.examCode)}
                      >
                        Add result
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rows.some((row) => row.examCode === primaryCode && primaryCode) && (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              Your primary exam is shown on your Progress page and defaults your Leaderboard.
            </p>
          )}

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
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {previousEntries.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, padding: "8px 0" }}>
              No previous exams recorded yet. Once an upcoming exam&apos;s date has passed, add its result from the
              Upcoming tab.
            </p>
          ) : (
            <div className="my-exams-grid">
              {previousEntries.map((entry) => {
                const passed = computeExamPassed(entry.gradePercent, entry.examLevel ?? null);
                const name = examNameByCode.get(entry.examCode) ?? entry.examCode;

                return (
                  <div key={entry.examCode} className="exam-card">
                    <button
                      type="button"
                      onClick={() => setResultModalExamCode(entry.examCode)}
                      aria-label={`Edit result for ${name}`}
                      className="exam-card-remove"
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        backgroundColor: "transparent",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        transition: "all var(--transition-normal)",
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    <div style={{ paddingRight: 28 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{name}</p>
                      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        {entry.examDate ? `Sat ${formatDisplayDate(entry.examDate)}` : "Date not recorded"}
                      </p>
                      {entry.examLevel && (
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {EXAM_LEVEL_LABELS[entry.examLevel]}
                        </p>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>
                          {entry.gradePercent != null ? `${entry.gradePercent}%` : "—"}
                        </span>
                        {passed !== null && (
                          <span className={`badge ${passed ? "badge-success" : "badge-danger"}`}>
                            {passed ? (
                              <>
                                <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                                Pass
                              </>
                            ) : (
                              <>
                                <XCircle size={12} style={{ marginRight: 4 }} />
                                Fail
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {resultModalEntry && (
        <ExamResultModal
          examName={examNameByCode.get(resultModalEntry.examCode) ?? resultModalEntry.examCode}
          examCode={resultModalEntry.examCode}
          examDate={resultModalEntry.examDate ?? ""}
          initialGradePercent={resultModalEntry.gradePercent}
          initialExamLevel={resultModalEntry.examLevel ?? null}
          onClose={() => setResultModalExamCode(null)}
          onSave={handleSaveResult}
        />
      )}
    </div>
  );
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const examNameFieldStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text)",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "inherit",
};

const examDateFieldStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  marginTop: 8,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text-secondary)",
  fontSize: 13,
};
