'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ChangePasswordButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    setSentToEmail(null);

    try {
      const response = await fetch('/api/change-password', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send password reset email.');
        return;
      }

      setSentToEmail(data.email);
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ flexShrink: 0, textAlign: 'right' }}>
      <button
        onClick={handleClick}
        disabled={isLoading || sentToEmail !== null}
        className="btn btn-outline btn-sm"
      >
        {isLoading
          ? 'Sending…'
          : sentToEmail
          ? 'Email Sent'
          : 'Change Password'}
      </button>

      {sentToEmail && (
        <div
          className="flex items-center gap-2 mt-2 text-caption"
          style={{ color: 'var(--color-success)', justifyContent: 'flex-end' }}
        >
          <CheckCircle2 size={14} />
          <span>Check {sentToEmail} for a reset link.</span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 mt-2 text-caption"
          style={{ color: 'var(--color-danger)', justifyContent: 'flex-end' }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
