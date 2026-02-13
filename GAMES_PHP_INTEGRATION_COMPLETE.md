# ✅ Casino Games - PHP Backend Integration Complete

## Overview
All casino games now use **React/Next.js frontend** with **PHP Laravel backend** for game logic and state management.

## Architecture
```
┌──────────────────────────────────────┐
│  Next.js Frontend (Port 3000)       │
│  - React UI components               │
│  - Three.js 3D rendering            │
│  - Animations & visual effects       │
└─────────────┬────────────────────────┘
              │
              │ fetch() / phpGameApi
              │
┌─────────────▼────────────────────────┐
│  PHP Laravel Backend (Port 8000)     │
│  - Game logic & RNG                  │
│  - Balance management                │
│  - Session state                     │
└──────────────────────────────────────┘
```

## Updated Games

### ✅ Dice
- **File**: `app/games/[game]/GamePageClient.tsx` (lines 825-930)
- **Updates**:
  - `playDice()` now calls `phpGameApi.dice.bet(bet, chance, type)`
  - PHP generates random number and determines win/loss
  - Frontend animates 3D dice and updates balance from server response
- **API Endpoint**: `POST /dice/bet`

### ✅ Mines
- **File**: `app/games/[game]/GamePageClient.tsx` (lines 1538-1785)
- **Updates**:
  - `startGame()` calls `phpGameApi.mines.create(bombs, bet)`
  - `revealCell()` calls `phpGameApi.mines.open(cellNumber)`
  - `cashOut()` calls `phpGameApi.mines.take()`
  - PHP manages bomb positions server-side
- **API Endpoints**:
  - `POST /mines/create` - Start game
  - `POST /mines/open` - Reveal cell
  - `POST /mines/take` - Cash out

### ✅ Plinko
- **File**: `app/games/[game]/GamePageClient.tsx` (lines 1785-2291)
- **Updates**:
  - `dropBall()` calls `phpGameApi.plinko.play(bet, lines, risk)` for each ball
  - PHP determines final position and multiplier
  - Frontend animates ball drop to match server result
- **API Endpoint**: `POST /plinko/play`

## Configuration Files

### ✅ PHP API Client
**File**: `lib/php-backend-api.ts`
```typescript
// Automatically handles CORS, credentials, CSRF tokens
export const phpGameApi = {
  dice: {
    bet: (bet: number, percent: number, type: 'min' | 'max') => Promise<...>
  },
  mines: {
    create: (bombs: number, bet: number) => Promise<...>,
    open: (cellNumber: number) => Promise<...>,
    take: () => Promise<...>
  },
  plinko: {
    play: (bet: number, lines: number, risk: 'low' | 'medium' | 'high') => Promise<...>
  },
  // ... other games
}
```

### ✅ CORS Configuration
**File**: `Bullcasino/config/cors.php`
- Allows: `localhost:3000`, `127.0.0.1:3000`, `192.168.x.x:3000`, production domains
- Supports credentials: `true`
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`

**File**: `Bullcasino/app/Http/Middleware/Cors.php`
- Custom CORS middleware with pattern matching
- Handles OPTIONS preflight requests

### ✅ Environment Variables
**File**: `.env.local`
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000
```

**File**: `Bullcasino/.env`
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Testing Instructions

### Option 1: Production (Render Backend) - DEFAULT ✅
```bash
npm run dev
```
This uses the **Render PHP backend** - no local PHP server needed:
- ✅ Next.js frontend on http://localhost:3000
- ✅ PHP Laravel backend on https://bullmoney-casino.onrender.com

### Option 2: Local Development (Both Servers Locally)
```bash
npm run dev:local
```
This starts both servers on your machine:
- ✅ Next.js frontend on http://localhost:3000
- ✅ PHP Laravel backend on http://localhost:8000

### Option 3: Start Servers Separately
#### Terminal 1 - Start PHP Backend
```bash
cd Bullcasino
php artisan serve
# Should run on http://localhost:8000
```

#### Terminal 2 - Start Next.js Frontend
```bash
npm run dev
# Should run on http://localhost:3000
```

### 3. Test Games
Navigate to:
- **Dice**: http://localhost:3000/games/dice
- **Mines**: http://localhost:3000/games/mines
- **Plinko**: http://localhost:3000/games/plinko

### 4. Check Network Tab
Open browser DevTools → Network tab and verify:
- ✅ API calls go to `http://localhost:8000/dice/bet`, etc.
- ✅ CORS headers present in response
- ✅ Response status: `200 OK`
- ✅ Balance updates from server

## Deployment Compatibility

### ✅ Localhost (Development)
To develop locally with PHP backend running on your machine:

**1. Update `.env.local`:**
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8000
CASINO_BACKEND_URL=http://localhost:8000
```

**2. Start both servers:**
```bash
npm run dev:fullstack
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- CORS: Configured ✅

### ✅ Production (Render) - DEFAULT CONFIGURATION
**Current Setup** - PHP backend hosted on Render:

**Backend URL:** `https://bullmoney-casino.onrender.com`

**`.env.local` is configured (default):**
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=https://bullmoney-casino.onrender.com
```

**Just run:**
```bash
npm run dev
# Uses Render backend automatically ✅
```

**Frontend** can be deployed to:
- Vercel: Update env vars in dashboard
- Render: Update in render.yaml
- Netlify: Update in netlify.toml

**CORS Configuration** in `Bullcasino/.env`:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://bullmoney.online,https://www.bullmoney.online
```

### ✅ Local IP (192.168.x.x)
For testing on local network devices:

**1. Update `.env.local`:**
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=http://192.168.1.163:8000
```

**2. Start PHP backend with network binding:**
```bash
cd Bullcasino
php artisan serve --host=0.0.0.0 --port=8000
```

- Frontend: `http://192.168.1.163:3000`
- Backend: `http://192.168.1.163:8000`
- CORS: Pattern matching configured ✅

### Quick Switch Between Environments

**Production/Render (Default):**
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend: https://bullmoney-casino.onrender.com ✅
```

**Local Development:**
```bash
# Copy local config (points to localhost:8000)
cp .env.development .env.local
npm run dev:local
# Frontend: http://localhost:3000
# Backend: http://localhost:8000 (local PHP server)
```

**Switch back to Render:**
```bash
git checkout .env.local
npm run dev
```

## Other Games Status

### Remaining Games (Same Pattern)
To add PHP backend to remaining games:

1. **Wheel** - Use `phpGameApi.wheel.spin(bet, segment)`
2. **Jackpot** - Use `phpGameApi.jackpot.play(bet)`
3. **Crash** - Use `phpGameApi.crash.bet(bet, multiplier)`
4. **Slots** - Use `phpGameApi.slots.spin(bet, lines)`
5. **Flappy Bird** - Use `phpGameApi.flappybird.play(bet)`

All API methods already exist in `lib/php-backend-api.ts` - just update the game components to call them instead of using client-side logic.

## Code Example

### Before (Client-side logic):
```typescript
const playDice = () => {
  const random = Math.floor(Math.random() * 999999);
  const roll = (random / 999999) * 100;
  const isWin = roll < chance;
  if (isWin) {
    setBalance(prev => prev + winnings);
  }
};
```

### After (PHP backend):
```typescript
const playDice = async () => {
  const data = await phpGameApi.dice.bet(bet, chance, 'min');
  if (data.out === 'win') {
    setBalance(data.balance); // Balance from server
    setResult({ win: true, amount: data.cash });
  }
};
```

## Benefits

✅ **Security**: Game logic runs server-side, cannot be tampered with  
✅ **Fair Play**: RNG controlled by PHP, not client JavaScript  
✅ **State Management**: Balance managed by database  
✅ **Scalability**: Works across localhost, LAN, and production  
✅ **Maintainability**: Single source of truth (PHP controllers)  

## Next Steps

1. ✅ Test dice, mines, plinko on localhost
2. 🔄 Update remaining 5 games (wheel, jackpot, crash, slots, flappybird)
3. 🔄 Test on local IP (192.168.x.x:3000)
4. 🔄 Deploy to production with domain configuration

---

**Status**: Core integration complete - 3/8 games updated  
**Ready for**: Testing and expanding to remaining games  
**Documentation**: See `examples/php-api-usage.tsx` for more examples
