import { NextRequest, NextResponse } from 'next/server';
import { createSkrillCheckoutSession } from '@/lib/skrill';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { productId, variantId, name, description, price, quantity, image } =
      await req.json();

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Missing required fields (name, price)' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.com';
    const transactionId = `BM-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const totalAmount = (price || 0) * (quantity || 1);

    const result = await createSkrillCheckoutSession({
      transactionId,
      amount: totalAmount,
      description: `${name}${description ? ' - ' + description : ''}`,
      detail1Text: name,
      detail1Description: `Qty: ${quantity || 1}`,
      returnUrl: `${origin}/store?payment=success&method=skrill&txn=${transactionId}`,
      cancelUrl: `${origin}/store?payment=cancelled`,
      statusUrl: `${origin}/api/skrill/webhook`,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ url: result.url, transactionId });
  } catch (error: any) {
    console.error('Skrill create-checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
