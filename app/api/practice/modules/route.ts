import { NextResponse } from "next/server";
import { requireOnboardedSession } from "@/lib/auth0";
import { fetchAcaCourseData } from "@/lib/practice/courses";
import type { PracticeExamGroup } from "@/lib/practice/types";

// GET /api/practice/modules — same-origin proxy to the GC backend's /courses
// endpoint, grouped by exam for ACA (the only course with a live question
// bank right now).
export async function GET() {
  await requireOnboardedSession("/practice");

  const data = await fetchAcaCourseData();
  if (!data) {
    return NextResponse.json({ error: "Failed to load modules" }, { status: 502 });
  }

  return NextResponse.json({
    exams: data.exams satisfies PracticeExamGroup[],
    moduleQuestionCounts: data.moduleQuestionCounts,
  });
}
