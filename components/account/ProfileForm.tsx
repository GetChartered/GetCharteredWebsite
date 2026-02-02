'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

interface ProfileFormProps {
  user: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [email] = useState(user.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage({
        type: 'success',
        text: 'Profile updated successfully',
      });
      setIsEditing(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name || '');
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-6">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-24 h-24 rounded-full"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-background-muted flex items-center justify-center">
            <span className="text-display font-semibold text-text-main">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-label font-semibold text-text-main mb-1">Profile Picture</h3>
          <p className="text-caption text-text-secondary mb-3">
            Managed by your authentication provider
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isEditing}
          placeholder="Your name"
        />

        <Input
          label="Email"
          value={email}
          disabled
          helperText="Email cannot be changed. Contact support if you need to update it."
        />
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-color-success/10 text-color-success'
              : 'bg-color-danger/10 text-color-danger'
          }`}
        >
          <p className="text-body">{message.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="primary">
            Edit Profile
          </Button>
        ) : (
          <>
            <Button onClick={handleSave} variant="primary" loading={isSaving}>
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
