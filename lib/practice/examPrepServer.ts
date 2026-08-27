import { callGcApi } from "@/lib/gcApi";
import { parseExamPrepData } from "@/lib/practice/examPrep";
import type { ExamLevel, ExamPrepEntry } from "@/lib/practice/types";

/**
 * Fetches + parses GET /exam-prep, confirmed against GetChartered_app's
 * components/useBackendData.tsx (fetchExamPrep). Shared by the /api/exam-prep
 * route (client-side fetch) and any Server Component that wants a user's
 * real exam sitting directly (e.g. the Progress page's Next Exam tile),
 * matching the pattern lib/practice/fetchProgress.ts's fetchProgressData
 * already established.
 */
export async function fetchExamPrepData(): Promise<ExamPrepEntry[] | null> {
  const response = await callGcApi("/exam-prep");
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error("[fetchExamPrepData] GET /exam-prep returned a non-OK or unparsable response", response.status);
    return null;
  }

  return parseExamPrepData((data as { examPrep?: unknown }).examPrep);
}

export interface PostExamPrepParams {
  course: string;
  examCode: string;
  year?: number;
  session?: string;
  examDate?: string;
  isPrimary?: boolean;
  /** Result fields — see lib/practice/types.ts's ExamPrepEntry for the
   *  contract, and backend-reference/updateExamResult.md for the (not yet
   *  deployed) backend change these need. Sent as-is; the real backend
   *  currently ignores them entirely rather than rejecting the request. */
  sat?: boolean;
  gradePercent?: number | null;
  examLevel?: ExamLevel;
}

export type PostExamPrepResult =
  | { ok: true; examPrep: ExamPrepEntry[] }
  | { ok: false; status: number };

/** POST /exam-prep — the backend upserts by (course, examCode), same as the
 *  app's own setExamPrep. Returns the user's full updated exam-prep list. */
export async function postExamPrepEntry(params: PostExamPrepParams): Promise<PostExamPrepResult> {
  const response = await callGcApi("/exam-prep", {
    method: "POST",
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[postExamPrepEntry] POST /exam-prep failed", response.status, data);
    return { ok: false, status: response.status };
  }

  return { ok: true, examPrep: parseExamPrepData((data as { examPrep?: unknown } | null)?.examPrep) };
}

export interface DeleteExamPrepParams {
  course: string;
  examCode: string;
}

export type DeleteExamPrepResult =
  | { ok: true; examPrep: ExamPrepEntry[] }
  | { ok: false; status: number };

/** DELETE /exam-prep — removes a single (course, examCode) entry
 *  server-side, same (course, examCode) composite POST already upserts by.
 *  Mirrors postExamPrepEntry's shape: same callGcApi usage, same
 *  ok/status error handling, and the response is assumed to carry the same
 *  { examPrep: [...] } full-list shape GET/POST already return (that
 *  assumption isn't independently verified against a live response the way
 *  the rest of this file's shapes were — see MyExamsSection's Save flow,
 *  which deliberately doesn't depend on this response's exact shape for
 *  correctness: it tracks the post-delete state itself and only uses this
 *  call's success/failure, not its body). */
export async function deleteExamPrepEntry(params: DeleteExamPrepParams): Promise<DeleteExamPrepResult> {
  const response = await callGcApi("/exam-prep", {
    method: "DELETE",
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[deleteExamPrepEntry] DELETE /exam-prep failed", response.status, data);
    return { ok: false, status: response.status };
  }

  return { ok: true, examPrep: parseExamPrepData((data as { examPrep?: unknown } | null)?.examPrep) };
}
