import { auth0, getUserMetadataCached, getProfileCached, isNextControlFlowError } from "@/lib/auth0";
import type { OnboardingMetadata } from "@/lib/auth0-management";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AvatarUpload } from "@/components/account/AvatarUpload";
import { AccountSidebarNav } from "@/components/account/AccountSidebarNav";

// Resolve a display name, preferring the DynamoDB-backed profile (the name
// a user actually gave during onboarding — see lib/profile.ts) over Auth0's
// user_metadata.full_name, which stopped being written once onboarding
// moved off it (app/api/onboarding/route.ts writes straight to the backend
// now, Auth0 stays identity/login only) and is empty for anyone who
// onboarded through the current flow. metadataName is kept as a fallback
// for any pre-migration user whose name still only lives in Auth0. Treats
// email-shaped names ("foo@bar.com") as missing — Auth0 stamps these in for
// database users that haven't picked a real name yet.
function pickDisplayName(
  profileName: string | undefined,
  metadataName: string | undefined,
  sessionName: string | undefined,
  email: string | undefined
): string {
  if (profileName && profileName.trim()) return profileName.trim();
  if (metadataName && metadataName.trim()) return metadataName.trim();
  if (sessionName && !sessionName.includes("@")) {
    if (!email || sessionName.toLowerCase() !== email.toLowerCase()) {
      return sessionName;
    }
  }
  return "";
}

function getInitials(name: string, email?: string): string {
  const source = name.trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]) return parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() || "U";
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/my-account");
  }

  const user = session.user;
  const metadata = await getUserMetadataCached(user.sub).catch(
    (): OnboardingMetadata => ({})
  );

  // Fetched here (rather than only below for photoUrl) so pickDisplayName
  // can prefer it — same defensive try/catch shape as elsewhere in this
  // file: a profile-fetch failure degrades gracefully instead of crashing
  // the whole account section.
  let profileFullName: string | undefined;
  let photoUrl: string | undefined;
  try {
    const profile = await getProfileCached(user.sub);
    profileFullName = profile.fullName;
    photoUrl = profile.photoUrl;
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error("AccountLayout: failed to fetch profile for name/avatar", { userId: user.sub, error });
  }

  const displayName = pickDisplayName(profileFullName, metadata.full_name, user.name, user.email);
  const initials = getInitials(displayName, user.email);

  // Database (email/password) users get a "Security" jump-link since that
  // section only renders for them — see app/my-account/page.tsx's own
  // identical check for why (social-login credentials live with the IdP).
  const isDatabaseUser = user.sub?.startsWith("auth0|") ?? false;

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Two-column page shell: a sticky left sidebar (identity + jump
          nav + Log Out) and the actual account content on the right,
          genuinely occupying its own grid track (1fr) rather than one
          centred column with a header strip above it. */}
      <div className="account-page-header">
        <h1 className="text-display mb-2">My Account</h1>
        <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
          Manage your profile, subscription, and preferences
        </p>
      </div>

      <div className="account-layout">
        <aside className="account-sidebar">
          <AvatarUpload
            initialPhotoUrl={photoUrl}
            fallbackPictureUrl={user.picture}
            displayName={displayName}
            email={user.email ?? ""}
            initials={initials}
          />

          <AccountSidebarNav includeSecurity={isDatabaseUser} />

          <a href="/auth/logout" className="account-sidebar-logout">
            Log Out
          </a>
        </aside>

        <main className="account-main">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
