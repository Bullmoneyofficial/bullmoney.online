# 🚀 Casino Telegram Integration - Quick Setup Checklist

Use this checklist to get your casino Telegram bot up and running quickly.

## ☑️ Pre-Setup

- [ ] You have access to Supabase dashboard
- [ ] You have your Telegram bot token
- [ ] You have access to deployment environment (Vercel, etc.)

---

## 📝 Step-by-Step Setup

### 1️⃣ Database Setup (5 minutes)

- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `sql/casino_telegram_migration.sql`
- [ ] Paste and run the migration
- [ ] Verify by running: `SELECT column_name FROM information_schema.columns WHERE table_name = 'casino_users' AND column_name IN ('unique_id', 'tg_id', 'tg_bonus_used');`

**Result:** Should see 3 rows (unique_id, tg_id, tg_bonus_used)

---

### 2️⃣ Environment Variables (2 minutes)

- [ ] Open `.env.local` file
- [ ] Add: `CASINO_TELEGRAM_BOT_TOKEN=6345622919:AAFsKKK-fKux-gkk`
- [ ] Verify Supabase vars are set: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Save file
- [ ] Restart development server: `npm run dev`

**Test:** Check that `process.env.CASINO_TELEGRAM_BOT_TOKEN` is accessible in API routes

---

### 3️⃣ Deploy Changes (Variable)

- [ ] Commit new files to git
- [ ] Push to repository
- [ ] Deploy to production (Vercel auto-deploys)
- [ ] Add environment variables in Vercel dashboard:
  - `CASINO_TELEGRAM_BOT_TOKEN`
  - `NEXT_PUBLIC_SUPABASE_URL` (if not already set)
  - `SUPABASE_SERVICE_ROLE_KEY` (if not already set)
- [ ] Redeploy if needed

**Test:** Visit `https://yourdomain.com/api/casino/telegram/webhook` - should see JSON response

---

### 4️⃣ Register Webhook (2 minutes)

- [ ] Visit: `https://yourdomain.com/api/casino/telegram/webhook?action=setup`
- [ ] Should see: `{"success":true,"webhookUrl":"...","message":"Casino bot webhook registered!"}`
- [ ] Verify by visiting: `https://yourdomain.com/api/casino/telegram/webhook?action=info`
- [ ] Check that webhook URL matches your domain

**Troubleshooting:** If failed, check bot token and ensure URL is publicly accessible

---

### 5️⃣ Test Bot Commands (3 minutes)

- [ ] Open Telegram app
- [ ] Search for your casino bot (or use the bot username)
- [ ] Send: `/start`
- [ ] Should receive welcome message
- [ ] Generate a test bind code (see Step 6)
- [ ] Send: `/bind <your_test_code>`
- [ ] Should receive success or error message

**Note:** You need a casino account with a unique_id to test `/bind` properly

---

### 6️⃣ Frontend Integration (5 minutes)

Choose one option:

#### Option A: Simple (Recommended)
- [ ] Open `app/casino/page.tsx`
- [ ] Add import: `import { TelegramBonusCard } from '@/components/casino/TelegramBonusCard';`
- [ ] Add component above iframe: `<TelegramBonusCard className="mb-4" />`
- [ ] Save and test

#### Option B: Use Example
- [ ] Copy desired layout from `CASINO_PAGE_EXAMPLES.tsx`
- [ ] Replace contents of `app/casino/page.tsx`
- [ ] Customize as needed

**Test:** 
- [ ] Login to casino
- [ ] Navigate to `/casino`
- [ ] Should see Telegram bonus card
- [ ] Click copy button
- [ ] Verify code is copied to clipboard

---

### 7️⃣ Verification (5 minutes)

#### Test Complete Flow:
1. [ ] Create new casino account (or use test account)
2. [ ] Copy unique bind code from casino page
3. [ ] Open Telegram bot
4. [ ] Send `/start`
5. [ ] Send `/bind <code>`
6. [ ] Verify success message received
7. [ ] Check casino balance increased by 500 coins
8. [ ] Refresh casino page - card should show "✅ Telegram Linked!"
9. [ ] Try to bind again - should see "already claimed" error

**All steps passed?** ✅ Integration complete!

---

## 🔍 Quick Tests

### Test 1: API Route Working
```bash
curl https://yourdomain.com/api/casino/telegram/webhook
# Should return: {"ok":true,"message":"Casino Telegram Bot Webhook",...}
```

### Test 2: Webhook Registered
```bash
curl "https://yourdomain.com/api/casino/telegram/webhook?action=info"
# Should show webhook URL and status
```

### Test 3: User API Returns Telegram Data
```bash
# Login to casino first, then:
curl https://yourdomain.com/api/casino/user \
  -H "Cookie: casino_token=YOUR_TOKEN"
# Should include: unique_id, tg_id, tg_bonus_used
```

### Test 4: Component Renders
- [ ] Open browser dev tools
- [ ] Navigate to `/casino`
- [ ] Check Console for errors
- [ ] Verify TelegramBonusCard is visible
- [ ] Check Network tab for `/api/casino/user` call

---

## ⚠️ Common Issues

### Issue: Webhook not receiving messages
**Solution:** 
- Ensure webhook URL is **https** (not http)
- Verify URL is publicly accessible (not localhost)
- Check bot token is correct
- Delete webhook and re-register: `?action=delete` then `?action=setup`

### Issue: "User not found" when binding
**Solution:**
- Verify `unique_id` exists in database for that user
- Check `unique_id` matches exactly (case-sensitive)
- Run: `SELECT unique_id FROM casino_users WHERE id = YOUR_USER_ID;`

### Issue: Component not showing
**Solution:**
- Check user is logged in
- Verify import path is correct
- Check browser console for errors
- Ensure component file exists at `/components/casino/TelegramBonusCard.tsx`

### Issue: Bonus not awarded
**Solution:**
- Check `casino_settings` table has `telegram_bonus_amount` value
- Verify `tg_bonus_used` is `false` before binding
- Check database update succeeded
- Look at server logs for errors

---

## 📊 Success Metrics

After setup, monitor:

- [ ] Number of users who link Telegram (check tg_id not null)
- [ ] Bonus coins distributed (sum all telegram bonuses)
- [ ] Conversion rate (linked users / total users)
- [ ] Error rate in logs

**SQL Query:**
```sql
-- Count linked users
SELECT COUNT(*) as linked_users 
FROM casino_users 
WHERE tg_id IS NOT NULL;

-- Total bonus coins given
SELECT COUNT(*) * 500 as total_bonus_coins_distributed
FROM casino_users 
WHERE tg_bonus_used = true;

-- Users who haven't linked yet
SELECT COUNT(*) as not_linked
FROM casino_users 
WHERE tg_id IS NULL;
```

---

## 🎉 You're Done!

Your casino Telegram integration is now live! Users can:
- ✅ Link their Telegram accounts
- ✅ Receive 500 bonus coins
- ✅ See their status in a beautiful card
- ✅ Copy their bind code easily

**Next:** Check `CASINO_INTEGRATION_SUMMARY.md` for customization options and advanced features!

---

## 📞 Need Help?

1. Read `CASINO_TELEGRAM_SETUP.md` for detailed documentation
2. Check `CASINO_PAGE_EXAMPLES.tsx` for UI integration examples
3. Review `sql/casino_telegram_migration.sql` for database schema
4. Look at server logs for error messages
5. Test with `?action=info` to verify webhook status

**Pro Tip:** Use ngrok for local testing:
```bash
ngrok http 3000
# Then register webhook with ngrok URL
curl "https://your-ngrok-url.ngrok.io/api/casino/telegram/webhook?action=setup"
```
