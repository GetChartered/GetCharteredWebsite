'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface BillingPortalButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function BillingPortalButton({ className, children }: BillingPortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const { url } = await response.json();

      // Redirect to the billing portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      alert('Failed to open billing portal. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className || 'btn btn-primary btn-sm'}
    >
      <span className="flex items-center gap-2">
        {isLoading ? 'Loading...' : (children || 'Manage Billing')}
        {!isLoading && <ExternalLink size={14} />}
      </span>
    </button>
  );
}
