"use client";

import React, {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isStorageAvailable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Check if localStorage is available and writable
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__theme_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save theme preference with fallback to sessionStorage
 */
function saveTheme(theme: Theme): boolean {
  // Try localStorage first
  try {
    localStorage.setItem("theme", theme);
    return true;
  } catch (err) {
    console.warn("localStorage unavailable, falling back to sessionStorage:", err);

    // Fallback to sessionStorage
    try {
      sessionStorage.setItem("theme", theme);
      return false; // Indicate that we're using fallback storage
    } catch (sessionErr) {
      console.error("Both localStorage and sessionStorage are unavailable:", sessionErr);
      return false;
    }
  }
}

/**
 * Read the current theme from the <html data-theme> attribute, which is set by
 * noflash.js before hydration and updated by setTheme below.
 */
function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Subscribe to theme changes by observing the data-theme attribute. This makes
 * the DOM attribute the single source of truth, so reading it via
 * useSyncExternalStore avoids both hydration mismatches and setState-in-effect.
 */
function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    // Server snapshot: match noflash.js's default so hydration is consistent.
    () => "light" as Theme,
  );
  const [isStorageAvailable, setIsStorageAvailable] = useState(() =>
    isLocalStorageAvailable(),
  );

  const setTheme = (newTheme: Theme) => {
    // Update the DOM attribute — useSyncExternalStore's observer re-reads it.
    document.documentElement.setAttribute("data-theme", newTheme);

    // Save to storage with fallback mechanism
    const savedToLocalStorage = saveTheme(newTheme);

    // Update storage availability status if localStorage failed
    if (!savedToLocalStorage) {
      setIsStorageAvailable(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isStorageAvailable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
