// Single source of truth for course-related constants.
// Every file that previously hardcoded "ACA" should import from here.
export const DEFAULT_COURSE = "ACA" as const;

// Known course codes — matches the backend's VALID_COURSES env var.
export const VALID_COURSES = ["ACA", "CFA", "CISI"] as const;
export type CourseCode = (typeof VALID_COURSES)[number];
