import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// This endpoint is called by Vercel Cron every minute to ensure notifications are sent
// even when no browsers are open

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Configure VAPID lazily to avoid build-time errors
let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  }
  return false;
}

const CHANNEL_INFO: Record<string, { name: string; channel: string; priority: 'high' | 'normal' }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'BULLMONEY NEWS', channel: 'shop', priority: 'normal' },
  '-1003442830926': { name: 'VIP TRADES', channel: 'trades', priority: 'high' },
};

function getChannelInfo(chatUsername: string | undefined, chatId: string | undefined) {
  if (chatUsername && CHANNEL_INFO[chatUsername]) return CHANNEL_INFO[chatUsername];
  if (chatId && CHANNEL_INFO[chatId]) return CHANNEL_INFO[chatId];
  return { name: 'BullMoney', channel: 'trades', priority: 'high' as const };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Also allow Vercel's cron header
    const cronHeader = request.headers.get('x-vercel-cron');
    if (!cronHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('[Cron] Starting notification sync job...');

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 });
  }

  if (!configureVapid()) {
    return NextResponse.json({ ok: false, error: 'VAPID keys not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Skip Telegram polling — webhook handles real-time delivery.
    // This cron is a FALLBACK that catches any messages missed by the webhook.
    let newMessagesFromTelegram = 0;
    // getUpdates is disabled when webhook is active, so we skip it.
    // If webhook fails, messages still land in DB via other paths.

    // Step 2: Find messages that haven't had notifications sent yet
    // Look for messages from the last 10 minutes without notification_sent flag
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: unnotifiedMessages, error: fetchError } = await supabase
      .from('vip_messages')
      .select('*')
      .gte('created_at', tenMinutesAgo)
      .or('notification_sent.is.null,notification_sent.eq.false')
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error('[Cron] Error fetching messages:', fetchError);
      return NextResponse.json({ ok: false, error: 'Failed to fetch messages' }, { status: 500 });
    }

    if (!unnotifiedMessages || unnotifiedMessages.length === 0) {
      console.log('[Cron] No unnotified messages found');
      return NextResponse.json({
        ok: true,
        message: 'No new messages to notify',
        newFromTelegram: newMessagesFromTelegram,
        duration: Date.now() - startTime
      });
    }

    console.log(`[Cron] Found ${unnotifiedMessages.length} messages to notify`);

    // Step 3: Get active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log('[Cron] No active subscriptions');
      return NextResponse.json({
        ok: true,
        message: 'No active subscriptions',
        unnotifiedMessages: unnotifiedMessages.length
      });
    }

    console.log(`[Cron] Sending to ${subscriptions.length} subscribers`);

    // Step 4: Send notifications for each unnotified message
    let totalSent = 0;
    let totalFailed = 0;
    const expiredEndpoints: string[] = [];
    const notifiedMessageIds: string[] = [];

    for (const msg of unnotifiedMessages) {
      // Determine channel from the message's chat_title or fallback to trades
      const msgChatTitle = msg.chat_title || '';
      const msgChatId = msg.chat_id || '';
      const channelInfo = getChannelInfo(
        Object.keys(CHANNEL_INFO).find(k => CHANNEL_INFO[k].name === msgChatTitle),
        msgChatId
      );
      const channelColumn = `channel_${channelInfo.channel}`;
      const targets = subscriptions.filter((sub: any) => sub[channelColumn] !== false);

      if (targets.length === 0) continue;

      const payload = JSON.stringify({
        title: `BullMoney ${channelInfo.name}`,
        body: msg.message?.substring(0, 120) || 'New trade signal - tap to view',
        icon: '/bullmoney-logo.png',
        badge: '/B.png',
        tag: `trade-${channelInfo.channel}-${msg.telegram_message_id || msg.id}`,
        url: `/?channel=${channelInfo.channel}&from=notification`,
        channel: channelInfo.channel,
        requireInteraction: channelInfo.priority === 'high',
      });

      const results = await Promise.allSettled(
        targets.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { TTL: 86400, urgency: channelInfo.priority === 'high' ? 'high' : 'normal' }
            );
            return { success: true };
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              expiredEndpoints.push(sub.endpoint);
            }
            return { success: false, error: err.message };
          }
        })
      );

      const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      totalSent += sent;
      totalFailed += targets.length - sent;
      notifiedMessageIds.push(msg.id);
    }

    // Step 5: Mark messages as notified
    if (notifiedMessageIds.length > 0) {
      await supabase
        .from('vip_messages')
        .update({ notification_sent: true })
        .in('id', notifiedMessageIds);
    }

    // Step 6: Deactivate expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('endpoint', [...new Set(expiredEndpoints)]);
      console.log(`[Cron] Deactivated ${new Set(expiredEndpoints).size} expired subscriptions`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed: ${totalSent} sent, ${totalFailed} failed, ${duration}ms`);

    return NextResponse.json({
      ok: true,
      message: `Sent ${totalSent} notifications for ${notifiedMessageIds.length} messages`,
      newFromTelegram: newMessagesFromTelegram,
      messagesNotified: notifiedMessageIds.length,
      notificationsSent: totalSent,
      notificationsFailed: totalFailed,
      expiredSubscriptions: new Set(expiredEndpoints).size,
      duration
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
