import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// POST /api/leaderboard/opt-in — same-origin proxy to the GC backend's
// POST /leaderboard/opt-in. Body: { optIn: boolean } -> { leaderboardOptIn: boolean }.
export async function POST(request: Request) {
  await requireOnboardedSession("/leaderboard");

  const body = await request.json().catch(() => null);
  const optIn = (body as { optIn?: unknown } | null)?.optIn;
  if (typeof optIn !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid optIn" }, { status: 400 });
  }

  const response = await callGcApi("/leaderboard/opt-in", {
    method: "POST",
    body: JSON.stringify({ optIn }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data || typeof (data as { leaderboardOptIn?: unknown }).leaderboardOptIn !== "boolean") {
    console.error("[api/leaderboard/opt-in] POST /leaderboard/opt-in failed or returned an unexpected shape", response.status);
    return NextResponse.json({ error: "Failed to update leaderboard opt-in" }, { status: 502 });
  }

  return NextResponse.json({ leaderboardOptIn: (data as { leaderboardOptIn: boolean }).leaderboardOptIn });
}
