-- ============================================================================
-- RECRUITS TABLE - COMPLETE SCHEMA WITH ID COLUMN
-- This migration must run BEFORE 20260204_bullmoney_store_schema.sql
-- Creates recruits table with proper id BIGSERIAL PRIMARY KEY
-- ============================================================================

-- Create the recruits table with id as the first column
CREATE TABLE IF NOT EXISTS public.recruits (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  mt5_id TEXT,
  affiliate_code TEXT,
  referred_by_code TEXT,
  social_handle TEXT,
  task_broker_verified BOOLEAN DEFAULT false,
  task_social_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Pending',
  commission_balance DECIMAL(10,2) DEFAULT 0.00,
  total_referred_manual INTEGER DEFAULT 0,
  used_code BOOLEAN DEFAULT false,
  image_url TEXT,
  is_vip BOOLEAN DEFAULT false,
  vip_updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  phone TEXT,
  telegram_username TEXT,
  discord_username TEXT,
  notes TEXT,
  notifications_enabled BOOLEAN DEFAULT false,
  notify_trades BOOLEAN DEFAULT true,
  notify_livestreams BOOLEAN DEFAULT true,
  notify_news BOOLEAN DEFAULT true,
  notify_vip BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,
  instagram_username TEXT,
  facebook_username TEXT,
  twitter_username TEXT,
  youtube_username TEXT,
  twitch_username TEXT,
  tiktok_username TEXT,
  cell_number TEXT,
  country TEXT,
  city TEXT,
  timezone TEXT,
  birth_date TEXT,
  preferred_contact_method TEXT,
  trading_experience_years INTEGER,
  trading_style TEXT,
  risk_tolerance TEXT,
  preferred_instruments TEXT,
  trading_timezone TEXT,
  account_balance_range TEXT,
  preferred_leverage TEXT,
  favorite_pairs TEXT,
  trading_strategy TEXT,
  win_rate_target DECIMAL(5,2),
  monthly_profit_target TEXT,
  hobbies TEXT,
  personality_traits TEXT,
  trading_goals TEXT,
  learning_style TEXT,
  notification_preferences TEXT,
  preferred_chart_timeframe TEXT,
  uses_automated_trading BOOLEAN DEFAULT false,
  attends_live_sessions BOOLEAN DEFAULT false,
  bio TEXT,
  affiliate_tier TEXT DEFAULT 'Starter',
  affiliate_tier_updated_at TIMESTAMP WITH TIME ZONE,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  pending_earnings DECIMAL(10,2) DEFAULT 0.00,
  paid_earnings DECIMAL(10,2) DEFAULT 0.00,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  last_payout_amount DECIMAL(10,2),
  total_referred_traders INTEGER DEFAULT 0,
  active_traders INTEGER DEFAULT 0,
  total_lots_traded DECIMAL(10,2) DEFAULT 0.00,
  monthly_lots_traded DECIMAL(10,2) DEFAULT 0.00,
  social_posts_this_week INTEGER DEFAULT 0,
  social_posts_this_month INTEGER DEFAULT 0,
  social_bonus_multiplier DECIMAL(5,2) DEFAULT 1.00,
  last_social_post_date TIMESTAMP WITH TIME ZONE,
  preferred_broker TEXT DEFAULT 'Vantage',
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_trader_volume DECIMAL(10,2) DEFAULT 0.00,
  best_month_earnings DECIMAL(10,2) DEFAULT 0.00,
  payment_method TEXT,
  payment_details TEXT,
  payment_verified BOOLEAN DEFAULT false,
  custom_referral_link TEXT,
  link_clicks INTEGER DEFAULT 0,
  link_last_clicked TIMESTAMP WITH TIME ZONE
);

-- For existing tables without id column, add it and make it primary key
DO $$
DECLARE
    has_id BOOLEAN;
    has_pk BOOLEAN;
BEGIN
    -- Check if id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'recruits'
            AND column_name = 'id'
    ) INTO has_id;

    -- Check if primary key exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
            AND table_name = 'recruits'
            AND constraint_type = 'PRIMARY KEY'
    ) INTO has_pk;

    -- If id doesn't exist, add it
    IF NOT has_id THEN
        ALTER TABLE public.recruits ADD COLUMN id BIGSERIAL;
        RAISE NOTICE 'Added id column to existing recruits table';
    END IF;

    -- If no primary key, add it on id
    IF NOT has_pk THEN
        ALTER TABLE public.recruits ADD CONSTRAINT recruits_pkey PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key constraint on id column';
    END IF;

    -- Final verification
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'recruits'
            AND column_name = 'id'
    ) INTO has_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
            AND table_name = 'recruits'
            AND constraint_type = 'PRIMARY KEY'
    ) INTO has_pk;

    IF has_id AND has_pk THEN
        RAISE NOTICE '✓ SUCCESS: recruits table has id BIGSERIAL PRIMARY KEY';
    ELSE
        RAISE EXCEPTION 'FAILED: recruits table setup incomplete. id exists: %, pk exists: %', has_id, has_pk;
    END IF;
END $$;

-- Enable RLS on recruits table
ALTER TABLE public.recruits ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT access for authentication
DROP POLICY IF EXISTS "Allow public read for auth" ON public.recruits;
CREATE POLICY "Allow public read for auth" 
  ON public.recruits FOR SELECT 
  USING (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_recruits_email ON public.recruits(email);
CREATE INDEX IF NOT EXISTS idx_recruits_affiliate_code ON public.recruits(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_recruits_mt5_id ON public.recruits(mt5_id);

COMMENT ON TABLE public.recruits IS 'User accounts and trading affiliate information';
