import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";
import { normaliseGcQuestion } from "@/lib/practice/normaliseQuestion";
import type { BackendPracticeMode, PracticeQuestion, RawGcQuestion } from "@/lib/practice/types";

const COURSE = "ACA";
const DEFAULT_NUM_QUESTIONS = 10;
const MAX_FETCH_ATTEMPTS = 3;
const VALID_MODES: BackendPracticeMode[] = ["quick_practice", "module", "focus_areas", "mock"];

function questionIdOf(raw: RawGcQuestion): string | null {
  const id = raw.id ?? raw.questionId ?? raw._id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

// Fetches one batch of raw questions from GetCharteredQuestions and logs the
// exact module list sent — this is the definitive record of what left this
// server for a given attempt, independent of anything logged about what came
// back (a past investigation misattributed a backend content gap to a
// request-side bug because only the *response* was ever logged).
async function fetchRawQuestionBatch(args: {
  moduleParam: string;
  mode: BackendPracticeMode;
  fetchCount: number;
  sessionId: string;
  attempt: number;
}): Promise<{ ok: true; raw: RawGcQuestion[] } | { ok: false }> {
  const { moduleParam, mode, fetchCount, sessionId, attempt } = args;

  const questionsPath = `/GetCharteredQuestions/${encodeURIComponent(COURSE)}/${encodeURIComponent(
    moduleParam
  )}/${encodeURIComponent(String(fetchCount))}?mode=${encodeURIComponent(mode)}&sessionId=${encodeURIComponent(
    sessionId
  )}`;

  const response = await callGcApi(questionsPath);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error(
      `[practice/start] attempt ${attempt}: GetCharteredQuestions failed`,
      response.status
    );
    return { ok: false };
  }

  const raw = (data as { chosenQuestions?: unknown }).chosenQuestions;
  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn(
      `[practice/start] attempt ${attempt}: no chosenQuestions in response. Raw response:`,
      JSON.stringify(data).slice(0, 2000)
    );
    return { ok: false };
  }

  const rawTyped = raw as RawGcQuestion[];
  const modulesReturned = new Set(
    rawTyped
      .map((q) => (typeof q.module === "string" ? q.module : null))
      .filter((m): m is string => m !== null)
  );
  return { ok: true, raw: rawTyped };
}

// POST /api/practice/start — fetches a practice question batch (any mode)
// and returns it pre-normalised and ordered.
// Body: { modules: string[], mode?: BackendPracticeMode, numQuestions?: number }.
export async function POST(request: Request) {
  await requireOnboardedSession("/practice");

  const body = await request.json().catch(() => null);
  const modules = Array.isArray((body as { modules?: unknown })?.modules)
    ? (body as { modules: unknown[] }).modules.filter(
        (m): m is string => typeof m === "string" && m.length > 0
      )
    : [];
  const numQuestionsRaw = (body as { numQuestions?: unknown } | null)?.numQuestions;
  const numQuestions =
    typeof numQuestionsRaw === "number" && numQuestionsRaw > 0
      ? numQuestionsRaw
      : DEFAULT_NUM_QUESTIONS;
  const modeRaw = (body as { mode?: unknown } | null)?.mode;
  const mode: BackendPracticeMode =
    typeof modeRaw === "string" && VALID_MODES.includes(modeRaw as BackendPracticeMode)
      ? (modeRaw as BackendPracticeMode)
      : "quick_practice";

  if (modules.length === 0) {
    return NextResponse.json({ error: "Select at least one module" }, { status: 400 });
  }

  const sessionId = randomUUID();
  const moduleParam = modules.join(",");
  // Over-fetch and backfill: normalisation drops some raw questions (missing
  // fields, unsupported multi-part type, ungradeable), so a single fetch of
  // exactly `numQuestions` raw questions can land short of the target. Retry
  // with a larger batch (deduped by questionId against what we already have)
  // until the target is met or MAX_FETCH_ATTEMPTS is exhausted, then serve
  // whatever was achievable rather than silently shrinking the session.
  const questions: PracticeQuestion[] = [];
  const seenQuestionIds = new Set<string>();
  let totalRawFetched = 0;
  let totalDropped = 0;
  let backendExhausted = false;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS && questions.length < numQuestions; attempt++) {
    const stillNeeded = numQuestions - questions.length;
    // First attempt pads the request a little since *some* drop-out is
    // expected; retries ask for a more generous multiple of what's still
    // needed, since a batch this size already came up short once.
    const fetchCount = attempt === 1 ? numQuestions + 5 : Math.max(stillNeeded * 3, 10);

    const batch = await fetchRawQuestionBatch({ moduleParam, mode, fetchCount, sessionId, attempt });
    if (!batch.ok) {
      // Backend call failed or returned nothing — retrying with a bigger
      // count won't fix a hard failure or an empty pool, so stop here.
      backendExhausted = true;
      break;
    }

    totalRawFetched += batch.raw.length;
    // GetCharteredQuestions already schedules the batch for this user; serve it in the order returned.
    for (const raw of batch.raw) {
      if (questions.length >= numQuestions) break;

      const rawId = questionIdOf(raw);
      if (rawId && seenQuestionIds.has(rawId)) continue; // dedupe across attempts

      const normalised = normaliseGcQuestion(raw, modules[0]);
      if (normalised) {
        if (rawId) seenQuestionIds.add(rawId);
        questions.push(normalised);
      } else {
        totalDropped += 1;
      }
    }

    if (batch.raw.length < fetchCount) {
      // The backend returned fewer than we asked for — it's likely out of
      // fresh questions for this module set, so another attempt would just
      // re-fetch the same (already-seen) questions. Stop rather than spin.
      backendExhausted = true;
      break;
    }
  }

  if (questions.length < numQuestions) {
    console.warn(
      `[practice/start] target not fully met: assembled ${questions.length}/${numQuestions} questions ` +
        `(dropped ${totalDropped} of ${totalRawFetched} raw questions fetched during normalisation` +
        `${backendExhausted ? "; stopped early because the backend had no more questions to offer" : ""}).`
    );
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No renderable questions were returned for the selected modules" },
      { status: 404 }
    );
  }

  return NextResponse.json({ sessionId, course: COURSE, mode, modules, questions });
}
