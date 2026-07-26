"use client";

import { useCallback, useEffect, useState } from "react";
import { useExamModules } from "@/hooks/useExamModules";
import { useExamPrep } from "@/hooks/useExamPrep";
import type { LeaderboardData } from "@/lib/practice/types";

const COURSE = "ACA";

export function useLeaderboard() {
  const { loading: examsLoading, exams, error: examsError } = useExamModules();
  const { examPrep, loading: examPrepLoading, primaryExam } = useExamPrep();
  const [selectedExamCode, setSelectedExamCode] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Default to the user's real exam sitting (POST/GET /exam-prep — a
  // specific exam code the user actually registered via My Exams, not the
  // coarse onboarding target_exam_window bucket), falling back to the first
  // exam in the tree if they haven't set one up yet. Mirrors
  // GetChartered_app's own default-selection rule in
  // hooks/useBackendLeaderboard.ts: `entries.find(e => e.isPrimary) ??
  // entries[0]`. Waits for both fetches so this doesn't flash "first exam"
  // and then jump to the real one a beat later.
  if (!examsLoading && !examPrepLoading && selectedExamCode === null && exams.length > 0) {
    const defaultCode = primaryExam?.examCode ?? exams[0].code;
    setSelectedExamCode(exams.some((e) => e.code === defaultCode) ? defaultCode : exams[0].code);
  }

  const fetchLeaderboardFor = useCallback(async (examCode: string) => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const examKey = `${COURSE}#${examCode}`;
      const res = await fetch(`/api/leaderboard?examKey=${encodeURIComponent(examKey)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setLeaderboardError(
          (data && typeof data.error === "string" && data.error) || "Couldn't load the leaderboard."
        );
        setLeaderboardData(null);
      } else {
        setLeaderboardData(data as LeaderboardData);
      }
    } catch {
      setLeaderboardError("Couldn't load the leaderboard.");
      setLeaderboardData(null);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Read-only — the leaderboard NEVER writes to /exam-prep. It used to
  // silently POST a cohort-membership entry every time the user picked a
  // different exam filter (even just browsing), which meant merely viewing
  // a different leaderboard permanently registered that exam as one of the
  // user's "My Exams" — a real bug: several exams the user never actually
  // added would show up in app/my-account's My Exams list undated. Checked
  // against GetChartered_app's own hooks/useBackendLeaderboard.ts: its
  // leaderboard screen only ever calls fetchExamPrep (GET), never
  // setExamPrep (POST) — registration only happens from Edit Exam Dates.
  // When GET /leaderboard reports noCohort, the app's screen shows a "Set
  // up your exam sitting" CTA that routes to My Exams instead of
  // auto-registering — see LeaderboardBody's noCohort branch below, which
  // now does the same via a link to /my-account.
  useEffect(() => {
    if (!selectedExamCode) return;
    void fetchLeaderboardFor(selectedExamCode);
  }, [selectedExamCode, fetchLeaderboardFor]);

  const selectExamCode = useCallback((code: string) => {
    setSelectedExamCode(code);
  }, []);

  const optIn = useCallback(
    async (value: boolean): Promise<boolean> => {
      try {
        const res = await fetch("/api/leaderboard/opt-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optIn: value }),
        });
        if (!res.ok) return false;
        if (selectedExamCode) await fetchLeaderboardFor(selectedExamCode);
        return true;
      } catch {
        return false;
      }
    },
    [selectedExamCode, fetchLeaderboardFor]
  );

  const refetch = useCallback(() => {
    if (selectedExamCode) void fetchLeaderboardFor(selectedExamCode);
  }, [selectedExamCode, fetchLeaderboardFor]);

  return {
    examsLoading,
    exams,
    examsError,
    selectedExamCode,
    selectExamCode,
    leaderboardLoading,
    leaderboardData,
    leaderboardError,
    optIn,
    refetch,
    // Exposed so the exam picker can prioritise the user's own registered
    // exam(s) in its ordering — see LeaderboardClient's pill list.
    examPrep,
  };
}
