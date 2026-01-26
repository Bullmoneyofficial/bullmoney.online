# Push Notifications Setup Guide 🔔

This guide will help you set up push notifications for BullMoney so you can send trade alerts to all users' devices.

## How It Works

1. **Users visit your site** → Modal asks if they want notifications
2. **User clicks "Yes"** → Browser asks for permission → Subscription saved to database
3. **You post a trade on Telegram** → Webhook triggers → Push notification sent to ALL subscribers
4. **Users receive notification** → Even if browser is closed, phone locked, etc.

## Step 1: Generate VAPID Keys

VAPID keys are required for push notifications. Run this command:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BNxxx...
Private Key: yyy...
```

## Step 2: Add Environment Variables

Add these to your `.env.local` file:

```env
# Push Notifications (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxxx...your_public_key...
VAPID_PRIVATE_KEY=yyy...your_private_key...
VAPID_SUBJECT=mailto:admin@bullmoney.com

# Optional: Admin secret for sending notifications manually
NOTIFICATION_ADMIN_SECRET=your_secret_here
```

## Step 3: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- See PUSH_NOTIFICATIONS_TABLE.sql for full script
```

Or simply run the contents of `PUSH_NOTIFICATIONS_TABLE.sql` in your Supabase dashboard.

## Step 4: Create Notification Icons

Create these icons in `/public/icons/`:

1. `icon-192x192.png` - Main notification icon (192x192px)
2. `badge-72x72.png` - Small badge icon (72x72px)

You can use your BullMoney logo for these.

## Step 5: Test the System

### Test 1: Notification Permission Modal
1. Clear localStorage: `localStorage.clear()` in browser console
2. Refresh the page
3. You should see the "Never Miss a Trade!" modal after 2 seconds
4. Click "Yes, Enable Notifications"
5. Browser should ask for permission
6. Check Supabase → `push_subscriptions` table for your subscription

### Test 2: Manual Notification
1. Go to `/admin/notifications` (your admin panel)
2. Send a test notification
3. You should receive it on your device!

### Test 3: Telegram Integration
1. Make sure your Telegram webhook is set up (`/api/telegram/webhook?action=setup`)
2. Post a message in your Telegram channel
3. All subscribers should receive the notification

## How to Send Notifications

### Option 1: Automatic (Recommended)
When you post a trade in your Telegram channels, the webhook automatically:
1. Saves the message to database
2. Sends push notification to ALL subscribers

### Option 2: Manual (Admin Panel)
Go to `/admin/notifications` to:
- See subscriber count
- Send custom notifications
- View notification history

### Option 3: API Call
```bash
curl -X POST https://yoursite.com/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "title": "🚀 New Trade Alert!",
    "body": "XAUUSD Buy @ 2650 | TP: 2680 | SL: 2640",
    "channel": "trades"
  }'
```

## Notification Channels

| Channel | Description | Emoji |
|---------|-------------|-------|
| `trades` | Free Trades | 📈 |
| `main` | Livestreams | 🔴 |
| `shop` | News | 📰 |
| `vip` | VIP Trades | 👑 |

## Browser Support

Push notifications work on:
- ✅ Chrome (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Safari (Desktop - macOS 13+)
- ✅ Safari (iOS 16.4+ - requires PWA)
- ⚠️ In-app browsers (limited support)

## Troubleshooting

### Notifications not showing?

1. **Check browser permissions**: Settings → Notifications → Allow for your site
2. **Check VAPID keys**: Make sure both public and private keys are set
3. **Check subscription**: Look in Supabase `push_subscriptions` table
4. **Check service worker**: DevTools → Application → Service Workers

### Modal not showing?

1. Clear localStorage: `localStorage.removeItem('bullmoney_notification_asked')`
2. Refresh the page

### Webhook not working?

1. Check webhook status: `/api/telegram/webhook?action=info`
2. Re-register webhook: `/api/telegram/webhook?action=setup`
3. Make sure bot is admin in your Telegram channel

## Production Checklist

- [ ] VAPID keys generated and added to environment
- [ ] Database tables created in Supabase
- [ ] Notification icons uploaded to `/public/icons/`
- [ ] Service worker updated and deployed
- [ ] Telegram webhook registered for production domain
- [ ] Test notification received on multiple devices

## API Reference

### Subscribe
`POST /api/notifications/subscribe`
```json
{
  "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
  "userAgent": "...",
  "timestamp": 1234567890
}
```

### Unsubscribe
`POST /api/notifications/unsubscribe`
```json
{
  "endpoint": "https://..."
}
```

### Send Notification
`POST /api/notifications/send`
```json
{
  "title": "🚀 Trade Alert",
  "body": "XAUUSD Buy @ 2650",
  "channel": "trades",
  "image": "https://..." // optional
}
```

### Get Stats
`GET /api/notifications/subscribe`
Returns: `{ "total_subscribers": 1234 }`

### Get History
`GET /api/notifications/send`
Returns: `{ "history": [...] }`
