import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// POST /api/feedback — same-origin proxy to the GC backend's POST /feedback
// (see GetChartered_app's backend/feedbackLambda). Shared with the app —
// both feed one table, tagged by `source` below.
//
// Requires a session (requireOnboardedSession below). Opened as a modal
// from anywhere on the site (components/FeedbackForm.tsx, via
// Navigation.tsx), tied to the submitting user's account.
export async function POST(request: Request) {
  await requireOnboardedSession("/my-account");

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const { category, message } = body as { category?: unknown; message?: unknown };
  if (typeof category !== "string" || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "category and message are required" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await callGcApi("/feedback", {
      method: "POST",
      body: JSON.stringify({
        category,
        message,
        source: "website",
        area: typeof (body as { area?: unknown }).area === "string" ? (body as { area: string }).area : undefined,
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
