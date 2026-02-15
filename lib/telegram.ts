// Alternative Telegram API utility for fetching channel messages
// This uses a more reliable method for retrieving channel messages

export interface TelegramMessage {
  id: string;
  timestamp: number;
  text: string;
  author: string;
  authorUsername?: string;
  chatId?: string;
  chatUsername?: string;
  chatTitle?: string;
  hasMedia: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio';
  mediaUrl?: string;
  formattedTime: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || 'bullmoneyfx';

const MESSAGE_CACHE_DURATION_MS = 15000;
const WEBHOOK_CACHE_DURATION_MS = 10000;
const TELEGRAM_FETCH_TIMEOUT_MS = 5000;

let messageCache: TelegramMessage[] = [];
let messageCacheAt = 0;
let fetchInFlight: Promise<TelegramMessage[]> | null = null;
let webhookStatusCache: { active: boolean; url: string | null; fetchedAt: number } | null = null;

const filterMessagesByTarget = (messages: TelegramMessage[], targetChat?: string) => {
  const normalizedTarget = String(targetChat || '').trim().toLowerCase().replace(/^@/, '');
  if (!normalizedTarget) return messages;
  return messages.filter(message => {
    const chatId = String(message.chatId || '').toLowerCase().replace(/^@/, '');
    const chatUsername = String(message.chatUsername || '').toLowerCase().replace(/^@/, '');
    return chatId === normalizedTarget || chatUsername === normalizedTarget;
  });
};

async function getWebhookStatus(): Promise<{ active: boolean; url: string | null }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { active: false, url: null };
  }

  const now = Date.now();
  if (webhookStatusCache && now - webhookStatusCache.fetchedAt < WEBHOOK_CACHE_DURATION_MS) {
    return { active: webhookStatusCache.active, url: webhookStatusCache.url };
  }

  try {
    const webhookInfo = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS),
      }
    );
    const webhookData = await webhookInfo.json();
    const url = webhookData?.result?.url;
    const status = { active: !!url, url: url ?? null };
    webhookStatusCache = { ...status, fetchedAt: now };
    return status;
  } catch (error) {
    console.warn('Telegram webhook status check failed:', error);
    return { active: false, url: null };
  }
}

/**
 * Fetches messages from a Telegram channel using the Bot API
 * Requires bot to be an administrator in the channel
 */
export async function fetchTelegramMessages(limit: number = 20, targetChat?: string): Promise<TelegramMessage[]> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return [];
  }

  const now = Date.now();
  if (messageCache.length > 0 && now - messageCacheAt < MESSAGE_CACHE_DURATION_MS) {
    return filterMessagesByTarget(messageCache, targetChat).slice(0, limit);
  }

  if (fetchInFlight) {
    const messages = await fetchInFlight;
    return filterMessagesByTarget(messages, targetChat).slice(0, limit);
  }

  try {
    const webhookStatus = await getWebhookStatus();
    if (webhookStatus.active) {
      console.warn('Telegram webhook is active, skipping getUpdates:', webhookStatus.url);
      return filterMessagesByTarget(messageCache, targetChat).slice(0, limit);
    }

    fetchInFlight = (async () => {
      const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: Math.min(limit, 100),
          allowed_updates: ['channel_post'],
          timeout: 10,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS),
      }
    );

      if (!response.ok) {
        if (response.status === 409) {
          console.warn('Telegram API conflict (getUpdates already in progress).');
          return messageCache;
        }
        console.error('Telegram API error:', response.status, response.statusText);
        return messageCache;
      }

      const data = await response.json();

      if (!data.ok) {
        console.error('Telegram API error:', data.description);
        return messageCache;
      }

      const messages: TelegramMessage[] = [];

      data.result?.forEach((update: any) => {
        const msg = update.channel_post;
        if (!msg) return;

        const text = msg.text || msg.caption || '(Media message)';
        const timestamp = msg.date * 1000;
        const date = new Date(timestamp);
        const formattedTime = formatMessageTime(date);

        messages.push({
          id: `${msg.message_id}`,
          timestamp,
          text: cleanText(text),
          author: msg.from?.first_name || msg.author_signature || 'BullMoney',
          authorUsername: msg.from?.username,
          chatId: msg.chat?.id ? String(msg.chat.id) : undefined,
          chatUsername: msg.chat?.username ? String(msg.chat.username) : undefined,
          chatTitle: msg.chat?.title ? String(msg.chat.title) : undefined,
          hasMedia: !!(msg.photo || msg.video || msg.document || msg.audio || msg.animation),
          mediaType: msg.photo ? 'photo' : msg.video ? 'video' : msg.document ? 'document' : msg.audio ? 'audio' : undefined,
          formattedTime,
        });
      });

      const sorted = messages.sort((a, b) => b.timestamp - a.timestamp);
      messageCache = sorted;
      messageCacheAt = Date.now();
      return sorted;
    })();

    const messages = await fetchInFlight;
    return filterMessagesByTarget(messages, targetChat).slice(0, limit);
  } catch (error) {
    console.error('Error fetching Telegram messages:', error);
    return filterMessagesByTarget(messageCache, targetChat).slice(0, limit);
  } finally {
    fetchInFlight = null;
  }
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Clean and format message text
 */
function cleanText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1') // Convert markdown links
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/__([^_]+)__/g, '$1') // Remove bold underscore
    .substring(0, 500); // Limit length
}

/**
 * Validate and format Telegram API credentials
 */
export function validateTelegramConfig(): {
  isValid: boolean;
  error?: string;
} {
  if (!TELEGRAM_BOT_TOKEN) {
    return { isValid: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  if (!TELEGRAM_CHANNEL_ID && !TELEGRAM_CHANNEL_USERNAME) {
    return { isValid: false, error: 'TELEGRAM_CHANNEL_ID or TELEGRAM_CHANNEL_USERNAME not configured' };
  }

  return { isValid: true };
}
