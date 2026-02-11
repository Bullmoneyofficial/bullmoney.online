# 🚀 Quick Start - Deploy Casino in 5 Minutes

## Prerequisites
- ✅ GitHub account
- ✅ Vercel account (you already have this)

## Step 1: Deploy to Render.com (2 min)
1. Go to https://render.com/register
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select repo: `bullmoney.online`
5. Settings:
   - Name: `bullmoney-casino`
   - Root Directory: `Bullcasino`
   - Runtime: PHP
   - Build: `composer install --no-dev && php artisan key:generate && php artisan config:cache`
   - Start: `php artisan serve --host=0.0.0.0 --port=$PORT`
   - Plan: **Free**
6. Add environment variables:
   ```
   APP_ENV=production
   APP_DEBUG=false
   DB_CONNECTION=sqlite
   ```
7. Click **"Create Web Service"**
8. Wait 3-5 minutes for deployment
9. **Copy your URL**: `https://bullmoney-casino.onrender.com`

## Step 2: Update Vercel (1 min)
1. Go to https://vercel.com/dashboard
2. Select: `bullmoney.online`
3. Settings → Environment Variables
4. Add/Update:
   - Key: `NEXT_PUBLIC_CASINO_URL`
   - Value: `https://bullmoney-casino.onrender.com`
   - Environments: All (Production, Preview, Development)
5. Save

## Step 3: Redeploy (1 min)
1. Go to **Deployments** tab
2. Click **"..."** on latest → **"Redeploy"**
3. Wait 2 minutes

## Step 4: Test (1 min)
Visit these URLs:
- https://www.bullmoney.shop/games ✅
- https://www.bullmoney.online/games ✅

**Iframe should load casino - no 404!** 🎉

---

## Local Development

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Casino
cd Bullcasino && php artisan serve --port=8000

# Visit: http://localhost:3000/games
```

---

## Costs
- **Render.com**: FREE forever (750 hours/month)
- **Vercel**: FREE forever (100GB bandwidth)
- **Total**: $0/month ✅

---

## Support
Full guide: See `CASINO_FREE_DEPLOY.md`

Render sleeps after 15 min → Cold start ~20 sec (normal for free tier)
