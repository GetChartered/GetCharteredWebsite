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
//
// `tint` is the original vivid accent — stays in use for text/icon/border,
// where it needs to stay legible against --color-card. `bg` is a pastel
// version of the same hue (same H, lower S, higher L) for the chip/badge
// background fill only, so the "My Exams" row reads as soft rather than
// rainbow-vivid. Only the five exams reviewed for pastels have one; SE and
// the fallback visual don't, so consumers fall back to a computed tint mix.
export type ExamVisual = { icon: LucideIcon; tint: string; bg?: string };

const EXAM_VISUALS_BY_CODE: Record<string, ExamVisual> = {
  BIP: { icon: BarChart2, tint: "var(--accent-purple)", bg: "#CDB5E3" },
  AF: { icon: Calculator, tint: "var(--accent-green)", bg: "#B5E3C6" },
  TF: { icon: PoundSterling, tint: "var(--accent-blue)", bg: "#B5E1E3" },
  BL: { icon: Gavel, tint: "var(--accent-gold)", bg: "#E0D2A3" },
  SE: { icon: Sprout, tint: "var(--accent-teal)" },
  ARF: { icon: Briefcase, tint: "var(--accent-red)", bg: "#E3B5B5" },
};

const FALLBACK_VISUAL: ExamVisual = { icon: Layers, tint: "var(--accent-blue)" };

export function getExamVisual(examCode: string): ExamVisual {
  return EXAM_VISUALS_BY_CODE[examCode] ?? FALLBACK_VISUAL;
}
