-- =============================================
-- RECRUITS TABLE - Run this in Supabase SQL Editor
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
  notes TEXT
);

-- Add VIP columns if table already exists
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS vip_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_recruits_email ON public.recruits(email);
CREATE INDEX IF NOT EXISTS idx_recruits_affiliate_code ON public.recruits(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_recruits_referred_by_code ON public.recruits(referred_by_code);
CREATE INDEX IF NOT EXISTS idx_recruits_status ON public.recruits(status);
CREATE INDEX IF NOT EXISTS idx_recruits_is_vip ON public.recruits(is_vip);

-- Enable Row Level Security
ALTER TABLE public.recruits ENABLE ROW LEVEL SECURITY;

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
-- INSERT EXISTING DATA (optional - run after table creation)
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
