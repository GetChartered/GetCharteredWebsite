import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { fetchExamPrepData } from "@/lib/practice/examPrepServer";
import { fetchAcaCourseData } from "@/lib/practice/courses";
import { PlannerClient } from "@/components/planner/PlannerClient";

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

  const moduleByCode = new Map<string, string>();
  (courseData?.exams ?? []).forEach((exam) => {
    exam.modules.forEach((mod) => moduleByCode.set(mod.code, mod.name));
  });
  const moduleOptions = Array.from(moduleByCode.entries()).map(([code, name]) => ({ code, name }));

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
            examDateByCode={examDateByCode}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
