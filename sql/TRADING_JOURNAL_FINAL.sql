-- ============================================
-- TRADING JOURNAL - COMPLETE DATABASE SETUP
-- ============================================
-- This SQL file creates a comprehensive trading journal system
-- with support for all tradable assets globally, automated
-- calculations, and image storage.
--
-- Requirements:
-- 1. Supabase project with PostgreSQL
-- 2. Supabase Storage bucket for trade images
-- 3. User authentication enabled
--
-- ============================================

-- ============================================
-- PART 1: STORAGE BUCKET SETUP
-- ============================================
-- Create storage bucket for trade images
-- Run this in the Supabase Storage dashboard or via API
-- Bucket name: 'trade-images'
-- Public: false (requires authentication)
-- File size limit: 5MB recommended
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies for trade-images bucket
-- (Run these in SQL Editor after creating bucket)

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade images" ON storage.objects;

-- Policy: Users can upload their own trade images
CREATE POLICY "Users can upload trade images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own trade images
CREATE POLICY "Users can view own trade images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own trade images
CREATE POLICY "Users can delete own trade images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- PART 2: CUSTOM TYPES
-- ============================================

-- Drop existing types to avoid conflicts
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS trade_direction CASCADE;
DROP TYPE IF EXISTS trade_outcome CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;

-- Asset types enum
CREATE TYPE asset_type AS ENUM (
  'stock',
  'forex',
  'crypto',
  'futures',
  'options',
  'commodities',
  'etf',
  'index',
  'bond',
  'cfd',
  'other'
);

-- Trade direction enum
CREATE TYPE trade_direction AS ENUM (
  'long',
  'short'
);

-- Trade outcome enum
CREATE TYPE trade_outcome AS ENUM (
  'win',
  'loss',
  'breakeven'
);

-- Trade status enum
CREATE TYPE trade_status AS ENUM (
  'open',
  'closed',
  'cancelled'
);

-- Session type enum
CREATE TYPE session_type AS ENUM (
  'asian',
  'european',
  'american',
  'after_hours'
);

-- ============================================
-- PART 3: MAIN TABLES
-- ============================================

-- Trades table - Core trading journal entries
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
  recruit_email TEXT, -- Denormalized for faster queries
  
  -- Asset Information
  asset_symbol VARCHAR(50) NOT NULL,
  asset_name VARCHAR(255),
  asset_type asset_type NOT NULL,
  
  -- Trade Details
  direction trade_direction NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(20, 8) NOT NULL CHECK (entry_price > 0),
  exit_price DECIMAL(20, 8) CHECK (exit_price IS NULL OR exit_price > 0),
  
  -- Dates and Times
  entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_date TIMESTAMPTZ,
  
  -- Risk Management
  stop_loss DECIMAL(20, 8),
  take_profit DECIMAL(20, 8),
  risk_amount DECIMAL(20, 2),
  risk_percentage DECIMAL(5, 2),
  
  -- Costs and Fees
  commission DECIMAL(20, 2) DEFAULT 0,
  fees DECIMAL(20, 2) DEFAULT 0,
  swap DECIMAL(20, 2) DEFAULT 0,
  
  -- P&L (Profit and Loss)
  gross_pnl DECIMAL(20, 2),
  net_pnl DECIMAL(20, 2),
  pnl_percentage DECIMAL(10, 4),
  
  -- Trade Classification
  outcome trade_outcome,
  status trade_status DEFAULT 'open',
  
  -- Strategy and Analysis
  strategy VARCHAR(100),
  setup VARCHAR(100),
  timeframe VARCHAR(20),
  session session_type,
  
  -- Market Context
  market_condition VARCHAR(100),
  news_events TEXT,
  
  -- Trade Journal
  entry_reason TEXT,
  exit_reason TEXT,
  notes TEXT,
  
  -- Performance Metrics
  risk_reward_ratio DECIMAL(10, 2),
  mae DECIMAL(20, 2), -- Maximum Adverse Excursion
  mfe DECIMAL(20, 2), -- Maximum Favorable Excursion
  
  -- Additional Fields
  account_balance DECIMAL(20, 2),
  position_size_dollars DECIMAL(20, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_exit_date CHECK (exit_date IS NULL OR exit_date >= entry_date),
  CONSTRAINT valid_status CHECK (
    (status = 'open' AND exit_date IS NULL) OR
    (status IN ('closed', 'cancelled') AND exit_date IS NOT NULL)
  )
);

-- Trade Images table - Multiple images per trade
CREATE TABLE IF NOT EXISTS trade_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
  recruit_email TEXT,
  
  image_url TEXT NOT NULL,
  image_type VARCHAR(50), -- 'entry', 'exit', 'setup', 'analysis', etc.
  caption TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

-- Daily Trading Stats table - Aggregated daily statistics
CREATE TABLE IF NOT EXISTS daily_trading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
  recruit_email TEXT,
  stat_date DATE NOT NULL,
  
  -- Trade Count
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  breakeven_trades INTEGER DEFAULT 0,
  
  -- P&L
  total_pnl DECIMAL(20, 2) DEFAULT 0,
  total_wins_amount DECIMAL(20, 2) DEFAULT 0,
  total_losses_amount DECIMAL(20, 2) DEFAULT 0,
  
  -- Ratios
  win_rate DECIMAL(5, 2),
  profit_factor DECIMAL(10, 2),
  average_win DECIMAL(20, 2),
  average_loss DECIMAL(20, 2),
  
  -- Streaks
  current_win_streak INTEGER DEFAULT 0,
  current_loss_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, stat_date)
);

-- User Trading Stats table - Overall user statistics
CREATE TABLE IF NOT EXISTS user_trading_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
  recruit_email TEXT UNIQUE,
  
  -- Lifetime Stats
  total_trades INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_breakeven INTEGER DEFAULT 0,
  
  -- P&L
  total_pnl DECIMAL(20, 2) DEFAULT 0,
  best_trade DECIMAL(20, 2) DEFAULT 0,
  worst_trade DECIMAL(20, 2) DEFAULT 0,
  
  -- Averages
  average_win DECIMAL(20, 2),
  average_loss DECIMAL(20, 2),
  average_trade_duration INTERVAL,
  
  -- Ratios
  overall_win_rate DECIMAL(5, 2),
  overall_profit_factor DECIMAL(10, 2),
  
  -- Streaks
  longest_win_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  current_loss_streak INTEGER DEFAULT 0,
  
  -- Risk Metrics
  sharpe_ratio DECIMAL(10, 4),
  sortino_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  max_drawdown_amount DECIMAL(20, 2),
  
  -- Last Updated
  last_trade_date TIMESTAMPTZ,
  stats_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================

-- Trades table indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_recruit_id ON trades(recruit_id);
CREATE INDEX idx_trades_recruit_email ON trades(recruit_email);
CREATE INDEX idx_trades_entry_date ON trades(entry_date);
CREATE INDEX idx_trades_exit_date ON trades(exit_date);
CREATE INDEX idx_trades_asset_symbol ON trades(asset_symbol);
CREATE INDEX idx_trades_asset_type ON trades(asset_type);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_outcome ON trades(outcome);
CREATE INDEX idx_trades_strategy ON trades(strategy);
CREATE INDEX idx_trades_user_entry_date ON trades(user_id, entry_date DESC);

-- Trade images indexes
CREATE INDEX idx_trade_images_trade_id ON trade_images(trade_id);
CREATE INDEX idx_trade_images_user_id ON trade_images(user_id);
CREATE INDEX idx_trade_images_recruit_id ON trade_images(recruit_id);

-- Daily stats indexes
CREATE INDEX idx_daily_stats_user_date ON daily_trading_stats(user_id, stat_date DESC);
CREATE INDEX idx_daily_stats_recruit_id ON daily_trading_stats(recruit_id);

-- ============================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trading_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
DROP POLICY IF EXISTS "Users can update own trades" ON trades;
DROP POLICY IF EXISTS "Users can delete own trades" ON trades;

DROP POLICY IF EXISTS "Users can view own trade images" ON trade_images;
DROP POLICY IF EXISTS "Users can insert own trade images" ON trade_images;
DROP POLICY IF EXISTS "Users can delete own trade images" ON trade_images;

DROP POLICY IF EXISTS "Users can view own daily stats" ON daily_trading_stats;
DROP POLICY IF EXISTS "Users can insert own daily stats" ON daily_trading_stats;
DROP POLICY IF EXISTS "Users can update own daily stats" ON daily_trading_stats;

DROP POLICY IF EXISTS "Users can view own stats" ON user_trading_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_trading_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_trading_stats;

-- Trades RLS Policies
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email)
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

-- Trade Images RLS Policies
CREATE POLICY "Users can view own trade images"
  ON trade_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can insert own trade images"
  ON trade_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can delete own trade images"
  ON trade_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

-- Daily Stats RLS Policies
CREATE POLICY "Users can view own daily stats"
  ON daily_trading_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can insert own daily stats"
  ON daily_trading_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can update own daily stats"
  ON daily_trading_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email)
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

-- User Stats RLS Policies
CREATE POLICY "Users can view own stats"
  ON user_trading_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can insert own stats"
  ON user_trading_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

CREATE POLICY "Users can update own stats"
  ON user_trading_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.email() = recruit_email)
  WITH CHECK (auth.uid() = user_id OR auth.email() = recruit_email);

-- ============================================
-- PART 6: AUTOMATED TRIGGERS
-- ============================================

-- Function: Update trade P&L automatically
CREATE OR REPLACE FUNCTION calculate_trade_pnl()
RETURNS TRIGGER AS $$
DECLARE
  price_diff DECIMAL(20, 8);
  gross DECIMAL(20, 2);
  total_costs DECIMAL(20, 2);
  v_recruit_id BIGINT;
  v_recruit_email TEXT;
BEGIN
  -- Auto-populate recruit data from auth.users email
  IF NEW.recruit_id IS NULL AND NEW.user_id IS NOT NULL THEN
    -- Get user email from auth.users
    SELECT email INTO v_recruit_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Find matching recruit by email
    IF v_recruit_email IS NOT NULL THEN
      SELECT id INTO v_recruit_id
      FROM public.recruits
      WHERE email = v_recruit_email;
      
      NEW.recruit_id := v_recruit_id;
      NEW.recruit_email := v_recruit_email;
    END IF;
  END IF;

  -- Only calculate if trade is closed
  IF NEW.exit_price IS NOT NULL AND NEW.status = 'closed' THEN
    -- Calculate price difference based on direction
    IF NEW.direction = 'long' THEN
      price_diff := NEW.exit_price - NEW.entry_price;
    ELSE
      price_diff := NEW.entry_price - NEW.exit_price;
    END IF;
    
    -- Calculate gross P&L
    gross := price_diff * NEW.quantity;
    NEW.gross_pnl := gross;
    
    -- Calculate total costs
    total_costs := COALESCE(NEW.commission, 0) + COALESCE(NEW.fees, 0) + COALESCE(NEW.swap, 0);
    
    -- Calculate net P&L
    NEW.net_pnl := gross - total_costs;
    
    -- Calculate P&L percentage
    IF NEW.entry_price > 0 THEN
      NEW.pnl_percentage := (NEW.net_pnl / (NEW.entry_price * NEW.quantity)) * 100;
    END IF;
    
    -- Calculate risk/reward ratio
    IF NEW.risk_amount IS NOT NULL AND NEW.risk_amount > 0 THEN
      NEW.risk_reward_ratio := NEW.net_pnl / NEW.risk_amount;
    END IF;
    
    -- Determine outcome
    IF NEW.net_pnl > 0 THEN
      NEW.outcome := 'win';
    ELSIF NEW.net_pnl < 0 THEN
      NEW.outcome := 'loss';
    ELSE
      NEW.outcome := 'breakeven';
    END IF;
  END IF;
  
  -- Update timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculate P&L before insert or update
CREATE TRIGGER trigger_calculate_pnl
  BEFORE INSERT OR UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_pnl();

-- Function: Update daily stats when trade changes
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  trade_date DATE;
  wins INTEGER;
  losses INTEGER;
  breakevens INTEGER;
  total INTEGER;
  wins_amt DECIMAL(20, 2);
  losses_amt DECIMAL(20, 2);
  total_pnl DECIMAL(20, 2);
  w_rate DECIMAL(5, 2);
  p_factor DECIMAL(10, 2);
  avg_w DECIMAL(20, 2);
  avg_l DECIMAL(20, 2);
BEGIN
  -- Determine which date to update
  IF TG_OP = 'DELETE' THEN
    trade_date := OLD.entry_date::DATE;
  ELSE
    trade_date := NEW.entry_date::DATE;
  END IF;
  
  -- Calculate stats for the day
  SELECT 
    COUNT(*) FILTER (WHERE outcome = 'win'),
    COUNT(*) FILTER (WHERE outcome = 'loss'),
    COUNT(*) FILTER (WHERE outcome = 'breakeven'),
    COUNT(*),
    COALESCE(SUM(net_pnl) FILTER (WHERE outcome = 'win'), 0),
    COALESCE(ABS(SUM(net_pnl)) FILTER (WHERE outcome = 'loss'), 0),
    COALESCE(SUM(net_pnl), 0)
  INTO wins, losses, breakevens, total, wins_amt, losses_amt, total_pnl
  FROM trades
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND entry_date::DATE = trade_date
    AND status = 'closed';
  
  -- Calculate ratios
  IF total > 0 THEN
    w_rate := (wins::DECIMAL / total) * 100;
  END IF;
  
  IF losses_amt > 0 THEN
    p_factor := wins_amt / losses_amt;
  ELSIF wins_amt > 0 THEN
    p_factor := 999.99; -- Cap at max
  END IF;
  
  IF wins > 0 THEN
    avg_w := wins_amt / wins;
  END IF;
  
  IF losses > 0 THEN
    avg_l := losses_amt / losses;
  END IF;
  
  -- Upsert daily stats
  INSERT INTO daily_trading_stats (
    user_id, stat_date, total_trades, winning_trades, losing_trades,
    breakeven_trades, total_pnl, total_wins_amount, total_losses_amount,
    win_rate, profit_factor, average_win, average_loss
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id), trade_date, total, wins, losses,
    breakevens, total_pnl, wins_amt, losses_amt,
    w_rate, p_factor, avg_w, avg_l
  )
  ON CONFLICT (user_id, stat_date) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    breakeven_trades = EXCLUDED.breakeven_trades,
    total_pnl = EXCLUDED.total_pnl,
    total_wins_amount = EXCLUDED.total_wins_amount,
    total_losses_amount = EXCLUDED.total_losses_amount,
    win_rate = EXCLUDED.win_rate,
    profit_factor = EXCLUDED.profit_factor,
    average_win = EXCLUDED.average_win,
    average_loss = EXCLUDED.average_loss,
    updated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update daily stats after trade changes
CREATE TRIGGER trigger_update_daily_stats
  AFTER INSERT OR UPDATE OR DELETE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();

-- Function: Update user overall stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  wins INTEGER;
  losses INTEGER;
  breakevens INTEGER;
  total INTEGER;
  wins_amt DECIMAL(20, 2);
  losses_amt DECIMAL(20, 2);
  total_pnl DECIMAL(20, 2);
  best DECIMAL(20, 2);
  worst DECIMAL(20, 2);
  w_rate DECIMAL(5, 2);
  p_factor DECIMAL(10, 2);
  avg_w DECIMAL(20, 2);
  avg_l DECIMAL(20, 2);
  uid UUID;
BEGIN
  uid := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate overall stats
  SELECT 
    COUNT(*) FILTER (WHERE outcome = 'win'),
    COUNT(*) FILTER (WHERE outcome = 'loss'),
    COUNT(*) FILTER (WHERE outcome = 'breakeven'),
    COUNT(*),
    COALESCE(SUM(net_pnl) FILTER (WHERE outcome = 'win'), 0),
    COALESCE(ABS(SUM(net_pnl)) FILTER (WHERE outcome = 'loss'), 0),
    COALESCE(SUM(net_pnl), 0),
    COALESCE(MAX(net_pnl), 0),
    COALESCE(MIN(net_pnl), 0)
  INTO wins, losses, breakevens, total, wins_amt, losses_amt, total_pnl, best, worst
  FROM trades
  WHERE user_id = uid
    AND status = 'closed';
  
  -- Calculate ratios
  IF total > 0 THEN
    w_rate := (wins::DECIMAL / total) * 100;
  END IF;
  
  IF losses_amt > 0 THEN
    p_factor := wins_amt / losses_amt;
  ELSIF wins_amt > 0 THEN
    p_factor := 999.99;
  END IF;
  
  IF wins > 0 THEN
    avg_w := wins_amt / wins;
  END IF;
  
  IF losses > 0 THEN
    avg_l := losses_amt / losses;
  END IF;
  
  -- Upsert user stats
  INSERT INTO user_trading_stats (
    user_id, total_trades, total_wins, total_losses, total_breakeven,
    total_pnl, best_trade, worst_trade, average_win, average_loss,
    overall_win_rate, overall_profit_factor, stats_updated_at
  ) VALUES (
    uid, total, wins, losses, breakevens,
    total_pnl, best, worst, avg_w, avg_l,
    w_rate, p_factor, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    total_wins = EXCLUDED.total_wins,
    total_losses = EXCLUDED.total_losses,
    total_breakeven = EXCLUDED.total_breakeven,
    total_pnl = EXCLUDED.total_pnl,
    best_trade = EXCLUDED.best_trade,
    worst_trade = EXCLUDED.worst_trade,
    average_win = EXCLUDED.average_win,
    average_loss = EXCLUDED.average_loss,
    overall_win_rate = EXCLUDED.overall_win_rate,
    overall_profit_factor = EXCLUDED.overall_profit_factor,
    stats_updated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update user stats after trade changes
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT OR UPDATE OR DELETE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- ============================================
-- PART 7: HELPER FUNCTIONS
-- ============================================

-- Function: Get user's current account balance
CREATE OR REPLACE FUNCTION get_user_balance(uid UUID)
RETURNS DECIMAL(20, 2) AS $$
DECLARE
  balance DECIMAL(20, 2);
BEGIN
  SELECT total_pnl INTO balance
  FROM user_trading_stats
  WHERE user_id = uid;
  
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get win streak
CREATE OR REPLACE FUNCTION get_win_streak(uid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  trade RECORD;
BEGIN
  FOR trade IN
    SELECT outcome FROM trades
    WHERE user_id = uid AND status = 'closed'
    ORDER BY exit_date DESC
  LOOP
    IF trade.outcome = 'win' THEN
      streak := streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- Function: Sync recruit data for a user
CREATE OR REPLACE FUNCTION sync_recruit_data_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
  v_recruit_id BIGINT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN;
  END IF;
  
  -- Get recruit_id
  SELECT id INTO v_recruit_id FROM public.recruits WHERE email = v_email;
  
  -- Update all trades for this user
  UPDATE trades
  SET recruit_id = v_recruit_id,
      recruit_email = v_email
  WHERE user_id = p_user_id
    AND (recruit_id IS NULL OR recruit_email IS NULL);
  
  -- Update trade_images
  UPDATE trade_images
  SET recruit_id = v_recruit_id,
      recruit_email = v_email
  WHERE user_id = p_user_id
    AND (recruit_id IS NULL OR recruit_email IS NULL);
  
  -- Update daily_trading_stats
  UPDATE daily_trading_stats
  SET recruit_id = v_recruit_id,
      recruit_email = v_email
  WHERE user_id = p_user_id
    AND (recruit_id IS NULL OR recruit_email IS NULL);
  
  -- Update user_trading_stats
  UPDATE user_trading_stats
  SET recruit_id = v_recruit_id,
      recruit_email = v_email
  WHERE user_id = p_user_id
    AND (recruit_id IS NULL OR recruit_email IS NULL);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: INITIAL DATA & VERIFICATION
-- ============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Trading Journal Database Setup Complete!';
  RAISE NOTICE 'Tables created: trades, trade_images, daily_trading_stats, user_trading_stats';
  RAISE NOTICE 'Triggers enabled: calculate_pnl, update_daily_stats, update_user_stats';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Recruit table integration: All tables linked to public.recruits via recruit_id and recruit_email';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket "trade-images" in Supabase Dashboard';
  RAISE NOTICE '2. Configure bucket to allow authenticated users';
  RAISE NOTICE '3. Ensure public.recruits table exists (run RECRUITS_TABLE.sql if needed)';
  RAISE NOTICE '4. Run sync_recruit_data_for_user(user_id) to backfill recruit data for existing users';
  RAISE NOTICE '5. Start using the trading journal!';
END $$;

-- ============================================
-- END OF SETUP
-- ============================================
