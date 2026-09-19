import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { fetchExamPrepData } from "@/lib/practice/examPrepServer";
import { fetchAcaCourseData } from "@/lib/practice/courses";
import { PlannerClient } from "@/components/planner/PlannerClient";

export const metadata = {
  title: "Study Planner",
  description: "Plan your study sessions and stay on track.",
};


const COURSE_ID = "ACA";

export default async function PlannerPage() {
  await requireOnboardedSession("/planner");

  const [examPrep, courseData] = await Promise.all([
    fetchExamPrepData().catch(() => null),
    fetchAcaCourseData().catch(() => null),
  ]);

  const examNameByCode = new Map((courseData?.exams ?? []).map((exam) => [exam.code, exam.name]));
  const seenCodes = new Set<string>();
  const examOptions = (examPrep ?? [])
    .filter((entry) => {
      if (seenCodes.has(entry.examCode)) return false;
      seenCodes.add(entry.examCode);
      return true;
    })
    .map((entry) => ({
      code: entry.examCode,
      name: examNameByCode.get(entry.examCode) ?? entry.examCode,
    }));

  const examDateByCode: Record<string, string> = {};
  (examPrep ?? []).forEach((entry) => {
    if (entry.examDate) examDateByCode[entry.examCode] = entry.examDate;
  });

  // Module scoping for the Add Study Session modal (2026-09-13, Pierce):
  // modules must only ever be drawn from the exams the USER is actually
  // doing (examOptions, from their own examPrep entries) -- not the whole
  // ACA course catalogue (courseData.exams spans every ACA exam, most of
  // which this user isn't sitting). Scope courseData's exams down to just
  // the ones in examOptions before building any module list from them.
  const ownExamCodes = new Set(examOptions.map((e) => e.code));
  const ownExams = (courseData?.exams ?? []).filter((exam) => ownExamCodes.has(exam.code));

  const moduleByCode = new Map<string, string>();
  ownExams.forEach((exam) => {
    exam.modules.forEach((mod) => moduleByCode.set(mod.code, mod.name));
  });
  // Flat fallback list, shown when no exam is selected yet -- scoped to the
  // user's own exams only, so picking Module first still only ever shows
  // modules the user could plausibly be studying.
  const moduleOptions = Array.from(moduleByCode.entries()).map(([code, name]) => ({ code, name }));

  // Per-exam module scoping: once an exam is picked, only that exam's own
  // modules should be selectable.
  const modulesByExam: Record<string, { code: string; name: string }[]> = {};
  // Reverse lookup for "pick module first" -- auto-fills the matching exam.
  // A module could in principle belong to more than one of the user's own
  // exams; this takes the first match, which is the common case for ACA
  // (modules don't usually repeat across exams).
  const examByModule: Record<string, string> = {};
  ownExams.forEach((exam) => {
    modulesByExam[exam.code] = exam.modules.map((mod) => ({ code: mod.code, name: mod.name }));
    exam.modules.forEach((mod) => {
      if (!(mod.code in examByModule)) examByModule[mod.code] = exam.code;
    });
  });

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container-dashboard">
          <div className="mb-8">
            <h1 className="text-display mb-2">Study Planner</h1>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              Plan your practice, track what&apos;s next, and stay on pace for exam day.
            </p>
          </div>
          <PlannerClient
            courseId={COURSE_ID}
            examOptions={examOptions}
            moduleOptions={moduleOptions}
            modulesByExam={modulesByExam}
            examByModule={examByModule}
            examDateByCode={examDateByCode}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
