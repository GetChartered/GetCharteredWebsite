import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { PracticeBackLink } from "@/components/practice/PracticeBackLink";
import { FocusPracticeClient } from "@/components/practice/FocusPracticeClient";

export default async function FocusPracticePage() {
  await requireOnboardedSession("/practice/focus");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <PracticeBackLink />
          <FocusPracticeClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
