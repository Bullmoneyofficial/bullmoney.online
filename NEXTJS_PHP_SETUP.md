# 🎮 Next.js Frontend + PHP Backend Setup

## Architecture Overview

**Frontend:** Next.js (React/TypeScript) - Renders game UI  
**Backend:** PHP Laravel - Handles game logic & API

```
┌──────────────────────────────────────────────────┐
│  Next.js Frontend (localhost:3000)              │
│  └─> GamePageClient.tsx (React UI)              │
│       └─> Calls PHP API via fetch()              │
│            ↓                                      │
├──────────────────────────────────────────────────┤
│  PHP Laravel Backend (localhost:8000)           │
│  └─> Controllers (Game Logic)                    │
│       ├─> /dice/bet                              │
│       ├─> /mines/create, /mines/open            │
│       ├─> /plinko/play                           │
│       └─> All other game APIs                    │
└──────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start PHP Backend

```bash
cd Bullcasino
php artisan serve
# Runs on http://localhost:8000
```

### 2. Start Next.js Frontend

```bash
npm run dev
# Runs on http://localhost:3000
```

### 3. Access Games

Visit: http://localhost:3000/games/dice

## Environment Configuration

`.env.local`:
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000
```

This works for:
- ✅ localhost (http://localhost:3000)
- ✅ IP addresses (http://192.168.1.163:3000)
- ✅ Production (https://bullmoney.online)

## PHP Backend API

Use the PHP API client:

```typescript
import { phpGameApi } from '@/lib/php-backend-api';

// Dice bet
const result = await phpGameApi.dice.bet(100, 50, 'min');

// Mines create
const game = await phpGameApi.mines.create(3, 100);

// Plinko play
const drop = await phpGameApi.plinko.play(100, 16, 'medium');
```

## CORS Configuration

PHP Laravel automatically allows:
- localhost:3000
- 127.0.0.1:3000
- 192.168.x.x:3000 (local network)
- 10.x.x.x:3000 (local network)
- Production domains

Configured in:
- `Bullcasino/config/cors.php`
- `Bullcasino/app/Http/Middleware/Cors.php`

## Key Files

```
lib/php-backend-api.ts           → PHP API client
config/games.config.ts           → Game definitions
app/games/[game]/GamePageClient.tsx → Game UI (React)
Bullcasino/routes/web.php        → PHP routes
Bullcasino/app/Http/Controllers/ → PHP game logic
```

## Production Deployment

### Frontend (Next.js)
```bash
# Deploy to Vercel, Netlify, etc.
npm run build
npm start
```

Update `.env.production`:
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=https://api.yourdomain.com
```

### Backend (PHP Laravel)
```bash
# Deploy to hosting (Render, Heroku, etc.)
cd Bullcasino
# Follow Laravel deployment guide
```

## Testing

```bash
# Test PHP backend directly
curl http://localhost:8000/dice/bet

# Test from Next.js
# Open http://localhost:3000/games/dice
# Check browser console for API calls
```

## Architecture Benefits

✅ **Separation of Concerns:** UI in Next.js, Logic in PHP  
✅ **Scalable:** Scale frontend & backend independently  
✅ **Flexible:** Works on any device/network  
✅ **Proven:** Uses battle-tested PHP Laravel  
✅ **Fast:** Next.js SSR + PHP optimized logic  

## Troubleshooting

**CORS errors?**
- Check `Bullcasino/config/cors.php` includes your origin
- Verify PHP backend is running

**API not responding?**
- Ensure `NEXT_PUBLIC_PHP_BACKEND_URL` is set correctly
- Check PHP backend logs: `Bullcasino/storage/logs/`

**Games not loading?**
- Verify both servers are running
- Check browser console for errors
- Test PHP API directly with curl

---

**Last Updated:** February 13, 2026  
**Architecture:** Next.js Frontend + PHP Laravel Backend
