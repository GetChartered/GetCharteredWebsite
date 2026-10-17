// Single source of truth for course-related constants.
// Every file that previously hardcoded "ACA" should import from here.
export const DEFAULT_COURSE = "ACA" as const;

// Courses that have a live question bank. Anyone who picks another course at
// onboarding is told we only have these and is on the waitlist (their
// `qualifications` are saved on their user record). Add a code here as each
// bank goes live. Keep in step with AVAILABLE_COURSE_CODES in the app's
// assets/courses.ts.
export const LIVE_COURSES: readonly string[] = ["ACA"];

// Known course codes — matches the backend's VALID_COURSES env var.
export const VALID_COURSES = ["ACA", "CFA", "CISI"] as const;
export type CourseCode = (typeof VALID_COURSES)[number];
