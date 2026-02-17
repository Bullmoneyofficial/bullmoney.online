import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

// Configure VAPID lazily to avoid build-time errors
let vapidConfigured = false;

function normalizeVapidKey(value: string) {
  return (value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function configureVapid() {
  if (vapidConfigured) return true;
  
  const VAPID_PUBLIC_KEY = normalizeVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '');
  const VAPID_PRIVATE_KEY = normalizeVapidKey(process.env.VAPID_PRIVATE_KEY || '');
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

const CHANNEL_INFO: Record<string, { name: string; channel: string; priority: 'high' | 'normal' }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'BULLMONEY NEWS', channel: 'shop', priority: 'normal' },
  '-1003442830926': { name: 'VIP TRADES', channel: 'trades', priority: 'high' },
};

function resolveChannel(chatUsername: string, chatId: string | number | undefined) {
  if (chatUsername && CHANNEL_INFO[chatUsername]) return CHANNEL_INFO[chatUsername];
  const idStr = chatId?.toString() || '';
  if (idStr && CHANNEL_INFO[idStr]) return CHANNEL_INFO[idStr];
  return { name: 'BullMoney', channel: 'trades', priority: 'high' as const };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const update = await request.json();
    const message = update.channel_post || update.message;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    const chatUsername = (message.chat?.username || '').toLowerCase();
    const chatId = message.chat?.id;
    const messageText = message.text || message.caption || '';
    const hasMedia = !!(message.photo || message.video || message.document || message.animation);
    
    if (!messageText && !hasMedia) {
      return NextResponse.json({ ok: true });
    }
    
    let channelInfo = resolveChannel(chatUsername, chatId);
    console.log(`[Webhook] Message from ${chatUsername || chatId}: "${messageText?.substring(0,50)}..." → ${channelInfo.name}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: 'DB not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store message in database
    let messageDbId: string | null = null;
    try {
      const { data: insertedMsg } = await supabase
        .from('vip_messages')
        .insert({
          message: messageText || 'Media post',
          has_media: hasMedia,
          views: 0,
          created_at: new Date(message.date * 1000).toISOString(),
          telegram_message_id: message.message_id,
          chat_id: chatId?.toString(),
          chat_title: channelInfo.name,
          chat_username: chatUsername || undefined,
          notification_sent: false,
        })
        .select('id')
        .single();

      if (insertedMsg) {
        messageDbId = insertedMsg.id;
      }
    } catch (error) {
      // Silently fail if insert doesn't work
    }
    
    // PUSH NOTIFICATIONS - Works when browser is closed!
    if (!configureVapid()) {
      console.warn('[Webhook] ⚠️ VAPID keys not configured - push notifications DISABLED');
      console.warn('[Webhook] Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars');
    } else {
      try {
        const { data: subscriptions, error: subError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('is_active', true);

        if (subError) {
          console.error('[Webhook] Failed to fetch subscriptions:', subError.message);
        } else if (!subscriptions || subscriptions.length === 0) {
          console.log('[Webhook] No active subscriptions found - no notifications to send');
        } else {
          console.log(`[Webhook] Found ${subscriptions.length} active subscriptions`);

          const channelColumn = `channel_${channelInfo.channel}`;
          const targets = subscriptions.filter(sub => sub[channelColumn] !== false);

          console.log(`[Webhook] ${targets.length} subscriptions want ${channelInfo.channel} channel notifications`);

          if (targets.length === 0) {
            console.log('[Webhook] No subscriptions enabled for this channel');
          } else {
            const payload = JSON.stringify({
              title: `BullMoney ${channelInfo.name}`,
              body: messageText?.substring(0, 120) || 'New trade signal - tap to view',
              icon: '/bullmoney-logo.png',
              badge: '/B.png',
              tag: `trade-${channelInfo.channel}-${message.message_id}`,
              url: `/?channel=${channelInfo.channel}&from=notification`,
              channel: channelInfo.channel,
              requireInteraction: channelInfo.priority === 'high',
            });

            let sent = 0;
            let failed = 0;
            const expired: string[] = [];

            await Promise.allSettled(
              targets.map(async (sub) => {
                try {
                  await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload,
                    { TTL: 86400, urgency: channelInfo.priority === 'high' ? 'high' : 'normal' }
                  );
                  sent++;
                  return { success: true };
                } catch (err: any) {
                  failed++;
                  if (err.statusCode === 404 || err.statusCode === 410) {
                    expired.push(sub.endpoint);
                    return { success: false, reason: 'expired' };
                  }
                  console.error('[Webhook] Push failed:', err.statusCode, err.message);
                  return { success: false, reason: err.message };
                }
              })
            );

            if (expired.length > 0) {
              console.log(`[Webhook] Deleting ${expired.length} expired subscriptions`);
              try {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .in('endpoint', expired);
              } catch (error) {
                console.error('[Webhook] Failed to delete expired subscriptions');
              }
            }

            console.log(`[Webhook] ✅ Push notifications: ${sent} sent, ${failed} failed (${Date.now() - startTime}ms)`);

            // Mark message as notified in database
            if (messageDbId && sent > 0) {
              try {
                await supabase
                  .from('vip_messages')
                  .update({ notification_sent: true })
                  .eq('id', messageDbId);
              } catch (updateErr) {
                console.error('[Webhook] Failed to mark message as notified');
              }
            }
          }
        }
      } catch (err) {
        console.error('[Webhook] Push error:', err);
      }
    }
    
    return NextResponse.json({ ok: true, channel: channelInfo.name });
    
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  
  if (action === 'setup') {
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;
    
    const setupUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const response = await fetch(setupUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      message: data.ok ? 'Webhook registered!' : 'Failed to register',
      error: data.ok ? undefined : data.description,
    });
  }
  
  if (action === 'test') {
    if (!configureVapid() || !supabaseUrl) {
      return NextResponse.json({ error: 'VAPID or DB not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    
    if (!subs?.length) {
      return NextResponse.json({ error: 'No subscriptions. Enable notifications in app first.' });
    }
    
    try {
      await webpush.sendNotification(
        { endpoint: subs[0].endpoint, keys: { p256dh: subs[0].p256dh, auth: subs[0].auth } },
        JSON.stringify({
          title: 'BullMoney Test',
          body: 'Push notifications working!',
          icon: '/bullmoney-logo.png',
          badge: '/B.png',
        })
      );
      return NextResponse.json({ success: true, message: 'Test sent!' });
    } catch (err: any) {
      return NextResponse.json({ error: err.message });
    }
  }
  
  if (action === 'info') {
    const infoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(infoUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      webhookInfo: data.result,
    });
  }
  
  return NextResponse.json({ ok: true });
}
