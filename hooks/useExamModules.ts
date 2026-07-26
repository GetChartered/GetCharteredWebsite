"use client";

import { useCallback, useEffect, useState } from "react";
import type { PracticeExamGroup } from "@/lib/practice/types";

type FetchResult =
  | { ok: true; exams: PracticeExamGroup[]; moduleQuestionCounts: Record<string, number> }
  | { ok: false; error: string };

/**
 * Fetches ACA's exam/module tree from /api/practice/modules. Shared by every
 * practice mode's module-selection step (Quick, Module, Timed use it
 * directly for pickers; Focus and Mock use it to know the full module/exam
 * set for their own selection logic) and by the progress dashboard (module
 * names + bank sizes for "not started" counts).
 */
export function useExamModules() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<PracticeExamGroup[]>([]);
  const [moduleQuestionCounts, setModuleQuestionCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Pure fetch — no setState here, so it's safe to call from an effect body
  // without triggering synchronous cascading renders.
  const fetchModules = useCallback(async (): Promise<FetchResult> => {
    try {
      const res = await fetch("/api/practice/modules");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !Array.isArray(data.exams)) {
        return { ok: false, error: "Couldn't load modules. Please try again." };
      }
      return {
        ok: true,
        exams: data.exams as PracticeExamGroup[],
        moduleQuestionCounts:
          data.moduleQuestionCounts && typeof data.moduleQuestionCounts === "object"
            ? (data.moduleQuestionCounts as Record<string, number>)
            : {},
      };
    } catch {
      return { ok: false, error: "Couldn't load modules. Please try again." };
    }
  }, []);

  const applyResult = useCallback((result: FetchResult) => {
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setExams(result.exams);
    setModuleQuestionCounts(result.moduleQuestionCounts);
    setError(
      result.exams.every((exam) => exam.modules.length === 0)
        ? "No practice modules are available right now — check back soon."
        : null
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchModules().then((result) => {
      if (!cancelled) applyResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchModules, applyResult]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    void fetchModules().then(applyResult);
  }, [fetchModules, applyResult]);

  return { loading, exams, moduleQuestionCounts, error, retry };
}
