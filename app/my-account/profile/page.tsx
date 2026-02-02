import { auth0 } from '@/lib/auth0';
import { ProfileForm } from '@/components/account/ProfileForm';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-title font-bold text-text-main mb-2">My Details</h2>
        <p className="text-body text-text-secondary">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Information Card */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Profile Information</h3>
        <ProfileForm user={user} />
      </div>

      {/* Account Security Card */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Account Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
            <div>
              <p className="text-label font-medium text-text-main mb-1">Password</p>
              <p className="text-caption text-text-secondary">
                Manage your password through your authentication provider
              </p>
            </div>
            <a
              href={`https://${process.env.AUTH0_DOMAIN}/authorize?client_id=${process.env.AUTH0_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.APP_BASE_URL + '/auth/callback')}&screen_hint=reset-password`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Change Password
            </a>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
            <div>
              <p className="text-label font-medium text-text-main mb-1">Two-Factor Authentication</p>
              <p className="text-caption text-text-secondary">
                Add an extra layer of security to your account
              </p>
            </div>
            <span className="badge">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-8 border-2 border-color-danger/20">
        <h3 className="text-label font-semibold text-color-danger mb-6">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-color-danger/5">
            <div>
              <p className="text-label font-medium text-text-main mb-1">Delete Account</p>
              <p className="text-caption text-text-secondary">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Link href="/account/delete" className="btn btn-danger">
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
