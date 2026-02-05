import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripeJs = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Helper to redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripeJs();
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }
  return stripe.redirectToCheckout({ sessionId });
};

// Helper to create checkout session and redirect
export const createCheckoutAndRedirect = async (items: CheckoutItem[], options?: CheckoutOptions) => {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      customerEmail: options?.customerEmail,
      metadata: options?.metadata,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe hosted checkout
  if (data.url) {
    window.location.href = data.url;
  } else {
    await redirectToCheckout(data.sessionId);
  }
};

// Types
export interface CheckoutItem {
  productId: string;
  variantId?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutOptions {
  customerEmail?: string;
  metadata?: Record<string, string>;
}
