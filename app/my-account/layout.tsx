import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { AccountNavItem } from "@/components/account/AccountNav";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

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
                className="flex items-center"
                style={{
                  gap: "10px",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="rounded-full"
                    style={{ width: "40px", height: "40px", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center font-semibold"
                    style={{
                      width: "22px",
                      height: "22px",
                      backgroundColor: "var(--color-background-muted)",
                      fontSize: "10px",
                      flexShrink: 0,
                    }}
                  >
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <p
                  className="text-text-secondary"
                  style={{
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {user.email}
                </p>
              </div>

              {/* Navigation Links */}
              <nav style={{ padding: "8px" }}>
                <ul style={{ listStyle: "none" }}>
                  <AccountNavItem href="/my-account" icon="overview">
                    Overview
                  </AccountNavItem>
                  <AccountNavItem href="/my-account/profile" icon="profile">
                    My Details
                  </AccountNavItem>
                  <AccountNavItem
                    href="/my-account/subscriptions"
                    icon="subscription"
                  >
                    Subscriptions
                  </AccountNavItem>
                </ul>

                <div
                  style={{
                    margin: "8px 8px 0",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <LogoutButton />
                </div>
              </nav>
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
