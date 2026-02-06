import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason, feedback } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase().trim();

    // Update newsletter_subscribers table
    const { error: subscriberError } = await supabase
      .from('newsletter_subscribers')
      .update({
        subscribed: false,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason || null,
        unsubscribe_feedback: feedback || null,
      })
      .eq('email', normalizedEmail);

    if (subscriberError) {
      console.error('Error updating newsletter subscriber:', subscriberError);
    }

    // Update email_drip_campaigns table
    const { error: campaignError } = await supabase
      .from('email_drip_campaigns')
      .update({
        subscribed: false,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    if (campaignError) {
      console.error('Error updating drip campaign:', campaignError);
    }

    // Update recruits table if exists
    const { error: recruitError } = await supabase
      .from('recruits')
      .update({
        notifications_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    if (recruitError) {
      console.error('Error updating recruit:', recruitError);
    }

    // Log the unsubscribe event
    try {
      await supabase
        .from('email_events')
        .insert({
          email: normalizedEmail,
          event_type: 'unsubscribe',
          reason: reason || 'user_requested',
          feedback: feedback || null,
          created_at: new Date().toISOString(),
        });
    } catch {
      // Table may not exist, ignore error
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from emails',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle one-click unsubscribe from email links
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email) {
    return NextResponse.redirect(new URL('/email/unsubscribe?error=missing_email', request.url));
  }

  // Validate token if provided (basic validation - can be enhanced)
  if (token) {
    // In production, validate the token against a stored hash
    // For now, we'll process the request
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Update all tables
    await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .update({
          subscribed: false,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_reason: 'one_click_unsubscribe',
        })
        .eq('email', normalizedEmail),
      
      supabase
        .from('email_drip_campaigns')
        .update({
          subscribed: false,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail),
    ]);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/email/unsubscribe?email=${encodeURIComponent(email)}&success=true`, request.url)
    );
  } catch (error) {
    console.error('One-click unsubscribe error:', error);
    return NextResponse.redirect(
      new URL(`/email/unsubscribe?email=${encodeURIComponent(email)}&error=failed`, request.url)
    );
  }
}
