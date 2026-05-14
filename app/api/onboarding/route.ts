import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import {
  getUserMetadata,
  updateUserMetadata,
  QUALIFICATIONS,
  HEARD_FROM_OPTIONS,
  TARGET_EXAM_WINDOWS,
  QUALIFICATION_STAGES,
  type Qualification,
  type HeardFromOption,
  type TargetExamWindow,
  type QualificationStage,
  type OnboardingMetadata,
} from '@/lib/auth0-management';

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const metadata = await getUserMetadata(session.user.sub);
    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load onboarding data' },
      { status: 500 }
    );
  }
}

const MAX_NAME = 100;
const MAX_COMPANY = 100;
const MAX_ROLE = 100;
const MAX_LINKEDIN = 200;
const MAX_HEARD_FROM_DETAIL = 200;

function isLinkedInUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return /(^|\.)linkedin\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;

  // full_name (required)
  const fullName =
    typeof input.full_name === 'string' ? input.full_name.trim() : '';
  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }
  if (fullName.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Full name must be ${MAX_NAME} characters or fewer` },
      { status: 400 }
    );
  }

  // qualifications (required, array of allowed values, at least one)
  if (!Array.isArray(input.qualifications) || input.qualifications.length === 0) {
    return NextResponse.json(
      { error: 'Please pick a qualification' },
      { status: 400 }
    );
  }
  const allowed = new Set<string>(QUALIFICATIONS);
  const qualifications: Qualification[] = [];
  for (const q of input.qualifications) {
    if (typeof q !== 'string' || !allowed.has(q)) {
      return NextResponse.json(
        { error: `Unknown qualification: ${String(q)}` },
        { status: 400 }
      );
    }
    qualifications.push(q as Qualification);
  }

  // company (optional)
  let company: string | undefined;
  if (input.company !== undefined && input.company !== null && input.company !== '') {
    if (typeof input.company !== 'string') {
      return NextResponse.json({ error: 'Invalid company' }, { status: 400 });
    }
    const trimmed = input.company.trim();
    if (trimmed.length > MAX_COMPANY) {
      return NextResponse.json(
        { error: `Company must be ${MAX_COMPANY} characters or fewer` },
        { status: 400 }
      );
    }
    if (trimmed) company = trimmed;
  }

  // role (optional)
  let role: string | undefined;
  if (input.role !== undefined && input.role !== null && input.role !== '') {
    if (typeof input.role !== 'string') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const trimmed = input.role.trim();
    if (trimmed.length > MAX_ROLE) {
      return NextResponse.json(
        { error: `Role must be ${MAX_ROLE} characters or fewer` },
        { status: 400 }
      );
    }
    if (trimmed) role = trimmed;
  }

  // heard_from (required, one of the allowed values)
  if (typeof input.heard_from !== 'string') {
    return NextResponse.json(
      { error: 'Please tell us how you heard about us' },
      { status: 400 }
    );
  }
  const allowedHeardFrom = new Set<string>(HEARD_FROM_OPTIONS);
  if (!allowedHeardFrom.has(input.heard_from)) {
    return NextResponse.json(
      { error: `Unknown source: ${input.heard_from}` },
      { status: 400 }
    );
  }
  const heardFrom = input.heard_from as HeardFromOption;

  // heard_from_detail — optional free text, only meaningful for "Other"
  let heardFromDetail: string | undefined;
  if (
    heardFrom === 'Other' &&
    typeof input.heard_from_detail === 'string' &&
    input.heard_from_detail.trim().length > 0
  ) {
    const trimmed = input.heard_from_detail.trim();
    if (trimmed.length > MAX_HEARD_FROM_DETAIL) {
      return NextResponse.json(
        {
          error: `Detail must be ${MAX_HEARD_FROM_DETAIL} characters or fewer`,
        },
        { status: 400 }
      );
    }
    heardFromDetail = trimmed;
  }

  // linkedin_url (optional, must be a linkedin.com URL when present).
  // Skipped entirely when the user signed up via LinkedIn — Auth0's `sub`
  // prefix is the source of truth for connection identity.
  const signedUpWithLinkedIn = session.user.sub?.startsWith('linkedin');
  let linkedinUrl: string | undefined;
  if (
    !signedUpWithLinkedIn &&
    input.linkedin_url !== undefined &&
    input.linkedin_url !== null &&
    input.linkedin_url !== ''
  ) {
    if (typeof input.linkedin_url !== 'string') {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
    }
    const trimmed = input.linkedin_url.trim();
    if (trimmed.length > MAX_LINKEDIN) {
      return NextResponse.json(
        { error: `LinkedIn URL must be ${MAX_LINKEDIN} characters or fewer` },
        { status: 400 }
      );
    }
    if (!isLinkedInUrl(trimmed)) {
      return NextResponse.json(
        { error: 'LinkedIn URL must point to linkedin.com' },
        { status: 400 }
      );
    }
    linkedinUrl = trimmed;
  }

  // target_exam_window (required, one of the allowed values)
  if (typeof input.target_exam_window !== 'string') {
    return NextResponse.json(
      { error: 'Please choose when you’re sitting your exam' },
      { status: 400 }
    );
  }
  const allowedExamWindows = new Set<string>(
    TARGET_EXAM_WINDOWS.map((o) => o.value)
  );
  if (!allowedExamWindows.has(input.target_exam_window)) {
    return NextResponse.json(
      { error: `Unknown exam window: ${input.target_exam_window}` },
      { status: 400 }
    );
  }
  const targetExamWindow = input.target_exam_window as TargetExamWindow;

  // qualification_stage (required, one of the allowed values)
  if (typeof input.qualification_stage !== 'string') {
    return NextResponse.json(
      { error: 'Please tell us your current stage' },
      { status: 400 }
    );
  }
  const allowedStages = new Set<string>(
    QUALIFICATION_STAGES.map((o) => o.value)
  );
  if (!allowedStages.has(input.qualification_stage)) {
    return NextResponse.json(
      { error: `Unknown stage: ${input.qualification_stage}` },
      { status: 400 }
    );
  }
  const qualificationStage = input.qualification_stage as QualificationStage;

  // terms_accepted — required boolean true. We don't trust the client's
  // timestamp; we either preserve the existing one or stamp it server-side now.
  if (input.terms_accepted !== true) {
    return NextResponse.json(
      { error: 'You must accept the Terms and Privacy Policy to continue' },
      { status: 400 }
    );
  }

  // marketing_consent — optional boolean, defaults to false.
  const marketingConsent =
    typeof input.marketing_consent === 'boolean' ? input.marketing_consent : false;

  // Look up existing metadata to preserve audit timestamps when appropriate.
  let existing: OnboardingMetadata = {};
  try {
    existing = await getUserMetadata(session.user.sub);
  } catch (error) {
    console.error('Onboarding POST: failed to read existing metadata', error);
    // Non-fatal — proceed with empty existing; we'll just stamp new timestamps.
  }

  const now = new Date().toISOString();
  const termsAcceptedAt = existing.terms_accepted_at ?? now;
  // Only refresh the marketing consent timestamp when the user is opting in
  // (false → true). If they're opting out or staying opted in, preserve.
  let marketingConsentAt = existing.marketing_consent_at;
  if (marketingConsent && !existing.marketing_consent) {
    marketingConsentAt = now;
  } else if (!marketingConsent) {
    // Opting out clears the consent timestamp (record of withdrawn consent).
    marketingConsentAt = undefined;
  }

  const metadata: OnboardingMetadata = {
    full_name: fullName,
    qualifications,
    company,
    role,
    linkedin_url: linkedinUrl,
    heard_from: heardFrom,
    heard_from_detail: heardFromDetail,
    target_exam_window: targetExamWindow,
    qualification_stage: qualificationStage,
    terms_accepted_at: termsAcceptedAt,
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsentAt,
    onboarding_completed: true,
  };

  // Auth0 treats `name` as a root attribute owned by the IdP for social and
  // enterprise connections (google-oauth2|, linkedin|, oauth2|linkedin|, …),
  // so PATCHing it returns 400. Only database (auth0|…) users can have their
  // root name updated; for everyone else we rely on `user_metadata.full_name`.
  const isDatabaseUser = session.user.sub?.startsWith('auth0|') ?? false;

  try {
    await updateUserMetadata(session.user.sub, {
      name: isDatabaseUser ? fullName : undefined,
      metadata,
    });
    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}
