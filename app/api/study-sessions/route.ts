import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// GET /api/study-sessions — same-origin proxy to the GC backend's
// GET /study-sessions (see backend-reference-equivalent Lambda `studySessions`).
// Returns the caller's full unfiltered session list; client-side
// lib/studyPlanner/sessionQueries.ts filters/sorts it, same as the old
// localStorage repository did.
export async function GET() {
  await requireOnboardedSession("/planner");

  let response: Response;
  try {
    response = await callGcApi("/study-sessions", { method: "GET" });
  } catch (error) {
    console.error("[GET /api/study-sessions] callGcApi threw", error);
    return NextResponse.json({ sessions: [] }, { status: 502 });
  }

  if (!response.ok) {
    console.error("[GET /api/study-sessions] backend returned non-OK", response.status);
    return NextResponse.json({ sessions: [] }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  const sessions = Array.isArray((data as { sessions?: unknown })?.sessions)
    ? (data as { sessions: unknown[] }).sessions
    : [];

  return NextResponse.json({ sessions });
}

// POST /api/study-sessions — upsert one session. Body: a StudySession
// (lib/studyPlanner/types.ts) — forwarded to the backend as-is; the Lambda
// takes userId from the verified JWT, not from the body.
export async function POST(request: Request) {
  await requireOnboardedSession("/planner");

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await callGcApi("/study-sessions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("[POST /api/study-sessions] callGcApi threw", error);
    return NextResponse.json({ error: "Couldn't save session" }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !(data as { ok?: boolean } | null)?.ok) {
    console.error("[POST /api/study-sessions] backend returned non-OK", response.status, data);
    return NextResponse.json({ error: "Couldn't save session" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, session: (data as { session: unknown }).session });
}
