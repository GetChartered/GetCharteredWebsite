"use client";

import { useCallback, useEffect, useState } from "react";

// Shared preferences for practice sessions (all 5 modes), mirroring
// GetChartered_app's hooks/usePracticePreferences.ts — same three toggles,
// same defaults. The app persists to AsyncStorage (survives across app
// sessions); localStorage is the direct web equivalent, so preferences
// persist across visits here too rather than resetting every session.

const STORAGE_KEY_SHOW_EXPLANATIONS = "practice:showExplanations";
const STORAGE_KEY_SHOW_CORRECT_FLASH = "practice:showCorrectFlash";
const STORAGE_KEY_SHUFFLE_ORDER = "practice:shuffleOrder";

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

export function usePracticePreferences() {
  // Lazy initializers read localStorage on first render (client only —
  // guarded above) instead of a mount effect, so the very first render
  // already reflects a returning user's saved choices.
  //
  // Default true, deliberately NOT matching the app's own default (false):
  // the website's QuestionCard has always shown the explanation after
  // answering, with no toggle at all until now — defaulting this new
  // preference to false would silently hide something every existing user
  // already sees. Defaulting to true preserves current behaviour for
  // everyone and still gives anyone who wants a cleaner un-annotated pass a
  // way to turn it off.
  const [showExplanations, setShowExplanationsState] = useState(() =>
    readBool(STORAGE_KEY_SHOW_EXPLANATIONS, true)
  );
  const [showCorrectFlash, setShowCorrectFlashState] = useState(() =>
    readBool(STORAGE_KEY_SHOW_CORRECT_FLASH, true)
  );
  const [shuffleOrder, setShuffleOrderState] = useState(() =>
    readBool(STORAGE_KEY_SHUFFLE_ORDER, false)
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_SHOW_EXPLANATIONS, String(showExplanations));
  }, [showExplanations]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_SHOW_CORRECT_FLASH, String(showCorrectFlash));
  }, [showCorrectFlash]);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_SHUFFLE_ORDER, String(shuffleOrder));
  }, [shuffleOrder]);

  const toggleShowExplanations = useCallback(() => setShowExplanationsState((v) => !v), []);
  const toggleShowCorrectFlash = useCallback(() => setShowCorrectFlashState((v) => !v), []);
  const toggleShuffleOrder = useCallback(() => setShuffleOrderState((v) => !v), []);

  return {
    showExplanations,
    setShowExplanations: setShowExplanationsState,
    toggleShowExplanations,
    showCorrectFlash,
    setShowCorrectFlash: setShowCorrectFlashState,
    toggleShowCorrectFlash,
    shuffleOrder,
    setShuffleOrder: setShuffleOrderState,
    toggleShuffleOrder,
  };
}
