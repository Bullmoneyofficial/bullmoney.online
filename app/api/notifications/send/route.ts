import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Use server-side Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Configure web-push with VAPID keys lazily (not at build time)
// You need to generate these: npx web-push generate-vapid-keys
let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  
  const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/=+$/, '');
  const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').replace(/=+$/, '');
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

  try {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      vapidConfigured = true;
      return true;
    }
  } catch (e) {
    console.warn('VAPID setup skipped:', (e as Error).message);
  }
  return false;
}

// Admin secret for sending notifications (optional security)
const ADMIN_SECRET = process.env.NOTIFICATION_ADMIN_SECRET || '';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  channel?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// POST - Send push notification to all subscribers
export async function POST(request: NextRequest) {
  try {
    // Verify admin secret if set
    const authHeader = request.headers.get('Authorization');
    if (ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      body: messageBody, 
      icon, 
      badge, 
      image, 
      url, 
      channel,
      tag,
      requireInteraction = false,
    } = body as NotificationPayload & { body: string };

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (!configureVapid()) {
      return NextResponse.json(
        { error: 'VAPID keys not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.' },
        { status: 500 }
      );
    }

    const supabase = getServerSupabase();

    // Map channel names to database column names
    const channelColumnMap: Record<string, string> = {
      trades: 'channel_trades',
      main: 'channel_main',
      shop: 'channel_shop',
      vip: 'channel_vip',
    };

    // Build query - filter by channel preference if specified
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    // Filter subscribers by their channel preferences
    const channelColumn = channelColumnMap[channel || 'trades'];
    if (channelColumn) {
      query = query.eq(channelColumn, true);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Notifications] Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: `No active subscriptions for channel: ${channel || 'trades'}`,
      });
    }

    console.log(`[Notifications] Sending "${channel || 'trades'}" notification to ${subscriptions.length} subscribers`);

    // Prepare the notification payload
    const payload: NotificationPayload = {
      title,
      body: messageBody,
      icon: icon || '/bullmoney-logo.png',
      badge: badge || '/B.png',
      url: url || '/',
      channel: channel || 'trades',
      tag: tag || `trade-${Date.now()}`,
      requireInteraction,
    };

    if (image) {
      payload.image = image;
    }

    const payloadString = JSON.stringify(payload);

    // Send notifications in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          // Handle expired or invalid subscriptions
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Mark subscription as inactive
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('endpoint', sub.endpoint);
            
            console.log('[Notifications] Removed expired subscription:', sub.endpoint.slice(-20));
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - sent;

    // Log the notification for history
    await supabase
      .from('notification_history')
      .insert({
        title,
        body: messageBody,
        channel: channel || 'trades',
        sent_count: sent,
        failed_count: failed,
        created_at: new Date().toISOString(),
      });

    console.log(`[Notifications] Sent: ${sent}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('[Notifications] Send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get notification history
export async function GET(request: NextRequest) {
  try {
    const supabase = getServerSupabase();

    const { data: history, error } = await supabase
      .from('notification_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      history: history || [],
    });
  } catch (error) {
    console.error('[Notifications] History error:', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}
