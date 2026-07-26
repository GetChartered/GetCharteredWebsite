import { callGcApi } from "@/lib/gcApi";
import { parseExamPrepData } from "@/lib/practice/examPrep";
import type { ExamPrepEntry } from "@/lib/practice/types";

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
