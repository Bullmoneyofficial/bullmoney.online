-- ============================================================================
-- CRASH TRACKING & ANALYTICS TABLES
-- Run this in Supabase SQL Editor to create the required tables
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CRASH LOGS TABLE
-- Stores all tracking events (clicks, errors, modals, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crash_logs (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT NOT NULL,
    component TEXT NOT NULL,
    action TEXT,
    target TEXT,
    metadata JSONB DEFAULT '{}',
    session_id TEXT NOT NULL,
    user_agent TEXT,
    url TEXT,
    device_tier TEXT,
    fps INTEGER,
    error_message TEXT,
    error_stack TEXT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_crash_logs_session ON public.crash_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_crash_logs_event_type ON public.crash_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_crash_logs_component ON public.crash_logs(component);
CREATE INDEX IF NOT EXISTS idx_crash_logs_created_at ON public.crash_logs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.crash_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserts from authenticated and anonymous users
CREATE POLICY "Allow public inserts on crash_logs" ON public.crash_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow reads only for authenticated admins (optional)
-- You can modify this based on your needs
CREATE POLICY "Allow authenticated reads on crash_logs" ON public.crash_logs
    FOR SELECT
    USING (true);

-- ============================================================================
-- USER SESSIONS TABLE
-- Stores session-level data for debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    device_info JSONB DEFAULT '{}',
    page_views TEXT[] DEFAULT '{}',
    event_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_error_count ON public.user_sessions(error_count DESC);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserts and updates
CREATE POLICY "Allow public upsert on user_sessions" ON public.user_sessions
    FOR ALL
    WITH CHECK (true);

-- ============================================================================
-- PERFORMANCE METRICS TABLE (Optional)
-- Stores aggregated performance data over time
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT NOT NULL,
    component TEXT NOT NULL,
    avg_fps REAL,
    min_fps REAL,
    max_fps REAL,
    render_count INTEGER DEFAULT 0,
    avg_render_time REAL,
    device_tier TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component ON public.performance_metrics(component);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at DESC);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on performance_metrics" ON public.performance_metrics
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- USEFUL VIEWS FOR ANALYTICS
-- ============================================================================

-- View for error summary by component
CREATE OR REPLACE VIEW public.error_summary AS
SELECT 
    component,
    error_message,
    COUNT(*) as error_count,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    COUNT(DISTINCT session_id) as affected_sessions
FROM public.crash_logs
WHERE event_type IN ('error', 'crash')
GROUP BY component, error_message
ORDER BY error_count DESC;

-- View for session health
CREATE OR REPLACE VIEW public.session_health AS
SELECT 
    id as session_id,
    started_at,
    last_activity,
    EXTRACT(EPOCH FROM (last_activity - started_at)) / 60 as session_duration_mins,
    event_count,
    error_count,
    device_info->>'tier' as device_tier,
    device_info->>'browser' as browser,
    device_info->>'os' as os,
    device_info->>'isMobile' as is_mobile,
    CASE 
        WHEN error_count = 0 THEN 'healthy'
        WHEN error_count <= 2 THEN 'warning'
        ELSE 'critical'
    END as health_status
FROM public.user_sessions
ORDER BY started_at DESC;

-- View for component usage
CREATE OR REPLACE VIEW public.component_usage AS
SELECT 
    component,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    DATE_TRUNC('hour', created_at) as hour
FROM public.crash_logs
GROUP BY component, event_type, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, event_count DESC;

-- ============================================================================
-- CLEANUP FUNCTION (Optional)
-- Automatically delete old logs after 30 days
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.crash_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.user_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- You can set up a cron job in Supabase to run this daily:
-- SELECT cron.schedule('cleanup-old-logs', '0 3 * * *', 'SELECT cleanup_old_logs();');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT INSERT, SELECT ON public.crash_logs TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE ON public.user_sessions TO anon, authenticated;
GRANT INSERT, SELECT ON public.performance_metrics TO anon, authenticated;
GRANT SELECT ON public.error_summary TO authenticated;
GRANT SELECT ON public.session_health TO authenticated;
GRANT SELECT ON public.component_usage TO authenticated;
