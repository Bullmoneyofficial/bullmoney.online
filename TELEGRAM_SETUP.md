# Telegram Integration Setup Guide

This guide explains how to set up the Telegram integration on your BullMoney website to display live messages from your Telegram channel.

## Prerequisites

1. A Telegram Bot (created via BotFather)
2. Your Telegram Channel ID or Channel Username
3. A Telegram Bot Token

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/start` to begin
3. Send `/newbot` and follow the instructions
4. Choose a name for your bot (e.g., "BullMoney Bot")
5. Choose a username for your bot (must end with "bot")
6. BotFather will give you a **token** - save this!

Example token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

## Step 2: Get Your Channel Information

### Option A: Using Channel ID
1. Add your bot as an administrator to your channel
2. Forward any message from the channel to @userinfobot
3. Copy the channel ID (starts with `-100`)

### Option B: Using Channel Username
If your channel is public (e.g., @bullmoneyfx), you can use the username directly.

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=your_channel_id_here
TELEGRAM_CHANNEL_USERNAME=bullmoneyfx
```

Example:
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_CHANNEL_USERNAME=bullmoneyfx
```

## Step 4: Set Up Bot Permissions

1. Go to your Telegram channel
2. Add the bot as an Administrator
3. Give it the following permissions:
   - Read messages
   - Read channel posts
   - (Optional) Post messages (if you want the bot to send messages)

## Step 5: Deploy

1. Push your changes to your repository
2. Redeploy your application
3. The environment variables will be loaded automatically

## Usage

### Display Feed in a Page

```tsx
import { TelegramFeed } from '@/components/TelegramFeed';

export default function CommunityPage() {
  return (
    <div>
      <TelegramFeed 
        limit={20}
        refreshInterval={300000}
        showHeader={true}
        compact={false}
      />
    </div>
  );
}
```

### Display Feed in a Modal

```tsx
import { TelegramModal } from '@/components/TelegramModal';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        View Telegram Feed
      </button>
      <TelegramModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

### Access the API Directly

```typescript
const response = await fetch('/api/telegram/messages?limit=20');
const data = await response.json();

// data.messages contains the Telegram messages
```

## Component Props

### TelegramFeed Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | number | 10 | Number of messages to display |
| `refreshInterval` | number | 300000 | Refresh interval in milliseconds (5 mins default) |
| `showHeader` | boolean | true | Show the header with channel info |
| `compact` | boolean | false | Use compact layout with line clamping |

### TelegramModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Whether the modal is open |
| `onClose` | function | Yes | Callback when modal should close |

## Troubleshooting

### "Telegram credentials not configured"
- Check that `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID` are set in `.env.local`
- Restart your dev server after updating `.env.local`

### No messages appear
- Verify the bot is an administrator in the channel
- Check that messages exist in the channel
- Ensure the channel ID is correct (should start with `-100` for private channels)

### Messages aren't updating
- Check the `refreshInterval` prop
- Verify the API endpoint is working: visit `/api/telegram/messages` in your browser
- Check browser console for errors

### "Bot doesn't have access"
- Re-add the bot to the channel as an administrator
- Check bot permissions in channel settings
- Ensure the channel is correct

## API Rate Limiting

The Telegram Bot API has rate limits:
- 30 messages per second per chat
- Responses are cached for 5 minutes to reduce API calls

## Security Notes

1. **Never commit your bot token** - use environment variables
2. **Keep your channel ID private** - it can be used to identify channels
3. **Use public channels** if possible - they don't require special permissions
4. The bot only has read access by default

## Testing in Development

Add test messages to your Telegram channel and verify they appear:

```bash
# Check if messages are fetched correctly
curl "http://localhost:3000/api/telegram/messages"
```

## Next Steps

1. ✅ Set up bot and environment variables
2. ✅ Add the TelegramFeed component to your community page
3. ✅ Test with a message in your Telegram channel
4. ✅ Customize styling if needed
5. ✅ Deploy to production

## Features

- ✅ Real-time message display
- ✅ Auto-refresh capability
- ✅ Media type detection (photos, videos, documents)
- ✅ Author information
- ✅ Relative timestamps (e.g., "2 hours ago")
- ✅ Like/heart messages feature
- ✅ Responsive design
- ✅ Dark mode optimized
- ✅ Smooth animations
- ✅ Error handling and fallbacks

## Support

For issues with Telegram Bot API, visit: https://core.telegram.org/bots/api
For questions about setup, check the Telegram documentation: https://core.telegram.org/bots
