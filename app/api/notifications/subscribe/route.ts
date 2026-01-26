import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use server-side Supabase client with service role for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getServerSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase not configured');
  }
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
  console.log('[Notifications] Subscribe endpoint called');
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Notifications] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    console.log('[Notifications] Received subscription request');
    
    const { subscription, channels, userAgent, oldEndpoint, reason } = body;

    if (!subscription || !subscription.endpoint) {
      console.error('[Notifications] Invalid subscription - missing endpoint');
      return NextResponse.json(
        { error: 'Invalid subscription data - missing endpoint' },
        { status: 400 }
      );
    }

    // Handle subscription token refresh (from service worker pushsubscriptionchange event)
    if (oldEndpoint && oldEndpoint !== subscription.endpoint) {
      console.log('[Notifications] Subscription changed, removing old endpoint');
      try {
        const supabase = getServerSupabase();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', oldEndpoint);
        console.log('[Notifications] Old subscription removed');
      } catch (e) {
        console.warn('[Notifications] Could not remove old subscription:', e);
      }
    }

    if (reason) {
      console.log('[Notifications] Subscription reason:', reason);
    }

    // Validate keys
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';
    
    if (!p256dh || !auth) {
      console.error('[Notifications] Invalid subscription - missing keys', { hasP256dh: !!p256dh, hasAuth: !!auth });
      return NextResponse.json(
        { error: 'Invalid subscription data - missing encryption keys' },
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

    // Check Supabase config
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Notifications] Supabase not configured - missing env vars');
      return NextResponse.json(
        { error: 'Database not configured on server' },
        { status: 500 }
      );
    }

    let supabase;
    try {
      supabase = getServerSupabase();
    } catch (dbError) {
      console.error('[Notifications] Failed to create Supabase client:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('[Notifications] Attempting to save subscription...');

    // Use upsert for simpler conflict handling
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: p256dh,
          auth: auth,
          user_agent: userAgent || 'unknown',
          channel_trades: channelPrefs.trades !== false,
          channel_main: channelPrefs.main !== false,
          channel_shop: channelPrefs.shop !== false,
          channel_vip: channelPrefs.vip !== false,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { 
          onConflict: 'endpoint',
          ignoreDuplicates: false 
        }
      )
      .select();

    if (error) {
      console.error('[Notifications] Database error:', error.message, error.code, error.details);
      
      // If it's a column error, try minimal insert
      if (error.message?.includes('column') || error.code === '42703') {
        console.log('[Notifications] Column mismatch - trying minimal insert...');
        
        // Delete existing first
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
        
        const { error: minError } = await supabase
          .from('push_subscriptions')
          .insert({
            endpoint: subscription.endpoint,
            p256dh: p256dh,
            auth: auth,
            is_active: true,
          });
        
        if (minError) {
          console.error('[Notifications] Minimal insert failed:', minError.message);
          return NextResponse.json(
            { error: 'Database schema mismatch - please run migration', details: minError.message },
            { status: 500 }
          );
        }
        
        console.log('[Notifications] ✅ Minimal insert succeeded');
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription saved (minimal)',
        });
      }
      
      // For other errors
      return NextResponse.json(
        { error: 'Failed to save to database', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Notifications] ✅ Subscription saved successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully',
      channels: channelPrefs,
    });
  } catch (error: any) {
    console.error('[Notifications] Unexpected error:', error?.message || error);
    return NextResponse.json(
      { error: 'Server error', details: error?.message || 'Unknown error' },
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
