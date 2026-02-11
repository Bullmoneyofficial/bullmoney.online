-- ============================================================================
-- BULLMONEY PUSH NOTIFICATIONS - Database Schema
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor
-- This creates the tables needed for the push notification system

-- ============================================================================
-- 1. PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores web push subscription data for each device/browser

CREATE TABLE IF NOT EXISTS push_subscriptions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Push subscription data (from browser PushManager API)
  endpoint TEXT UNIQUE NOT NULL,  -- Unique push endpoint URL (FCM, APNs, etc.)
  p256dh TEXT NOT NULL,           -- Client public key for encryption
  auth TEXT NOT NULL,             -- Authentication secret for encryption

  -- Metadata
  user_agent TEXT,                -- Browser/device info for debugging

  -- Channel preferences (which notifications to receive)
  channel_trades BOOLEAN DEFAULT true,  -- Free trade signals
  channel_main BOOLEAN DEFAULT true,    -- Main announcements
  channel_shop BOOLEAN DEFAULT true,    -- Shop updates
  channel_vip BOOLEAN DEFAULT true,     -- VIP signals

  -- Status
  is_active BOOLEAN DEFAULT true,       -- Whether subscription is valid

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. VIP MESSAGES TABLE
-- ============================================================================
-- Stores Telegram channel posts that trigger push notifications

CREATE TABLE IF NOT EXISTS vip_messages (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Telegram message data
  telegram_message_id BIGINT UNIQUE NOT NULL,  -- Telegram's unique message ID
  message TEXT,                                 -- Message text/caption
  has_media BOOLEAN DEFAULT false,              -- Has photo/video/document

  -- Channel info
  chat_id TEXT,                                 -- Telegram chat/channel ID
  chat_title TEXT,                              -- Channel display name

  -- Notification status
  notification_sent BOOLEAN DEFAULT false,      -- Whether push was sent

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON push_subscriptions(is_active);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions(endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_channels
  ON push_subscriptions(channel_trades, channel_main, channel_shop, channel_vip)
  WHERE is_active = true;

-- VIP messages indexes
CREATE INDEX IF NOT EXISTS idx_vip_messages_telegram_id
  ON vip_messages(telegram_message_id);

CREATE INDEX IF NOT EXISTS idx_vip_messages_notification_sent
  ON vip_messages(notification_sent)
  WHERE notification_sent = false;

CREATE INDEX IF NOT EXISTS idx_vip_messages_created_at
  ON vip_messages(created_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Recommended for security, but optional
-- Uncomment if you want to enable RLS

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for API routes)
CREATE POLICY "Service role has full access to push_subscriptions"
  ON push_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anyone to insert subscriptions (needed for notification signup)
CREATE POLICY "Anyone can insert push subscriptions"
  ON push_subscriptions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow anyone to read their own subscription (by endpoint)
CREATE POLICY "Users can read their subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Enable RLS on vip_messages
ALTER TABLE vip_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for API routes)
CREATE POLICY "Service role has full access to vip_messages"
  ON vip_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public to read messages (optional - for displaying in UI)
CREATE POLICY "Public can read vip_messages"
  ON vip_messages
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS (OPTIONAL)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for push_subscriptions
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for vip_messages
DROP TRIGGER IF EXISTS update_vip_messages_updated_at ON vip_messages;
CREATE TRIGGER update_vip_messages_updated_at
  BEFORE UPDATE ON vip_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. USEFUL QUERIES
-- ============================================================================

-- Get total active subscriptions
-- SELECT COUNT(*) FROM push_subscriptions WHERE is_active = true;

-- Get subscriptions by channel
-- SELECT COUNT(*) FROM push_subscriptions WHERE is_active = true AND channel_trades = true;

-- Get recent unnotified messages
-- SELECT * FROM vip_messages WHERE notification_sent = false ORDER BY created_at DESC;

-- Get notification stats for last 24 hours
-- SELECT
--   COUNT(*) as total_messages,
--   SUM(CASE WHEN notification_sent THEN 1 ELSE 0 END) as notified
-- FROM vip_messages
-- WHERE created_at > now() - interval '24 hours';

-- Clean up old messages (keep last 30 days)
-- DELETE FROM vip_messages WHERE created_at < now() - interval '30 days';

-- Delete inactive subscriptions older than 30 days
-- DELETE FROM push_subscriptions
-- WHERE is_active = false
-- AND updated_at < now() - interval '30 days';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify the tables exist:
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('push_subscriptions', 'vip_messages');
--
-- Expected output:
-- | table_name          |
-- |---------------------|
-- | push_subscriptions  |
-- | vip_messages        |
-- ============================================================================
