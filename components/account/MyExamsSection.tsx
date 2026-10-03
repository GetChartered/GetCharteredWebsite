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
  // Parse "YYYY-MM-DD" as local midnight — `new Date("YYYY-MM-DD")` is UTC,
  // which would be compared against local start-of-today below.
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
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
 * Per-card Save/Cancel for scheduling, not auto-save-on-every-change:
 * `rows` is the editable draft, `savedRows` is a snapshot of the
 * backend-confirmed state (seeded once from GET /exam-prep — deliberately
 * excluding already-sat entries, which belong to the Previous tab instead —
 * and updated after every successful per-card Save or Remove). Saving a card
 * DELETEs its old entry if its examCode changed (a changed examCode is a
 * different backend entry, not an in-place edit, since the backend upserts
 * by (course, examCode)), then POSTs it — plus any other saved exam whose
 * isPrimary flag flips as a result.
 *
 * Recording a result (ExamResultModal) is likewise immediately saved — it
 * POSTs sat:true plus the entered grade/level for one exam right away (with
 * its own toast). Only offered in the Previous tab, which lists
 * backend-confirmed exams whose date has passed, so the result is always
 * recorded against a real, already-confirmed date.
 *
 * Saved Upcoming rows are read-only until their Edit (pencil) button is
 * clicked; that card's Save or Cancel re-locks it.
 */
export function MyExamsSection() {
  const { exams, loading: examsLoading, error: examsError } = useExamModules();
  const { examPrep, loading: examPrepLoading, error: examPrepError, saveExamPrep, deleteExamPrep } = useExamPrep();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [savedRows, setSavedRows] = useState<ExamRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  /** Key of the Upcoming row whose Save is in flight. */
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [resultModalExamCode, setResultModalExamCode] = useState<string | null>(null);
  /** Keys of saved rows the user has unlocked via their Edit button. */
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set());
  /** Inline edit draft for a past, not-yet-resulted exam in the Previous tab. */
  const [previousDraft, setPreviousDraft] = useState<{
    originalCode: string;
    examCode: string;
    examDate: string;
  } | null>(null);
  /** Saved exam (either tab) awaiting a second click to confirm removal. */
  const [confirmRemoveCode, setConfirmRemoveCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  // Previous = anything already sat, plus any backend-confirmed exam whose
  // date has passed (awaiting a result). Sourced live from examPrep, so an
  // exam stays here after its result is recorded. Most recent first.
  const previousEntries = useMemo(
    () =>
      examPrep
        .filter((e) => e.sat || isPastDate(e.examDate ?? ""))
        .sort((a, b) => (b.examDate ?? "").localeCompare(a.examDate ?? "")),
    [examPrep]
  );

  // Upcoming hides saved, unedited rows whose date has passed — those now
  // live in Previous. Rows with pending local changes stay visible here
  // until saved, so an exam doesn't vanish mid-edit.
  const upcomingRows = rows.filter((row) => {
    const saved = savedRows.find((r) => r.key === row.key);
    const isRowSaved = !!saved && saved.examCode === row.examCode && saved.examDate === row.examDate;
    return !(isRowSaved && isPastDate(row.examDate));
  });

  const handleSaveRow = async (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row || !row.examCode) return;
    const saved = savedRows.find((r) => r.key === key);

    if (saved && saved.examCode === row.examCode && saved.examDate === row.examDate) {
      stopEditing(key);
      return;
    }

    const nextSaved = saved ? savedRows.map((r) => (r.key === key ? { ...row } : r)) : [...savedRows, { ...row }];
    const toPrimaryInput = (list: ExamRow[]) =>
      list.map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }));
    const oldPrimary = computePrimaryExamCode(toPrimaryInput(savedRows));
    const newPrimary = computePrimaryExamCode(toPrimaryInput(nextSaved));

    // This row, plus any other saved exam whose isPrimary flag flips.
    const toPost = nextSaved.filter(
      (r) => r.key === key || (oldPrimary !== newPrimary && (r.examCode === oldPrimary || r.examCode === newPrimary))
    );

    setSavingKey(key);

    // A changed examCode is a different backend entry (upsert by code), so
    // the old one has to be deleted first.
    const deleted =
      !saved || saved.examCode === row.examCode || (await deleteExamPrep({ course: COURSE, examCode: saved.examCode }));
    const results = deleted
      ? await Promise.all(
          toPost.map((r) =>
            saveExamPrep({
              course: COURSE,
              examCode: r.examCode,
              examDate: r.examDate || undefined,
              isPrimary: r.examCode === newPrimary,
            })
          )
        )
      : [false];

    setSavingKey(null);

    if (results.some((ok) => !ok)) {
      showToast("Couldn't save your exam — try again.", "error");
      return;
    }

    setSavedRows(nextSaved);
    stopEditing(key);
    showToast("Your exam has been saved", "success");
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

  const startEditing = (key: string) => {
    setConfirmRemoveCode(null);
    setEditingKeys((prev) => new Set(prev).add(key));
  };

  const stopEditing = (key: string) => {
    setEditingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  /** Re-lock a saved row discarding its local changes, or drop a never-saved one. */
  const cancelEditing = (key: string) => {
    const saved = savedRows.find((r) => r.key === key);
    if (saved) updateRow(key, { examCode: saved.examCode, examDate: saved.examDate });
    else removeRow(key);
    stopEditing(key);
  };

  const primaryCode = computePrimaryExamCode(
    savedRows.map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
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
      // Sat exams drop out of the scheduling draft so a later scheduling
      // Save can't re-POST them without sat:true. They stay visible in the
      // Previous tab, which is sourced live from examPrep, not this draft.
      const code = resultModalEntry.examCode;
      setRows((prev) => prev.filter((r) => r.examCode !== code));
      setSavedRows((prev) => prev.filter((r) => r.examCode !== code));
      showToast("Exam result saved", "success");
    } else {
      showToast("Couldn't save your result — try again.", "error");
    }

    return ok;
  };

  // Editing a past, not-yet-resulted exam in the Previous tab is saved
  // immediately, like an Upcoming card's Save. The matching hidden
  // scheduling row is kept in sync so a later primary recalculation doesn't
  // resurrect or revert the change.
  const startEditingPrevious = (entry: ExamPrepEntry) => {
    setConfirmRemoveCode(null);
    setPreviousDraft({ originalCode: entry.examCode, examCode: entry.examCode, examDate: entry.examDate ?? "" });
  };

  const handleSavePrevious = async () => {
    if (!previousDraft || !previousDraft.examCode) return;
    const { originalCode, examCode, examDate } = previousDraft;
    setBusy(true);

    const updatedRows = rows.map((r) => (r.examCode === originalCode ? { ...r, examCode, examDate } : r));
    const newPrimary = computePrimaryExamCode(
      updatedRows.filter((r) => r.examCode).map((r) => ({ examCode: r.examCode, examDate: r.examDate || undefined }))
    );

    // A changed examCode is a different backend entry (upsert by code), so
    // the old one has to be deleted, same as handleSave.
    const deleted = examCode === originalCode || (await deleteExamPrep({ course: COURSE, examCode: originalCode }));
    const ok =
      deleted &&
      (await saveExamPrep({
        course: COURSE,
        examCode,
        examDate: examDate || undefined,
        isPrimary: examCode === newPrimary,
      }));

    setBusy(false);

    if (!ok) {
      showToast("Couldn't save your changes — try again.", "error");
      return;
    }

    const patch = (r: ExamRow) => (r.examCode === originalCode ? { ...r, examCode, examDate } : r);
    setRows((prev) => prev.map(patch));
    setSavedRows((prev) => prev.map(patch));
    setPreviousDraft(null);
    showToast("Your exam has been updated", "success");
  };

  const handleRemoveExam = async (examCode: string) => {
    setBusy(true);
    const ok = await deleteExamPrep({ course: COURSE, examCode });
    setBusy(false);
    setConfirmRemoveCode(null);

    if (!ok) {
      showToast("Couldn't remove this exam — try again.", "error");
      return;
    }

    setRows((prev) => prev.filter((r) => r.examCode !== examCode));
    setSavedRows((prev) => prev.filter((r) => r.examCode !== examCode));
    showToast("Exam removed", "success");
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
          {upcomingRows.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, padding: "8px 0" }}>
              You haven&apos;t got any upcoming exams. Add one to power your Progress countdown and Leaderboard default.
            </p>
          )}

          <div className="my-exams-grid">
            {upcomingRows.map((row) => {
              const isPrimary = !!row.examCode && row.examCode === primaryCode;
              const otherCodes = new Set(rows.filter((r) => r.key !== row.key && r.examCode).map((r) => r.examCode));
              const name = examNameByCode.get(row.examCode) ?? row.examCode;

              // Saved rows render read-only until their Edit button is
              // clicked; brand-new (never-saved) rows are always editable.
              const savedMatch = savedRows.find((r) => r.key === row.key);
              const isEditable = !savedMatch || editingKeys.has(row.key);
              const cardStyle = { borderLeft: isPrimary ? "3px solid var(--color-tint)" : undefined };

              if (isEditable) {
                const isSaving = savingKey === row.key;
                return (
                  <div key={row.key} className="exam-card" style={cardStyle}>
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
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={isSaving}
                        disabled={!row.examCode}
                        onClick={() => void handleSaveRow(row.key)}
                      >
                        Save
                      </Button>
                      <Button variant="outline" size="sm" disabled={isSaving} onClick={() => cancelEditing(row.key)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              if (confirmRemoveCode === row.examCode) {
                return (
                  <div key={row.key} className="exam-card" style={cardStyle}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{name}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                      Remove this exam?
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={busy}
                        onClick={() => void handleRemoveExam(row.examCode)}
                      >
                        Remove
                      </Button>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmRemoveCode(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={row.key} className="exam-card" style={cardStyle}>
                  <button
                    type="button"
                    onClick={() => startEditing(row.key)}
                    aria-label={`Edit ${name}`}
                    className="exam-card-remove"
                    style={{ ...cardCornerButtonStyle, right: 42 }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveCode(row.examCode)}
                    aria-label={`Remove ${name}`}
                    className="exam-card-remove"
                    style={cardCornerButtonStyle}
                  >
                    <X size={14} />
                  </button>

                  <div style={{ paddingRight: 60 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{name}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                      {row.examDate ? formatDisplayDate(row.examDate) : "No date set"}
                    </p>

                    {isPrimary && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-gold)", marginTop: 10 }}>
                        <Star size={13} fill="var(--accent-gold)" />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Primary exam</span>
                      </div>
                    )}
                    {!isPrimary && !row.examDate && (
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10 }}>
                        Add a date to power your countdown.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {upcomingRows.some((row) => row.examCode === primaryCode && primaryCode) && (
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              Your primary exam is shown on your Progress page and defaults your Leaderboard.
            </p>
          )}

          <div>
            <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRow}>
              Add exam
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {previousEntries.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, padding: "8px 0" }}>
              No previous exams yet. Once an upcoming exam&apos;s date has passed it&apos;ll appear here, ready for
              you to add your result.
            </p>
          ) : (
            <div className="my-exams-grid">
              {previousEntries.map((entry) => {
                const passed = computeExamPassed(entry.gradePercent, entry.examLevel ?? null);
                const name = examNameByCode.get(entry.examCode) ?? entry.examCode;

                if (!entry.sat && previousDraft?.originalCode === entry.examCode) {
                  // Every other code already registered (scheduled or sat) —
                  // the backend upserts by examCode, so picking one would
                  // overwrite that entry.
                  const takenCodes = new Set(
                    [...examPrep.map((e) => e.examCode), ...rows.map((r) => r.examCode)].filter(
                      (code) => code && code !== entry.examCode
                    )
                  );
                  return (
                    <div key={entry.examCode} className="exam-card">
                      <select
                        value={previousDraft.examCode}
                        onChange={(e) => setPreviousDraft({ ...previousDraft, examCode: e.target.value })}
                        aria-label="Exam"
                        style={examNameFieldStyle}
                      >
                        {exams
                          .filter((exam) => !takenCodes.has(exam.code))
                          .map((exam) => (
                            <option key={exam.code} value={exam.code}>
                              {exam.name || exam.code}
                            </option>
                          ))}
                      </select>
                      <input
                        type="date"
                        value={previousDraft.examDate}
                        onChange={(e) => setPreviousDraft({ ...previousDraft, examDate: e.target.value })}
                        aria-label="Exam date"
                        style={examDateFieldStyle}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={busy}
                          onClick={() => void handleSavePrevious()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => setPreviousDraft(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (!entry.sat && confirmRemoveCode === entry.examCode) {
                  return (
                    <div key={entry.examCode} className="exam-card">
                      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{name}</p>
                      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        Remove this exam?
                      </p>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={busy}
                          onClick={() => void handleRemoveExam(entry.examCode)}
                        >
                          Remove
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => setConfirmRemoveCode(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={entry.examCode} className="exam-card">
                    {entry.sat ? (
                      <button
                        type="button"
                        onClick={() => setResultModalExamCode(entry.examCode)}
                        aria-label={`Edit result for ${name}`}
                        className="exam-card-remove"
                        style={cardCornerButtonStyle}
                      >
                        <Pencil size={13} />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditingPrevious(entry)}
                          aria-label={`Edit ${name}`}
                          className="exam-card-remove"
                          style={{ ...cardCornerButtonStyle, right: 42 }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviousDraft(null);
                            setConfirmRemoveCode(entry.examCode);
                          }}
                          aria-label={`Remove ${name}`}
                          className="exam-card-remove"
                          style={cardCornerButtonStyle}
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}

                    <div style={{ paddingRight: entry.sat ? 28 : 60 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{name}</p>
                      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        {entry.examDate ? `Sat ${formatDisplayDate(entry.examDate)}` : "Date not recorded"}
                      </p>
                      {entry.examLevel && (
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {EXAM_LEVEL_LABELS[entry.examLevel]}
                        </p>
                      )}

                      {!entry.sat ? (
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ marginTop: 12 }}
                          onClick={() => setResultModalExamCode(entry.examCode)}
                        >
                          Add result
                        </Button>
                      ) : (
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
                      )}
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

const cardCornerButtonStyle: React.CSSProperties = {
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
};

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
