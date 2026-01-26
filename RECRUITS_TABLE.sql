-- =============================================
-- RECRUITS TABLE + PUSH NOTIFICATIONS
-- Run this in Supabase SQL Editor
-- Combines user data with notification preferences
-- =============================================

-- =============================================
-- PART 1: RECRUITS TABLE
-- =============================================

-- Create the recruits table
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
  total_referred_manual INTEGER,
  used_code BOOLEAN DEFAULT false,
  image_url TEXT,
  -- VIP fields
  is_vip BOOLEAN DEFAULT false,
  vip_updated_at TIMESTAMP WITH TIME ZONE,
  -- Additional fields for admin panel
  full_name TEXT,
  phone TEXT,
  telegram_username TEXT,
  discord_username TEXT,
  notes TEXT,
  -- Push notification preferences (per recruit)
  notifications_enabled BOOLEAN DEFAULT false,
  notify_trades BOOLEAN DEFAULT true,
  notify_livestreams BOOLEAN DEFAULT true,
  notify_news BOOLEAN DEFAULT true,
  notify_vip BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true
);

-- Add VIP columns if table already exists
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS vip_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add notification preference columns if table already exists
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_trades BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_livestreams BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_news BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_vip BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_recruits_email ON public.recruits(email);
CREATE INDEX IF NOT EXISTS idx_recruits_affiliate_code ON public.recruits(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_recruits_referred_by_code ON public.recruits(referred_by_code);
CREATE INDEX IF NOT EXISTS idx_recruits_status ON public.recruits(status);
CREATE INDEX IF NOT EXISTS idx_recruits_is_vip ON public.recruits(is_vip);
CREATE INDEX IF NOT EXISTS idx_recruits_notifications ON public.recruits(notifications_enabled) WHERE notifications_enabled = true;

-- Enable Row Level Security
ALTER TABLE public.recruits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own recruit data" ON public.recruits;
DROP POLICY IF EXISTS "Service role has full access" ON public.recruits;
DROP POLICY IF EXISTS "Anyone can insert recruits" ON public.recruits;

-- Policy: Allow authenticated users to read their own data
CREATE POLICY "Users can view own recruit data" ON public.recruits
  FOR SELECT USING (auth.email() = email);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access" ON public.recruits
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Allow insert for registration
CREATE POLICY "Anyone can insert recruits" ON public.recruits
  FOR INSERT WITH CHECK (true);


-- =============================================
-- PART 2: PUSH SUBSCRIPTIONS TABLE
-- Links device push tokens to recruits
-- =============================================

-- Table to store push subscriptions with channel preferences
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Link to recruit (optional - for guest users who haven't registered)
    recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
    recruit_email TEXT,
    -- Push subscription data
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_type TEXT, -- 'mobile', 'desktop', 'tablet'
    browser TEXT, -- 'chrome', 'firefox', 'safari', etc.
    is_active BOOLEAN DEFAULT true,
    -- Channel subscription preferences
    channel_trades BOOLEAN DEFAULT true,
    channel_main BOOLEAN DEFAULT true,
    channel_shop BOOLEAN DEFAULT true,
    channel_vip BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'recruit_id') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'recruit_email') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN recruit_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'device_type') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN device_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'browser') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN browser TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'push_subscriptions' AND column_name = 'last_used_at') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
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

-- Indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_recruit ON public.push_subscriptions(recruit_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON public.push_subscriptions(recruit_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_channels ON public.push_subscriptions(channel_trades, channel_main, channel_shop, channel_vip) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public subscription insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow update own subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow select for service role" ON public.push_subscriptions;

-- Policies for push_subscriptions
CREATE POLICY "Allow public subscription insert" ON public.push_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own subscription" ON public.push_subscriptions
    FOR UPDATE USING (true);

CREATE POLICY "Allow select for service role" ON public.push_subscriptions
    FOR SELECT TO authenticated USING (true);


-- =============================================
-- PART 3: NOTIFICATION HISTORY TABLE
-- Tracks all sent notifications
-- =============================================

CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT DEFAULT 'trades',
    image_url TEXT,
    action_url TEXT,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_by TEXT, -- admin email who triggered it
    trigger_type TEXT DEFAULT 'manual', -- 'manual', 'telegram_webhook', 'scheduled'
    telegram_message_id TEXT, -- if triggered by telegram
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification_history
CREATE INDEX IF NOT EXISTS idx_notification_history_channel ON public.notification_history(channel);
CREATE INDEX IF NOT EXISTS idx_notification_history_created ON public.notification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_trigger ON public.notification_history(trigger_type);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert for service role" ON public.notification_history;
DROP POLICY IF EXISTS "Allow select for service role" ON public.notification_history;

CREATE POLICY "Allow insert for service role" ON public.notification_history
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow select for service role" ON public.notification_history
    FOR SELECT TO authenticated USING (true);


-- =============================================
-- PART 4: TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for push_subscriptions
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to link push subscription to recruit by email
CREATE OR REPLACE FUNCTION link_subscription_to_recruit()
RETURNS TRIGGER AS $$
BEGIN
    -- If recruit_email is set, try to find and link the recruit
    IF NEW.recruit_email IS NOT NULL AND NEW.recruit_id IS NULL THEN
        SELECT id INTO NEW.recruit_id 
        FROM public.recruits 
        WHERE email = NEW.recruit_email 
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS link_subscription_trigger ON public.push_subscriptions;
CREATE TRIGGER link_subscription_trigger
    BEFORE INSERT OR UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION link_subscription_to_recruit();


-- =============================================
-- PART 5: USEFUL VIEWS
-- =============================================

-- View: Recruits with their notification preferences and device count
CREATE OR REPLACE VIEW public.recruit_notification_summary AS
SELECT 
    r.id,
    r.email,
    r.full_name,
    r.is_vip,
    r.notifications_enabled,
    r.notify_trades,
    r.notify_livestreams,
    r.notify_news,
    r.notify_vip,
    COUNT(ps.id) FILTER (WHERE ps.is_active = true) as active_devices,
    MAX(ps.last_used_at) as last_notification_device_activity
FROM public.recruits r
LEFT JOIN public.push_subscriptions ps ON ps.recruit_id = r.id
GROUP BY r.id;

-- View: Active subscribers by channel
CREATE OR REPLACE VIEW public.channel_subscriber_counts AS
SELECT 
    COUNT(*) FILTER (WHERE channel_trades = true) as trades_subscribers,
    COUNT(*) FILTER (WHERE channel_main = true) as livestream_subscribers,
    COUNT(*) FILTER (WHERE channel_shop = true) as news_subscribers,
    COUNT(*) FILTER (WHERE channel_vip = true) as vip_subscribers,
    COUNT(*) as total_active_subscriptions
FROM public.push_subscriptions
WHERE is_active = true;


-- =============================================
-- PART 6: GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.push_subscriptions TO anon;
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

GRANT ALL ON public.notification_history TO anon;
GRANT ALL ON public.notification_history TO authenticated;
GRANT ALL ON public.notification_history TO service_role;

GRANT SELECT ON public.recruit_notification_summary TO authenticated;
GRANT SELECT ON public.recruit_notification_summary TO service_role;

GRANT SELECT ON public.channel_subscriber_counts TO authenticated;
GRANT SELECT ON public.channel_subscriber_counts TO service_role;


-- =============================================
-- PART 7: VIP MESSAGES NOTIFICATION TRACKING
-- For cron job background notifications
-- =============================================

-- Add columns for notification tracking and chat info to vip_messages
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS chat_title TEXT;

-- Index for efficient notification query (unnotified recent messages)
-- This allows the cron job to quickly find messages that haven't been notified yet
CREATE INDEX IF NOT EXISTS idx_vip_messages_notification
ON public.vip_messages(created_at DESC)
WHERE notification_sent = false OR notification_sent IS NULL;

-- Index for telegram_message_id lookups (for deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_messages_telegram_id
ON public.vip_messages(telegram_message_id)
WHERE telegram_message_id IS NOT NULL;


-- =============================================
-- PART 8: INSERT EXISTING RECRUIT DATA
-- =============================================

INSERT INTO "public"."recruits" ("id", "created_at", "email", "password", "mt5_id", "affiliate_code", "referred_by_code", "social_handle", "task_broker_verified", "task_social_verified", "status", "commission_balance", "total_referred_manual", "used_code", "image_url") VALUES 
('1', '2025-12-10 13:32:18.684765+00', 'mrbullmoney@gmail.com', '9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED', '12345', 'bmt_justin', 'X3R7P', '@justin_trades', 'true', 'false', 'Active', '1250.00', null, 'false', 'https://orvvyjkntgijiwxzdtqx.supabase.co/storage/v1/object/public/face-scans/1_1766009364333.jpg'),
('11', '2025-12-18 08:31:08.234415+00', 'justindaniels226@gmail.com', 'kkE9RSI6mA6lJ_k', '301872959', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('12', '2025-12-25 11:13:56.064833+00', 'bullmoneytraders454@gmail.com', 'ziRiHCX9DnPU8Sd', '125465456456', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('13', '2025-12-25 11:16:07.390447+00', 'bullmoneytraders45545@gmail.com', 'YfnxZr7HYhim4EN', '2513515', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('15', '2026-01-01 07:55:45.675004+00', 'kizzyfxtraders@gmail.com', 'Kizzykiiy@10', '400235273', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('16', '2026-01-06 08:46:06.413313+00', 'lukecloete28@gmail.com', 'n3v2pntJg2wR463', '85924439', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('17', '2026-01-06 15:20:23.959824+00', '5465@gmail.com', '465465', '5445454', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null),
('19', '2026-01-14 17:21:40.025209+00', 'timuralibhai123@gmail.com', 'Jasmeene1@', '390867842', null, 'X3R7P', null, 'false', 'false', 'Pending', '0.00', null, 'true', null)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to avoid conflicts with future inserts
SELECT setval('recruits_id_seq', (SELECT MAX(id) FROM public.recruits) + 1);
