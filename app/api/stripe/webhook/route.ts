import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { headers } from 'next/headers';

// Stripe webhook secret - get this from your Stripe Dashboard
function getWebhookSecret(): string {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // TODO: Fulfill the order
      // 1. Save order to database
      // 2. Send confirmation email
      // 3. Update inventory
      // 4. Create user account if needed
      
      console.log('Payment successful:', session.id);
      console.log('Customer email:', session.customer_email);
      console.log('Amount total:', session.amount_total);
      
      // Example: Save to database
      // await saveOrderToDatabase({
      //   sessionId: session.id,
      //   customerEmail: session.customer_email,
      //   amount: session.amount_total,
      //   items: session.metadata,
      // });
      
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // TODO: Send failure notification
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
