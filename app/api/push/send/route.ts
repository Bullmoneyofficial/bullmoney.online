/**
 * Send Custom Push Notification Endpoint
 * Sends a custom push notification to all subscribers of a channel
 *
 * Usage:
 *   POST /api/push/send
 *   Body: { title: string, body: string, channel?: string, url?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendPush(subscriber: any, payload: any): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false;
  }

  const subscriptionInfo = {
    endpoint: subscriber.endpoint,
    keys: {
      p256dh: subscriber.p256dh,
      auth: subscriber.auth,
    },
  };

  try {
    await webpush.sendNotification(subscriptionInfo, JSON.stringify(payload));
    return true;
  } catch (error: any) {
    const statusCode = error?.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriber.endpoint);
      } catch (e) {
        // Ignore
      }
    }

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: messageBody, channel = 'trades', url = '/' } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Missing title or body' },
        { status: 400 }
      );
    }

    console.log(`📤 Sending custom notification: '${title}'`);

    // Get subscribers for this channel
    const channelCol = `channel_${channel}`;
    let subscribers: any[] = [];

    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('is_active', true)
        .eq(channelCol, true);

      subscribers = data || [];
    } catch (error) {
      // If channel column doesn't exist, get all active subscribers
      const { data } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('is_active', true);

      subscribers = data || [];
    }

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No subscribers for channel: ${channel}`,
      });
    }

    const payload = {
      title,
      body: messageBody,
      icon: '/bullmoney-logo.png',
      badge: '/B.png',
      tag: `custom-${Date.now()}`,
      url,
      channel,
      requireInteraction: true,
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      if (await sendPush(sub, payload)) {
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Sent: ${sent}  ❌ Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      subscribers: subscribers.length,
    });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to send a custom notification',
    endpoint: '/api/push/send',
    body: {
      title: 'string (required)',
      body: 'string (required)',
      channel: 'string (optional, default: trades)',
      url: 'string (optional, default: /)',
    },
  });
}
