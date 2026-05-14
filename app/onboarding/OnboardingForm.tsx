"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Navigation } from "@/components/Navigation";
import { LegalModal } from "@/components/LegalModal";
import { ONBOARDING_REQUIRED } from "@/lib/features";

type Qualification = "ACA" | "ACCA" | "CISI" | "CII" | "CIMA" | "CFA";

const HEARD_FROM_OPTIONS = [
  "LinkedIn",
  "Search engine",
  "Social media",
  "Friend or colleague",
  "Online ad",
  "University or training provider",
  "Other",
] as const;
type HeardFromOption = (typeof HEARD_FROM_OPTIONS)[number];

const TARGET_EXAM_WINDOWS = [
  { value: "within_3_months", label: "Within 3 months" },
  { value: "3_to_6_months", label: "3 to 6 months" },
  { value: "6_to_12_months", label: "6 to 12 months" },
  { value: "over_12_months", label: "More than 12 months" },
  { value: "not_sure", label: "Not sure yet" },
] as const;
type TargetExamWindow = (typeof TARGET_EXAM_WINDOWS)[number]["value"];

const QUALIFICATION_STAGES = [
  { value: "just_starting", label: "Just starting out" },
  { value: "mid_way", label: "Mid-way through" },
  { value: "final_stages", label: "Final stages" },
  { value: "resitting", label: "Resitting an exam" },
] as const;
type QualificationStage = (typeof QUALIFICATION_STAGES)[number]["value"];

// Auth0 defaults `name` to the email address for database (email/password)
// signups when no real name is supplied. Detect that case and skip the prefill
// so the user types their actual name rather than seeing their email there.
function getPrefillName(user: { name?: string; email?: string }): string {
  if (!user.name) return "";
  if (user.name.includes("@")) return "";
  if (user.email && user.name.toLowerCase() === user.email.toLowerCase()) {
    return "";
  }
  return user.name;
}

const QUALIFICATION_OPTIONS: {
  id: Qualification;
  title: string;
  subtitle: string;
  accent: string;
}[] = [
  {
    id: "ACA",
    title: "ACA",
    subtitle: "ICAEW Chartered Accountant",
    accent: "var(--accent-blue)",
  },
  {
    id: "ACCA",
    title: "ACCA",
    subtitle: "Chartered Certified Accountant",
    accent: "var(--accent-green)",
  },
  {
    id: "CISI",
    title: "CISI",
    subtitle: "Chartered Securities & Investment",
    accent: "var(--accent-purple)",
  },
  {
    id: "CII",
    title: "CII",
    subtitle: "Chartered Insurance Institute",
    accent: "var(--accent-gold)",
  },
  {
    id: "CIMA",
    title: "CIMA",
    subtitle: "Chartered Management Accountant",
    accent: "var(--accent-teal)",
  },
  {
    id: "CFA",
    title: "CFA",
    subtitle: "Chartered Financial Analyst",
    accent: "var(--accent-orange)",
  },
];

type Step = "qualification" | "study" | "details";
const STEP_ORDER: Step[] = ["qualification", "study", "details"];

export function OnboardingForm() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const [step, setStep] = useState<Step>("qualification");
  const [qualification, setQualification] = useState<Qualification | null>(null);
  const [targetExamWindow, setTargetExamWindow] = useState<TargetExamWindow | "">("");
  const [qualificationStage, setQualificationStage] = useState<QualificationStage | "">("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [heardFrom, setHeardFrom] = useState<HeardFromOption | "">("");
  const [heardFromDetail, setHeardFromDetail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedUpWithLinkedIn = useMemo(
    () => Boolean(user?.sub?.startsWith("linkedin")),
    [user?.sub]
  );

  // Redirect to login if not authenticated once Auth0 has resolved.
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/auth/login?returnTo=/onboarding");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load onboarding data");
        const data = await res.json();
        if (cancelled) return;

        const meta = data.metadata ?? {};
        setFullName(meta.full_name || getPrefillName(user));
        setCompany(meta.company || "");
        setRole(meta.role || "");
        setLinkedinUrl(meta.linkedin_url || "");
        if (
          typeof meta.heard_from === "string" &&
          (HEARD_FROM_OPTIONS as readonly string[]).includes(meta.heard_from)
        ) {
          setHeardFrom(meta.heard_from as HeardFromOption);
        }
        setHeardFromDetail(meta.heard_from_detail || "");
        if (Array.isArray(meta.qualifications) && meta.qualifications[0]) {
          setQualification(meta.qualifications[0] as Qualification);
        }
        if (
          typeof meta.target_exam_window === "string" &&
          TARGET_EXAM_WINDOWS.some((o) => o.value === meta.target_exam_window)
        ) {
          setTargetExamWindow(meta.target_exam_window as TargetExamWindow);
        }
        if (
          typeof meta.qualification_stage === "string" &&
          QUALIFICATION_STAGES.some((o) => o.value === meta.qualification_stage)
        ) {
          setQualificationStage(meta.qualification_stage as QualificationStage);
        }
        // Once accepted, the checkbox stays ticked on revisits — withdrawing
        // consent to terms isn't a flow that exists.
        if (meta.terms_accepted_at) setTermsAccepted(true);
        setMarketingConsent(meta.marketing_consent === true);
      } catch {
        if (!cancelled) setFullName(getPrefillName(user));
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Please enter your full name");
      return;
    }
    if (!qualification) {
      setError("Please pick a qualification");
      return;
    }
    if (!targetExamWindow) {
      setError("Please choose when you’re sitting your exam");
      return;
    }
    if (!qualificationStage) {
      setError("Please tell us your current stage");
      return;
    }
    if (!heardFrom) {
      setError("Please tell us how you heard about us");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Terms and Privacy Policy to continue");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: trimmedName,
        qualifications: [qualification],
        target_exam_window: targetExamWindow,
        qualification_stage: qualificationStage,
        heard_from: heardFrom,
        terms_accepted: termsAccepted,
        marketing_consent: marketingConsent,
      };
      if (company.trim()) payload.company = company.trim();
      if (role.trim()) payload.role = role.trim();
      if (!signedUpWithLinkedIn && linkedinUrl.trim()) {
        payload.linkedin_url = linkedinUrl.trim();
      }
      if (heardFrom === "Other" && heardFromDetail.trim()) {
        payload.heard_from_detail = heardFromDetail.trim();
      }

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      router.push("/welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || !user || loadingExisting) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 24px",
          }}
        >
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "var(--color-text-muted)" }}
          />
        </div>
      </div>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen">
      <Navigation />

      <section className="py-12">
        <div className="container">
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* Progress indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {STEP_ORDER.map((s, i) => (
                <Fragment key={s}>
                  <StepDot active={i === stepIndex} done={i < stepIndex} />
                  {i < STEP_ORDER.length - 1 && (
                    <div
                      style={{
                        height: 2,
                        flex: 1,
                        backgroundColor:
                          i < stepIndex
                            ? "var(--accent-blue)"
                            : "var(--color-border-subtle)",
                        transition: "background-color 0.3s ease",
                      }}
                    />
                  )}
                </Fragment>
              ))}
            </div>

            {step === "qualification" && (
              <QualificationStep
                selected={qualification}
                onSelect={setQualification}
                onContinue={() => qualification && setStep("study")}
              />
            )}

            {step === "study" && (
              <StudyContextStep
                targetExamWindow={targetExamWindow}
                setTargetExamWindow={setTargetExamWindow}
                qualificationStage={qualificationStage}
                setQualificationStage={setQualificationStage}
                onBack={() => setStep("qualification")}
                onContinue={() => {
                  if (targetExamWindow && qualificationStage) setStep("details");
                }}
              />
            )}

            {step === "details" && (
              <DetailsStep
                fullName={fullName}
                setFullName={setFullName}
                company={company}
                setCompany={setCompany}
                role={role}
                setRole={setRole}
                linkedinUrl={linkedinUrl}
                setLinkedinUrl={setLinkedinUrl}
                hideLinkedIn={signedUpWithLinkedIn}
                heardFrom={heardFrom}
                setHeardFrom={setHeardFrom}
                heardFromDetail={heardFromDetail}
                setHeardFromDetail={setHeardFromDetail}
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                marketingConsent={marketingConsent}
                setMarketingConsent={setMarketingConsent}
                onBack={() => setStep("study")}
                onSubmit={handleSubmit}
                submitting={submitting}
                error={error}
              />
            )}

            {!ONBOARDING_REQUIRED && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <Link
                  href="/"
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-muted)",
                    textDecoration: "none",
                  }}
                >
                  Skip for now
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  const bg = done || active ? "var(--accent-blue)" : "var(--color-border-subtle)";
  const color = done || active ? "#fff" : "var(--color-text-muted)";
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 600,
        transition: "background-color 0.3s ease",
        flexShrink: 0,
      }}
    >
      {done ? <Check size={14} /> : active ? "•" : ""}
    </div>
  );
}

function QualificationStep({
  selected,
  onSelect,
  onContinue,
}: {
  selected: Qualification | null;
  onSelect: (q: Qualification) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h1
        className="text-display mb-2"
        style={{ textAlign: "center", color: "var(--color-text)" }}
      >
        Which qualification are you taking?
      </h1>
      <p
        className="text-body"
        style={{
          textAlign: "center",
          color: "var(--color-text-secondary)",
          marginBottom: 32,
        }}
      >
        Pick the one you&apos;re studying for — you can change this later.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {QUALIFICATION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              aria-pressed={isSelected}
              style={{
                position: "relative",
                padding: "28px 20px",
                borderRadius: "var(--radius-md)",
                border: `2px solid ${
                  isSelected ? opt.accent : "var(--color-border-subtle)"
                }`,
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${opt.accent} 8%, var(--color-card))`
                  : "var(--color-card)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 140,
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    backgroundColor: opt.accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={14} />
                </div>
              )}
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: isSelected ? opt.accent : "var(--color-text)",
                  lineHeight: 1.1,
                }}
              >
                {opt.title}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {opt.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary"
          size="lg"
          rightIcon={ArrowRight}
          onClick={onContinue}
          disabled={!selected}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function StudyContextStep({
  targetExamWindow,
  setTargetExamWindow,
  qualificationStage,
  setQualificationStage,
  onBack,
  onContinue,
}: {
  targetExamWindow: TargetExamWindow | "";
  setTargetExamWindow: (v: TargetExamWindow | "") => void;
  qualificationStage: QualificationStage | "";
  setQualificationStage: (v: QualificationStage | "") => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = Boolean(targetExamWindow && qualificationStage);

  return (
    <div>
      <h1
        className="text-display mb-2"
        style={{ textAlign: "center", color: "var(--color-text)" }}
      >
        Where are you in your studies?
      </h1>
      <p
        className="text-body"
        style={{
          textAlign: "center",
          color: "var(--color-text-secondary)",
          marginBottom: 32,
        }}
      >
        This helps us pace your practice and surface the right material.
      </p>

      <div
        className="card"
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <DropdownField
          label="When are you sitting your exam?"
          value={targetExamWindow}
          onChange={(v) => setTargetExamWindow(v as TargetExamWindow | "")}
          options={TARGET_EXAM_WINDOWS}
        />

        <DropdownField
          label="What stage are you at?"
          value={qualificationStage}
          onChange={(v) => setQualificationStage(v as QualificationStage | "")}
          options={QUALIFICATION_STAGES}
        />
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button variant="ghost" size="lg" leftIcon={ArrowLeft} onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          rightIcon={ArrowRight}
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function DropdownField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        <option value="" disabled>
          Select an option…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-subtle)",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text)",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  paddingRight: 40,
};

function DetailsStep({
  fullName,
  setFullName,
  company,
  setCompany,
  role,
  setRole,
  linkedinUrl,
  setLinkedinUrl,
  hideLinkedIn,
  heardFrom,
  setHeardFrom,
  heardFromDetail,
  setHeardFromDetail,
  termsAccepted,
  setTermsAccepted,
  marketingConsent,
  setMarketingConsent,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (v: string) => void;
  hideLinkedIn: boolean;
  heardFrom: HeardFromOption | "";
  setHeardFrom: (v: HeardFromOption | "") => void;
  heardFromDetail: string;
  setHeardFromDetail: (v: string) => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  marketingConsent: boolean;
  setMarketingConsent: (v: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

  return (
    <div>
      <h1
        className="text-display mb-2"
        style={{ textAlign: "center", color: "var(--color-text)" }}
      >
        Tell us about yourself
      </h1>
      <p
        className="text-body"
        style={{
          textAlign: "center",
          color: "var(--color-text-secondary)",
          marginBottom: 32,
        }}
      >
        Just a few details so we can personalise your experience.
      </p>

      <div
        className="card"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Smith"
          maxLength={100}
          autoComplete="name"
        />

        <Input
          label="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Where do you work?"
          maxLength={100}
          autoComplete="organization"
        />

        <Input
          label="Role (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Audit Trainee, Risk Analyst"
          maxLength={100}
          autoComplete="organization-title"
        />

        {!hideLinkedIn && (
          <Input
            label="LinkedIn profile (optional)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/your-handle"
            maxLength={200}
            type="url"
            inputMode="url"
            autoComplete="url"
          />
        )}

        <div>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text)",
              marginBottom: 8,
            }}
          >
            How did you hear about us?
          </label>
          <select
            value={heardFrom}
            onChange={(e) => setHeardFrom(e.target.value as HeardFromOption | "")}
            style={selectStyle}
          >
            <option value="" disabled>
              Select an option…
            </option>
            {HEARD_FROM_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {heardFrom === "Other" && (
            <input
              type="text"
              value={heardFromDetail}
              onChange={(e) => setHeardFromDetail(e.target.value)}
              maxLength={200}
              placeholder="Tell us more (optional)"
              style={{
                marginTop: 8,
                width: "100%",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-subtle)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-text)",
                fontFamily: "inherit",
                fontSize: 14,
                outline: "none",
              }}
            />
          )}
        </div>

        {/* Consents */}
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <ConsentRow
            checked={marketingConsent}
            onChange={setMarketingConsent}
          >
            Email me product updates, launch news, and learning tips. You can
            unsubscribe at any time.
          </ConsentRow>

          <ConsentRow checked={termsAccepted} onChange={setTermsAccepted}>
            I accept the{" "}
            <LegalLinkButton onClick={() => setLegalModal("terms")}>
              Terms of Service
            </LegalLinkButton>{" "}
            and{" "}
            <LegalLinkButton onClick={() => setLegalModal("privacy")}>
              Privacy Policy
            </LegalLinkButton>
            .{" "}
            <span style={{ color: "#ef4444" }} aria-hidden>
              *
            </span>
          </ConsentRow>
        </div>

        <LegalModal
          isOpen={legalModal === "terms"}
          onClose={() => setLegalModal(null)}
          title="Terms of Service"
          source="/terms.html"
        />
        <LegalModal
          isOpen={legalModal === "privacy"}
          onClose={() => setLegalModal(null)}
          title="Privacy Policy"
          source="/privacypolicy.html"
        />

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="ghost"
          size="lg"
          leftIcon={ArrowLeft}
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          loading={submitting}
          disabled={!termsAccepted || submitting}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}

/**
 * Renders inline text styled like a link but is actually a `<button>`. Used
 * inside the consent-row `<label>` for Terms / Privacy so clicking the link
 * doesn't navigate away from the onboarding flow — and stops propagation so
 * the surrounding label doesn't toggle the checkbox.
 */
function LegalLinkButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        color: "var(--color-tint)",
        textDecoration: "underline",
        cursor: "pointer",
        font: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function ConsentRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          marginTop: 3,
          width: 18,
          height: 18,
          accentColor: "var(--color-tint)",
          flexShrink: 0,
          cursor: "pointer",
        }}
      />
      <span
        style={{
          fontSize: 14,
          color: "var(--color-text)",
          lineHeight: 1.5,
        }}
      >
        {children}
      </span>
    </label>
  );
}
