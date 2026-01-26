-- ============================================================================
-- PUSH NOTIFICATIONS TABLES
-- Run this in your Supabase SQL Editor to set up notification tables
-- ============================================================================

-- Table to store push subscriptions with channel preferences
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    -- Channel subscription preferences
    channel_trades BOOLEAN DEFAULT true,
    channel_main BOOLEAN DEFAULT true,
    channel_shop BOOLEAN DEFAULT true,
    channel_vip BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add channel columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'channel_trades') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN channel_trades BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'channel_main') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN channel_main BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'channel_shop') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN channel_shop BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'channel_vip') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN channel_vip BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_channels ON public.push_subscriptions(channel_trades, channel_main, channel_shop, channel_vip) WHERE is_active = true;

-- Table to store notification history
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT DEFAULT 'trades',
    image_url TEXT,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_history_channel ON public.notification_history(channel);
CREATE INDEX IF NOT EXISTS idx_notification_history_created ON public.notification_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to recreate them)
DROP POLICY IF EXISTS "Allow public subscription insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow update own subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow select for service role" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow anon select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow insert for service role" ON public.notification_history;
DROP POLICY IF EXISTS "Allow select for service role" ON public.notification_history;
DROP POLICY IF EXISTS "Allow anon notification operations" ON public.notification_history;

-- Policies for push_subscriptions
-- Allow inserts from anyone (public subscription)
CREATE POLICY "Allow public subscription insert" ON public.push_subscriptions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow updates on own subscription (by endpoint)
CREATE POLICY "Allow update own subscription" ON public.push_subscriptions
    FOR UPDATE TO anon, authenticated USING (true);

-- Allow select for anon and authenticated (needed for API routes)
CREATE POLICY "Allow anon select" ON public.push_subscriptions
    FOR SELECT TO anon, authenticated USING (true);

-- Policies for notification_history
-- Allow all operations for anon and authenticated (for API routes)
CREATE POLICY "Allow anon notification operations" ON public.notification_history
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- OPTIONAL: Trigger to auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS (adjust based on your setup)
-- ============================================================================

-- Grant usage on the tables
GRANT ALL ON public.push_subscriptions TO anon;
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

GRANT ALL ON public.notification_history TO anon;
GRANT ALL ON public.notification_history TO authenticated;
GRANT ALL ON public.notification_history TO service_role;
