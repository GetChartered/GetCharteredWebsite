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

  console.log(
    `[practice/start] attempt ${attempt}: requesting GetCharteredQuestions with modules="${moduleParam}", mode="${mode}", fetchCount=${fetchCount}`
  );

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
  console.log(
    `[practice/start] attempt ${attempt}: GetCharteredQuestions returned ${rawTyped.length} questions covering modules: [${[...modulesReturned].join(", ")}]`
  );

  return { ok: true, raw: rawTyped };
}

// Best-effort re-ordering via /learning/priority. This endpoint hasn't been
// called from the website before this feature, so its response shape is
// treated as unverified: log it raw and fall back to fetch order on ANY
// mismatch or failure. Note also that the mobile app's real usage passes a
// synthetic reservoir-bucket string (e.g. "__MIXED__") as `module` for mixed
// practice rather than the real module list — that looks like it may not
// carry real per-module semantics backend-side. We send the actual joined
// module list instead, which is the more defensible guess, but this is
// flagged as unverified.
async function orderByPriority(args: {
  rawQuestions: RawGcQuestion[];
  moduleParam: string;
  priorityMode: "mixed" | "weak";
}): Promise<RawGcQuestion[]> {
  const { rawQuestions, moduleParam, priorityMode } = args;

  try {
    const priorityResponse = await callGcApi("/learning/priority", {
      method: "POST",
      body: JSON.stringify({
        course: COURSE,
        module: moduleParam,
        mode: priorityMode,
        limit: rawQuestions.length,
      }),
    });
    const priorityData = await priorityResponse.json().catch(() => null);

    console.log(
      "[practice/start] /learning/priority raw response:",
      priorityResponse.status,
      JSON.stringify(priorityData)?.slice(0, 2000)
    );

    const ranking = (priorityData as { questions?: unknown } | null)?.questions;
    if (!priorityResponse.ok || !Array.isArray(ranking) || ranking.length === 0) {
      console.warn(
        "[practice/start] /learning/priority returned an unexpected shape or failed — using GetCharteredQuestions order.",
        { status: priorityResponse.status }
      );
      return rawQuestions;
    }

    const byId = new Map<string, RawGcQuestion>();
    for (const q of rawQuestions) {
      const id = questionIdOf(q);
      if (id) byId.set(id, q);
    }

    const reordered: RawGcQuestion[] = [];
    for (const entry of ranking as { questionId?: unknown }[]) {
      const id = entry?.questionId;
      if (typeof id === "string") {
        const match = byId.get(id);
        if (match && !reordered.includes(match)) reordered.push(match);
      }
    }
    // Never drop questions the ranking didn't mention.
    for (const q of rawQuestions) {
      if (!reordered.includes(q)) reordered.push(q);
    }

    return reordered.length > 0 ? reordered : rawQuestions;
  } catch (err) {
    console.warn(
      "[practice/start] /learning/priority call threw — using GetCharteredQuestions order.",
      err
    );
    return rawQuestions;
  }
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
  // Priority-ranking mode is distinct from the backend practice mode: only
  // Focus Areas asks the learning engine to weight toward weak spots, mirroring
  // the mobile app's `mode === "focus" ? "weak" : "mixed"`.
  const priorityMode: "mixed" | "weak" = mode === "focus_areas" ? "weak" : "mixed";

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
    const orderedRaw = await orderByPriority({ rawQuestions: batch.raw, moduleParam, priorityMode });

    for (const raw of orderedRaw) {
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
