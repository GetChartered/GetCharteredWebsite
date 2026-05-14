import { auth0, getUserMetadataCached } from "@/lib/auth0";
import type { OnboardingMetadata } from "@/lib/auth0-management";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

// Resolve a display name from the user's onboarding metadata, falling back
// to whatever the IdP supplied. Treats email-shaped names ("foo@bar.com")
// as missing — Auth0 stamps these in for database users that haven't picked
// a real name yet.
function pickDisplayName(
  metadataName: string | undefined,
  sessionName: string | undefined,
  email: string | undefined
): string {
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
  const displayName = pickDisplayName(metadata.full_name, user.name, user.email);
  const initials = getInitials(displayName, user.email);

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container py-12" style={{ paddingTop: "80px" }}>
        <div className="mb-8">
          <h1 className="text-display mb-2">My Account</h1>
          <p className="text-body text-text-secondary">
            Manage your profile, subscription, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="card sticky top-8" style={{ padding: 0 }}>
              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 16px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={displayName || user.email || "User"}
                    className="rounded-full"
                    style={{
                      width: "44px",
                      height: "44px",
                      flexShrink: 0,
                      objectFit: "cover",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: "44px",
                      height: "44px",
                      flexShrink: 0,
                      backgroundColor:
                        "color-mix(in srgb, var(--color-tint) 14%, transparent)",
                      color: "var(--color-tint)",
                      fontSize: "15px",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {displayName && (
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                      title={displayName}
                    >
                      {displayName}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.3,
                      marginTop: displayName ? "2px" : 0,
                    }}
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <div style={{ padding: "8px" }}>
                <LogoutButton />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
