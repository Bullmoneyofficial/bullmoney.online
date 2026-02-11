# 🚀 Deployment Guide - BullMoney Casino

## Environment Configuration

### Development (.env.local)
```bash
# Uses local proxy - both servers run on your machine
NEXT_PUBLIC_CASINO_URL=/demogames
CASINO_BACKEND_URL=http://localhost:8000
```

**How it works:**
- Next.js runs on `localhost:3000`
- Casino backend runs on `localhost:8000`
- Proxy intercepts `/demogames/*` and forwards to `:8000`
- Browser sees everything on port 3000 → No CORS issues

### Production (Vercel/Deploy)

**Option 1: Casino on .shop domain (Recommended)**
```bash
# Everything on same domain - best for SEO and no CORS issues
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.shop/demogames
# NO CASINO_BACKEND_URL needed
```

**Option 2: Casino on .online domain**
```bash
# Casino on different domain - requires CORS headers
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.online/demogames
# NO CASINO_BACKEND_URL needed
```

**Option 3: Casino on subdomain**
```bash
# Casino on subdomain
NEXT_PUBLIC_CASINO_URL=https://casino.bullmoney.shop
# NO CASINO_BACKEND_URL needed
```

**How it works:**
- Next.js deployed to Vercel: `https://www.bullmoney.shop`
- Casino backend URL set in env var
- Iframe loads casino URL directly
- CSP headers allow cross-origin embedding

## Deployment Steps

### 1. Deploy Casino Backend First

The Laravel/PHP casino backend needs to be deployed to a publicly accessible URL.

**Options:**
- **Option 1 (Recommended):** Deploy to .shop domain: `https://www.bullmoney.shop/demogames`
- **Option 2:** Deploy to .online domain: `https://www.bullmoney.online/demogames`
- **Option 3:** Deploy to subdomain: `https://casino.bullmoney.shop`
- **Option 4:** Separate domain: `https://casino.yourdomain.com`

**Requirements:**
- PHP 8.1+
- MySQL or SQLite database
- Node.js (for socket server)

### 2. Update Vercel Environment Variables

In your Vercel project settings, add:

**For .shop domain deployment:**
```bash
# Production casino URL (same domain)
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.shop/demogames

# All other production variables
NEXT_PUBLIC_BASE_URL=https://www.bullmoney.shop
NODE_ENV=production
# ... etc
```

**For .online domain deployment:**
```bash
# Production casino URL (different domain)
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.online/demogames

# All other production variables
NEXT_PUBLIC_BASE_URL=https://www.bullmoney.shop
NODE_ENV=production
# ... etc
```

### 3. Deploy Next.js to Vercel

```bash
# Build and deploy
npm run build
# or
vercel --prod
```

The proxy won't be used in production - iframe loads casino URL directly.

## Testing Production Locally

To test production build locally:

### Method 1: Test with .shop domain URL
```bash
# .env.local
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.shop/demogames
NODE_ENV=production

npm run build
npm run start
```

### Method 2: Test with .online domain URL
```bash
# .env.local
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.online/demogames
NODE_ENV=production

npm run build
npm run start
```

### Method 3: Test on network IP
```bash
# Test on network IP
npm run dev
# Visit: http://192.168.1.162:3000/games
```

## Security Configuration

The following headers are configured for casino games:

### Development
- Proxy enabled: `/demogames/*` → `localhost:8000`
- Same-origin policy applies

### Production
- No proxy: Direct iframe embedding
- Headers set in `next.config.mjs`:
  - `Content-Security-Policy`: Allows all origins for game routes
  - `X-Frame-Options`: `ALLOWALL` for `/games`, `/demogames`
  - `Access-Control-Allow-Origin`: `*`
  - `Cross-Origin-Embedder-Policy`: `unsafe-none`

## Troubleshooting

### "Iframe won't load in production"
✅ **Check:**
1. Is `NEXT_PUBLIC_CASINO_URL` set correctly in Vercel?
2. Is the casino backend URL publicly accessible?
3. Does the casino backend allow iframe embedding (X-Frame-Options)?

### "Games work locally but not on deployed site"
✅ **Fix:**
- Change `.env.local` from `/demogames` to full URL
- Test build: `npm run build && npm start`
- Check browser console for CORS errors

### "Game assets (CSS/JS) not loading"
✅ **Fix:**
- Ensure casino backend serves assets with correct CORS headers
- Check that asset paths in HTML use absolute URLs or relative paths

## Network Testing (LAN)

To test on other devices (phones, tablets):

```bash
# Start dev server
npm run dev

# Access from another device
http://192.168.1.162:3000/games
```

The casino iframe will use the proxy (or direct URL if configured).

## Production Checklist

- [ ] Casino backend deployed and accessible
- [ ] `NEXT_PUBLIC_CASINO_URL` set to production casino URL
- [ ] CSP headers configured for cross-origin embedding
- [ ] Test iframe loading on production domain
- [ ] Test on mobile browsers
- [ ] Verify game assets load correctly
- [ ] Check browser console for errors

## URLs Summary

| Environment | Next.js | Casino Backend | Iframe Loads |
|------------|---------|----------------|--------------|
| **Dev (proxy)** | `localhost:3000` | `localhost:8000` | `/demogames` |
| **Dev (direct)** | `localhost:3000` | External URL | `https://...` |
| **Production (.shop)** | `bullmoney.shop` | `bullmoney.shop/demogames` | `https://www.bullmoney.shop/demogames` |
| **Production (.online)** | `bullmoney.shop` | `bullmoney.online/demogames` | `https://www.bullmoney.online/demogames` |
| **LAN Testing** | `192.168.x.x:3000` | Any accessible | `/demogames` or `https://...` |

## Recommended Setup

🏆 **Best: Casino on .shop domain**
```bash
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.shop/demogames
```
- ✅ Same domain = better SEO
- ✅ No CORS issues
- ✅ Shared cookies/session
- ✅ Better performance

⚠️ **Alternative: Casino on .online domain**
```bash
NEXT_PUBLIC_CASINO_URL=https://www.bullmoney.online/demogames
```
- ⚠️ Different domain = CORS required
- ⚠️ Slightly more complex setup
- ✅ Works with proper headers
