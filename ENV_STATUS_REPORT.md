# Environment Variables Status Report
Generated: 2026-02-11

## Root App (Next.js) - `/Users/justin/Documents/newbullmoney`

### Files Present:
- ✅ `.env.example` - Template with all variables documented
- ✅ `.env.local` - Active development environment
- ✅ `.env.production.example` - Production template

### Critical Variables Status:

#### ✅ CONFIGURED (Root App)
- `NEXT_PUBLIC_SUPABASE_URL` - Set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set
- `SUPABASE_SERVICE_ROLE_KEY` - Set
- `NEXT_PUBLIC_ADMIN_EMAIL` - Set to mrbullmoney@gmail.com
- `ADMIN_PASSWORD` - Set
- `MONGODB_URI` - Set
- `MONGODB_DB` - Set
- `TELEGRAM_BOT_TOKEN` - Set (main bot: 8554647051:AAE...)
- `NEXT_PUBLIC_CASINO_URL` - Set to https://bullmoney-casino.onrender.com
- `CASINO_BACKEND_URL` - Set to http://localhost:8000 (dev only)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Set
- `VAPID_PRIVATE_KEY` - Set
- `STRIPE_SECRET_KEY` - Set (test mode)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Set (test mode)
- `CMC_API_KEY` - Set
- `CRYPTOPANIC_TOKEN` - Set
- `SMTP_HOST/PORT/USER/PASS` - Gmail configured
- `CRYPTO_DATA_ENCRYPTION_KEY` - Set

#### ⚠️ MISSING/NEEDS ATTENTION (Root App)
1. **CASINO_TELEGRAM_BOT_TOKEN** - Not set (separate from main bot token)
   - Template shows: `CASINO_TELEGRAM_BOT_TOKEN=your_casino_telegram_bot_token_here`
   - Current .env.local: Missing this variable
   - **ACTION NEEDED**: Create separate bot at @BotFather for casino-specific features

2. **METAAPI_TOKEN** - Set to placeholder value
   - Current: `METAAPI_TOKEN=your_metaapi_token_here`
   - **ACTION NEEDED**: Get real token from https://app.metaapi.cloud/

3. **STRIPE_WEBHOOK_SECRET** - Set to placeholder
   - Current: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here`
   - **ACTION NEEDED**: Get from Stripe Dashboard → Webhooks

4. **SENDGRID_API_KEY** - Set to placeholder with X's
   - Current: `SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **ACTION NEEDED**: Get from SendGrid dashboard or remove if not using

5. **IFRAME_ALLOWED_ORIGINS** - Not in .env.local
   - Needed for production casino iframe embedding
   - **ACTION NEEDED**: Add to .env.local for testing

6. **NEXT_PUBLIC_ADMIN_PIN** - Not in .env.local
   - Template shows it's needed
   - **ACTION NEEDED**: Add secure PIN value

---

## Bullcasino (Laravel) - `/Users/justin/Documents/newbullmoney/Bullcasino`

### Files Present:
- ✅ `.env.example` - Laravel template
- ✅ `.env` - Active configuration
- ✅ `.env.demo` - Demo mode settings

### Critical Variables Status:

#### ✅ CONFIGURED (Bullcasino)
- `APP_NAME` - Set to Laravel (should be BullMoney Casino)
- `APP_ENV` - Set to local
- `APP_KEY` - Set to base64:QZwsa4x+WYNslE7BvCOHwWI8EZEKHRTqUxta1HX+akg=
- `APP_DEBUG` - Set to true (OK for dev, should be false in production)
- `APP_URL` - Set to http://localhost
- `DB_CONNECTION` - Set to sqlite (good for demo)
- Session, cache, queue drivers configured

#### ⚠️ MISSING/NEEDS ATTENTION (Bullcasino)

1. **Demo Mode Variables** - Not in .env file
   - From `.env.demo`:
     ```
     CASINO_DEMO_MODE=true
     CASINO_STARTING_BALANCE=10000
     CASINO_ALLOW_DEPOSITS=false
     CASINO_ALLOW_WITHDRAWALS=false
     CASINO_REAL_MONEY=false
     ```
   - **ACTION NEEDED**: Merge .env.demo variables into .env

2. **Site Configuration** - Not in .env file
   - From `.env.demo`:
     ```
     SITE_NAME="BullMoney Games"
     SITE_URL="https://bullmoney.shop"
     SUPPORT_EMAIL="support@bullmoney.shop"
     AGE_RESTRICTION=18
     LEGAL_NOTICE="Demo games only. No real money gambling..."
     ```
   - **ACTION NEEDED**: Add these to .env

3. **APP_URL** - Needs production value
   - Current: `http://localhost`
   - Production: `https://bullmoney-casino.onrender.com`
   - **ACTION NEEDED**: Should use ENV variable or be set properly

4. **Production Database** - Currently SQLite
   - For production deployment, consider:
     - PostgreSQL (Render provides this)
     - MySQL
     - Keep SQLite for demo (it's actually fine for this use case)

5. **CORS/Allowed Origins** - May need configuration
   - Laravel needs to know which origins can embed it
   - **ACTION NEEDED**: Check if CORS middleware is configured

---

## Deployment Checklist

### For Root App (Next.js) Deployment:
- [ ] Set all production URLs (NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_CASINO_URL)
- [ ] Generate and set CASINO_TELEGRAM_BOT_TOKEN
- [ ] Add NEXT_PUBLIC_ADMIN_PIN
- [ ] Add IFRAME_ALLOWED_ORIGINS with production domains
- [ ] Set real METAAPI_TOKEN (if using MT4/MT5 features)
- [ ] Set real STRIPE_WEBHOOK_SECRET (if using Stripe)
- [ ] Switch to production Stripe keys
- [ ] Verify MongoDB connection in production
- [ ] Test Telegram bot integration

### For Bullcasino (Laravel) Deployment:
- [ ] Merge .env.demo variables into .env
- [ ] Add site configuration variables
- [ ] Set APP_ENV=production
- [ ] Set APP_DEBUG=false
- [ ] Update APP_URL to production URL
- [ ] Configure CORS for parent app domains
- [ ] Ensure SQLite database path is writable
- [ ] Test database migrations
- [ ] Verify Docker build with all env vars

---

## Quick Fix Commands

### 1. Update Bullcasino .env with demo mode settings:
```bash
cd /Users/justin/Documents/newbullmoney/Bullcasino
cat .env.demo >> .env
```

### 2. Generate new Laravel APP_KEY (if needed):
```bash
cd /Users/justin/Documents/newbullmoney/Bullcasino
php artisan key:generate
```

### 3. Test environment loading:
```bash
# Root app
cd /Users/justin/Documents/newbullmoney
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.NEXT_PUBLIC_CASINO_URL)"

# Bullcasino
cd /Users/justin/Documents/newbullmoney/Bullcasino
php artisan env
```

---

## Security Recommendations

1. **Never commit** `.env`, `.env.local`, or `.env.production` files
2. **Rotate secrets regularly**, especially API keys and tokens
3. **Use different keys** for dev/staging/production
4. **Keep SUPABASE_SERVICE_ROLE_KEY secret** - it has full DB access
5. **Store production secrets** in platform env vars (Vercel, Render)
6. **Enable 2FA** on all service accounts (Stripe, Supabase, MongoDB, etc.)
