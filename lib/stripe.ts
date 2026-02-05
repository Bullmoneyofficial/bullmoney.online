import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Deprecated: Use getStripe() instead for lazy initialization
// This is kept for backwards compatibility but will throw at build time
export const stripe = null as unknown as Stripe;

// Format amount for Stripe (cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Format amount for display
export const formatAmountForDisplay = (amount: number): string => {
  return (amount / 100).toFixed(2);
};
