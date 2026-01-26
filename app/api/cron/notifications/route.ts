import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// This endpoint is called by Vercel Cron every minute to ensure notifications are sent
// even when no browsers are open

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const CHANNEL_INFO: Record<string, { name: string; channel: string; priority: 'high' | 'normal' }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'NEWS', channel: 'shop', priority: 'normal' },
};

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

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, error: 'VAPID keys not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Try to fetch new messages from Telegram (if no webhook is set)
    let newMessagesFromTelegram = 0;
    try {
      const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?allowed_updates=["channel_post","edited_channel_post"]&limit=100`;
      const response = await fetch(updatesUrl);
      const data = await response.json();

      if (data.ok && data.result && data.result.length > 0) {
        const channelPosts = data.result.filter((u: any) => u.channel_post || u.edited_channel_post);
        let lastUpdateId = 0;

        for (const update of channelPosts) {
          const post = update.channel_post || update.edited_channel_post;
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          const messageText = post.text || post.caption || '';
          const hasMedia = !!(post.photo || post.video || post.document || post.animation);
          const messageId = post.message_id;
          const chatId = post.chat?.id;
          const chatTitle = post.chat?.title || 'VIP Channel';
          const messageDate = post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString();

          if (!messageText && !hasMedia) continue;

          const { error } = await supabase
            .from('vip_messages')
            .upsert({
              telegram_message_id: messageId,
              message: messageText || (hasMedia ? '📷 Media post' : ''),
              has_media: hasMedia,
              chat_id: chatId?.toString(),
              chat_title: chatTitle,
              created_at: messageDate,
              updated_at: new Date().toISOString(),
              notification_sent: false, // Mark as not notified yet
            }, {
              onConflict: 'telegram_message_id',
              ignoreDuplicates: true, // Don't update if exists (preserve notification_sent status)
            });

          if (!error) newMessagesFromTelegram++;
        }

        // Confirm updates to clear queue
        if (lastUpdateId > 0) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=1`);
        }
      }
    } catch (telegramErr) {
      // getUpdates might fail if webhook is set - that's okay
      console.log('[Cron] getUpdates skipped (webhook may be set)');
    }

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
      const channelInfo = CHANNEL_INFO['bullmoneywebsite'] || { name: 'BullMoney', channel: 'trades', priority: 'high' as const };
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
