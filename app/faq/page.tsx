import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { requireVerifiedIfSignedIn } from "@/lib/auth0";

const faqs: FaqItem[] = [
  {
    question: "When is GetChartered launching publicly?",
    answer: (
      <p>
        GetChartered is targeting a July 2026 launch on the App Store. In the
        meantime, you can join our waitlist at getchartered.app to be first in
        line for early access, and to help shape the product before it goes live.
      </p>
    ),
  },
  {
    question: "Which qualifications does GetChartered support?",
    answer: (
      <>
        <p>
          At launch, GetChartered will cover ACA, ACCA, CISI, and CII, the four
          qualifications most commonly studied by graduates entering accounting
          and financial services in the UK.
        </p>
        <p>
          Support for CIMA, CFA, CIPS and other professional qualifications are
          on the roadmap and will be added as the platform grows.
        </p>
      </>
    ),
  },
  {
    question: "Is GetChartered a replacement for BPP or Kaplan?",
    answer: (
      <>
        <p>
          No, and it was never designed to be. GetChartered is the revision
          platform, not a course provider. We don&apos;t do lectures, textbooks,
          or recorded content. Instead, we sit alongside whatever course
          you&apos;re using (BPP, Kaplan, or anything else) and give you the
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
    question: "How does the adaptive algorithm work?",
    answer: (
      <>
        <p>
          Every question you attempt tells GetChartered something about where
          you stand. The algorithm tracks your performance across every topic
          and syllabus area, identifies the gaps in your knowledge, and then
          prioritises those gaps in your next practice session, automatically.
        </p>
        <p>
          That means instead of working through the same material in the same
          order as everyone else, you spend your time where it actually moves
          your score. The closer you get to your exam, the sharper the focus.
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
        <p>For multiple choice exams (CISI, CII, and ACA Exams 1–6), you can expect:</p>
        <ul
          style={{
            paddingLeft: "20px",
            margin: "12px 0",
            listStyle: "disc",
          }}
        >
          <li>
            <strong>Shuffle mode:</strong> questions drawn randomly so you learn
            the answers, not the order
          </li>
          <li>
            <strong>Browse mode:</strong> move through questions freely, flag
            ones to revisit, and submit at the end (just like the real CBE
            interface)
          </li>
          <li>
            <strong>Instant feedback:</strong> get your result and explanation
            immediately after each answer
          </li>
          <li>
            <strong>End-of-session review:</strong> answer everything first,
            then review your full results with right/wrong breakdowns and
            explanations
          </li>
        </ul>
        <p>
          For ACCA, question types reflect the full exam format including
          objective test questions across Applied Knowledge and Applied Skills
          papers.
        </p>
      </>
    ),
  },
  {
    question: "Is GetChartered available on web as well as a mobile app?",
    answer: (
      <p>
        Yes. GetChartered is available both as a mobile app and via a web
        browser at getchartered.app. Your account, progress, and performance
        data sync across both, so you can practise on your phone on the commute
        and switch to your laptop at your desk without missing a beat.
      </p>
    ),
  },
  {
    question: "How is the content kept up to date?",
    answer: (
      <>
        <p>
          Every question on GetChartered is written directly from the official
          syllabus documents published by the relevant exam bodies, not from
          third-party materials. Content is reviewed and updated with each new
          syllabus cycle to make sure you&apos;re always practising to the right
          standard.
        </p>
        <p>
          For ACA Tax Fundamentals, for example, all questions reflect Finance
          Act 2025, which applies to 2026 sittings. We update content ahead of
          each exam window so you&apos;re never revising outdated rules.
        </p>
      </>
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
            href="mailto:hello@getchartered.app"
            style={{ color: "var(--color-tint)" }}
          >
            hello@getchartered.app
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
          GetChartered is free during the beta period. We want to get the
          product into the hands of real candidates, gather feedback, and prove
          it works before we talk about pricing.
        </p>
        <p>
          Once we move out of beta, we&apos;ll introduce a straightforward
          subscription. We&apos;ll always be significantly below the cost of a
          revision course from a traditional provider, and we&apos;ll give beta
          users advance notice before anything changes.
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
  // Signed-in-but-unverified users get bounced to /verify-email here.
  const session = await requireVerifiedIfSignedIn();
  const isLoggedIn = !!session;

  // Hide the "how do I join the waitlist?" question for logged-in users —
  // they already have an account, so the question doesn't apply and its
  // "sign up" link would otherwise re-trigger the Auth0 consent flow.
  const visibleFaqs = isLoggedIn
    ? faqs.filter(
        (faq) => faq.question !== "How do I join the waitlist and get early access?"
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
