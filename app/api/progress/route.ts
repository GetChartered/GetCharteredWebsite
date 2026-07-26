import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { fetchProgressData } from "@/lib/practice/fetchProgress";

// GET /api/progress — same-origin proxy to the GC backend's GET /progress
// (see lib/practice/fetchProgress.ts for the confirmed shape + parsing).
export async function GET() {
  await requireOnboardedSession("/progress");

  const data = await fetchProgressData();
  if (!data) {
    return NextResponse.json({ error: "Failed to load progress data" }, { status: 502 });
  }

  return NextResponse.json(data);
}
