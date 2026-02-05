-- Update BullMoney VIP imagery and keep pricing/options in sync
BEGIN;

-- BULLMONEY VIP GROUP + COMMUNITY
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000901',
  'BULLMONEY VIP GROUP + COMMUNITY',
  'BullMoney VIP is the all-in-one trading membership built for real results. Get premium trade insights, daily breakdowns, live sessions, mentorship, exclusive tools/docs, and private community support.',
  9.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  1,
  'https://img-v2-prod.whop.com/unsafe/rs:fit:1080:0/plain/https%3A%2F%2Fassets.whop.com%2Fuploads%2F2025-11-19%2Fuser_7019238_ed28bbd9-84c8-4a9f-a1e0-43c0a329c659.jpeg@avif?w=1080&q=75',
  '[
    {"label":"Monthly","price":9.99,"interval":"month","buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"One Time","price":149.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip"}
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

-- BULLMONEY ICT INDICATOR
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000902',
  'BULLMONEY ICT INDICATOR',
  'Smart Money Concepts made simple: BOS/CHoCH, liquidity sweeps, FVGs, order blocks, session tools, premium/discount zones, and risk aids for clean execution.',
  2.50,
  'https://whop.com/bullmoney-vip',
  FALSE,
  2,
  'https://img-v2-prod.whop.com/unsafe/rs:fit:1080:0/plain/https%3A%2F%2Fassets.whop.com%2Fuploads%2F2025-11-19%2Fuser_7019238_f74a3f34-0eaf-4f2a-bd6b-fa9396c9931b.png@avif?w=1080&q=75',
  '[
    {"label":"Monthly","price":2.50,"interval":"month","buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"3 Months (33% off)","price":4.99,"interval":"3-month","buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"Yearly (50% off)","price":14.99,"interval":"year","buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"One Time","price":29.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip"}
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

-- BULLMONEY VIP INDICATOR
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000903',
  'BULLMONEY VIP INDICATOR',
  'Institutional trading made simple with high-clarity signals, multi-timeframe support, and VIP perks (updates + support).',
  39.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  3,
  'https://img-v2-prod.whop.com/unsafe/rs:fit:1080:0/plain/https%3A%2F%2Fassets.whop.com%2Fuploads%2F2025-11-19%2Fuser_7019238_66d45beb-e4f7-4158-bcbc-7a87e2ecab54.jpeg@avif?w=1080&q=75',
  '[
    {"label":"6 Months (3d trial)","price":39.99,"interval":"6-month","trial_days":3,"buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"Yearly (7d trial)","price":99.99,"interval":"year","trial_days":7,"buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"One Time","price":199.99,"interval":"one-time","buy_url":"https://whop.com/bullmoney-vip"}
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

-- BULLMONEY BOT
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000904',
  'BULLMONEY BOT',
  'Automated BullMoney bot with managed strategies and monitoring; connect, choose a plan, and let the automation execute.',
  149.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  4,
  'https://img-v2-prod.whop.com/unsafe/rs:fit:3840:0/plain/https%3A%2F%2Fassets.whop.com%2Fuploads%2F2025-11-19%2Fuser_7019238_d98a2f06-e479-412c-8145-cbe694d7a9f0.jpeg@avif?w=3840&q=75',
  '[
    {"label":"Monthly","price":149.99,"interval":"month","buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"3 Months (3d trial)","price":499.99,"interval":"3-month","trial_days":3,"buy_url":"https://whop.com/bullmoney-vip"},
    {"label":"One Time (7d trial)","price":999.99,"interval":"one-time","trial_days":7,"buy_url":"https://whop.com/bullmoney-vip"}
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

COMMIT;
