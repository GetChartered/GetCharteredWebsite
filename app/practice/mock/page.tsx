import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { requireOnboardedSession } from "@/lib/auth0";
import { PracticeBackLink } from "@/components/practice/PracticeBackLink";
import { MockExamClient } from "@/components/practice/MockExamClient";

export default async function MockExamPage() {
  await requireOnboardedSession("/practice/mock");

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-16">
        <div className="container">
          <PracticeBackLink />
          <MockExamClient />
        </div>
      </section>

      <Footer />
    </div>
  );
}
