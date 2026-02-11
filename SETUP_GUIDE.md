# BullMoney Push Notification System - Setup Guide

Complete end-to-end setup guide for the push notification system that polls Telegram and sends real-time notifications to subscribers.

---

## 🎯 Overview

This system replaces the Python scripts with production-ready Next.js API routes:

- ✅ **Telegram Polling** → Automatically fetches new channel posts
- ✅ **Database Storage** → Saves messages to Supabase
- ✅ **Push Notifications** → Sends to all subscribed devices
- ✅ **Automated Cron** → Runs every 30 minutes via Vercel
- ✅ **Cross-Platform** → Works on Android, iOS, Desktop

---

## 📋 Prerequisites

Before you begin, you'll need:

1. **Supabase Account** - Database for storing subscriptions and messages
2. **Telegram Bot Token** - To poll channel posts
3. **VAPID Keys** - For web push notifications
4. **Vercel Account** (Pro plan for cron) - For automated polling

---

## 🔧 Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications.

```bash
# Install web-push CLI globally
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

**Output:**
```
=======================================
Public Key:
BFxHjK...your_public_key_here...wE8=

Private Key:
XyZ...your_private_key_here...abc
=======================================
```

Save both keys for the next step.

---

## 🗄️ Step 2: Set Up Supabase Database

### Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  channel_trades BOOLEAN DEFAULT true,
  channel_main BOOLEAN DEFAULT true,
  channel_shop BOOLEAN DEFAULT true,
  channel_vip BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VIP Messages Table (Telegram posts)
CREATE TABLE IF NOT EXISTS vip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id BIGINT UNIQUE NOT NULL,
  message TEXT,
  has_media BOOLEAN DEFAULT false,
  chat_id TEXT,
  chat_title TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_vip_messages_telegram_id ON vip_messages(telegram_message_id);
CREATE INDEX IF NOT EXISTS idx_vip_messages_notification_sent ON vip_messages(notification_sent);
CREATE INDEX IF NOT EXISTS idx_vip_messages_created_at ON vip_messages(created_at DESC);
```

### Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON push_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own subscriptions
CREATE POLICY "Users can insert their subscriptions" ON push_subscriptions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Enable RLS on vip_messages
ALTER TABLE vip_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON vip_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public to read messages (if needed)
CREATE POLICY "Public can read messages" ON vip_messages
  FOR SELECT
  TO authenticated, anon
  USING (true);
```

---

## 🤖 Step 3: Set Up Telegram Bot

### Create a Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow the instructions to create your bot
4. Save the **Bot Token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Add Bot to Your Channel

1. Go to your Telegram channel
2. Click **Channel Settings** → **Administrators** → **Add Administrator**
3. Search for your bot and add it
4. Give it permission to **Post Messages** (optional, but recommended for full admin access)

### Get Channel Username or ID

- **Public Channel**: Username is visible (e.g., `@bullmoneywebsite`)
- **Private Channel**: Use [@userinfobot](https://t.me/userinfobot) to get the numeric chat ID

Update the `CHANNEL_MAP` in `/app/api/push/poll/route.ts`:

```typescript
const CHANNEL_MAP: Record<string, { name: string; channel: string; priority: string }> = {
  'bullmoneywebsite': { name: 'FREE TRADES', channel: 'trades', priority: 'high' },
  'bullmoneyfx': { name: 'LIVESTREAMS', channel: 'main', priority: 'normal' },
  'bullmoneyshop': { name: 'BULLMONEY NEWS', channel: 'shop', priority: 'normal' },
  '-1003442830926': { name: 'VIP TRADES', channel: 'trades', priority: 'high' },
  // Add your channels here
};
```

---

## 🔐 Step 4: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# VAPID Keys (from Step 1)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BFxHjK...your_public_key...wE8=
VAPID_PRIVATE_KEY=XyZ...your_private_key...abc
VAPID_SUBJECT=mailto:admin@bullmoney.com

# Telegram Bot (from Step 3)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Set Environment Variables in Production

**Vercel:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable from above
3. Make sure they apply to **Production**, **Preview**, and **Development**

**Render:**
1. Go to your service → **Environment**
2. Add each variable as a key-value pair

---

## 🚀 Step 5: Deploy to Production

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

The `vercel.json` is already configured to run `/api/push/poll` every 30 minutes.

**Note:** Vercel Cron requires a Pro plan ($20/month). For Hobby plan, see Option B.

### Option B: External Cron Service (Free Alternative)

If you don't have Vercel Pro, use an external cron service:

1. **cron-job.org** (Free, reliable)
   - Sign up at https://cron-job.org
   - Create a new cron job:
     - URL: `https://yourdomain.com/api/push/poll`
     - Method: POST
     - Schedule: Every 30 minutes
     - Title: "BullMoney Push Polling"

2. **EasyCron** (Free tier: 1 cron job)
   - Sign up at https://www.easycron.com
   - Add cron job with URL above

3. **GitHub Actions** (Free for public repos)
   - Create `.github/workflows/poll-notifications.yml`:

```yaml
name: Poll Notifications
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger polling endpoint
        run: |
          curl -X POST https://yourdomain.com/api/push/poll
```

---

## ✅ Step 6: Test the System

### 1. Test Status

```bash
curl https://yourdomain.com/api/push/status
```

**Expected Response:**
```json
{
  "config": {
    "vapid_public_key": true,
    "vapid_private_key": true,
    "supabase_url": true,
    "supabase_key": true,
    "telegram_bot_token": true
  },
  "all_configured": true,
  "database": {
    "active_subscribers": 0,
    "messages_last_hour": 0,
    "unnotified_messages": 0
  },
  "telegram": {
    "bot_username": "yourbotname",
    "bot_name": "Your Bot",
    "connected": true
  }
}
```

### 2. Subscribe to Notifications

1. Visit your website
2. Look for the notification bell icon (🔔)
3. Click "Enable Notifications"
4. Allow browser notifications when prompted

### 3. Send Test Notification

```bash
curl -X POST https://yourdomain.com/api/push/test
```

You should receive a test notification on your device!

### 4. Post to Telegram

1. Post a message to your Telegram channel
2. Wait up to 30 minutes (or manually trigger polling)
3. All subscribers should receive a push notification

### 5. Manual Polling (Instant)

```bash
curl -X POST https://yourdomain.com/api/push/poll
```

This fetches new messages immediately without waiting for the cron.

---

## 🔍 Monitoring & Troubleshooting

### Check Telegram Connection

```bash
curl https://yourdomain.com/api/telegram/check
```

### Check Database

```bash
curl https://yourdomain.com/api/database/check
```

### Clean Up Dead Subscriptions

```bash
curl -X POST https://yourdomain.com/api/push/cleanup
```

### View Logs

**Vercel:**
- Dashboard → Your Project → Logs
- Filter by `/api/push/poll` to see polling activity

**Render:**
- Dashboard → Your Service → Logs

### Common Issues

#### No notifications received?

1. Check status: `curl https://yourdomain.com/api/push/status`
2. Verify all config values are `true`
3. Check browser console for errors
4. Try unsubscribe → re-subscribe

#### Telegram not working?

1. Verify bot is added as admin to channel
2. Check bot token: `curl https://yourdomain.com/api/telegram/check`
3. Post a test message to the channel
4. Manually trigger: `curl -X POST https://yourdomain.com/api/push/poll`

#### Subscriptions expiring?

- Run cleanup to remove dead subscriptions
- Users will auto-resubscribe on next page visit

#### Database errors?

- Verify tables exist in Supabase
- Check service role key has permissions
- Enable RLS properly

---

## 📊 System Architecture

```
┌─────────────────┐
│  Telegram Bot   │  ← Posts from your channels
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  /api/push/poll (Cron)      │  ← Runs every 30 minutes
│  1. Poll Telegram           │
│  2. Save new messages       │
│  3. Get subscribers         │
│  4. Send push notifications │
└──────────┬──────────────────┘
           │
           ↓
┌──────────────────┐     ┌─────────────────┐
│   Supabase DB    │     │  Web Push APIs  │
│  - vip_messages  │     │  - FCM (Chrome) │
│  - subscriptions │     │  - APNs (Safari)│
└──────────────────┘     └─────────────────┘
                                  │
                                  ↓
                         ┌────────────────┐
                         │  User Devices  │
                         │  - Android     │
                         │  - iOS (PWA)   │
                         │  - Desktop     │
                         └────────────────┘
```

---

## 🎉 You're All Set!

Your push notification system is now fully operational!

### What happens now:

1. **Every 30 minutes**, Vercel Cron triggers `/api/push/poll`
2. **New Telegram posts** are fetched and saved to database
3. **Push notifications** are sent to all subscribed devices
4. **Users receive** real-time alerts on their lock screen

### Next Steps:

- Customize notification messages in `/app/api/push/poll/route.ts`
- Add more channels to `CHANNEL_MAP`
- Set up analytics to track notification engagement
- Consider adding user preference settings (topics, frequency)

---

## 📚 Additional Resources

- [API Routes Documentation](./API_ROUTES.md)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🆘 Need Help?

If you run into issues:

1. Check the logs (Vercel/Render dashboard)
2. Test each endpoint individually using curl
3. Verify environment variables are set correctly
4. Make sure database tables exist
5. Confirm Telegram bot has channel access

For urgent issues, check:
- Status: `/api/push/status`
- Telegram: `/api/telegram/check`
- Database: `/api/database/check`
