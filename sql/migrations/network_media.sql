-- =============================================
-- NETWORK MEDIA TABLES (Instagram, TikTok, YouTube)
-- Run this in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.network_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    handle TEXT,
    label TEXT,
    color TEXT DEFAULT '#111111',
    profile_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.network_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.network_accounts(id) ON DELETE CASCADE,
    post_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS network_accounts_platform_idx ON public.network_accounts(platform);
CREATE INDEX IF NOT EXISTS network_posts_account_id_idx ON public.network_posts(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS network_accounts_platform_handle_key ON public.network_accounts(platform, handle);
CREATE UNIQUE INDEX IF NOT EXISTS network_posts_account_url_key ON public.network_posts(account_id, post_url);

-- Seed accounts (safe upsert)
INSERT INTO public.network_accounts (platform, handle, label, color, profile_url, sort_order, is_active)
VALUES
  ('instagram', 'bullmoney.online', 'BullMoney Online', '#111111', 'https://instagram.com/bullmoney.online', 0, true),
  ('instagram', 'bullmoney.official', 'BullMoney Official', '#111111', 'https://instagram.com/bullmoney.official', 1, true),
  ('instagram', 'bullmoney.trades', 'BullMoney Trades', '#111111', 'https://instagram.com/bullmoney.trades', 2, true),
  ('instagram', 'bullmoney.shop', 'BullMoney Shop', '#111111', 'https://instagram.com/bullmoney.shop', 3, true),
  ('tiktok', 'bullmoney.shop', 'BullMoney TikTok', '#111111', 'https://www.tiktok.com/@bullmoney.shop', 4, true),
  ('youtube', 'bullmoneyfx', 'BullMoney YouTube', '#111111', 'https://www.youtube.com/@bullmoneyfx', 5, true)
ON CONFLICT (platform, handle) DO UPDATE
SET label = EXCLUDED.label,
    color = EXCLUDED.color,
    profile_url = EXCLUDED.profile_url,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- Seed Instagram posts (safe upsert)
WITH acct AS (
  SELECT id FROM public.network_accounts WHERE platform = 'instagram' AND handle = 'bullmoney.online'
)
INSERT INTO public.network_posts (account_id, post_url, sort_order, is_active)
SELECT acct.id, url, ord, true
FROM acct,
(VALUES
  ('https://www.instagram.com/p/DUya0WiDjkm/', 0),
  ('https://www.instagram.com/p/DUybOzrDglP/', 1),
  ('https://www.instagram.com/p/DUyb2jtDm44/', 2)
) AS v(url, ord)
ON CONFLICT (account_id, post_url) DO NOTHING;

WITH acct AS (
  SELECT id FROM public.network_accounts WHERE platform = 'instagram' AND handle = 'bullmoney.official'
)
INSERT INTO public.network_posts (account_id, post_url, sort_order, is_active)
SELECT acct.id, url, ord, true
FROM acct,
(VALUES
  ('https://www.instagram.com/p/DLDd2HMI6qy/', 0),
  ('https://www.instagram.com/p/DPl4t2hjeE8/', 1),
  ('https://www.instagram.com/p/DLImzKJIvj4/', 2)
) AS v(url, ord)
ON CONFLICT (account_id, post_url) DO NOTHING;

WITH acct AS (
  SELECT id FROM public.network_accounts WHERE platform = 'instagram' AND handle = 'bullmoney.trades'
)
INSERT INTO public.network_posts (account_id, post_url, sort_order, is_active)
SELECT acct.id, url, ord, true
FROM acct,
(VALUES
  ('https://www.instagram.com/p/DSRL_fniG6g/', 0),
  ('https://www.instagram.com/p/DSRLxRNCPUS/', 1),
  ('https://www.instagram.com/p/DRrqQO9iCvE/', 2)
) AS v(url, ord)
ON CONFLICT (account_id, post_url) DO NOTHING;

WITH acct AS (
  SELECT id FROM public.network_accounts WHERE platform = 'instagram' AND handle = 'bullmoney.shop'
)
INSERT INTO public.network_posts (account_id, post_url, sort_order, is_active)
SELECT acct.id, url, ord, true
FROM acct,
(VALUES
  ('https://www.instagram.com/p/DUya0WiDjkm/', 0),
  ('https://www.instagram.com/p/DUybOzrDglP/', 1),
  ('https://www.instagram.com/p/DUyb2jtDm44/', 2)
) AS v(url, ord)
ON CONFLICT (account_id, post_url) DO NOTHING;
