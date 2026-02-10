-- ============================================
-- Casino Tables for Supabase
-- Converted from Laravel migrations
-- ============================================

-- Casino Users (separate from main site users, linked by email)
CREATE TABLE IF NOT EXISTS casino_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT,
  password TEXT,
  avatar TEXT DEFAULT '/casino-assets/images/profile.jpg',
  ip TEXT,
  balance DECIMAL(16,2) DEFAULT 0,
  wager DECIMAL(16,2) DEFAULT 0,
  unique_id TEXT,
  admin INTEGER DEFAULT 0,
  ref_code TEXT,
  referred_by TEXT,
  ban INTEGER DEFAULT 0,
  bonus_time TEXT,
  rank INTEGER DEFAULT 0,
  ref_money DECIMAL(16,2) DEFAULT 0,
  fake INTEGER DEFAULT 0,
  demo_balance DECIMAL(16,2) DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Casino Settings
CREATE TABLE IF NOT EXISTS casino_settings (
  id BIGSERIAL PRIMARY KEY,
  min_withdraw DECIMAL(16,2) DEFAULT 100,
  min_payment DECIMAL(16,2) DEFAULT 10,
  max_payment DECIMAL(16,2) DEFAULT 100000,
  tech_work INTEGER DEFAULT 0,
  dice_enabled INTEGER DEFAULT 1,
  mines_enabled INTEGER DEFAULT 1,
  wheel_enabled INTEGER DEFAULT 1,
  jackpot_enabled INTEGER DEFAULT 1,
  crash_enabled INTEGER DEFAULT 1,
  coin_enabled INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dice games
CREATE TABLE IF NOT EXISTS casino_dice (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  bet DECIMAL(16,2) DEFAULT 0,
  coef DECIMAL(8,2) DEFAULT 0,
  type TEXT,
  win DECIMAL(16,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mines games
CREATE TABLE IF NOT EXISTS casino_mines (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  bombs INTEGER DEFAULT 0,
  bet DECIMAL(16,2) DEFAULT 0,
  mines TEXT,
  click TEXT,
  on_off INTEGER DEFAULT 0,
  result DECIMAL(16,2) DEFAULT 0,
  step INTEGER DEFAULT 0,
  win DECIMAL(16,2) DEFAULT 0,
  can_open TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crash rounds
CREATE TABLE IF NOT EXISTS casino_crash (
  id BIGSERIAL PRIMARY KEY,
  multiplier DECIMAL(16,2) DEFAULT 0,
  profit DECIMAL(16,2) DEFAULT 0,
  status INTEGER DEFAULT 0,
  hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crash bets
CREATE TABLE IF NOT EXISTS casino_crash_bets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  round_id BIGINT NOT NULL,
  price DECIMAL(16,2) DEFAULT 0,
  withdraw DECIMAL(16,2) DEFAULT 0,
  won DECIMAL(16,2) DEFAULT 0,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wheel rounds
CREATE TABLE IF NOT EXISTS casino_wheel (
  id BIGSERIAL PRIMARY KEY,
  winner_color TEXT,
  price DECIMAL(16,2) DEFAULT 0,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wheel bets
CREATE TABLE IF NOT EXISTS casino_wheel_bets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  game_id BIGINT NOT NULL,
  price DECIMAL(16,2) DEFAULT 0,
  color TEXT,
  win DECIMAL(16,2) DEFAULT 0,
  balance DECIMAL(16,2) DEFAULT 0,
  win_sum DECIMAL(16,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jackpot rounds
CREATE TABLE IF NOT EXISTS casino_jackpot (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT DEFAULT 0,
  winner_id BIGINT,
  winner_chance DECIMAL(8,2) DEFAULT 0,
  winner_ticket BIGINT DEFAULT 0,
  winner_sum DECIMAL(16,2) DEFAULT 0,
  winner_username TEXT,
  winner_avatar TEXT,
  hash TEXT,
  price DECIMAL(16,2) DEFAULT 0,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jackpot bets
CREATE TABLE IF NOT EXISTS casino_jackpot_bets (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  sum DECIMAL(16,2) DEFAULT 0,
  "from" BIGINT DEFAULT 0,
  "to" BIGINT DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profit tracking
CREATE TABLE IF NOT EXISTS casino_profit (
  id BIGSERIAL PRIMARY KEY,
  game TEXT,
  sum DECIMAL(16,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promocodes
CREATE TABLE IF NOT EXISTS casino_promocodes (
  id BIGSERIAL PRIMARY KEY,
  type TEXT,
  status INTEGER DEFAULT 1,
  sum DECIMAL(16,2) DEFAULT 0,
  activate INTEGER DEFAULT 0,
  activate_limit INTEGER DEFAULT 0,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo log
CREATE TABLE IF NOT EXISTS casino_promo_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  sum DECIMAL(16,2) DEFAULT 0,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default data
INSERT INTO casino_settings (min_withdraw, min_payment, max_payment, tech_work, dice_enabled, mines_enabled, wheel_enabled, jackpot_enabled, crash_enabled, coin_enabled)
VALUES (100, 10, 100000, 0, 1, 1, 1, 1, 1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO casino_wheel (status, winner_color, price)
VALUES (0, '', 0)
ON CONFLICT DO NOTHING;

INSERT INTO casino_crash (hash, status, multiplier, profit)
VALUES (md5(random()::text), 0, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO casino_jackpot (game_id, status, hash, price, winner_id, winner_ticket)
VALUES (1, 0, md5(random()::text), 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Enable Realtime on key tables for live game updates
ALTER PUBLICATION supabase_realtime ADD TABLE casino_crash;
ALTER PUBLICATION supabase_realtime ADD TABLE casino_wheel;
ALTER PUBLICATION supabase_realtime ADD TABLE casino_jackpot;
ALTER PUBLICATION supabase_realtime ADD TABLE casino_crash_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE casino_wheel_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE casino_jackpot_bets;

-- ============================================
-- Row Level Security — allow all operations
-- ============================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'casino_users',
    'casino_settings',
    'casino_dice',
    'casino_mines',
    'casino_crash',
    'casino_crash_bets',
    'casino_wheel',
    'casino_wheel_bets',
    'casino_jackpot',
    'casino_jackpot_bets',
    'casino_profit',
    'casino_promocodes',
    'casino_promo_log'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Allow all select on %1$s" ON %1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Allow all insert on %1$s" ON %1$I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Allow all update on %1$s" ON %1$I FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "Allow all delete on %1$s" ON %1$I FOR DELETE USING (true)', t);
  END LOOP;
END
$$;
