# 🚀 BullMoney Push Notifications - Deployment Checklist

Use this checklist to ensure your push notification system is properly configured before going live.

---

## ✅ Pre-Deployment Checklist

### 1. Database Setup

- [ ] Supabase project created
- [ ] `push_subscriptions` table exists
- [ ] `vip_messages` table exists
- [ ] All indexes created
- [ ] Row Level Security policies configured (optional but recommended)
- [ ] Service role key has proper permissions

**Verify:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('push_subscriptions', 'vip_messages');
```

---

### 2. Environment Variables

#### Production Environment (Vercel/Render)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Generated with `npx web-push generate-vapid-keys`
- [ ] `VAPID_PRIVATE_KEY` - Private key (keep secret!)
- [ ] `VAPID_SUBJECT` - Your admin email (e.g., `mailto:admin@bullmoney.com`)
- [ ] `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather

**Verify:**
```bash
curl https://yourdomain.com/api/push/status
# All config values should be true
```

---

### 3. Telegram Bot Setup

- [ ] Bot created via @BotFather
- [ ] Bot token saved
- [ ] Bot added as admin to your Telegram channels
- [ ] Bot has permission to read messages
- [ ] Channel usernames/IDs added to `CHANNEL_MAP` in `/app/api/push/poll/route.ts`

**Verify:**
```bash
curl https://yourdomain.com/api/telegram/check
# Should show bot info and connected: true
```

---

### 4. Code Configuration

- [ ] `CHANNEL_MAP` updated with your channel usernames/IDs in `/app/api/push/poll/route.ts`
- [ ] Notification message templates customized (optional)
- [ ] `vercel.json` configured with cron job (or external cron set up)
- [ ] All API routes deployed

**Verify:**
```bash
# Test each endpoint
curl https://yourdomain.com/api/push/status
curl https://yourdomain.com/api/telegram/check
curl https://yourdomain.com/api/database/check
curl -X POST https://yourdomain.com/api/push/test
```

---

### 5. Service Worker

- [ ] `/public/sw.js` exists and is up to date
- [ ] Push notification handlers configured
- [ ] Service worker registering correctly in browser
- [ ] VAPID public key matches in service worker registration

**Verify:**
```javascript
// In browser console:
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker:', reg.active.state);
});
```

---

### 6. Cron Job Configuration

Choose ONE option:

#### Option A: Vercel Cron (Requires Pro Plan)

- [ ] `vercel.json` includes cron configuration
- [ ] Vercel Pro plan active
- [ ] Cron job verified in Vercel dashboard

**Verify in vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/push/poll",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service (Free)

- [ ] Account created on cron-job.org or similar
- [ ] Cron job configured to POST to `https://yourdomain.com/api/push/poll`
- [ ] Schedule set to every 30 minutes
- [ ] Test run successful

---

### 7. Testing

- [ ] Status endpoint returns all green ✅
- [ ] Test notification received successfully
- [ ] Subscribe/unsubscribe flow works
- [ ] Post to Telegram channel
- [ ] Wait 30 minutes (or manually trigger poll)
- [ ] Push notification received on device

**Manual Test Commands:**
```bash
# 1. Check status
curl https://yourdomain.com/api/push/status

# 2. Send test notification
curl -X POST https://yourdomain.com/api/push/test

# 3. Manually trigger polling (instant)
curl -X POST https://yourdomain.com/api/push/poll
```

---

### 8. Security

- [ ] Service role key never exposed to client
- [ ] VAPID private key stored securely
- [ ] Environment variables in production only (not in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] RLS policies configured in Supabase
- [ ] No sensitive data in logs

---

### 9. Monitoring

- [ ] Vercel/Render logs accessible
- [ ] Error tracking configured (Sentry, LogRocket, etc.) - optional
- [ ] Notification analytics endpoint working
- [ ] Database cleanup scheduled (optional)

**Set up cleanup cron (optional):**
```json
{
  "crons": [
    {
      "path": "/api/push/cleanup",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

---

### 10. Documentation

- [ ] Team knows how to trigger manual poll
- [ ] API endpoints documented
- [ ] Channel mapping documented
- [ ] Troubleshooting guide accessible

---

## 🔥 Go-Live Steps

### Final Verification (Do this right before launch)

1. **Status Check**
   ```bash
   curl https://yourdomain.com/api/push/status
   ```
   - ✅ All config values true
   - ✅ Database connected
   - ✅ Telegram connected

2. **Test End-to-End**
   - Subscribe on your device
   - Post to Telegram channel
   - Manually trigger: `curl -X POST https://yourdomain.com/api/push/poll`
   - Confirm notification received

3. **Monitor First Hour**
   - Check Vercel/Render logs
   - Verify cron executes successfully
   - Watch for errors

---

## 🐛 Troubleshooting Guide

### Issue: No notifications received

**Check:**
1. Status endpoint - all config true? `curl https://yourdomain.com/api/push/status`
2. Browser permission granted for notifications?
3. Service worker active? (Check browser DevTools → Application → Service Workers)
4. Subscription exists? `curl https://yourdomain.com/api/database/check`

**Fix:**
- Unsubscribe and re-subscribe
- Clear browser cache
- Check browser console for errors

---

### Issue: Telegram not polling

**Check:**
1. Bot is admin in channel? (Go to channel → Administrators)
2. Bot token correct? `curl https://yourdomain.com/api/telegram/check`
3. Channel username in `CHANNEL_MAP`?

**Fix:**
- Re-add bot to channel as admin
- Verify bot token in environment variables
- Post test message and manually poll: `curl -X POST https://yourdomain.com/api/push/poll`

---

### Issue: Cron not running

**Vercel:**
- Check Vercel dashboard → Cron Jobs
- Verify Pro plan active
- Check deployment logs

**External:**
- Check cron service dashboard
- Verify endpoint URL correct
- Check if cron hit the endpoint (Vercel logs)

**Fix:**
- Manual trigger works? If yes, cron is the issue
- Test with: `curl -X POST https://yourdomain.com/api/push/poll`

---

### Issue: Database errors

**Check:**
1. Tables exist? `curl https://yourdomain.com/api/database/check`
2. Service role key has permissions?
3. RLS policies blocking writes?

**Fix:**
- Re-run schema SQL in Supabase
- Verify service role key in env vars
- Check Supabase logs for SQL errors

---

## 📊 Success Metrics

After 24 hours, verify:

- [ ] At least 48 cron executions (every 30 min = 48/day)
- [ ] All Telegram posts captured
- [ ] Notifications sent successfully (check logs)
- [ ] No 500 errors in API routes
- [ ] Subscriptions table growing (users subscribing)

**Query metrics:**
```bash
# Get stats
curl https://yourdomain.com/api/push/status

# Check recent messages
curl https://yourdomain.com/api/database/check
```

---

## 🎉 Post-Launch

Once everything is working:

1. **Document your setup** - Channel IDs, cron schedule, etc.
2. **Set up monitoring** - Alerts for failed cron jobs
3. **Schedule maintenance** - Weekly cleanup of dead subscriptions
4. **Optimize** - Adjust polling frequency based on usage
5. **Scale** - Add more channels as needed

---

## 🆘 Emergency Contacts

If something breaks:

1. **Check logs first** - Vercel/Render dashboard
2. **Test endpoints** - Use curl commands above
3. **Manual override** - Trigger polling manually
4. **Rollback** - Redeploy previous version if needed

---

## ✨ You're Ready!

If all checkboxes are ✅, you're ready to deploy! 🚀

**Final Command:**
```bash
# Deploy to production
vercel --prod

# Immediately verify
curl https://yourdomain.com/api/push/status
curl -X POST https://yourdomain.com/api/push/test
```

Good luck! 🍀
