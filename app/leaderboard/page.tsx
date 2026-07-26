import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export default async function LeaderboardPage() {
  await requireOnboardedSession("/leaderboard");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        {/* Dashboard-width container (same fix as the /progress page) —
            the leaderboard's podium + list + side-panel layout needs real
            desktop width, and .container's 1200px cap (shared by narrow
            form/list pages like onboarding/welcome) was leaving a lot of
            dead gutter. */}
        <div className="container-dashboard">
          <div className="mb-8">
            <h1 className="text-display mb-2">Leaderboard</h1>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              See how you compare with others preparing for the same exam this week.
            </p>
          </div>
          <LeaderboardClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
