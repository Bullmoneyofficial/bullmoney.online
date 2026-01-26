import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use server-side Supabase client with service role for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface ChannelPreferences {
  trades: boolean;
  main: boolean;
  shop: boolean;
  vip: boolean;
}

// POST - Subscribe a user to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, channels, userAgent, timestamp } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Default channel preferences if not provided
    const channelPrefs: ChannelPreferences = channels || {
      trades: true,
      main: true,
      shop: true,
      vip: true,
    };

    const supabase = getServerSupabase();

    // Store the subscription in the database with channel preferences
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        user_agent: userAgent || '',
        // Channel preferences
        channel_trades: channelPrefs.trades,
        channel_main: channelPrefs.main,
        channel_shop: channelPrefs.shop,
        channel_vip: channelPrefs.vip,
        created_at: new Date(timestamp || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      console.error('[Notifications] Error saving subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Notifications] Subscription saved:', subscription.endpoint.slice(-20), 'Channels:', channelPrefs);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully',
      channels: channelPrefs,
    });
  } catch (error) {
    console.error('[Notifications] Subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get subscription stats
export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();

    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      total_subscribers: count || 0,
    });
  } catch (error) {
    console.error('[Notifications] Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
