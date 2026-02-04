"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

  useEffect(() => {
    // Check if localStorage is available
    setIsStorageAvailable(isLocalStorageAvailable());

    // Sync with theme set by noflash.js
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark" || currentTheme === "light") {
      setThemeState(currentTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

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
