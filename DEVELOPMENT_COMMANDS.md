# 🎮 Development Commands

## Default (Recommended)

```bash
npm run dev
```
**Uses Render PHP Backend** (https://bullmoney-casino.onrender.com)
- ✅ No local PHP server needed
- ✅ Ready for production
- ✅ Same backend as deployed app
- ⚠️ First request may be slow (Render wake-up)

## Local PHP Backend

```bash
npm run dev:local
```
**Starts local PHP server** (http://localhost:8000)
- ✅ Both Next.js + PHP running locally
- ✅ Faster responses (no network latency)
- ✅ Good for PHP backend development
- ⚠️ Requires PHP installed locally
- ⚠️ Need to run migrations first: `cd Bullcasino && php artisan migrate`

## Other Commands

| Command | Description |
|---------|-------------|
| `npm run dev:fullstack` | Alias for `dev:local` |
| `npm run dev:silicon` | Optimized for Apple Silicon (20GB RAM) |
| `npm run dev:windows` | Optimized for Windows |
| `npm run dev:fast` | Faster compilation (16GB RAM) |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## PHP Backend Configuration

**Current setup in `.env.local`:**
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=https://bullmoney-casino.onrender.com
```

**To use local PHP backend:**
```bash
# 1. Copy local config
cp .env.development .env.local

# 2. Start local server
npm run dev:local
```

**To switch back to Render:**
```bash
git checkout .env.local
```

## Test Games

After starting dev server:
- 🎲 Dice: http://localhost:3000/games/dice
- 💎 Mines: http://localhost:3000/games/mines
- 🎯 Plinko: http://localhost:3000/games/plinko

## Troubleshooting

**❌ "Failed to fetch PHP"**
- Render backend may be sleeping (wait 30-60 seconds)
- Check network tab in browser DevTools
- Verify `.env.local` has correct backend URL

**❌ Local PHP not starting**
- Make sure PHP is installed: `php --version`
- Check port 8000 is not in use: `lsof -i :8000`
- Run migrations: `cd Bullcasino && php artisan migrate`

---

**See full documentation:**
- [PHP_BACKEND_RENDER_SETUP.md](PHP_BACKEND_RENDER_SETUP.md)
- [GAMES_PHP_INTEGRATION_COMPLETE.md](GAMES_PHP_INTEGRATION_COMPLETE.md)
