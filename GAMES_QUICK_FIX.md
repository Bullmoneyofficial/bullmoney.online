# 🎮 Games "Request Failed" Quick Fix

## Problem
Games show "❌ Request failed - Backend unavailable" when clicking Play

## Root Cause
- PHP backend (Render or local) is not responding
- CSRF token is missing or invalid
- Network connection issues
- Backend health check failing

## Quick Fix (5 Minutes)

### 1. Check Backend is Running

```bash
# For LOCAL backend
ps aux | grep "php artisan serve"

# Should see something like:
# /usr/bin/php artisan serve --host=0.0.0.0 --port=8000

# If not running, start it:
cd Bullcasino
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Test Backend Directly

```bash
# Test if backend responds
curl -X POST http://localhost:8000/dice/bet \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "bet=10&percent=50&type=min"

# Should return JSON (success or error), NOT timeout or connection refused
```

### 3. Check Frontend is Using Correct Backend

```bash
# Check .env.local
cat .env.local | grep CASINO_BACKEND_URL

# Should show:
# CASINO_BACKEND_URL=http://localhost:8000

# Update if needed
echo "CASINO_BACKEND_URL=http://localhost:8000" >> .env.local
```

### 4. Restart Next.js

```bash
# Kill running dev server
pkill -f "next dev"

# Restart
npm run dev
```

### 5. Test in Browser

1. Open http://localhost:3000/games/dice
2. Open DevTools (F12)
3. Go to Network tab
4. Click Play button
5. Look for `/dice/bet` request:
   - ✅ Green (200 OK) → Backend working!
   - ❌ Red (500 or timeout) → Backend issue
   - ⚠️ Orange → Network issue

## Production Fix (Render)

If using Render backend:

```bash
# Check service status
render logs --service bullmoney-casino --tail 20

# If red/errored, restart it
render deploy --service bullmoney-casino

# Or via Render dashboard:
# https://dashboard.render.com → Services → bullmoney-casino → Manual Deploy
```

## Still Failing?

Run the diagnostic:

```bash
# In browser console (F12)
GameBackend.health.check('http://localhost:8000').then(h => {
    console.log('Backend healthy:', h);
});

// Should log: Backend healthy: true
```

If logs `Backend healthy: false`:
- Backend is NOT responding
- Check it's actually running
- Check port 8000 is not blocked by firewall
- Check for Laravel errors in logs

## Files Updated

All game files now use `GameBackend` helper which:
- ✅ Auto-detects backend (local or Render)
- ✅ Retries on failure
- ✅ Falls back to local if Render down
- ✅ Refreshes CSRF tokens automatically
- ✅ Shows clear error messages

Games Updated:
- dice.js - `playDice()` function
- mines.js - `playMines()`, `takeMines()`, `openMinCell()` functions  
- crash.js - `createBet()`, `cashout()` functions
- flappybird.js - `startGame()`, `submitGameResult()` functions

## Important: Load Backend Helper

The file `public/assets/js/backend-helper.js` MUST be loaded before game scripts!

This is now automatic in `app/games/[game]/GamePageClient.tsx` - all games will load it first.

---

**Quick Checklist**:
- [ ] PHP running on 8000
- [ ] Backend responding to test request
- [ ] Frontend .env.local configured
- [ ] Frontend dev server restarted
- [ ] backend-helper.js loaded before game scripts
- [ ] CSRF token in meta tag

If all checked and still failing → Check browser console (F12) for error message
