// Browser localStorage equivalent of the app's
// StudyPlanner/storage/studySessionLocalRepository.ts (AsyncStorage-backed).
// Same schema-versioned envelope, same filter/sort helpers — the only
// change from the app's version is the storage primitive.
//
// IMPORTANT — this is NOT synced with the app's planner. The app's planner
// data lives in that device's AsyncStorage; this lives in this browser's
// localStorage. There is currently no backend for study-planner data at
// all (confirmed against the app's source — the repository never calls the
// API), so "my plan on the app" and "my plan on the website" are two
// independent local stores until a real shared backend exists. Worth
// flagging to Pierce/Hugo before this ships as more than a v1 — the fix
// would be a StudySessionRepository implementation backed by a real
// endpoint, which every consumer here (the hook, the UI) is already
// written against and wouldn't need to change for.
import { filterStudySessions, sortStudySessions } from "./sessionQueries";
import type {
  StudySession,
  StudySessionFilters,
  StudySessionRepository,
} from "./types";

const STORAGE_KEY = "gc_website_study_planner_sessions_v1";

type StoredStudySessions = {
  schemaVersion: 1;
  sessions: StudySession[];
};

const emptyStore: StoredStudySessions = {
  schemaVersion: 1,
  sessions: [],
};

function readStore(): StoredStudySessions {
  if (typeof window === "undefined") return emptyStore;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore;

  try {
    const parsed = JSON.parse(raw) as StoredStudySessions;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.sessions)) return emptyStore;
    return parsed;
  } catch {
    return emptyStore;
  }
}

function writeStore(store: StoredStudySessions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createStudySessionLocalRepository(): StudySessionRepository {
  return {
    async listSessions(filters: StudySessionFilters = {}) {
      const store = readStore();
      return sortStudySessions(filterStudySessions(store.sessions, filters));
    },

    async getSession(id: string) {
      const store = readStore();
      return store.sessions.find((session) => session.id === id) ?? null;
    },

    async saveSession(session: StudySession) {
      const store = readStore();
      const nextSessions = store.sessions.filter((existing) => existing.id !== session.id);
      nextSessions.push(session);
      writeStore({ schemaVersion: 1, sessions: sortStudySessions(nextSessions) });
      return session;
    },

    async deleteSession(id: string) {
      const store = readStore();
      writeStore({
        schemaVersion: 1,
        sessions: store.sessions.filter((session) => session.id !== id),
      });
    },
  };
}
