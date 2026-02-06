import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ResubscribePreferences {
  marketing?: boolean;
  updates?: boolean;
  trading?: boolean;
  vip?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferences } = body as { email: string; preferences?: ResubscribePreferences };

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalizedEmail = email.toLowerCase().trim();

    // Default preferences if not provided
    const emailPreferences: ResubscribePreferences = {
      marketing: preferences?.marketing ?? true,
      updates: preferences?.updates ?? true,
      trading: preferences?.trading ?? true,
      vip: preferences?.vip ?? false,
    };

    // Check if subscriber exists
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, subscribed')
      .eq('email', normalizedEmail)
      .single();

    if (existingSubscriber) {
      // Update existing subscriber
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          subscribed: true,
          preferences: emailPreferences,
          resubscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          unsubscribe_reason: null,
          unsubscribe_feedback: null,
          updated_at: new Date().toISOString(),
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        console.error('Error updating subscriber:', updateError);
        return NextResponse.json(
          { error: 'Failed to resubscribe' },
          { status: 500 }
        );
      }
    } else {
      // Create new subscriber
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: normalizedEmail,
          subscribed: true,
          source: 'resubscribe_page',
          preferences: emailPreferences,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating subscriber:', insertError);
        return NextResponse.json(
          { error: 'Failed to subscribe' },
          { status: 500 }
        );
      }
    }

    // Check if should re-enroll in drip campaigns
    const hasAnyPreference = emailPreferences.marketing || emailPreferences.updates || emailPreferences.trading;

    if (hasAnyPreference) {
      // Check for existing campaign
      const { data: existingCampaign } = await supabase
        .from('email_drip_campaigns')
        .select('id, completed_at')
        .eq('email', normalizedEmail)
        .eq('campaign_name', 'store_reminder_30day')
        .single();

      if (existingCampaign) {
        // Reactivate existing campaign if it was paused (not completed)
        if (!existingCampaign.completed_at) {
          await supabase
            .from('email_drip_campaigns')
            .update({
              subscribed: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCampaign.id);
        }
        // If campaign was completed, we could optionally restart it
        // For now, we leave completed campaigns as-is
      } else {
        // Create new drip campaign enrollment (ignore if already exists)
        await supabase
          .from('email_drip_campaigns')
          .upsert({
            email: normalizedEmail,
            source: 'resubscribe',
            campaign_name: 'store_reminder_30day',
            email_sequence_number: 0,
            total_emails_to_send: 15,
            subscribed: true,
            started_at: new Date().toISOString(),
            next_email_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            created_at: new Date().toISOString(),
          }, { onConflict: 'email,campaign_name', ignoreDuplicates: true });
      }
    }

    // Update recruits table if exists
    await supabase
      .from('recruits')
      .update({
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    // Log the resubscribe event
    try {
      await supabase
        .from('email_events')
        .insert({
          email: normalizedEmail,
          event_type: 'resubscribe',
          preferences: emailPreferences,
          created_at: new Date().toISOString(),
        });
    } catch {
      // Table may not exist, ignore error
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully resubscribed to emails',
      preferences: emailPreferences,
    });
  } catch (error) {
    console.error('Resubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process resubscribe request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get current subscription status for an email
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, subscribed, preferences, created_at, unsubscribed_at')
      .eq('email', normalizedEmail)
      .single();

    if (error || !subscriber) {
      return NextResponse.json({
        exists: false,
        subscribed: false,
        preferences: null,
      });
    }

    return NextResponse.json({
      exists: true,
      subscribed: subscriber.subscribed,
      preferences: subscriber.preferences || {
        marketing: true,
        updates: true,
        trading: true,
        vip: false,
      },
      createdAt: subscriber.created_at,
      unsubscribedAt: subscriber.unsubscribed_at,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
