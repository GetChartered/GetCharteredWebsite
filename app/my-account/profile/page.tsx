import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-title mb-2" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          My Details
        </h2>
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your personal information and account settings
        </p>
      </div>

      {/* Account Security Card */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 className="text-label mb-4" style={{ fontWeight: 700, color: 'var(--color-text)' }}>
          Account Security
        </h3>
        <div className="space-y-8">
          <div className="p-4 rounded-lg">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                  Password
                </p>
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  Manage your password through your authentication provider
                </p>
              </div>
              <a
                href="/auth/login?screen_hint=reset-password"
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0 }}
              >
                Change Password
              </a>
            </div>
          </div>

          <div className="p-4 rounded-lg">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                  Two-Factor Authentication
                </p>
                <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  Add an extra layer of security to your account
                </p>
              </div>
              <span className="badge" style={{ flexShrink: 0 }}>
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="card border-2 border-color-danger/20"
        style={{ padding: "24px" }}
      >
        <h3 className="text-label mb-4" style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
          Danger Zone
        </h3>
        <div className="p-4 rounded-lg bg-color-danger/5">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-label mb-1" style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                Delete Account
              </p>
              <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                Permanently delete your account and all associated data
              </p>
            </div>
            <Link
              href="/account/delete"
              className="btn btn-danger btn-sm"
              style={{ flexShrink: 0 }}
            >
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
