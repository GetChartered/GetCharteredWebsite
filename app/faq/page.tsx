import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { getOptionalSession } from "@/lib/auth0";

const faqs: FaqItem[] = [
  {
    question: "When is GetChartered launching publicly?",
    answer: (
      <p>
        GetChartered is targeting a late summer 2026 launch on the App Store. In
        the meantime, you can join our waitlist at getchartered.app to be first
        in line for early access, and to help shape the product before it goes
        live.
      </p>
    ),
  },
  {
    question: "Is GetChartered a replacement for your tuition provider?",
    answer: (
      <>
        <p>
          No, and it was never designed to be. GetChartered is a revision
          platform, not a tuition provider. Instead, we sit alongside whatever course
          you&apos;re on (BPP, Kaplan, or anything else) and give you the
          intelligent, structured practice that turns study into results.
        </p>
        <p>
          Think of your course provider as the coach explaining the game.
          GetChartered is where you actually train.
        </p>
      </>
    ),
  },
  {
    question: "How does the adaptive learning algorithm work?",
    answer: (
      <>
        <p>
          Every question you attempt informs GetChartered something about where
          you stand. The algorithm tracks your performance across every topic
          and syllabus area, identifies the gaps in your knowledge, and then
          prioritises gaps in your next practice session.
        </p>
        <p>
          That means instead of working through the same material in the same
          order as everyone else, you spend your time on questions that improves your score individually.
          The closer you get to your exam, the sharper the focus.
        </p>
      </>
    ),
  },
  {
    question: "What types of questions and practice sessions are available?",
    answer: (
      <>
        <p>
          GetChartered is built around the format of the real exams, so
          you&apos;ll practise the way you&apos;ll actually be tested.
        </p>
        <p>
          For multiple choice exams, you can
          expect:
        </p>
        <ul
          style={{
            paddingLeft: "20px",
            margin: "12px 0",
            listStyle: "disc",
          }}
        >
          <li>
            <strong>Quick Practice:</strong> 10 randomly selected questions designed to be completed quickly. Perfect for your commute.
          </li>
          <li>
            <strong>Module Practice:</strong> Target specific modules you want to study, perfect for specific exams.
          </li>
          <li>
            <strong>Focused Improvement Practice:</strong> Allows you to target the specific gaps in your knowledge.
          </li>
          <li>
            <strong>Mock Exam:</strong> Practice questions in an exam style setting to get yourself ready for the real thing.
          </li>
          <li>
            <strong>Daily Challenge:</strong> Instills consistent and good working habits.
          </li>
        </ul>
      </>
    ),
  },
  {
    question: "Is GetChartered available on web as well as a mobile app?",
    answer: (
      <p>
        Yes. GetChartered is available both as a mobile app for iOS and Android and via a web
        browser at getchartered.app. Your account, progress, and performance
        data sync across both, so you can practise on your phone on the commute
        and switch to your laptop at your desk without missing a beat.
      </p>
    ),
  },
  {
    question: "Can my firm use GetChartered for its trainees?",
    answer: (
      <>
        <p>
          Yes. GetChartered is built with firms in mind as well as individual
          candidates. We offer an enterprise option for training managers and
          L&amp;D teams who want to give their trainees structured, trackable
          exam preparation, with cohort-level visibility into progress and
          readiness.
        </p>
        <p>
          If you&apos;re a Training Principal, L&amp;D lead, or Graduate
          Programme Manager and want to explore what that looks like for your
          intake, get in touch at{" "}
          <a
            href="mailto:support@getchartered.app"
            style={{ color: "var(--color-tint)" }}
          >
            support@getchartered.app
          </a>
          .
        </p>
      </>
    ),
  },
  {
    question: "How much does GetChartered cost?",
    answer: (
      <>
        <p>
          GetChartered is free to download with the option to upgrade to a premium subscription. 
          We offer plans for both independent learners and enterprises.
        </p>
        <p>
          Please refer to our pricing page for specific pricing.
        </p>
      </>
    ),
  },
  {
    question: "How do I join the waitlist and get early access?",
    answer: (
      <>
        <p>
          Head to{" "}
          <Link
            href="/auth/login?screen_hint=signup"
            style={{ color: "var(--color-tint)" }}
          >
            getchartered.app and sign up
          </Link>
          . Early access users get onto the platform before the public launch,
          help shape what we build next, and will be first to benefit from the
          full question banks when they go live.
        </p>
        <p>
          We&apos;re building this alongside our users. The more feedback we get
          from real candidates, the better the product gets for everyone.
        </p>
      </>
    ),
  },
];

export default async function FAQ() {
  const session = await getOptionalSession();
  const isLoggedIn = !!session;

  // Hide the "how do I join the waitlist?" question for logged-in users —
  // they already have an account, so the question doesn't apply and its
  // "sign up" link would otherwise re-trigger the Auth0 consent flow.
  const visibleFaqs = isLoggedIn
    ? faqs.filter(
        (faq) =>
          faq.question !== "How do I join the waitlist and get early access?",
      )
    : faqs;

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-display mb-4">Frequently Asked Questions</h1>
              <p
                className="text-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Everything you need to know about GetChartered ahead of our
                launch.
              </p>
            </div>

            <FaqAccordion items={visibleFaqs} />

            <div className="text-center mt-12">
              <p style={{ color: "var(--color-text-secondary)" }}>
                Still have questions?{" "}
                <Link
                  href="/contact"
                  style={{ color: "var(--color-tint)", fontWeight: 600 }}
                >
                  Get in touch with us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
