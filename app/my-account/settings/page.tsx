import { ThemeSettings } from '@/components/account/ThemeSettings';
import { NotificationSettings } from '@/components/account/NotificationSettings';

export default async function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-title font-bold text-text-main mb-2">Settings</h2>
        <p className="text-body text-text-secondary">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Appearance Settings */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Appearance</h3>
        <ThemeSettings />
      </div>

      {/* Notification Settings */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Notifications</h3>
        <NotificationSettings />
      </div>

      {/* Course Preferences */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Course Preferences</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-label font-medium text-text-main mb-1">Selected Course</p>
            <p className="text-caption text-text-secondary mb-4">
              Choose which course you're currently studying
            </p>
            <span className="badge badge-info">Coming Soon</span>
          </div>

          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-label font-medium text-text-main mb-1">Included Modules</p>
            <p className="text-caption text-text-secondary mb-4">
              Select which modules to include in your practice sessions
            </p>
            <span className="badge badge-info">Coming Soon</span>
          </div>

          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-label font-medium text-text-main mb-1">Offline Modules</p>
            <p className="text-caption text-text-secondary mb-4">
              Download modules for offline practice (mobile app only)
            </p>
            <span className="badge">Mobile Only</span>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card p-8">
        <h3 className="text-label font-semibold text-text-main mb-6">Privacy & Data</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-label font-medium text-text-main mb-1">Data Usage</p>
            <p className="text-caption text-text-secondary mb-4">
              We collect practice data to improve your learning experience
            </p>
            <p className="text-caption text-text-slight">
              View our{' '}
              <a href="/privacy" className="text-color-tint hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border-subtle">
            <p className="text-label font-medium text-text-main mb-1">Download Your Data</p>
            <p className="text-caption text-text-secondary mb-4">
              Request a copy of all your data
            </p>
            <span className="badge badge-info">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
