-- VIP Messages Table for storing private Telegram-style messages
-- Run this in your Supabase SQL editor

-- Create the vip_messages table
CREATE TABLE IF NOT EXISTS public.vip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  has_media BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  telegram_message_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add telegram_message_id column if table already exists
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS telegram_message_id INTEGER;

-- Add columns for notification tracking and chat info
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE public.vip_messages ADD COLUMN IF NOT EXISTS chat_title TEXT;

-- Create unique index on telegram_message_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_messages_telegram_id ON public.vip_messages(telegram_message_id) WHERE telegram_message_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.vip_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON public.vip_messages;
DROP POLICY IF EXISTS "Allow service role full access" ON public.vip_messages;

-- Policy: Allow anyone to read (VIP check happens in API)
CREATE POLICY "Allow public read access" ON public.vip_messages
  FOR SELECT USING (true);

-- Policy: Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access" ON public.vip_messages
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vip_messages_created_at ON public.vip_messages(created_at DESC);

-- Index for efficient notification query (unnotified recent messages)
CREATE INDEX IF NOT EXISTS idx_vip_messages_notification
ON public.vip_messages(created_at DESC)
WHERE notification_sent = false OR notification_sent IS NULL;

-- ============================================
-- AUTO-DELETE MESSAGES OLDER THAN 24 HOURS
-- ============================================

-- Function to delete old VIP messages (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_vip_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.vip_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE 'Cleaned up VIP messages older than 24 hours';
END;
$$;

-- Enable pg_cron extension (run this first if not already enabled)
-- You may need to enable this in Supabase Dashboard > Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run every hour (checks and deletes messages > 24h old)
-- This runs at minute 0 of every hour
SELECT cron.schedule(
  'cleanup-vip-messages',           -- Job name
  '0 * * * *',                      -- Every hour at minute 0
  'SELECT public.cleanup_old_vip_messages();'
);

-- Alternative: Run once daily at midnight UTC
-- SELECT cron.schedule(
--   'cleanup-vip-messages-daily',
--   '0 0 * * *',                    -- At midnight UTC daily
--   'SELECT public.cleanup_old_vip_messages();'
-- );

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the scheduled job:
-- SELECT cron.unschedule('cleanup-vip-messages');

-- Manual cleanup function you can call anytime
CREATE OR REPLACE FUNCTION public.clear_all_vip_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.vip_messages;
  RAISE NOTICE 'All VIP messages cleared';
END;
$$;

-- ============================================
-- SAMPLE DATA (will auto-delete after 24h)
-- ============================================

-- Insert sample VIP messages for testing
INSERT INTO public.vip_messages (message, has_media, views, created_at) VALUES
(
  '🚀 VIP SIGNAL: GOLD (XAUUSD)

📈 BUY @ 2650.00
🎯 TP1: 2665.00
🎯 TP2: 2680.00
🛑 SL: 2635.00

⚡ Risk: 1-2% of capital
📊 Confidence: HIGH',
  false,
  1247,
  NOW() - INTERVAL '2 hours'
),
(
  '💎 PREMIUM ANALYSIS: EUR/USD

Looking for a potential reversal at the 1.0850 support level. Multiple confluences including:

✅ 200 EMA support
✅ Previous structure
✅ RSI oversold

Wait for confirmation before entry.',
  true,
  892,
  NOW() - INTERVAL '5 hours'
),
(
  '📊 WEEKLY MARKET OUTLOOK

🔹 USD strength expected to continue
🔹 Watch NFP data Friday
🔹 Gold consolidating before next move
🔹 BTC holding key support

Full analysis in members area 👑',
  false,
  2143,
  NOW() - INTERVAL '1 day'
),
(
  '✅ CLOSED IN PROFIT!

GBP/JPY signal hit TP2!

📈 Entry: 188.50
🎯 Exit: 189.80
💰 +130 pips

Congrats to everyone who took this! 🔥',
  false,
  1567,
  NOW() - INTERVAL '2 days'
),
(
  '⚠️ RISK MANAGEMENT REMINDER

Never risk more than 1-2% per trade.

Even with a 50% win rate, proper risk management = long-term profitability.

Protect your capital! 💪',
  false,
  983,
  NOW() - INTERVAL '3 days'
);

-- Grant permissions
GRANT SELECT ON public.vip_messages TO anon;
GRANT SELECT ON public.vip_messages TO authenticated;
GRANT ALL ON public.vip_messages TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_vip_messages() TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_all_vip_messages() TO service_role;
