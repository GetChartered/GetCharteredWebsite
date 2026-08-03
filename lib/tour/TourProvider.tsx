"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { TOUR_STEPS, type TourStep } from "@/lib/tour/tourConfig";

export type TourStatus = "not_started" | "in_progress" | "skipped" | "completed";

export type TourState = {
  status: TourStatus;
  stepIndex: number;
};

const DEFAULT_STATE: TourState = { status: "not_started", stepIndex: 0 };

// Versioned so a future shape change (e.g. adding fields) can detect and
// discard an old-shaped value instead of trusting it blindly — same idea as
// GetChartered_app's `onboardingTourState::v1` AsyncStorage key.
//
// This is localStorage-only for now (per-browser, not per-account) —
// deliberately NOT stored in Auth0 user_metadata, which is being phased out
// for this kind of data (see lib/auth0-management.ts / lib/profile.ts: user
// data is moving to the backend-Lambda/DynamoDB-backed /profile endpoint,
// e.g. the existing `onboardingCompleted` field there). If cross-device tour
// resume is ever wanted, the right home for it is a new field on that same
// DynamoDB users table (same pattern as onboardingCompleted), synced through
// GET/POST /profile — not Auth0 metadata, and not implemented here.
const STORAGE_KEY = "tourState:v1";

function readPersistedState(): TourState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<TourState>;
    const validStatus: TourStatus[] = ["not_started", "in_progress", "skipped", "completed"];
    if (
      typeof parsed.stepIndex === "number" &&
      typeof parsed.status === "string" &&
      (validStatus as string[]).includes(parsed.status)
    ) {
      return { status: parsed.status as TourStatus, stepIndex: parsed.stepIndex };
    }
    return DEFAULT_STATE;
  } catch {
    // Storage unavailable (privacy mode, quota, etc.) or malformed JSON —
    // fall back to a fresh tour rather than throwing.
    return DEFAULT_STATE;
  }
}

function writePersistedState(state: TourState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort — a user who can't persist just replays the tour next
    // session, which is a fine degradation, not worth surfacing an error for.
  }
}

type TourContextValue = {
  status: TourStatus;
  stepIndex: number;
  /** TOUR_STEPS[stepIndex] while in_progress, else null. */
  currentStep: TourStep | null;
  /** Starts (or restarts) the tour from the first step. */
  start: () => void;
  /** Advances to the next step, or to "completed" from the last step. */
  next: () => void;
  /** Stops showing the tour but remembers stepIndex — resumable, not reset. */
  skip: () => void;
  /** Resumes a previously-skipped tour from where it left off. No-op unless status is "skipped". */
  resume: () => void;
};

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  // Deterministic default for the server-rendered/first-client-render pass
  // (no window on the server) — matches DEFAULT_STATE so there's nothing to
  // reconcile/mismatch; the real persisted value (if any) is read after
  // mount below, same "mount -> useEffect -> read browser state" shape used
  // elsewhere in this codebase (e.g. the theme no-flash script's approach to
  // not trusting anything DOM/storage-dependent before hydration).
  const [state, setState] = useState<TourState>(DEFAULT_STATE);
  const hasHydrated = useRef(false);

  useEffect(() => {
    // localStorage genuinely isn't available until after mount, and this
    // needs to run exactly once — the textbook case react-hooks/set-state-in-effect
    // otherwise warns against (compare QuestionCard.tsx's precedent for the
    // same kind of deliberate, understood exception to this lint rule).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readPersistedState());
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    // Skip the very first write: it would just re-save the default state we
    // haven't hydrated from storage yet, potentially clobbering a real
    // persisted value if this effect somehow ran before the hydration one.
    if (!hasHydrated.current) return;
    writePersistedState(state);
  }, [state]);

  // Memoized so TourOverlay's resolution effect (which depends on `next`)
  // doesn't re-run every time TourProvider re-renders for an unrelated
  // reason — only when the underlying logic could actually behave
  // differently, which for all four of these is never (they only close over
  // setState, whose identity is itself stable).
  const start = useCallback(() => setState({ status: "in_progress", stepIndex: 0 }), []);

  const next = useCallback(
    () =>
      setState((prev) => {
        if (prev.status !== "in_progress") return prev;
        const nextIndex = prev.stepIndex + 1;
        if (nextIndex >= TOUR_STEPS.length) {
          return { status: "completed", stepIndex: prev.stepIndex };
        }
        return { status: "in_progress", stepIndex: nextIndex };
      }),
    []
  );

  const skip = useCallback(
    () => setState((prev) => (prev.status === "in_progress" ? { ...prev, status: "skipped" } : prev)),
    []
  );

  const resume = useCallback(
    () => setState((prev) => (prev.status === "skipped" ? { ...prev, status: "in_progress" } : prev)),
    []
  );

  const currentStep = state.status === "in_progress" ? (TOUR_STEPS[state.stepIndex] ?? null) : null;

  return (
    <TourContext.Provider
      value={{ status: state.status, stepIndex: state.stepIndex, currentStep, start, next, skip, resume }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
}
