// Ported from GetChartered_app's StudyPlanner/hooks/useStudySessions.ts —
// this hook was already plain React with no RN-specific API beyond the
// repository import. Now backed by the real study-sessions API (see
// lib/studyPlanner/apiRepository.ts) instead of localStorage — the app's
// equivalent hook was swapped the same way, both against the same backend,
// so a session added on one now shows up on the other.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createStudySessionApiRepository } from "@/lib/studyPlanner/apiRepository";
import {
  markStudySessionCompleted,
  saveStudySession,
  updateStudySession,
  type CreateStudySessionDependencies,
} from "@/lib/studyPlanner/studySessionService";
import type { StudySession, StudySessionDraft, StudySessionFilters } from "@/lib/studyPlanner/types";

const DEFAULT_FILTERS: StudySessionFilters = {};

export function useStudySessions(filters: StudySessionFilters = DEFAULT_FILTERS) {
  const repository = useMemo(() => createStudySessionApiRepository(), []);
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(
    () => JSON.parse(filtersKey) as StudySessionFilters,
    [filtersKey]
  );
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await repository.listSessions(stableFilters));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load study sessions"));
    } finally {
      setLoading(false);
    }
  }, [repository, stableFilters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSession = useCallback(
    async (draft: StudySessionDraft, deps: CreateStudySessionDependencies) => {
      const session = await saveStudySession(repository, draft, deps);
      await refresh();
      return session;
    },
    [refresh, repository]
  );

  const completeSession = useCallback(
    async (session: StudySession, completedAt = new Date()) => {
      const completed = await repository.saveSession(markStudySessionCompleted(session, completedAt));
      await refresh();
      return completed;
    },
    [refresh, repository]
  );

  const editSession = useCallback(
    async (session: StudySession, changes: Partial<StudySessionDraft>, updatedAt = new Date()) => {
      const updated = await repository.saveSession(updateStudySession(session, changes, updatedAt));
      await refresh();
      return updated;
    },
    [refresh, repository]
  );

  const deleteSession = useCallback(
    async (id: string) => {
      await repository.deleteSession(id);
      await refresh();
    },
    [refresh, repository]
  );

  return {
    sessions,
    loading,
    error,
    refresh,
    createSession,
    completeSession,
    editSession,
    deleteSession,
    repository,
  };
}
