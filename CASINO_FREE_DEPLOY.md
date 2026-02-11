# 🎰 FREE Bullcasino Deployment - Render.com (Free Forever)

## ✅ What We Changed
- `/demogames` → `/casino-games` (cleaner URLs)
- Casino iframe now loads at `/games` page
- Bullcasino backend deploys to **Render.com** (free tier - NO time limit!)
- Vercel hosts Next.js, Render.com hosts PHP Laravel

## 🚀 Deploy Bullcasino to Render.com (5 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. **Cost: $0 forever** (750 hours/month free - enough for demo)

### Step 2: Deploy from GitHub

#### Option A: Deploy from Main Repo (Easiest)
1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select repository: `Bullmoneyofficial/bullmoney.online`
4. Configure:
   - **Name**: `bullmoney-casino`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `Bullcasino` ⬅️ IMPORTANT!
   - **Runtime**: PHP
   - **Build Command**: 
     ```bash
     composer install --no-dev --optimize-autoloader && php artisan key:generate && php artisan config:cache
     ```
   - **Start Command**: 
     ```bash
     php artisan serve --host=0.0.0.0 --port=$PORT
     ```
   - **Plan**: Free

5. Click **"Create Web Service"**

#### Option B: Deploy from Separate Repo (More Control)
If you want to separate the casino:
```bash
# 1. Create new repo on GitHub: bullmoney-casino
# 2. Copy Bullcasino folder to new repo
cd /Users/justin/Documents
cp -r newbullmoney/Bullcasino bullmoney-casino
cd bullmoney-casino
git init
git add .
git commit -m "Initial casino deployment"
git remote add origin https://github.com/Bullmoneyofficial/bullmoney-casino.git
git push -u origin main

# 3. Deploy on Render.com (skip Root Directory step)
```

### Step 3: Configure Environment Variables

In Render Dashboard → Your Service → **Environment**:

Add these variables:
```bash
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_KEY_HERE  # Render auto-generates this
APP_URL=https://bullmoney-casino.onrender.com
DB_CONNECTION=sqlite
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
LOG_CHANNEL=stack
```

**SQLite Database** (perfect for demo):
- No external database needed
- Stored in persistent disk
- Free & fast for demos

### Step 4: Add Persistent Storage
1. In Render service → **Settings** → **Disks**
2. Click **"Add Disk"**
3. Configure:
   - **Name**: `casino-storage`
   - **Mount Path**: `/var/www/html/storage`
   - **Size**: 1 GB (free)
4. Save

### Step 5: Deploy!
1. Render will automatically build and deploy
2. Wait 3-5 minutes for first deployment
3. You'll get a URL like: `https://bullmoney-casino.onrender.com`
4. **Copy this URL** - you'll need it!

---

## 🔧 Connect to Your Next.js App

### Update Vercel Environment Variable

#### Method 1: Via Vercel Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Select your project: `bullmoney.online`
3. Go to **Settings** → **Environment Variables**
4. Find or add: `NEXT_PUBLIC_CASINO_URL`
5. Set value to your Render URL:
   ```
   https://bullmoney-casino.onrender.com
   ```
6. Select environments: ✅ Production ✅ Preview ✅ Development
7. Click **Save**
8. Go to **Deployments** → **Redeploy**

#### Method 2: Via Vercel CLI
```bash
cd /Users/justin/Documents/newbullmoney

# Add environment variable
vercel env add NEXT_PUBLIC_CASINO_URL production
# Paste when prompted: https://bullmoney-casino.onrender.com

# Also add for preview
vercel env add NEXT_PUBLIC_CASINO_URL preview
# Paste: https://bullmoney-casino.onrender.com

# Redeploy
vercel --prod
```

### Update Local Development
Edit `/Users/justin/Documents/newbullmoney/.env.local`:
```bash
# For local development with local Laravel backend:
NEXT_PUBLIC_CASINO_URL=/casino-games
CASINO_BACKEND_URL=http://localhost:8000

# OR use production Render URL during local dev:
# NEXT_PUBLIC_CASINO_URL=https://bullmoney-casino.onrender.com
```

---

## 🧪 Test Everything

### 1. Test Render Deployment
Visit: `https://bullmoney-casino.onrender.com`
- Should show casino homepage
- Check if games load (dice, crash, mines, wheel, jackpot)

### 2. Test on Vercel
After redeployment:
1. Visit: `https://www.bullmoney.shop/games`
2. Scroll to bottom - iframe should load casino
3. **No 404 errors!** ✅

### 3. Test Both Domains
- https://www.bullmoney.shop/games
- https://www.bullmoney.online/games

---

## 🎮 Game Routes

After deployment, these routes work:

| Game | URL |
|------|-----|
| Homepage | `https://bullmoney-casino.onrender.com/` |
| Dice | `https://bullmoney-casino.onrender.com/dice` |
| Mines | `https://bullmoney-casino.onrender.com/mines` |
| Wheel | `https://bullmoney-casino.onrender.com/wheel` |
| Crash | `https://bullmoney-casino.onrender.com/crash` |
| Jackpot | `https://bullmoney-casino.onrender.com/jackpot` |
| Slots | `https://bullmoney-casino.onrender.com/slots` |

All are embedded in iframe at: `/games` on your main site.

---

## 🆓 Free Tier Limits (Render.com)

✅ **What's Included FREE Forever:**
- 750 hours/month runtime (25 days)
- Sleeps after 15 min inactivity (wakes in <30 seconds)
- 512 MB RAM
- 0.1 CPU
- Free SSL certificate
- Custom domain support
- 1 GB disk storage

⚠️ **Limitations:**
- Sleeps after 15 minutes of no traffic
- Cold start: ~20-30 seconds to wake up
- Perfect for demos and testing
- Not for heavy traffic (upgrade to paid if needed)

**Keep It Awake (Optional):**
Use a free uptime monitor:
- https://uptimerobot.com (free)
- Ping your Render URL every 10 minutes
- Prevents sleep during business hours

---

## 📦 Deployment Architecture

```
┌─────────────────────┐
│   bullmoney.shop    │  ← Next.js on Vercel
│   bullmoney.online  │     (Main website)
└─────────┬───────────┘
          │
          │ Loads iframe at /games page
          │
          ▼
┌─────────────────────┐
│  Render.com Server  │  ← Laravel PHP (Bullcasino)
│  Free Tier (750h)   │     (Casino games backend)
└─────────────────────┘
```

**Benefits:**
- ✅ Main site: Lightning fast (Vercel CDN)
- ✅ Casino: Free PHP hosting (Render)
- ✅ No PHP on Vercel needed
- ✅ Both free forever
- ✅ Easy to scale independently

---

## 🔄 Local Development

Run both servers locally:

```bash
# Terminal 1: Next.js (Port 3000)
cd /Users/justin/Documents/newbullmoney
npm run dev

# Terminal 2: Laravel Casino (Port 8000)
cd /Users/justin/Documents/newbullmoney/Bullcasino
php artisan serve --port=8000

# Visit: http://localhost:3000/games
# Iframe loads: http://localhost:8000 via proxy
```

**Proxy works automatically in dev** - configured in `next.config.mjs`

---

## 🚨 Troubleshooting

### Casino shows 404 in production
**Solution**: Check Vercel env var `NEXT_PUBLIC_CASINO_URL` is set correctly
```bash
vercel env ls
```

### Casino is slow to load
**Cause**: Render free tier sleeps after 15 minutes
**Solution**: 
1. Wait 20-30 seconds for cold start
2. Use UptimeRobot to keep awake during business hours
3. Or upgrade to $7/month paid plan (never sleeps)

### Games not working
**Check:**
1. Render logs: Dashboard → Your Service → **Logs**
2. Database: Make sure SQLite file has write permissions
3. Laravel env vars: `APP_KEY` must be set

### CORS errors
**Fix**: Already configured! Check `next.config.mjs` headers:
- `/casino-games` route has CORS headers
- `/games` page has permissive CSP

---

## 💰 Cost Breakdown

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Next.js hosting | **FREE** (100GB bandwidth) |
| **Render.com** | PHP Laravel casino | **FREE** (750 hours/month) |
| **Total** | Full stack | **$0/month** ✅ |

**Upgrade Path (Optional):**
- Render Starter: $7/month (never sleeps, more RAM)
- Vercel Pro: $20/month (more bandwidth)

---

## ✅ Deployment Checklist

- [x] Bullcasino deployment config created (`render.yaml`)
- [x] URLs updated from `/demogames` to `/casino-games`
- [x] Vercel ready to redeploy
- [ ] Create Render.com account
- [ ] Deploy Bullcasino to Render
- [ ] Copy Render URL
- [ ] Update Vercel env var `NEXT_PUBLIC_CASINO_URL`
- [ ] Redeploy on Vercel
- [ ] Test: Visit www.bullmoney.shop/games
- [ ] Test: Visit www.bullmoney.online/games
- [ ] Both work! No 404! 🎉

---

## 🎯 Summary

**What This Gives You:**
1. ✅ Free PHP hosting forever (Render.com)
2. ✅ Free Next.js hosting (Vercel)
3. ✅ Casino games work on both domains
4. ✅ No 404 errors
5. ✅ Professional setup
6. ✅ Easy to maintain
7. ✅ Scales independently

**Next Steps:**
1. Deploy to Render (5 minutes)
2. Update Vercel env var (1 minute)
3. Redeploy (2 minutes)
4. **Done!** 🚀

---

## 🆘 Need Help?

**Render.com Docs**: https://render.com/docs  
**Laravel Deployment**: https://laravel.com/docs/deployment  
**Vercel Deployment**: https://vercel.com/docs

Your casino will be live at:
- Render: `https://bullmoney-casino.onrender.com`
- Integrated: `https://www.bullmoney.shop/games`
