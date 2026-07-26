"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProgressData } from "@/lib/practice/types";

/** Fetches GET /api/progress. Shared by Focus Areas (weak-module ranking) and the Progress dashboard. */
export function useProgressData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (): Promise<
    { ok: true; data: ProgressData } | { ok: false; error: string }
  > => {
    try {
      const res = await fetch("/api/progress");
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        return { ok: false, error: "Couldn't load your progress data." };
      }
      return { ok: true, data: json as ProgressData };
    } catch {
      return { ok: false, error: "Couldn't load your progress data." };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchProgress().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProgress]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    void fetchProgress().then((result) => {
      if (result.ok) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [fetchProgress]);

  return { loading, data, error, retry };
}
