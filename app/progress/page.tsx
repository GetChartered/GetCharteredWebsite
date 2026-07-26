import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { resolveNextExamDisplay, type ExamPrepNextExam } from "@/lib/practice/examWindow";
import { fetchExamPrepData } from "@/lib/practice/examPrepServer";
import { selectPrimaryExamPrep } from "@/lib/practice/examPrep";
import { fetchAcaCourseData } from "@/lib/practice/courses";
import { ProgressDashboardClient } from "@/components/progress/ProgressDashboardClient";

export default async function ProgressPage() {
  await requireOnboardedSession("/progress");

  const [examPrep, courseData] = await Promise.all([
    fetchExamPrepData().catch(() => null),
    fetchAcaCourseData().catch(() => null),
  ]);

  // Resolves the exam's display name from GET /courses since exam-prep
  // entries only carry a code — see resolveNextExamDisplay's doc comment
  // for why this is the only source the Next Exam tile trusts now.
  const primaryExamPrep = selectPrimaryExamPrep(examPrep ?? []);
  let examPrepNextExam: ExamPrepNextExam | null = null;
  if (primaryExamPrep?.examDate) {
    const examName =
      courseData?.exams.find((e) => e.code === primaryExamPrep.examCode)?.name ?? primaryExamPrep.examCode;
    examPrepNextExam = { examName, examDate: primaryExamPrep.examDate };
  }

  const nextExam = resolveNextExamDisplay(examPrepNextExam);

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        {/* Dashboard-width container (globals.css .container-dashboard), not
            the shared .container — this page's multi-column chart grid
            needs real desktop width, and .container's 1200px cap (shared by
            narrow form/list pages like onboarding/welcome/leaderboard) was
            leaving a lot of dead gutter on wide viewports. */}
        <div className="container-dashboard">
          <div className="mb-8">
            <h1 className="text-display mb-2">Progress</h1>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              Your practice history and module coverage.
            </p>
          </div>
          <ProgressDashboardClient nextExam={nextExam} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
