/**
 * Push Notification Cleanup Endpoint
 * Tests all subscriptions and removes dead/expired ones
 *
 * Usage:
 *   POST /api/push/cleanup
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

async function testSubscription(subscriber: any): Promise<boolean> {
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

  const payload = {
    title: 'Connection Test',
    body: 'Verifying subscription...',
    tag: 'cleanup-test',
    silent: true,
  };

  try {
    await webpush.sendNotification(subscriptionInfo, JSON.stringify(payload));
    return true;
  } catch (error: any) {
    const statusCode = error?.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      // Subscription expired - delete it
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriber.endpoint);
      } catch (e) {
        // Ignore
      }
      return false;
    }

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 CLEANUP: Testing all subscriptions...');

    // Get all subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, is_active, user_agent, created_at');

    const subscriptions = subs || [];
    console.log(`📱 Total subscriptions in DB: ${subscriptions.length}`);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions to clean up',
        alive: 0,
        dead: 0,
      });
    }

    let alive = 0;
    let dead = 0;
    const results = [];

    for (const sub of subscriptions) {
      const isAlive = await testSubscription(sub);
      const epShort = sub.endpoint.slice(-30);
      const ua = (sub.user_agent || '').slice(0, 40);

      if (isAlive) {
        alive++;
        console.log(`  ✅ Alive: ...${epShort}  (${ua})`);
        results.push({ endpoint: epShort, status: 'alive', user_agent: ua });
      } else {
        dead++;
        console.log(`  🗑️  Dead:  ...${epShort}  (${ua})`);
        results.push({ endpoint: epShort, status: 'dead', user_agent: ua });
      }
    }

    console.log(`✅ Alive: ${alive}`);
    console.log(`🗑️  Removed: ${dead}`);

    return NextResponse.json({
      success: true,
      alive,
      dead,
      total: subscriptions.length,
      results,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to run cleanup',
    endpoint: '/api/push/cleanup',
  });
}
