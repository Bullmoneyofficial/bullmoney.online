# 🎮 Games "Request Failed" Fix - Complete Implementation Guide

## ✅ What Was Fixed

I've implemented a comprehensive error handling system for all game files (dice.js, mines.js, crash.js, flappybird.js) to handle Render backend failures gracefully:

### Files Modified
1. **Created**: `public/assets/js/backend-helper.js` - Universal backend helper with:
   - CSRF token management
   - Backend health checks
   - Automatic fallback to local backend
   - Retry logic with exponential backoff
   - User-friendly error messages

2. **Updated Game Files**:
   - `public/assets/js/dice.js` - New `playDice()` function using GameBackend helper
   - `public/assets/js/mines.js` - New API helper with proper error handling
   - `public/assets/js/crash.js` - Updated createBet() and cashout() functions
   - `app/games/bullcasino/js/flappybird.js` - Updated with GameBackend integration
   - `public/games/bullcasino/js/flappybird.js` - Same updates

## 🚀 Setup Instructions

### Step 1: Load the Backend Helper Script

Add this script tag to your game HTML layout **BEFORE** loading game scripts:

```html
<!-- Load backend helper FIRST - provides GameBackend global object -->
<script src="/assets/js/backend-helper.js"></script>

<!-- Then load game scripts -->
<script src="/assets/js/dice.js"></script>
<script src="/assets/js/mines.js"></script>
<script src="/assets/js/crash.js"></script>
<script src="/games/bullcasino/js/flappybird.js"></script>
```

**IMPORTANT**: The backend-helper.js must be loaded BEFORE any game scripts.

### Step 2: Ensure CSRF Token is Available

Make sure your game HTML includes the CSRF token meta tag:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

This should be in your Laravel blade template.

### Step 3: Configure Backend URLs (Optional)

The helper auto-detects the environment:
- **Development** (localhost): Uses `http://localhost:8000`
- **Production**: Uses `https://bullmoney-casino.onrender.com` (with fallback to local)

To override, set environment variables in `.env.local`:

```bash
# For Next.js frontend
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000

# For Next.js server-side
CASINO_BACKEND_URL=http://localhost:8000
```

### Step 4: Ensure Backend is Running

**Development**: Start PHP backend on port 8000
```bash
cd Bullcasino
php artisan serve --host=0.0.0.0 --port=8000
```

**Production**: Ensure Render service is deployed and running
```bash
# Check Render service status
render logs --service bullmoney-casino --tail 20
```

## 🧪 Testing the Fix

### Test 1: Local Backend
```bash
# Terminal 1: Start PHP backend
cd Bullcasino
php artisan serve

# Terminal 2: Start Next.js frontend
npm run dev

# Terminal 3: Test a game
curl -X POST http://localhost:3000/api/check-backend \
  -H "Content-Type: application/json"
```

### Test 2: Check Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Play" on a game
4. Look for requests to:
   - ✅ `/dice/bet` (proxied to PHP backend)
   - ✅ `/mines/create` (proxied to PHP backend)
   - ✅ etc.

**Network Tab Should Show**:
- Request: `GET /games/dice` → Response: 200 OK
- Request: `POST /dice/bet` → Response: 200 OK or error details
- No CORS errors

### Test 3: Check Browser Console

Open DevTools Console and look for:
- ✅ `🎮 [GameBackend] Initialized with backends: ...` - Helper loaded
- ✅ `🎮 [Dice] Playing dice with bet=...` - Game started
- ❌ `❌ Dice bet request failed: ...` - If backend not responding

## 🐛 Troubleshooting

### Issue 1: "❌ Request failed - Backend unavailable"

**Cause**: PHP backend not responsive

**Solutions**:
1. Check if PHP backend is running
   ```bash
   ps aux | grep "php artisan serve"
   ```

2. Test backend directly
   ```bash
   curl -X POST http://localhost:8000/dice/bet
   ```

3. Check Laravel logs
   ```bash
   tail -f Bullcasino/storage/logs/laravel.log
   ```

4. Restart PHP backend
   ```bash
   pkill -f "php artisan serve"
   php artisan serve --host=0.0.0.0 --port=8000
   ```

### Issue 2: CORS Errors

**Cause**: Frontend domain not allowed in Laravel CORS config

**Solution**:
1. Update `Bullcasino/config/cors.php`:
   ```php
   'allowed_origins' => [
       'http://localhost:3000',
       'http://127.0.0.1:3000',
       'http://192.168.1.*:3000',  // Local network
       'https://bullmoney.online',  // Production
   ],
   ```

2. Update `.env` in Bullcasino:
   ```bash
   CORS_ALLOWED_ORIGINS=http://localhost:3000,https://bullmoney.online
   ```

3. Clear config cache
   ```bash
   cd Bullcasino
   php artisan config:clear
   ```

### Issue 3: CSRF Token Errors

**Cause**: CSRF token missing or expired

**Solution**:
1. Check if meta tag exists in HTML
   ```html
   <meta name="csrf-token" content="...">
   ```

2. The helper will auto-refresh expired tokens
3. Check browser console for: `⚠️ CSRF token expired, refreshing...`

### Issue 4: Games Load But No Response

**Cause**: Request timeout or network issue

**Solution**:
1. Check Network tab in DevTools
2. Look for hanging requests (red/orange)
3. Check backend logs for processing time
4. Increase timeout in backend-helper.js (default: 10 seconds)

## 📊 Backend Health Check

The helper includes automatic health checks. Games will:
1. Check if backend is responding
2. Use fallback to local backend if primary fails
3. Cache health status for 30 seconds
4. Log status to console

To manually check:
```javascript
// In browser console
GameBackend.health.check('http://localhost:8000').then(healthy => {
    console.log('Backend healthy:', healthy);
});
```

## 🔄 How the Helper Works

```
Game makes request
    ↓
GameBackend.post('/endpoint', data)
    ↓
Check backend health
    ├─ Primary backend responding? → Use it
    └─ No? → Try fallback (local)
    ↓
Add CSRF token automatically
    ↓
Make request with retry logic (up to 2 retries)
    ├─ Token expired (419)? → Refresh and retry
    ├─ Server error (5xx)? → Try fallback server
    └─ Network timeout? → Retry with exponential backoff
    ↓
Return result to game
    ├─ Success? → Update UI and balance
    └─ Error? → Show user-friendly error message
```

## 📝 Configuration Reference

### Backend URLs
- **Development**: `http://localhost:8000` (auto-detected)
- **Production**: `https://bullmoney-casino.onrender.com` (with fallback)

### Timeout Settings
- **Request timeout**: 10 seconds
- **Health check timeout**: 3 seconds
- **Health check cache**: 30 seconds
- **Retry attempts**: 2

### Error Messages
- `⏱️ Request timeout`: Backend taking too long
- `🔒 Session expired`: CSRF token issue (auto-refreshed)
- `❌ Backend unavailable`: Can't reach any backend

## 🎯 Deployment Checklist

### For Local Development
- [ ] PHP backend running: `php artisan serve --host=0.0.0.0 --port=8000`
- [ ] Next.js frontend running: `npm run dev`
- [ ] Backend helper script loaded: `<script src="/assets/js/backend-helper.js"></script>`
- [ ] CSRF token in meta tag
- [ ] `.env.local` has `CASINO_BACKEND_URL=http://localhost:8000`

### For Production (Render)
- [ ] Render service deployed: `bullmoney-casino`
- [ ] `APP_KEY` set in Render environment variables
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Frontend domain allowed in CORS config
- [ ] Database migrations run: `php artisan migrate --force`
- [ ] Config cached: `php artisan config:cache`

### For Production (Next.js)
- [ ] Backend helper script included in layout
- [ ] CSRF token meta tag rendered by PHP
- [ ] `.env.production` configured correctly
- [ ] Games tested with Render backend

## 🔍 Debugging

### Enable Verbose Logging

Add to top of game HTML:
```html
<script>
    window.DEBUG_GAMEBACKEND = true;
    window.DEBUG_GAMES = true;
</script>
```

### Check GameBackend Status

In browser console:
```javascript
// Check if GameBackend is loaded
console.log(GameBackend);

// Check current CSRF token
console.log(GameBackend.csrf.get());

// Check backend configuration
console.log(GameBackend.config);

// Test backend health
GameBackend.health.findWorking().then(url => {
    console.log('Working backend:', url);
});
```

### View All API Calls

In browser Network tab, filter by:
- `/dice/` - Dice game requests
- `/mines/` - Mines game requests
- `/crash/` - Crash game requests
- `/flappybird/` - Flappy Bird game requests

## 📞 Support

If games are still showing "Request failed":

1. **Check browser console** for error messages (F12)
2. **Check Network tab** for failed requests (F12 → Network)
3. **Check backend logs** (Render or local)
4. **Verify backend is running** and accessible
5. **Test with curl**:
   ```bash
   curl -X POST http://localhost:8000/dice/bet \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "bet=10&percent=50&type=min"
   ```

---

**Last Updated**: February 13, 2026
**Status**: ✅ All games updated with proper error handling and fallback logic
