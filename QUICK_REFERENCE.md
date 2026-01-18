# Telegram Integration - Quick Reference

## 📁 File Structure

```
newbullmoney/
├── app/
│   ├── api/
│   │   └── telegram/
│   │       └── messages/
│   │           └── route.ts          ← API endpoint
│   └── community/
│       └── page.tsx                  ← Community page with feed
├── components/
│   ├── TelegramFeed.tsx              ← Full feed component
│   ├── TelegramModal.tsx             ← Modal wrapper
│   └── TelegramPreview.tsx           ← Preview component
├── lib/
│   └── telegram.ts                   ← Utility functions
├── scripts/
│   └── setup-telegram.sh             ← Setup helper script
├── TELEGRAM_SETUP.md                 ← Detailed setup guide
├── TESTING_GUIDE.md                  ← Testing instructions
├── TELEGRAM_INTEGRATION_SUMMARY.md   ← Implementation summary
└── .env.local                        ← Your environment variables
```

## 🔧 Environment Variables

Add to `.env.local`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_CHANNEL_USERNAME=bullmoneyfx
```

## 🌐 API Endpoints

### Fetch Messages
```
GET /api/telegram/messages?limit=20
```

**Query Parameters:**
- `limit` (optional): Number of messages to fetch (1-100, default: 20)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "12345",
      "timestamp": 1705600000000,
      "text": "Message content...",
      "author": "BullMoney",
      "authorUsername": "bullmoney.online",
      "hasMedia": false,
      "mediaType": null,
      "formattedTime": "2h ago"
    }
  ],
  "count": 20,
  "lastUpdated": "2024-01-18T12:34:56.000Z"
}
```

## 📦 React Components

### TelegramFeed
```tsx
import { TelegramFeed } from '@/components/TelegramFeed';

<TelegramFeed
  limit={20}                    // Messages to display
  refreshInterval={300000}      // Auto-refresh in ms
  showHeader={true}             // Show title
  compact={false}               // Compact mode
/>
```

### TelegramModal
```tsx
import { TelegramModal } from '@/components/TelegramModal';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<TelegramModal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

### TelegramPreview
```tsx
import { TelegramPreview } from '@/components/TelegramPreview';

<TelegramPreview
  limit={3}
  onViewMore={() => window.location.href = '/community'}
/>
```

## 🎯 Common Use Cases

### 1. Add to Community Page
Already implemented in `app/community/page.tsx`
```tsx
<TelegramFeed limit={15} />
```

### 2. Add to Dashboard
```tsx
import { TelegramPreview } from '@/components/TelegramPreview';

export function Dashboard() {
  return (
    <div>
      <h2>Latest from Telegram</h2>
      <TelegramPreview limit={3} />
    </div>
  );
}
```

### 3. Add Modal to Button
```tsx
import { TelegramModal } from '@/components/TelegramModal';
import { useState } from 'react';

export function Button() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>
        View Feed
      </button>
      <TelegramModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

### 4. Add to Community Quick Access
In `components/CommunityQuickAccess.tsx`, add a button to open the modal:
```tsx
const [feedOpen, setFeedOpen] = useState(false);

<button onClick={() => setFeedOpen(true)}>
  View Live Feed
</button>
<TelegramModal isOpen={feedOpen} onClose={() => setFeedOpen(false)} />
```

## 🎨 Customization

### Change Colors
```tsx
// In TelegramFeed.tsx, modify className:
// from-blue-600 to-cyan-600 → from-purple-600 to-pink-600
```

### Change Refresh Rate
```tsx
// Every 1 minute instead of 5
<TelegramFeed refreshInterval={60000} />

// Every 30 seconds (for testing)
<TelegramFeed refreshInterval={30000} />
```

### Change Message Limit
```tsx
// Show 50 latest messages
<TelegramFeed limit={50} />

// Show only 5 (compact)
<TelegramFeed limit={5} compact={true} />
```

### Disable Header
```tsx
<TelegramFeed showHeader={false} />
```

## 🚀 Quick Start (Copy-Paste)

### 1. Create Bot
Open Telegram → Search @BotFather → `/newbot` → Save token

### 2. Add Environment Variables
```env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=your_channel_id
TELEGRAM_CHANNEL_USERNAME=your_channel_name
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test
Visit: `http://localhost:3000/community`

## 📊 Data Flow

```
Telegram Channel
      ↓
Telegram Bot API
      ↓
/api/telegram/messages (Your Backend)
      ↓
React Components
      ↓
Website Display
```

## ⚡ Performance

- **API Cache:** 5 minutes (reduces Telegram API calls)
- **Component Rendering:** Optimized with framer-motion
- **Bundle Size:** ~19KB (gzipped ~5KB)
- **Mobile Performance:** Automatic motion reduction on small screens

## 🔐 Security

- ✅ Bot token in environment variables only
- ✅ Read-only permissions
- ✅ No sensitive data exposed
- ✅ Rate limiting handled
- ✅ Error messages don't leak details in production

## 🐛 Quick Debugging

### Check API Works
```bash
curl http://localhost:3000/api/telegram/messages
```

### Check Environment Variables
```bash
grep TELEGRAM .env.local
```

### Check Bot is Admin
- Open Telegram channel
- Click channel name
- Check Members list
- Find your bot
- Verify it's Admin

### Clear Cache and Refresh
```bash
# Hard refresh in browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

## 📝 Logging

To debug, add console logs:

```tsx
// In components
console.log('Messages loaded:', messages);
console.log('Error:', error);

// In API route
console.error('Telegram API error:', error);
```

Check browser DevTools (F12) → Console tab

## 🎓 Learning Resources

- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Getting Channel ID:** Use @userinfobot
- **Create Bot:** @BotFather on Telegram
- **framer-motion Docs:** https://www.framer.com/motion/

## ✅ Checklist

Setup:
- [ ] Created bot via BotFather
- [ ] Added bot to channel as admin
- [ ] Set environment variables
- [ ] Restarted dev server

Testing:
- [ ] API endpoint returns data
- [ ] Community page displays feed
- [ ] Sent test message
- [ ] Message appears within 5 minutes

Deployment:
- [ ] Set environment variables on hosting
- [ ] Tested on production domain
- [ ] Verified on mobile devices
- [ ] Enabled error monitoring

## 🆘 Need Help?

1. Check `TELEGRAM_SETUP.md` for detailed instructions
2. Check `TESTING_GUIDE.md` for testing scenarios
3. See browser console for JavaScript errors
4. Verify `/api/telegram/messages` endpoint manually
5. Check that bot is admin in channel

---

**Last Updated:** January 18, 2026
**Status:** ✅ Ready to Use
