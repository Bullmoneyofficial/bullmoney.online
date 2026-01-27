# 🚀 MetaAPI Production Setup Guide

## Complete MT4/MT5 Integration for Live & Demo Trading

This guide will help you set up **real broker connections** using MetaAPI for production and testing.

---

## 📋 Prerequisites

1. **MetaAPI Account** (Free tier available)
2. **MT4 or MT5 Broker Account** (Demo or Live)
3. Your broker must be supported by MetaAPI (1000+ brokers supported)

---

## Step 1: Create MetaAPI Account

### 1.1 Sign Up
1. Go to [https://app.metaapi.cloud/sign-up](https://app.metaapi.cloud/sign-up)
2. Create a free account (no credit card required for testing)
3. Verify your email

### 1.2 Get API Token
1. Log in to [https://app.metaapi.cloud/](https://app.metaapi.cloud/)
2. Navigate to **"API Tokens"** in the sidebar
3. Click **"Generate New Token"**
4. Copy your token (starts with `eyJ...`)

**⚠️ IMPORTANT:** Keep this token secret! Never commit it to Git.

---

## Step 2: Configure Environment Variables

### 2.1 Copy Example File
```bash
cp .env.example .env.local
```

### 2.2 Add Your Token
Open `.env.local` and add:

```env
# MetaAPI Token (from https://app.metaapi.cloud/token)
METAAPI_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...

# Optional: Choose region closest to your broker
METAAPI_REGION=new-york

# Optional: Enable debug logging
METAAPI_DEBUG=true
```

### 2.3 Available Regions
- `new-york` (US East - Default)
- `london` (Europe)
- `singapore` (Asia Pacific)
- `mumbai` (India)
- `frankfurt` (Germany)
- `tokyo` (Japan)
- `sao-paulo` (Brazil)

**💡 Tip:** Choose the region closest to your broker's server for lowest latency.

---

## Step 3: Get Broker Credentials

You need these details from your MT4/MT5 account:

### For Demo Accounts:
1. Download MT4/MT5 from your broker
2. Open a demo account
3. Note down:
   - **Server name** (e.g., `ICMarkets-Demo`)
   - **Login number** (e.g., `12345678`)
   - **Password** (e.g., `Demo@123`)
   - **Platform type** (MT4 or MT5)

### For Live Accounts:
1. Use your real trading account credentials
2. **⚠️ WARNING:** Live trading involves real money risk!
3. Start with demo accounts for testing

### Supported Brokers (Examples):
✅ IC Markets  
✅ Pepperstone  
✅ XM  
✅ FXTM  
✅ Admiral Markets  
✅ OANDA  
✅ Exness  
✅ FBS  
✅ HotForex  
✅ AvaTrade  
...and 1000+ more!

**Check compatibility:** [https://metaapi.cloud/docs/client/models/metaApiAccount/](https://metaapi.cloud/docs/client/models/metaApiAccount/)

---

## Step 4: Connect Your First Account

### Option A: Via Ultimate Hub UI

1. Open your website
2. Click the **FPS Pill** → Open Ultimate Hub
3. Navigate to **"Broker"** tab
4. Click **"Connect"**
5. Choose **MT4** or **MT5**
6. Enter your credentials:
   - Server: `Your-Broker-Server`
   - Login: `Your-Login-Number`
   - Password: `Your-Password`
7. Click **"Connect"**

**First connection takes 30-60 seconds** as MetaAPI deploys your account.

### Option B: Via API (Programmatic)

```bash
curl -X POST http://localhost:3000/api/broker/connect \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mt5",
    "server": "ICMarkets-Demo",
    "login": "12345678",
    "password": "Demo@123",
    "demo": true
  }'
```

---

## Step 5: Test Trading

### Execute Your First Trade

1. In Ultimate Hub → Broker tab
2. Connected account should show balance
3. Select a symbol (e.g., **Gold**)
4. Set lot size (e.g., **0.01**)
5. Click **BUY** or **SELL**

**✅ Trade should execute in ~500ms!**

### Check Positions
- View open trades in "Open Positions" section
- Monitor real-time P/L
- Close positions with one click

---

## Step 6: Verify Connection

### Check Account Status

```bash
# List all connected accounts
curl http://localhost:3000/api/broker/accounts
```

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "abc123-def456",
      "name": "MT5 - 12345678",
      "login": "12345678",
      "server": "ICMarkets-Demo",
      "platform": "mt5",
      "state": "DEPLOYED",
      "connectionStatus": "CONNECTED"
    }
  ],
  "count": 1
}
```

### Check Connection in MetaAPI Dashboard
1. Go to [https://app.metaapi.cloud/accounts](https://app.metaapi.cloud/accounts)
2. You should see your connected account
3. Status should be **"Connected"**

---

## Common Connection Issues

### ❌ "Invalid credentials"
**Solution:**
- Double-check server name (case-sensitive!)
- Verify login and password
- Try logging into MT4/MT5 desktop app first

### ❌ "Connection timeout"
**Solution:**
- Check if broker server is online
- Verify server name is correct
- Try different MetaAPI region

### ❌ "Account not found"
**Solution:**
- Broker may not be supported by MetaAPI
- Contact MetaAPI support: [support@metaapi.cloud](mailto:support@metaapi.cloud)

### ❌ "Trading disabled"
**Solution:**
- Enable AutoTrading in MT4/MT5 settings
- Check if account has trading restrictions
- Verify account is not expired (demo accounts expire)

---

## Advanced Features

### Real-Time Price Streaming

MetaAPI automatically streams live prices. Access them via:

```typescript
const connection = account.getStreamingConnection();
await connection.connect();

connection.addSynchronizationListener({
  onSymbolPriceUpdated: (price) => {
    console.log('Price update:', price.symbol, price.bid, price.ask);
  }
});
```

### Trade History

```typescript
const history = await connection.getHistoryOrdersByTimeRange(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  new Date()
);
```

### Account Metrics

```typescript
const metrics = await account.getMetrics();
console.log('Trades:', metrics.trades);
console.log('Balance:', metrics.balance);
console.log('Equity:', metrics.equity);
```

---

## Pricing & Limits

### Free Tier (Perfect for Testing)
- ✅ Up to **2 accounts**
- ✅ Unlimited trades
- ✅ Real-time streaming
- ✅ Full API access
- ⏱️ 30-second price delay on free tier

### Paid Plans (For Production)
- **Starter:** $39/month - 5 accounts, real-time prices
- **Pro:** $99/month - 20 accounts, priority support
- **Enterprise:** Custom pricing - unlimited accounts

**💡 Recommendation:** Start with free tier, upgrade when you need real-time prices.

[View Pricing](https://metaapi.cloud/pricing)

---

## Security Best Practices

### 1. Never Expose Credentials
```typescript
// ❌ BAD - Never do this!
const password = "mypassword123";

// ✅ GOOD - Use environment variables
const password = process.env.BROKER_PASSWORD;
```

### 2. Use Server-Side APIs Only
- Never call MetaAPI from frontend
- All broker operations must go through Next.js API routes
- This protects your MetaAPI token

### 3. Encrypt Stored Credentials
If you store broker credentials in a database:
```typescript
import bcrypt from 'bcrypt';

// Encrypt before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Decrypt before using
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 4. Implement Rate Limiting
```typescript
// Prevent API abuse - max 10 trades per minute per user
const rateLimit = {
  max: 10,
  windowMs: 60000
};
```

---

## Monitoring & Logging

### Enable Debug Logs
```env
METAAPI_DEBUG=true
```

### Check Logs
```bash
# View API logs
tail -f .next/server/logs/broker.log

# Or check browser console (Network tab)
```

### MetaAPI Dashboard
Monitor all activity at: [https://app.metaapi.cloud/activity](https://app.metaapi.cloud/activity)

---

## Database Integration (Optional)

To save user broker accounts to your database:

### Schema
```sql
CREATE TABLE broker_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  metaapi_account_id TEXT UNIQUE,
  broker_name TEXT,
  account_login TEXT,
  account_type TEXT, -- 'demo' or 'live'
  platform TEXT, -- 'mt4' or 'mt5'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Save Account
```typescript
const { data } = await supabase
  .from('broker_accounts')
  .insert({
    user_id: userId,
    metaapi_account_id: account.id,
    broker_name: accountInfo.company,
    account_login: accountInfo.login,
    account_type: demo ? 'demo' : 'live',
    platform: type
  });
```

---

## Troubleshooting

### Problem: "Module not found: metaapi.cloud-sdk"
**Solution:**
```bash
npm install metaapi.cloud-sdk --save
```

### Problem: Trades not executing
**Check:**
1. Market hours (Forex closed on weekends)
2. Account balance (sufficient funds?)
3. Symbol name (use exact broker naming)
4. Trading permissions in MT4/MT5

### Problem: Slow connection
**Solutions:**
- Change to closer MetaAPI region
- Check broker server status
- Verify internet connection

---

## Next Steps

✅ Set up MetaAPI token  
✅ Connect demo account  
✅ Execute test trades  
✅ Monitor positions  
✅ Close positions  

**Ready for production?**
1. Switch to live account credentials
2. Test with small trades first
3. Implement proper risk management
4. Set up monitoring and alerts

---

## Support & Resources

📚 **Documentation:**
- [MetaAPI Docs](https://metaapi.cloud/docs/)
- [API Reference](https://metaapi.cloud/docs/client/)
- [SDK Examples](https://github.com/metaapi/metaapi-node.js-sdk/tree/master/examples)

💬 **Community:**
- [Discord Server](https://discord.com/invite/9vVB44ZrNA)
- [Telegram](https://t.me/bullmoneywebsite)

📧 **Email Support:**
- MetaAPI: support@metaapi.cloud
- BullMoney: support@bullmoney.online

---

## 🎉 Congratulations!

You now have a **fully operational broker integration** with real MT4/MT5 accounts!

**Happy Trading! 📈💰**
