-- ============================================
-- Casino Telegram Bot Integration - Database Migration
-- ============================================
-- This SQL migration adds necessary columns and tables for the
-- Casino Telegram bot account linking feature

-- Add Telegram-related columns to casino_users table
-- unique_id: Random string used for account linking
-- tg_id: Telegram user ID (chat_id)
-- tg_bonus_used: Flag to prevent duplicate bonuses

ALTER TABLE casino_users 
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS tg_id TEXT,
ADD COLUMN IF NOT EXISTS tg_bonus_used BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_casino_users_unique_id ON casino_users(unique_id);
CREATE INDEX IF NOT EXISTS idx_casino_users_tg_id ON casino_users(tg_id);

-- Create casino_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS casino_settings (
  id SERIAL PRIMARY KEY,
  bonus_amount INTEGER DEFAULT 100,
  bonus_time INTEGER DEFAULT 300,
  telegram_bonus_amount INTEGER DEFAULT 500,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing casino_settings table
ALTER TABLE casino_settings 
ADD COLUMN IF NOT EXISTS bonus_amount INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS bonus_time INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS telegram_bonus_amount INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Insert default settings if table is empty
INSERT INTO casino_settings (bonus_amount, bonus_time, telegram_bonus_amount)
SELECT 100, 300, 500
WHERE NOT EXISTS (SELECT 1 FROM casino_settings LIMIT 1);

-- Optional: Function to generate unique_id for existing users
-- Run this to backfill unique_id for users who don't have one yet

UPDATE casino_users 
SET unique_id = md5(random()::text || id::text || now()::text)
WHERE unique_id IS NULL;

-- Optional: Create a logging table for Telegram link attempts
CREATE TABLE IF NOT EXISTS casino_telegram_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES casino_users(id),
  tg_id TEXT,
  action VARCHAR(50), -- 'start', 'bind_success', 'bind_fail'
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casino_telegram_log_user ON casino_telegram_log(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_telegram_log_tg_id ON casino_telegram_log(tg_id);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the migration succeeded:

-- Check if columns were added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'casino_users' 
-- AND column_name IN ('unique_id', 'tg_id', 'tg_bonus_used');

-- Check if settings table has telegram bonus
-- SELECT * FROM casino_settings LIMIT 1;

-- Check if all users have unique_ids
-- SELECT COUNT(*) as users_without_unique_id 
-- FROM casino_users 
-- WHERE unique_id IS NULL;
