import type { LucideIcon } from "lucide-react";
import { BarChart2, Calculator, PoundSterling, Gavel, Sprout, Briefcase, Layers } from "lucide-react";

// Per-exam icon + colour, mirroring GetChartered_app's constants/examVisuals.ts
// (every module within an exam shares that exam's visual). Icon names are
// ported 1:1 (lucide-react-native and lucide-react share the same names,
// verified against the installed package). Colours are NOT copied from the
// app's specific hex/rgba values — they're mapped onto the website's own
// existing CSS var accents so no new tokens are introduced. The app's "SE"
// exam uses a second green variant it defines specifically for this purpose;
// the website has no equivalent token, so SE uses the existing --accent-teal
// instead of inventing one.
export type ExamVisual = { icon: LucideIcon; tint: string };

const EXAM_VISUALS_BY_CODE: Record<string, ExamVisual> = {
  BIP: { icon: BarChart2, tint: "var(--accent-purple)" },
  AF: { icon: Calculator, tint: "var(--accent-green)" },
  TF: { icon: PoundSterling, tint: "var(--accent-blue)" },
  BL: { icon: Gavel, tint: "var(--accent-gold)" },
  SE: { icon: Sprout, tint: "var(--accent-teal)" },
  ARF: { icon: Briefcase, tint: "var(--accent-red)" },
};

const FALLBACK_VISUAL: ExamVisual = { icon: Layers, tint: "var(--accent-blue)" };

export function getExamVisual(examCode: string): ExamVisual {
  return EXAM_VISUALS_BY_CODE[examCode] ?? FALLBACK_VISUAL;
}
