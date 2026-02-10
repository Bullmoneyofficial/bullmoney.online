-- ============================================
-- Print & Design Studio — Full Production Schema
-- Run in Supabase SQL Editor
-- ============================================

-- ─── PRINT ORDERS ───
CREATE TABLE IF NOT EXISTS print_orders (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL,
  product_id    UUID REFERENCES print_products(id),
  digital_art_id UUID REFERENCES digital_art(id),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','printing','shipped','delivered','cancelled')),
  size_label    TEXT NOT NULL,
  width         NUMERIC(10,2),
  height        NUMERIC(10,2),
  quantity      INT NOT NULL DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL,
  custom_image_url TEXT,
  notes         TEXT,
  shipping_address JSONB,
  tracking_number TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── USER UPLOADS (for custom prints) ───
CREATE TABLE IF NOT EXISTS print_uploads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL,
  filename      TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size     BIGINT DEFAULT 0,
  mime_type     TEXT,
  width         INT,
  height        INT,
  dpi           INT DEFAULT 72,
  status        TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','ready','error')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── USER DESIGNS (saved custom designs) ───
CREATE TABLE IF NOT EXISTS print_designs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Untitled Design',
  product_type  TEXT NOT NULL CHECK (product_type IN ('poster','banner','wallpaper','canvas','sticker','window-design','digital')),
  canvas_data   JSONB NOT NULL DEFAULT '{}',
  preview_url   TEXT,
  source_upload_id UUID REFERENCES print_uploads(id),
  source_art_id UUID REFERENCES digital_art(id),
  width         INT,
  height        INT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── DIGITAL ART PURCHASES (download tracking) ───
CREATE TABLE IF NOT EXISTS digital_art_purchases (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL,
  digital_art_id UUID NOT NULL REFERENCES digital_art(id),
  price_paid    NUMERIC(10,2) NOT NULL,
  file_format   TEXT NOT NULL,
  download_count INT DEFAULT 0,
  max_downloads  INT DEFAULT 5,
  created_at    TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '365 days')
);

-- ─── INDEXES ───
CREATE INDEX IF NOT EXISTS idx_print_orders_email ON print_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON print_orders(status);
CREATE INDEX IF NOT EXISTS idx_print_uploads_email ON print_uploads(user_email);
CREATE INDEX IF NOT EXISTS idx_print_designs_email ON print_designs(user_email);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_email ON digital_art_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_art ON digital_art_purchases(digital_art_id);

-- ─── RLS ───
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_art_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users manage own print_orders" ON print_orders;
DROP POLICY IF EXISTS "Users manage own print_uploads" ON print_uploads;
DROP POLICY IF EXISTS "Users manage own print_designs" ON print_designs;
DROP POLICY IF EXISTS "Users manage own digital_art_purchases" ON digital_art_purchases;
DROP POLICY IF EXISTS "Service role manage print_orders" ON print_orders;
DROP POLICY IF EXISTS "Service role manage print_uploads" ON print_uploads;
DROP POLICY IF EXISTS "Service role manage print_designs" ON print_designs;
DROP POLICY IF EXISTS "Service role manage digital_art_purchases" ON digital_art_purchases;

-- Users can read/write their own rows
CREATE POLICY "Users manage own print_orders" ON print_orders FOR ALL USING (true);
CREATE POLICY "Users manage own print_uploads" ON print_uploads FOR ALL USING (true);
CREATE POLICY "Users manage own print_designs" ON print_designs FOR ALL USING (true);
CREATE POLICY "Users manage own digital_art_purchases" ON digital_art_purchases FOR ALL USING (true);

-- Service role full access
CREATE POLICY "Service role manage print_orders" ON print_orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manage print_uploads" ON print_uploads FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manage print_designs" ON print_designs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manage digital_art_purchases" ON digital_art_purchases FOR ALL USING (auth.role() = 'service_role');
