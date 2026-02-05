-- Create BullMoney VIP offerings table
CREATE TABLE IF NOT EXISTS bullmoney_vip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  buy_url TEXT,
  coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure updated_at stays fresh
CREATE OR REPLACE FUNCTION set_bullmoney_vip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bullmoney_vip_updated_at ON bullmoney_vip;
CREATE TRIGGER trg_bullmoney_vip_updated_at
BEFORE UPDATE ON bullmoney_vip
FOR EACH ROW
EXECUTE FUNCTION set_bullmoney_vip_updated_at();

-- Seed VIP tiers
INSERT INTO bullmoney_vip (id, name, description, price, buy_url, coming_soon, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000901', 'VIP Indicators', 'Proprietary indicator bundle tuned for BullMoney strategies with live updates and docs.', 9.99, '/vip', FALSE, 1),
  ('00000000-0000-0000-0000-000000000902', 'VIP Groups', 'Priority access to VIP chat groups, faster alerts, and community trade breakdowns.', 19.99, '/vip', FALSE, 2),
  ('00000000-0000-0000-0000-000000000903', 'BullMoney+ Subscription', 'Unlock indicators + VIP groups + private Discord + full website access. Starter tier for all perks.', 39.99, '/vip', FALSE, 3),
  ('00000000-0000-0000-0000-000000000904', 'VIP Pro', 'Expanded mentorship tracks and premium research drops. Coming soon.', 99.99, NULL, TRUE, 4),
  ('00000000-0000-0000-0000-000000000905', 'VIP Live Streams', 'Private live trading streams + Q&A. Unlocks all lower tiers. Coming soon.', 149.99, NULL, TRUE, 5),
  ('00000000-0000-0000-0000-000000000906', 'VIP Elite', 'Enterprise-grade tools, desk setups, and concierge onboarding. Coming soon.', 299.99, NULL, TRUE, 6),
  ('00000000-0000-0000-0000-000000000907', 'VIP Master', 'Full stack of BullMoney perks with 1:1 quarterly reviews. Coming soon.', 499.99, NULL, TRUE, 7),
  ('00000000-0000-0000-0000-000000000908', 'VIP Trading Bot', 'Automated BullMoney bot with managed strategies and monitoring. Coming soon.', 999.99, NULL, TRUE, 8)
ON CONFLICT (id) DO NOTHING;
