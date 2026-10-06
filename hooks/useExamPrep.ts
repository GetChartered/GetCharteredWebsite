"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { selectPrimaryExamPrep } from "@/lib/practice/examPrep";
import type { ExamLevel, ExamOutcome, ExamPrepEntry } from "@/lib/practice/types";

export interface SaveExamPrepParams {
  course: string;
  examCode: string;
  examDate?: string;
  isPrimary?: boolean;
  /** Result fields — see lib/practice/types.ts's ExamPrepEntry. Omit for a
   *  plain scheduling save (My Exams' Save button); MyExamsSection's result
   *  form is the only caller that sets these. */
  sat?: boolean;
  gradePercent?: number | null;
  examLevel?: ExamLevel | null;
  outcome?: ExamOutcome | null;
}

type ExamResultFields = Pick<ExamPrepEntry, "sat" | "gradePercent" | "examLevel">;

export interface DeleteExamPrepParams {
  course: string;
  examCode: string;
}

/** Client-side access to the real per-user exam-prep list (GET/POST
 *  /api/exam-prep) — shared by the leaderboard's default-exam selection and
 *  the My Exams settings form. */
export function useExamPrep() {
  const [examPrep, setExamPrep] = useState<ExamPrepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Results saved this session, keyed by `${course}#${examCode}`. The real
   *  backend doesn't persist sat/gradePercent/examLevel yet (see
   *  backend-reference/updateExamResult.md), so its response drops them —
   *  overlaid onto any entry the backend returns without `sat`, so a
   *  recorded result shows straight away. Lost on reload until the backend
   *  change is deployed; a no-op once it is. */
  const [localResults, setLocalResults] = useState<Map<string, ExamResultFields>>(new Map());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exam-prep");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !Array.isArray(data.examPrep)) {
        setError("Couldn't load your exams.");
        setExamPrep([]);
      } else {
        setExamPrep(data.examPrep as ExamPrepEntry[]);
      }
    } catch {
      setError("Couldn't load your exams.");
      setExamPrep([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void refresh();
  }, [refresh]);

  const saveExamPrep = useCallback(async (params: SaveExamPrepParams): Promise<boolean> => {
    try {
      const res = await fetch("/api/exam-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return false;
      if (Array.isArray(data.examPrep)) setExamPrep(data.examPrep as ExamPrepEntry[]);
      if (params.sat !== undefined) {
        const { sat, gradePercent, examLevel } = params;
        setLocalResults((prev) =>
          new Map(prev).set(`${params.course}#${params.examCode}`, { sat, gradePercent, examLevel })
        );
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  /** DELETE /api/exam-prep — mirrors saveExamPrep's shape/error handling.
   *  Removes a single (course, examCode) entry server-side. */
  const deleteExamPrep = useCallback(async (params: DeleteExamPrepParams): Promise<boolean> => {
    try {
      const res = await fetch("/api/exam-prep", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) return false;
      if (Array.isArray(data.examPrep)) setExamPrep(data.examPrep as ExamPrepEntry[]);
      setLocalResults((prev) => {
        const next = new Map(prev);
        next.delete(`${params.course}#${params.examCode}`);
        return next;
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const mergedExamPrep = useMemo(
    () =>
      examPrep.map((e) => {
        const local = localResults.get(`${e.course}#${e.examCode}`);
        return local && e.sat === undefined ? { ...e, ...local } : e;
      }),
    [examPrep, localResults]
  );

  const primaryExam = selectPrimaryExamPrep(mergedExamPrep);

  return { examPrep: mergedExamPrep, loading, error, refresh, saveExamPrep, deleteExamPrep, primaryExam };
}
