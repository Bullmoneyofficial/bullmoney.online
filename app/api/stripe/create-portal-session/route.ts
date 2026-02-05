import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

// Create a customer portal session for managing subscriptions/payment methods
export async function POST(req: NextRequest) {
  try {
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.get('origin')}/store`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
