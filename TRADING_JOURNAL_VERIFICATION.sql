-- =============================================
-- VERIFICATION SCRIPT
-- Run this after TRADING_JOURNAL_FIX.sql
-- =============================================

-- 1. Check if trades table has TEXT user_id
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('trades', 'trade_images', 'daily_trading_stats')
AND column_name = 'user_id'
ORDER BY table_name;

-- 2. Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('trades', 'trade_images', 'daily_trading_stats')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Check RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('trades', 'trade_images', 'daily_trading_stats')
AND schemaname = 'public';

-- 4. Check if helper function exists
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_user_info'
AND n.nspname = 'public';

-- 4b. Test the helper function with a sample recruit user (if it exists)
-- Replace '1' with an actual recruit ID from your recruits table
-- Note: Wrapped in DO block to prevent error if function doesn't exist
DO $$
DECLARE
    v_result RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_user_info' AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE 'Testing get_user_info function...';
        FOR v_result IN SELECT * FROM get_user_info('1'::TEXT) LOOP
            RAISE NOTICE 'Result: user_id=%, type=%, email=%', v_result.user_id, v_result.user_type, v_result.email;
        END LOOP;
    ELSE
        RAISE WARNING 'get_user_info function does not exist. Run TRADING_JOURNAL_FIX.sql first.';
    END IF;
END $$;

-- 5. Check if the view works
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'trades_with_user_info'
    ) THEN
        RAISE NOTICE 'trades_with_user_info view exists - querying...';
    ELSE
        RAISE WARNING 'trades_with_user_info view does not exist. Run TRADING_JOURNAL_FIX.sql first.';
    END IF;
END $$;

-- Query the view (will fail gracefully if view doesn't exist)
SELECT 
    id,
    user_id,
    user_type,
    user_email,
    user_display_name,
    asset_symbol,
    direction,
    entry_price,
    net_pnl,
    outcome
FROM trades_with_user_info
ORDER BY entry_date DESC
LIMIT 5;

-- 6. Check recruits table structure
SELECT 
    id::TEXT as recruit_id,
    email,
    full_name,
    is_vip,
    created_at
FROM public.recruits
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verify grants
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('trades', 'trade_images', 'trades_with_user_info')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- =============================================
-- EXPECTED RESULTS:
-- =============================================
-- 1. user_id columns should be 'text' type
-- 2. Multiple indexes should exist (idx_trades_user_id, idx_trades_entry_date, etc.)
-- 3. RLS should be 'f' (false/disabled) for all tables
-- 4. get_user_info function should exist in public schema
-- 5. trades_with_user_info view should exist and return data
-- 6. Recruits should have BIGINT ids that can be converted to TEXT
-- 7. Both authenticated and anon should have SELECT, INSERT, UPDATE, DELETE privileges

-- =============================================
-- IF ANY WARNINGS APPEAR:
-- =============================================
-- ⚠️  If function or view doesn't exist: Run TRADING_JOURNAL_FIX.sql first
-- ⚠️  If user_id is still UUID: Run TRADING_JOURNAL_FIX.sql to convert to TEXT
-- ⚠️  If RLS is enabled (true): Run TRADING_JOURNAL_FIX.sql to disable it
