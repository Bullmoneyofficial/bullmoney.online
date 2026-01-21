import { NextRequest, NextResponse } from 'next/server';

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
  channel: string;
  channelName: string;
}

// Available channels - VIP uses invite link hash format
const CHANNELS = {
  trades: { username: 'bullmoneywebsite', name: 'Free Trades', isPrivate: false },
  main: { username: 'bullmoneyfx', name: 'BullMoney FX', isPrivate: false },
  shop: { username: 'Bullmoneyshop', name: 'BullMoney Shop', isPrivate: false },
  vip: { username: '+yW5jIfxJpv9hNmY0', name: 'VIP Trades', isPrivate: true },
};

// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = '8554647051:AAE-FBW0qW0ZL4VVvUPlytlDXdo9lH7T9A8';

// In-memory cache for VIP messages (persists during server runtime)
let vipMessagesCache: TelegramPost[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 10000; // 10 seconds

// Track last update ID for getUpdates
let lastUpdateId = 0;

// Fetch VIP messages directly from Telegram Bot API
async function fetchVIPMessagesFromTelegram(): Promise<TelegramPost[]> {
  try {
    console.log('[TG VIP] Fetching messages from Telegram Bot API...');
    
    // Use getUpdates to fetch channel posts
    const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?allowed_updates=["channel_post","edited_channel_post"]&limit=100`;
    
    const response = await fetch(updatesUrl, { cache: 'no-store' });
    const data = await response.json();
    
    console.log('[TG VIP] getUpdates response:', data.ok, 'total updates:', data.result?.length || 0);
    
    if (!data.ok) {
      console.error('[TG VIP] API Error:', data.description);
      // If webhook is active, return cached messages
      if (data.description?.includes('webhook')) {
        console.log('[TG VIP] Webhook active, returning cached messages');
        return vipMessagesCache;
      }
      return [];
    }
    
    const updates = data.result || [];
    const channelPosts = updates.filter((u: any) => u.channel_post || u.edited_channel_post);
    
    console.log('[TG VIP] Found', channelPosts.length, 'channel posts');
    
    if (channelPosts.length === 0) {
      // Return cached messages if no new updates
      return vipMessagesCache;
    }
    
    // Process channel posts into our format
    const newPosts: TelegramPost[] = [];
    
    for (const update of channelPosts) {
      const post = update.channel_post || update.edited_channel_post;
      lastUpdateId = Math.max(lastUpdateId, update.update_id);
      
      const messageText = post.text || post.caption || '';
      const hasMedia = !!(post.photo || post.video || post.document || post.animation);
      const messageId = post.message_id;
      const messageDate = post.date ? new Date(post.date * 1000).toISOString() : new Date().toISOString();
      
      // Skip empty messages
      if (!messageText && !hasMedia) continue;
      
      newPosts.push({
        id: messageId.toString(),
        text: messageText || (hasMedia ? '📷 Media post' : ''),
        date: formatDate(messageDate),
        views: undefined,
        hasMedia,
        channel: '+yW5jIfxJpv9hNmY0',
        channelName: 'VIP Trades',
      });
    }
    
    // Merge new posts with cache, avoiding duplicates
    const existingIds = new Set(vipMessagesCache.map(p => p.id));
    for (const post of newPosts) {
      if (!existingIds.has(post.id)) {
        vipMessagesCache.unshift(post); // Add to beginning (newest first)
      }
    }
    
    // Keep only last 50 messages in cache
    vipMessagesCache = vipMessagesCache.slice(0, 50);
    
    // DON'T confirm updates - keep them available for next fetch
    // This way messages persist in Telegram's queue
    
    console.log('[TG VIP] Total cached messages:', vipMessagesCache.length);
    
    return vipMessagesCache;
  } catch (error) {
    console.error('[TG VIP] Error fetching from Telegram:', error);
    return vipMessagesCache; // Return cached on error
  }
}

export async function GET(request: NextRequest) {
  try {
    const channelParam = request.nextUrl.searchParams.get('channel') || 'main';
    const channel = CHANNELS[channelParam as keyof typeof CHANNELS] || CHANNELS.main;
    
    console.log('[Telegram API] Fetching channel:', channelParam, 'isPrivate:', channel.isPrivate);
    
    // For private VIP channel, fetch directly from Telegram Bot API
    if (channel.isPrivate) {
      console.log('[Telegram API] Fetching VIP messages directly from Telegram Bot');
      return await getVIPMessagesDirectFromTelegram(channel.username, channel.name);
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

// Fetch VIP messages directly from Telegram Bot API (no database)
async function getVIPMessagesDirectFromTelegram(channelUsername: string, channelName: string) {
  try {
    console.log('[VIP Direct] Fetching VIP messages directly from Telegram...');
    
    // Fetch messages from Telegram
    const posts = await fetchVIPMessagesFromTelegram();
    
    console.log('[VIP Direct] Got', posts.length, 'messages from Telegram');
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
        channel: channelUsername,
        channelName: channelName,
        lastUpdated: new Date().toISOString(),
        source: 'telegram_bot',
        message: 'No VIP messages yet. Make sure @MrBullmoneybot is admin in the VIP channel and post a message.',
        setup: {
          step1: 'Add @MrBullmoneybot as ADMIN in your VIP Telegram channel',
          step2: 'Give it "Post Messages" permission',
          step3: 'Post a test message in the VIP channel',
          step4: 'Refresh this page - messages will appear automatically'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      posts: posts.slice(0, 10),
      channel: channelUsername,
      channelName: channelName,
      lastUpdated: new Date().toISOString(),
      source: 'telegram_bot',
      totalCached: posts.length,
    }, {
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[VIP Direct] Error:', error);
    return NextResponse.json({
      success: true,
      posts: vipMessagesCache.slice(0, 10), // Return cached on error
      channel: channelUsername,
      channelName: channelName,
      lastUpdated: new Date().toISOString(),
      source: 'cache',
      error: 'Telegram fetch failed, showing cached messages',
    });
  }
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
