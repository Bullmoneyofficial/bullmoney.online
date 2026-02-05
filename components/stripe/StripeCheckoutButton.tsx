'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutButtonProps {
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  customerEmail?: string;
  metadata?: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function StripeCheckoutButton({
  items,
  customerEmail,
  metadata,
  className = '',
  children,
  disabled = false,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerEmail,
          metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        children || (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Checkout with Stripe</span>
          </>
        )
      )}
    </button>
  );
}
