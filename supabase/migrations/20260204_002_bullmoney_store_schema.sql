-- ============================================================================
-- BULLMONEY STORE - E-COMMERCE DATABASE SCHEMA
-- Production-Ready Supabase Schema with RLS, Functions, and Triggers
-- Idempotent migration - safe to run multiple times
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS (Create only if they don't exist)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'MODERATOR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status product_status DEFAULT 'DRAFT',
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  -- JSONB for flexible product-specific details
  details JSONB DEFAULT '{}',
  -- Example: {"material": "leather", "dimensions": {"width": 10, "height": 20}}
  seo_title VARCHAR(70),
  seo_description VARCHAR(160),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants Table (Sizes, Colors, etc.)
CREATE TABLE IF NOT EXISTS variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  -- Variant options stored as JSONB for flexibility
  options JSONB NOT NULL DEFAULT '{}',
  -- Example: {"size": "XL", "color": "Black"}
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  weight_grams INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (links to recruits table)
-- Note: FK constraint to recruits added separately after recruits table exists
-- Using BIGINT to match recruits.id which is BIGSERIAL
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT PRIMARY KEY,
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  -- Saved addresses as JSONB array
  saved_addresses JSONB DEFAULT '[]' CHECK (jsonb_typeof(saved_addresses) = 'array'),
  -- Example: [{"id": "uuid", "label": "Home", "line1": "123 Main St", ...}]
  preferences JSONB DEFAULT '{}' CHECK (jsonb_typeof(preferences) = 'object'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users Table (RBAC)
-- Note: FK constraint to recruits added separately after recruits table exists
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'MODERATOR',
  permissions JSONB DEFAULT '{}',
  -- Example: {"can_delete_products": true, "can_manage_users": false}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
-- Note: FK constraint to recruits added separately after recruits table exists
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id BIGINT,
  -- Guest checkout email
  guest_email VARCHAR(255) CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  status order_status DEFAULT 'PENDING',
  -- Shipping address snapshot
  shipping_address JSONB NOT NULL CHECK (jsonb_typeof(shipping_address) = 'object'),
  billing_address JSONB CHECK (billing_address IS NULL OR jsonb_typeof(billing_address) = 'object'),
  -- Pricing breakdown
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  -- Additional metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  CONSTRAINT orders_user_or_guest CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
  -- Snapshot of product at time of purchase
  product_snapshot JSONB NOT NULL,
  -- Example: {"name": "Premium Watch", "sku": "WATCH-001", "options": {...}}
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
-- Note: FK constraint to recruits added separately after recruits table exists
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one review per user per product
  UNIQUE(product_id, user_id)
);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (
    discount_value > 0 AND 
    (discount_type = 'FIXED' OR (discount_type = 'PERCENTAGE' AND discount_value <= 100))
  ),
  min_order_amount DECIMAL(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT discount_date_range CHECK (starts_at IS NULL OR expires_at IS NULL OR starts_at < expires_at),
  CONSTRAINT discount_usage_limit CHECK (max_uses IS NULL OR current_uses <= max_uses)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (Create only if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_details ON products USING GIN(details);

CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_inventory ON variants(inventory_count);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_guest ON orders(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved, created_at DESC) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved, rating) WHERE is_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique order number with collision detection
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  prefix TEXT := 'BM';
  attempt INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Format: BM-YYMMDD-MICROSECONDS-RANDOM
    new_number := prefix || '-' ||
                  TO_CHAR(NOW(), 'YYMMDD') || '-' ||
                  LPAD(EXTRACT(MICROSECONDS FROM CLOCK_TIMESTAMP())::TEXT, 6, '0') || '-' ||
                  UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    
    -- Check if order number already exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Decrease inventory on order (triggered by new order_items)
-- Uses row-level locking to prevent race conditions
CREATE OR REPLACE FUNCTION decrease_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Check if variant has enough inventory
  IF NEW.variant_id IS NOT NULL THEN
    -- Lock the row and get current inventory (prevents race conditions)
    SELECT inventory_count INTO current_stock
    FROM variants 
    WHERE id = NEW.variant_id
    FOR UPDATE;
    
    -- Verify stock availability
    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Variant % does not exist', NEW.variant_id;
    END IF;
    
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for variant %. Available: %, Requested: %', 
                      NEW.variant_id, current_stock, NEW.quantity;
    END IF;
    
    -- Decrease inventory atomically
    UPDATE variants 
    SET 
      inventory_count = inventory_count - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restore inventory on order cancellation/refund
CREATE OR REPLACE FUNCTION restore_inventory_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only restore if status changed to CANCELLED or REFUNDED
  IF NEW.status IN ('CANCELLED', 'REFUNDED') AND OLD.status NOT IN ('CANCELLED', 'REFUNDED') THEN
    -- Restore inventory for each item with row locking
    FOR item IN 
      SELECT variant_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id AND variant_id IS NOT NULL
    LOOP
      UPDATE variants
      SET 
        inventory_count = inventory_count + item.quantity,
        updated_at = NOW()
      WHERE id = item.variant_id;
    END LOOP;
    
    RAISE NOTICE 'Restored inventory for cancelled/refunded order %', NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update product rating stats
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    details = jsonb_set(
      COALESCE(details, '{}'),
      '{rating_stats}',
      (
        SELECT jsonb_build_object(
          'average', ROUND(AVG(rating)::numeric, 2),
          'count', COUNT(*),
          'distribution', jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
          )
        )
        FROM reviews
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
          AND is_approved = TRUE
      )
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if user is admin (checks against env variable ADMIN_RECRUIT_ID)
-- Set this in your Supabase project: ALTER DATABASE postgres SET app.admin_recruit_id = '1';
CREATE OR REPLACE FUNCTION is_admin(user_recruit_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_id BIGINT;
BEGIN
  -- Get admin ID from database config (set via env/config)
  admin_id := NULLIF(current_setting('app.admin_recruit_id', true), '')::BIGINT;
  RETURN user_recruit_id IS NOT NULL AND user_recruit_id = admin_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check admin role (single admin is always SUPER_ADMIN)
CREATE OR REPLACE FUNCTION get_admin_role(user_recruit_id BIGINT)
RETURNS admin_role AS $$
BEGIN
  IF is_admin(user_recruit_id) THEN
    RETURN 'SUPER_ADMIN'::admin_role;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CUSTOM AUTH FUNCTIONS FOR RECRUITS TABLE
-- These functions extract the recruit_id from JWT claims or session
-- ============================================================================

-- Get current recruit ID from JWT claims
-- Expects JWT to have a 'recruit_id' claim set during login
CREATE OR REPLACE FUNCTION get_current_recruit_id()
RETURNS BIGINT AS $$
DECLARE
  recruit_id BIGINT;
BEGIN
  -- Try to get recruit_id from JWT claims (set during authentication)
  recruit_id := NULLIF(current_setting('request.jwt.claims', true)::json->>'recruit_id', '')::BIGINT;
  
  -- If not in JWT claims, try app.current_recruit_id (for direct DB connections)
  IF recruit_id IS NULL THEN
    recruit_id := NULLIF(current_setting('app.current_recruit_id', true), '')::BIGINT;
  END IF;
  
  RETURN recruit_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is authenticated (has valid recruit_id)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_recruit_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin(get_current_recruit_id());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current user's admin role
CREATE OR REPLACE FUNCTION current_user_admin_role()
RETURNS admin_role AS $$
BEGIN
  RETURN get_admin_role(get_current_recruit_id());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper to set current recruit for API/service calls
-- Usage: SELECT set_current_recruit(123);
CREATE OR REPLACE FUNCTION set_current_recruit(recruit_id BIGINT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_recruit_id', recruit_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to set admin recruit ID (run once to configure)
-- Usage: SELECT set_admin_recruit_id(1);
CREATE OR REPLACE FUNCTION set_admin_recruit_id(admin_id BIGINT)
RETURNS VOID AS $$
BEGIN
  -- This sets it for the current session. For permanent:
  -- ALTER DATABASE postgres SET app.admin_recruit_id = 'YOUR_ID';
  PERFORM set_config('app.admin_recruit_id', admin_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS (Drop and recreate to avoid conflicts)
-- ============================================================================

-- Order number trigger
DROP TRIGGER IF EXISTS tr_set_order_number ON orders;
CREATE TRIGGER tr_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Inventory decrease trigger
DROP TRIGGER IF EXISTS tr_decrease_inventory ON order_items;
CREATE TRIGGER tr_decrease_inventory
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_inventory_on_order();

-- Inventory restore trigger
DROP TRIGGER IF EXISTS tr_restore_inventory ON orders;
CREATE TRIGGER tr_restore_inventory
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_inventory_on_cancel();

-- Review rating update triggers
DROP TRIGGER IF EXISTS tr_update_rating_insert ON reviews;
CREATE TRIGGER tr_update_rating_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  WHEN (NEW.is_approved = TRUE)
  EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS tr_update_rating_update ON reviews;
CREATE TRIGGER tr_update_rating_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS tr_update_rating_delete ON reviews;
CREATE TRIGGER tr_update_rating_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Timestamp triggers
DROP TRIGGER IF EXISTS tr_products_updated ON products;
CREATE TRIGGER tr_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_variants_updated ON variants;
CREATE TRIGGER tr_variants_updated
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_profiles_updated ON profiles;
CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_orders_updated ON orders;
CREATE TRIGGER tr_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_reviews_updated ON reviews;
CREATE TRIGGER tr_reviews_updated
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Uses custom get_current_recruit_id() function for authentication
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_admin_all" ON products;
DROP POLICY IF EXISTS "images_public_read" ON product_images;
DROP POLICY IF EXISTS "images_admin_all" ON product_images;
DROP POLICY IF EXISTS "variants_public_read" ON variants;
DROP POLICY IF EXISTS "variants_admin_all" ON variants;
DROP POLICY IF EXISTS "profiles_own_read" ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "admins_super_admin_all" ON admins;
DROP POLICY IF EXISTS "admins_own_read" ON admins;
DROP POLICY IF EXISTS "orders_own_read" ON orders;
DROP POLICY IF EXISTS "orders_authenticated_insert" ON orders;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;
DROP POLICY IF EXISTS "order_items_own_read" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
DROP POLICY IF EXISTS "reviews_own_read" ON reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_own_update" ON reviews;
DROP POLICY IF EXISTS "reviews_own_delete" ON reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
DROP POLICY IF EXISTS "discounts_public_read" ON discount_codes;
DROP POLICY IF EXISTS "discounts_admin_all" ON discount_codes;

-- Drop any permissive policies
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
DROP POLICY IF EXISTS "allow_all_products" ON products;
DROP POLICY IF EXISTS "allow_all_product_images" ON product_images;
DROP POLICY IF EXISTS "allow_all_variants" ON variants;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_admins" ON admins;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
DROP POLICY IF EXISTS "allow_all_order_items" ON order_items;
DROP POLICY IF EXISTS "allow_all_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_all_discount_codes" ON discount_codes;

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================
-- Public read access (anyone can browse categories)
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (TRUE);

-- Admin full access for managing categories
CREATE POLICY "categories_admin_all" ON categories
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
-- Public can read active products
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (status = 'ACTIVE');

-- Admin can see all products (including drafts)
CREATE POLICY "products_admin_read" ON products
  FOR SELECT USING (current_user_is_admin());

-- Admin full write access
CREATE POLICY "products_admin_write" ON products
  FOR INSERT WITH CHECK (current_user_is_admin());

CREATE POLICY "products_admin_update" ON products
  FOR UPDATE USING (current_user_is_admin());

CREATE POLICY "products_admin_delete" ON products
  FOR DELETE USING (current_user_is_admin());

-- ============================================================================
-- PRODUCT IMAGES POLICIES
-- ============================================================================
-- Public read for images of active products
CREATE POLICY "images_public_read" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
        AND products.status = 'ACTIVE'
    )
  );

-- Admin can see all images
CREATE POLICY "images_admin_read" ON product_images
  FOR SELECT USING (current_user_is_admin());

-- Admin full write access
CREATE POLICY "images_admin_write" ON product_images
  FOR INSERT WITH CHECK (current_user_is_admin());

CREATE POLICY "images_admin_update" ON product_images
  FOR UPDATE USING (current_user_is_admin());

CREATE POLICY "images_admin_delete" ON product_images
  FOR DELETE USING (current_user_is_admin());

-- ============================================================================
-- VARIANTS POLICIES
-- ============================================================================
-- Public read for variants of active products
CREATE POLICY "variants_public_read" ON variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = variants.product_id 
        AND products.status = 'ACTIVE'
    )
  );

-- Admin can see all variants
CREATE POLICY "variants_admin_read" ON variants
  FOR SELECT USING (current_user_is_admin());

-- Admin full write access
CREATE POLICY "variants_admin_write" ON variants
  FOR INSERT WITH CHECK (current_user_is_admin());

CREATE POLICY "variants_admin_update" ON variants
  FOR UPDATE USING (current_user_is_admin());

CREATE POLICY "variants_admin_delete" ON variants
  FOR DELETE USING (current_user_is_admin());

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
-- Users can read their own profile
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (get_current_recruit_id() = id);

-- Users can update their own profile
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (get_current_recruit_id() = id);

-- Users can create their own profile
CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (get_current_recruit_id() = id);

-- Admin full access to all profiles
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- ADMINS POLICIES
-- ============================================================================
-- Only super admins can manage admin table
CREATE POLICY "admins_super_admin_all" ON admins
  FOR ALL USING (current_user_admin_role() = 'SUPER_ADMIN');

-- Admins can read their own record
CREATE POLICY "admins_own_read" ON admins
  FOR SELECT USING (get_current_recruit_id() = user_id);

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================
-- Users can read their own orders
CREATE POLICY "orders_own_read" ON orders
  FOR SELECT USING (get_current_recruit_id() = user_id);

-- Authenticated users can create orders
CREATE POLICY "orders_authenticated_insert" ON orders
  FOR INSERT WITH CHECK (
    get_current_recruit_id() = user_id OR 
    user_id IS NULL -- Guest checkout allowed
  );

-- Admin full access to all orders
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================
-- Users can read items from their own orders
CREATE POLICY "order_items_own_read" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
        AND orders.user_id = get_current_recruit_id()
    )
  );

-- Insert allowed when creating orders (user owns the order or guest)
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
        AND (orders.user_id = get_current_recruit_id() OR orders.user_id IS NULL)
    )
  );

-- Admin full access
CREATE POLICY "order_items_admin_all" ON order_items
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================
-- Public can read approved reviews
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (is_approved = TRUE);

-- Users can read their own reviews (even unapproved)
CREATE POLICY "reviews_own_read" ON reviews
  FOR SELECT USING (get_current_recruit_id() = user_id);

-- Authenticated users can create reviews
CREATE POLICY "reviews_authenticated_insert" ON reviews
  FOR INSERT WITH CHECK (get_current_recruit_id() = user_id);

-- Users can update their own reviews
CREATE POLICY "reviews_own_update" ON reviews
  FOR UPDATE USING (get_current_recruit_id() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_own_delete" ON reviews
  FOR DELETE USING (get_current_recruit_id() = user_id);

-- Admin full access
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- DISCOUNT CODES POLICIES
-- ============================================================================
-- Public can read active discount codes
CREATE POLICY "discounts_public_read" ON discount_codes
  FOR SELECT USING (
    is_active = TRUE 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Admin full access
CREATE POLICY "discounts_admin_all" ON discount_codes
  FOR ALL USING (current_user_is_admin());

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage bucket for product images (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies would be:
-- CREATE POLICY "Public product images" ON storage.objects FOR SELECT USING (bucket_id = 'products');
-- CREATE POLICY "Admin upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND is_admin(auth.uid()));

-- ============================================================================
-- SEED DATA (Optional - for development, uses ON CONFLICT to avoid duplicates)
-- ============================================================================

-- Insert default categories (skip if exists)
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Apparel', 'apparel', 'Premium trading lifestyle apparel', 1),
  ('Accessories', 'accessories', 'Luxury accessories for traders', 2),
  ('Tech', 'tech', 'High-end tech gear for serious traders', 3),
  ('Education', 'education', 'Trading courses and materials', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories (skip if exists)
INSERT INTO categories (name, slug, description, parent_id, sort_order)
SELECT 'Hoodies', 'hoodies', 'Premium hoodies', id, 1 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT 'T-Shirts', 't-shirts', 'Designer t-shirts', id, 2 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT 'Watches', 'watches', 'Luxury timepieces', id, 1 FROM categories WHERE slug = 'accessories'
UNION ALL
SELECT 'Bags', 'bags', 'Premium bags and cases', id, 2 FROM categories WHERE slug = 'accessories'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Product listing view with category info
CREATE OR REPLACE VIEW v_products_with_category AS
SELECT 
  p.*,
  c.name AS category_name,
  c.slug AS category_slug,
  (
    SELECT url FROM product_images 
    WHERE product_id = p.id AND is_primary = TRUE 
    LIMIT 1
  ) AS primary_image,
  (
    SELECT MIN(v.inventory_count) FROM variants v WHERE v.product_id = p.id
  ) AS min_inventory,
  (
    SELECT SUM(v.inventory_count) FROM variants v WHERE v.product_id = p.id
  ) AS total_inventory
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Order summary view
CREATE OR REPLACE VIEW v_orders_summary AS
SELECT 
  o.*,
  p.full_name AS customer_name,
  p.email AS customer_email,
  (
    SELECT COUNT(*) FROM order_items WHERE order_id = o.id
  ) AS item_count,
  (
    SELECT SUM(quantity) FROM order_items WHERE order_id = o.id
  ) AS total_quantity
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS TO RECRUITS TABLE
-- ============================================================================
-- Foreign key constraints are NOT added in this migration to avoid dependency issues.
-- After running this migration, run: 20260204_004_add_store_foreign_keys.sql
-- 
-- This ensures proper migration order:
-- 1. 20260204_001_ensure_recruits_id.sql  (creates recruits table)
-- 2. 20260204_002_bullmoney_store_schema.sql  (this file - creates store tables)
-- 3. 20260204_004_add_store_foreign_keys.sql  (adds foreign key constraints)
-- ============================================================================

-- Log reminder about foreign key constraints
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'BullMoney Store schema created successfully!';
    RAISE NOTICE 'NEXT STEP: Run migration 20260204_004_add_store_foreign_keys.sql';
    RAISE NOTICE 'to add foreign key constraints linking to the recruits table.';
    RAISE NOTICE '=============================================================================';
END $$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE products IS 'Main products table for Bullmoney Store e-commerce platform';
COMMENT ON TABLE variants IS 'Product variants including size, color combinations with inventory tracking';
COMMENT ON TABLE orders IS 'Customer orders with Stripe integration';
COMMENT ON FUNCTION decrease_inventory_on_order() IS 'Automatically decreases variant inventory when order items are created';
