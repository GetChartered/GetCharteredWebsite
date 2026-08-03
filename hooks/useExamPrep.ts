"use client";

import { useCallback, useEffect, useState } from "react";
import { selectPrimaryExamPrep } from "@/lib/practice/examPrep";
import type { ExamPrepEntry } from "@/lib/practice/types";

export interface SaveExamPrepParams {
  course: string;
  examCode: string;
  examDate?: string;
  isPrimary?: boolean;
}

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
      return true;
    } catch {
      return false;
    }
  }, []);

  const primaryExam = selectPrimaryExamPrep(examPrep);

  return { examPrep, loading, error, refresh, saveExamPrep, deleteExamPrep, primaryExam };
}
