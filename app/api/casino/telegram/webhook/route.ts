import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CASINO_BOT_TOKEN = process.env.CASINO_TELEGRAM_BOT_TOKEN || '6345622919:AAFsKKK-fKux-gkk';

/**
 * Casino Telegram Bot Webhook Handler
 * Handles /start and /bind commands for linking Telegram accounts to casino accounts
 */
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update.message;
    
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }
    
    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || 'User';
    
    console.log(`[Casino Bot] Message from ${username} (${chatId}): ${text}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Casino Bot] Supabase not configured');
      return NextResponse.json({ ok: false, error: 'Database not configured' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Handle /start command
    if (text.toLowerCase() === '/start') {
      await sendTelegramMessage(
        chatId,
        'This is the official BullMoney Casino Telegram bot. To link your Telegram account, enter the command shown at <a href="https://bullmoney.shop/games">bullmoney.shop/games</a>.',
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );
      return NextResponse.json({ ok: true });
    }
    
    // Handle /bind command
    if (text.toLowerCase().startsWith('/bind')) {
      const uniqueId = text.split(' ')[1];
      
      if (!uniqueId || uniqueId === 'undefined') {
        await sendTelegramMessage(
          chatId,
          '❌ Invalid command. Please use the bind command shown on the website.',
          { parse_mode: 'HTML' }
        );
        return NextResponse.json({ ok: true });
      }
      
      // Check if user exists with this unique_id
      const { data: user, error: userError } = await supabase
        .from('casino_users')
        .select('*')
        .eq('unique_id', uniqueId)
        .single();
      
      if (userError || !user) {
        await sendTelegramMessage(
          chatId,
          '❌ We could not find this user. Please check your code and try again.',
          { parse_mode: 'HTML' }
        );
        return NextResponse.json({ ok: true });
      }
      
      // Check if this Telegram account is already linked to another account
      const { data: existingLink } = await supabase
        .from('casino_users')
        .select('id')
        .eq('tg_id', chatId.toString())
        .single();
      
      if (existingLink) {
        await sendTelegramMessage(
          chatId,
          '❌ This Telegram account is already linked to a casino account!'
        );
        return NextResponse.json({ ok: true });
      }
      
      // Check if user already received the Telegram bonus
      if (user.tg_bonus_used) {
        await sendTelegramMessage(
          chatId,
          '❌ This casino account has already received the Telegram bonus.'
        );
        return NextResponse.json({ ok: true });
      }
      
      // Optional: Check if user is subscribed to @BullMoney channel
      try {
        const chatMember = await checkChannelSubscription(chatId);
        if (!chatMember || !['member', 'administrator', 'creator'].includes(chatMember.status)) {
          await sendTelegramMessage(
            chatId,
            '❌ You must be subscribed to the <a href="https://t.me/BullMoney">@BullMoney channel</a> to receive the bonus!',
            { parse_mode: 'HTML', disable_web_page_preview: true }
          );
          return NextResponse.json({ ok: true });
        }
      } catch (error) {
        console.log('[Casino Bot] Could not check channel subscription:', error);
        // Continue anyway if channel check fails
      }
      
      // Get settings for bonus amount
      const { data: settings } = await supabase
        .from('casino_settings')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      const telegramBonusAmount = settings?.telegram_bonus_amount || 500;
      
      // Link Telegram account and give bonus
      const newBalance = parseFloat((user.balance + telegramBonusAmount).toFixed(2));
      
      const { error: updateError } = await supabase
        .from('casino_users')
        .update({
          tg_id: chatId.toString(),
          tg_bonus_used: true,
          balance: newBalance,
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('[Casino Bot] Failed to update user:', updateError);
        await sendTelegramMessage(
          chatId,
          '❌ An error occurred while linking your account. Please try again later.'
        );
        return NextResponse.json({ ok: false });
      }
      
      await sendTelegramMessage(
        chatId,
        `✅ Your account has been successfully linked!\n\n🎁 You received ${telegramBonusAmount} coins as a bonus. Good luck!`
      );
      
      return NextResponse.json({ ok: true });
    }
    
    // Unknown command
    await sendTelegramMessage(
      chatId,
      'Unknown command. Use /start to begin or /bind to link your account.'
    );
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('[Casino Bot] Webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET endpoint for webhook management
 * ?action=setup - Register webhook
 * ?action=info - Get webhook info
 * ?action=delete - Delete webhook
 */
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  
  if (action === 'setup') {
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/casino/telegram/webhook`;
    
    const setupUrl = `https://api.telegram.org/bot${CASINO_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    try {
      const response = await fetch(setupUrl);
      const data = await response.json();
      
      return NextResponse.json({
        success: data.ok,
        webhookUrl,
        message: data.ok ? 'Casino bot webhook registered!' : 'Failed to register webhook',
        error: data.ok ? undefined : data.description,
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        webhookUrl,
        error: error.message,
      });
    }
  }
  
  if (action === 'info') {
    try {
      const infoUrl = `https://api.telegram.org/bot${CASINO_BOT_TOKEN}/getWebhookInfo`;
      const response = await fetch(infoUrl);
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        webhookInfo: data.result,
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }
  }
  
  if (action === 'delete') {
    try {
      const deleteUrl = `https://api.telegram.org/bot${CASINO_BOT_TOKEN}/deleteWebhook`;
      const response = await fetch(deleteUrl);
      const data = await response.json();
      
      return NextResponse.json({
        success: data.ok,
        message: data.ok ? 'Webhook deleted' : 'Failed to delete webhook',
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }
  }
  
  return NextResponse.json({ 
    ok: true, 
    message: 'Casino Telegram Bot Webhook',
    usage: 'Use ?action=setup|info|delete to manage webhook'
  });
}

// Helper function to send Telegram messages
async function sendTelegramMessage(
  chatId: number,
  text: string,
  options: Record<string, any> = {}
) {
  const url = `https://api.telegram.org/bot${CASINO_BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error('[Casino Bot] Failed to send message:', data);
    }
    
    return data;
  } catch (error) {
    console.error('[Casino Bot] Error sending message:', error);
    return null;
  }
}

// Helper function to check channel subscription
async function checkChannelSubscription(chatId: number) {
  const url = `https://api.telegram.org/bot${CASINO_BOT_TOKEN}/getChatMember`;
  
  try {
    const response = await fetch(`${url}?chat_id=@BullMoney&user_id=${chatId}`);
    const data = await response.json();
    
    if (data.ok) {
      return data.result;
    }
    
    return null;
  } catch (error) {
    console.error('[Casino Bot] Error checking subscription:', error);
    return null;
  }
}
