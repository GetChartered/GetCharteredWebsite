import type { ModuleStat } from "@/lib/practice/types";

const MIN_ANSWERED = 5;

/**
 * Ranks modules by accuracy ascending (weakest first), among those with
 * enough answered questions to be a meaningful signal. Pure — no randomness;
 * mirrors GetChartered_app's hooks/useProgressTracking.ts `selectWeakModules`.
 * Callers fill any remaining slots (e.g. a brand-new user with no history)
 * with a random pick from the full module list.
 */
export function rankWeakModules(moduleStats: ModuleStat[], courseCode: string, count: number): string[] {
  return moduleStats
    .filter((m) => m.course === courseCode && m.totalAnswered >= MIN_ANSWERED)
    .map((m) => ({ code: m.module, accuracy: m.totalCorrect / m.totalAnswered }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count)
    .map((m) => m.code);
}
