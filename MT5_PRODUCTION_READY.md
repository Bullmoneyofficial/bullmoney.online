# 🎯 MT4/MT5 Production Setup - Quick Start

## ✅ Installation Complete

MetaAPI SDK has been successfully installed (107 packages added).

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get MetaAPI Token
1. Sign up (free): [https://app.metaapi.cloud/sign-up](https://app.metaapi.cloud/sign-up)
2. Get token: [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token)
3. Copy your token (starts with `eyJ...`)

### Step 2: Configure Environment
```bash
# Create .env.local file
cp .env.example .env.local

# Edit .env.local and add:
METAAPI_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...
METAAPI_REGION=new-york  # Choose closest to your broker
METAAPI_DEBUG=true       # Enable for testing
```

### Step 3: Get Broker Credentials
From your MT4/MT5 account, you need:
- **Server:** (e.g., `ICMarkets-Demo`)
- **Login:** (e.g., `12345678`)
- **Password:** (e.g., `Demo@123`)
- **Type:** MT4 or MT5

### Step 4: Test Connection
```bash
# Restart dev server
npm run dev

# Open Ultimate Hub → Broker tab → Connect
# Enter your credentials and click "Connect"
```

---

## 🔧 What's Been Updated

### API Routes (Now Production-Ready)
✅ [/app/api/broker/connect/route.ts](/app/api/broker/connect/route.ts) - Real MT4/MT5 connections  
✅ [/app/api/broker/trade/route.ts](/app/api/broker/trade/route.ts) - Live trade execution  
✅ [/app/api/broker/close/route.ts](/app/api/broker/close/route.ts) - Position closing  
✅ [/app/api/broker/accounts/route.ts](/app/api/broker/accounts/route.ts) - Account management (NEW)

### Frontend
✅ [/components/UltimateHub.tsx](/components/UltimateHub.tsx) - Updated to use MetaAPI accountId

### Documentation
✅ [METAAPI_SETUP.md](/METAAPI_SETUP.md) - Complete setup guide (READ THIS!)

---

## 🎮 Features Now Available

### ✅ Real Broker Connections
- Connect MT4 and MT5 accounts
- Support for 1000+ brokers worldwide
- Demo and Live account support
- Auto-reconnection on disconnect

### ✅ Live Trading
- One-click BUY/SELL execution
- Market orders with real prices
- Stop Loss & Take Profit support
- Real-time position monitoring

### ✅ Account Management
- View balance, equity, margin
- Monitor leverage and free margin
- Track open positions and orders
- Real-time P/L updates

---

## 📊 Demo vs Production Mode

### Demo Mode (No Token Required)
- Automatically fallback if `METAAPI_TOKEN` not set
- Mock data and simulated trades
- Perfect for UI testing
- No real money at risk

### Production Mode (Token Required)
- Real broker connections
- Live price feeds
- Actual trade execution
- Real P/L tracking

**💡 Current Status:** Demo mode (add `METAAPI_TOKEN` to enable production)

---

## 🔐 Security Notes

### ⚠️ IMPORTANT
- **NEVER** commit `.env.local` to Git
- **NEVER** expose `METAAPI_TOKEN` in frontend code
- **ALWAYS** use server-side API routes for broker operations
- **START** with demo accounts before live trading

### Environment Variables
```env
# ✅ SAFE - Only accessible on server
METAAPI_TOKEN=your_token_here

# ❌ UNSAFE - Would be exposed to browser
NEXT_PUBLIC_METAAPI_TOKEN=your_token_here  # DON'T DO THIS!
```

---

## 🧪 Testing Checklist

### Before Live Trading
- [ ] Connect demo MT4/MT5 account
- [ ] Execute test BUY trade
- [ ] Execute test SELL trade
- [ ] Close position successfully
- [ ] Verify balance updates
- [ ] Test with different symbols (Gold, EURUSD, BTCUSD)
- [ ] Test error handling (invalid credentials, etc.)

---

## 📈 Supported Brokers

MetaAPI supports **1000+ brokers** including:

**Forex Brokers:**
- IC Markets
- Pepperstone
- XM
- FXTM
- Admiral Markets
- OANDA
- Exness

**Crypto Brokers:**
- Roboforex
- FBS
- HotForex
- Alpari

**Check if your broker is supported:**  
[https://metaapi.cloud/docs/client/models/metaApiAccount/](https://metaapi.cloud/docs/client/models/metaApiAccount/)

---

## 🆘 Troubleshooting

### "Module not found: metaapi.cloud-sdk"
```bash
npm install metaapi.cloud-sdk --save
```

### "Invalid MetaAPI token"
- Check token at: [https://app.metaapi.cloud/token](https://app.metaapi.cloud/token)
- Verify `.env.local` has correct value
- Restart dev server after adding token

### "Invalid credentials"
- Verify server name (case-sensitive!)
- Test credentials in MT4/MT5 desktop app first
- Check if account is active (demo accounts expire)

### "Connection timeout"
- Choose MetaAPI region closest to broker
- Verify broker server is online
- Check firewall settings

---

## 📚 Documentation

**Full Setup Guide:**  
See [METAAPI_SETUP.md](/METAAPI_SETUP.md) for detailed instructions

**MetaAPI Docs:**
- [Getting Started](https://metaapi.cloud/docs/client/)
- [API Reference](https://metaapi.cloud/docs/client/reference/)
- [Code Examples](https://github.com/metaapi/metaapi-node.js-sdk/tree/master/examples)

**Support:**
- MetaAPI Discord: [discord.com/invite/9vVB44ZrNA](https://discord.com/invite/9vVB44ZrNA)
- Email: support@metaapi.cloud

---

## 🎉 Next Steps

1. **Get MetaAPI token** → [Sign up here](https://app.metaapi.cloud/sign-up)
2. **Add to `.env.local`** → Copy `.env.example` template
3. **Connect broker** → Ultimate Hub → Broker tab
4. **Test trades** → Start with 0.01 lot demo trades
5. **Go live** → Switch to real account when ready

**Ready to trade! 📊💰**

---

## 💰 Pricing

### Free Tier (Perfect for Testing)
- 2 accounts
- Unlimited trades
- Real-time streaming
- 30-second price delay

### Paid Plans (Production)
- **Starter:** $39/mo - 5 accounts, real-time prices
- **Pro:** $99/mo - 20 accounts, priority support
- **Enterprise:** Custom - unlimited accounts

[View Pricing →](https://metaapi.cloud/pricing)

---

**Questions?** Check [METAAPI_SETUP.md](/METAAPI_SETUP.md) or ask in Discord!
