import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

// POST /api/stripe/checkout — same-origin proxy to the GC backend's POST
// /stripe/checkout (Lambda stripeCreateCheckoutSession). Body: { plan:
// "monthly" | "annual" | "per_exam", examId?: string } — examId is required
// only for plan "per_exam" (which exam paper is being unlocked; the Lambda
// rejects the request without it). Returns { url } — the caller redirects
// the browser there (a real Stripe-hosted Checkout page), same pattern as
// every other proxy route in this directory (see app/api/user/photo/route.ts).
//
// This supersedes the older app/api/checkout_sessions/route.js, which posted
// straight to Stripe from this app with no plan selection and a webhook that
// never wrote anywhere — see claude/launch-todo-list.md item 9 for why that
// one was retired rather than finished.
export async function POST(request: Request) {
  await requireOnboardedSession("/my-account");

  const body = (await request.json().catch(() => null)) as
    | { plan?: unknown; examId?: unknown }
    | null;
  const plan = body?.plan;
  if (plan !== "monthly" && plan !== "annual" && plan !== "per_exam") {
    return NextResponse.json({ error: "Invalid or missing plan" }, { status: 400 });
  }

  const examId = typeof body?.examId === "string" ? body.examId : undefined;
  if (plan === "per_exam" && !examId) {
    return NextResponse.json({ error: "examId is required for the per_exam plan" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await callGcApi("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, ...(examId ? { examId } : {}) }),
    });
  } catch (error) {
    console.error("[POST /api/stripe/checkout] callGcApi threw", error);
    return NextResponse.json(
      { error: "Checkout isn't available right now — please try again later." },
      { status: 502 }
    );
  }

  const data = await response.json().catch(() => null);
  const url = (data as { url?: unknown } | null)?.url;

  if (!response.ok || typeof url !== "string" || !url) {
    console.error("[POST /api/stripe/checkout] backend returned a non-OK or unexpected response", response.status, data);
    return NextResponse.json(
      { error: "Checkout isn't available right now — please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url });
}
