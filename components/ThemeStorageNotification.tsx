"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Optional notification component to inform users when localStorage is unavailable
 * Theme preferences will only persist for the current session in this case
 *
 * Usage: Add this component near your theme toggle button
 * Example: <ThemeStorageNotification />
 */
export function ThemeStorageNotification() {
  const { isStorageAvailable } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show notification after a delay if storage is unavailable and not dismissed
    if (!isStorageAvailable && !isDismissed) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isStorageAvailable, isDismissed]);

  const handleDismiss = () => {
    setShowNotification(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    try {
      sessionStorage.setItem('theme-notification-dismissed', 'true');
    } catch (err) {
      // Ignore if sessionStorage is also unavailable
    }
  };

  // Check if user previously dismissed the notification this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('theme-notification-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch (err) {
      // Ignore if sessionStorage is unavailable
    }
  }, []);

  if (!showNotification || isStorageAvailable) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '400px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '14px',
        lineHeight: '20px',
        color: 'var(--color-text)',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 500, marginBottom: '4px', color: 'var(--color-text)' }}>
            Theme preference not saved
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Your theme preference will only persist for this session. This may occur in private browsing mode.
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-secondary)',
            fontSize: '18px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
