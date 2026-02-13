# 🎮 Games "Request Failed" - Quick Troubleshooting Guide

## Problem
All games (dice, mines, crash, flappybird) show "request failed" when playing.

## Quick Fix Checklist

### Step 1: Verify Backend Helper Loaded ✅
Open DevTools Console (F12) and check:
```
🎮 [GameBackend] Initialized with backends: https://bullmoney-casino.onrender.com (primary), http://localhost:8000 (fallback)
```

**If you see this**: ✅ Helper is working, go to Step 2
**If you DON'T see this**: 
- Refresh page
- Check Network tab - is `/assets/js/backend-helper.js` loading?
- If 404 - file is missing, re-upload
- If CORS error - check server config

### Step 2: Check Render Backend Status
Open terminal and run:
```bash
curl -s https://bullmoney-casino.onrender.com/health | jq .
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-13T...",
  "uptime": 123456
}
```

**If HTTP 404**: Backend doesn't have /health endpoint - this is OK, means it's old code
**If HTTP 500**: Backend error - check Render logs:
```bash
render logs --service bullmoney-casino --tail 50
```

**If Connection timeout**: Render is down or unreachable

### Step 3: Test Game Request
```bash
# Test Dice game endpoint
curl -X POST https://bullmoney-casino.onrender.com/dice/bet \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "bet=10&percent=50&type=min" \
  2>&1 | head -50
```

**Expected**: JSON response with game result or error (not HTTP 405)
**If HTTP 405 "Method Not Allowed"**: Route issue on backend
**If HTTP 419 "Token Mismatch"**: CSRF issue - should auto-fix in frontend

### Step 4: Check Local Backend (if running)
```bash
# If running local backend on port 8000
curl -s http://localhost:8000/health | jq .
```

**If responds**: Local backend working
**If fails**: Either not running or not on port 8000

### Step 5: Check .env Configuration
Verify the environment file:
```bash
grep "BACKEND_URL\|CASINO_BACKEND" .env.local
```

**Should output**:
```
CASINO_BACKEND_URL=https://bullmoney-casino.onrender.com
NEXT_PUBLIC_PHP_BACKEND_URL=https://bullmoney-casino.onrender.com
```

**If different**: Update to point to correct backend

## Common Errors & Fixes

### Error: "⏱️ Request timeout"
**Cause**: Backend too slow (> 10 seconds)
**Fix**: 
1. Check Render logs for slow queries
2. Optimize database queries
3. Or increase timeout in `/public/assets/js/backend-helper.js`:
   ```javascript
   timeout: 15000 // Change from 10000
   ```

### Error: "🔒 Session expired - Please refresh"
**Cause**: CSRF token expired
**Fix**: 
- Page should auto-refresh the token
- If not working: 
  1. Hard refresh page: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
  2. Check if `/csrf-token` endpoint exists on backend:
     ```bash
     curl https://bullmoney-casino.onrender.com/csrf-token
     ```

### Error: "❌ Request failed - Backend unavailable"
**Cause**: Both primary and fallback backends down
**Fix**:
1. **If using Render backend only**:
   ```bash
   # Check Render status
   render logs --service bullmoney-casino --tail 20
   
   # Restart service
   render deploy --service bullmoney-casino
   ```

2. **If local backend needed**:
   ```bash
   # Start local backend
   cd Bullcasino
   php artisan serve --host=0.0.0.0 --port=8000
   ```

### Error: CORS Error in Console
**Cause**: Frontend domain not allowed by backend
**Fix**: Update `Bullcasino/config/cors.php`:
```php
'allowed_origins' => [
    'http://localhost:3000',
    'https://bullmoney.online',  // Add your domain
],
```

Then restart backend.

## Testing a Game (Manual Steps)

1. **Open Dev Tools** (F12)
2. **Go to Console tab**
3. **Go to Network tab**
4. **Load a game page** (example: `/games/dice`)
5. **Look for message**: `🎮 [GameBackend] Initialized...`
6. **Click "Play" button**
7. **Watch Network tab** for request to `/dice/bet`
8. **Check response**:
   - Should be green (200) status
   - Should have JSON response
   - Should NOT be 404/405/500

9. **If failed**: Note the error code and status, then check troubleshooting above

## Quick Verification Script

Run this to verify everything:
```bash
#!/bin/bash

echo "=== Checking Backend Status ==="

echo -e "\n1. Checking Render backend:"
curl -s -o /dev/null -w "Health endpoint: HTTP %{http_code}\n" https://bullmoney-casino.onrender.com/health

echo -e "\n2. Checking local backend (if running):"
curl -s -o /dev/null -w "Local endpoint: HTTP %{http_code}\n" http://localhost:8000/health

echo -e "\n3. Checking environment config:"
grep "BACKEND_URL" .env.local 2>/dev/null || echo "⚠️  .env.local not found"

echo -e "\n4. Checking if backend-helper.js exists:"
test -f public/assets/js/backend-helper.js && echo "✅ Found" || echo "❌ Missing"

echo -e "\n=== Done ==="
```

Save as `check-backends.sh` and run:
```bash
chmod +x check-backends.sh
./check-backends.sh
```

## Know Your Backends

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Primary (Render)** | `https://bullmoney-casino.onrender.com` | Production/Staging |
| **Fallback (Local)** | `http://localhost:8000` | Development/Testing |
| **Frontend** | `http://localhost:3000` (dev) | Next.js app |

Games automatically use Render when available, fallback to local if Render is down.

## Debug Mode Console Output

### Normal Startup
```
🎮 [GameBackend] Initializing...
🎮 [GameBackend] Initialized with backends:
  Primary: https://bullmoney-casino.onrender.com
  Fallback: http://localhost:8000
🎮 [GameBackend] CSRF token ready
```

### When Playing Game
```
🎮 [DiceGame] Playing dice with bet=10, chance=50, type=min
🎮 [GameBackend] POST to https://bullmoney-casino.onrender.com/dice/bet
🎮 [GameBackend] Response: 200 OK
  "result": { "multiplier": 2.5, "newBalance": 35 }
```

### When Error Occurs
```
❌ [GameBackend] POST failed: Connection timeout
⚠️ [GameBackend] Retrying with fallback backend...
🎮 [GameBackend] POST to http://localhost:8000/dice/bet
✅ [GameBackend] Fallback successful!
```

## One-Minute Test

1. Open game in browser
2. Press F12, go to Console
3. Should see: `🎮 [GameBackend] Initialized`
4. Click Play
5. Check Network tab or console message
6. **Green 200 status** = ✅ Working
7. **Red error** = Follow troubleshooting above

## Need More Help?

1. **Check logs**: `render logs --service bullmoney-casino --tail 100`
2. **Check browser console**: F12 → Console → Look for red errors
3. **Check network requests**: F12 → Network → Filter by "dice/bet" or "mines/create"
4. **Check if file exists**: `test -f public/assets/js/backend-helper.js && echo OK`
5. **Restart everything**:
   ```bash
   # Kill all node/PHP processes
   killall node php 2>/dev/null || true
   
   # Restart Next.js
   npm run dev
   
   # In another terminal, restart Laravel
   cd Bullcasino && php artisan serve --host=0.0.0.0 --port=8000
   ```

---
**Version**: 1.0
**Last Updated**: February 13, 2026
**Status**: All games fixed and documented
