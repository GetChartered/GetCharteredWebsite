import Link from "next/link";
import { Sparkles, Puzzle, TrendingUp, Timer, GraduationCap, LucideIcon } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";

type ModeCard = {
  href: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
};

const MODES: ModeCard[] = [
  {
    href: "/practice/quick",
    icon: Sparkles,
    iconColor: "var(--accent-gold)",
    title: "Quick Practice",
    description: "A short, low-commitment mix across your modules — good for a daily habit.",
  },
  {
    href: "/practice/module",
    icon: Puzzle,
    iconColor: "var(--accent-purple)",
    title: "Module Practice",
    description: "Deep, focused practice on the one module you want to strengthen.",
  },
  {
    href: "/practice/focus",
    icon: TrendingUp,
    iconColor: "var(--accent-blue)",
    title: "Focus Areas",
    description: "Targets your weakest topics, based on your actual performance data.",
  },
  {
    href: "/practice/timed",
    icon: Timer,
    iconColor: "var(--accent-teal)",
    title: "Timed Practice",
    // No hardcoded duration/count — same reasoning as Mock Exam below:
    // TimedPracticeClient now offers three duration presets (2/5/10 min),
    // so a single number here would misrepresent whichever one you pick.
    description: "Choose your time limit and build speed under real exam-day pressure.",
  },
  {
    href: "/practice/mock",
    icon: GraduationCap,
    iconColor: "var(--accent-red)",
    title: "Mock Exam",
    // No specific exam is chosen yet at this point in the flow (that
    // happens on the next screen, MockExamClient's ExamPicker), and
    // different ACA papers have different real-world question counts/
    // durations — "70 questions, 90 minutes" read as a claim about
    // whichever exam you were about to sit, which isn't true for most of
    // them. Left generic rather than hardcoding a number that's only
    // actually accurate for this app's own simplified mock-exam format
    // (see MockExamClient.tsx's NUM_QUESTIONS/TIMER_SECONDS — uniform
    // across every exam by design, not per-exam data this card could pull).
    description: "A full exam-condition simulation — as close to test day as it gets.",
  },
];

export default async function PracticeHubPage() {
  await requireOnboardedSession("/practice");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-display mb-4">Practice</h1>
            <p
              className="max-w-2xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Choose how you want to practise today.
            </p>
          </div>

          {/* Flexbox + wrap, not CSS Grid — with 5 cards in a 3-per-row
              layout, grid's auto-fit/minmax leaves the last row's 2 cards
              left-aligned under columns 1-2 (grid has no way to center a
              partial row). Flexbox naturally centers each wrapped line via
              justify-content, so the last row centers regardless of item
              count, while flex-basis 304 (== a 3-column split of this
              960px-wide box, same math as the old minmax(260px, 1fr)) keeps
              card width identical to the previous grid on full rows, and
              minWidth: 260 preserves the same single-column mobile
              stacking threshold the old minmax(260px, ...) enforced. */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
              maxWidth: 960,
              margin: "0 auto",
            }}
          >
            {MODES.map((mode) => (
              <Link
                key={mode.href}
                href={mode.href}
                style={{ textDecoration: "none", flex: "0 1 304px", minWidth: 260 }}
              >
                <div className="card card-hover" style={{ height: "100%" }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: mode.iconColor + "20" }}
                  >
                    <mode.icon size={28} style={{ color: mode.iconColor }} />
                  </div>
                  <h3 className="text-kpi-title mb-2" style={{ color: "var(--color-text)" }}>
                    {mode.title}
                  </h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
                    {mode.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
