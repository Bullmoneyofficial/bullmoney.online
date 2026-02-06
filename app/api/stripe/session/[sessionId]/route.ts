import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent', 'shipping_details' as any],
    });
    const sessionData = session as Stripe.Checkout.Session;

    return NextResponse.json({
      id: sessionData.id,
      status: sessionData.status,
      paymentStatus: sessionData.payment_status,
      customerEmail: sessionData.customer_details?.email || sessionData.customer_email,
      customerName: sessionData.customer_details?.name,
      amountTotal: sessionData.amount_total,
      currency: sessionData.currency,
      lineItems: sessionData.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
      shippingDetails: (sessionData as any).shipping_details ?? (sessionData as any).shipping ?? null,
      metadata: sessionData.metadata,
      createdAt: new Date(sessionData.created * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
