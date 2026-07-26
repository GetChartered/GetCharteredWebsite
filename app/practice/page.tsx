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
    description: "10 mixed questions across your modules",
  },
  {
    href: "/practice/module",
    icon: Puzzle,
    iconColor: "var(--accent-purple)",
    title: "Module Practice",
    description: "Deep dive into a specific module",
  },
  {
    href: "/practice/focus",
    icon: TrendingUp,
    iconColor: "var(--accent-blue)",
    title: "Focus Areas",
    description: "Target your weakest topics",
  },
  {
    href: "/practice/timed",
    icon: Timer,
    iconColor: "var(--accent-teal)",
    title: "Timed Practice",
    description: "Beat the clock — 2 minutes, 10 questions",
  },
  {
    href: "/practice/mock",
    icon: GraduationCap,
    iconColor: "var(--accent-red)",
    title: "Mock Exam",
    description: "Full exam simulation — 70 questions, 90 minutes",
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              maxWidth: 960,
              margin: "0 auto",
            }}
          >
            {MODES.map((mode) => (
              <Link key={mode.href} href={mode.href} style={{ textDecoration: "none" }}>
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
