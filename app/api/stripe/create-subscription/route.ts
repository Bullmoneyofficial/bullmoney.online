import { NextRequest, NextResponse } from 'next/server';
import { getStripe, formatAmountForStripe } from '@/lib/stripe';

// Create a subscription checkout session
export async function POST(req: NextRequest) {
  try {
    const { priceId, customerEmail, metadata, trialDays } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/store/checkout`,
      metadata: metadata || {},
      allow_promotion_codes: true,
    };

    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    if (trialDays && trialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: trialDays,
      };
    }

    const session = await getStripe().checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}
