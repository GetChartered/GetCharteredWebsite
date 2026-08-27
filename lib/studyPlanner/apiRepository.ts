// Real backend-backed StudySessionRepository — replaces localRepository.ts.
// Talks to this site's own /api/study-sessions routes (same-origin proxy to
// the GC backend, see app/api/study-sessions/route.ts), not the AWS API
// Gateway directly — the access token stays server-side, matching every
// other authenticated fetch this site does (see lib/gcApi.ts).
//
// Filtering/sorting stays client-side via sessionQueries.ts, same as the
// old local repository — GET /api/study-sessions returns the caller's full
// unfiltered list.
import { filterStudySessions, sortStudySessions } from "./sessionQueries";
import type {
  StudySession,
  StudySessionFilters,
  StudySessionRepository,
} from "./types";

export function createStudySessionApiRepository(): StudySessionRepository {
  return {
    async listSessions(filters: StudySessionFilters = {}) {
      const res = await fetch("/api/study-sessions", { method: "GET" });
      if (!res.ok) return [];
      const data = await res.json().catch(() => null);
      const sessions = Array.isArray(data?.sessions) ? (data.sessions as StudySession[]) : [];
      return sortStudySessions(filterStudySessions(sessions, filters));
    },

    async getSession(id: string) {
      const res = await fetch("/api/study-sessions", { method: "GET" });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const sessions = Array.isArray(data?.sessions) ? (data.sessions as StudySession[]) : [];
      return sessions.find((session) => session.id === id) ?? null;
    },

    async saveSession(session: StudySession) {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Couldn't save study session");
      }
      return data.session as StudySession;
    },

    async deleteSession(id: string) {
      const res = await fetch(`/api/study-sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Couldn't delete study session");
    },
  };
}
