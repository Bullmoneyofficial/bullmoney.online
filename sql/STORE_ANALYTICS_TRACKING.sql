-- =============================================
-- STORE ANALYTICS TRACKING — Complete SQL
-- Run in Supabase SQL Editor
-- Creates: store_wishlist, store_cart, store_sessions,
--          discount_usage, analytics views & functions
-- =============================================


-- =============================================
-- 1. STORE WISHLIST TABLE
-- Tracks per-user wishlisted products
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  product_price DECIMAL(10,2),
  variant_id TEXT,
  variant_name TEXT,
  UNIQUE(email, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_email ON public.store_wishlist(email);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.store_wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON public.store_wishlist(created_at DESC);

ALTER TABLE public.store_wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_wishlist" ON public.store_wishlist;
CREATE POLICY "Service role full access on store_wishlist"
  ON public.store_wishlist FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 2. STORE CART TABLE
-- Persistent server-side cart (mirrors client cart)
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  session_id TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  variant_id TEXT,
  variant_name TEXT,
  product_data JSONB DEFAULT '{}'::JSONB,   -- {base_price, category, slug}
  variant_data JSONB DEFAULT '{}'::JSONB,   -- {price_adjustment, size, color}
  UNIQUE(email, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_email ON public.store_cart(email);
CREATE INDEX IF NOT EXISTS idx_cart_session ON public.store_cart(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_updated ON public.store_cart(updated_at DESC);

ALTER TABLE public.store_cart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_cart" ON public.store_cart;
CREATE POLICY "Service role full access on store_cart"
  ON public.store_cart FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 3. STORE SESSIONS TABLE
-- Track unique visitor sessions for analytics
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  is_converted BOOLEAN DEFAULT false,  -- placed an order this session
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_sessions_sid ON public.store_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON public.store_sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.store_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON public.store_sessions(is_converted) WHERE is_converted = true;

ALTER TABLE public.store_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_sessions" ON public.store_sessions;
CREATE POLICY "Service role full access on store_sessions"
  ON public.store_sessions FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 4. DISCOUNT USAGE LOG
-- Track every discount code redemption
-- =============================================

CREATE TABLE IF NOT EXISTS public.discount_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discount_code TEXT NOT NULL,
  discount_id UUID REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
  order_number TEXT,
  email TEXT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_total DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON public.discount_usage(discount_code);
CREATE INDEX IF NOT EXISTS idx_discount_usage_email ON public.discount_usage(email);
CREATE INDEX IF NOT EXISTS idx_discount_usage_created ON public.discount_usage(created_at DESC);

ALTER TABLE public.discount_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on discount_usage" ON public.discount_usage;
CREATE POLICY "Service role full access on discount_usage"
  ON public.discount_usage FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 5. GIFT CARD TRANSACTIONS LOG
-- Track every gift card use (purchase, redeem, partial)
-- =============================================

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gift_card_id UUID REFERENCES public.gift_cards(id) ON DELETE SET NULL,
  gift_card_code TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issued', 'redeemed', 'partial_redeem', 'refunded', 'expired')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2),
  order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
  order_number TEXT,
  email TEXT,
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_gc_tx_code ON public.gift_card_transactions(gift_card_code);
CREATE INDEX IF NOT EXISTS idx_gc_tx_type ON public.gift_card_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gc_tx_created ON public.gift_card_transactions(created_at DESC);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on gift_card_transactions" ON public.gift_card_transactions;
CREATE POLICY "Service role full access on gift_card_transactions"
  ON public.gift_card_transactions FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 6. PRODUCT VIEWS TABLE
-- Lightweight per-product view counter
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id TEXT NOT NULL,
  product_name TEXT,
  email TEXT,
  session_id TEXT,
  referrer TEXT,
  device_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.store_product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON public.store_product_views(created_at DESC);

ALTER TABLE public.store_product_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on store_product_views" ON public.store_product_views;
CREATE POLICY "Service role full access on store_product_views"
  ON public.store_product_views FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 7. ENSURE store_analytics TABLE EXISTS + ADD MISSING COLUMNS
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  search_query TEXT,
  page_path TEXT,
  referrer TEXT,
  user_email TEXT,
  session_id TEXT,
  country TEXT,
  language TEXT,
  currency TEXT,
  device_type TEXT,
  value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  browser TEXT,
  city TEXT,
  os TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.store_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.store_analytics(created_at DESC);

ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on analytics" ON public.store_analytics;
CREATE POLICY "Service role full access on analytics"
  ON public.store_analytics FOR ALL USING (true) WITH CHECK (true);

-- Add any columns that might be missing if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'session_id') THEN
    ALTER TABLE public.store_analytics ADD COLUMN session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'product_id') THEN
    ALTER TABLE public.store_analytics ADD COLUMN product_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'product_name') THEN
    ALTER TABLE public.store_analytics ADD COLUMN product_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'category') THEN
    ALTER TABLE public.store_analytics ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'search_query') THEN
    ALTER TABLE public.store_analytics ADD COLUMN search_query TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'page_path') THEN
    ALTER TABLE public.store_analytics ADD COLUMN page_path TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'referrer') THEN
    ALTER TABLE public.store_analytics ADD COLUMN referrer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'user_email') THEN
    ALTER TABLE public.store_analytics ADD COLUMN user_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'country') THEN
    ALTER TABLE public.store_analytics ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'language') THEN
    ALTER TABLE public.store_analytics ADD COLUMN language TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'currency') THEN
    ALTER TABLE public.store_analytics ADD COLUMN currency TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'device_type') THEN
    ALTER TABLE public.store_analytics ADD COLUMN device_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'value') THEN
    ALTER TABLE public.store_analytics ADD COLUMN value DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'metadata') THEN
    ALTER TABLE public.store_analytics ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'browser') THEN
    ALTER TABLE public.store_analytics ADD COLUMN browser TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'city') THEN
    ALTER TABLE public.store_analytics ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'os') THEN
    ALTER TABLE public.store_analytics ADD COLUMN os TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'utm_source') THEN
    ALTER TABLE public.store_analytics ADD COLUMN utm_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'utm_medium') THEN
    ALTER TABLE public.store_analytics ADD COLUMN utm_medium TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_analytics' AND column_name = 'utm_campaign') THEN
    ALTER TABLE public.store_analytics ADD COLUMN utm_campaign TEXT;
  END IF;
END$$;

-- Indexes that depend on columns added above
CREATE INDEX IF NOT EXISTS idx_analytics_product ON public.store_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.store_analytics(session_id);


-- =============================================
-- 8. ADD MISSING COLUMNS TO store_orders
-- (for better analytics: refund tracking, coupons)
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'refund_amount') THEN
    ALTER TABLE public.store_orders ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'refund_reason') THEN
    ALTER TABLE public.store_orders ADD COLUMN refund_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'refunded_at') THEN
    ALTER TABLE public.store_orders ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'cancelled_at') THEN
    ALTER TABLE public.store_orders ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'cancel_reason') THEN
    ALTER TABLE public.store_orders ADD COLUMN cancel_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'session_id') THEN
    ALTER TABLE public.store_orders ADD COLUMN session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'utm_source') THEN
    ALTER TABLE public.store_orders ADD COLUMN utm_source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'utm_medium') THEN
    ALTER TABLE public.store_orders ADD COLUMN utm_medium TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_orders' AND column_name = 'utm_campaign') THEN
    ALTER TABLE public.store_orders ADD COLUMN utm_campaign TEXT;
  END IF;
END$$;

-- Extra indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_store_orders_payment ON public.store_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_fulfillment ON public.store_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_carrier ON public.store_orders(carrier);
CREATE INDEX IF NOT EXISTS idx_store_orders_country ON public.store_orders((shipping_address->>'country'));


-- =============================================
-- 9. ANALYTICS VIEWS — Pre-computed for speed
-- =============================================

-- Revenue summary (daily)
CREATE OR REPLACE VIEW public.v_daily_revenue AS
SELECT
  DATE(created_at) AS day,
  COUNT(*)                              AS order_count,
  SUM(total_amount)                     AS revenue,
  AVG(total_amount)                     AS avg_order_value,
  SUM(discount_amount)                  AS total_discounts,
  SUM(shipping_cost)                    AS total_shipping,
  COUNT(DISTINCT email)                 AS unique_customers
FROM public.store_orders
WHERE payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY day DESC;


-- Order status overview
CREATE OR REPLACE VIEW public.v_order_status_summary AS
SELECT
  status,
  payment_status,
  fulfillment_status,
  COUNT(*)             AS count,
  SUM(total_amount)    AS total_value
FROM public.store_orders
GROUP BY status, payment_status, fulfillment_status
ORDER BY count DESC;


-- Top products by revenue
CREATE OR REPLACE VIEW public.v_top_products AS
SELECT
  item->>'name'        AS product_name,
  item->>'product_id'  AS product_id,
  SUM((item->>'quantity')::int)                                AS total_quantity,
  SUM((item->>'price')::decimal * (item->>'quantity')::int)    AS total_revenue,
  COUNT(DISTINCT o.email)                                      AS unique_buyers
FROM public.store_orders o,
  LATERAL jsonb_array_elements(o.items) AS item
WHERE o.payment_status = 'paid'
GROUP BY item->>'name', item->>'product_id'
ORDER BY total_revenue DESC;


-- Customer lifetime value
CREATE OR REPLACE VIEW public.v_customer_ltv AS
SELECT
  LOWER(email)                  AS email,
  MAX(customer_name)            AS name,
  COUNT(*)                      AS order_count,
  SUM(total_amount)             AS lifetime_value,
  AVG(total_amount)             AS avg_order,
  MIN(created_at)               AS first_order,
  MAX(created_at)               AS last_order,
  MAX(created_at) - MIN(created_at) AS customer_span
FROM public.store_orders
WHERE payment_status = 'paid'
GROUP BY LOWER(email)
ORDER BY lifetime_value DESC;


-- Shipping country breakdown
CREATE OR REPLACE VIEW public.v_orders_by_country AS
SELECT
  COALESCE(shipping_address->>'country', 'Unknown') AS country,
  COUNT(*)           AS order_count,
  SUM(total_amount)  AS revenue,
  AVG(total_amount)  AS avg_order
FROM public.store_orders
WHERE payment_status = 'paid'
GROUP BY shipping_address->>'country'
ORDER BY order_count DESC;


-- Carrier performance
CREATE OR REPLACE VIEW public.v_carrier_performance AS
SELECT
  COALESCE(carrier, 'No carrier') AS carrier,
  COUNT(*)                        AS shipment_count,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END)  AS delivered_count,
  COUNT(CASE WHEN tracking_number IS NOT NULL THEN 1 END) AS has_tracking,
  AVG(EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 86400)::NUMERIC(5,1) AS avg_delivery_days
FROM public.store_orders
WHERE status IN ('shipped', 'delivered')
GROUP BY carrier
ORDER BY shipment_count DESC;


-- Conversion funnel (30 days)
CREATE OR REPLACE VIEW public.v_conversion_funnel AS
SELECT
  COUNT(*) FILTER (WHERE event_type = 'page_view')    AS page_views,
  COUNT(*) FILTER (WHERE event_type = 'add_to_cart')   AS add_to_cart,
  COUNT(*) FILTER (WHERE event_type = 'purchase')      AS purchases,
  COUNT(*) FILTER (WHERE event_type = 'search')        AS searches,
  COUNT(*) FILTER (WHERE event_type = 'wishlist_add')  AS wishlist_adds,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'purchase')::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'page_view'), 0) * 100, 2
  ) AS view_to_purchase_pct,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'purchase')::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'add_to_cart'), 0) * 100, 2
  ) AS cart_to_purchase_pct
FROM public.store_analytics
WHERE created_at >= NOW() - INTERVAL '30 days';


-- Abandoned carts (items in cart, no order within 24h)
CREATE OR REPLACE VIEW public.v_abandoned_carts AS
SELECT
  c.email,
  COUNT(c.id) AS items_in_cart,
  SUM(
    COALESCE((c.product_data->>'base_price')::decimal, 0) +
    COALESCE((c.variant_data->>'price_adjustment')::decimal, 0)
  ) * SUM(c.quantity) AS cart_value,
  MAX(c.updated_at) AS last_activity
FROM public.store_cart c
LEFT JOIN public.store_orders o
  ON LOWER(c.email) = LOWER(o.email)
  AND o.created_at >= c.updated_at
WHERE o.id IS NULL
  AND c.updated_at < NOW() - INTERVAL '1 hour'
GROUP BY c.email
ORDER BY cart_value DESC;


-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Track an analytics event (call from API routes)
CREATE OR REPLACE FUNCTION public.track_store_event(
  p_event_type TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_value DECIMAL DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.store_analytics (
    event_type, product_id, product_name, category,
    search_query, page_path, referrer, user_email,
    session_id, country, device_type, value, metadata
  ) VALUES (
    p_event_type, p_product_id, p_product_name, p_category,
    p_search_query, p_page_path, p_referrer, p_email,
    p_session_id, p_country, p_device_type, p_value, p_metadata
  )
  RETURNING id INTO new_id;

  -- Update session events count if session exists
  IF p_session_id IS NOT NULL THEN
    UPDATE public.store_sessions
    SET events_count = events_count + 1,
        last_active_at = NOW(),
        page_views = CASE WHEN p_event_type = 'page_view' THEN page_views + 1 ELSE page_views END,
        is_converted = CASE WHEN p_event_type = 'purchase' THEN true ELSE is_converted END
    WHERE session_id = p_session_id;
  END IF;

  RETURN new_id;
END;
$$;


-- Upsert a session (call on first page view)
CREATE OR REPLACE FUNCTION public.upsert_store_session(
  p_session_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.store_sessions (
    session_id, email, ip_address, user_agent,
    device_type, browser, os, country, city,
    referrer, utm_source, utm_medium, utm_campaign, landing_page,
    page_views
  ) VALUES (
    p_session_id, p_email, p_ip, p_user_agent,
    p_device_type, p_browser, p_os, p_country, p_city,
    p_referrer, p_utm_source, p_utm_medium, p_utm_campaign, p_landing_page,
    1
  )
  ON CONFLICT (session_id) DO UPDATE SET
    last_active_at = NOW(),
    page_views = public.store_sessions.page_views + 1,
    email = COALESCE(EXCLUDED.email, public.store_sessions.email)
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$;


-- Clean old carts (run periodically or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_carts(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.store_cart
  WHERE updated_at < NOW() - (days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


-- Auto-update updated_at on store_cart changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cart_updated_at ON public.store_cart;
CREATE TRIGGER trg_cart_updated_at
  BEFORE UPDATE ON public.store_cart
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.store_orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 11. AUTO-LOG ORDER EVENTS
-- Trigger: when order status changes, log to analytics
-- =============================================

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log purchase event on first paid status
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    INSERT INTO public.store_analytics (event_type, user_email, value, metadata)
    VALUES ('purchase', NEW.email, NEW.total_amount, jsonb_build_object(
      'order_number', NEW.order_number,
      'items_count', jsonb_array_length(NEW.items)
    ));
  END IF;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.store_analytics (event_type, user_email, metadata)
    VALUES ('order_status_change', NEW.email, jsonb_build_object(
      'order_number', NEW.order_number,
      'old_status', OLD.status,
      'new_status', NEW.status
    ));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_analytics ON public.store_orders;
CREATE TRIGGER trg_order_status_analytics
  AFTER UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();


-- =============================================
-- DONE — All analytics tracking tables created.
-- Tables: store_wishlist, store_cart, store_sessions,
--         discount_usage, gift_card_transactions,
--         store_product_views
-- Views:  v_daily_revenue, v_order_status_summary,
--         v_top_products, v_customer_ltv,
--         v_orders_by_country, v_carrier_performance,
--         v_conversion_funnel, v_abandoned_carts
-- Functions: track_store_event(), upsert_store_session(),
--            cleanup_old_carts(), log_order_status_change()
-- =============================================
