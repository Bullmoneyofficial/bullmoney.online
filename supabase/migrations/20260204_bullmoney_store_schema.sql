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
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  -- Saved addresses as JSONB array
  saved_addresses JSONB DEFAULT '[]',
  -- Example: [{"id": "uuid", "label": "Home", "line1": "123 Main St", ...}]
  preferences JSONB DEFAULT '{}',
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
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id BIGINT,
  -- Guest checkout email
  guest_email VARCHAR(255),
  status order_status DEFAULT 'PENDING',
  -- Shipping address snapshot
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  -- Pricing breakdown
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  -- Additional metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
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
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_pi ON orders(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  prefix TEXT := 'BM';
BEGIN
  new_number := prefix || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
                UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Decrease inventory on order (triggered by new order_items)
CREATE OR REPLACE FUNCTION decrease_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if variant has enough inventory
  IF NEW.variant_id IS NOT NULL THEN
    -- Verify stock availability
    IF (SELECT inventory_count FROM variants WHERE id = NEW.variant_id) < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for variant %', NEW.variant_id;
    END IF;
    
    -- Decrease inventory
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
BEGIN
  -- Only restore if status changed to CANCELLED or REFUNDED
  IF NEW.status IN ('CANCELLED', 'REFUNDED') AND OLD.status NOT IN ('CANCELLED', 'REFUNDED') THEN
    UPDATE variants v
    SET 
      inventory_count = v.inventory_count + oi.quantity,
      updated_at = NOW()
    FROM order_items oi
    WHERE oi.order_id = NEW.id 
      AND oi.variant_id = v.id;
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
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================
-- Public read access (anyone can browse categories)
DO $$ BEGIN
  CREATE POLICY "categories_public_read" ON categories
    FOR SELECT USING (TRUE);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access for managing categories
DO $$ BEGIN
  CREATE POLICY "categories_admin_all" ON categories
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================
-- Public can read active products
DO $$ BEGIN
  CREATE POLICY "products_public_read" ON products
    FOR SELECT USING (status = 'ACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin can see all products (including drafts)
DO $$ BEGIN
  CREATE POLICY "products_admin_read" ON products
    FOR SELECT USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full write access
DO $$ BEGIN
  CREATE POLICY "products_admin_write" ON products
    FOR INSERT WITH CHECK (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "products_admin_update" ON products
    FOR UPDATE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "products_admin_delete" ON products
    FOR DELETE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PRODUCT IMAGES POLICIES
-- ============================================================================
-- Public read for images of active products
DO $$ BEGIN
  CREATE POLICY "images_public_read" ON product_images
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = product_images.product_id 
          AND products.status = 'ACTIVE'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin can see all images
DO $$ BEGIN
  CREATE POLICY "images_admin_read" ON product_images
    FOR SELECT USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full write access
DO $$ BEGIN
  CREATE POLICY "images_admin_write" ON product_images
    FOR INSERT WITH CHECK (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "images_admin_update" ON product_images
    FOR UPDATE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "images_admin_delete" ON product_images
    FOR DELETE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- VARIANTS POLICIES
-- ============================================================================
-- Public read for variants of active products
DO $$ BEGIN
  CREATE POLICY "variants_public_read" ON variants
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM products 
        WHERE products.id = variants.product_id 
          AND products.status = 'ACTIVE'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin can see all variants
DO $$ BEGIN
  CREATE POLICY "variants_admin_read" ON variants
    FOR SELECT USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full write access
DO $$ BEGIN
  CREATE POLICY "variants_admin_write" ON variants
    FOR INSERT WITH CHECK (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "variants_admin_update" ON variants
    FOR UPDATE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "variants_admin_delete" ON variants
    FOR DELETE USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
-- Users can read their own profile
DO $$ BEGIN
  CREATE POLICY "profiles_own_read" ON profiles
    FOR SELECT USING (get_current_recruit_id() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own profile
DO $$ BEGIN
  CREATE POLICY "profiles_own_update" ON profiles
    FOR UPDATE USING (get_current_recruit_id() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can create their own profile
DO $$ BEGIN
  CREATE POLICY "profiles_own_insert" ON profiles
    FOR INSERT WITH CHECK (get_current_recruit_id() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access to all profiles
DO $$ BEGIN
  CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ADMINS POLICIES
-- ============================================================================
-- Only super admins can manage admin table
DO $$ BEGIN
  CREATE POLICY "admins_super_admin_all" ON admins
    FOR ALL USING (current_user_admin_role() = 'SUPER_ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admins can read their own record
DO $$ BEGIN
  CREATE POLICY "admins_own_read" ON admins
    FOR SELECT USING (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================
-- Users can read their own orders
DO $$ BEGIN
  CREATE POLICY "orders_own_read" ON orders
    FOR SELECT USING (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can create orders
DO $$ BEGIN
  CREATE POLICY "orders_authenticated_insert" ON orders
    FOR INSERT WITH CHECK (
      get_current_recruit_id() = user_id OR 
      user_id IS NULL -- Guest checkout allowed
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access to all orders
DO $$ BEGIN
  CREATE POLICY "orders_admin_all" ON orders
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================
-- Users can read items from their own orders
DO $$ BEGIN
  CREATE POLICY "order_items_own_read" ON order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
          AND orders.user_id = get_current_recruit_id()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Insert allowed when creating orders (user owns the order or guest)
DO $$ BEGIN
  CREATE POLICY "order_items_insert" ON order_items
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
          AND (orders.user_id = get_current_recruit_id() OR orders.user_id IS NULL)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access
DO $$ BEGIN
  CREATE POLICY "order_items_admin_all" ON order_items
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================
-- Public can read approved reviews
DO $$ BEGIN
  CREATE POLICY "reviews_public_read" ON reviews
    FOR SELECT USING (is_approved = TRUE);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can read their own reviews (even unapproved)
DO $$ BEGIN
  CREATE POLICY "reviews_own_read" ON reviews
    FOR SELECT USING (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can create reviews
DO $$ BEGIN
  CREATE POLICY "reviews_authenticated_insert" ON reviews
    FOR INSERT WITH CHECK (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own reviews
DO $$ BEGIN
  CREATE POLICY "reviews_own_update" ON reviews
    FOR UPDATE USING (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Users can delete their own reviews
DO $$ BEGIN
  CREATE POLICY "reviews_own_delete" ON reviews
    FOR DELETE USING (get_current_recruit_id() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access
DO $$ BEGIN
  CREATE POLICY "reviews_admin_all" ON reviews
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DISCOUNT CODES POLICIES
-- ============================================================================
-- Public can read active discount codes
DO $$ BEGIN
  CREATE POLICY "discounts_public_read" ON discount_codes
    FOR SELECT USING (
      is_active = TRUE 
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin full access
DO $$ BEGIN
  CREATE POLICY "discounts_admin_all" ON discount_codes
    FOR ALL USING (current_user_is_admin());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Apparel', 'apparel', 'Premium BullMoney branded clothing for traders', 1),
  ('22222222-2222-2222-2222-222222222222', 'Accessories', 'accessories', 'Trading desk accessories and lifestyle items', 2),
  ('33333333-3333-3333-3333-333333333333', 'Tech & Gear', 'tech-gear', 'High-performance tech for serious traders', 3),
  ('44444444-4444-4444-4444-444444444444', 'Home Office', 'home-office', 'Professional trading setup essentials', 4),
  ('55555555-5555-5555-5555-555555555555', 'Drinkware', 'drinkware', 'Stay hydrated during market hours', 5),
  ('66666666-6666-6666-6666-666666666666', 'Limited Edition', 'limited-edition', 'Exclusive collector items for BullMoney members', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Insert subcategories (skip if exists)
INSERT INTO categories (name, slug, description, parent_id, sort_order)
SELECT 'Hoodies', 'hoodies', 'Premium hoodies', id, 1 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT 'T-Shirts', 't-shirts', 'Designer t-shirts', id, 2 FROM categories WHERE slug = 'apparel'
UNION ALL
SELECT 'Watches', 'watches', 'Luxury timepieces', id, 1 FROM categories WHERE slug = 'accessories'
UNION ALL
SELECT 'Bags', 'bags', 'Premium bags and cases', id, 2 FROM categories WHERE slug = 'accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- SAMPLE PRODUCTS (Idempotent - uses ON CONFLICT)
-- ============================================================================

INSERT INTO products (id, name, slug, description, short_description, base_price, compare_at_price, category_id, status, featured, tags, details, seo_title, seo_description) VALUES
  (
    'a0000001-0001-0001-0001-000000000001',
    'BullMoney Premium Hoodie',
    'bullmoney-premium-hoodie',
    'Our signature premium hoodie crafted from 100% organic cotton with a modern fit. Features the iconic BullMoney logo embroidered on the chest and "Trade Smart, Live Rich" on the back. Perfect for those cold market mornings or late-night chart analysis sessions.',
    'Premium organic cotton hoodie with embroidered logo',
    89.99,
    129.99,
    (SELECT id FROM categories WHERE slug = 'apparel'),
    'ACTIVE',
    true,
    ARRAY['hoodie', 'premium', 'organic', 'bestseller'],
    '{"material": "100% Organic Cotton", "weight": "450gsm", "care": "Machine wash cold", "fit": "Regular fit", "features": ["Embroidered logo", "Ribbed cuffs", "Kangaroo pocket", "Adjustable drawstring hood"]}'::jsonb,
    'BullMoney Premium Hoodie - Organic Cotton Trading Gear',
    'Stay comfortable during trading sessions with our premium organic cotton hoodie. Features embroidered logo and modern fit.'
  ),
  (
    'a0000001-0001-0001-0001-000000000002',
    'Bull Run T-Shirt',
    'bull-run-t-shirt',
    'Celebrate every bull run with this premium cotton t-shirt. Features a minimalist bull chart design on the front and motivational trading quotes. Breathable fabric keeps you cool even when the markets are heating up.',
    'Minimalist bull chart design t-shirt',
    39.99,
    49.99,
    (SELECT id FROM categories WHERE slug = 'apparel'),
    'ACTIVE',
    true,
    ARRAY['t-shirt', 'casual', 'bull-run'],
    '{"material": "100% Premium Cotton", "weight": "180gsm", "care": "Machine wash cold", "fit": "Athletic fit", "features": ["Screen printed design", "Reinforced stitching", "Tagless label"]}'::jsonb,
    'Bull Run T-Shirt - Premium Trading Apparel',
    'Celebrate market gains with our premium bull run t-shirt. Comfortable, stylish, and perfect for traders.'
  ),
  (
    'a0000001-0001-0001-0001-000000000003',
    'TraderPro Luxury Watch',
    'traderpro-luxury-watch',
    'A sophisticated timepiece for the serious trader. This Swiss-movement watch features a minimalist dial with market hour markers, sapphire crystal face, and genuine leather strap. Water-resistant up to 100m. Limited edition of 500 pieces.',
    'Swiss-movement luxury watch for traders',
    899.99,
    1299.99,
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'ACTIVE',
    true,
    ARRAY['watch', 'luxury', 'limited-edition', 'swiss'],
    '{"movement": "Swiss Automatic", "case_material": "Stainless Steel 316L", "crystal": "Sapphire", "water_resistance": "100m", "strap": "Genuine Italian Leather", "warranty": "3 years", "features": ["Date display", "Luminous hands", "Exhibition caseback", "Limited to 500 pieces"]}'::jsonb,
    'TraderPro Swiss Luxury Watch - Limited Edition Trading Timepiece',
    'Elevate your trading desk with this Swiss-movement luxury watch. Limited to 500 pieces worldwide.'
  ),
  (
    'a0000001-0001-0001-0001-000000000004',
    'Market Master Backpack',
    'market-master-backpack',
    'The ultimate backpack for mobile traders. Features a dedicated laptop compartment (fits up to 17"), tablet sleeve, multiple organization pockets, water-resistant material, and USB charging port. TSA-friendly design for the trader on the go.',
    'Premium backpack with laptop compartment and USB port',
    149.99,
    199.99,
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'ACTIVE',
    false,
    ARRAY['backpack', 'tech', 'travel'],
    '{"material": "Water-resistant Nylon", "capacity": "30L", "laptop_size": "Up to 17 inch", "dimensions": {"height": 45, "width": 30, "depth": 15}, "features": ["USB charging port", "Hidden pocket", "Padded straps", "Luggage strap", "YKK zippers"]}'::jsonb,
    'Market Master Backpack - Premium Trading Laptop Bag',
    'Professional backpack for traders with laptop compartment, USB port, and water-resistant material.'
  ),
  (
    'a0000001-0001-0001-0001-000000000005',
    'Triple Monitor Stand Pro',
    'triple-monitor-stand-pro',
    'Professional-grade aluminum monitor stand that holds up to three 32" displays. Gas spring arms provide smooth, effortless adjustment. Cable management system keeps your trading desk clean. Supports VESA 75x75 and 100x100 mounting.',
    'Professional triple monitor stand for trading setups',
    299.99,
    399.99,
    (SELECT id FROM categories WHERE slug = 'tech-gear'),
    'ACTIVE',
    true,
    ARRAY['monitor-stand', 'desk', 'ergonomic'],
    '{"material": "Aerospace-grade Aluminum", "max_monitors": 3, "screen_size": "17-32 inch", "weight_capacity": "10kg per arm", "vesa": ["75x75mm", "100x100mm"], "features": ["Gas spring arms", "360° rotation", "Cable management", "Desk clamp mount", "Grommet mount included"]}'::jsonb,
    'Triple Monitor Stand Pro - Professional Trading Desk Setup',
    'Upgrade your trading station with this professional triple monitor stand. Smooth adjustment and cable management.'
  ),
  (
    'a0000001-0001-0001-0001-000000000006',
    'Bulls & Bears Tumbler',
    'bulls-bears-tumbler',
    'Stay hydrated during intense trading sessions with this premium stainless steel tumbler. Vacuum-insulated to keep drinks cold for 24 hours or hot for 12 hours. Features laser-etched bull and bear market cycle design.',
    'Vacuum-insulated stainless steel tumbler',
    34.99,
    44.99,
    (SELECT id FROM categories WHERE slug = 'drinkware'),
    'ACTIVE',
    false,
    ARRAY['tumbler', 'insulated', 'steel'],
    '{"material": "18/8 Stainless Steel", "capacity": "590ml (20oz)", "insulation": "Double-wall vacuum", "cold_retention": "24 hours", "hot_retention": "12 hours", "features": ["Laser etched design", "BPA-free lid", "Sweat-proof", "Dishwasher safe"]}'::jsonb,
    'Bulls & Bears Tumbler - Premium Insulated Drinkware',
    'Keep your drinks at the perfect temperature during trading sessions with this premium insulated tumbler.'
  ),
  (
    'a0000001-0001-0001-0001-000000000007',
    'Mechanical Trading Keyboard',
    'mechanical-trading-keyboard',
    'High-performance mechanical keyboard designed for traders. Cherry MX Blue switches provide tactile feedback perfect for order execution. Programmable macro keys for quick trades. RGB backlighting with market-themed color schemes.',
    'Professional mechanical keyboard with programmable macros',
    179.99,
    229.99,
    (SELECT id FROM categories WHERE slug = 'tech-gear'),
    'ACTIVE',
    true,
    ARRAY['keyboard', 'mechanical', 'rgb', 'gaming'],
    '{"switches": "Cherry MX Blue", "layout": "Full-size (104 keys)", "backlighting": "RGB per-key", "connectivity": "USB-C wired", "polling_rate": "1000Hz", "features": ["Programmable macros", "Media controls", "Aluminum frame", "Hot-swappable switches", "Detachable cable"]}'::jsonb,
    'Mechanical Trading Keyboard - Professional Cherry MX',
    'Execute trades with precision using this professional mechanical keyboard with programmable macros.'
  ),
  (
    'a0000001-0001-0001-0001-000000000008',
    'BullMoney Snapback Cap',
    'bullmoney-snapback-cap',
    'Classic snapback with embroidered BullMoney logo. Adjustable plastic snap closure ensures perfect fit. Structured 6-panel design with flat brim. Available in multiple colors.',
    'Adjustable snapback cap with embroidered logo',
    29.99,
    39.99,
    (SELECT id FROM categories WHERE slug = 'apparel'),
    'ACTIVE',
    false,
    ARRAY['cap', 'hat', 'snapback', 'accessories'],
    '{"material": "80% Acrylic, 20% Wool", "closure": "Plastic snap", "design": "6-panel structured", "brim": "Flat", "features": ["Embroidered logo", "Adjustable fit", "One size fits most"]}'::jsonb,
    'BullMoney Snapback Cap - Trading Lifestyle Hat',
    'Complete your trading outfit with this premium snapback cap featuring the BullMoney logo.'
  ),
  (
    'a0000001-0001-0001-0001-000000000009',
    'Limited Edition Golden Bull Statue',
    'golden-bull-statue',
    'Exclusive golden bull statue cast in solid brass with 24k gold plating. Stands 8 inches tall and weighs 2kg. Each piece is numbered and comes with certificate of authenticity. Only 100 pieces worldwide.',
    'Limited edition 24k gold-plated bull statue',
    499.99,
    799.99,
    (SELECT id FROM categories WHERE slug = 'limited-edition'),
    'ACTIVE',
    true,
    ARRAY['collectible', 'limited-edition', 'luxury', 'statue'],
    '{"material": "Solid Brass with 24k Gold Plating", "dimensions": {"height": 20, "width": 12, "depth": 8}, "weight": "2kg", "edition_size": 100, "features": ["Numbered certificate", "Velvet presentation box", "Hand-finished", "Investment piece"]}'::jsonb,
    'Golden Bull Statue - Limited Edition Trading Collectible',
    'Own a piece of trading history with this limited edition 24k gold-plated bull statue. Only 100 made.'
  ),
  (
    'a0000001-0001-0001-0001-000000000010',
    'Trading Psychology Book Bundle',
    'trading-psychology-book-bundle',
    'Curated collection of 5 essential trading psychology books. Includes classics on discipline, risk management, and emotional control. Comes in a premium gift box with BullMoney bookmarks.',
    'Bundle of 5 curated trading psychology books',
    99.99,
    149.99,
    (SELECT id FROM categories WHERE slug = 'home-office'),
    'ACTIVE',
    false,
    ARRAY['books', 'education', 'bundle'],
    '{"books": 5, "topics": ["Trading Psychology", "Risk Management", "Discipline", "Emotional Control", "Market Analysis"], "features": ["Premium gift box", "BullMoney bookmarks", "Reading guide included"]}'::jsonb,
    'Trading Psychology Book Bundle - Essential Reading for Traders',
    'Master your trading psychology with this curated bundle of 5 essential books for serious traders.'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  category_id = EXCLUDED.category_id,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  tags = EXCLUDED.tags,
  details = EXCLUDED.details,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- ============================================================================
-- PRODUCT IMAGES (Sample data)
-- ============================================================================

INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary) VALUES
  -- BullMoney Premium Hoodie
  ('b0000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', 'BullMoney Premium Hoodie - Front View', 0, true),
  ('b0000001-0001-0001-0001-000000000002', 'a0000001-0001-0001-0001-000000000001', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633', 'BullMoney Premium Hoodie - Back View', 1, false),
  ('b0000001-0001-0001-0001-000000000003', 'a0000001-0001-0001-0001-000000000001', 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe15', 'BullMoney Premium Hoodie - Detail', 2, false),
  
  -- Bull Run T-Shirt
  ('b0000001-0001-0001-0001-000000000004', 'a0000001-0001-0001-0001-000000000002', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'Bull Run T-Shirt - Front View', 0, true),
  ('b0000001-0001-0001-0001-000000000005', 'a0000001-0001-0001-0001-000000000002', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a', 'Bull Run T-Shirt - Design Detail', 1, false),
  
  -- TraderPro Luxury Watch
  ('b0000001-0001-0001-0001-000000000006', 'a0000001-0001-0001-0001-000000000003', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49', 'TraderPro Luxury Watch - Main', 0, true),
  ('b0000001-0001-0001-0001-000000000007', 'a0000001-0001-0001-0001-000000000003', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3', 'TraderPro Luxury Watch - Detail', 1, false),
  ('b0000001-0001-0001-0001-000000000008', 'a0000001-0001-0001-0001-000000000003', 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7', 'TraderPro Luxury Watch - Caseback', 2, false),
  
  -- Market Master Backpack
  ('b0000001-0001-0001-0001-000000000009', 'a0000001-0001-0001-0001-000000000004', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62', 'Market Master Backpack - Front', 0, true),
  ('b0000001-0001-0001-0001-000000000010', 'a0000001-0001-0001-0001-000000000004', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3', 'Market Master Backpack - Interior', 1, false),
  
  -- Triple Monitor Stand Pro
  ('b0000001-0001-0001-0001-000000000011', 'a0000001-0001-0001-0001-000000000005', 'https://images.unsplash.com/photo-1547082661-dc850fb1c8f0', 'Triple Monitor Stand Pro - Setup', 0, true),
  ('b0000001-0001-0001-0001-000000000012', 'a0000001-0001-0001-0001-000000000005', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5', 'Triple Monitor Stand Pro - Detail', 1, false),
  
  -- Bulls & Bears Tumbler
  ('b0000001-0001-0001-0001-000000000013', 'a0000001-0001-0001-0001-000000000006', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8', 'Bulls & Bears Tumbler', 0, true),
  
  -- Mechanical Trading Keyboard
  ('b0000001-0001-0001-0001-000000000014', 'a0000001-0001-0001-0001-000000000007', 'https://images.unsplash.com/photo-1595225476474-87563907a212', 'Mechanical Trading Keyboard - Front', 0, true),
  ('b0000001-0001-0001-0001-000000000015', 'a0000001-0001-0001-0001-000000000007', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3', 'Mechanical Trading Keyboard - RGB', 1, false),
  
  -- BullMoney Snapback Cap
  ('b0000001-0001-0001-0001-000000000016', 'a0000001-0001-0001-0001-000000000008', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b', 'BullMoney Snapback Cap', 0, true),
  
  -- Golden Bull Statue
  ('b0000001-0001-0001-0001-000000000017', 'a0000001-0001-0001-0001-000000000009', 'https://images.unsplash.com/photo-1578632767115-351597cf2477', 'Golden Bull Statue - Main', 0, true),
  ('b0000001-0001-0001-0001-000000000018', 'a0000001-0001-0001-0001-000000000009', 'https://images.unsplash.com/photo-1623367155084-d9ed7f1c83c1', 'Golden Bull Statue - Certificate', 1, false),
  
  -- Trading Psychology Book Bundle
  ('b0000001-0001-0001-0001-000000000019', 'a0000001-0001-0001-0001-000000000010', 'https://images.unsplash.com/photo-1512820790803-83ca734da794', 'Trading Psychology Book Bundle', 0, true)
ON CONFLICT (id) DO UPDATE SET
  url = EXCLUDED.url,
  alt_text = EXCLUDED.alt_text,
  sort_order = EXCLUDED.sort_order,
  is_primary = EXCLUDED.is_primary;

-- ============================================================================
-- PRODUCT VARIANTS (Sizes, Colors, etc.)
-- ============================================================================

INSERT INTO variants (id, product_id, sku, name, options, price_adjustment, inventory_count, low_stock_threshold) VALUES
  -- BullMoney Premium Hoodie variants
  ('c0000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-BLK-S', 'Black / Small', '{"color": "Black", "size": "S"}'::jsonb, 0, 50, 10),
  ('c0000001-0001-0001-0001-000000000002', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-BLK-M', 'Black / Medium', '{"color": "Black", "size": "M"}'::jsonb, 0, 75, 10),
  ('c0000001-0001-0001-0001-000000000003', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-BLK-L', 'Black / Large', '{"color": "Black", "size": "L"}'::jsonb, 0, 100, 10),
  ('c0000001-0001-0001-0001-000000000004', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-BLK-XL', 'Black / X-Large', '{"color": "Black", "size": "XL"}'::jsonb, 0, 80, 10),
  ('c0000001-0001-0001-0001-000000000005', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-GRY-S', 'Gray / Small', '{"color": "Gray", "size": "S"}'::jsonb, 0, 40, 10),
  ('c0000001-0001-0001-0001-000000000006', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-GRY-M', 'Gray / Medium', '{"color": "Gray", "size": "M"}'::jsonb, 0, 60, 10),
  ('c0000001-0001-0001-0001-000000000007', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-GRY-L', 'Gray / Large', '{"color": "Gray", "size": "L"}'::jsonb, 0, 70, 10),
  ('c0000001-0001-0001-0001-000000000008', 'a0000001-0001-0001-0001-000000000001', 'HOODIE-GRY-XL', 'Gray / X-Large', '{"color": "Gray", "size": "XL"}'::jsonb, 0, 50, 10),
  
  -- Bull Run T-Shirt variants
  ('c0000001-0001-0001-0001-000000000009', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-BLK-S', 'Black / Small', '{"color": "Black", "size": "S"}'::jsonb, 0, 100, 15),
  ('c0000001-0001-0001-0001-000000000010', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-BLK-M', 'Black / Medium', '{"color": "Black", "size": "M"}'::jsonb, 0, 150, 15),
  ('c0000001-0001-0001-0001-000000000011', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-BLK-L', 'Black / Large', '{"color": "Black", "size": "L"}'::jsonb, 0, 200, 15),
  ('c0000001-0001-0001-0001-000000000012', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-BLK-XL', 'Black / X-Large', '{"color": "Black", "size": "XL"}'::jsonb, 0, 120, 15),
  ('c0000001-0001-0001-0001-000000000013', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-WHT-S', 'White / Small', '{"color": "White", "size": "S"}'::jsonb, 0, 80, 15),
  ('c0000001-0001-0001-0001-000000000014', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-WHT-M', 'White / Medium', '{"color": "White", "size": "M"}'::jsonb, 0, 120, 15),
  ('c0000001-0001-0001-0001-000000000015', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-WHT-L', 'White / Large', '{"color": "White", "size": "L"}'::jsonb, 0, 150, 15),
  ('c0000001-0001-0001-0001-000000000016', 'a0000001-0001-0001-0001-000000000002', 'TSHIRT-WHT-XL', 'White / X-Large', '{"color": "White", "size": "XL"}'::jsonb, 0, 100, 15),
  
  -- TraderPro Luxury Watch (limited editions)
  ('c0000001-0001-0001-0001-000000000017', 'a0000001-0001-0001-0001-000000000003', 'WATCH-BLK-001', 'Black Dial', '{"dial": "Black", "strap": "Black Leather"}'::jsonb, 0, 45, 5),
  ('c0000001-0001-0001-0001-000000000018', 'a0000001-0001-0001-0001-000000000003', 'WATCH-BLU-001', 'Blue Dial', '{"dial": "Blue", "strap": "Brown Leather"}'::jsonb, 50, 30, 5),
  ('c0000001-0001-0001-0001-000000000019', 'a0000001-0001-0001-0001-000000000003', 'WATCH-WHT-001', 'White Dial', '{"dial": "White", "strap": "Black Leather"}'::jsonb, 0, 25, 5),
  
  -- Market Master Backpack
  ('c0000001-0001-0001-0001-000000000020', 'a0000001-0001-0001-0001-000000000004', 'BACKPACK-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 200, 20),
  ('c0000001-0001-0001-0001-000000000021', 'a0000001-0001-0001-0001-000000000004', 'BACKPACK-GRY', 'Gray', '{"color": "Gray"}'::jsonb, 0, 150, 20),
  ('c0000001-0001-0001-0001-000000000022', 'a0000001-0001-0001-0001-000000000004', 'BACKPACK-NVY', 'Navy', '{"color": "Navy"}'::jsonb, 0, 100, 20),
  
  -- Triple Monitor Stand Pro
  ('c0000001-0001-0001-0001-000000000023', 'a0000001-0001-0001-0001-000000000005', 'MONITOR-STAND-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 75, 10),
  ('c0000001-0001-0001-0001-000000000024', 'a0000001-0001-0001-0001-000000000005', 'MONITOR-STAND-SLV', 'Silver', '{"color": "Silver"}'::jsonb, 0, 50, 10),
  
  -- Bulls & Bears Tumbler
  ('c0000001-0001-0001-0001-000000000025', 'a0000001-0001-0001-0001-000000000006', 'TUMBLER-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 300, 30),
  ('c0000001-0001-0001-0001-000000000026', 'a0000001-0001-0001-0001-000000000006', 'TUMBLER-SLV', 'Silver', '{"color": "Silver"}'::jsonb, 0, 250, 30),
  ('c0000001-0001-0001-0001-000000000027', 'a0000001-0001-0001-0001-000000000006', 'TUMBLER-GLD', 'Gold', '{"color": "Gold"}'::jsonb, 5, 200, 30),
  
  -- Mechanical Trading Keyboard
  ('c0000001-0001-0001-0001-000000000028', 'a0000001-0001-0001-0001-000000000007', 'KEYBOARD-BLK-BLUE', 'Black / Blue Switches', '{"color": "Black", "switch": "Cherry MX Blue"}'::jsonb, 0, 80, 10),
  ('c0000001-0001-0001-0001-000000000029', 'a0000001-0001-0001-0001-000000000007', 'KEYBOARD-BLK-RED', 'Black / Red Switches', '{"color": "Black", "switch": "Cherry MX Red"}'::jsonb, 0, 60, 10),
  ('c0000001-0001-0001-0001-000000000030', 'a0000001-0001-0001-0001-000000000007', 'KEYBOARD-WHT-BLUE', 'White / Blue Switches', '{"color": "White", "switch": "Cherry MX Blue"}'::jsonb, 10, 40, 10),
  
  -- BullMoney Snapback Cap
  ('c0000001-0001-0001-0001-000000000031', 'a0000001-0001-0001-0001-000000000008', 'CAP-BLK', 'Black', '{"color": "Black"}'::jsonb, 0, 200, 25),
  ('c0000001-0001-0001-0001-000000000032', 'a0000001-0001-0001-0001-000000000008', 'CAP-NVY', 'Navy', '{"color": "Navy"}'::jsonb, 0, 150, 25),
  ('c0000001-0001-0001-0001-000000000033', 'a0000001-0001-0001-0001-000000000008', 'CAP-WHT', 'White', '{"color": "White"}'::jsonb, 0, 180, 25),
  
  -- Golden Bull Statue (numbered editions)
  ('c0000001-0001-0001-0001-000000000034', 'a0000001-0001-0001-0001-000000000009', 'STATUE-GOLD-001', 'Edition 1-25', '{"edition": "1-25"}'::jsonb, 0, 12, 3),
  ('c0000001-0001-0001-0001-000000000035', 'a0000001-0001-0001-0001-000000000009', 'STATUE-GOLD-002', 'Edition 26-50', '{"edition": "26-50"}'::jsonb, 0, 15, 3),
  ('c0000001-0001-0001-0001-000000000036', 'a0000001-0001-0001-0001-000000000009', 'STATUE-GOLD-003', 'Edition 51-75', '{"edition": "51-75"}'::jsonb, 0, 18, 3),
  ('c0000001-0001-0001-0001-000000000037', 'a0000001-0001-0001-0001-000000000009', 'STATUE-GOLD-004', 'Edition 76-100', '{"edition": "76-100"}'::jsonb, 0, 20, 3),
  
  -- Trading Psychology Book Bundle
  ('c0000001-0001-0001-0001-000000000038', 'a0000001-0001-0001-0001-000000000010', 'BOOKS-BUNDLE-001', 'Standard Edition', '{"edition": "Standard"}'::jsonb, 0, 500, 50)
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  options = EXCLUDED.options,
  price_adjustment = EXCLUDED.price_adjustment,
  inventory_count = EXCLUDED.inventory_count,
  low_stock_threshold = EXCLUDED.low_stock_threshold;

-- ============================================================================
-- DISCOUNT CODES (Sample promotional codes)
-- ============================================================================

INSERT INTO discount_codes (id, code, description, discount_type, discount_value, min_order_amount, max_uses, current_uses, starts_at, expires_at, is_active) VALUES
  (
    'd0000001-0001-0001-0001-000000000001',
    'WELCOME10',
    'Welcome discount for new customers - 10% off first order',
    'PERCENTAGE',
    10.00,
    0,
    1000,
    0,
    NOW(),
    NOW() + INTERVAL '90 days',
    true
  ),
  (
    'd0000001-0001-0001-0001-000000000002',
    'BULLRUN25',
    'Bull run celebration - 25% off all orders',
    'PERCENTAGE',
    25.00,
    100.00,
    500,
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  ),
  (
    'd0000001-0001-0001-0001-000000000003',
    'FREESHIP',
    'Free shipping on orders over $50',
    'FIXED',
    15.00,
    50.00,
    NULL,
    0,
    NOW(),
    NOW() + INTERVAL '180 days',
    true
  ),
  (
    'd0000001-0001-0001-0001-000000000004',
    'VIP50',
    'Exclusive VIP discount - $50 off orders over $200',
    'FIXED',
    50.00,
    200.00,
    100,
    0,
    NOW(),
    NOW() + INTERVAL '60 days',
    true
  ),
  (
    'd0000001-0001-0001-0001-000000000005',
    'FLASH15',
    'Flash sale - 15% off everything',
    'PERCENTAGE',
    15.00,
    0,
    2000,
    0,
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  ),
  (
    'd0000001-0001-0001-0001-000000000006',
    'TRADER20',
    'Trader appreciation - 20% off tech gear',
    'PERCENTAGE',
    20.00,
    75.00,
    NULL,
    0,
    NOW(),
    NOW() + INTERVAL '45 days',
    true
  )
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_amount = EXCLUDED.min_order_amount,
  max_uses = EXCLUDED.max_uses,
  starts_at = EXCLUDED.starts_at,
  expires_at = EXCLUDED.expires_at,
  is_active = EXCLUDED.is_active;

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
-- FOREIGN KEY CONSTRAINTS TO RECRUITS TABLE (Optional)
-- These can be added separately if recruits table exists
-- If you need these constraints, run them manually after RECRUITS_TABLE.sql:
-- 
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES public.recruits(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE public.admins ADD CONSTRAINT admins_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE SET NULL;
-- 
-- ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES public.recruits(id) ON DELETE CASCADE;
-- ============================================================================

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE products IS 'Main products table for Bullmoney Store e-commerce platform';
COMMENT ON TABLE variants IS 'Product variants including size, color combinations with inventory tracking';
COMMENT ON TABLE orders IS 'Customer orders with Stripe integration';
COMMENT ON FUNCTION decrease_inventory_on_order() IS 'Automatically decreases variant inventory when order items are created';
