import { NextResponse } from 'next/server';

// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

/**
 * Delete Telegram Webhook
 * 
 * This endpoint deletes any active webhook so getUpdates can work.
 * When a webhook is set, getUpdates doesn't return any data.
 */
export async function POST() {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        ok: false,
        error: 'Bot token not configured'
      }, { status: 500 });
    }
    
    // Delete webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`,
      { method: 'POST' }
    );
    const data = await response.json();
    
    if (!data.ok) {
      return NextResponse.json({
        ok: false,
        error: data.description || 'Failed to delete webhook'
      }, { status: 500 });
    }
    
    // Verify webhook is deleted
    const webhookInfo = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    const webhookData = await webhookInfo.json();
    
    return NextResponse.json({
      ok: true,
      message: 'Webhook deleted successfully',
      webhookStatus: {
        url: webhookData.result?.url || 'None',
        pendingUpdates: webhookData.result?.pending_update_count || 0
      },
      nextSteps: [
        '1. Webhook is now deleted',
        '2. getUpdates will now work',
        '3. Post a message in your VIP channel',
        '4. Refresh the VIP Trades section to see messages'
      ]
    });
    
  } catch (error) {
    console.error('[TG Delete Webhook] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to delete webhook',
    hint: 'curl -X POST http://localhost:3000/api/telegram/delete-webhook'
  });
}
