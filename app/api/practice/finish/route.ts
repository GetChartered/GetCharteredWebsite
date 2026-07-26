import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";
import type { AttemptPayload, BackendPracticeMode } from "@/lib/practice/types";

const VALID_MODES: BackendPracticeMode[] = ["quick_practice", "module", "focus_areas", "mock"];

// POST /api/practice/finish — records a completed practice session's
// attempts in one batch call (any mode).
// Body: { sessionId: string, mode?: BackendPracticeMode, attempts: AttemptPayload[] }.
export async function POST(request: Request) {
  await requireOnboardedSession("/practice");

  const body = await request.json().catch(() => null);
  const sessionId =
    typeof (body as { sessionId?: unknown })?.sessionId === "string"
      ? (body as { sessionId: string }).sessionId
      : null;
  const attempts = Array.isArray((body as { attempts?: unknown })?.attempts)
    ? ((body as { attempts: AttemptPayload[] }).attempts)
    : null;
  const modeRaw = (body as { mode?: unknown } | null)?.mode;
  const mode: BackendPracticeMode =
    typeof modeRaw === "string" && VALID_MODES.includes(modeRaw as BackendPracticeMode)
      ? (modeRaw as BackendPracticeMode)
      : "quick_practice";

  if (!sessionId || !attempts || attempts.length === 0) {
    return NextResponse.json({ error: "Missing sessionId or attempts" }, { status: 400 });
  }

  const response = await callGcApi("/analytics/attempt", {
    method: "POST",
    body: JSON.stringify({
      course: "ACA",
      mode,
      sessionId,
      attempts,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[practice/finish] /analytics/attempt failed", response.status, data);
    return NextResponse.json({ error: "Failed to record attempts" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, ...(data && typeof data === "object" ? data : {}) });
}
