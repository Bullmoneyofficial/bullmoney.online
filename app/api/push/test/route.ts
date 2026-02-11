/**
 * Test Push Notification Endpoint
 * Sends a test push notification to all active subscribers
 *
 * Usage:
 *   POST /api/push/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/=+$/, '');
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').replace(/=+$/, '');
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

try {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  }
} catch (e) {
  console.warn('VAPID setup skipped:', (e as Error).message);
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
    console.log('🧪 PUSH NOTIFICATION TEST');

    // Get all active subscribers
    const { data: subscribers } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('is_active', true);

    console.log(`📱 Found ${subscribers?.length || 0} active subscriber(s)`);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active subscribers found. Users need to enable notifications first.',
      });
    }

    const payload = {
      title: 'BullMoney Test',
      body: '✅ Push notifications are working! You\'ll get real trade alerts on your lock screen.',
      icon: '/bullmoney-logo.png',
      badge: '/B.png',
      tag: `test-${Date.now()}`,
      url: '/',
      channel: 'trades',
      requireInteraction: false,
    };

    console.log(`📤 Sending test notification to ${subscribers.length} device(s)...`);

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
      message: sent > 0 ? 'Test notifications sent! Check your device.' : 'No notifications sent.',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to send a test notification',
    endpoint: '/api/push/test',
  });
}
