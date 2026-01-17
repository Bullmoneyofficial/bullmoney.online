-- ============================================
-- BULL FEED DUMMY DATA FOR TESTING
-- Run this in Supabase SQL Editor after running 001_bull_feed_schema.sql
-- ============================================

-- First, let's make sure the analyses table has all the required columns
-- (Safe to run multiple times with IF NOT EXISTS)

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 5;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'deep_dive';
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS rich_content JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS chart_config JSONB;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tickers TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS bull_score INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS is_pro_only BOOLEAN DEFAULT false;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS reaction_counts JSONB DEFAULT '{"bull": 0, "bear": 0, "save": 0}'::jsonb;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Update content_type constraint to include new types
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_content_type_check;
ALTER TABLE analyses ADD CONSTRAINT analyses_content_type_check 
  CHECK (content_type IN ('deep_dive', 'market_pulse', 'blog_post', 'quick_take', 'trade_idea', 'educational'));

-- Enable public read access (allow anonymous reads for testing)
DROP POLICY IF EXISTS "Public read access for analyses" ON analyses;
CREATE POLICY "Public read access for analyses" 
  ON analyses FOR SELECT 
  USING (true);

-- Allow public inserts for testing (remove in production!)
DROP POLICY IF EXISTS "Public insert access for analyses" ON analyses;
CREATE POLICY "Public insert access for analyses" 
  ON analyses FOR INSERT 
  WITH CHECK (true);

-- Allow public updates for testing (remove in production!)
DROP POLICY IF EXISTS "Public update access for analyses" ON analyses;
CREATE POLICY "Public update access for analyses" 
  ON analyses FOR UPDATE 
  USING (true);

-- ============================================
-- CLEAR EXISTING TEST DATA (Optional)
-- ============================================

-- Uncomment to clear existing data:
-- DELETE FROM analyses WHERE title LIKE '[TEST]%';

-- ============================================
-- INSERT DUMMY ANALYSES
-- ============================================

INSERT INTO analyses (
  title, 
  content, 
  market, 
  direction, 
  pair, 
  entry_price, 
  target_price, 
  stop_loss, 
  image_url, 
  is_published, 
  confidence_score,
  content_type,
  tickers,
  view_count,
  bull_score,
  reaction_counts,
  comment_count,
  chart_config
) VALUES 

-- 1. EUR/USD Bullish Setup
(
  'EUR/USD Breaking Out - Major Buy Opportunity',
  'The EUR/USD pair is showing strong bullish momentum after breaking above the key 1.0850 resistance level. The weekly chart confirms a double bottom pattern with RSI divergence suggesting further upside.

Key Technical Analysis:
• Double bottom pattern confirmed at 1.0700
• RSI showing bullish divergence from lows
• 50 EMA crossing above 200 EMA (Golden Cross forming)
• Volume increasing on breakout candles

Fundamental Backdrop:
The ECB''s hawkish stance combined with recent weakness in US economic data supports EUR strength. Expect further upside as rate differential narratives shift.

Risk Management:
Keep position sizes moderate. This is a swing trade setup with 2-3 week holding period expected.',
  'forex',
  'bullish',
  'EUR/USD',
  1.0850,
  1.1100,
  1.0750,
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
  true,
  8,
  'deep_dive',
  ARRAY['EURUSD', 'EUR', 'USD'],
  1250,
  85,
  '{"bull": 42, "bear": 8, "save": 15}'::jsonb,
  12,
  '{"symbol": "FX:EURUSD", "interval": "D"}'::jsonb
),

-- 2. Bitcoin Analysis
(
  'BTC Consolidation Before Next Leg Up',
  'Bitcoin is currently in a healthy consolidation phase after the recent rally to $68K. The structure remains bullish with higher lows forming on the 4H chart.

Key Levels to Watch:
• Support: $64,500 - $65,000 zone
• Resistance: $68,500 then $71,000
• Invalidation: Below $62,000

On-Chain Data:
Exchange outflows continue to be strong, suggesting accumulation. Long-term holder supply is at ATH which is typically bullish for price.

My Trade Plan:
Looking to add on any dips to the $64K-$65K zone with stops below $62K. Target remains $75K for this move.',
  'crypto',
  'bullish',
  'BTC/USD',
  65000,
  75000,
  62000,
  'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
  true,
  7,
  'trade_idea',
  ARRAY['BTC', 'BTCUSD', 'Bitcoin'],
  2340,
  120,
  '{"bull": 89, "bear": 23, "save": 45}'::jsonb,
  34,
  '{"symbol": "BINANCE:BTCUSDT", "interval": "4H"}'::jsonb
),

-- 3. Gold Quick Take
(
  'Gold Testing Key Support - Watch $2,300',
  'Quick update on Gold (XAU/USD):

Currently testing the $2,300 support zone which has held multiple times. If this level breaks, we could see acceleration to $2,250.

Staying neutral here until we get a clear direction. Watch for Fed commentary this week.',
  'forex',
  'neutral',
  'XAU/USD',
  2300,
  2380,
  2250,
  NULL,
  true,
  5,
  'quick_take',
  ARRAY['GOLD', 'XAUUSD', 'XAU'],
  890,
  45,
  '{"bull": 28, "bear": 31, "save": 8}'::jsonb,
  7,
  '{"symbol": "TVC:GOLD", "interval": "1H"}'::jsonb
),

-- 4. NVIDIA Stock Analysis
(
  'NVDA Pullback - Buying Opportunity?',
  'NVIDIA has pulled back 15% from its all-time highs, presenting a potential buying opportunity for those who missed the AI rally.

Technical Picture:
• Testing the 50-day MA support
• RSI oversold on daily (32)
• Volume declining on the pullback (healthy)

Fundamental View:
AI demand remains insanely strong. Data center revenue continues to grow exponentially. The pullback is more about profit-taking than fundamental concerns.

My Take:
Starting to build a position here. Will add more if we see $800. Stop loss at $750.',
  'stocks',
  'bullish',
  'NVDA',
  850,
  1000,
  750,
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800',
  true,
  8,
  'deep_dive',
  ARRAY['NVDA', 'NVIDIA'],
  3200,
  156,
  '{"bull": 112, "bear": 18, "save": 67}'::jsonb,
  45,
  '{"symbol": "NASDAQ:NVDA", "interval": "D"}'::jsonb
),

-- 5. GBP/JPY Bearish Setup
(
  'GBP/JPY Reversal Pattern Forming',
  'Spotted a potential head and shoulders pattern on GBP/JPY. The neckline sits around 188.50.

If we break below, targets would be:
• TP1: 186.00
• TP2: 183.50

Stop above right shoulder at 191.00

Risk:Reward is excellent here at roughly 1:3.',
  'forex',
  'bearish',
  'GBP/JPY',
  188.50,
  183.50,
  191.00,
  NULL,
  true,
  7,
  'trade_idea',
  ARRAY['GBPJPY', 'GBP', 'JPY'],
  670,
  38,
  '{"bull": 15, "bear": 34, "save": 12}'::jsonb,
  9,
  '{"symbol": "FX:GBPJPY", "interval": "4H"}'::jsonb
),

-- 6. ETH Educational Post
(
  'Understanding Ethereum Gas Fees',
  'A lot of new traders ask about Ethereum gas fees. Here''s a quick educational breakdown:

What Are Gas Fees?
Gas fees are the costs you pay to execute transactions on Ethereum. They go to validators who process your transactions.

Why Do They Fluctuate?
• Network congestion increases fees
• Complex transactions (smart contracts) cost more
• Time of day matters - less activity = lower fees

Tips to Save on Gas:
1. Use Layer 2 solutions (Arbitrum, Optimism)
2. Time your transactions during low activity
3. Set custom gas limits
4. Use gas tracking tools

This is essential knowledge for any crypto trader!',
  'crypto',
  'neutral',
  'ETH/USD',
  NULL,
  NULL,
  NULL,
  'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800',
  true,
  6,
  'educational',
  ARRAY['ETH', 'Ethereum', 'GAS'],
  1560,
  72,
  '{"bull": 45, "bear": 5, "save": 89}'::jsonb,
  23,
  NULL
),

-- 7. S&P 500 Market Pulse
(
  'SPX Weekly Market Pulse - Jan 17, 2026',
  'Weekly market roundup for S&P 500:

This Week''s Action:
• SPX up 1.2% for the week
• Tech leading with FAANG stocks strong
• VIX dropped to 13.5 (low volatility)

Key Events Next Week:
• Fed speakers on Tuesday
• CPI data Wednesday
• Bank earnings Friday

My Positioning:
Staying long with trailing stops. No reason to fight the trend here. Will reassess after CPI.',
  'indices',
  'bullish',
  'SPX',
  5800,
  6000,
  5650,
  NULL,
  true,
  6,
  'market_pulse',
  ARRAY['SPX', 'SPY', 'ES'],
  2100,
  95,
  '{"bull": 67, "bear": 22, "save": 34}'::jsonb,
  18,
  '{"symbol": "SP:SPX", "interval": "W"}'::jsonb
),

-- 8. Solana Quick Take
(
  'SOL Looking Strong - Bullish Setup',
  'Solana showing relative strength vs BTC today. 

Key observations:
• Breaking out of falling wedge
• Volume picking up
• DEX volume on Solana surging

Looking for entries around $140 with stops at $125. Target $180+',
  'crypto',
  'bullish',
  'SOL/USD',
  140,
  180,
  125,
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
  true,
  7,
  'quick_take',
  ARRAY['SOL', 'SOLANA', 'SOLUSD'],
  980,
  58,
  '{"bull": 52, "bear": 12, "save": 19}'::jsonb,
  14,
  '{"symbol": "BINANCE:SOLUSDT", "interval": "4H"}'::jsonb
),

-- 9. USD/CAD Analysis
(
  'USD/CAD Range Trade Setup',
  'USD/CAD has been stuck in a range for the past 3 weeks. Here''s how I''m playing it:

The Range:
• Support: 1.3400
• Resistance: 1.3550

Strategy:
Buying at support, selling at resistance with tight stops outside the range. Simple but effective in ranging markets.

Catalyst Watch:
Canadian CPI and BOC rate decision could break this range. Size positions accordingly.',
  'forex',
  'neutral',
  'USD/CAD',
  1.3400,
  1.3550,
  1.3350,
  NULL,
  true,
  6,
  'trade_idea',
  ARRAY['USDCAD', 'USD', 'CAD'],
  540,
  32,
  '{"bull": 18, "bear": 16, "save": 8}'::jsonb,
  5,
  '{"symbol": "FX:USDCAD", "interval": "4H"}'::jsonb
),

-- 10. Apple Stock Deep Dive
(
  'AAPL Earnings Preview - What to Expect',
  'Apple reports earnings next week. Here''s my comprehensive breakdown:

Expected Numbers:
• Revenue: $119B (vs $117B consensus)
• EPS: $2.10 (vs $2.07 consensus)
• Services revenue: Key focus

Bull Case:
• iPhone 15 cycle strong
• Services growth continues
• India market expansion

Bear Case:
• China concerns lingering
• Vision Pro slow adoption
• Valuation stretched at 30x PE

My Position:
Holding existing shares, not adding before earnings. Will reassess after the report.',
  'stocks',
  'neutral',
  'AAPL',
  185,
  200,
  170,
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
  true,
  7,
  'deep_dive',
  ARRAY['AAPL', 'Apple'],
  2890,
  110,
  '{"bull": 78, "bear": 35, "save": 56}'::jsonb,
  42,
  '{"symbol": "NASDAQ:AAPL", "interval": "D"}'::jsonb
),

-- 11. XRP Quick Take
(
  'XRP Breaking Resistance - Big Move Coming?',
  'XRP just broke above the $0.62 resistance that''s been capping price for weeks!

Volume is 3x average. This could be the start of something big.

Targets: $0.75, then $0.85
Stop: $0.55

NFA - manage your risk!',
  'crypto',
  'bullish',
  'XRP/USD',
  0.62,
  0.85,
  0.55,
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
  true,
  7,
  'quick_take',
  ARRAY['XRP', 'Ripple'],
  1120,
  67,
  '{"bull": 58, "bear": 14, "save": 22}'::jsonb,
  16,
  '{"symbol": "BINANCE:XRPUSDT", "interval": "4H"}'::jsonb
),

-- 12. AUD/USD Analysis
(
  'Aussie Dollar Setup - RBA Decision Preview',
  'AUD/USD approaching key decision point ahead of RBA meeting.

Technical Setup:
• Descending triangle on 4H
• Support at 0.6500
• Resistance at 0.6620

RBA Expected:
Markets pricing 60% chance of hold. Any hawkish surprise could send AUD higher.

My Play:
Waiting for breakout confirmation before entry. Will trade the direction of the break.',
  'forex',
  'neutral',
  'AUD/USD',
  0.6550,
  0.6700,
  0.6480,
  NULL,
  true,
  6,
  'trade_idea',
  ARRAY['AUDUSD', 'AUD', 'USD'],
  780,
  42,
  '{"bull": 25, "bear": 22, "save": 11}'::jsonb,
  8,
  '{"symbol": "FX:AUDUSD", "interval": "4H"}'::jsonb
),

-- 13. Tesla Stock Update
(
  'TSLA at Critical Support - Decision Time',
  'Tesla testing the $180 support level for the 3rd time. This is a make or break moment.

If support holds: Target $220
If support breaks: Next stop $150

Elon''s latest tweets adding volatility. Cybertruck deliveries ramping up could be the catalyst.

I''m staying on the sidelines until we get clarity.',
  'stocks',
  'neutral',
  'TSLA',
  180,
  220,
  150,
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800',
  true,
  6,
  'quick_take',
  ARRAY['TSLA', 'Tesla'],
  2450,
  88,
  '{"bull": 55, "bear": 48, "save": 32}'::jsonb,
  28,
  '{"symbol": "NASDAQ:TSLA", "interval": "D"}'::jsonb
),

-- 14. DXY Analysis
(
  'Dollar Index (DXY) Weekly Outlook',
  'The US Dollar Index showing signs of topping out after the recent rally.

Key Observations:
• Bearish divergence on RSI
• Failed to break above 106
• Rate cut expectations building

Impact on Other Markets:
A weaker dollar is typically bullish for:
• Gold & Silver
• EUR/USD
• Emerging market currencies
• Commodities

Watch 104.50 support - break below confirms reversal.',
  'indices',
  'bearish',
  'DXY',
  105.50,
  103.00,
  106.50,
  NULL,
  true,
  7,
  'market_pulse',
  ARRAY['DXY', 'Dollar', 'USD'],
  1340,
  73,
  '{"bull": 28, "bear": 52, "save": 25}'::jsonb,
  19,
  '{"symbol": "TVC:DXY", "interval": "W"}'::jsonb
),

-- 15. Risk Management Educational
(
  'Position Sizing 101 - Protect Your Capital',
  'The #1 mistake new traders make is risking too much per trade. Here''s how to size positions properly:

The 1% Rule:
Never risk more than 1% of your account on a single trade.

Example:
• $10,000 account
• Max risk per trade: $100
• If stop loss is 50 pips, position size = 0.2 lots

Why This Matters:
Even with 10 consecutive losses (unlikely), you''d only be down 10%. You can recover from that.

Risk 10% per trade? 5 losses = 50% drawdown. Nearly impossible to recover.

Trade small, trade often, stay in the game! 💪',
  'forex',
  'neutral',
  'N/A',
  NULL,
  NULL,
  NULL,
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
  true,
  9,
  'educational',
  ARRAY['RiskManagement', 'Trading101'],
  3450,
  145,
  '{"bull": 120, "bear": 3, "save": 156}'::jsonb,
  67,
  NULL
),

-- 16. Crude Oil Update
(
  'WTI Crude - OPEC Meeting Impact',
  'Oil prices volatile ahead of OPEC+ meeting. Here''s the setup:

Current Price: $78.50
Support: $75
Resistance: $82

OPEC Expected Actions:
• Production cuts likely extended
• Saudi may deepen voluntary cuts
• Russia compliance questionable

My Bias: Slightly bullish but waiting for meeting outcome before committing.',
  'forex',
  'bullish',
  'WTI',
  78.50,
  85.00,
  74.00,
  NULL,
  true,
  6,
  'trade_idea',
  ARRAY['OIL', 'WTI', 'CL'],
  920,
  51,
  '{"bull": 35, "bear": 21, "save": 14}'::jsonb,
  11,
  '{"symbol": "TVC:USOIL", "interval": "D"}'::jsonb
),

-- 17. META Quick Take
(
  'META Breaking Out - AI Play',
  'Meta breaking out of consolidation! 🚀

The AI narrative is real. Llama models gaining adoption. Ad revenue recovering.

Entry: $480
Target: $550
Stop: $450

This one looks good. Adding to my position.',
  'stocks',
  'bullish',
  'META',
  480,
  550,
  450,
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
  true,
  8,
  'quick_take',
  ARRAY['META', 'Facebook'],
  1870,
  92,
  '{"bull": 72, "bear": 15, "save": 38}'::jsonb,
  24,
  '{"symbol": "NASDAQ:META", "interval": "D"}'::jsonb
),

-- 18. AVAX Analysis
(
  'Avalanche (AVAX) Technical Setup',
  'AVAX forming a beautiful cup and handle on the daily.

Pattern Details:
• Cup formed over 3 months
• Handle currently forming
• Breakout level: $42

Targets if breakout confirms:
• TP1: $52
• TP2: $65

This is one of my favorite setups right now. L1 rotation could favor AVAX.',
  'crypto',
  'bullish',
  'AVAX/USD',
  42,
  65,
  35,
  'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800',
  true,
  8,
  'deep_dive',
  ARRAY['AVAX', 'Avalanche'],
  1230,
  78,
  '{"bull": 62, "bear": 18, "save": 29}'::jsonb,
  17,
  '{"symbol": "BINANCE:AVAXUSDT", "interval": "D"}'::jsonb
),

-- 19. NZD/USD Setup
(
  'Kiwi Dollar Bounce Play',
  'NZD/USD bouncing off long-term support at 0.5850.

Setup:
• Double bottom forming
• RSI oversold bounce
• RBNZ less dovish than expected

Entry: 0.5900
Target: 0.6100
Stop: 0.5800

R:R is solid at 2:1. Taking a small position here.',
  'forex',
  'bullish',
  'NZD/USD',
  0.5900,
  0.6100,
  0.5800,
  NULL,
  true,
  6,
  'trade_idea',
  ARRAY['NZDUSD', 'NZD', 'Kiwi'],
  560,
  34,
  '{"bull": 22, "bear": 14, "save": 9}'::jsonb,
  6,
  '{"symbol": "FX:NZDUSD", "interval": "4H"}'::jsonb
),

-- 20. Crypto Market Pulse
(
  'Crypto Weekly Recap - Jan 17, 2026',
  'Weekly crypto market summary:

Winners:
🥇 SOL +18%
🥈 AVAX +15%
🥉 XRP +12%

Losers:
📉 DOGE -8%
📉 SHIB -12%

BTC Dominance: 52.3% (down from 54%)

Key Takeaways:
• Altseason heating up
• L1 rotation in full effect
• Memecoins cooling off
• Institutional flows positive

Next week watch: ETH ETF decision and Fed minutes.',
  'crypto',
  'bullish',
  'TOTAL',
  NULL,
  NULL,
  NULL,
  'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
  true,
  7,
  'market_pulse',
  ARRAY['BTC', 'ETH', 'Crypto', 'Altcoins'],
  2780,
  115,
  '{"bull": 88, "bear": 25, "save": 52}'::jsonb,
  38,
  NULL
);

-- ============================================
-- VERIFY THE DATA
-- ============================================

-- Check the inserted data
SELECT 
  id,
  title,
  market,
  direction,
  pair,
  confidence_score,
  content_type,
  view_count,
  bull_score,
  reaction_counts,
  is_published
FROM analyses 
ORDER BY created_at DESC 
LIMIT 25;

-- Show count by market
SELECT market, COUNT(*) as count 
FROM analyses 
WHERE is_published = true 
GROUP BY market;

-- Show count by content type
SELECT content_type, COUNT(*) as count 
FROM analyses 
WHERE is_published = true 
GROUP BY content_type;

-- Total count
SELECT COUNT(*) as total_analyses FROM analyses WHERE is_published = true;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Dummy data inserted successfully!';
  RAISE NOTICE '📊 You should now see analyses in the Feed and Analysis tabs';
  RAISE NOTICE '🔄 Refresh your app to see the data';
END $$;
