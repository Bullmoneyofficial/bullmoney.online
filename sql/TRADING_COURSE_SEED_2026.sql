-- TRADING_COURSE_SEED_2026.sql
-- Purpose: Seed the BullMoney Trading Course with a comprehensive, original 2026 curriculum.
-- Notes:
-- - This is educational content, not financial advice.
-- - This script is written to be re-runnable: it checks for existing modules/lessons by title.
-- - It sets is_published = true so it appears immediately in the student view.
--
-- Recommended usage:
-- 1) Run TRADING_COURSE_SCHEMA.sql first
-- 2) Then run this file in Supabase SQL Editor

DO $$
DECLARE
  v_beginner UUID;
  v_intermediate UUID;
  v_advanced UUID;

  m UUID;
  l UUID;
BEGIN
  SELECT id INTO v_beginner FROM trading_course_levels WHERE level_name = 'beginner' LIMIT 1;
  SELECT id INTO v_intermediate FROM trading_course_levels WHERE level_name = 'intermediate' LIMIT 1;
  SELECT id INTO v_advanced FROM trading_course_levels WHERE level_name = 'advanced' LIMIT 1;

  IF v_beginner IS NULL OR v_intermediate IS NULL OR v_advanced IS NULL THEN
    RAISE EXCEPTION 'Course levels not found. Run TRADING_COURSE_SCHEMA.sql first.';
  END IF;

  -----------------------------------------------------------------------------
  -- BEGINNER LEVEL
  -----------------------------------------------------------------------------

  -- Module B1
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B1: Foundations and Platform Setup' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B1: Foundations and Platform Setup',
      'Your trading foundation. Market basics, instruments, and a clean setup in TradingView and MT5.',
      NULL,
      1,
      true
    )
    RETURNING id INTO m;
  END IF;

  -- Lessons B1
  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'What trading is and what it is not') THEN
    INSERT INTO trading_course_lessons (
      module_id, title, description, content_type, video_url, video_thumbnail, article_content,
      image_urls, duration_minutes, order_index, is_free, is_published
    ) VALUES
    (
      m,
      'What trading is and what it is not',
      'A real definition of a trading business. Expectations, probability, and how pros think.',
      'article',
      NULL,
      NULL,
      'Trading is the business of managing risk in uncertain outcomes. Your job is not to be right, it is to follow a process that has positive expectancy.\n\nCore ideas:\n- Every trade is one event in a long series.\n- You can do everything right and still lose.\n- You can be wrong and still win if risk is controlled.\n\nExpectations to set now:\n- You will have losing streaks. Plan for them.\n- Your edge is small. Execution and risk matter more than hype.\n- Consistency beats intensity.\n\nAction:\nWrite your personal rules for risk: maximum loss per day, maximum loss per week, and maximum open risk at one time.',
      NULL,
      15,
      1,
      true,
      true
    ),
    (
      m,
      'Markets and instruments: stocks, metals, crypto',
      'What moves each market and how to choose what to trade.',
      'article',
      NULL,
      NULL,
      'Stocks, metals, and crypto behave differently. If you trade them the same way, you will learn slower.\n\nStocks:\n- Driven by earnings, guidance, news, sector rotation, and risk appetite.\n- Gaps and halts exist. Liquidity varies by ticker.\n\nMetals (gold, silver):\n- Sensitive to real yields, USD, risk events, and central bank narratives.\n- Often respects clean levels on higher timeframes.\n\nCrypto:\n- Trades 24/7 with sharp volatility regimes.\n- Weekend behavior and funding/liquidations matter.\n\nAction:\nPick one primary market to learn first. You can add a second after you have 30 to 50 documented trades with rules.',
      NULL,
      18,
      2,
      true,
      true
    ),
    (
      m,
      'TradingView setup: charts, watchlists, alerts',
      'A clean chart is a fast chart. Build your workspace for decision making.',
      'article',
      NULL,
      NULL,
      'TradingView setup checklist:\n- Use a simple template: candles, volume, and one trend tool.\n- Create watchlists by market: Stocks, Metals, Crypto.\n- Build alerts on price levels and structure breaks.\n- Save layouts for different timeframes (Daily, 4H, 1H, 5m).\n\nRules for indicators:\n- If an indicator does not change your decision, remove it.\n- Start with structure and price. Add tools only to reduce mistakes.\n\nAction:\nCreate 3 alerts per instrument: key support, key resistance, and a trendline or structure break.',
      NULL,
      20,
      3,
      true,
      true
    ),
    (
      m,
      'MetaTrader 5 setup: order types and execution basics',
      'How to place trades correctly and avoid basic execution errors.',
      'article',
      NULL,
      NULL,
      'MT5 execution basics:\n- Market order: immediate fill, worst for fast moves.\n- Limit order: you choose the price, best for planned entries.\n- Stop order: triggers when price moves through a level.\n\nRisk control in execution:\n- Know your symbol specs: contract size, tick size, margin.\n- Avoid wide spreads around news.\n- Check trading hours and rollover.\n\nAction:\nPractice in demo: place one buy limit, one sell limit, one stop order, and cancel each. Get comfortable with the workflow before real money.',
      NULL,
      22,
      4,
      false,
      true
    );
  END IF;

  -- Module B2
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B2: Candlesticks and Market Structure' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B2: Candlesticks and Market Structure',
      'Candlestick language, trend basics, and simple structure you can trade.',
      NULL,
      2,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Candlesticks that matter and the ones that do not') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Candlesticks that matter and the ones that do not',
      'Use candles as context, not as magic. Learn what a candle actually shows.',
      'article',
      'A candlestick is information about order flow during a period. It is not a prediction by itself.\n\nWhat matters most:\n- Close location (near high or near low).\n- Range expansion (big candle) versus compression (small).\n- Rejection wicks at important levels.\n\nWhat to stop doing:\n- Trading single candle patterns with no level or trend context.\n- Ignoring the timeframe. A pin bar on 1 minute is not the same as a pin bar on Daily.\n\nAction:\nMark the last 20 swing highs and swing lows on a chart. Now observe which candles printed at those turns. The level mattered first, the candle was confirmation.',
      20,
      1,
      true,
      true
    ),
    (
      m,
      'Market structure in one page: swings, trends, ranges',
      'A simple structure model for beginners that actually works.',
      'article',
      'Structure model:\n- Uptrend: higher highs and higher lows.\n- Downtrend: lower lows and lower highs.\n- Range: price rotates between support and resistance.\n\nThe beginner mistake:\nTrading against the higher timeframe trend because a small timeframe candle looks strong.\n\nA practical method:\n1) Identify higher timeframe bias (Daily or 4H).\n2) Identify current phase: trend or range.\n3) Only trade setups that match the phase.\n\nAction:\nOn TradingView, add a 20 period moving average only as a visual helper for trend direction. Do not use it for entries yet.',
      22,
      2,
      true,
      true
    ),
    (
      m,
      'Multi timeframe basics: top down analysis',
      'How to align Daily, 4H, 1H, and execution timeframes.',
      'article',
      'Top down flow:\n- Daily: major levels and trend.\n- 4H: structure and clean zones.\n- 1H: setup formation and timing.\n- 5m or 15m: entry trigger and risk control.\n\nRules:\n- Higher timeframe levels override lower timeframe noise.\n- Enter on lower timeframe, but only inside a higher timeframe plan.\n\nAction:\nPick one instrument. Draw Daily support and resistance. Then drop to 1H and label where price is reacting. Write one sentence: Bullish above X, bearish below Y.',
      18,
      3,
      false,
      true
    ),
    (
      m,
      'Common candlestick traps and fakeouts',
      'How to avoid getting baited by wicks, news spikes, and thin liquidity.',
      'article',
      'Fakeouts usually happen when you trade the middle of nowhere or when liquidity is thin.\n\nAvoid these situations:\n- Entering in the middle of a range.\n- Entering right into higher timeframe resistance.\n- Trading major news without a plan.\n\nSimple protection:\n- Wait for a close beyond a level, then a retest.\n- Use limit orders only when the level is clear and spread is normal.\n\nAction:\nReview your last 10 losing trades. Label each as: bad level, bad timing, bad risk, or no plan. Fix the biggest category first.',
      20,
      4,
      false,
      true
    );
  END IF;

  -- Module B3
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B3: Support, Resistance, and Trends' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B3: Support, Resistance, and Trends',
      'Build levels that hold. Trade trend continuation without guessing tops and bottoms.',
      NULL,
      3,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'How to draw support and resistance correctly') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'How to draw support and resistance correctly',
      'The goal is not perfect lines. The goal is tradable zones.',
      'article',
      'Rules for strong levels:\n- Mark levels where price reversed with displacement (strong move away).\n- Prefer levels that were respected multiple times.\n- Prefer levels visible on Daily or 4H.\n\nZones beat lines:\nPrice rarely turns at one exact tick. Draw a small zone around the swing.\n\nAction:\nCreate a two color system: blue for higher timeframe levels, gray for lower timeframe. Only take trades at blue levels until you are consistent.',
      20,
      1,
      true,
      true
    ),
    (
      m,
      'Trend trading basics: pullbacks and continuation',
      'A beginner friendly way to trade with the trend.',
      'article',
      'Trend continuation framework:\n1) Identify trend on 4H or Daily.\n2) Wait for pullback to prior structure or moving average area.\n3) Enter on a clear trigger candle after rejection.\n4) Stop goes beyond the swing that invalidates the setup.\n\nTargets:\n- First target at prior high/low.\n- Partial profits reduce emotional pressure.\n\nAction:\nBacktest 30 examples of pullback entries. Track win rate and average R multiple.',
      22,
      2,
      false,
      true
    ),
    (
      m,
      'Range trading basics: buy support, sell resistance',
      'Only trade ranges when the range is obvious and clean.',
      'article',
      'Range rules:\n- Define clear top and bottom.\n- Do not trade the middle.\n- Confirm with rejection and reduced volatility near edges.\n\nRisk notes:\nRanges break eventually. Size smaller and take faster profits.\n\nAction:\nFind one range on 1H or 4H. Mark top and bottom. Plan two trades: one long at support, one short at resistance, with stops outside the zone.',
      18,
      3,
      false,
      true
    ),
    (
      m,
      'Trendlines and channels that actually help',
      'Use trendlines as structure guides, not as superstition.',
      'article',
      'Trendline rules:\n- Use at least two touches, three is better.\n- Draw from clean swing points, not random wicks.\n- Combine with horizontal levels for confluence.\n\nChannels:\n- A channel gives you a framework for pullbacks and targets.\n- Do not force a channel on messy price action.\n\nAction:\nDraw one trendline on 4H and one on 1H. Write which one you will respect more and why.',
      18,
      4,
      false,
      true
    );
  END IF;

  -- Module B4
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B4: Risk Management and Execution' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B4: Risk Management and Execution',
      'Position sizing, stops, and how to survive long enough to get good.',
      NULL,
      4,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Position sizing: the only formula you need') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Position sizing: the only formula you need',
      'Calculate size using risk per trade, not emotions.',
      'article',
      'Core sizing formula:\nPosition size = (Account risk per trade) / (Stop distance in money terms)\n\nExample:\n- Account: 10,000\n- Risk per trade: 0.5% = 50\n- Stop distance: 1.25 per share\n- Shares = 50 / 1.25 = 40 shares\n\nRules:\n- Keep risk per trade fixed while learning.\n- Do not widen stops to avoid being wrong.\n\nAction:\nSet your default risk per trade (0.25% to 1%). Write it down. Use it for every trade for the next 30 trades.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Stop placement: invalidation, not pain tolerance',
      'Where a stop belongs and where it does not.',
      'article',
      'A stop belongs where your setup is invalid.\n\nGood stop logic:\n- Beyond the swing low for longs or swing high for shorts.\n- Beyond the range edge.\n- Beyond the level that defines your plan.\n\nBad stop logic:\n- A random dollar amount.\n- A distance that only feels comfortable.\n\nAction:\nFor 10 chart examples, write the sentence: If price goes to X, my idea is wrong. Put the stop there.',
      16,
      2,
      false,
      true
    ),
    (
      m,
      'R multiples and why you should track them',
      'Stop thinking in dollars. Think in risk units.',
      'article',
      'R is your risk per trade.\n- 1R loss means you lost what you planned to lose.\n- 2R win means you made twice your risk.\n\nWhy it matters:\n- It normalizes results across different instruments.\n- It lets you evaluate strategy performance honestly.\n\nAction:\nTrack the next 20 trades in R. Your goal is not high win rate. Your goal is positive average R and stable behavior.',
      14,
      3,
      false,
      true
    ),
    (
      m,
      'Execution rules: entries, limits, and avoiding slippage',
      'A practical execution checklist for TradingView alerts and MT5 orders.',
      'article',
      'Execution checklist:\n- Confirm higher timeframe level.\n- Confirm spread is normal.\n- Place entry with clear trigger.\n- Place stop immediately.\n- Place target or manage with rules.\n\nSlippage control:\n- Avoid fast news spikes as a beginner.\n- Use limit orders when you can.\n\nAction:\nCreate a pre trade checklist in your journal. If any item is missing, you do not enter.',
      18,
      4,
      false,
      true
    );
  END IF;

  -- Module B5
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B5: Your First Profitable Playbook' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B5: Your First Profitable Playbook',
      'Simple strategies with rules. A daily routine you can follow without overtrading.',
      NULL,
      5,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Strategy 1: trend pullback at structure') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Strategy 1: trend pullback at structure',
      'A high probability setup when traded with discipline.',
      'article',
      'Rules:\n1) Higher timeframe trend is clear (Daily or 4H).\n2) Price pulls back into prior support/resistance that flips.\n3) Entry trigger: rejection candle and close back in trend direction.\n4) Stop: beyond the swing that breaks the setup.\n5) Target: prior high/low, then optional runner.\n\nCommon mistakes:\n- Entering before the pullback finishes.\n- Moving stop wider.\n\nAction:\nBacktest 50 examples across one market. Track R, not just win rate.',
      22,
      1,
      true,
      true
    ),
    (
      m,
      'Strategy 2: clean breakout and retest',
      'Trade breakouts only when structure is clean and risk is defined.',
      'article',
      'Breakout checklist:\n- Price is compressing under resistance or above support.\n- Breakout candle closes with strength.\n- Retest holds the breakout level.\n\nEntry:\n- Enter on retest rejection.\nStop:\n- Below retest low for longs, above retest high for shorts.\nTarget:\n- Measured move or next higher timeframe level.\n\nAction:\nCreate 10 alerts for breakout levels. Trade only the ones that retest cleanly.',
      20,
      2,
      false,
      true
    ),
    (
      m,
      'A daily routine that prevents overtrading',
      'A simple routine to stay consistent and avoid revenge trades.',
      'article',
      'Routine:\n- Pre market: mark levels, decide bias, set alerts.\n- Trading window: only take A+ setups, max 2 to 3 trades.\n- Post market: journal every trade, screenshot entry and exit, note emotions.\n\nRules:\n- Stop trading after max daily loss.\n- Stop trading after hitting daily goal if you get sloppy.\n\nAction:\nWrite your trading hours and your maximum trades per day. Treat them like business hours.',
      15,
      3,
      false,
      true
    ),
    (
      m,
      'Journaling: what to track to get better fast',
      'If you do not measure it, you cannot improve it.',
      'article',
      'Track these fields:\n- Setup name\n- Market and timeframe\n- Entry reason\n- Stop logic\n- Target logic\n- Result in R\n- Mistake category\n\nWeekly review questions:\n- Which setup has best expectancy?\n- Which mistake costs me the most?\n- Am I following rules?\n\nAction:\nCommit to 30 trades with full journal entries before you change strategies.',
      18,
      4,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- INTERMEDIATE LEVEL
  -----------------------------------------------------------------------------

  -- Module I1
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I1: Advanced Candlesticks and Multi Timeframe Context' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I1: Advanced Candlesticks and Multi Timeframe Context',
      'Context first. Learn when candles are signals and when they are noise.',
      NULL,
      1,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'The story of a candle: who is trapped and who is in control') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'The story of a candle: who is trapped and who is in control',
      'How to read rejection, absorption, and continuation without guessing.',
      'article',
      'Ask these questions:\n- Did price attempt a direction and fail?\n- Where did it close relative to the range?\n- Is this candle at a meaningful level?\n\nTrapped traders:\n- A breakout that closes back inside the range traps breakout buyers.\n- A breakdown that snaps back traps shorts.\n\nAction:\nMark 20 trap examples. Note the level and the follow through. Your edge comes from repeatable context, not rare patterns.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Multi timeframe alignment: bias, setup, trigger',
      'A clean separation of roles across timeframes.',
      'article',
      'Three layer model:\n- Bias timeframe (Daily or 4H): direction and key levels.\n- Setup timeframe (1H): pattern and zone.\n- Trigger timeframe (5m to 15m): entry and stop.\n\nRules:\n- If bias and setup disagree, reduce size or skip.\n- If trigger is messy, do not force it.\n\nAction:\nWrite your exact timeframes for each role for your market. Then keep it fixed for one month.',
      16,
      2,
      false,
      true
    ),
    (
      m,
      'Break of structure and change of character',
      'A simple way to detect when trend is weakening.',
      'article',
      'Concept:\n- Break of structure: price breaks a key swing in the trend direction.\n- Change of character: the first clear sign that momentum is changing.\n\nPractical use:\n- Use change of character to tighten risk or take partials.\n- Use break of structure to confirm continuation entries.\n\nAction:\nFind 10 trend reversals. Identify the first change of character. Most traders enter too late because they miss this early signal.',
      20,
      3,
      false,
      true
    ),
    (
      m,
      'High impact sessions and timing entries',
      'Timing is a feature, not an afterthought.',
      'article',
      'Timing basics:\n- Liquidity increases at market opens and overlaps.\n- Metals and FX often move during London and NY overlap.\n- Crypto can trend during US hours and can chop on weekends.\n\nAction:\nChoose a single trading window. Track your results by time of day. Keep the best window, cut the worst.',
      15,
      4,
      false,
      true
    );
  END IF;

  -- Module I2
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I2: Strategy Building and Backtesting' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I2: Strategy Building and Backtesting',
      'Turn ideas into rules, then prove them with data and discipline.',
      NULL,
      2,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Define an edge: expectancy, win rate, and R') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Define an edge: expectancy, win rate, and R',
      'A strategy is only real if it has positive expectancy.',
      'article',
      'Expectancy formula:\nExpectancy = (Win rate x Avg win) - (Loss rate x Avg loss)\n\nKey idea:\nA low win rate system can be profitable if average win is large. A high win rate system can still lose money if average loss is large.\n\nAction:\nPick one setup. Backtest 50 trades. Calculate win rate and average R. If you cannot describe your edge in one sentence, you do not have rules yet.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Backtesting workflow: how to test without lying to yourself',
      'A process that keeps your results honest.',
      'article',
      'Rules for clean backtests:\n- Use fixed entry and exit rules.\n- Do not move targets after the fact.\n- Track commissions and spread assumptions.\n- Sample across multiple months and market regimes.\n\nAction:\nCreate a spreadsheet with columns: date, setup, entry, stop, target, result R, notes. Backtest in one sitting per week to stay consistent.',
      20,
      2,
      false,
      true
    ),
    (
      m,
      'Forward testing and demo to live transition',
      'How to go from theory to real execution safely.',
      'article',
      'Forward testing rules:\n- Trade the exact same rules live in demo first.\n- Track slippage, spreads, and emotions.\n- Do not increase size until your process is stable.\n\nA safe transition:\n- Micro size for 30 trades.\n- Small size for 30 trades.\n- Only then consider scaling.\n\nAction:\nWrite your scale plan in advance. If you do not have a scale plan, you will scale on emotion.',
      16,
      3,
      false,
      true
    ),
    (
      m,
      'TradingView tools for testing and execution',
      'Use alerts, bar replay, and templates like a pro.',
      'article',
      'Tools:\n- Bar Replay for manual backtesting and timing.\n- Alerts for structure breaks, retests, and price zones.\n- Multiple layouts for top down analysis.\n\nAction:\nBuild an alert set for your strategy: entry zone alert, invalidation alert, and target alert. Automate reminders so you do not stare at charts all day.',
      15,
      4,
      false,
      true
    );
  END IF;

  -- Module I3
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I3: Volume, VWAP, and Market Conditions' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I3: Volume, VWAP, and Market Conditions',
      'Add confirmation tools that reduce mistakes and improve timing.',
      NULL,
      3,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Volume basics: participation and confirmation') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Volume basics: participation and confirmation',
      'Use volume to confirm moves, not to predict them.',
      'article',
      'Volume helps answer:\n- Is there real participation behind this move?\n- Is the breakout supported or weak?\n\nSimple rules:\n- Breakout with strong volume is more credible.\n- Reversal at key level with volume spike can signal capitulation.\n\nAction:\nReview 20 breakouts. Compare volume at breakout candle to the prior 20 candles average. Note the follow through.',
      16,
      1,
      true,
      true
    ),
    (
      m,
      'VWAP: where price is fair for the day',
      'A practical VWAP guide for intraday trading.',
      'article',
      'VWAP is a benchmark for average traded price.\n\nUses:\n- Trend days often respect VWAP as dynamic support/resistance.\n- Mean reversion setups can occur when price stretches far from VWAP and returns.\n\nAction:\nAdd VWAP to your intraday chart. For 10 days, note how price behaves around VWAP at the open and during pullbacks.',
      15,
      2,
      false,
      true
    ),
    (
      m,
      'Volatility regimes: when to press and when to reduce',
      'Your size should match volatility and clarity.',
      'article',
      'Volatility regimes:\n- High volatility: wider stops, smaller size, faster targets.\n- Low volatility: tighter stops possible, but beware chop.\n\nAction:\nTrack ATR or average range for your instrument. Decide your stop size as a fraction of average range. Make it consistent.',
      14,
      3,
      false,
      true
    ),
    (
      m,
      'News and events: how to trade around catalysts',
      'Protect your account during high impact moments.',
      'article',
      'Rules:\n- Do not hold beginner positions through major events unless your plan is designed for it.\n- Spreads can widen. Slippage can spike.\n- If you trade news, reduce size and use hard stops.\n\nAction:\nMake a weekly event check habit. Write down high impact events and define what you will do: avoid, reduce, or trade with specific rules.',
      16,
      4,
      false,
      true
    );
  END IF;

  -- Module I4
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I4: Trade Management and Psychology' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I4: Trade Management and Psychology',
      'The rules that keep your edge alive under pressure.',
      NULL,
      4,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Trade management frameworks: partials, trailing, and exits') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Trade management frameworks: partials, trailing, and exits',
      'Choose one management style and apply it consistently.',
      'article',
      'Management options:\n- Fixed target: simple, consistent, easy to backtest.\n- Partial plus runner: reduces stress, keeps upside.\n- Trailing stop: good in trends, can cut winners early in chop.\n\nAction:\nPick one management style for your main setup. Backtest it. Do not change management mid trade unless your rules say so.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Psychology: fear of missing out and revenge trading',
      'The two emotions that destroy most accounts.',
      'article',
      'FOMO fixes:\n- Alerts replace screen watching.\n- A rules based entry replaces chasing.\n\nRevenge fixes:\n- Max daily loss rule.\n- Mandatory cooldown after a loss.\n- Review mistakes, do not change strategy mid day.\n\nAction:\nWrite your stop trading rules. Make them non negotiable. Your future self will thank you.',
      14,
      2,
      false,
      true
    ),
    (
      m,
      'Building confidence with process goals',
      'Confidence comes from executed reps, not from one big win.',
      'article',
      'Process goals examples:\n- Follow checklist on every trade.\n- Take only A setups for 2 weeks.\n- Journal within 10 minutes of closing a trade.\n\nAction:\nSet one process goal for the next 7 days. Track it like a score. Profit is the byproduct of quality reps.',
      12,
      3,
      false,
      true
    ),
    (
      m,
      'Weekly review: how to actually improve',
      'A short review ritual that compounds results.',
      'article',
      'Weekly review steps:\n1) Export trades and screenshots.\n2) Tag each trade: A, B, or C quality.\n3) Find the top mistake.\n4) Create one correction rule for next week.\n\nAction:\nSchedule a weekly review time. If it is not scheduled, it will not happen.',
      12,
      4,
      false,
      true
    );
  END IF;

  -- Module I5
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I5: Market Specific Playbooks (Stocks, Metals, Crypto)' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I5: Market Specific Playbooks (Stocks, Metals, Crypto)',
      'Adapt your setups to the market you trade so the rules fit reality.',
      NULL,
      5,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Stocks playbook: gaps, levels, and liquidity') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Stocks playbook: gaps, levels, and liquidity',
      'How to trade stocks without getting chopped or halted.',
      'article',
      'Stocks key points:\n- Liquidity matters. Prefer liquid names while learning.\n- Gaps change structure. Use pre market levels.\n- Earnings weeks increase volatility.\n\nAction:\nCreate a watchlist of 20 liquid tickers. Mark weekly and daily levels. Track which ones respect levels best. Keep the clean ones.',
      16,
      1,
      true,
      true
    ),
    (
      m,
      'Metals playbook: gold and silver behavior',
      'Metals often respect higher timeframe structure and react to macro events.',
      'article',
      'Metals notes:\n- Gold often reacts to USD strength and real yields.\n- Clean levels on 4H and Daily matter.\n- News spikes are common. Wait for confirmation after high impact events.\n\nAction:\nBuild a weekly plan for gold: key levels, bias, and event risks. Trade only at your best zones.',
      14,
      2,
      false,
      true
    ),
    (
      m,
      'Crypto playbook: volatility, weekends, and liquidations',
      'Crypto can trend hard and reverse fast. Your risk must match.',
      'article',
      'Crypto notes:\n- 24/7 trading means you must define off time.\n- Weekend liquidity can be thinner.\n- Large moves can be fueled by liquidations. Avoid chasing.\n\nAction:\nPick one primary pair. Define your trading hours. Set alerts and walk away. Overwatching crypto increases bad trades.',
      14,
      3,
      false,
      true
    ),
    (
      m,
      'Choosing your market and building a niche edge',
      'Specialization makes improvement faster.',
      'article',
      'Pick your niche:\n- One market\n- One timeframe set\n- Two setups\n- One management style\n\nAction:\nWrite your niche statement in one line. Example: I trade 4H trend pullbacks on gold with 15m entries and fixed 2R targets.',
      12,
      4,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- ADVANCED LEVEL
  -----------------------------------------------------------------------------

  -- Module A1
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A1: Liquidity, Market Structure, and Institutional Concepts' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A1: Liquidity, Market Structure, and Institutional Concepts',
      'A practical advanced framework: liquidity, displacement, and high quality zones.',
      NULL,
      1,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Liquidity: stops, resting orders, and why price moves') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Liquidity: stops, resting orders, and why price moves',
      'Understand liquidity pools and how they create common patterns.',
      'article',
      'Liquidity basics:\n- Stops cluster above highs and below lows.\n- Breaks often seek liquidity, then reverse or continue.\n\nPractical use:\n- Identify equal highs/lows and obvious swing points.\n- Expect runs into those areas, then watch reaction.\n\nAction:\nOn 4H, mark equal highs and equal lows. Track how often price runs them before a major move.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Displacement and imbalance: the only moves that matter',
      'Strong moves create zones worth revisiting.',
      'article',
      'Displacement is a strong move away from a level. It signals imbalance.\n\nZones:\n- When price leaves fast, it often returns to rebalance.\n- Use the origin of the move as a potential entry zone with rules.\n\nAction:\nFind 20 displacement moves. Mark the origin zone. Record if and how price returns. Build rules from repetition.',
      18,
      2,
      false,
      true
    ),
    (
      m,
      'Advanced structure: internal vs swing structure',
      'Separate noise from real breaks.',
      'article',
      'Structure layers:\n- Swing structure: major highs/lows on higher timeframe.\n- Internal structure: minor breaks inside a move.\n\nRule:\nTrade in alignment with swing structure. Use internal structure for timing only.\n\nAction:\nLabel one chart with swing points only. Then add internal points. Notice how many internal breaks are noise.',
      16,
      3,
      false,
      true
    ),
    (
      m,
      'Premium and discount: buying low and selling high with logic',
      'A clean way to frame entries inside a range or swing.',
      'article',
      'Premium and discount concept:\n- In a range, the top half is premium, bottom half is discount.\n- You want longs in discount and shorts in premium when structure supports it.\n\nAction:\nDraw the midpoint of a major swing. Track whether your best entries are on the correct side of the midpoint.',
      14,
      4,
      false,
      true
    );
  END IF;

  -- Module A2
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A2: System Design and Rules That Scale' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A2: System Design and Rules That Scale',
      'Build a system with constraints, filters, and automation so you stay consistent.',
      NULL,
      2,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Your trading system blueprint: inputs, rules, outputs') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Your trading system blueprint: inputs, rules, outputs',
      'Turn trading into a repeatable machine.',
      'article',
      'System blueprint:\nInputs: market, timeframe, session, volatility filter.\nRules: entry trigger, stop logic, target logic, invalidation.\nOutputs: trade taken or skipped, position size, management steps.\n\nAction:\nWrite your system as if a stranger had to trade it. If they cannot, your rules are not clear enough.',
      18,
      1,
      true,
      true
    ),
    (
      m,
      'Filters that improve expectancy',
      'Remove low quality trades instead of adding complexity.',
      'article',
      'High value filters:\n- Higher timeframe alignment\n- Session filter\n- Volatility filter\n- Avoiding major news windows\n\nAction:\nTest one filter at a time. If you add five filters at once, you will never know what helped.',
      14,
      2,
      false,
      true
    ),
    (
      m,
      'Automation: alerts, checklists, and reducing screen time',
      'The best traders do not stare at charts all day.',
      'article',
      'Automation ideas:\n- TradingView alerts at zones and structure breaks.\n- A checklist that must be completed before entry.\n- Post trade template for journaling.\n\nAction:\nReduce your screen time by 30%. Replace it with alerts and scheduled reviews. Better decisions happen when you are not overstimulated.',
      12,
      3,
      false,
      true
    ),
    (
      m,
      'Risk of ruin and why overleverage kills systems',
      'Protect the account first, then grow it.',
      'article',
      'Risk of ruin increases fast when:\n- You risk too much per trade.\n- You trade too many correlated instruments.\n- You increase size after wins and tilt after losses.\n\nAction:\nSet a maximum open risk across all positions. Many traders lose because they accidentally stack risk without noticing.',
      14,
      4,
      false,
      true
    );
  END IF;

  -- Module A3
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A3: Portfolio Risk, Correlations, and Macro Awareness' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A3: Portfolio Risk, Correlations, and Macro Awareness',
      'Trade like a portfolio manager. Control correlation and understand macro risk.',
      NULL,
      3,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Correlation: the hidden risk in multiple positions') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Correlation: the hidden risk in multiple positions',
      'You can be right on entries and still lose due to stacked exposure.',
      'article',
      'Correlation basics:\n- Many assets move together during risk on or risk off regimes.\n- Holding multiple positions that behave the same is one big trade.\n\nAction:\nList your markets. Identify which ones are correlated in your trading window. Cap total risk across correlated trades.',
      14,
      1,
      true,
      true
    ),
    (
      m,
      'Macro drivers for metals and risk assets',
      'Enough macro to stay out of trouble, not enough to overthink.',
      'article',
      'Macro awareness for traders:\n- Metals often react to USD and real rates.\n- Risk assets can react to liquidity conditions and policy expectations.\n\nAction:\nWrite the one macro variable you will watch for your market. Keep it simple. The chart still decides entries and exits.',
      12,
      2,
      false,
      true
    ),
    (
      m,
      'Crypto regimes: trend, chop, and liquidity events',
      'Crypto shifts regimes fast. Your playbook must adapt.',
      'article',
      'Regime rules:\n- Trend regime: trade pullbacks, hold runners, avoid countertrend fades.\n- Chop regime: reduce size, quick targets, or sit out.\n\nAction:\nDefine a regime checklist for crypto: volatility, range width, and structure clarity. If it fails, do not trade.',
      12,
      3,
      false,
      true
    ),
    (
      m,
      'Event risk and staying alive during chaos',
      'A professional approach to risk around major events.',
      'article',
      'Rules:\n- Reduce size or flat before events if your system is not designed for it.\n- Accept that missing moves is part of survival.\n- Protect capital for the next clean opportunity.\n\nAction:\nCreate an event mode rule: If major event within X minutes, do not open new positions.',
      10,
      4,
      false,
      true
    );
  END IF;

  -- Module A4
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A4: Performance Review and Scaling' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A4: Performance Review and Scaling',
      'Turn results into improvements. Scale only when your process is stable.',
      NULL,
      4,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Metrics that matter: expectancy, drawdown, and variance') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Metrics that matter: expectancy, drawdown, and variance',
      'If you track the right metrics, improvement becomes obvious.',
      'article',
      'Key metrics:\n- Expectancy\n- Max drawdown\n- Average R\n- Standard deviation of returns\n\nAction:\nStop judging yourself by daily profit. Judge yourself by whether your system metrics are improving across months.',
      14,
      1,
      true,
      true
    ),
    (
      m,
      'Scaling plan: when and how to increase size',
      'Scale slowly and only after proof.',
      'article',
      'Scaling rules:\n- Only scale after a minimum sample size (50 to 100 trades).\n- Only scale if drawdown is controlled.\n- Scale in steps, not jumps.\n\nAction:\nWrite a scale ladder: size level 1, 2, 3. Define the performance needed to move up and the performance that forces you back down.',
      14,
      2,
      false,
      true
    ),
    (
      m,
      'Mistake proofing: remove your biggest leak',
      'Most traders do not need a new strategy, they need fewer mistakes.',
      'article',
      'Leak removal process:\n- Identify top 1 mistake.\n- Create one rule that prevents it.\n- Track compliance daily.\n\nAction:\nIf your biggest mistake is overtrading, create a max trades rule and a required setup checklist score.',
      10,
      3,
      false,
      true
    ),
    (
      m,
      'Professional routine: sleep, focus, and decision quality',
      'Your brain is your edge. Protect it.',
      'article',
      'Professional habits:\n- Sleep consistency\n- Nutrition and hydration\n- Breaks from screens\n- A calm pre trade routine\n\nAction:\nPick one habit to improve this week. Track it daily. A stable nervous system makes better trading decisions.',
      10,
      4,
      false,
      true
    );
  END IF;

  -- Module A5
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A5: Advanced Execution and Edge Protection' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A5: Advanced Execution and Edge Protection',
      'Protect the edge: execution details, slippage, and environment control.',
      NULL,
      5,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Execution quality: spreads, slippage, and order routing') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Execution quality: spreads, slippage, and order routing',
      'Small execution improvements compound over hundreds of trades.',
      'article',
      'Execution rules:\n- Avoid entering during the most chaotic seconds unless your system is built for it.\n- Prefer limit entries at planned levels.\n- Track slippage and remove instruments with bad fills.\n\nAction:\nAdd a journal field for slippage. If it is consistently bad, adjust entry method or reduce trading during those times.',
      12,
      1,
      true,
      true
    ),
    (
      m,
      'Environment control: distractions, dopamine, and staying sharp',
      'The modern enemy is distraction.',
      'article',
      'Rules:\n- No random scrolling during trading hours.\n- One charting layout, one execution platform, one journal.\n- If you feel rushed, you do not enter.\n\nAction:\nCreate a trading mode: phone on silent, only trading tabs open, and a timer to take breaks.',
      10,
      2,
      false,
      true
    ),
    (
      m,
      'Fail safes: daily loss limits, circuit breakers, and reset rituals',
      'Pros have rules for bad days. That is why they survive.',
      'article',
      'Fail safes:\n- Max daily loss\n- Max weekly loss\n- Stop after 2 consecutive mistakes\n- Mandatory walk after a big loss\n\nAction:\nCreate your circuit breaker rules and share them with someone you trust. Accountability reduces impulse decisions.',
      10,
      3,
      false,
      true
    ),
    (
      m,
      'Your final playbook: build, test, execute, review',
      'The full loop that creates profitable traders.',
      'article',
      'Playbook loop:\n1) Build clear rules.\n2) Test with data.\n3) Execute with discipline.\n4) Review and improve one thing at a time.\n\nAction:\nWrite your full playbook in one document. Keep it simple. Update only after a full review period, not after one trade.',
      12,
      4,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- ENHANCEMENTS: MORE DEPTH + COMPLETE SYSTEMS + QUIZZES + RESOURCES
  -----------------------------------------------------------------------------

  -----------------------------------------------------------------------------
  -- BEGINNER ADD ON
  -----------------------------------------------------------------------------

  -- Module B6
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_beginner AND title = 'B6: Candlestick Setups You Can Trade' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_beginner,
      'B6: Candlestick Setups You Can Trade',
      'Five simple candlestick setups with rules. No guessing, no magic. Just structure plus confirmation.',
      NULL,
      6,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'The only rule that makes candlesticks work') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'The only rule that makes candlesticks work',
      'Candlesticks do not work in random places. They work at levels with a clear invalidation point.',
      'article',
      'The rule:\nCandlesticks are only valid signals when they form at a pre planned level, inside a clear trend or range context, with defined invalidation.\n\nBeginner checklist:\n- Level is visible on 4H or Daily\n- You know where you are wrong\n- You are not entering in the middle of a range\n- Spread and liquidity are normal\n\nAction:\nBefore every trade, write one sentence: I am trading this candle because it formed at X level and price is wrong if it breaks Y.',
      14,
      1,
      true,
      true
    ),
    (
      m,
      'Setup 1: bullish and bearish engulfing at structure',
      'Engulfing candles work best when they reclaim a key level after a pullback.',
      'article',
      'Rules:\n1) Higher timeframe bias is clear.\n2) Price pulls into a prior structure zone.\n3) Engulfing candle closes strong back in bias direction.\n4) Entry on close or small retrace.\n5) Stop beyond the low or high that invalidates the reclaim.\n\nTargets:\n- First target at prior swing.\n- If trend is strong, leave a runner with a trailing rule.\n\nAction:\nMark 20 engulfing candles. Count how many occurred at real levels. That number is your truth.',
      18,
      2,
      false,
      true
    ),
    (
      m,
      'Setup 2: pin bar rejection with confirmation',
      'A pin bar is not the entry. The entry is the confirmation after rejection.',
      'article',
      'Rules:\n- Pin bar forms at a key zone.\n- You want a close that rejects the zone, not just a wick.\n- Confirmation can be a break of the pin bar high for longs or low for shorts.\n\nStop:\n- Beyond the wick extreme.\n\nAction:\nStop taking pin bars in the middle of nowhere. Only take them at levels you would already trade without the candle.',
      16,
      3,
      false,
      true
    ),
    (
      m,
      'Setup 3: inside bar breakouts at clean levels',
      'Inside bars show compression. Breakouts work when they break from a level, not from randomness.',
      'article',
      'Inside bar rules:\n- You need a clear level or trendline context.\n- Trade the break only if it is aligned with higher timeframe bias.\n- Stop goes beyond the inside bar opposite side.\n\nAction:\nBacktest 30 inside bar breaks. Filter out the ones not at a level. Your results will improve instantly.',
      14,
      4,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- INTERMEDIATE ADD ON
  -----------------------------------------------------------------------------

  -- Module I6
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_intermediate AND title = 'I6: Two Complete Systems (Trend and Mean Reversion)' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_intermediate,
      'I6: Two Complete Systems (Trend and Mean Reversion)',
      'Two full strategies you can actually run. Rules, filters, risk, entries, exits, and a review process.',
      NULL,
      6,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'System 1: trend continuation with pullback entry') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'System 1: trend continuation with pullback entry',
      'A full trend system: bias, setup, trigger, stop, and targets.',
      'article',
      'System rules:\nBias: Daily or 4H trend and key levels.\nSetup: Pullback into prior structure or dynamic area.\nTrigger: 5m to 15m rejection then break of micro structure.\nStop: Beyond the pullback swing.\nTarget: First target at prior swing, runner optional.\n\nFilters:\n- Only trade during your chosen session.\n- Skip if price is in the middle of a higher timeframe range.\n\nAction:\nWrite your exact entry trigger in one sentence. If you cannot, you are still discretionary.',
      22,
      1,
      true,
      true
    ),
    (
      m,
      'System 2: mean reversion from extreme back to fair value',
      'A mean reversion system using stretch, exhaustion, and return to fair value.',
      'article',
      'Mean reversion rules:\nContext: Range or choppy regime, not a strong trend.\nStretch: Price is extended from fair value (examples: far from VWAP or far from a midline).\nSignal: Exhaustion candle at a key boundary (range edge or higher timeframe level).\nEntry: Confirmation after exhaustion.\nStop: Beyond the extreme.\n\nTargets:\n- First target at fair value (VWAP or midpoint).\n- Second target at the opposite range boundary only if conditions remain range like.\n\nAction:\nThe hardest part is skipping trends. Add a rule: if higher timeframe is trending hard, mean reversion is disabled.',
      22,
      2,
      false,
      true
    ),
    (
      m,
      'Risk rules for both systems: when to press and when to cut size',
      'A professional risk framework that adapts to conditions without emotion.',
      'article',
      'Risk tiers:\n- Tier 1: normal conditions, normal risk per trade.\n- Tier 2: choppy or news heavy, cut risk in half.\n- Tier 3: unstable conditions, no trading.\n\nRules:\n- Never increase risk after losses.\n- If you break a rule, you stop trading and review.\n\nAction:\nCreate your tier checklist. Use it daily before you place any trade.',
      16,
      3,
      false,
      true
    ),
    (
      m,
      'Weekly KPI review for systems',
      'The review routine that turns a good trader into a great one.',
      'article',
      'Weekly KPI list:\n- Trades taken\n- Win rate\n- Average R\n- Max drawdown\n- Rule adherence percentage\n- Biggest mistake category\n\nAction:\nIf your rule adherence is below 90%, you do not change the strategy. You change behavior first.',
      14,
      4,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- ADVANCED ADD ON
  -----------------------------------------------------------------------------

  -- Module A6
  SELECT id INTO m FROM trading_course_modules WHERE level_id = v_advanced AND title = 'A6: Statistics, Drawdowns, and Trader IQ' LIMIT 1;
  IF m IS NULL THEN
    INSERT INTO trading_course_modules (level_id, title, description, thumbnail_url, order_index, is_published)
    VALUES (
      v_advanced,
      'A6: Statistics, Drawdowns, and Trader IQ',
      'Pros think in distributions. Learn variance, drawdown planning, and how to stay rational with real numbers.',
      NULL,
      6,
      true
    )
    RETURNING id INTO m;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM trading_course_lessons WHERE module_id = m AND title = 'Expectancy is not enough: distribution and variance') THEN
    INSERT INTO trading_course_lessons (module_id, title, description, content_type, article_content, duration_minutes, order_index, is_free, is_published)
    VALUES
    (
      m,
      'Expectancy is not enough: distribution and variance',
      'Two strategies can have the same expectancy and feel completely different to trade.',
      'article',
      'Why traders quit good systems:\n- Variance creates long flat periods or drawdowns.\n- People expect smooth results that do not exist.\n\nWhat to track:\n- Distribution of returns\n- Losing streak length\n- Best and worst weeks\n\nAction:\nStop expecting linear profit. Build your risk limits around realistic drawdowns.',
      16,
      1,
      true,
      true
    ),
    (
      m,
      'Monte Carlo thinking: planning for drawdowns before they happen',
      'A practical way to prepare emotionally and financially.',
      'article',
      'Monte Carlo concept:\nIf you randomize trade outcomes from your real win rate and R, you see many possible equity curves.\n\nAction:\nIf your max losing streak is 6, plan for 10. If your max drawdown is 8 percent, plan for 15 percent. Build safety into your business.',
      14,
      2,
      false,
      true
    ),
    (
      m,
      'Position sizing models: fixed risk and volatility based sizing',
      'Two sizing models and when each makes sense.',
      'article',
      'Sizing models:\n- Fixed fractional: simple and stable for learning.\n- Volatility based: size adjusts to ATR or average range.\n\nAction:\nChoose one model for a full month. Mixing models mid month creates chaos and hides your real performance.',
      14,
      3,
      false,
      true
    );
  END IF;

  -----------------------------------------------------------------------------
  -- QUIZZES (high value checks)
  -----------------------------------------------------------------------------

  -- Quiz set for 'Position sizing: the only formula you need'
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'Position sizing: the only formula you need' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_quizzes WHERE lesson_id = l AND order_index = 1) THEN
      INSERT INTO trading_course_quizzes (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
      (
        l,
        'If you risk 50 dollars per trade and your stop is 1.25 dollars per share, how many shares is correct?',
        '["20 shares","40 shares","50 shares","80 shares"]'::jsonb,
        1,
        'Shares = 50 / 1.25 = 40. The goal is fixed risk, not a fixed share count.',
        1
      );
    END IF;
  END IF;

  -- Quiz set for 'Define an edge: expectancy, win rate, and R'
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'Define an edge: expectancy, win rate, and R' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_quizzes WHERE lesson_id = l AND order_index = 1) THEN
      INSERT INTO trading_course_quizzes (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
      (
        l,
        'Which statement is true about win rate and profitability?',
        '["High win rate always means profit","Low win rate systems can be profitable if average win is larger than average loss","Win rate does not matter","Profit only comes from being right"]'::jsonb,
        1,
        'Expectancy depends on both win rate and win size versus loss size. A low win rate can still win with bigger average winners.',
        1
      );
    END IF;
  END IF;

  -----------------------------------------------------------------------------
  -- RESOURCES (templates and worksheets)
  -----------------------------------------------------------------------------

  -- Attach a journal template to 'Journaling: what to track to get better fast'
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'Journaling: what to track to get better fast' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_resources WHERE lesson_id = l AND title = 'BullMoney Trade Journal Template') THEN
      INSERT INTO trading_course_resources (lesson_id, title, description, resource_type, file_url, file_size_kb)
      VALUES (
        l,
        'BullMoney Trade Journal Template',
        'A clean journal template with setup tags, R tracking, and mistake categories.',
        'template',
        'https://bullmoney.online/trading-course/resources/bullmoney-trade-journal-template.pdf',
        220
      );
    END IF;
  END IF;

  -- Candlestick cheat sheet
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'The only rule that makes candlesticks work' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_resources WHERE lesson_id = l AND title = 'Candlestick Setups Cheat Sheet') THEN
      INSERT INTO trading_course_resources (lesson_id, title, description, resource_type, file_url, file_size_kb)
      VALUES (
        l,
        'Candlestick Setups Cheat Sheet',
        'Printable rules for engulfing, pin bars, and inside bars with a pre-trade checklist.',
        'pdf',
        'https://bullmoney.online/trading-course/resources/candlestick-setups-cheat-sheet.pdf',
        180
      );
    END IF;
  END IF;

  -- KPI tracking sheet
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'Weekly KPI review for systems' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_resources WHERE lesson_id = l AND title = 'Weekly KPI Tracker Sheet') THEN
      INSERT INTO trading_course_resources (lesson_id, title, description, resource_type, file_url, file_size_kb)
      VALUES (
        l,
        'Weekly KPI Tracker Sheet',
        'A simple spreadsheet layout for win rate, average R, drawdown, and rule adherence.',
        'spreadsheet',
        'https://bullmoney.online/trading-course/resources/weekly-kpi-tracker.xlsx',
        95
      );
    END IF;
  END IF;

  -- Quiz for variance lesson
  SELECT id INTO l FROM trading_course_lessons WHERE title = 'Expectancy is not enough: distribution and variance' LIMIT 1;
  IF l IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM trading_course_quizzes WHERE lesson_id = l AND order_index = 1) THEN
      INSERT INTO trading_course_quizzes (lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES
      (
        l,
        'Two strategies have the same expectancy. What can still make one harder to trade?',
        '["The color of the chart","Variance and drawdown profile","It is impossible","Only the entry method"]'::jsonb,
        1,
        'Expectancy does not describe the path. Variance and drawdowns determine how painful the journey feels and whether you can stick with the system.',
        1
      );
    END IF;
  END IF;

END $$;
