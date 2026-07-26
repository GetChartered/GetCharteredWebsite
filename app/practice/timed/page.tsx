import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { PracticeBackLink } from "@/components/practice/PracticeBackLink";
import { TimedPracticeClient } from "@/components/practice/TimedPracticeClient";

export default async function TimedPracticePage() {
  await requireOnboardedSession("/practice/timed");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <PracticeBackLink />
          <TimedPracticeClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
