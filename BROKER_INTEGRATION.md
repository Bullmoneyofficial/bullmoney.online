# 🔗 Broker Integration - MT4/MT5 Setup Guide

## Overview

The **Broker tab** in Ultimate Hub allows seamless one-click trading integration with MetaTrader 4 and MetaTrader 5 platforms.

## Features

✅ **One-Click Trading** - Execute BUY/SELL orders instantly  
✅ **Live Account Sync** - Real-time balance, equity, margin tracking  
✅ **Position Management** - View and close open positions  
✅ **Pending Orders** - Monitor and cancel pending orders  
✅ **Multi-Symbol Support** - Trade Gold, Bitcoin, Forex, and more  
✅ **Risk Management** - Built-in lot size calculator and warnings

## Demo Mode (Current Implementation)

The current implementation uses **demo/mock data** for testing purposes:

- Demo account with $10,000 balance
- Simulated positions and orders
- No real broker connection required
- Perfect for UI testing and feature demonstration

## Production Setup (Integration Guide)

### Option 1: MetaAPI (Recommended)

[MetaAPI](https://metaapi.cloud/) provides a cloud-based REST API for MT4/MT5.

```typescript
// Example integration
const response = await fetch('/api/broker/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'mt5',
    apiKey: 'YOUR_METAAPI_KEY',
    accountId: 'YOUR_ACCOUNT_ID'
  })
});
```

**Benefits:**
- No server setup required
- Cloud-hosted bridge
- WebSocket support for real-time updates
- Supports 1000+ brokers

**Pricing:** Free tier available, paid plans start at $39/month

---

### Option 2: ZeroMQ Bridge

Set up a local bridge between MT4/MT5 and your web app.

**Requirements:**
- MT4/MT5 Expert Advisor (EA) with ZeroMQ
- Python/Node.js bridge server
- VPS or local machine running 24/7

**Setup Steps:**

1. **Install MT4/MT5 EA:**
```mql4
// MQL4/MQL5 Expert Advisor
#include <Zmq/Zmq.mqh>

Context context;
Socket socket(context, ZMQ_REP);

void OnInit() {
  socket.bind("tcp://*:5555");
}

void OnTick() {
  // Handle incoming trade requests
  ZmqMsg request;
  socket.recv(request);
  
  string command = request.getData();
  // Execute trade based on command
  
  ZmqMsg reply("Order executed");
  socket.send(reply);
}
```

2. **Bridge Server (Node.js):**
```javascript
const zmq = require('zeromq');
const sock = zmq.socket('req');

sock.connect('tcp://localhost:5555');

app.post('/api/broker/trade', async (req, res) => {
  const { symbol, side, volume } = req.body;
  const command = JSON.stringify({ symbol, side, volume });
  
  sock.send(command);
  sock.on('message', (msg) => {
    res.json({ success: true, result: msg.toString() });
  });
});
```

---

### Option 3: FIX Protocol (Institutional)

For high-frequency trading and institutional-grade connectivity.

**Requirements:**
- FIX engine (QuickFIX/J, OnixS)
- Broker supporting FIX API
- Deep technical knowledge

**Use Cases:**
- Algorithmic trading
- Sub-millisecond execution
- Direct market access (DMA)

---

## API Routes

### `/api/broker/connect` (POST)

Connect to MT4/MT5 broker.

**Request:**
```json
{
  "type": "mt4" | "mt5",
  "server": "demo.broker.com",
  "login": "12345678",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "accountNumber": "12345678",
    "balance": 10000.00,
    "equity": 10245.50,
    "margin": 245.50,
    "freeMargin": 9754.50
  },
  "positions": [...],
  "orders": [...]
}
```

---

### `/api/broker/trade` (POST)

Execute a trade.

**Request:**
```json
{
  "brokerType": "mt5",
  "symbol": "XAUUSD",
  "side": "buy",
  "volume": 0.01
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ABC123",
  "executionPrice": 2653.50,
  "positions": [...]
}
```

---

### `/api/broker/close` (POST)

Close a position.

**Request:**
```json
{
  "brokerType": "mt5",
  "positionId": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "closingProfit": 24.50,
  "positions": [...]
}
```

---

## Security Best Practices

⚠️ **IMPORTANT:** Never store broker credentials in frontend code!

1. **Use Environment Variables:**
```env
MT4_API_KEY=your_api_key_here
MT5_SERVER=your_broker_server
```

2. **Server-Side Authentication:**
   - Store credentials in database (encrypted)
   - Use session tokens
   - Implement 2FA for broker connections

3. **Rate Limiting:**
   - Prevent API abuse
   - Max 10 trades per minute
   - Monitor for unusual activity

4. **HTTPS Only:**
   - Always use SSL/TLS
   - Secure WebSocket connections (wss://)

---

## Broker Compatibility

### Supported Brokers (MetaAPI)

✅ IC Markets  
✅ Pepperstone  
✅ OANDA  
✅ XM  
✅ FXTM  
✅ Admiral Markets  
✅ 1000+ more brokers

### Requirements

- Broker must support MT4 or MT5
- API access enabled (some brokers require approval)
- Account type: Demo or Live

---

## Troubleshooting

### Connection Failed

**Problem:** "Failed to connect to broker"

**Solutions:**
1. Check server address (e.g., `demo.icmarkets.com:443`)
2. Verify login/password
3. Ensure broker allows API access
4. Check firewall settings

---

### Trade Execution Failed

**Problem:** "Trade failed" error

**Solutions:**
1. Check account balance
2. Verify symbol name (XAUUSD vs GOLD)
3. Check market hours (Forex closed on weekends)
4. Ensure sufficient margin

---

### Real-Time Updates Not Working

**Problem:** Positions not updating

**Solutions:**
1. Implement WebSocket connection
2. Poll `/api/broker/positions` every 1-2 seconds
3. Use MetaAPI streaming quotes

---

## Future Enhancements

🔮 **Planned Features:**

- [ ] Copy Trading (mirror VIP signals)
- [ ] Auto-sync trades to Trading Journal
- [ ] Risk calculator with position sizing
- [ ] Multi-account support
- [ ] Trade templates (save/load settings)
- [ ] Price alerts with push notifications
- [ ] Historical trade analytics
- [ ] Backtesting integration

---

## Resources

📚 **Documentation:**
- [MetaAPI Docs](https://metaapi.cloud/docs/)
- [MT4 MQL4 Reference](https://docs.mql4.com/)
- [MT5 MQL5 Reference](https://www.mql5.com/en/docs)

🛠️ **Tools:**
- [MetaEditor](https://www.metatrader4.com/en/trading-platform/help/userguide/autotrading) - Write MT4/MT5 Expert Advisors
- [ZeroMQ Library](https://github.com/dingmaotu/mql-zmq) - MQL ZeroMQ bindings
- [QuickFIX](https://www.quickfixengine.org/) - FIX Protocol engine

---

## Support

For implementation assistance:
- Email: support@bullmoney.online
- Discord: [Join Server](https://discord.com/invite/9vVB44ZrNA)
- Telegram: [@bullmoneywebsite](https://t.me/bullmoneywebsite)

---

**⚡ Pro Tip:** Start with MetaAPI for the easiest integration. Their free tier is perfect for testing!
