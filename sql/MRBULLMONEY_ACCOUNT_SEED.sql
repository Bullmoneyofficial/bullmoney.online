-- =============================================
-- FULL ACCOUNT SETUP FOR MRBULLMONEY@GMAIL.COM
-- Includes: Recruits Profile + Store Orders + Back-in-Stock + Addresses
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. ENSURE STORE COLUMNS EXIST
-- =============================================

-- Add store/customer columns if they don't exist
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS shipping_addresses JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email';
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS store_customer_since TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS store_order_count INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS store_total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS store_newsletter_subscribed BOOLEAN DEFAULT false;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_trades BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_livestreams BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_news BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notify_vip BOOLEAN DEFAULT true;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;

-- =============================================
-- 1a. FIX RLS: Allow public read/update of recruits by email
-- (Needed because client uses anon key, not Supabase Auth)
-- =============================================

DROP POLICY IF EXISTS "Public can read own recruit by email" ON public.recruits;
CREATE POLICY "Public can read own recruit by email" ON public.recruits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update own recruit by email" ON public.recruits;
CREATE POLICY "Public can update own recruit by email" ON public.recruits
  FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================
-- 1b. ENSURE STORE TABLES EXIST
-- =============================================

-- Store Orders table
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  gift_card_code TEXT,
  gift_card_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  shipping_method TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  payment_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  customer_notes TEXT,
  internal_notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'web',
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_store_orders_email ON public.store_orders(email);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_number ON public.store_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON public.store_orders(created_at DESC);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_orders" ON public.store_orders;
CREATE POLICY "Service role full access on store_orders" ON public.store_orders FOR ALL USING (true) WITH CHECK (true);

-- Back-in-stock subscriptions table
CREATE TABLE IF NOT EXISTS public.back_in_stock_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  variant_name TEXT,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, product_id)
);

ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on back_in_stock" ON public.back_in_stock_subscriptions;
CREATE POLICY "Service role full access on back_in_stock" ON public.back_in_stock_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Gift cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 years'),
  metadata JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on gift_cards" ON public.gift_cards;
CREATE POLICY "Service role full access on gift_cards" ON public.gift_cards FOR ALL USING (true) WITH CHECK (true);

-- Store Wishlist table
CREATE TABLE IF NOT EXISTS public.store_wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  product_image TEXT,
  UNIQUE(email, product_id)
);

CREATE INDEX IF NOT EXISTS idx_store_wishlist_email ON public.store_wishlist(email);
ALTER TABLE public.store_wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_wishlist" ON public.store_wishlist;
CREATE POLICY "Service role full access on store_wishlist" ON public.store_wishlist FOR ALL USING (true) WITH CHECK (true);

-- Store Cart table
CREATE TABLE IF NOT EXISTS public.store_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  item_id TEXT NOT NULL, -- productId-variantId
  product_data JSONB NOT NULL DEFAULT '{}'::JSONB, -- full product snapshot
  variant_data JSONB NOT NULL DEFAULT '{}'::JSONB, -- full variant snapshot
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(email, item_id)
);

CREATE INDEX IF NOT EXISTS idx_store_cart_email ON public.store_cart(email);
ALTER TABLE public.store_cart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_cart" ON public.store_cart;
CREATE POLICY "Service role full access on store_cart" ON public.store_cart FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 2. CREATE RECRUIT ACCOUNT
-- =============================================

-- Delete existing recruit if needed (optional)
-- DELETE FROM public.recruits WHERE email = 'mrbullmoney@gmail.com';

-- Insert recruit profile with full details
INSERT INTO public.recruits (
  email,
  full_name,
  password,
  status,
  is_vip,
  created_at,
  -- Store/Customer fields
  display_name,
  store_customer_since,
  store_order_count,
  store_total_spent,
  store_newsletter_subscribed,
  preferred_currency,
  preferred_language,
  -- Shipping addresses (as JSONB array)
  shipping_addresses,
  -- Contact info
  phone,
  country,
  city,
  timezone,
  -- Social & Contact
  telegram_username,
  discord_username,
  instagram_username,
  twitter_username,
  -- Trading profile (optional but complete)
  trading_experience_years,
  trading_style,
  risk_tolerance,
  bio,
  image_url
) VALUES (
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  'demo_account_2026', -- placeholder password
  'Active',
  false,
  NOW() - INTERVAL '6 months',
  -- Store fields
  'Bull Money',
  NOW() - INTERVAL '6 months',
  3, -- 3 orders
  284.97, -- total spent
  true,
  'USD',
  'en',
  -- Shipping addresses
  '[
    {
      "id": "addr-001",
      "label": "New York Office",
      "name": "Mr Bull Money",
      "street": "123 Trading Ave, Apt 4B",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "United States",
      "phone": "+1 (555) 123-4567",
      "isDefault": true
    },
    {
      "id": "addr-002",
      "label": "South Africa Home",
      "name": "Mr Bull Money",
      "street": "45 Sandton Drive",
      "city": "Johannesburg",
      "state": "Gauteng",
      "zip": "2196",
      "country": "South Africa",
      "phone": "+27 (11) 555-7890",
      "isDefault": false
    },
    {
      "id": "addr-003",
      "label": "Cape Town Branch",
      "name": "Mr Bull Money",
      "street": "789 Long Street",
      "city": "Cape Town",
      "state": "Western Cape",
      "zip": "8001",
      "country": "South Africa",
      "phone": "+27 (21) 555-1234",
      "isDefault": false
    }
  ]'::JSONB,
  -- Contact
  '+1 (555) 123-4567',
  'United States',
  'New York',
  'America/New_York',
  -- Social
  'mrbullmoney_trading',
  'BullMoney#7842',
  'mrbullmoney_trading',
  '@mrbullmoney_fx',
  -- Trading
  8,
  'swing trader',
  'moderate',
  'Professional trader focused on forex and indices. Creator of BullMoney trading education platform.',
  'https://api.placeholder.com/avatars/mrbullmoney.jpg'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  store_customer_since = EXCLUDED.store_customer_since,
  store_order_count = EXCLUDED.store_order_count,
  store_total_spent = EXCLUDED.store_total_spent,
  phone = EXCLUDED.phone,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  timezone = EXCLUDED.timezone,
  telegram_username = EXCLUDED.telegram_username,
  discord_username = EXCLUDED.discord_username,
  instagram_username = EXCLUDED.instagram_username,
  twitter_username = EXCLUDED.twitter_username,
  trading_experience_years = EXCLUDED.trading_experience_years,
  trading_style = EXCLUDED.trading_style,
  risk_tolerance = EXCLUDED.risk_tolerance,
  bio = EXCLUDED.bio,
  image_url = EXCLUDED.image_url,
  shipping_addresses = EXCLUDED.shipping_addresses,
  preferred_currency = EXCLUDED.preferred_currency,
  preferred_language = EXCLUDED.preferred_language,
  store_newsletter_subscribed = EXCLUDED.store_newsletter_subscribed;


-- =============================================
-- 2. CREATE STORE ORDERS
-- =============================================

-- Delete existing orders (optional, for clean seeding)
DELETE FROM public.store_orders WHERE email = 'mrbullmoney@gmail.com' AND order_number LIKE 'DEMO-%';

-- Insert demo orders
INSERT INTO public.store_orders (
  order_number,
  email,
  customer_name,
  phone,
  items,
  subtotal,
  shipping_cost,
  tax_amount,
  discount_amount,
  total_amount,
  currency,
  status,
  payment_status,
  fulfillment_status,
  tracking_number,
  tracking_url,
  carrier,
  shipped_at,
  delivered_at,
  shipping_address,
  payment_method,
  stripe_session_id,
  customer_notes,
  internal_notes,
  source,
  metadata,
  created_at,
  updated_at
) VALUES 
-- Order 1: Recent - Shipped via FedEx
(
  'DEMO-001-A7B3C9D2',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '+1 (555) 123-4567',
  '[
    {
      "id": "variant-hoodie-black-l",
      "product_id": "prod-hoodie-001",
      "name": "BullMoney Premium Hoodie",
      "quantity": 1,
      "price": 69.99,
      "image": "https://images.unsplash.com/photo-1556821552-7f41c5d440db?w=400",
      "options": {"color": "Black", "size": "L"}
    },
    {
      "id": "variant-sticker-001",
      "product_id": "prod-sticker-001",
      "name": "Trading Sticker Pack",
      "quantity": 1,
      "price": 19.98,
      "image": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400",
      "options": {}
    }
  ]'::JSONB,
  89.97,
  0.00,
  0.00,
  0.00,
  89.97,
  'USD',
  'shipped',
  'paid',
  'partial',
  '794644790000',
  'https://www.fedex.com/fedextrack/?trknbr=794644790000',
  'fedex',
  NOW() - INTERVAL '1 day',
  NULL,
  '{"name": "Mr Bull Money", "line1": "123 Trading Ave", "line2": "Apt 4B", "city": "New York", "state": "NY", "postal_code": "10001", "country": "United States", "phone": "+1 (555) 123-4567"}'::JSONB,
  'stripe',
  'cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
  'Please leave at front door',
  'High-value customer. VIP preferred shipping.',
  'web',
  '{"session_id": "sess_123", "payment_captured": true}'::JSONB,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),

-- Order 2: Delivered via The Courier Guy
(
  'DEMO-002-E4F5G6H7',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '+27 (11) 555-7890',
  '[
    {
      "id": "variant-backpack-black",
      "product_id": "prod-backpack-001",
      "name": "Market Master Backpack",
      "quantity": 1,
      "price": 129.99,
      "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
      "options": {"color": "Black"}
    },
    {
      "id": "variant-cap-navy",
      "product_id": "prod-cap-001",
      "name": "BullMoney Snapback Cap",
      "quantity": 1,
      "price": 19.98,
      "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "options": {"color": "Navy"}
    }
  ]'::JSONB,
  149.97,
  0.00,
  0.00,
  0.00,
  149.97,
  'USD',
  'delivered',
  'paid',
  'fulfilled',
  'TCG1234567890',
  'https://www.thecourierguy.co.za/track?waybill=TCG1234567890',
  'courier_guy',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '3 days',
  '{"name": "Mr Bull Money", "line1": "45 Sandton Drive", "city": "Johannesburg", "state": "Gauteng", "postal_code": "2196", "country": "South Africa", "phone": "+27 (11) 555-7890"}'::JSONB,
  'stripe',
  'cs_test_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
  'Delivery to office address',
  'Delivered successfully to Johannesburg office',
  'web',
  '{"session_id": "sess_456", "payment_captured": true}'::JSONB,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '3 days'
),

-- Order 3: Older Order - Delivered via SA Post Office
(
  'DEMO-003-I8J9K0L1',
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  '+27 (21) 555-1234',
  '[
    {
      "id": "variant-journal-001",
      "product_id": "prod-journal-001",
      "name": "Trading Journal Notebook",
      "quantity": 2,
      "price": 15.00,
      "image": "https://images.unsplash.com/photo-1507842217343-583684f1e4c1?w=400",
      "options": {}
    },
    {
      "id": "variant-poster-001",
      "product_id": "prod-poster-001",
      "name": "Chart Analysis Poster",
      "quantity": 1,
      "price": 15.00,
      "image": "https://images.unsplash.com/photo-1618005182384-a83a8e565a0f?w=400",
      "options": {}
    }
  ]'::JSONB,
  45.00,
  0.00,
  0.00,
  0.00,
  45.00,
  'USD',
  'delivered',
  'paid',
  'fulfilled',
  'RR123456789ZA',
  'https://www.postoffice.co.za/Track/track.aspx?id=RR123456789ZA',
  'sapo',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '10 days',
  '{"name": "Mr Bull Money", "line1": "789 Long Street", "city": "Cape Town", "state": "Western Cape", "postal_code": "8001", "country": "South Africa", "phone": "+27 (21) 555-1234"}'::JSONB,
  'stripe',
  'cs_test_c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
  NULL,
  'Standard delivery - no special instructions',
  'web',
  '{"session_id": "sess_789", "payment_captured": true}'::JSONB,
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '10 days'
)
ON CONFLICT (order_number) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  tracking_number = EXCLUDED.tracking_number,
  tracking_url = EXCLUDED.tracking_url,
  shipped_at = EXCLUDED.shipped_at,
  delivered_at = EXCLUDED.delivered_at,
  updated_at = NOW();


-- =============================================
-- 3. CREATE BACK-IN-STOCK SUBSCRIPTIONS
-- =============================================

-- Delete existing subscriptions (optional)
DELETE FROM public.back_in_stock_subscriptions WHERE email = 'mrbullmoney@gmail.com';

-- Insert back-in-stock subscriptions
INSERT INTO public.back_in_stock_subscriptions (
  email,
  product_id,
  product_name,
  variant_name,
  notified,
  created_at
) VALUES 
(
  'mrbullmoney@gmail.com',
  'prod-watch-001',
  'TraderPro Luxury Watch',
  'Black Dial - Limited Edition',
  false,
  NOW() - INTERVAL '3 days'
),
(
  'mrbullmoney@gmail.com',
  'prod-golden-bull-001',
  'Limited Edition Golden Bull Statue',
  'Premium Gold Finish',
  false,
  NOW() - INTERVAL '5 days'
),
(
  'mrbullmoney@gmail.com',
  'prod-keyboard-001',
  'Mechanical Trading Keyboard',
  'Cherry MX Brown Switches',
  false,
  NOW()
)
ON CONFLICT (email, product_id) DO NOTHING;


-- =============================================
-- 4. GIFT CARD (OPTIONAL - ONE-TIME BONUS)
-- =============================================

-- Insert a $50 gift card as customer appreciation
INSERT INTO public.gift_cards (
  code,
  amount,
  balance,
  recipient_email,
  recipient_name,
  sender_name,
  sender_email,
  message,
  is_active,
  expires_at,
  created_at,
  metadata
) VALUES (
  'BULLMONEY50-WELCOME',
  50.00,
  50.00,
  'mrbullmoney@gmail.com',
  'Mr Bull Money',
  'BullMoney Team',
  'support@bullmoney.com',
  'Welcome to BullMoney Store! Enjoy $50 off your next purchase.',
  true,
  NOW() + INTERVAL '1 year',
  NOW(),
  '{"customer_tier": "vip", "promo_type": "welcome_bonus"}'::JSONB
)
ON CONFLICT (code) DO NOTHING;


-- =============================================
-- 5. SEED WISHLIST DATA
-- =============================================

DELETE FROM public.store_wishlist WHERE email = 'mrbullmoney@gmail.com';

INSERT INTO public.store_wishlist (email, product_id, product_name, product_slug, product_price, product_image, created_at) VALUES
(
  'mrbullmoney@gmail.com',
  'prod-watch-001',
  'TraderPro Luxury Watch',
  'traderpro-luxury-watch',
  899.99,
  'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
  NOW() - INTERVAL '3 days'
),
(
  'mrbullmoney@gmail.com',
  'prod-golden-bull-001',
  'Limited Edition Golden Bull Statue',
  'limited-edition-golden-bull-statue',
  499.99,
  'https://images.unsplash.com/photo-1618005182384-a83a8e565a0f?w=400',
  NOW() - INTERVAL '5 days'
),
(
  'mrbullmoney@gmail.com',
  'prod-keyboard-001',
  'Mechanical Trading Keyboard',
  'mechanical-trading-keyboard',
  179.99,
  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (email, product_id) DO NOTHING;


-- =============================================
-- 6. SEED CART DATA
-- =============================================

DELETE FROM public.store_cart WHERE email = 'mrbullmoney@gmail.com';

INSERT INTO public.store_cart (email, item_id, product_data, variant_data, quantity, created_at) VALUES
(
  'mrbullmoney@gmail.com',
  'prod-hoodie-001-variant-hoodie-black-l',
  '{"id": "prod-hoodie-001", "name": "BullMoney Premium Hoodie", "slug": "bullmoney-premium-hoodie", "base_price": 89.99, "images": [{"url": "https://images.unsplash.com/photo-1556821552-7f41c5d440db?w=400"}]}'::JSONB,
  '{"id": "variant-hoodie-black-l", "name": "Black / L", "price_adjustment": 0, "inventory_count": 50, "options": {"color": "Black", "size": "L"}}'::JSONB,
  1,
  NOW() - INTERVAL '1 hour'
),
(
  'mrbullmoney@gmail.com',
  'prod-tumbler-001-variant-tumbler-gold',
  '{"id": "prod-tumbler-001", "name": "Bulls & Bears Tumbler", "slug": "bulls-bears-tumbler", "base_price": 34.99, "images": [{"url": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400"}]}'::JSONB,
  '{"id": "variant-tumbler-gold", "name": "Gold", "price_adjustment": 5.00, "inventory_count": 25, "options": {"color": "Gold"}}'::JSONB,
  2,
  NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (email, item_id) DO NOTHING;


-- =============================================
-- 7. DISCOUNT CODE PREFERENCE (OPTIONAL)
-- =============================================

-- Track which discount codes this customer has used
-- (Could be added to a usage tracking table if created)


-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify recruit was created
SELECT 
  email,
  full_name,
  display_name,
  store_order_count,
  store_total_spent,
  created_at
FROM public.recruits
WHERE email = 'mrbullmoney@gmail.com';

-- Verify orders were inserted
SELECT 
  order_number,
  email,
  status,
  total_amount,
  tracking_number,
  carrier,
  created_at
FROM public.store_orders
WHERE email = 'mrbullmoney@gmail.com'
ORDER BY created_at DESC;

-- Verify back-in-stock subscriptions
SELECT 
  product_id,
  product_name,
  variant_name,
  notified,
  created_at
FROM public.back_in_stock_subscriptions
WHERE email = 'mrbullmoney@gmail.com'
ORDER BY created_at DESC;

-- Verify gift card
SELECT 
  code,
  amount,
  balance,
  recipient_email,
  is_active,
  expires_at
FROM public.gift_cards
WHERE recipient_email = 'mrbullmoney@gmail.com';


-- =============================================
-- SUMMARY
-- =============================================
-- ✅ Recruit account created with full profile
-- ✅ 3 orders with different statuses (processing/shipped/delivered)
-- ✅ Multiple shipping addresses
-- ✅ Back-in-stock subscriptions for 3 products
-- ✅ Gift card token ($50 bonus)
-- ✅ Full contact & social information
-- ✅ Trading profile data
-- =============================================
