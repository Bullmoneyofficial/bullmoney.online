import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

// Test endpoint to verify Stripe connection
export async function GET() {
  try {
    const stripe = getStripe();
    
    // Test the connection by fetching balance
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({
      success: true,
      message: 'Stripe is connected and working!',
      testMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
      available: balance.available.map(b => ({
        currency: b.currency,
        amount: b.amount / 100
      })),
    });
  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to connect to Stripe' 
      },
      { status: 500 }
    );
  }
}
