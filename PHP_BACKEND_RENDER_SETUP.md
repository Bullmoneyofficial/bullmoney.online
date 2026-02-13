# 🚀 Quick Start - PHP Backend Configuration

## Current Configuration

Your PHP backend is now configured to use **Render** for production:

```
✅ Production: https://bullmoney-casino.onrender.com
✅ CORS: Configured for bullmoney.online
✅ Games: Dice, Mines, Plinko connected
```

## What Was Changed

### 1. `.env.local` - Updated Backend URL
```bash
# Now points to Render instead of localhost
NEXT_PUBLIC_PHP_BACKEND_URL=https://bullmoney-casino.onrender.com
CASINO_BACKEND_URL=https://bullmoney-casino.onrender.com
```

### 2. `lib/php-backend-api.ts` - Updated Fallback
```typescript
// Fallback changed from localhost to Render
return process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'https://bullmoney-casino.onrender.com';
```

### 3. `.env.development` - Created for Local Dev
```bash
# Use this file when developing locally
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000
```

## How to Use

### Option 1: Production (Render Backend) 🚀 DEFAULT
Your frontend talks to Render PHP backend - **no local PHP server needed**:

```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: https://bullmoney-casino.onrender.com ✅
```

**Test games:**
- http://localhost:3000/games/dice
- http://localhost:3000/games/mines
- http://localhost:3000/games/plinko

**⚠️ Note:** Render free tier sleeps after 15min inactivity. First request may take 30-60 seconds to wake up.

### Option 2: Local Development (Both Servers Locally)
If you want to run PHP backend on your machine for testing:

**Step 1:** Copy local config
```bash
cp .env.development .env.local
```

**Step 2:** Start both servers
```bash
npm run dev:local
# Frontend: http://localhost:3000
# Backend: http://localhost:8000 (local PHP server)
```

**Step 3:** When done, switch back to Render:
```bash
git checkout .env.local
# Or manually edit .env.local to point to Render URL
```

## Troubleshooting

### ❌ "Failed to fetch PHP"
**Possible causes:**
1. **Render backend is sleeping** (Free tier sleeps after 15min inactivity)
   - Solution: Wait 30-60 seconds for it to wake up on first request
   
2. **CORS not configured**
   - Check `Bullcasino/.env`: `CORS_ALLOWED_ORIGINS` includes your domain
   
3. **Backend URL wrong**
   - Check `.env.local`: Points to correct Render URL

### ✅ Verify Backend is Running
Open in browser:
```
https://bullmoney-casino.onrender.com
```
Should see Laravel welcome page or API response.

### 🔄 Switch Back to Localhost
```bash
# Edit .env.local, change:
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000

# Then restart:
npm run dev:fullstack
```

## Render Backend Management

**Your Render service:** `bullmoney-casino`

**URL:** https://bullmoney-casino.onrender.com

**Wake from sleep:**
- First request takes 30-60 seconds
- Subsequent requests are fast
- Upgrade to paid plan to prevent sleep

## Next Steps

1. ✅ Test a game: http://localhost:3000/games/dice
2. ✅ Check browser console for API calls
3. ✅ Verify Network tab shows `https://bullmoney-casino.onrender.com` requests
4. 🔄 Update remaining games (wheel, jackpot, crash, slots, flappybird)

---

**Need help?** See [GAMES_PHP_INTEGRATION_COMPLETE.md](GAMES_PHP_INTEGRATION_COMPLETE.md)
