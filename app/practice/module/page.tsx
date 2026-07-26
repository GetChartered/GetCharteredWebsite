import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { PracticeBackLink } from "@/components/practice/PracticeBackLink";
import { ModulePracticeClient } from "@/components/practice/ModulePracticeClient";

export default async function ModulePracticePage() {
  await requireOnboardedSession("/practice/module");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <PracticeBackLink />
          <ModulePracticeClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
