import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { deleteExamPrepEntry, fetchExamPrepData, postExamPrepEntry } from "@/lib/practice/examPrepServer";

// GET /api/exam-prep — same-origin proxy to the GC backend's GET /exam-prep.
// Returns { examPrep: ExamPrepEntry[] }, the user's full exam-prep list
// (confirmed against GetChartered_app's fetchExamPrep). Consumed by the My
// Exams form (app/my-account) and the leaderboard's default-exam selection.
export async function GET() {
  await requireOnboardedSession("/my-account");

  const examPrep = await fetchExamPrepData();
  if (examPrep === null) {
    return NextResponse.json({ error: "Failed to load exam-prep data" }, { status: 502 });
  }

  return NextResponse.json({ examPrep });
}

// POST /api/exam-prep — same-origin proxy to the GC backend's POST
// /exam-prep. Body: { course, examCode, examDate?, isPrimary?, year?,
// session? } — examDate/isPrimary are optional since the leaderboard's own
// "just register cohort membership" call site doesn't always have them (see
// hooks/useLeaderboard.ts), but the My Exams form always sends both. The
// backend upserts by (course, examCode), same as the app's setExamPrep.
export async function POST(request: Request) {
  await requireOnboardedSession("/leaderboard");

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const course = body?.course;
  const examCode = body?.examCode;
  if (typeof course !== "string" || !course || typeof examCode !== "string" || !examCode) {
    return NextResponse.json({ error: "Missing course or examCode" }, { status: 400 });
  }

  const examDate = typeof body?.examDate === "string" ? body.examDate : undefined;
  const isPrimary = typeof body?.isPrimary === "boolean" ? body.isPrimary : undefined;
  const year = typeof body?.year === "number" ? body.year : undefined;
  const session = typeof body?.session === "string" ? body.session : undefined;

  const result = await postExamPrepEntry({ course, examCode, examDate, isPrimary, year, session });
  if (!result.ok) {
    return NextResponse.json({ error: "Failed to register exam" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, examPrep: result.examPrep });
}

// DELETE /api/exam-prep — same-origin proxy to the GC backend's new DELETE
// /exam-prep. Body: { course, examCode } — removes that single entry.
// Required plumbing for hooks/useExamPrep.ts's deleteExamPrep (a client
// component can't call lib/gcApi.ts's callGcApi directly — it's
// server-only), not itemized separately in the request that added this
// route but necessary for that hook method to reach the backend at all.
export async function DELETE(request: Request) {
  await requireOnboardedSession("/my-account");

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const course = body?.course;
  const examCode = body?.examCode;
  if (typeof course !== "string" || !course || typeof examCode !== "string" || !examCode) {
    return NextResponse.json({ error: "Missing course or examCode" }, { status: 400 });
  }

  const result = await deleteExamPrepEntry({ course, examCode });
  if (!result.ok) {
    return NextResponse.json({ error: "Failed to remove exam" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, examPrep: result.examPrep });
}
