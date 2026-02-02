import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { AccountNavItem } from '@/components/account/AccountNav';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const user = session.user;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container py-24">
        <div className="mb-12">
          <h1 className="text-display mb-4">My Account</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Manage your profile, subscription, and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="card sticky top-8">
              {/* User Info */}
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      style={{ width: 40, height: 40, borderRadius: '50%' }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-background-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name || 'User'}
                    </p>
                    <p
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav style={{ padding: '12px' }}>
                <ul style={{ listStyle: 'none' }}>
                  <AccountNavItem href="/my-account" icon="overview">
                    Overview
                  </AccountNavItem>
                  <AccountNavItem href="/my-account/profile" icon="profile">
                    My Details
                  </AccountNavItem>
                  <AccountNavItem href="/my-account/subscriptions" icon="subscription">
                    Subscriptions
                  </AccountNavItem>
                  <AccountNavItem href="/my-account/settings" icon="settings">
                    Settings
                  </AccountNavItem>
                </ul>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
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
