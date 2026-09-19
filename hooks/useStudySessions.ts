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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    refresh();
  }, [refresh]);

  const createSession = useCallback(
    async (
      draft: StudySessionDraft,
      deps: CreateStudySessionDependencies,
      options?: { skipRefresh?: boolean }
    ) => {
      const session = await saveStudySession(repository, draft, deps);
      // A recurring plan creates many sessions in one go (see
      // PlannerClient.save) -- refetching the full list after every single
      // one made the UI visibly glitch past a handful of entries
      // (2026-09-13, Pierce). Callers doing a batch pass skipRefresh and
      // refresh once at the end instead.
      if (!options?.skipRefresh) await refresh();
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

  // Deletes every session sharing one recurrenceGroupId in one go (2026-09-13,
  // Pierce: a recurring plan can spawn up to 56 occurrences, and deleting
  // them one at a time is exactly the tedium this exists to avoid). Same
  // batched-then-refresh-once shape as the recurring create path.
  const DELETE_CONCURRENCY = 8;
  const deleteSessionsByIds = useCallback(
    async (ids: string[]) => {
      for (let i = 0; i < ids.length; i += DELETE_CONCURRENCY) {
        const batch = ids.slice(i, i + DELETE_CONCURRENCY);
        await Promise.all(batch.map((id) => repository.deleteSession(id)));
      }
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
    deleteSessionsByIds,
    repository,
  };
}
