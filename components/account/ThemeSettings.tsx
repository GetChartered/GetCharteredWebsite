'use client';

import { useTheme } from '@/components/ThemeProvider';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-body text-text-secondary mb-4">
          Choose how GetChartered looks to you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Light Theme Option */}
        <button
          onClick={() => setTheme('light')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            theme === 'light'
              ? 'border-color-tint bg-accent-subtle'
              : 'border-border-subtle hover:border-border-main'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
              <span className="text-xl">☀️</span>
            </div>
            <div className="flex-1">
              <p className="text-label font-semibold text-text-main">Light</p>
              {theme === 'light' && (
                <p className="text-caption text-color-tint">Active</p>
              )}
            </div>
            {theme === 'light' && (
              <div className="w-5 h-5 rounded-full bg-color-tint flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
          </div>
          <p className="text-caption text-text-secondary">
            Clean and bright interface
          </p>
        </button>

        {/* Dark Theme Option */}
        <button
          onClick={() => setTheme('dark')}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
            theme === 'dark'
              ? 'border-color-tint bg-accent-subtle'
              : 'border-border-subtle hover:border-border-main'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
              <span className="text-xl">🌙</span>
            </div>
            <div className="flex-1">
              <p className="text-label font-semibold text-text-main">Dark</p>
              {theme === 'dark' && (
                <p className="text-caption text-color-tint">Active</p>
              )}
            </div>
            {theme === 'dark' && (
              <div className="w-5 h-5 rounded-full bg-color-tint flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
          </div>
          <p className="text-caption text-text-secondary">
            Easy on the eyes in low-light environments
          </p>
        </button>
      </div>
    </div>
  );
}
