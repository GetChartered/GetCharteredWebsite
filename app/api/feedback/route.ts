import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// Same allow-lists as backend/feedbackLambda's ALLOWED_CATEGORIES/AREAS and
// FeedbackForm.tsx's CATEGORIES/AREAS — keep all three in sync.
const ALLOWED_CATEGORIES = ["bug", "feature", "general"];
const ALLOWED_AREAS = ["general", "practice", "progress", "planner", "leaderboard", "profile"];
const MAX_MESSAGE_LENGTH = 4000;

// POST /api/feedback — same-origin proxy to the GC backend's POST /feedback
// (see GetChartered_app's backend/feedbackLambda). Shared with the app —
// both feed one table, tagged by `source` below.
//
// requireSession (not requireOnboardedSession) — the Feedback link in
// Navigation.tsx shows for any logged-in user, including mid-onboarding, so
// this only needs a session to match, not a completed profile.
export async function POST(request: Request) {
  await requireSession("/my-account");

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const { category, message, area } = body as { category?: unknown; message?: unknown; area?: unknown };

  if (typeof category !== "string" || !ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "category and message are required" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 });
  }

  if (area !== undefined && (typeof area !== "string" || !ALLOWED_AREAS.includes(area))) {
    return NextResponse.json({ error: "Invalid area" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await callGcApi("/feedback", {
      method: "POST",
      body: JSON.stringify({
        category,
        message,
        source: "website",
        area,
      }),
    });
  } catch (error) {
    console.error("[POST /api/feedback] callGcApi threw", error);
    return NextResponse.json({ error: "Couldn't send feedback" }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !(data as { ok?: boolean } | null)?.ok) {
    console.error("[POST /api/feedback] backend returned non-OK", response.status, data);
    return NextResponse.json({ error: "Couldn't send feedback" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, feedbackId: (data as { feedbackId: string }).feedbackId });
}
