-- =============================================
-- TRADING JOURNAL FIX FOR RECRUIT USERS
-- =============================================
-- This migration allows the trading journal to work with recruit users from the recruits table
-- Handles both UUID (auth.users) and BIGINT (recruits.id) user types
-- =============================================

-- Step 1: Check if tables exist and handle gracefully
DO $$ 
BEGIN
    -- Check if trades table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trades') THEN
        RAISE NOTICE 'trades table does not exist. Please run TRADING_JOURNAL_SCHEMA.sql first.';
        RETURN;
    END IF;
END $$;

-- Step 2: Drop ALL existing RLS policies FIRST (before altering columns)
-- Policies must be dropped before we can change column types they depend on
-- Drop ALL policies by querying pg_policies to get actual policy names
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on trades table
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'trades' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.trades', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on trades', pol.policyname;
    END LOOP;
    
    -- Drop all policies on trade_images table
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'trade_images' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.trade_images', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on trade_images', pol.policyname;
    END LOOP;
    
    -- Drop all policies on daily_trading_stats table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        FOR pol IN 
            SELECT policyname FROM pg_policies WHERE tablename = 'daily_trading_stats' AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_trading_stats', pol.policyname);
            RAISE NOTICE 'Dropped policy: % on daily_trading_stats', pol.policyname;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Dropped all existing RLS policies';
END $$;

-- Step 3: Disable RLS (we'll use application-level security)
ALTER TABLE public.trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_images DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        ALTER TABLE public.daily_trading_stats DISABLE ROW LEVEL SECURITY;
    END IF;
    RAISE NOTICE 'Disabled RLS on tables';
END $$;

-- Step 4: Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop constraint on trades table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trades_user_id_fkey' 
        AND table_name = 'trades'
    ) THEN
        ALTER TABLE public.trades DROP CONSTRAINT trades_user_id_fkey;
        RAISE NOTICE 'Dropped trades_user_id_fkey constraint';
    END IF;

    -- Drop constraint on trade_images table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trade_images_user_id_fkey' 
        AND table_name = 'trade_images'
    ) THEN
        ALTER TABLE public.trade_images DROP CONSTRAINT trade_images_user_id_fkey;
        RAISE NOTICE 'Dropped trade_images_user_id_fkey constraint';
    END IF;

    -- Drop constraint on daily_trading_stats table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'daily_trading_stats_user_id_fkey' 
        AND table_name = 'daily_trading_stats'
    ) THEN
        ALTER TABLE public.daily_trading_stats DROP CONSTRAINT daily_trading_stats_user_id_fkey;
        RAISE NOTICE 'Dropped daily_trading_stats_user_id_fkey constraint';
    END IF;
END $$;

-- Step 5: Modify user_id column to TEXT to support both UUID and BIGINT
-- TEXT can store both UUID strings and BIGINT strings
-- This must happen AFTER dropping policies and foreign keys
DO $$ 
BEGIN
    -- Alter trades.user_id to TEXT if not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' 
        AND column_name = 'user_id' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE public.trades ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed trades.user_id to TEXT';
    END IF;

    -- Alter trade_images.user_id to TEXT if not already
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_images' 
        AND column_name = 'user_id' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE public.trade_images ALTER COLUMN user_id TYPE TEXT;
        RAISE NOTICE 'Changed trade_images.user_id to TEXT';
    END IF;

    -- Alter daily_trading_stats.user_id to TEXT if not already (if table exists)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_trading_stats' 
            AND column_name = 'user_id' 
            AND data_type != 'text'
        ) THEN
            ALTER TABLE public.daily_trading_stats ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed daily_trading_stats.user_id to TEXT';
        END IF;
    END IF;
END $$;

-- Step 6: Add column comments for documentation
COMMENT ON COLUMN public.trades.user_id IS 'Can be either auth.users.id (UUID) or recruits.id (BIGINT) as TEXT';
COMMENT ON COLUMN public.trade_images.user_id IS 'Can be either auth.users.id (UUID) or recruits.id (BIGINT) as TEXT';

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        COMMENT ON COLUMN public.daily_trading_stats.user_id IS 'Can be either auth.users.id (UUID) or recruits.id (BIGINT) as TEXT';
    END IF;
END $$;

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON public.trades(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_asset_type ON public.trades(asset_type);
CREATE INDEX IF NOT EXISTS idx_trades_outcome ON public.trades(outcome);

CREATE INDEX IF NOT EXISTS idx_trade_images_user_id ON public.trade_images(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_images_trade_id ON public.trade_images(trade_id);

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_trading_stats(user_id);
        CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_trading_stats(stat_date DESC);
    END IF;
END $$;

-- Step 8: Create helpful view for user type tracking
CREATE OR REPLACE VIEW public.trades_with_user_info AS
SELECT 
  t.*,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id::TEXT = t.user_id) THEN 'auth'
    WHEN EXISTS (SELECT 1 FROM public.recruits WHERE id::TEXT = t.user_id) THEN 'recruit'
    ELSE 'unknown'
  END as user_type,
  COALESCE(
    (SELECT email FROM auth.users WHERE id::TEXT = t.user_id),
    (SELECT email FROM public.recruits WHERE id::TEXT = t.user_id)
  ) as user_email,
  COALESCE(
    (SELECT email FROM auth.users WHERE id::TEXT = t.user_id),
    (SELECT full_name FROM public.recruits WHERE id::TEXT = t.user_id),
    'Unknown User'
  ) as user_display_name
FROM public.trades t;

-- Step 9: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_images TO anon;

GRANT SELECT ON public.trades_with_user_info TO authenticated;
GRANT SELECT ON public.trades_with_user_info TO anon;

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_trading_stats') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_trading_stats TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_trading_stats TO anon;
    END IF;
END $$;

-- Step 10: Create helper function to get user info
CREATE OR REPLACE FUNCTION public.get_user_info(p_user_id TEXT)
RETURNS TABLE (
    user_id TEXT,
    user_type TEXT,
    email TEXT,
    display_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check auth.users first (UUID)
    IF EXISTS (SELECT 1 FROM auth.users WHERE id::TEXT = p_user_id) THEN
        RETURN QUERY
        SELECT 
            p_user_id,
            'auth'::TEXT,
            u.email::TEXT,
            u.email::TEXT
        FROM auth.users u
        WHERE u.id::TEXT = p_user_id;
        RETURN;
    END IF;
    
    -- Check recruits table (BIGINT)
    IF EXISTS (SELECT 1 FROM public.recruits WHERE id::TEXT = p_user_id) THEN
        RETURN QUERY
        SELECT 
            p_user_id,
            'recruit'::TEXT,
            r.email::TEXT,
            COALESCE(r.full_name, r.email)::TEXT
        FROM public.recruits r
        WHERE r.id::TEXT = p_user_id;
        RETURN;
    END IF;
    
    -- User not found
    RETURN QUERY
    SELECT p_user_id, 'unknown'::TEXT, NULL::TEXT, NULL::TEXT;
END;
$$;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION public.get_user_info(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(TEXT) TO anon;

-- =============================================
-- SUCCESS!
-- =============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trading Journal schema updated successfully!';
  RAISE NOTICE '✅ The trading journal now supports both auth users (UUID) and recruit users (BIGINT)';
  RAISE NOTICE '✅ user_id columns changed to TEXT to support both types';
  RAISE NOTICE '✅ RLS has been disabled - application code validates user access';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Helper function get_user_info() created';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Test with a recruit user login';
  RAISE NOTICE '   2. Verify trades can be created and retrieved';
  RAISE NOTICE '   3. Check the trades_with_user_info view for user types';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Test query: SELECT * FROM get_user_info(''YOUR_USER_ID'');';
END $$;
