import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";
import type { AttemptPayload, BackendPracticeMode } from "@/lib/practice/types";
import { logPracticeCompletionRetrospectively } from "@/lib/studyPlanner/retrospectiveLogging";
import { isLocalDateString } from "@/lib/studyPlanner/calendarUtils";
import type { LocalDateString, LocalTimeString } from "@/lib/studyPlanner/types";

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
  // Optional: the client's own local date + 15-min-bucketed local time for
  // this completion, used to retrospectively log it on the study planner
  // calendar (see logPracticeCompletionRetrospectively below). Computed
  // client-side since the server doesn't know the caller's timezone.
  const localDateRaw = (body as { localDate?: unknown } | null)?.localDate;
  const localDate: LocalDateString | null =
    typeof localDateRaw === "string" && isLocalDateString(localDateRaw)
      ? (localDateRaw as LocalDateString)
      : null;
  const localTimeRaw = (body as { localTime?: unknown } | null)?.localTime;
  const localTime: LocalTimeString | null =
    typeof localTimeRaw === "string" && /^\d{2}:\d{2}$/.test(localTimeRaw)
      ? (localTimeRaw as LocalTimeString)
      : null;

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

  // Best-effort retrospective calendar logging -- never let a failure here
  // fail the actual attempt-recording call above, which already succeeded.
  if (localDate && localTime) {
    try {
      await logPracticeCompletionRetrospectively({ mode, attempts, localDate, startTime: localTime });
    } catch (error) {
      console.error("[practice/finish] retrospective calendar logging failed", error);
    }
  }

  return NextResponse.json({ ok: true, ...(data && typeof data === "object" ? data : {}) });
}
