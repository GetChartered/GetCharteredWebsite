import { callGcApi } from "@/lib/gcApi";
import { canonicalizeModuleCode } from "@/lib/practice/moduleCode";
import type { PracticeExamGroup, PracticeModule } from "@/lib/practice/types";

const ACA_COURSE_CODE = "ACA";

function parseModules(raw: unknown): PracticeModule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const mod = m as { code?: unknown; name?: unknown };
      return {
        code: typeof mod?.code === "string" ? canonicalizeModuleCode(mod.code) : "",
        name: typeof mod?.name === "string" ? mod.name : "",
      };
    })
    .filter((m) => m.code.length > 0);
}

export interface AcaCourseData {
  exams: PracticeExamGroup[];
  /** Bank size per module code, when the backend supplies it (moduleQuestionCounts). */
  moduleQuestionCounts: Record<string, number>;
}

/**
 * Shared fetch of GET /courses, filtered to ACA (the only course with a
 * live question bank). Parsing is factored out into parseAcaCourseData so
 * it can be exercised directly (e.g. in tests) without a live session/
 * network call.
 */
export async function fetchAcaCourseData(): Promise<AcaCourseData | null> {
  const response = await callGcApi("/courses");
  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error("[practice/courses] /courses returned a non-OK or unparsable response", response.status);
    return null;
  }

  return parseAcaCourseData(data);
}

/**
 * Parses a raw GET /courses response body. Used by the module selector, the
 * progress dashboard (for "not started" counts), and Focus Areas (to know
 * the full module set for its random fallback). ACA's /courses shape nests
 * modules under exams; other courses use a flat `modules` array, wrapped as
 * a single implicit group here for a uniform shape. Response shape is
 * unverified beyond what's been directly observed, so anything unexpected
 * is logged rather than silently swallowed.
 */
export function parseAcaCourseData(data: unknown): AcaCourseData {
  const courses = (data as { courses?: unknown }).courses;
  if (!Array.isArray(courses)) {
    console.warn(
      "[practice/courses] unexpected /courses response shape — no `courses` array. Raw response:",
      JSON.stringify(data).slice(0, 2000)
    );
    return { exams: [], moduleQuestionCounts: {} };
  }

  const acaCourse = courses.find(
    (c) => (c as { code?: unknown })?.code === ACA_COURSE_CODE
  ) as { modules?: unknown; exams?: unknown } | undefined;

  if (!acaCourse) {
    console.warn(
      "[practice/courses] no ACA entry found in /courses response. Course codes seen:",
      courses.map((c) => (c as { code?: unknown })?.code)
    );
    return { exams: [], moduleQuestionCounts: {} };
  }

  let exams: PracticeExamGroup[] = [];

  if (Array.isArray(acaCourse.exams)) {
    exams = (acaCourse.exams as { code?: unknown; name?: unknown; modules?: unknown }[])
      .map((exam) => ({
        code: typeof exam?.code === "string" ? exam.code : "",
        name: typeof exam?.name === "string" ? exam.name : "",
        modules: parseModules(exam?.modules),
      }))
      .filter((exam) => exam.code.length > 0 && exam.modules.length > 0);
  } else if (Array.isArray(acaCourse.modules)) {
    const modules = parseModules(acaCourse.modules);
    if (modules.length > 0) {
      exams = [{ code: ACA_COURSE_CODE, name: "Modules", modules }];
    }
  }

  if (exams.length === 0) {
    console.warn(
      "[practice/courses] ACA entry had no usable exam groups. Raw ACA entry:",
      JSON.stringify(acaCourse).slice(0, 2000)
    );
  }

  // moduleQuestionCounts is a separate top-level field on the /courses
  // response (per GetChartered_app's hooks/useCourseSelection.ts), keyed by
  // raw module code — used for "not started" derivation on the progress
  // dashboard (totalInBank - learning - reviewing - mastered). Optional:
  // older/partial responses may omit it entirely.
  const rawCounts = (data as { moduleQuestionCounts?: unknown }).moduleQuestionCounts;
  const moduleQuestionCounts: Record<string, number> = {};
  if (rawCounts && typeof rawCounts === "object" && !Array.isArray(rawCounts)) {
    for (const [code, count] of Object.entries(rawCounts as Record<string, unknown>)) {
      if (typeof count === "number" && Number.isFinite(count)) {
        moduleQuestionCounts[canonicalizeModuleCode(code)] = count;
      }
    }
  } else {
    console.warn(
      "[practice/courses] /courses response had no usable `moduleQuestionCounts` map — 'not started' counts on the progress dashboard will be unavailable."
    );
  }

  return { exams, moduleQuestionCounts };
}
