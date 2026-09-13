import Link from "next/link";
import { CreditCard, Calendar, Sparkles, Target, TrendingUp, Flame, ArrowRight, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";
import { MyExamsSection } from "@/components/account/MyExamsSection";
import { SubscribeButtons } from "@/components/account/SubscribeButtons";
import { PerExamPicker } from "@/components/account/PerExamPicker";
import { fetchAcaCourseData } from "@/lib/practice/courses";
import type { PracticeExamGroup } from "@/lib/practice/types";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";
import { requireOnboardedSession } from "@/lib/auth0";
import { fetchProfileData } from "@/lib/profile";
import type { ProfileResponse } from "@/lib/profileCache";
import { fetchProgressData } from "@/lib/practice/fetchProgress";
import { computeStreak, mergeDailyBreakdowns } from "@/lib/practice/progressStats";
import type { ProgressData } from "@/lib/practice/types";

export const metadata = {
  title: "My Account",
  description: "Manage your GetChartered account and subscription.",
};


export default async function MyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Resolved before requireOnboardedSession so a landing-page pricing click
  // (?subscribe=annual, see PricingSection.tsx) survives a login/signup
  // round trip for a not-yet-authenticated visitor — the default
  // requireOnboardedSession("/my-account") would otherwise drop the query
  // string, landing them back with no memory of which plan they wanted.
  // Monthly was dropped as a plan (Pierce, 2026-09-09) — Annual + Per Exam
  // only now.
  const preAuthParams = await searchParams;
  const subscribeIntent = preAuthParams.subscribe as string | undefined;
  const returnTo =
    subscribeIntent === "annual" || subscribeIntent === "per_exam"
      ? `/my-account?subscribe=${subscribeIntent}`
      : "/my-account";

  const session = await requireOnboardedSession(returnTo);
  // Database (email/password) users have a sub prefixed with `auth0|`.
  // Social-login users (google-oauth2|…, linkedin|…) can't change a password
  // here — their credentials live with the IdP — so hide the section entirely.
  const isDatabaseUser = session.user.sub?.startsWith("auth0|") ?? false;
  const autoSubscribePlan = subscribeIntent === "annual" ? subscribeIntent : undefined;

  // Both paid tiers (Annual, Per Exam) are one-time Stripe payments — there is
  // no Stripe Subscription object to look up anymore, so entitlement comes
  // straight from GET /profile (premium / subscriptionPlan / annualExpiresAt
  // / purchasedExams) instead of a Stripe subscription-status lookup.
  // Pierce's call, 2026-09-10 — see lib/profile.ts.
  const profileData = SUBSCRIPTIONS_ENABLED ? await fetchProfileData() : null;

  const progressData = await fetchProgressData();
  const acaCourseData = SUBSCRIPTIONS_ENABLED ? await fetchAcaCourseData().catch(() => null) : null;
  const examOptions = acaCourseData?.exams ?? [];

  return (
    <div>
      {/* Primary tier — the content the user cares about regularly, given
          more visual weight and breathing room than the settings below. */}
      <div className="my-account-primary">
        <ScrollReveal>
          <div id="practice">
            <SectionHeading
              title="Practice"
              action={
                <Link
                  href="/practice"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-tint)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    textDecoration: "none",
                  }}
                >
                  Go to Practice <ArrowRight size={14} />
                </Link>
              }
            />
            <p className="mb-6" style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              Your practice activity at a glance.
            </p>

            {progressData ? (
              <QuickStats progressData={progressData} />
            ) : (
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 12 }}>
                  Couldn&apos;t load your practice stats right now.
                </p>
                <Link href="/practice" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                  Start Practicing
                </Link>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* My Exams — id'd so other pages (e.g. Progress's "Next Exam" tile)
            can deep-link straight to this section via /my-account#my-exams. */}
        <ScrollReveal delay={0.06}>
          <div id="my-exams">
            <SectionHeading title="My Exams" />
            <p className="mb-6" style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              Set up which exams you&apos;re sitting and when — this powers your Progress
              countdown and your default Leaderboard.
            </p>
            <MyExamsSection />
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div>
          <div className="my-account-settings">
            {/* Subscription */}
            <div id="subscription">
              <SectionHeading title="Subscription" />
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
                {SUBSCRIPTIONS_ENABLED
                  ? "Manage your plan and see what you've purchased"
                  : "Plans open when GetChartered launches in late summer 2026"}
              </p>

              {SUBSCRIPTIONS_ENABLED && profileData ? (
                <PlanStatus
                  profileData={profileData}
                  autoSubscribePlan={autoSubscribePlan}
                  examOptions={examOptions}
                />
              ) : (
                <WaitlistPlaceholder />
              )}
            </div>

            {/* Account Security — only for database (email/password) users.
                Social-login users (google-oauth2|…, linkedin|…) manage
                credentials with their IdP, so there's nothing actionable
                here for them. */}
            {isDatabaseUser && (
              <div id="security">
                <SectionHeading title="Account Security" />
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
                  Manage your password and security settings
                </p>

                <div className="card" style={{ padding: "20px 24px" }}>
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)", marginBottom: 2 }}>
                        Password
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        Manage your password
                      </p>
                    </div>
                    <ChangePasswordButton />
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div>
              <SectionHeading title="Danger Zone" accentColor="var(--color-danger)" />
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
                Irreversible actions for your account
              </p>

              <div className="card border-2 border-color-danger/20" style={{ padding: "20px 24px" }}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)", marginBottom: 2 }}>
                      Delete Account
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <DeleteAccountModal email={session.user.email || ""} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

// Both paid tiers are one-time Stripe payments (Pierce, 2026-09-09/10) — no
// Stripe Subscription object exists to manage, so there's no billing-portal
// link or cancellation flow here anymore. Branches purely on GET /profile
// data: an active Annual plan, one or more purchased single exams, or
// neither (offer to buy).
function PlanStatus({
  profileData,
  autoSubscribePlan,
  examOptions,
}: {
  profileData: ProfileResponse;
  autoSubscribePlan?: "annual";
  examOptions: PracticeExamGroup[];
}) {
  const { premium, subscriptionPlan, annualExpiresAt, purchasedExams } = profileData;

  if (premium && subscriptionPlan === "annual") {
    return <AnnualPlanCard expiresAt={annualExpiresAt} />;
  }

  const purchasedExamGroups = examOptions.filter((exam) => purchasedExams.includes(exam.code));
  const remainingExamOptions = examOptions.filter((exam) => !purchasedExams.includes(exam.code));

  if (purchasedExamGroups.length > 0) {
    return (
      <div className="space-y-6">
        <div className="card" style={{ padding: "24px" }}>
          <h3 className="mb-4" style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "14px" }}>
            Exams purchased
          </h3>
          <div className="space-y-2">
            {purchasedExamGroups.map((exam) => (
              <div
                key={exam.code}
                className="flex items-center gap-2"
                style={{ fontSize: 14, color: "var(--color-text-secondary)" }}
              >
                <span style={{ color: "var(--color-success)" }}>✓</span>
                {exam.name}
              </div>
            ))}
          </div>
        </div>

        {remainingExamOptions.length > 0 && (
          <div className="card" style={{ padding: "24px" }}>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)", marginBottom: 10 }}>
              Buy access to another exam — £25
            </p>
            <PerExamPicker exams={remainingExamOptions} />
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border-subtle)" }}>
              <SubscribeButtons autoSubscribePlan={autoSubscribePlan} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div className="text-center py-10">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "rgba(0, 173, 181, 0.12)" }}
        >
          <CreditCard size={24} style={{ color: "var(--accent-blue)" }} />
        </div>
        <h3 className="text-title mb-2" style={{ fontWeight: 600, color: "var(--color-text)" }}>
          You don&apos;t have an active plan
        </h3>
        <p className="text-body mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Buy Annual access, or pick a single exam
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          <SubscribeButtons autoSubscribePlan={autoSubscribePlan} />
          {examOptions.length > 0 && (
            <div style={{ width: "100%", maxWidth: 320 }}>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)", marginBottom: 10, textAlign: "center" }}
              >
                Or buy access to a single exam — £25
              </p>
              <PerExamPicker exams={examOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnualPlanCard({ expiresAt }: { expiresAt: string | null }) {
  const formattedExpiry = expiresAt ? new Date(expiresAt).toLocaleDateString() : "N/A";

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="card" style={{ padding: "24px" }}>
        <div className="flex items-start justify-between" style={{ marginBottom: "24px" }}>
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0, 173, 181, 0.12)" }}
            >
              <CreditCard size={22} style={{ color: "var(--accent-blue)" }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "14px" }}>
                Annual Plan
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-title" style={{ fontWeight: 700, color: "var(--color-text)" }}>
                  Full access
                </span>
              </div>
            </div>
          </div>
          <span className="badge badge-success capitalize">Active</span>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div className="flex items-center gap-3" style={{ fontSize: "14px" }}>
            <Calendar size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ color: "var(--color-text-secondary)", paddingLeft: "8px" }}>
              Access until{" "}
              <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{formattedExpiry}</span>
            </span>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 className="mb-4" style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "14px" }}>
          What&apos;s included
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Unlimited practice questions",
            "All modules included",
            "Advanced analytics",
            "Mock exams & timed practice",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2"
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              <span style={{ color: "var(--color-success)" }}>✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitlistPlaceholder() {
  return (
    <div
      className="card"
      style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0, 173, 181, 0.12)",
          width: "40px",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <Sparkles size={18} style={{ color: "var(--accent-blue)" }} />
      </div>
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
          You&apos;re on the waitlist
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          Free during our beta, launching publicly in late summer 2026 —
          you&apos;ll be among the first to know when plans open.
        </p>
      </div>

      {/* Coming-soon preview of the real action this card will eventually
          host — disabled via Button's own `disabled` prop (same
          opacity/not-allowed-cursor treatment as every other disabled
          button on the site, see .btn:disabled in globals.css), not a
          one-off style, so it reads as "not yet" rather than "broken". */}
      <Button variant="outline" size="sm" leftIcon={CreditCard} disabled style={{ flexShrink: 0 }}>
        Manage plan
      </Button>
    </div>
  );
}

function QuickStats({ progressData }: { progressData: ProgressData }) {
  const acaStats = progressData.moduleStats.filter((m) => m.course === "ACA");
  const totalAnswered = acaStats.reduce((sum, m) => sum + m.totalAnswered, 0);
  const totalCorrect = acaStats.reduce((sum, m) => sum + m.totalCorrect, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const dailyCounts = mergeDailyBreakdowns(progressData.weeklyStats);
  const streak = computeStreak(dailyCounts);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <StatItem icon={Target} label="Answered" value={String(totalAnswered)} color="var(--accent-blue)" />
        <StatItem
          icon={TrendingUp}
          label="Accuracy"
          value={accuracy != null ? `${accuracy}%` : "—"}
          color="var(--accent-green)"
        />
        <StatItem icon={Flame} label="Day streak" value={String(streak)} color="var(--accent-gold)" />
      </div>
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--color-border-subtle)",
          textAlign: "center",
        }}
      >
        <Link
          href="/progress"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-tint)",
            textDecoration: "none",
          }}
        >
          View full progress →
        </Link>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="rounded-full flex items-center justify-center mx-auto mb-2"
        style={{ width: 36, height: 36, backgroundColor: color + "20" }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)" }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</p>
    </div>
  );
}

// Shared section header for every section on this page (Practice, My
// Exams, Subscription, Account Security, Danger Zone) — same size/weight
// throughout, no per-section accent marker, so headings read as one
// consistent hierarchy rather than a "primary tier vs. secondary tier"
// distinction. `accentColor` only affects the title's own text colour now
// (still used for Danger Zone's red heading).
function SectionHeading({
  title,
  accentColor = "var(--color-text)",
  action,
}: {
  title: string;
  accentColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 12, marginBottom: 6 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: accentColor,
          minWidth: 0,
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}
