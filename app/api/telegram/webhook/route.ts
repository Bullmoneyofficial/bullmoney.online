import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIP_CHANNEL_ID = process.env.VIP_CHANNEL_ID;

/**
 * Telegram Webhook Handler
 * 
 * This endpoint receives messages from the Telegram Bot when new messages 
 * are posted in the VIP channel. The bot must be an admin in the channel.
 * 
 * Setup:
 * 1. Set TELEGRAM_BOT_TOKEN in .env.local
 * 2. Set VIP_CHANNEL_ID in .env.local (e.g., -1001234567890)
 * 3. Register the webhook with Telegram:
 *    curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
 */

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    console.log('📩 Telegram webhook received:', JSON.stringify(update, null, 2));
    
    // Handle channel posts
    const message = update.channel_post || update.message;
    
    if (!message) {
      return NextResponse.json({ ok: true, message: 'No message in update' });
    }
    
    // Check if this is from our VIP channel
    const chatId = message.chat?.id?.toString();
    const expectedChannelId = VIP_CHANNEL_ID?.replace('-100', '')?.replace('-', '');
    const actualChannelId = chatId?.replace('-100', '')?.replace('-', '');
    
    console.log('Chat ID:', chatId, 'Expected:', VIP_CHANNEL_ID);
    
    // Store the message in the database
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const messageText = message.text || message.caption || '';
      const hasMedia = !!(message.photo || message.video || message.document || message.animation);
      
      // Only store non-empty messages
      if (messageText || hasMedia) {
        const { error } = await supabase
          .from('vip_messages')
          .insert({
            message: messageText || '📷 Media post',
            has_media: hasMedia,
            views: 0,
            created_at: new Date(message.date * 1000).toISOString(),
            telegram_message_id: message.message_id,
          });
        
        if (error) {
          console.error('Failed to store message:', error);
        } else {
          console.log('✅ Stored VIP message:', messageText?.substring(0, 50) || '(media)');
        }
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

// GET endpoint to check webhook status and setup
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN not configured',
      setup: {
        step1: 'Add TELEGRAM_BOT_TOKEN=8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8 to .env.local',
        step2: 'Add VIP_CHANNEL_ID=-100XXXXXXXXXX to .env.local (get from channel info)',
        step3: 'Make sure the bot @MrBullmoneybot is an ADMIN in the VIP channel',
        step4: 'Call this endpoint with ?action=setup to register the webhook',
      }
    });
  }
  
  // Setup webhook
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
      telegramResponse: data,
      nextSteps: data.ok ? [
        'Webhook registered! New messages in the VIP channel will now be saved.',
        'Make sure the bot is an ADMIN in the channel with "Post Messages" permission.',
        'Test by posting a message in the VIP channel.',
      ] : ['Failed to register webhook. Check your bot token.']
    });
  }
  
  // Check webhook info
  if (action === 'info') {
    const infoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;
    const response = await fetch(infoUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      webhookInfo: data.result,
    });
  }
  
  // Delete webhook
  if (action === 'delete') {
    const deleteUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`;
    const response = await fetch(deleteUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: data.ok,
      message: 'Webhook deleted',
    });
  }
  
  // Get bot info
  const botInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
  const botResponse = await fetch(botInfoUrl);
  const botData = await botResponse.json();
  
  return NextResponse.json({
    success: true,
    bot: botData.result,
    configured: {
      TELEGRAM_BOT_TOKEN: !!TELEGRAM_BOT_TOKEN,
      VIP_CHANNEL_ID: VIP_CHANNEL_ID || 'NOT SET - Add this to .env.local',
    },
    actions: {
      setup: '?action=setup - Register webhook to receive channel messages',
      info: '?action=info - Get current webhook status',
      delete: '?action=delete - Remove webhook',
    },
    instructions: [
      '1. Make sure @MrBullmoneybot is an ADMIN in your VIP channel',
      '2. Get the channel ID by forwarding a message to @userinfobot',
      '3. Add VIP_CHANNEL_ID to .env.local (format: -100XXXXXXXXXX)',
      '4. Call ?action=setup to register the webhook',
      '5. New channel messages will automatically be saved to the database',
    ]
  });
}
