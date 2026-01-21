import { NextRequest, NextResponse } from 'next/server';

// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

/**
 * Telegram Bot Info Endpoint
 * 
 * This endpoint helps you:
 * 1. Verify the bot is working
 * 2. Find channel IDs from recent updates
 * 3. Test bot permissions
 * 
 * Usage:
 * GET /api/telegram/bot - Get bot info and recent channel activity
 * GET /api/telegram/bot?action=updates - Get raw updates (to find channel ID)
 * GET /api/telegram/bot?action=chat&id=-100xxx - Get info about a specific chat
 */
export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    const chatId = request.nextUrl.searchParams.get('id');
    
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        ok: false,
        error: 'Bot token not configured'
      }, { status: 500 });
    }
    
    // Get specific chat info
    if (action === 'chat' && chatId) {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${chatId}`
      );
      const data = await response.json();
      
      return NextResponse.json({
        ok: data.ok,
        chat: data.result,
        error: data.description,
        hint: !data.ok ? 'Make sure the bot is a member/admin of this chat' : undefined
      });
    }
    
    // Get raw updates
    if (action === 'updates') {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=50`
      );
      const data = await response.json();
      
      // Extract unique channels from updates
      const channels: Record<string, any> = {};
      if (data.ok && data.result) {
        for (const update of data.result) {
          const msg = update.channel_post || update.message;
          if (msg?.chat) {
            const chat = msg.chat;
            channels[chat.id] = {
              id: chat.id,
              title: chat.title,
              username: chat.username,
              type: chat.type
            };
          }
        }
      }
      
      return NextResponse.json({
        ok: data.ok,
        totalUpdates: data.result?.length || 0,
        channelsFound: Object.values(channels),
        hint: Object.keys(channels).length === 0 
          ? 'No channel messages found. Post a message in your channel with the bot as admin, then check again.'
          : 'Copy the channel ID (negative number starting with -100) and add it to VIP_CHANNEL_ID in your .env.local',
        rawUpdates: data.result?.slice(0, 5) // Show first 5 for debugging
      });
    }
    
    // Default: Get bot info
    const botResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );
    const botData = await botResponse.json();
    
    // Also check webhook status
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const webhookData = await webhookResponse.json();
    
    // Get recent updates count
    const updatesResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=100`
    );
    const updatesData = await updatesResponse.json();
    
    // Find channels in updates
    const channelPosts = (updatesData.result || []).filter((u: any) => u.channel_post);
    const channels = new Set(channelPosts.map((u: any) => u.channel_post.chat.id));
    
    return NextResponse.json({
      ok: botData.ok,
      bot: botData.result ? {
        id: botData.result.id,
        name: botData.result.first_name,
        username: botData.result.username,
        canJoinGroups: botData.result.can_join_groups,
        canReadAllGroupMessages: botData.result.can_read_all_group_messages
      } : null,
      webhook: {
        url: webhookData.result?.url || 'Not set',
        hasCustomCertificate: webhookData.result?.has_custom_certificate,
        pendingUpdateCount: webhookData.result?.pending_update_count
      },
      updates: {
        total: updatesData.result?.length || 0,
        channelPosts: channelPosts.length,
        uniqueChannels: Array.from(channels)
      },
      setup: {
        step1: 'Make @MrBullmoneybot an ADMIN in your VIP channel',
        step2: 'Post a test message in the VIP channel',
        step3: 'Visit /api/telegram/bot?action=updates to find the channel ID',
        step4: 'Add VIP_CHANNEL_ID=<channel_id> to .env.local',
        step5: 'Visit /api/telegram/sync to pull messages into the database'
      }
    });
    
  } catch (error) {
    console.error('[TG Bot] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal error'
    }, { status: 500 });
  }
}
