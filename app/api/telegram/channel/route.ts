import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
  channel: string;
  channelName: string;
}

// Available channels
const CHANNELS = {
  trades: { username: 'bullmoneywebsite', name: 'Free Trades', isPrivate: false },
  main: { username: 'bullmoneyfx', name: 'BullMoney FX', isPrivate: false },
  shop: { username: 'Bullmoneyshop', name: 'BullMoney Shop', isPrivate: false },
  vip: { username: 'bullmoneyvip', name: 'VIP Trades', isPrivate: true }, // Private - uses Bot API
};

// Supabase client for VIP messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Telegram Bot API for private channel access
// Bot must be admin in the channel with "Read Messages" permission
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIP_CHANNEL_ID = process.env.VIP_CHANNEL_ID; // e.g., -1001234567890 (channel ID with -100 prefix)

// Track last sync time to avoid too frequent syncs
let lastSyncTime = 0;
const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes minimum between syncs

// Check if we should sync and trigger it in the background
async function checkAndTriggerSync(supabase: SupabaseClient): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !VIP_CHANNEL_ID) {
    return false;
  }
  
  const now = Date.now();
  if (now - lastSyncTime < SYNC_INTERVAL) {
    return false;
  }
  
  // Trigger sync in background
  syncFromTelegramBot().catch(err => console.error('Background sync error:', err));
  lastSyncTime = now;
  return true;
}

// Sync messages from private Telegram channel using Bot API
async function syncFromTelegramBot(): Promise<void> {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !TELEGRAM_BOT_TOKEN || !VIP_CHANNEL_ID) {
      console.log('Missing config for Telegram Bot sync');
      return;
    }
    
    // Use getUpdates or getChatHistory - Bot API doesn't directly support fetching channel history
    // Instead, we'll use the forwardMessage trick or rely on updates
    // For channels, we need to use getChat and then rely on webhook/updates
    
    // Alternative: Use the Telegram Bot API's getUpdates to get recent messages
    // But for channel history, we need a different approach
    
    // Let's try using the channel's @username with t.me/s/ if it's semi-public
    // Or use a webhook approach
    
    console.log('Telegram Bot sync triggered for channel:', VIP_CHANNEL_ID);
    
    // For now, let's check if the bot can access the chat
    const chatInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${VIP_CHANNEL_ID}`;
    const chatResponse = await fetch(chatInfoUrl);
    const chatData = await chatResponse.json();
    
    if (!chatData.ok) {
      console.error('Bot cannot access channel:', chatData.description);
      console.log('Make sure the bot is an ADMIN in the channel with "Read Messages" permission');
      return;
    }
    
    console.log('Bot has access to channel:', chatData.result?.title);
    
    // Unfortunately, Telegram Bot API doesn't have a direct "get channel messages" endpoint
    // The bot can only receive messages via webhooks or getUpdates
    // For historical messages, we need to use MTProto API or store messages as they come via webhook
    
    // Let's set up a webhook endpoint and store messages as they arrive
    
  } catch (error) {
    console.error('Telegram bot sync error:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const channelParam = request.nextUrl.searchParams.get('channel') || 'main';
    const channel = CHANNELS[channelParam as keyof typeof CHANNELS] || CHANNELS.main;
    
    // For private VIP channel, fetch from database
    if (channel.isPrivate) {
      return await getVIPMessagesFromDB(channel.username, channel.name);
    }
    
    // For public channels, scrape from Telegram - minimal cache for fast updates
    const response = await fetch(`https://t.me/s/${channel.username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 10 }, // Revalidate every 10 seconds for near real-time
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.status}`);
    }

    const html = await response.text();
    const posts = parseChannelHTML(html, channel.username, channel.name);

    return NextResponse.json({
      success: true,
      posts: posts.slice(0, 10),
      channel: channel.username,
      channelName: channel.name,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching Telegram channel:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch channel posts',
      posts: [],
    }, { status: 500 });
  }
}

// Fetch VIP messages from Supabase database (synced from private Telegram channel)
async function getVIPMessagesFromDB(channelUsername: string, channelName: string) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return sample VIP content if DB not configured
      return NextResponse.json({
        success: true,
        posts: getSampleVIPPosts(channelUsername, channelName),
        channel: channelUsername,
        channelName: channelName,
        lastUpdated: new Date().toISOString(),
        source: 'sample',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check if we should auto-sync from Telegram (if configured and messages are stale)
    const shouldSync = await checkAndTriggerSync(supabase);
    
    // Fetch from vip_messages table
    const { data, error } = await supabase
      .from('vip_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      // Return sample VIP content if no messages in DB
      return NextResponse.json({
        success: true,
        posts: getSampleVIPPosts(channelUsername, channelName),
        channel: channelUsername,
        channelName: channelName,
        lastUpdated: new Date().toISOString(),
        source: 'sample',
        syncTriggered: shouldSync,
      });
    }

    // Transform DB data to post format
    const posts: TelegramPost[] = data.map((msg: any) => ({
      id: msg.id?.toString() || Math.random().toString(36).substr(2, 9),
      text: msg.message || msg.text || msg.content || '',
      date: formatDate(msg.created_at),
      views: msg.views?.toString(),
      hasMedia: msg.has_media || false,
      channel: channelUsername,
      channelName: channelName,
    }));

    return NextResponse.json({
      success: true,
      posts,
      channel: channelUsername,
      channelName: channelName,
      lastUpdated: new Date().toISOString(),
      source: 'database',
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching VIP messages from DB:', error);
    return NextResponse.json({
      success: true,
      posts: getSampleVIPPosts(channelUsername, channelName),
      channel: channelUsername,
      channelName: channelName,
      lastUpdated: new Date().toISOString(),
      source: 'sample',
    });
  }
}

// Sample VIP posts for when DB is empty or unavailable
function getSampleVIPPosts(channelUsername: string, channelName: string): TelegramPost[] {
  return [
    {
      id: 'vip-1',
      text: '🚀 VIP SIGNAL: GOLD (XAUUSD)\n\n📈 BUY @ 2650.00\n🎯 TP1: 2665.00\n🎯 TP2: 2680.00\n🛑 SL: 2635.00\n\n⚡ Risk: 1-2% of capital\n📊 Confidence: HIGH',
      date: '2h ago',
      views: '1.2K',
      hasMedia: false,
      channel: channelUsername,
      channelName: channelName,
    },
    {
      id: 'vip-2',
      text: '💎 PREMIUM ANALYSIS: EUR/USD\n\nLooking for a potential reversal at the 1.0850 support level. Multiple confluences including:\n\n✅ 200 EMA support\n✅ Previous structure\n✅ RSI oversold\n\nWait for confirmation before entry.',
      date: '5h ago',
      views: '890',
      hasMedia: true,
      channel: channelUsername,
      channelName: channelName,
    },
    {
      id: 'vip-3',
      text: '📊 WEEKLY MARKET OUTLOOK\n\n🔹 USD strength expected to continue\n🔹 Watch NFP data Friday\n🔹 Gold consolidating before next move\n🔹 BTC holding key support\n\nFull analysis in members area 👑',
      date: '1d ago',
      views: '2.1K',
      hasMedia: false,
      channel: channelUsername,
      channelName: channelName,
    },
    {
      id: 'vip-4',
      text: '✅ CLOSED IN PROFIT!\n\nGBP/JPY signal hit TP2!\n\n📈 Entry: 188.50\n🎯 Exit: 189.80\n💰 +130 pips\n\nCongrats to everyone who took this! 🔥',
      date: '2d ago',
      views: '1.5K',
      hasMedia: false,
      channel: channelUsername,
      channelName: channelName,
    },
    {
      id: 'vip-5',
      text: '⚠️ RISK MANAGEMENT REMINDER\n\nNever risk more than 1-2% per trade.\n\nEven with a 50% win rate, proper risk management = long-term profitability.\n\nProtect your capital! 💪',
      date: '3d ago',
      views: '980',
      hasMedia: false,
      channel: channelUsername,
      channelName: channelName,
    },
  ];
}

function parseChannelHTML(html: string, channelUsername: string, channelName: string): TelegramPost[] {
  const posts: TelegramPost[] = [];
  
  try {
    const postIdPattern = new RegExp(`data-post="${channelUsername}\\/(\\d+)"`, 'gi');
    const postIds: string[] = [];
    let idMatch;
    while ((idMatch = postIdPattern.exec(html)) !== null) {
      postIds.push(idMatch[1]);
    }
    
    const texts: string[] = [];
    let textMatch;
    const textRegex = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((textMatch = textRegex.exec(html)) !== null) {
      let text = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#33;/g, '!')
        .replace(/&#63;/g, '?')
        .replace(/&#64;/g, '@')
        .replace(/&#35;/g, '#')
        .replace(/&#36;/g, '$')
        .replace(/&#37;/g, '%')
        .replace(/&#38;/g, '&')
        .replace(/&#40;/g, '(')
        .replace(/&#41;/g, ')')
        .replace(/&#42;/g, '*')
        .replace(/&#43;/g, '+')
        .replace(/&#45;/g, '-')
        .replace(/&#47;/g, '/')
        .replace(/&#58;/g, ':')
        .replace(/&#59;/g, ';')
        .replace(/&#61;/g, '=')
        .replace(/&#91;/g, '[')
        .replace(/&#93;/g, ']')
        .replace(/&#123;/g, '{')
        .replace(/&#125;/g, '}')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .trim();
      texts.push(text);
    }
    
    const dates: string[] = [];
    let dateMatch;
    const dateRegex = /<time[^>]*datetime="([^"]+)"[^>]*>([^<]+)<\/time>/gi;
    while ((dateMatch = dateRegex.exec(html)) !== null) {
      dates.push(formatDate(dateMatch[1]) || dateMatch[2]);
    }
    
    const views: string[] = [];
    let viewMatch;
    const viewRegex = /class="tgme_widget_message_views"[^>]*>([^<]+)</gi;
    while ((viewMatch = viewRegex.exec(html)) !== null) {
      views.push(viewMatch[1].trim());
    }
    
    const mediaIds = new Set<string>();
    const mediaCheckPattern = new RegExp(`data-post="${channelUsername}\\/(\\d+)"[\\s\\S]*?(?:tgme_widget_message_photo|tgme_widget_message_video|tgme_widget_message_document)`, 'gi');
    let mediaMatch;
    while ((mediaMatch = mediaCheckPattern.exec(html)) !== null) {
      mediaIds.add(mediaMatch[1]);
    }
    
    const maxPosts = Math.min(postIds.length, texts.length);
    for (let i = 0; i < maxPosts; i++) {
      posts.push({
        id: postIds[i],
        text: texts[i] || '(Media post)',
        date: dates[i] || 'Recently',
        views: views[i],
        hasMedia: mediaIds.has(postIds[i]),
        channel: channelUsername,
        channelName: channelName,
      });
    }
    
    posts.reverse();
    
  } catch (parseError) {
    console.error('Error parsing Telegram HTML:', parseError);
  }
  
  return posts;
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
