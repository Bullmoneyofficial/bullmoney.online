# Affiliate Code Batch Generation Guide

## Overview

This system bulk-generates unique affiliate codes for all existing users who don't have one yet. It's useful for:
- Onboarding existing users into the affiliate program
- Ensuring all users can share referral links
- One-time or periodic code generation

---

## API Endpoints

### GET `/api/recruit/batch-generate-codes`
**Check status** - How many users need codes?

```bash
curl -H "Authorization: Bearer YOUR_SECRET" \
  http://localhost:3000/api/recruit/batch-generate-codes
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "without_codes": 145,
    "with_codes": 892
  }
}
```

### POST `/api/recruit/batch-generate-codes`
**Generate codes** - Create codes for all users without one

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/recruit/batch-generate-codes \
  -d '{}'
```

**Response:**
```json
{
  "success": true,
  "message": "Generated affiliate codes for 145 users",
  "generated": 145,
  "failed": 0,
  "total_processed": 145,
  "failures": [],
  "details": {
    "samples": [
      {
        "userId": 1,
        "code": "JOH-X7K9M2P",
        "email": "john@example.com"
      }
    ]
  }
}
```

---

## Authentication

### Setting Up the Secret

The batch generation endpoint requires authentication. Set the secret in your environment:

**Local Development (.env.local):**
```env
AFFILIATE_BATCH_SECRET=your-secure-secret-here
```

**Production (Vercel):**
```bash
vercel env add AFFILIATE_BATCH_SECRET
# Enter: your-secure-secret-here
vercel deploy
```

---

## Usage

### Option 1: Using the Node.js Script (Recommended)

**Check status:**
```bash
node scripts/generate-affiliate-codes.mjs status
```

**Generate codes:**
```bash
node scripts/generate-affiliate-codes.mjs generate
```

**With custom API URL:**
```bash
API_URL=https://bullmoney.online \
AFFILIATE_BATCH_SECRET=your-secret \
node scripts/generate-affiliate-codes.mjs generate
```

### Option 2: Using the Bash Script

**Check status:**
```bash
./scripts/generate-affiliate-codes.sh status
```

**Generate codes:**
```bash
./scripts/generate-affiliate-codes.sh generate
```

### Option 3: Direct cURL

**Check how many users need codes:**
```bash
curl -H "Authorization: Bearer $AFFILIATE_BATCH_SECRET" \
  http://localhost:3000/api/recruit/batch-generate-codes
```

**Generate codes for all users:**
```bash
curl -X POST \
  -H "Authorization: Bearer $AFFILIATE_BATCH_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/recruit/batch-generate-codes \
  -d '{}'
```

---

## Code Generation Format

Each affiliate code follows this pattern:

```
[EMAIL_PREFIX]-[RANDOM_SUFFIX]
```

**Examples:**
- `john@example.com` → `JOH-X7K9M2P`
- `sarah.smith@email.com` → `SAR-K2L9Q4X`
- `alex123@domain.co` → `ALE-M8P3T6W`

**Rules:**
- Email prefix: First 3 letters of email (uppercase)
- Non-letters replaced with 'X'
- Suffix: 6 random alphanumeric characters (A-Z, 0-9)
- Format: `XXX-XXXXXX` (total 10 chars with hyphen)

---

## Features

✅ **Bulk Generation**
- Processes up to 10,000 users at once
- Parallel batch updates for speed

✅ **Uniqueness Guaranteed**
- Checks for collisions
- Retries up to 10 times per user
- Never overwrites existing codes

✅ **Safe & Idempotent**
- Only updates users with empty/null codes
- Won't regenerate for users who already have codes
- Can be run multiple times safely

✅ **Detailed Reporting**
- Shows success count
- Lists failures with reasons
- Provides sample codes generated
- Statistics on processed users

---

## Scheduling (Optional)

### Automatic Generation via Cron

**Vercel Cron Deployment:**

Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/recruit/batch-generate-codes",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

This runs every Sunday at midnight UTC.

---

## Verification

### Check the Database Directly

```sql
-- Count users with codes
SELECT COUNT(*) FROM recruits WHERE affiliate_code IS NOT NULL AND affiliate_code != '';

-- See sample generated codes
SELECT id, email, affiliate_code 
FROM recruits 
WHERE affiliate_code IS NOT NULL 
LIMIT 5;

-- Find users still without codes
SELECT COUNT(*) FROM recruits 
WHERE affiliate_code IS NULL OR affiliate_code = '';
```

---

## Troubleshooting

### "Unauthorized" Error
- Verify `AFFILIATE_BATCH_SECRET` is set correctly
- Check Bearer token format: `Bearer <secret>`

### "All users already have affiliate codes"
- Good news! All existing users have been set up
- New registrations will auto-generate codes via the individual API

### Some Users Failed
- Check failures array in response for specific errors
- Usually missing email or database connectivity issues
- Re-run to retry failed users

### Performance Issues
- The batch operation processes 10 users at a time
- Large deployments (10k+ users) may take 1-2 minutes
- Consider running during off-peak hours

---

## Post-Generation Steps

After generating codes for existing users:

1. **Notify Users** (Optional)
   - Email: "Your referral code is ready: {code}"
   - In-app notification or dashboard notification

2. **Verify Count**
   ```bash
   node scripts/generate-affiliate-codes.mjs status
   ```
   - Should show `without_codes: 0`

3. **Test Referral Links**
   - Get a sample code from the response
   - Test: `/register/pagemode?ref=CODE&aff_code=CODE`
   - Verify code auto-fills in Step 3

4. **Monitor**
   - Check logs for any errors
   - Verify `link_clicks` tracking works

---

## FAQ

**Q: What if a user already has a code?**
A: The API skips them - only generates for users with null/empty codes.

**Q: Can I customize the code format?**
A: Edit the `generateCode()` function in `route.ts` to change the format.

**Q: What about past referral codes people used?**
A: The system is forward-compatible. Existing `referred_by_code` entries aren't affected.

**Q: Can I regenerate codes for a specific user?**
A: Use the individual `/api/recruit/generate-affiliate-code` endpoint instead.

**Q: Is this production-safe?**
A: Yes! It only updates on null/empty codes and can be run multiple times safely.

---

## Related Documentation

- [Affiliate Dashboard](../AffiliateRecruitsDashboard.tsx) - Where affiliates manage their codes
- [Individual Code Generation](./route.ts) - Per-user code generation API
- [Pagemode Registration](../../../register/pagemode.tsx) - Where codes get auto-filled

