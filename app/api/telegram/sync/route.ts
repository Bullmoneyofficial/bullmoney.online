import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

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
    
    if (!data.ok) {
      return NextResponse.json({
        ok: false,
        error: data.description || 'Failed to get updates',
        hint: 'Make sure the bot token is valid and no webhook is set (use /api/telegram/webhook?action=delete first)'
      }, { status: 500 });
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
      message: `Synced ${saved} messages`,
      totalUpdates: updates.length,
      channelPosts: channelPosts.length,
      saved,
      errors,
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
