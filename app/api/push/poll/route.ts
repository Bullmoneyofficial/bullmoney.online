/**
 * Push Notification Polling Endpoint
 * Polls Telegram for new messages and sends push notifications
 *
 * Usage:
 *   POST /api/push/poll
 *   Can be called manually or via Vercel Cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configuration from environment
const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/=+$/, '');
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').replace(/=+$/, '');
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Channel mapping
const CHANNEL_MAP: Record<string, { name: string; channel: string; priority: string }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'BULLMONEY NEWS', channel: 'shop', priority: 'normal' },
  '-1003442830926': { name: 'VIP TRADES', channel: 'trades', priority: 'high' },
};

// Configure web-push
try {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  }
} catch (e) {
  console.warn('VAPID setup skipped:', (e as Error).message);
}

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Track last update ID (in memory - will reset on deployment)
let lastUpdateId = 0;

interface TelegramMessage {
  telegram_message_id: number;
  message: string;
  has_media: boolean;
  chat_title: string;
  chat_username: string;
  channel_info: { name: string; channel: string; priority: string };
  created_at: string;
  db_id?: string;
}

async function pollTelegram(): Promise<TelegramMessage[]> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set');
    return [];
  }

  const url = new URL(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
  url.searchParams.set('allowed_updates', JSON.stringify(['channel_post', 'edited_channel_post']));
  url.searchParams.set('limit', '100');
  url.searchParams.set('timeout', '5');
  if (lastUpdateId > 0) {
    url.searchParams.set('offset', String(lastUpdateId + 1));
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();

    if (!data.ok || !data.result) {
      return [];
    }

    const messages: TelegramMessage[] = [];

    for (const update of data.result) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id || 0);

      const post = update.channel_post || update.edited_channel_post;
      if (!post) continue;

      const text = post.text || post.caption || '';
      const hasMedia = !!(post.photo || post.video || post.document || post.animation);
      const chatTitle = post.chat?.title || '';
      const chatUsername = post.chat?.username || '';
      const msgId = post.message_id;
      const msgDate = post.date || 0;

      if (!text && !hasMedia) continue;

      // Match to channel map
      const chatIdStr = String(post.chat?.id || '');
      const channelInfo = CHANNEL_MAP[chatUsername]
        || CHANNEL_MAP[chatIdStr]
        || { name: chatTitle || 'BullMoney', channel: 'trades', priority: 'high' };

      messages.push({
        telegram_message_id: msgId,
        message: text || (hasMedia ? '📷 Media post' : ''),
        has_media: hasMedia,
        chat_title: chatTitle,
        chat_username: chatUsername,
        channel_info: channelInfo,
        created_at: msgDate ? new Date(msgDate * 1000).toISOString() : new Date().toISOString(),
      });
    }

    // Confirm updates processed
    if (lastUpdateId > 0 && messages.length > 0) {
      try {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=1`,
          { method: 'GET', signal: AbortSignal.timeout(5000) }
        );
      } catch (e) {
        // Ignore errors
      }
    }

    return messages;
  } catch (error) {
    console.error('Telegram API error:', error);
    return [];
  }
}

async function saveMessagesToDb(messages: TelegramMessage[]): Promise<TelegramMessage[]> {
  if (messages.length === 0) return [];

  const newMessages: TelegramMessage[] = [];

  for (const msg of messages) {
    // Check if message already exists
    const { data: existing } = await supabase
      .from('vip_messages')
      .select('id, notification_sent')
      .eq('telegram_message_id', msg.telegram_message_id)
      .single();

    if (existing) {
      // Skip if already notified
      if (existing.notification_sent) continue;
      // Include if not notified
      msg.db_id = existing.id;
      newMessages.push(msg);
      continue;
    }

    // Insert new message
    const { data: inserted } = await supabase
      .from('vip_messages')
      .insert({
        telegram_message_id: msg.telegram_message_id,
        message: msg.message,
        has_media: msg.has_media,
        chat_id: msg.chat_username,
        chat_title: msg.chat_title,
        created_at: msg.created_at,
        updated_at: new Date().toISOString(),
        notification_sent: false,
      })
      .select('id')
      .single();

    if (inserted) {
      msg.db_id = inserted.id;
      newMessages.push(msg);
    }
  }

  return newMessages;
}

async function getSubscribers(channel: string = 'trades'): Promise<any[]> {
  const channelCol = `channel_${channel}`;

  try {
    const { data } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('is_active', true)
      .eq(channelCol, true);

    return data || [];
  } catch (error) {
    // If channel column doesn't exist, get all active subscribers
    const { data } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('is_active', true);

    return data || [];
  }
}

async function sendPush(subscriber: any, payload: any): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured');
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
      // Subscription expired - delete it
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriber.endpoint);
        console.log(`🗑️  Removed expired subscription: ...${subscriber.endpoint.slice(-30)}`);
      } catch (e) {
        // Ignore delete errors
      }
      return false;
    }

    if (statusCode === 403) {
      console.error('Push 403 Forbidden - VAPID key mismatch');
      return false;
    }

    if (statusCode === 401) {
      console.error('Push 401 Unauthorized - VAPID signature invalid');
      return false;
    }

    console.error(`Push failed (${statusCode}):`, error);
    return false;
  }
}

async function sendPushToAll(subscribers: any[], payload: any): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    if (await sendPush(sub, payload)) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

async function markAsNotified(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;

  for (const msgId of messageIds) {
    try {
      await supabase
        .from('vip_messages')
        .update({ notification_sent: true })
        .eq('id', msgId);
    } catch (error) {
      console.error(`Failed to mark message ${msgId} as notified:`, error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const stats = {
      telegram_messages: 0,
      new_messages: 0,
      subscribers: 0,
      sent: 0,
      failed: 0,
    };

    console.log('📡 Polling Telegram for new messages...');

    // Step 1: Poll Telegram
    const messages = await pollTelegram();
    stats.telegram_messages = messages.length;

    if (messages.length === 0) {
      console.log('📭 No new messages');
      return NextResponse.json({ success: true, stats });
    }

    console.log(`📨 Found ${messages.length} new Telegram messages`);

    // Step 2: Save to database & filter already-notified
    const newMessages = await saveMessagesToDb(messages);
    stats.new_messages = newMessages.length;

    if (newMessages.length === 0) {
      console.log('✅ All messages already notified');
      return NextResponse.json({ success: true, stats });
    }

    console.log(`🆕 ${newMessages.length} messages need notifications`);

    // Step 3-4: Send notifications for each message
    const notifiedIds: string[] = [];

    for (const msg of newMessages) {
      const ch = msg.channel_info;
      const channel = ch.channel;
      const channelName = ch.name;
      const priority = ch.priority;

      // Get subscribers for this channel
      const subscribers = await getSubscribers(channel);
      stats.subscribers = Math.max(stats.subscribers, subscribers.length);

      if (subscribers.length === 0) {
        console.warn(`⚠️  No active subscribers for channel: ${channel}`);
        continue;
      }

      // Build the push payload
      const bodyText = msg.message.slice(0, 120) || 'New trade signal — tap to view';
      const payload = {
        title: `BullMoney ${channelName}`,
        body: bodyText,
        icon: '/bullmoney-logo.png',
        badge: '/B.png',
        tag: `trade-${channel}-${msg.telegram_message_id}`,
        url: `/?channel=${channel}&from=push`,
        channel: channel,
        requireInteraction: priority === 'high',
      };

      console.log(`📤 Sending '${channelName}' notification to ${subscribers.length} devices...`);
      const { sent, failed } = await sendPushToAll(subscribers, payload);
      stats.sent += sent;
      stats.failed += failed;

      console.log(`   ✅ Sent: ${sent}  ❌ Failed: ${failed}`);

      if (msg.db_id) {
        notifiedIds.push(msg.db_id);
      }
    }

    // Step 5: Mark as notified
    await markAsNotified(notifiedIds);

    console.log(`🎉 Cycle complete: ${stats.sent} notifications sent!`);

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger a polling cycle',
    endpoint: '/api/push/poll',
  });
}
