/**
 * Telegram Bot Diagnostic Endpoint
 * Checks Telegram bot status, webhook info, and recent updates
 *
 * Usage:
 *   GET /api/telegram/check
 */

import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN not configured',
      }, { status: 500 });
    }

    const result: any = {
      bot: {},
      webhook: {},
      updates: [],
    };

    // Bot info
    try {
      const botResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
        { signal: AbortSignal.timeout(5000) }
      );
      const botData = await botResponse.json();

      if (botData.ok) {
        const bot = botData.result;
        result.bot = {
          username: bot.username,
          name: bot.first_name,
          id: bot.id,
          can_join_groups: bot.can_join_groups,
          can_read_all_group_messages: bot.can_read_all_group_messages,
        };
      } else {
        result.bot.error = botData.description;
      }
    } catch (error) {
      result.bot.error = String(error);
    }

    // Webhook info
    try {
      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
        { signal: AbortSignal.timeout(5000) }
      );
      const webhookData = await webhookResponse.json();

      if (webhookData.ok) {
        const wh = webhookData.result;
        result.webhook = {
          url: wh.url || '(none)',
          pending_update_count: wh.pending_update_count || 0,
          last_error_message: wh.last_error_message || '(none)',
          last_error_date: wh.last_error_date ? new Date(wh.last_error_date * 1000).toISOString() : null,
          max_connections: wh.max_connections,
          allowed_updates: wh.allowed_updates,
        };
      } else {
        result.webhook.error = webhookData.description;
      }
    } catch (error) {
      result.webhook.error = String(error);
    }

    // Recent updates
    try {
      const updatesResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10&timeout=3`,
        { signal: AbortSignal.timeout(15000) }
      );
      const updatesData = await updatesResponse.json();

      if (updatesData.ok) {
        const updates = updatesData.result || [];
        result.updates_count = updates.length;

        result.updates = updates.slice(0, 5).map((u: any) => {
          const post = u.channel_post || u.edited_channel_post || u.message || {};
          const chat = post.chat || {};
          const text = (post.text || post.caption || '').slice(0, 100);

          return {
            update_id: u.update_id,
            chat_username: chat.username || '(no username)',
            chat_title: chat.title || '',
            chat_id: chat.id,
            text: text.slice(0, 80),
            date: post.date ? new Date(post.date * 1000).toISOString() : null,
          };
        });

        if (updates.length === 0) {
          result.no_updates_reason = [
            'Webhook is set (blocks getUpdates) - need to delete webhook first',
            'Bot is not added to any channels as admin',
            'No new messages since last poll',
          ];
        }
      } else {
        result.updates_error = updatesData.description;
      }
    } catch (error) {
      result.updates_error = String(error);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
