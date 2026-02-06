# Stripe Payment Integration Setup Guide

## 🎉 Complete Setup Instructions

Your site now has a secure Stripe payment system integrated! Follow these steps to get it running.

---

## 📋 Step 1: Create a Stripe Account (100% Free)

1. Go to **https://stripe.com**
2. Click **"Sign up"**
3. Complete the registration (takes 2 minutes)
4. Verify your email
5. You'll be in **TEST MODE** by default (perfect for development)

**Note:** Stripe is free to sign up. You only pay when you process real payments:
- **2.9% + 30¢** per successful card transaction
- No monthly fees, no setup fees, no hidden costs

---

## 📋 Step 2: Get Your API Keys

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com
2. Click **"Developers"** in the left sidebar
3. Click **"API keys"**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Safe for browser
   - **Secret key** (starts with `sk_test_...`) - ⚠️ KEEP THIS SECRET!

---

## 📋 Step 3: Add Keys to Your Environment

1. **Create `.env.local` file** in your project root:

```bash
cd /Users/justin/Documents/newbullmoney
touch .env.local
```

2. **Open `.env.local` and add your keys**:

```env
# Stripe API Keys (from Step 2)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**⚠️ IMPORTANT:** Never commit `.env.local` to Git! It's already in `.gitignore`.

---

## 📋 Step 4: Set Up Webhook for Order Fulfillment

Webhooks let Stripe notify your app when payments succeed.

### For Local Development:

1. **Install Stripe CLI**:
```bash
brew install stripe/stripe-cli/stripe
```

2. **Login to Stripe CLI**:
```bash
stripe login
```

3. **Forward webhooks to your local server**:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. **Copy the webhook signing secret** (starts with `whsec_...`)
5. **Add it to `.env.local`**:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
```

### For Production (Vercel/Live Site):

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** and add to your production environment variables

---

## 📋 Step 5: Test the Integration

1. **Restart your development server**:
```bash
npm run dev
```

2. **Go to your store**: http://localhost:3000/store

3. **Click any product** → **Tap to open quick view**

4. **Click "Buy Now with Stripe"**

5. **Use Stripe test cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires Auth: `4000 0025 0000 3155`
   - Use any future expiry date (e.g., `12/34`)
   - Use any 3-digit CVC (e.g., `123`)
   - Use any valid ZIP code

6. **Complete the test payment**

7. **Check your terminal** - you should see webhook logs!

---

## 🎯 What You Get Out of the Box

### ✅ Payment Methods Enabled:
- 💳 **Credit/Debit Cards** (Visa, Mastercard, Amex, etc.)
- 🍎 **Apple Pay** (automatically enabled)
- 🤖 **Google Pay** (automatically enabled)
- 💬 **Payment Request API** (Samsung Pay, etc.)

### ✅ Security Features:
- 🔒 **PCI DSS Compliant** (Stripe handles card data)
- 🛡️ **3D Secure / SCA** (Strong Customer Authentication)
- 🔐 **Fraud Detection** (Stripe Radar)
- ✅ **Webhook Signature Verification**

### ✅ Customer Experience:
- 📱 **Mobile Optimized**
- 🌍 **Multi-currency Support**
- 🎫 **Promo Codes**
- 📧 **Automatic Email Receipts**
- 📦 **Address Collection**

---

## 🔧 Customization Options

### Change Allowed Countries:
Edit `app/api/stripe/create-checkout-session/route.ts`:
```typescript
shipping_address_collection: {
  allowed_countries: ['US', 'CA', 'GB', 'AU', 'ZA', 'DE', 'FR'], // Add more
},
```

### Enable Stripe Tax (Automatic Tax Calculation):
```typescript
automatic_tax: {
  enabled: true,
},
```
**Note:** Requires Stripe Tax setup in dashboard.

### Add Subscription Support:
Change mode from `'payment'` to `'subscription'` in the checkout session.

---

## 📊 Monitoring & Testing

### View Payments:
- **Dashboard**: https://dashboard.stripe.com/test/payments
- **Logs**: https://dashboard.stripe.com/test/logs
- **Events**: https://dashboard.stripe.com/test/events

### Test Different Scenarios:
```typescript
// In your test, use these cards:
'4242 4242 4242 4242' // Success
'4000 0000 0000 9995' // Insufficient funds
'4000 0000 0000 0069' // Expired card
'4000 0025 0000 3155' // Requires authentication
```

---

## 🚀 Going Live (When Ready)

1. **Complete Stripe Account Activation**:
   - Add business details
   - Verify identity
   - Add bank account for payouts

2. **Switch to Live Mode**:
   - Get **LIVE** API keys (start with `pk_live_...` and `sk_live_...`)
   - Update `.env.local` with live keys
   - Set up production webhook endpoint

3. **Update Environment Variables** on Vercel/your host:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

4. **Test with real card** (you can refund yourself)

5. **Go live! 🎉**

---

## 🆘 Troubleshooting

### "Stripe failed to load"
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is in `.env.local`
- Restart dev server after adding environment variables

### "Checkout session creation failed"
- Check `STRIPE_SECRET_KEY` is correct
- Check API is reachable
- Look for errors in terminal

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` matches CLI/dashboard
- Ensure raw body is being used (already configured)

### Payments work but orders not saving
- Check webhook is reaching your server
- Check `/api/stripe/webhook` logs in terminal
- Implement order saving logic in webhook handler

---

## 📚 Next Steps

1. **Implement Order Saving**: Update `app/api/stripe/webhook/route.ts` to save orders to your database
2. **Send Confirmation Emails**: Add email service to webhook handler
3. **Update Inventory**: Decrease stock count after successful payment
4. **Add Order Tracking**: Create order history page for customers

---

## 💡 Pro Tips

- **Always test in TEST mode first**
- **Use webhook events, not client-side redirects** for critical logic
- **Store order data when webhook fires, not on redirect**
- **Stripe handles PCI compliance** - never store card numbers
- **Enable Stripe Radar** for fraud prevention (free tier available)

---

## 📖 Official Documentation

- **Stripe Docs**: https://stripe.com/docs
- **Checkout**: https://stripe.com/docs/payments/checkout
- **Webhooks**: https://stripe.com/docs/webhooks
- **Testing**: https://stripe.com/docs/testing

---

## ✅ You're All Set!

Your store now has enterprise-grade payment processing! 🎉

**Questions?** Check Stripe's excellent documentation or their support team.
