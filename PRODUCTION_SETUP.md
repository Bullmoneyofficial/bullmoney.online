# ✅ Production Deployment Instructions

## What's Ready
- ✅ Bullcasino deployed on Render.com: `https://bullmoney-games.onrender.com`
- ✅ All code updated to use production URL
- ✅ Local files configured for production

## What's Left: Update Vercel Environment Variable

### Via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/dashboard
2. **Select Project**: `bullmoney.online`
3. **Go to**: Settings → Environment Variables
4. **Look for**: `NEXT_PUBLIC_CASINO_URL` 
5. **Value**: `https://bullmoney-games.onrender.com`
6. **Environments**: Select ✅ Production ✅ Preview ✅ Development
7. **Click**: Save

### Via Vercel CLI

```bash
cd /Users/justin/Documents/newbullmoney

# Add/update environment variable for production
vercel env add NEXT_PUBLIC_CASINO_URL production

# When prompted, paste:
# https://bullmoney-games.onrender.com

# Also add for preview (optional but recommended)
vercel env add NEXT_PUBLIC_CASINO_URL preview

# When prompted, paste:
# https://bullmoney-games.onrender.com

# Also add for development (optional but recommended)
vercel env add NEXT_PUBLIC_CASINO_URL development

# When prompted, paste:
# https://bullmoney-games.onrender.com
```

## Redeploy to Production

### Via Dashboard
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **"..."** → **"Redeploy"**
4. Wait 2-3 minutes

### Via CLI
```bash
vercel --prod
```

---

## Test Production URLs

After redeployment, visit:

- **Test 1**: https://www.bullmoney.shop/games
  - Should show games page
  - Scroll down to see casino iframe
  - No 404 errors!

- **Test 2**: https://www.bullmoney.online/games
  - Should work on this domain too
  - Same casino iframe

---

## Current Configuration

### Production:
```
Next.js App
├─ Vercel: bullmoney.shop, bullmoney.online
├─ Hosts: /games page
└─ `/games` page iframe src: https://bullmoney-games.onrender.com
```

### Development:
```
Local Next.js (localhost:3000)
├─ /games page loads
└─ iframe src: https://bullmoney-games.onrender.com OR http://localhost:8000 (if running locally)
```

### Environment Variables:
| Var | Dev Value | Prod Value | Note |
|-----|-----------|-----------|------|
| `NEXT_PUBLIC_CASINO_URL` | https://bullmoney-games.onrender.com | https://bullmoney-games.onrender.com | Public - used in browser |
| `CASINO_BACKEND_URL` | http://localhost:8000 | (not used) | Server-side only - dev only |

---

## Verify Configuration

### Local Build Test (Optional)
```bash
# Build with production env var
NEXT_PUBLIC_CASINO_URL=https://bullmoney-games.onrender.com npm run build

# Start production server
npm start

# Visit: http://localhost:3000/games
# Should load casino from Render.com (not localhost)
```

---

## Troubleshooting

### Casino shows 404
- [ ] Check Vercel env var is set: `vercel env ls`
- [ ] Make sure you redeployed after setting env var
- [ ] Check Render.com service is running: https://bullmoney-games.onrender.com

### Casino is slow
- [ ] First visit wakes up Render free tier (20-30 sec cold start)
- [ ] This is normal for free tier
- [ ] Subsequent visits should be faster (cached)

### Only .shop domain works
- [ ] Middleware forwards .shop to /store
- [ ] Use .online domain for /games page
- [ ] Or update middleware to allow /games on .shop

---

## Files Changed

✅ `.env.local` - Render URL configured  
✅ `.env.example` - Updated with Render URL  
✅ `.env.production.example` - Production config  
✅ `app/games/page.tsx` - Uses Render URL as fallback  
✅ `app/games/[game]/page.tsx` - Uses Render URL as fallback  
✅ `next.config.mjs` - Rewrites disabled in production (working correctly)  
✅ `vercel.json` - Headers configured  
✅ `middleware.ts` - No changes needed

---

## Next Steps

1. **Update Vercel env var** (see above)
2. **Redeploy** on Vercel
3. **Test** production URLs
4. **Done! 🎉**

---

## Support

**Casino URL**: https://bullmoney-games.onrender.com  
**Dashboard**: https://www.bullmoney.shop/games  
**Vercel**: https://vercel.com/dashboard  
**Render**: https://render.com/dashboard
