import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bullmoney.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const CHANNEL_INFO: Record<string, { name: string; channel: string; priority: 'high' | 'normal' }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'NEWS', channel: 'shop', priority: 'normal' },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const update = await request.json();
    const message = update.channel_post || update.message;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }
    
    const chatUsername = (message.chat?.username || '').toLowerCase();
    const messageText = message.text || message.caption || '';
    const hasMedia = !!(message.photo || message.video || message.document || message.animation);
    
    if (!messageText && !hasMedia) {
      return NextResponse.json({ ok: true });
    }
    
    let channelInfo = CHANNEL_INFO[chatUsername] || { 
      name: 'BullMoney', 
      channel: 'trades', 
      priority: 'high' as const 
    };
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: 'DB not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store message in database
    await supabase
      .from('vip_messages')
      .insert({
        message: messageText || 'Media post',
        has_media: hasMedia,
        views: 0,
        created_at: new Date(message.date * 1000).toISOString(),
        telegram_message_id: message.message_id,
      })
      .catch(() => {});
    
    // PUSH NOTIFICATIONS - Works when browser is closed!
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      try {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('is_active', true);
        
        if (subscriptions && subscriptions.length > 0) {
          const channelColumn = `channel_${channelInfo.channel}`;
          const targets = subscriptions.filter(sub => sub[channelColumn] !== false);
          
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
              } catch (err: any) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                  expired.push(sub.endpoint);
                }
              }
            })
          );
          
          if (expired.length > 0) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .in('endpoint', expired)
              .catch(() => {});
          }
          
          console.log(`[Webhook] ${sent}/${targets.length} sent (${Date.now() - startTime}ms)`);
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
    if (!VAPID_PUBLIC_KEY || !supabaseUrl) {
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
