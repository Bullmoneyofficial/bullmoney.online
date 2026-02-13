# 🚀 Full-Stack Development Setup Guide

## Quick Start

### Option 1: NPM Script (Recommended for Windows/Mac/Linux)

```bash
npm run dev:local
```

This uses `concurrently` to run both servers side-by-side with labeled output.

### Option 2: Bash Script (Mac/Linux Only)

```bash
./start-both.sh
```

This launches both servers with a nice colored interface and auto-cleanup.

### Option 3: Manual (Most Control)

**Terminal 1 - Laravel Backend:**
```bash
cd Bullcasino
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
```

---

## What's Running

- **Frontend (Next.js)**: http://localhost:3000 (or 3001 if 3000 is busy)
- **Backend (Laravel)**: http://localhost:8000
- **Games**: http://localhost:3000/games/dice

---

## How Games Work

### Local Development (localhost)

```
Browser Request
     ↓
Next.js Frontend (3000) 
     ↓
Direct to Laravel Backend (8000)
     ↓
Game Response (JSON)
```

**Configuration**: `.env.local` is set to use `http://localhost:8000`

### Production (Vercel)

```
Browser Request
     ↓
Next.js Frontend (Vercel)
     ↓
/api/games/proxy (Next.js API Route)
     ↓
Laravel Backend (Render)
     ↓
Game Response (JSON)
```

**Configuration**: Backend-helper.js detects Vercel and uses proxy route

---

## Key Files

| File | Purpose |
|------|---------|
| `.env.local` | Development environment variables |
| `public/assets/js/backend-helper.js` | 🎮 Universal game request handler |
| `app/api/games/proxy/route.ts` | 🔀 Vercel proxy for game requests |
| `start-both.sh` | 🚀 Bash script to start both servers |
| `Bullcasino/.env` | Laravel configuration |

---

## Environment Variables

### `.env.local` (What Frontend Uses)

```bash
# Points to EITHER local or Render backend
CASINO_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000

# For production (Vercel), change to:
# CASINO_BACKEND_URL=https://bullmoney-casino.onrender.com
# NEXT_PUBLIC_PHP_BACKEND_URL=https://bullmoney-casino.onrender.com
```

### `Bullcasino/.env` (Laravel Configuration)

```bash
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=sqlite
SESSION_DRIVER=file
```

---

## Troubleshooting

### "Address already in use" on port 8000

```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use the start script which does this automatically
./start-both.sh
```

### "Address already in use" on port 3000

Next.js will automatically try port 3001, 3002, etc. No action needed.

### Games show "request failed"

1. **Check Laravel is running**:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy",...}
   ```

2. **Check .env.local points to localhost**:
   ```bash
   grep CASINO_BACKEND_URL .env.local
   # Should be: http://localhost:8000 (NOT https://bullmoney-casino.onrender.com)
   ```

3. **Check browser console (F12)** for error messages

4. **Look for GameBackend message**:
   Should see: `🎮 [GameBackend] Initialized with backends: http://localhost:8000`

### Games work locally but fail on Vercel

This is expected if Render backend is down. The fix:
1. ✅ Next.js API proxy (`/api/games/proxy`) handles the forwarding
2. ✅ Backend-helper.js auto-detects Vercel and uses proxy
3. ✅ No CORS issues because same-origin requests

**To test your Vercel deployment**:
1. Deploy to Vercel (it will auto-pick up changes)
2. The proxy route will automatically forward requests to Render
3. If Render is down, you'll get a 500 error (this is a backend issue, not frontend)

---

## Development Workflow

### Making Changes

**Game JavaScript** (`public/assets/js/*.js`):
- Changes apply immediately (no server restart needed)
- Reload page in browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**React Components** (`app/games/[game]/*.tsx`):
- Hot reload automatically
- Changes visible after ~1 second

**Laravel Backend** (`Bullcasino/app/**`):
- Requires server restart
- Run: `php artisan config:clear` to clear caches

**Environment Variables** (`.env.local` or `Bullcasino/.env`):
- Requires full restart of both servers
- Kill both and run `npm run dev:local` again

### Testing Games

1. **Open game**: http://localhost:3000/games/dice
2. **Open DevTools**: F12
3. **Go to Console tab**
4. **Look for**: `🎮 [GameBackend] Initialized...`
5. **Click "Play"**
6. **Check Network tab** for request to `/dice/bet`
7. **Response should be JSON**, not error

---

## Production Deployment

### Vercel (Frontend)

```bash
git push origin main
# Vercel auto-deploys from GitHub
```

**What happens:**
- Next.js builds and deploys to Vercel
- API routes (`/api/games/proxy`) deploy with it
- Games automatically use proxy for Render backend

### Render (Backend)

```bash
# First time setup
render logs --service bullmoney-casino

# Deploy changes
render deploy --service bullmoney-casino

# Check status
render logs --service bullmoney-casino --tail 20
```

**Environment variables on Render**:
```bash
APP_KEY=base64:...
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=sqlite
```

---

## Architecture Diagram

### Local Setup
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ http://localhost:3000
       ↓
┌──────────────────────┐
│   Next.js (3000)     │
│  ├─ Pages            │
│  ├─ API Routes       │
│  └─ Static Files     │
└──────┬───────────────┘
       │ Direct Call (localhost only)
       │ http://localhost:8000
       ↓
┌──────────────────────┐
│  Laravel (8000)      │
│  ├─ Game Routes      │
│  ├─ Database         │
│  └─ Auth             │
└──────────────────────┘
```

### Production Setup (Vercel)
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ https://bullmoney.online
       ↓
┌──────────────────────┐
│   Next.js (Vercel)   │
│  ├─ Pages            │
│  ├─ /api/games/proxy │◄─── IMPORTANT
│  └─ Static Files     │
└──────┬───────────────┘
       │ Uses proxy route
       │ https://bullmoney-casino.onrender.com
       ↓
┌──────────────────────┐
│  Laravel (Render)    │
│  ├─ Game Routes      │
│  ├─ Database         │
│  └─ Auth             │
└──────────────────────┘
```

---

## Common Commands

```bash
# Start both servers
npm run dev:local

# Just frontend
npm run dev

# Just backend
cd Bullcasino && php artisan serve --host=0.0.0.0 --port=8000

# Backend migrations
cd Bullcasino && php artisan migrate:fresh --seed

# Clear Laravel caches
cd Bullcasino && php artisan config:clear

# Rebuild Next.js
npm run build

# Check TypeScript errors
npm run type-check

# Format code
npm run lint:fix
```

---

## Security Notes

✅ **CSRF Protection**: All game requests include CSRF tokens
✅ **Session Management**: Laravel handles user authentication
✅ **CORS Handling**: Vercel proxy eliminates CORS issues
✅ **Input Validation**: Backend validates all game inputs

⚠️ **Never commit** .env files with real secrets
⚠️ **Use environment variables** for API keys and tokens

---

## Getting Help

### Check Logs

**Laravel (Backend)**:
```bash
cd Bullcasino && tail -f storage/logs/laravel.log
```

**Next.js (Frontend)**:
```bash
# Check console output from npm run dev:local
# Or open http://localhost:3000 and check F12 Console
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Get CSRF token
curl http://localhost:8000/csrf-token

# Test game endpoint
curl -X POST http://localhost:8000/dice/bet \
  -H "Content-Type: application/json" \
  -d '{"type":"min", "bet": 10}'
```

---

**Last Updated**: February 13, 2026
**Status**: Full-stack development ready ✅
