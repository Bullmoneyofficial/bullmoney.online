-- Refresh BullMoney VIP catalog with Whop-hosted imagery and multi-plan pricing
BEGIN;

-- BullMoney VIP Group + Community
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000901',
  'BULLMONEY VIP GROUP + COMMUNITY',
  'BullMoney VIP is the all-in-one trading membership built for real results. Get premium trade insights, daily breakdowns, live sessions, mentorship, exclusive tools/docs, and private community support.',
  9.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  1,
  'https://whop.com/_next/image/?url=%2F_static%2Fimages%2Fbrowse%2Ftrading.webp&w=1600&q=80',
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

-- BullMoney ICT Indicator
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000902',
  'BULLMONEY ICT INDICATOR',
  'Smart Money Concepts made simple: BOS/CHoCH, liquidity sweeps, FVGs, order blocks, session tools, premium/discount zones, and risk aids for clean execution.',
  2.50,
  'https://whop.com/bullmoney-vip',
  FALSE,
  2,
  'https://whop.com/_next/image/?url=%2F_static%2Fimages%2Fbrowse%2Ftrading.webp&w=1600&q=80',
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

-- BullMoney VIP Indicator
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000903',
  'BULLMONEY VIP INDICATOR',
  'Institutional trading made simple with high-clarity signals, multi-timeframe support, and VIP perks (updates + support).',
  39.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  3,
  'https://whop.com/_next/image/?url=%2F_static%2Fimages%2Fbrowse%2Ftrading.webp&w=1600&q=80',
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

-- BullMoney Bot
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order, image_url, plan_options)
VALUES (
  '00000000-0000-0000-0000-000000000904',
  'BULLMONEY BOT',
  'Automated BullMoney bot with managed strategies and monitoring; connect, choose a plan, and let the automation execute.',
  149.99,
  'https://whop.com/bullmoney-vip',
  FALSE,
  4,
  'https://whop.com/_next/image/?url=%2F_static%2Fimages%2Fbrowse%2Ftrading.webp&w=1600&q=80',
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
