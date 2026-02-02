'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import CancelSubscription from '@/components/CancelSubscription';

interface CancelSubscriptionDialogProps {
  subscriptionId: string;
}

export function CancelSubscriptionDialog({ subscriptionId }: CancelSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCancel = async () => {
    setIsCancelling(true);

    const formData = new FormData();
    formData.append('reason', reason);
    formData.append('subscriptionId', subscriptionId);

    try {
      await CancelSubscription(formData);
      window.location.href = '/my-account/subscriptions';
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (isCancelling) return;
    setIsOpen(false);
    setReason('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        Cancel Subscription
      </Button>

      {isOpen && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '448px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3 className="text-title" style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              Cancel Subscription
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '22px' }}>
              Are you sure you want to cancel your subscription? You'll lose access to all premium
              features at the end of your billing period.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
                Please tell us why you're cancelling (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Your feedback helps us improve..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-tint)';
                  e.target.style.borderWidth = '2px';
                  e.target.style.padding = '11px 15px';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border-subtle)';
                  e.target.style.borderWidth = '1px';
                  e.target.style.padding = '12px 16px';
                }}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCancel} variant="secondary" loading={isCancelling} fullWidth>
                Confirm Cancellation
              </Button>
              <Button onClick={handleClose} variant="primary" disabled={isCancelling} fullWidth>
                Keep Subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
