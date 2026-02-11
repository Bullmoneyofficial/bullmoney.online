# BullMoney API Routes

This document describes the Next.js API routes that replace the Python scripts for production deployment.

## Overview

The following Python scripts have been converted to TypeScript API routes that work in production:

- `scripts/push_sender.py` → Multiple `/api/push/*` endpoints
- `scripts/telegram_check.py` → `/api/telegram/check`
- `scripts/db_check.py` → `/api/database/check`

## Push Notification API Routes

### 1. POST `/api/push/poll`

**Purpose:** Poll Telegram for new messages and send push notifications

**Equivalent to:** `python scripts/push_sender.py --once`

**Usage:**
```bash
curl -X POST https://yourdomain.com/api/push/poll
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "telegram_messages": 2,
    "new_messages": 2,
    "subscribers": 5,
    "sent": 5,
    "failed": 0
  }
}
```

**Automation:**
- Can be called via Vercel Cron Jobs
- Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/push/poll",
    "schedule": "*/30 * * * *"
  }]
}
```

---

### 2. POST `/api/push/test`

**Purpose:** Send a test push notification to all active subscribers

**Equivalent to:** `python scripts/push_sender.py --test`

**Usage:**
```bash
curl -X POST https://yourdomain.com/api/push/test
```

**Response:**
```json
{
  "success": true,
  "sent": 3,
  "failed": 0,
  "message": "Test notifications sent! Check your device."
}
```

---

### 3. GET `/api/push/status`

**Purpose:** Check the health of the notification system

**Equivalent to:** `python scripts/push_sender.py --status`

**Usage:**
```bash
curl https://yourdomain.com/api/push/status
```

**Response:**
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
    "active_subscribers": 5,
    "messages_last_hour": 2,
    "unnotified_messages": 0
  },
  "telegram": {
    "bot_username": "yourbotname",
    "bot_name": "Your Bot",
    "connected": true
  }
}
```

---

### 4. POST `/api/push/cleanup`

**Purpose:** Test all subscriptions and remove dead/expired ones

**Equivalent to:** `python scripts/push_sender.py --cleanup`

**Usage:**
```bash
curl -X POST https://yourdomain.com/api/push/cleanup
```

**Response:**
```json
{
  "success": true,
  "alive": 5,
  "dead": 2,
  "total": 7,
  "results": [
    { "endpoint": "...fcm.googleapis.com", "status": "alive", "user_agent": "Chrome/Mac" },
    { "endpoint": "...push.services.mozilla.com", "status": "dead", "user_agent": "Firefox/Windows" }
  ]
}
```

---

### 5. POST `/api/push/send`

**Purpose:** Send a custom push notification to all subscribers

**Equivalent to:** `python scripts/push_sender.py --send "TITLE" "BODY"`

**Usage:**
```bash
curl -X POST https://yourdomain.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🚀 BTC Long Entry",
    "body": "Entry: 95000, TP: 100000",
    "channel": "trades",
    "url": "/?trade=123"
  }'
```

**Request Body:**
```typescript
{
  title: string;       // Required
  body: string;        // Required
  channel?: string;    // Optional, default: "trades"
  url?: string;        // Optional, default: "/"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 5,
  "failed": 0,
  "subscribers": 5
}
```

---

## Telegram Diagnostic API

### GET `/api/telegram/check`

**Purpose:** Check Telegram bot status and recent updates

**Equivalent to:** `python scripts/telegram_check.py`

**Usage:**
```bash
curl https://yourdomain.com/api/telegram/check
```

**Response:**
```json
{
  "success": true,
  "bot": {
    "username": "yourbotname",
    "name": "Your Bot",
    "id": 123456789,
    "can_join_groups": true,
    "can_read_all_group_messages": false
  },
  "webhook": {
    "url": "(none)",
    "pending_update_count": 0,
    "last_error_message": "(none)"
  },
  "updates_count": 5,
  "updates": [
    {
      "update_id": 123456,
      "chat_username": "bullmoneywebsite",
      "chat_title": "BullMoney Channel",
      "text": "🚀 New trade signal..."
    }
  ]
}
```

---

## Database Diagnostic API

### GET `/api/database/check`

**Purpose:** List all push subscriptions

**Equivalent to:** `python scripts/db_check.py` (without deletion)

**Usage:**
```bash
curl https://yourdomain.com/api/database/check
```

**Response:**
```json
{
  "success": true,
  "total": 7,
  "active": 5,
  "inactive": 2,
  "subscriptions": [
    {
      "endpoint_short": "...fcm.googleapis.com/abc123",
      "is_active": true,
      "channel_trades": true,
      "user_agent": "Chrome/Mac",
      "created_at": "2024-01-15T10:30"
    }
  ]
}
```

---

### POST `/api/database/check`

**Purpose:** Delete all inactive push subscriptions

**Equivalent to:** `python scripts/db_check.py` (deletion part)

**Usage:**
```bash
curl -X POST https://yourdomain.com/api/database/check
```

**Response:**
```json
{
  "success": true,
  "deleted": 2,
  "remaining": 5,
  "message": "Deleted 2 inactive subscriptions, 5 remaining"
}
```

---

## Environment Variables Required

Make sure these are set in your production environment (Vercel/Render):

```bash
# VAPID Keys (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@bullmoney.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
```

---

## Migration from Python Scripts

### Before (Python - Local Only):
```bash
# Running locally with Python
python scripts/push_sender.py              # Daemon mode
python scripts/push_sender.py --test       # Test
python scripts/push_sender.py --status     # Status check
```

### After (Next.js API Routes - Production Ready):
```bash
# Can be called from anywhere
curl -X POST https://bullmoney.com/api/push/poll
curl -X POST https://bullmoney.com/api/push/test
curl https://bullmoney.com/api/push/status
```

---

## Vercel Cron Jobs Setup

To automate the polling (replaces the Python daemon), create a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/push/poll",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This will call `/api/push/poll` every 30 minutes automatically.

**Note:** Vercel Cron Jobs are only available on Pro plans and above. For Hobby plans, consider:
- Using an external cron service (cron-job.org, EasyCron)
- Using GitHub Actions to call the endpoint on a schedule
- Using Vercel's built-in scheduling (if available in your plan)

---

## Testing Locally

```bash
# Start your Next.js dev server
npm run dev

# Test the endpoints
curl -X POST http://localhost:3000/api/push/test
curl http://localhost:3000/api/push/status
curl http://localhost:3000/api/telegram/check
curl http://localhost:3000/api/database/check
```

---

## Benefits of API Routes vs Python Scripts

✅ **Production Ready:** Works on Vercel/Render without Python runtime
✅ **Serverless:** Scales automatically, no daemon management
✅ **TypeScript:** Type-safe, better IDE support
✅ **HTTP API:** Can be called from anywhere (cron, webhooks, admin panel)
✅ **Same Codebase:** All in one Next.js project
✅ **Better Monitoring:** Vercel logs, error tracking built-in
✅ **Secure:** Environment variables managed by platform

---

## Troubleshooting

### No notifications sent?
1. Check status: `curl https://yourdomain.com/api/push/status`
2. Verify environment variables are set in production
3. Test with: `curl -X POST https://yourdomain.com/api/push/test`

### Subscriptions expired?
Run cleanup: `curl -X POST https://yourdomain.com/api/push/cleanup`

### Telegram not working?
Check Telegram status: `curl https://yourdomain.com/api/telegram/check`

### Database issues?
Check subscriptions: `curl https://yourdomain.com/api/database/check`
