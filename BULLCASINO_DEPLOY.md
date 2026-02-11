# 🎰 Bullcasino Backend Deployment Guide

## Current Status
✅ **FIXED**: No more 404 errors in production!  
- Created placeholder page at `/demogames`
- Iframe now loads successfully on both domains
- Casino backend deployment is optional (can deploy later)

## Production Deployment Options

### Option 1: Keep Placeholder (Current Setup) ✅
**No deployment needed** - Show "Coming Soon" message
- ✅ Works NOW on both bullmoney.online and bullmoney.shop
- ✅ No 404 errors
- ✅ Professional placeholder page
- When ready to deploy real casino, choose Option 2 or 3 below

### Option 2: Deploy Bullcasino to Railway/Heroku (Recommended)

#### Railway Deployment (Laravel Friendly)
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Navigate to Bullcasino folder
cd Bullcasino

# 4. Create new project
railway init

# 5. Add environment variables in Railway Dashboard:
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-railway-url.railway.app

# 6. Deploy
railway up
```

After deployment, update in Vercel:
```bash
NEXT_PUBLIC_CASINO_URL=https://your-casino.railway.app
```

#### Heroku Deployment
```bash
# 1. Navigate to Bullcasino
cd Bullcasino

# 2. Create Heroku app
heroku create bullmoney-casino

# 3. Add PHP buildpack
heroku buildpacks:add heroku/php

# 4. Deploy
git subtree push --prefix Bullcasino heroku main

# Or use Heroku CLI:
heroku git:remote -a bullmoney-casino
git push heroku main
```

After deployment:
```bash
NEXT_PUBLIC_CASINO_URL=https://bullmoney-casino.herokuapp.com
```

### Option 3: Deploy to Subdomain (Advanced)

#### Using Vercel + Separate Repo
1. Create new repo with just Bullcasino folder
2. Deploy to Vercel as separate project
3. Set custom domain: `casino.bullmoney.shop`
4. Update env var:
```bash
NEXT_PUBLIC_CASINO_URL=https://casino.bullmoney.shop
```

#### Using Railway + Custom Domain
1. Deploy Bullcasino to Railway (see Option 2)
2. Add custom domain in Railway Dashboard
3. Point DNS: `casino.bullmoney.shop` → Railway URL
4. Update env var:
```bash
NEXT_PUBLIC_CASINO_URL=https://casino.bullmoney.shop
```

## Environment Variables for Bullcasino

When deploying Bullcasino, set these:
```bash
APP_ENV=production
APP_DEBUG=false
APP_KEY=your_32_character_app_key
APP_URL=https://your-casino-url.com
DB_CONNECTION=mysql  # or sqlite for demo
DB_HOST=your_db_host
DB_DATABASE=casino_db
DB_USERNAME=casino_user
DB_PASSWORD=strong_password
```

## Testing After Deployment

1. Deploy Bullcasino backend
2. Update `NEXT_PUBLIC_CASINO_URL` in Vercel
3. Redeploy Next.js app
4. Visit: https://www.bullmoney.shop/games
5. Iframe should load casino (no 404)

## Quick Commands

### Test Locally
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Bullcasino
cd Bullcasino && php artisan serve --port=8000
```

### Deploy to Production
```bash
# 1. Deploy Bullcasino (choose Railway/Heroku/etc)
# 2. Get deployed URL
# 3. Update Vercel env var:
vercel env add NEXT_PUBLIC_CASINO_URL production

# Enter your Bullcasino URL when prompted

# 4. Redeploy
vercel --prod
```

## Current URLs

| Environment | Next.js Domain | Casino URL | Status |
|------------|---------------|-----------|---------|
| Development | `localhost:3000` | `/demogames` → `localhost:8000` | ✅ Proxy works |
| Production (.online) | `bullmoney.online` | `/demogames` | ✅ Placeholder page |
| Production (.shop) | `bullmoney.shop` | `/demogames` | ✅ Placeholder page |

## Next Steps

Choose one:

### A) Keep Placeholder (Do Nothing)
- ✅ Already done!
- Games page shows "Coming Soon"
- No 404 errors

### B) Deploy Real Casino
1. Choose deployment platform (Railway recommended)
2. Deploy Bullcasino folder
3. Update `NEXT_PUBLIC_CASINO_URL` in Vercel
4. Redeploy

### C) Use External Demo Casino
If you have an external demo casino URL:
```bash
# In Vercel Environment Variables:
NEXT_PUBLIC_CASINO_URL=https://external-demo-casino.com
```

## Support

**Railway**: https://railway.app (Free tier available)  
**Heroku**: https://heroku.com (Free tier removed, ~$5/month)  
**DigitalOcean**: https://digitalocean.com ($5/month droplet)

---

**Status**: ✅ Production is working with placeholder  
**Next**: Deploy Bullcasino when ready (optional)
