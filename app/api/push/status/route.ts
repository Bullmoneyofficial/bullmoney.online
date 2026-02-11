/**
 * Push Notification System Status Endpoint
 * Checks the health of the notification system
 *
 * Usage:
 *   GET /api/push/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET(request: NextRequest) {
  try {
    const status: any = {
      config: {
        vapid_public_key: !!VAPID_PUBLIC_KEY,
        vapid_private_key: !!VAPID_PRIVATE_KEY,
        supabase_url: !!SUPABASE_URL,
        supabase_key: !!SUPABASE_KEY,
        telegram_bot_token: !!TELEGRAM_BOT_TOKEN,
      },
      database: {},
      telegram: {},
    };

    const allConfigured = Object.values(status.config).every(v => v === true);
    status.all_configured = allConfigured;

    if (!allConfigured) {
      return NextResponse.json(status);
    }

    // Database check
    try {
      // Count active subscribers
      const { data: subs, count: subCount } = await supabase
        .from('push_subscriptions')
        .select('endpoint', { count: 'exact' })
        .eq('is_active', true);

      status.database.active_subscribers = subCount || (subs?.length || 0);

      // Count recent messages (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: msgs, count: msgCount } = await supabase
        .from('vip_messages')
        .select('id', { count: 'exact' })
        .gte('created_at', oneHourAgo);

      status.database.messages_last_hour = msgCount || (msgs?.length || 0);

      // Count unnotified messages
      const { data: unnotified, count: unnotifiedCount } = await supabase
        .from('vip_messages')
        .select('id', { count: 'exact' })
        .or('notification_sent.is.null,notification_sent.eq.false');

      status.database.unnotified_messages = unnotifiedCount || (unnotified?.length || 0);
    } catch (error) {
      status.database.error = String(error);
    }

    // Telegram check
    if (TELEGRAM_BOT_TOKEN) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
          { signal: AbortSignal.timeout(5000) }
        );
        const data = await response.json();

        if (data.ok) {
          const bot = data.result;
          status.telegram.bot_username = bot.username;
          status.telegram.bot_name = bot.first_name;
          status.telegram.connected = true;
        } else {
          status.telegram.error = data.description || 'Bot token invalid';
          status.telegram.connected = false;
        }
      } catch (error) {
        status.telegram.error = String(error);
        status.telegram.connected = false;
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
