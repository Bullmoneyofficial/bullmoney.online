import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Channel info for notifications
const CHANNEL_INFO: Record<string, { name: string; channel: string; priority: 'high' | 'normal' }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'NEWS', channel: 'shop', priority: 'normal' },
};

/**
 * Manual sync endpoint - triggers getUpdates to fetch recent channel posts
 * Use this if webhook isn't set up or to fetch missed messages
 * 
 * Usage:
 * GET /api/telegram/sync - Fetch and store new messages from bot updates
 * GET /api/telegram/sync?clear=true - Clear update queue without processing
 */
export async function GET(request: NextRequest) {
  try {
    const clear = request.nextUrl.searchParams.get('clear') === 'true';
    
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        ok: false,
        error: 'Bot token not configured'
      }, { status: 500 });
    }
    
    // If clear=true, just confirm updates to clear the queue
    if (clear) {
      // Get updates first
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=1`
      );
      const data = await response.json();
      
      if (data.ok && data.result && data.result.length > 0) {
        // Get the last update ID and confirm it
        const lastId = data.result[data.result.length - 1].update_id;
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastId + 1}&limit=1`
        );
      }
      
      return NextResponse.json({
        ok: true,
        message: 'Update queue cleared'
      });
    }
    
    // Fetch updates from bot
    const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?allowed_updates=["channel_post","edited_channel_post"]&limit=100`;
    
    const response = await fetch(updatesUrl);
    const data = await response.json();
    
    // If getUpdates fails (usually because a webhook is set), fall back to database-based notification check
    if (!data.ok) {
      console.log('[TG Sync] getUpdates failed (webhook may be set), checking database for recent messages');

      // Check database for recent messages and send notifications
      if (supabaseUrl && supabaseServiceKey && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        try {
          const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

          // Get messages from the last 5 minutes that might need notifications
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: recentMessages } = await adminSupabase
            .from('vip_messages')
            .select('*')
            .gte('created_at', fiveMinutesAgo)
            .order('created_at', { ascending: false });

          if (recentMessages && recentMessages.length > 0) {
            // Get active subscriptions
            const { data: subscriptions } = await adminSupabase
              .from('push_subscriptions')
              .select('*')
              .eq('is_active', true);

            if (subscriptions && subscriptions.length > 0) {
              let notifSent = 0;

              for (const msg of recentMessages) {
                const channelInfo = { name: 'BullMoney', channel: 'trades', priority: 'high' as const };
                const channelColumn = `channel_${channelInfo.channel}`;
                const targets = subscriptions.filter((sub: any) => sub[channelColumn] !== false);

                if (targets.length > 0) {
                  const payload = JSON.stringify({
                    title: `BullMoney ${channelInfo.name}`,
                    body: msg.message?.substring(0, 120) || 'New trade signal - tap to view',
                    icon: '/bullmoney-logo.png',
                    badge: '/B.png',
                    tag: `trade-${channelInfo.channel}-${msg.telegram_message_id || msg.id}`,
                    url: `/?channel=${channelInfo.channel}&from=notification`,
                    channel: channelInfo.channel,
                    requireInteraction: true,
                  });

                  const expired: string[] = [];
                  await Promise.allSettled(
                    targets.map(async (sub: any) => {
                      try {
                        await webpush.sendNotification(
                          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                          payload,
                          { TTL: 86400, urgency: 'high' }
                        );
                        notifSent++;
                      } catch (err: any) {
                        if (err.statusCode === 404 || err.statusCode === 410) {
                          expired.push(sub.endpoint);
                        }
                      }
                    })
                  );

                  if (expired.length > 0) {
                    await adminSupabase
                      .from('push_subscriptions')
                      .update({ is_active: false })
                      .in('endpoint', expired);
                  }
                }
              }

              console.log(`[TG Sync] Sent ${notifSent} notifications for ${recentMessages.length} recent messages (webhook mode)`);

              return NextResponse.json({
                ok: true,
                message: `Webhook mode: sent ${notifSent} notifications for ${recentMessages.length} recent messages`,
                mode: 'webhook-fallback',
                recentMessages: recentMessages.length,
                notificationsSent: notifSent
              });
            }
          }
        } catch (dbErr) {
          console.error('[TG Sync] Database fallback error:', dbErr);
        }
      }

      return NextResponse.json({
        ok: true,
        message: 'Webhook is set, using webhook mode for notifications',
        mode: 'webhook',
        hint: 'Messages are received via webhook. If notifications are not working, check webhook status at /api/telegram/webhook?action=info'
      });
    }
    
    const updates = data.result || [];
    const channelPosts = updates.filter((u: any) => u.channel_post || u.edited_channel_post);
    
    console.log('[TG Sync] Found', updates.length, 'total updates,', channelPosts.length, 'channel posts');
    
    if (channelPosts.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No new channel posts',
        totalUpdates: updates.length,
        channelPosts: 0,
        hint: updates.length > 0 ? 'Updates received but none are channel posts. Make sure the bot is admin in your channel.' : 'No updates. Post a message in your channel with the bot as admin.'
      });
    }
    
    // Process and store channel posts
    let saved = 0;
    let errors = 0;
    let lastUpdateId = 0;
    let notificationsSent = 0;
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      for (const update of channelPosts) {
        const post = update.channel_post || update.edited_channel_post;
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        
        const messageText = post.text || post.caption || '';
        const hasMedia = !!(post.photo || post.video || post.document || post.animation);
        const messageId = post.message_id;
        const chatId = post.chat?.id;
        const chatTitle = post.chat?.title || 'VIP Channel';
        const messageDate = post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString();
        
        // Skip empty messages
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
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'telegram_message_id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('[TG Sync] Error saving:', error.message);
          errors++;
        } else {
          saved++;

          // Send push notification for this new message
          if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && supabaseServiceKey) {
            const chatUsername = (post.chat?.username || '').toLowerCase();
            const channelInfo = CHANNEL_INFO[chatUsername] || { name: 'BullMoney', channel: 'trades', priority: 'high' as const };

            try {
              const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey);
              const { data: subscriptions } = await adminSupabase
                .from('push_subscriptions')
                .select('*')
                .eq('is_active', true);

              if (subscriptions && subscriptions.length > 0) {
                const channelColumn = `channel_${channelInfo.channel}`;
                const targets = subscriptions.filter((sub: any) => sub[channelColumn] !== false);

                if (targets.length > 0) {
                  const payload = JSON.stringify({
                    title: `BullMoney ${channelInfo.name}`,
                    body: messageText?.substring(0, 120) || 'New trade signal - tap to view',
                    icon: '/bullmoney-logo.png',
                    badge: '/B.png',
                    tag: `trade-${channelInfo.channel}-${messageId}`,
                    url: `/?channel=${channelInfo.channel}&from=notification`,
                    channel: channelInfo.channel,
                    requireInteraction: channelInfo.priority === 'high',
                  });

                  let pushSent = 0;
                  const expired: string[] = [];

                  await Promise.allSettled(
                    targets.map(async (sub: any) => {
                      try {
                        await webpush.sendNotification(
                          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                          payload,
                          { TTL: 86400, urgency: channelInfo.priority === 'high' ? 'high' : 'normal' }
                        );
                        pushSent++;
                      } catch (err: any) {
                        if (err.statusCode === 404 || err.statusCode === 410) {
                          expired.push(sub.endpoint);
                        }
                      }
                    })
                  );

                  // Clean up expired subscriptions
                  if (expired.length > 0) {
                    await adminSupabase
                      .from('push_subscriptions')
                      .update({ is_active: false })
                      .in('endpoint', expired);
                  }

                  notificationsSent += pushSent;
                  console.log(`[TG Sync] Push sent for message ${messageId}: ${pushSent} notifications`);
                }
              }
            } catch (pushErr) {
              console.error('[TG Sync] Push notification error:', pushErr);
            }
          }
        }
      }

      // Confirm updates to clear them from Telegram's queue
      if (lastUpdateId > 0) {
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=1`
        );
      }
    }
    
    return NextResponse.json({
      ok: true,
      message: `Synced ${saved} messages, sent ${notificationsSent} notifications`,
      totalUpdates: updates.length,
      channelPosts: channelPosts.length,
      saved,
      errors,
      notificationsSent,
      lastUpdateId
    });
    
  } catch (error) {
    console.error('[TG Sync] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal error'
    }, { status: 500 });
  }
}
