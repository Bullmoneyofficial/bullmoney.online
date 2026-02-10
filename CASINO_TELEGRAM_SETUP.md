# Casino Telegram Bot Integration

## Overview
The casino Telegram bot has been integrated into your Next.js application at `/api/casino/telegram/webhook`. This replaces the standalone Node.js telegram bot with a webhook-based Next.js API route.

## Features
- **Account Linking**: Users can link their Telegram account to their casino account
- **Channel Subscription Check**: Verifies users are subscribed to @BullMoney channel
- **Automatic Bonus**: Awards bonus coins when a Telegram account is successfully linked
- **Duplicate Prevention**: Prevents the same bonus from being claimed multiple times

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local` file:

```env
# Casino Telegram Bot Token
CASINO_TELEGRAM_BOT_TOKEN=6345622919:AAFsKKK-fKux-gkk

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Schema
Ensure your `casino_users` table has these columns:

```sql
ALTER TABLE casino_users ADD COLUMN IF NOT EXISTS unique_id VARCHAR(255);
ALTER TABLE casino_users ADD COLUMN IF NOT EXISTS tg_id TEXT;
ALTER TABLE casino_users ADD COLUMN IF NOT EXISTS tg_bonus_used BOOLEAN DEFAULT FALSE;
```

Ensure your `casino_settings` table exists:

```sql
CREATE TABLE IF NOT EXISTS casino_settings (
  id SERIAL PRIMARY KEY,
  telegram_bonus_amount INTEGER DEFAULT 500,
  bonus_amount INTEGER DEFAULT 100,
  bonus_time INTEGER DEFAULT 300,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO casino_settings (telegram_bonus_amount, bonus_amount, bonus_time)
VALUES (500, 100, 300);
```

### 3. Register the Webhook
After deploying to production (or running locally with ngrok), register the webhook:

```bash
# Visit this URL in your browser (replace with your domain)
https://yourdomain.com/api/casino/telegram/webhook?action=setup
```

Or use curl:
```bash
curl "https://yourdomain.com/api/casino/telegram/webhook?action=setup"
```

### 4. Test the Webhook
Check webhook info:
```bash
curl "https://yourdomain.com/api/casino/telegram/webhook?action=info"
```

### 5. Local Development with ngrok
For local testing:

```bash
# Start ngrok
ngrok http 3000

# Copy the https URL and setup webhook
curl "https://your-ngrok-url.ngrok.io/api/casino/telegram/webhook?action=setup"
```

## User Flow

### For Users:
1. User visits `/casino` page
2. User logs into their casino account
3. User sees their unique bind code (e.g., `/bind abc123xyz`)
4. User opens Telegram and messages the casino bot
5. User sends `/start` to the bot
6. User sends their unique bind code (e.g., `/bind abc123xyz`)
7. Bot checks:
   - User exists with that unique_id
   - Telegram account not already linked
   - User hasn't already claimed the bonus
   - User is subscribed to @BullMoney channel (optional check)
8. Bot links the account and awards bonus coins
9. User receives confirmation message

## Bot Commands

### `/start`
Shows welcome message and instructions

### `/bind <unique_id>`
Links Telegram account to casino account
- Example: `/bind abc123xyz`
- Awards bonus coins on first successful link
- Checks channel subscription

## API Endpoints

### POST `/api/casino/telegram/webhook`
Main webhook endpoint that receives Telegram updates

### GET `/api/casino/telegram/webhook?action=setup`
Registers the webhook with Telegram

### GET `/api/casino/telegram/webhook?action=info`
Gets current webhook information

### GET `/api/casino/telegram/webhook?action=delete`
Deletes the webhook

## Security Notes

1. **Token Security**: Keep your bot token in environment variables, never commit to git
2. **Unique ID Generation**: Ensure unique_id is cryptographically random
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **SQL Injection**: The code uses Supabase parameterized queries to prevent SQL injection
5. **Channel Verification**: Optional channel subscription check adds extra security layer

## Troubleshooting

### Webhook not receiving updates
- Check webhook info: `?action=info`
- Verify the webhook URL is publicly accessible (not localhost)
- Check Telegram bot token is correct
- Look at server logs for error messages

### Users can't link accounts
- Verify database schema is correct
- Check unique_id matches exactly
- Ensure tg_bonus_used is FALSE
- Verify Supabase credentials are correct

### Bonus not awarded
- Check casino_settings table has `telegram_bonus_amount` value
- Verify balance update succeeded
- Check database logs

## File Structure

```
app/
  api/
    casino/
      telegram/
        webhook/
          route.ts          # Main webhook handler
  casino/
    page.tsx               # Casino page (shows iframe)
    layout.tsx             # Casino layout
casino-backend/             # Legacy - can now be removed
  server/
    telegram.js            # Old Node.js bot (deprecated)
```

## Migration from Old Bot

The old `casino-backend/server/telegram.js` file used polling and MySQL. The new implementation:
- ✅ Uses webhooks (more efficient, instant updates)
- ✅ Uses Supabase (matches rest of application)
- ✅ Integrates with Next.js API routes
- ✅ No need for separate backend server
- ✅ Easier deployment and maintenance

You can safely remove the `casino-backend` folder after verifying the new system works.

## Next Steps

1. **Update Casino Page**: Add UI to show users their unique bind code
2. **Generate Unique IDs**: Implement unique_id generation on user registration
3. **Settings Dashboard**: Add admin panel to configure telegram_bonus_amount
4. **Analytics**: Track Telegram link conversions
5. **Multi-language**: Add support for other languages in bot messages

## Example Frontend Code

Add this to your casino page to show users their bind code:

```tsx
'use client';

import { useEffect, useState } from 'react';

export function TelegramBonusSection() {
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/casino/user')
      .then(res => res.json())
      .then(data => {
        if (data.user?.unique_id) {
          setUniqueId(data.user.unique_id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!uniqueId) return null;

  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-2">🎁 Get Free Bonus Coins!</h3>
      <p className="mb-4">Link your Telegram account to receive bonus coins:</p>
      <ol className="list-decimal list-inside space-y-2 mb-4">
        <li>Open Telegram and search for @BullMoneyCasinoBot</li>
        <li>Send <code className="bg-gray-200 px-2 py-1 rounded">/start</code></li>
        <li>Send this command:</li>
      </ol>
      <div className="bg-white p-4 rounded border-2 border-blue-500">
        <code className="text-lg font-mono">/bind {uniqueId}</code>
        <button
          onClick={() => navigator.clipboard.writeText(`/bind ${uniqueId}`)}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
```
