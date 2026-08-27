// Web equivalent of the app's StudyPlanner/components/AddStudyModal.tsx
// STUDY_TYPE_OPTIONS table — same six activity types, same default
// durations/targets, same which-fields-to-show flags. `route` is new here:
// it's what "Start Practice" on a website session card links to. The
// website's practice routes don't yet support deep-linking a specific
// module or a "daily" query flag (confirmed against app/practice/*/page.tsx
// — Module Practice and Daily Challenge just land on the general picker),
// so those two fall back to their closest general practice route rather
// than a route that doesn't exist yet.
import type { StudyActivityType, StudySessionDraft } from "./types";

export type StudyTypeOption = {
  key: string;
  label: string;
  activityType: StudyActivityType;
  activityKind: NonNullable<StudySessionDraft["activityKind"]>;
  source: StudySessionDraft["source"];
  icon: "Sparkles" | "Puzzle" | "Timer" | "Trophy" | "FileClock" | "NotebookPen";
  color: string;
  background: string;
  defaultDuration: number;
  targetQuestions?: number;
  showModule?: boolean;
  showTarget?: boolean;
  showDuration?: boolean;
  route?: string;
};

export const STUDY_TYPE_OPTIONS: StudyTypeOption[] = [
  {
    key: "quick_practice",
    label: "Quick Practice",
    activityType: "practice_questions",
    activityKind: "quick_practice",
    source: "system_planned",
    icon: "Sparkles",
    color: "var(--accent-gold)",
    background: "color-mix(in srgb, var(--accent-gold) 14%, transparent)",
    defaultDuration: 20,
    targetQuestions: 10,
    showTarget: true,
    route: "/practice/quick",
  },
  {
    key: "module_practice",
    label: "Module Practice",
    activityType: "practice_questions",
    activityKind: "module_practice",
    source: "system_planned",
    icon: "Puzzle",
    color: "var(--accent-purple)",
    background: "color-mix(in srgb, var(--accent-purple) 14%, transparent)",
    defaultDuration: 30,
    targetQuestions: 15,
    showModule: true,
    showTarget: true,
    route: "/practice/module",
  },
  {
    key: "timed_practice",
    label: "Timed Practice",
    activityType: "practice_questions",
    activityKind: "timed_practice",
    source: "system_planned",
    icon: "Timer",
    color: "var(--color-tint)",
    background: "color-mix(in srgb, var(--color-tint) 14%, transparent)",
    defaultDuration: 30,
    targetQuestions: 20,
    showTarget: true,
    showDuration: true,
    route: "/practice/timed",
  },
  {
    key: "daily_challenge",
    label: "Daily Challenge",
    activityType: "practice_questions",
    activityKind: "daily_challenge",
    source: "system_planned",
    icon: "Trophy",
    color: "var(--accent-gold)",
    background: "color-mix(in srgb, var(--accent-gold) 14%, transparent)",
    defaultDuration: 15,
    route: "/practice/quick",
  },
  {
    key: "mock_exam",
    label: "Mock Exam",
    activityType: "mock_exam",
    activityKind: "mock_exam",
    source: "system_planned",
    icon: "FileClock",
    color: "var(--accent-red)",
    background: "color-mix(in srgb, var(--accent-red) 12%, transparent)",
    defaultDuration: 90,
    route: "/practice/mock",
  },
  {
    key: "personal_study",
    label: "Personal Study",
    activityType: "personal_study",
    activityKind: "personal_study",
    source: "personal_study",
    icon: "NotebookPen",
    color: "var(--color-text-secondary)",
    background: "color-mix(in srgb, var(--color-text-secondary) 12%, transparent)",
    defaultDuration: 45,
    showModule: true,
    showDuration: true,
  },
];

export function optionForSession(session?: { activityKind?: string; source?: string; activityType?: string } | null) {
  if (!session) return STUDY_TYPE_OPTIONS[0];
  return (
    STUDY_TYPE_OPTIONS.find(
      (option) =>
        option.activityKind === session.activityKind ||
        (option.source === session.source && option.activityType === session.activityType)
    ) ?? STUDY_TYPE_OPTIONS[0]
  );
}
