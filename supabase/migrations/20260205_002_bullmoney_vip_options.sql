-- Add richer fields for BullMoney VIP offerings
ALTER TABLE bullmoney_vip
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS plan_options JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Upsert tiers with Whop-inspired pricing options and placeholder checkout links
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES
  (
    '00000000-0000-0000-0000-000000000901',
    'BullMoney VIP Group + Community',
    'All-in-one membership: premium trade insights, daily breakdowns, live sessions, coaching, PDFs, tools, and private community access.',
    9.99,
    'https://whop.com/bullmoney-vip/',
    FALSE,
    1,
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    '[
      {"label":"Monthly","price":9.99,"interval":"month","buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"One Time","price":149.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip/"}
    ]'
  ),
  (
    '00000000-0000-0000-0000-000000000902',
    'BullMoney ICT Indicator',
    'Smart Money Concepts made simple: BOS/CHoCH, liquidity sweeps, FVGs, order blocks, sessions, premium/discount zones, and risk tools.',
    2.50,
    'https://whop.com/bullmoney-vip/',
    FALSE,
    2,
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    '[
      {"label":"Monthly","price":2.50,"interval":"month","buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"3 Months (33% off)","price":4.99,"interval":"3-month","buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"Yearly (50% off)","price":14.99,"interval":"year","buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"One Time","price":29.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip/"}
    ]'
  ),
  (
    '00000000-0000-0000-0000-000000000903',
    'BullMoney VIP Indicator',
    'Institutional-grade clarity for cleaner entries; works across forex, gold, indices, crypto with updates and support.',
    39.99,
    'https://whop.com/bullmoney-vip/',
    FALSE,
    3,
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    '[
      {"label":"6 Months (3d trial)","price":39.99,"interval":"6-month","trial_days":3,"buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"Yearly (7d trial)","price":99.99,"interval":"year","trial_days":7,"buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"One Time","price":199.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip/"}
    ]'
  ),
  (
    '00000000-0000-0000-0000-000000000904',
    'BullMoney Bot',
    'Automated BullMoney bot with managed strategies and monitoring.',
    149.99,
    'https://whop.com/bullmoney-vip/',
    FALSE,
    4,
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80',
    '[
      {"label":"Monthly","price":149.99,"interval":"month","buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"3 Months (3d trial)","price":499.99,"interval":"3-month","trial_days":3,"buy_url":"https://whop.com/bullmoney-vip/"},
      {"label":"One Time (7d trial)","price":999.99,"interval":"one-time","trial_days":7,"buy_url":"https://whop.com/bullmoney-vip/"}
    ]'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  buy_url = EXCLUDED.buy_url,
  coming_soon = EXCLUDED.coming_soon,
  sort_order = EXCLUDED.sort_order,
  image_url = EXCLUDED.image_url,
  plan_options = EXCLUDED.plan_options,
  updated_at = NOW();
