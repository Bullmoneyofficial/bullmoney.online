// Alternative Telegram API utility for fetching channel messages
// This uses a more reliable method for retrieving channel messages

export interface TelegramMessage {
  id: string;
  timestamp: number;
  text: string;
  author: string;
  authorUsername?: string;
  hasMedia: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio';
  mediaUrl?: string;
  formattedTime: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || 'bullmoneyfx';

/**
 * Fetches messages from a Telegram channel using the Bot API
 * Requires bot to be an administrator in the channel
 */
export async function fetchTelegramMessages(limit: number = 20, targetChat?: string): Promise<TelegramMessage[]> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return [];
  }

  try {
    // Method 1: Using channel ID (requires bot to be admin)
    const chatId = TELEGRAM_CHANNEL_ID || `-100${Math.abs(parseInt(TELEGRAM_CHANNEL_ID || '0'))}`;
    
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
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return [];
    }

    const messages: TelegramMessage[] = [];

    const normalizedTarget = String(targetChat || '').trim().toLowerCase();

    data.result?.forEach((update: any) => {
      const msg = update.channel_post;
      if (!msg) return;

      if (normalizedTarget) {
        const chatId = String(msg.chat?.id ?? '').toLowerCase();
        const chatUsername = String(msg.chat?.username ?? '').toLowerCase().replace(/^@/, '');
        const expected = normalizedTarget.replace(/^@/, '');
        const matchesTarget = chatId === normalizedTarget || chatId === expected || chatUsername === expected;
        if (!matchesTarget) return;
      }

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
        hasMedia: !!(msg.photo || msg.video || msg.document || msg.audio || msg.animation),
        mediaType: msg.photo ? 'photo' : msg.video ? 'video' : msg.document ? 'document' : msg.audio ? 'audio' : undefined,
        formattedTime,
      });
    });

    return messages.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.error('Error fetching Telegram messages:', error);
    return [];
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
