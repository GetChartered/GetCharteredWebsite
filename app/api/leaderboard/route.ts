import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/practice/types";

function parseEntries(raw: unknown): LeaderboardEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: LeaderboardEntry[] = [];
  for (const e of raw) {
    const entry = e as Record<string, unknown>;
    if (typeof entry?.name !== "string" || typeof entry?.score !== "number") return null;
    entries.push({
      name: entry.name,
      score: entry.score,
      rank: typeof entry.rank === "number" ? entry.rank : undefined,
    });
  }
  return entries;
}

// GET /api/leaderboard?examKey={course}#{examCode} — same-origin proxy to
// the GC backend's GET /leaderboard, confirmed against GetChartered_app's
// components/useBackendData.tsx (fetchLeaderboard). Four response shapes,
// discriminated by optedIn/noCohort — parsed defensively, mirroring the
// app's own validation, since its code still carries "TEMP DEBUG — remove
// once the response shape is confirmed" comments (i.e. even the app team
// doesn't treat this contract as fully locked down yet).
export async function GET(request: Request) {
  await requireOnboardedSession("/leaderboard");

  const { searchParams } = new URL(request.url);
  const examKey = searchParams.get("examKey");
  if (!examKey) {
    return NextResponse.json({ error: "Missing examKey" }, { status: 400 });
  }

  const response = await callGcApi(`/leaderboard?examKey=${encodeURIComponent(examKey)}`);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error("[api/leaderboard] GET /leaderboard returned a non-OK or unparsable response", response.status);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 502 });
  }

  const optedInRaw = (data as { optedIn?: unknown }).optedIn;
  if (optedInRaw !== true && optedInRaw !== false && optedInRaw != null) {
    console.warn(
      "[api/leaderboard] unexpected `optedIn` value in /leaderboard response. Raw response:",
      JSON.stringify(data).slice(0, 2000)
    );
    return NextResponse.json({ error: "Unexpected leaderboard response shape" }, { status: 502 });
  }
  // Normalise a missing/omitted key (undefined) to the same "never decided" meaning as null.
  const optedIn: boolean | null = optedInRaw === true ? true : optedInRaw === false ? false : null;

  if (optedIn !== true) {
    const result: LeaderboardData = { optedIn };
    return NextResponse.json(result);
  }

  if ((data as { noCohort?: unknown }).noCohort === true) {
    const result: LeaderboardData = { optedIn: true, noCohort: true };
    return NextResponse.json(result);
  }

  const entries = parseEntries((data as { entries?: unknown }).entries);
  if (!entries) {
    console.warn(
      "[api/leaderboard] optedIn=true, noCohort=false but `entries` is missing or malformed. Raw response:",
      JSON.stringify(data).slice(0, 2000)
    );
    return NextResponse.json({ error: "Unexpected leaderboard response shape" }, { status: 502 });
  }

  // An empty cohort (nobody active yet) is valid — yourRank/yourScore may be
  // null/omitted rather than real numbers in that case.
  const yourRank =
    typeof (data as { yourRank?: unknown }).yourRank === "number"
      ? (data as { yourRank: number }).yourRank
      : null;
  const yourScore =
    typeof (data as { yourScore?: unknown }).yourScore === "number"
      ? (data as { yourScore: number }).yourScore
      : null;
  const cohortSize =
    typeof (data as { cohortSize?: unknown }).cohortSize === "number"
      ? (data as { cohortSize: number }).cohortSize
      : 0;

  if (entries.length > 0 && (yourRank === null || yourScore === null)) {
    console.warn(
      "[api/leaderboard] non-empty cohort but yourRank/yourScore missing — showing entries anyway, but 'your position' won't highlight correctly."
    );
  }

  const result: LeaderboardData = {
    optedIn: true,
    noCohort: false,
    entries,
    yourRank,
    yourScore,
    cohortSize,
  };
  return NextResponse.json(result);
}
