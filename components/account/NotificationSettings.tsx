'use client';

import { useState } from 'react';

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  return (
    <div className="space-y-4">
      <p className="text-body text-text-secondary mb-6">
        Manage how you receive notifications and updates from GetChartered
      </p>

      {/* Email Notifications */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
        <div className="flex-1">
          <p className="text-label font-medium text-text-main mb-1">Email Notifications</p>
          <p className="text-caption text-text-secondary">
            Receive notifications via email
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-background-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-tint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-tint"></div>
        </label>
      </div>

      {/* Practice Reminders */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
        <div className="flex-1">
          <p className="text-label font-medium text-text-main mb-1">Practice Reminders</p>
          <p className="text-caption text-text-secondary">
            Get reminded to practice daily (mobile app only)
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={practiceReminders}
            onChange={(e) => setPracticeReminders(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-background-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-tint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-tint"></div>
        </label>
      </div>

      {/* Progress Updates */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
        <div className="flex-1">
          <p className="text-label font-medium text-text-main mb-1">Weekly Progress Updates</p>
          <p className="text-caption text-text-secondary">
            Receive weekly summaries of your practice progress
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={progressUpdates}
            onChange={(e) => setProgressUpdates(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-background-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-tint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-tint"></div>
        </label>
      </div>

      {/* Product Updates */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle">
        <div className="flex-1">
          <p className="text-label font-medium text-text-main mb-1">Product Updates</p>
          <p className="text-caption text-text-secondary">
            News about new features and improvements
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={productUpdates}
            onChange={(e) => setProductUpdates(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-background-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-color-tint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color-tint"></div>
        </label>
      </div>

      <div className="pt-4 border-t border-border-subtle">
        <p className="text-caption text-text-secondary">
          Note: These settings are currently stored locally. To sync across devices, we'll need to
          implement a backend API.
        </p>
      </div>
    </div>
  );
}
