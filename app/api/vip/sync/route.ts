import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Telegram API credentials - get from https://my.telegram.org/apps
const TELEGRAM_API_ID = process.env.TELEGRAM_API_ID;
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;
const TELEGRAM_SESSION = process.env.TELEGRAM_SESSION; // StringSession from gramjs
const VIP_CHANNEL_USERNAME = process.env.VIP_CHANNEL_USERNAME || 'bullmoneyvip';

interface TelegramMessage {
  id: number;
  message: string;
  date: number;
  views?: number;
  hasMedia: boolean;
}

// POST - Sync messages from private Telegram channel to database
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const body = await request.json();
    const { admin_key } = body;
    
    const validAdminKey = process.env.ADMIN_API_KEY || 'bullmoney-admin-2024';
    if (admin_key !== validAdminKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH || !TELEGRAM_SESSION) {
      return NextResponse.json({
        success: false,
        error: 'Telegram API credentials not configured. Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION in environment variables.',
        setup_instructions: {
          step1: 'Go to https://my.telegram.org/apps and create an app',
          step2: 'Get your API_ID and API_HASH',
          step3: 'Run the setup script to generate TELEGRAM_SESSION string',
          step4: 'Add all three to your .env.local file',
        }
      }, { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Dynamic import gramjs (telegram package)
    const { TelegramClient } = await import('telegram');
    const { StringSession } = await import('telegram/sessions');

    const client = new TelegramClient(
      new StringSession(TELEGRAM_SESSION),
      parseInt(TELEGRAM_API_ID),
      TELEGRAM_API_HASH,
      { connectionRetries: 3 }
    );

    await client.connect();

    // Get messages from the private channel
    const messages = await client.getMessages(VIP_CHANNEL_USERNAME, {
      limit: 20,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear old messages and insert new ones
    await supabase.from('vip_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const formattedMessages = messages
      .filter((msg: any) => msg.message || msg.media)
      .map((msg: any) => ({
        message: msg.message || '📷 Media post',
        has_media: !!msg.media,
        views: msg.views || 0,
        created_at: new Date(msg.date * 1000).toISOString(),
      }));

    if (formattedMessages.length > 0) {
      const { error } = await supabase
        .from('vip_messages')
        .insert(formattedMessages);

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    }

    await client.disconnect();

    return NextResponse.json({
      success: true,
      synced: formattedMessages.length,
      message: `Synced ${formattedMessages.length} messages from @${VIP_CHANNEL_USERNAME}`,
    });
  } catch (error: any) {
    console.error('Telegram sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to sync Telegram messages',
    }, { status: 500 });
  }
}

// GET - Check sync status
export async function GET() {
  const configured = !!(TELEGRAM_API_ID && TELEGRAM_API_HASH && TELEGRAM_SESSION);
  
  return NextResponse.json({
    success: true,
    configured,
    channel: VIP_CHANNEL_USERNAME,
    message: configured 
      ? 'Telegram sync is configured. POST to this endpoint to sync messages.'
      : 'Telegram API credentials not configured. See setup instructions.',
    setup_required: !configured ? {
      TELEGRAM_API_ID: !!TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!TELEGRAM_API_HASH,
      TELEGRAM_SESSION: !!TELEGRAM_SESSION,
    } : undefined,
  });
}
