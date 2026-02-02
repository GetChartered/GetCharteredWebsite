'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import CancelSubscription from '@/components/CancelSubscription';

interface CancelSubscriptionDialogProps {
  subscriptionId: string;
}

export function CancelSubscriptionDialog({ subscriptionId }: CancelSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);

    const formData = new FormData();
    formData.append('reason', reason);
    formData.append('subscriptionId', subscriptionId);

    try {
      await CancelSubscription(formData);
      // Redirect to success page or refresh
      window.location.href = '/my-account/subscriptions';
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      setIsCancelling(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Cancel Subscription
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background-main rounded-lg max-w-md w-full p-8">
        <h3 className="text-title font-bold text-text-main mb-4">Cancel Subscription</h3>
        <p className="text-body text-text-secondary mb-6">
          Are you sure you want to cancel your subscription? You'll lose access to all premium
          features at the end of your billing period.
        </p>

        <div className="mb-6">
          <label className="block text-label font-medium text-text-main mb-2">
            Please tell us why you're cancelling (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border-main bg-background-main text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-color-tint resize-none"
            rows={4}
            placeholder="Your feedback helps us improve..."
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleCancel} variant="outline" loading={isCancelling} fullWidth>
            Confirm Cancellation
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              setReason('');
            }}
            variant="primary"
            disabled={isCancelling}
            fullWidth
          >
            Keep Subscription
          </Button>
        </div>
      </div>
    </div>
  );
}
