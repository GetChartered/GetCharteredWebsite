import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { PracticeBackLink } from "@/components/practice/PracticeBackLink";
import { QuickPracticeClient } from "@/components/practice/QuickPracticeClient";

export default async function QuickPracticePage() {
  await requireOnboardedSession("/practice/quick");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <PracticeBackLink />
          <QuickPracticeClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
