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
  vip2: { username: '+uvegzpHfYdU2ZTZk', name: 'VIP Setups', isPrivate: true },
};

// Mr.Bullmoney Bot Token - @MrBullmoneybot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIP_CHANNEL_ID = process.env.VIP_CHANNEL_ID;
const VIP_SETUPS_CHANNEL_ID = process.env.VIP_SETUPS_CHANNEL_ID || process.env.VIP_SIGNALS_CHANNEL_ID || process.env.VIP2_CHANNEL_ID;
const DEBUG_API_LOGS = process.env.DEBUG_API_LOGS === 'true';

const logInfo = (...args: unknown[]) => {
  if (DEBUG_API_LOGS) {
    console.log(...args);
  }
};

const logWarn = (...args: unknown[]) => {
  if (DEBUG_API_LOGS) {
    console.warn(...args);
  }
};


type PrivateChannelKey = 'vip' | 'vip2';

const PRIVATE_CHANNEL_IDS: Record<PrivateChannelKey, string | undefined> = {
  vip: VIP_CHANNEL_ID,
  vip2: VIP_SETUPS_CHANNEL_ID,
};

const PRIVATE_CHANNEL_META: Record<PrivateChannelKey, { handle: string; name: string }> = {
  vip: { handle: '+yW5jIfxJpv9hNmY0', name: 'VIP Trades' },
  vip2: { handle: '+uvegzpHfYdU2ZTZk', name: 'VIP Setups' },
};

// In-memory cache for private channel messages (persists during server runtime)
const privateMessagesCache: Record<PrivateChannelKey, TelegramPost[]> = { vip: [], vip2: [] };
const privateLastFetchTime: Record<PrivateChannelKey, number> = { vip: 0, vip2: 0 };
const PRIVATE_CACHE_DURATION = 15000; // 15 seconds — private messages don't change that fast
const privateFetchInFlight: Partial<Record<PrivateChannelKey, Promise<TelegramPost[]>>> = {};

// Cache webhook status to avoid repeated network calls
let webhookStatusCache: { active: boolean; url: string | null; fetchedAt: number } | null = null;
const WEBHOOK_CACHE_DURATION = 10000; // 10 seconds

// Cache for public channels
type PublicCacheEntry = { posts: TelegramPost[]; fetchedAt: number };
const publicChannelCache: Record<string, PublicCacheEntry> = {};
const PUBLIC_CACHE_DURATION = 15000; // 15 seconds — channel posts don't change that fast
const publicFetchInFlight = new Map<string, Promise<TelegramPost[]>>();

const TELEGRAM_FETCH_TIMEOUT_MS = 4000;

// Track last update ID for getUpdates
// (currently unused but reserved for future incremental polling)

async function getWebhookStatus() {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return { active: false, url: null };
    }
    const now = Date.now();
    if (webhookStatusCache && now - webhookStatusCache.fetchedAt < WEBHOOK_CACHE_DURATION) {
      return { active: webhookStatusCache.active, url: webhookStatusCache.url };
    }
    const webhookInfo = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      { 
        cache: 'no-store',
        signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS)
      }
    );
    const webhookData = await webhookInfo.json();
    const url = webhookData?.result?.url;
    const status = { active: !!url, url: url ?? null };
    webhookStatusCache = { ...status, fetchedAt: now };
    return status;
  } catch (error) {
    if (DEBUG_API_LOGS) {
      console.error('[TG VIP] Webhook info error:', error);
    }
    return { active: false, url: null };
  }
}

// Fetch VIP messages directly from Telegram Bot API
function normalizeChatId(chatId: string) {
  return String(chatId || '').replace('-100', '').replace('-', '');
}

async function fetchPrivateMessagesFromTelegram(channelKey: PrivateChannelKey): Promise<TelegramPost[]> {
  const now = Date.now();
  const cached = privateMessagesCache[channelKey];
  if (cached.length > 0 && now - privateLastFetchTime[channelKey] < PRIVATE_CACHE_DURATION) {
    return cached;
  }

  if (privateFetchInFlight[channelKey]) {
    return privateFetchInFlight[channelKey]!;
  }

  privateFetchInFlight[channelKey] = (async () => {
    try {
      logInfo(`[TG ${channelKey}] Fetching messages from Telegram Bot API...`);

      if (!TELEGRAM_BOT_TOKEN) {
        if (DEBUG_API_LOGS) {
          console.error(`[TG ${channelKey}] TELEGRAM_BOT_TOKEN not configured`);
        }
        return privateMessagesCache[channelKey];
      }

      // First check if webhook is active
      const webhookStatus = await getWebhookStatus();

      if (webhookStatus.active) {
        logWarn(`[TG ${channelKey}] Webhook is active:`, webhookStatus.url);
        // When webhook is active, getUpdates will not return messages.
        return privateMessagesCache[channelKey];
      }

      // Use getUpdates to fetch channel posts
      const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?allowed_updates=["channel_post","edited_channel_post"]&limit=100`;

      const response = await fetch(updatesUrl, { 
        cache: 'no-store',
        signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS)
      });
      const data = await response.json();

      logInfo(`[TG ${channelKey}] getUpdates response:`, data.ok, 'total updates:', data.result?.length || 0);

      if (!data.ok) {
        if (DEBUG_API_LOGS) {
          console.error(`[TG ${channelKey}] API Error:`, data.description);
        }
        return privateMessagesCache[channelKey];
      }

      const updates = data.result || [];
      const expectedChannelId = PRIVATE_CHANNEL_IDS[channelKey];
      const expectedNormalized = expectedChannelId ? normalizeChatId(expectedChannelId) : null;
      const channelPosts = updates
        .map((u: any) => u.channel_post || u.edited_channel_post)
        .filter(Boolean)
        .filter((post: any) => {
          // Prefer exact chat_id match when configured (recommended).
          if (expectedNormalized) {
            const actual = normalizeChatId(String(post.chat?.id || ''));
            return expectedNormalized && actual ? expectedNormalized === actual : true;
          }

          // Fallback heuristic when env var isn't set: attempt to filter by chat title.
          const title = String(post.chat?.title || '').toLowerCase();
          if (!title) return true;
          if (channelKey === 'vip2') {
            return title.includes('signal') || title.includes('setup') || title.includes('alert');
          }
          return title.includes('trade');
        });

      logInfo(`[TG ${channelKey}] Found`, channelPosts.length, 'channel posts');

      if (channelPosts.length === 0) {
        // Return cached messages if no new updates
        return privateMessagesCache[channelKey];
      }

      // Process channel posts into our format
      const newPosts: TelegramPost[] = [];

      const privateMeta = PRIVATE_CHANNEL_META[channelKey];

      for (const post of channelPosts) {
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
          channel: privateMeta.handle,
          channelName: privateMeta.name,
        });
      }

      // Merge new posts with cache, avoiding duplicates
      const existingIds = new Set(privateMessagesCache[channelKey].map(p => p.id));
      for (const post of newPosts) {
        if (!existingIds.has(post.id)) {
          privateMessagesCache[channelKey].unshift(post); // Add to beginning (newest first)
        }
      }

      // Keep only last 50 messages in cache
      privateMessagesCache[channelKey] = privateMessagesCache[channelKey].slice(0, 50);

      // DON'T confirm updates - keep them available for next fetch
      // This way messages persist in Telegram's queue

      logInfo(`[TG ${channelKey}] Total cached messages:`, privateMessagesCache[channelKey].length);

      return privateMessagesCache[channelKey];
    } catch (error) {
      if (DEBUG_API_LOGS) {
        console.error(`[TG ${channelKey}] Error fetching from Telegram:`, error);
      }
      return privateMessagesCache[channelKey]; // Return cached on error
    } finally {
      privateLastFetchTime[channelKey] = Date.now();
    }
  })();

  try {
    return await privateFetchInFlight[channelKey]!;
  } finally {
    privateFetchInFlight[channelKey] = undefined;
  }
}

export async function GET(request: NextRequest) {
  const channelParam = request.nextUrl.searchParams.get('channel') || 'main';
  try {
    const channel = CHANNELS[channelParam as keyof typeof CHANNELS] || CHANNELS.main;
    
    logInfo('[Telegram API] Fetching channel:', channelParam, 'isPrivate:', channel.isPrivate);
    
    // For private VIP channel, fetch directly from Telegram Bot API
    if (channel.isPrivate) {
      logInfo('[Telegram API] Fetching VIP messages directly from Telegram Bot');
      const privateKey: PrivateChannelKey = channelParam === 'vip2' ? 'vip2' : 'vip';
      return await getPrivateMessagesDirectFromTelegram(privateKey, channel.username, channel.name);
    }
    
    // For public channels, scrape from Telegram - minimal cache for fast updates
    const cacheKey = channelParam;
    const cachedPublic = publicChannelCache[cacheKey];
    const now = Date.now();

    if (cachedPublic && now - cachedPublic.fetchedAt < PUBLIC_CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        posts: cachedPublic.posts.slice(0, 10),
        channel: channel.username,
        channelName: channel.name,
        lastUpdated: new Date(cachedPublic.fetchedAt).toISOString(),
        source: 'cache'
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      });
    }

    const existingInFlight = publicFetchInFlight.get(cacheKey);
    if (existingInFlight) {
      const posts = await existingInFlight.catch(() => null);
      if (posts && posts.length > 0) {
        return NextResponse.json({
          success: true,
          posts: posts.slice(0, 10),
          channel: channel.username,
          channelName: channel.name,
          lastUpdated: new Date().toISOString(),
          source: 'inflight'
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
          },
        });
      }
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch(`https://t.me/s/${channel.username}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
          },
          next: { revalidate: 10 }, // Revalidate every 10 seconds for near real-time
          signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS)
        });

        if (!response.ok) {
          return [];
        }

        const html = await response.text();
        const posts = parseChannelHTML(html, channel.username, channel.name);

        publicChannelCache[cacheKey] = { posts, fetchedAt: Date.now() };
        return posts;
      } catch {
        return [];
      }
    })();

    publicFetchInFlight.set(cacheKey, fetchPromise);
    let posts: TelegramPost[] = [];
    try {
      posts = await fetchPromise;
    } finally {
      publicFetchInFlight.delete(cacheKey);
    }

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
    if (DEBUG_API_LOGS) {
      console.error('Error fetching Telegram channel:', error);
    }
    const cachedPublic = publicChannelCache[channelParam];
    if (cachedPublic && cachedPublic.posts.length > 0) {
      return NextResponse.json({
        success: true,
        posts: cachedPublic.posts.slice(0, 10),
        channel: channelParam,
        channelName: CHANNELS[channelParam as keyof typeof CHANNELS]?.name ?? 'Unknown',
        lastUpdated: new Date(cachedPublic.fetchedAt).toISOString(),
        source: 'cache-fallback'
      }, { status: 200 });
    }
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch channel posts',
      posts: [],
    }, { status: 200 });
  }
}

// Fetch VIP messages directly from Telegram Bot API (no database)
async function getPrivateMessagesDirectFromTelegram(channelKey: PrivateChannelKey, channelUsername: string, channelName: string) {
  try {
    logInfo(`[VIP Direct] Fetching ${channelKey} messages directly from Telegram...`);
    
    // Check webhook status first
    const webhookStatus = await getWebhookStatus();
    
    // Fetch messages from Telegram (or DB fallback if webhook is active)
    let posts = await fetchPrivateMessagesFromTelegram(channelKey);
    
    logInfo('[VIP Direct] Got', posts.length, 'messages from Telegram');
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
        channel: channelUsername,
        channelName: channelName,
        lastUpdated: new Date().toISOString(),
        source: 'telegram_bot',
        message: webhookStatus.active 
          ? 'Webhook is active. Messages should appear once the webhook is receiving posts.'
          : 'No VIP messages yet. Make sure @MrBullmoneybot is admin in the VIP channel and post a message.',
        webhook: webhookStatus.active ? { url: webhookStatus.url } : null,
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
    if (DEBUG_API_LOGS) {
      console.error('[VIP Direct] Error:', error);
    }
    return NextResponse.json({
      success: true,
      posts: privateMessagesCache[channelKey].slice(0, 10), // Return cached on error
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
        .replace(/&apos;|&#x27;/gi, "'")
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
