-- =============================================
-- STORE TABLES - ALL NEW FEATURES
-- Run this in Supabase SQL Editor
-- Gift Cards, Discount Codes, Orders, Email Templates,
-- Back-in-Stock, Translations, Store Analytics
-- =============================================


-- =============================================
-- 1. GIFT CARDS TABLE
-- =============================================

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
  redeemed_by TEXT, -- email of redeemer
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 years'),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient ON public.gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON public.gift_cards(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on gift_cards" ON public.gift_cards FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 2. DISCOUNT CODES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2), -- cap for percentage discounts
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_products', 'specific_categories')),
  product_ids TEXT[], -- for specific_products
  category_slugs TEXT[], -- for specific_categories
  first_order_only BOOLEAN DEFAULT false,
  free_shipping BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on discount_codes" ON public.discount_codes FOR ALL USING (true) WITH CHECK (true);

-- Seed some default codes
INSERT INTO public.discount_codes (code, description, discount_type, discount_value, min_order_amount) VALUES
  ('WELCOME10', 'Welcome discount - 10% off first order', 'percent', 10, 50),
  ('BULL20', '20% off orders over $100', 'percent', 20, 100),
  ('SAVE15', '$15 off orders over $75', 'fixed', 15, 75),
  ('VIP25', 'VIP members 25% off', 'percent', 25, 150),
  ('LAUNCH30', 'Launch special 30% off', 'percent', 30, 200)
ON CONFLICT (code) DO NOTHING;


-- =============================================
-- 3. STORE ORDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  
  -- Items (JSONB array)
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- [{name, quantity, price, variant_id, product_id, image, options}]
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  gift_card_code TEXT,
  gift_card_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Shipping
  shipping_address JSONB,
  -- {name, line1, line2, city, state, postal_code, country, phone}
  shipping_method TEXT DEFAULT 'standard',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
  
  -- Payment
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  payment_method TEXT, -- stripe, apple_pay, google_pay, gift_card
  
  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,
  carrier TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'web',
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_orders_email ON public.store_orders(email);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_number ON public.store_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON public.store_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_stripe ON public.store_orders(stripe_session_id);

-- RLS
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on store_orders" ON public.store_orders FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 4. BACK-IN-STOCK SUBSCRIPTIONS TABLE
-- =============================================

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_back_in_stock_product ON public.back_in_stock_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_email ON public.back_in_stock_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_back_in_stock_pending ON public.back_in_stock_subscriptions(notified) WHERE notified = false;

-- RLS
ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on back_in_stock" ON public.back_in_stock_subscriptions FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 5. EMAIL TEMPLATES TABLE (Admin-editable)
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slug TEXT NOT NULL UNIQUE, -- 'order_confirmation', 'order_shipped', 'order_delivered', etc.
  name TEXT NOT NULL, -- Human-readable name
  subject TEXT NOT NULL, -- Email subject line (supports {{variables}})
  html_body TEXT NOT NULL, -- Full HTML body (supports {{variables}})
  text_body TEXT, -- Plain text fallback
  description TEXT, -- Admin helper text
  is_active BOOLEAN DEFAULT true,
  variables TEXT[] DEFAULT '{}', -- List of available template variables
  category TEXT DEFAULT 'store' CHECK (category IN ('store', 'auth', 'marketing', 'notification')),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on email_templates" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);

-- Seed default email templates
INSERT INTO public.email_templates (slug, name, subject, html_body, description, variables, category) VALUES

-- ORDER CONFIRMATION
('order_confirmation', 'Order Confirmation', 'Order Confirmed — #{{order_number}}', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #1a1a1a;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">Order Confirmed ✓</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Thank you for your order, {{customer_name}}!</p>
  </div>
  
  <div style="padding: 32px;">
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Order Number</p>
      <p style="font-size: 20px; font-weight: 500; margin: 0;">#{{order_number}}</p>
    </div>
    
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin: 0 0 16px;">Items Ordered</h3>
    {{items_html}}
    
    <div style="border-top: 1px solid #1a1a1a; padding-top: 16px; margin-top: 16px;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="color: rgba(255,255,255,0.5); padding: 4px 0;">Subtotal</td><td style="text-align: right;">{{subtotal}}</td></tr>
        <tr><td style="color: rgba(255,255,255,0.5); padding: 4px 0;">Shipping</td><td style="text-align: right;">{{shipping}}</td></tr>
        {{#if discount}}<tr><td style="color: #3b82f6; padding: 4px 0;">Discount</td><td style="text-align: right; color: #3b82f6;">-{{discount}}</td></tr>{{/if}}
        <tr><td style="color: rgba(255,255,255,0.5); padding: 4px 0;">Tax</td><td style="text-align: right;">{{tax}}</td></tr>
        <tr style="font-size: 18px; font-weight: 600;"><td style="padding: 12px 0 0;">Total</td><td style="text-align: right; padding: 12px 0 0;">{{total}}</td></tr>
      </table>
    </div>
  </div>
  
  {{#if shipping_address}}
  <div style="padding: 0 32px 32px;">
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin: 0 0 12px;">Shipping To</h3>
    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">{{shipping_address}}</p>
    </div>
  </div>
  {{/if}}
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <a href="{{store_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">Continue Shopping</a>
  </div>
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
    <p style="color: rgba(255,255,255,0.2); font-size: 11px; margin: 8px 0 0;">Questions? Reply to this email or contact support.</p>
  </div>
</div>
', 'Sent when a new order is placed. Edit HTML and use {{variables}} for dynamic content.',
ARRAY['customer_name', 'order_number', 'items_html', 'subtotal', 'shipping', 'tax', 'discount', 'total', 'shipping_address', 'store_url', 'year'],
'store'),

-- ORDER SHIPPED
('order_shipped', 'Order Shipped', 'Your Order #{{order_number}} Has Shipped! 📦', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #1a1a1a;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">Your Order Has Shipped!</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Order #{{order_number}}</p>
  </div>
  
  <div style="padding: 32px; text-align: center;">
    <div style="background: rgba(59,130,246,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(59,130,246,0.2);">
      <p style="color: #3b82f6; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Tracking Number</p>
      <p style="font-size: 20px; font-family: monospace; letter-spacing: 2px; margin: 0;">{{tracking_number}}</p>
    </div>
    
    {{#if tracking_url}}
    <a href="{{tracking_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px;">Track Your Package</a>
    {{/if}}
    
    <p style="color: rgba(255,255,255,0.5); font-size: 14px;">Carrier: {{carrier}}</p>
    
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin: 24px 0 16px; text-align: left;">Items Shipped</h3>
    {{items_html}}
  </div>
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
  </div>
</div>
', 'Sent when an order ships. Edit tracking layout and messaging.',
ARRAY['customer_name', 'order_number', 'tracking_number', 'tracking_url', 'carrier', 'items_html', 'store_url', 'year'],
'store'),

-- ORDER DELIVERED
('order_delivered', 'Order Delivered', 'Your Order #{{order_number}} Has Been Delivered! 🎉', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #1a1a1a;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">Order Delivered!</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Your order #{{order_number}} has arrived.</p>
  </div>
  
  <div style="padding: 32px; text-align: center;">
    <div style="width: 64px; height: 64px; background: rgba(34,197,94,0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="font-size: 32px;">✓</span>
    </div>
    <p style="color: rgba(255,255,255,0.7); font-size: 16px; margin: 0 0 24px;">We hope you love your new gear, {{customer_name}}!</p>
    
    <a href="{{store_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">Shop Again</a>
  </div>
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
  </div>
</div>
', 'Sent when an order is marked as delivered.',
ARRAY['customer_name', 'order_number', 'store_url', 'year'],
'store'),

-- BACK IN STOCK NOTIFICATION
('back_in_stock', 'Back In Stock Notification', '{{product_name}} is Back in Stock! 🔥', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">It''s Back!</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">The item you were waiting for is now available.</p>
  </div>
  
  <div style="padding: 0 32px 32px; text-align: center;">
    <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="font-size: 20px; font-weight: 500; margin: 0 0 8px;">{{product_name}}</h2>
      {{#if variant_name}}<p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">{{variant_name}}</p>{{/if}}
    </div>
    
    <a href="{{product_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">Shop Now — Before It Sells Out</a>
    
    <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 24px 0 0;">Limited stock available. Don''t miss out!</p>
  </div>
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
  </div>
</div>
', 'Sent when a subscribed product comes back in stock.',
ARRAY['product_name', 'variant_name', 'product_url', 'store_url', 'year'],
'store'),

-- GIFT CARD EMAIL
('gift_card', 'Gift Card Delivery', '{{sender_name}} sent you a ${{amount}} Bullmoney Gift Card!', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">You''ve Received a Gift Card!</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">From {{sender_name}}</p>
  </div>
  
  <div style="padding: 0 32px 32px; text-align: center;">
    {{#if message}}
    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.7); font-size: 14px; font-style: italic; margin: 0;">"{{message}}"</p>
    </div>
    {{/if}}
    
    <div style="padding: 32px; background: rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);">
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Gift Card Value</p>
      <p style="font-size: 48px; font-weight: 300; margin: 0 0 16px;">${{amount}}</p>
      <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Redemption Code</p>
      <p style="font-size: 24px; font-family: monospace; letter-spacing: 3px; margin: 0;">{{code}}</p>
    </div>
    
    <a href="{{store_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">Shop Now</a>
    
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 24px 0 0;">Enter code at checkout. This gift card does not expire.</p>
  </div>
  
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
  </div>
</div>
', 'Sent when a gift card is purchased for someone.',
ARRAY['sender_name', 'amount', 'code', 'message', 'recipient_name', 'store_url', 'year'],
'store'),

-- WELCOME / NEWSLETTER
('welcome_subscriber', 'Welcome Email', 'Welcome to Bullmoney 🐂', '
<div style="max-width: 600px; margin: 0 auto; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">
  <div style="padding: 40px 32px; text-align: center;">
    <div style="width: 48px; height: 48px; background: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
      <span style="color: #000; font-weight: bold; font-size: 20px;">B</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 300; margin: 0 0 8px;">Welcome to Bullmoney</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">The trading community that levelled the game.</p>
  </div>
  <div style="padding: 0 32px 32px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6;">You''re now part of an elite community of traders. Get ready for exclusive drops, trading insights, and premium gear.</p>
    <a href="{{store_url}}" style="display: inline-block; padding: 14px 32px; background: #fff; color: #000; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">Explore the Store</a>
  </div>
  <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #1a1a1a;">
    <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0;">© {{year}} Bullmoney. All rights reserved.</p>
  </div>
</div>
', 'Welcome email for new subscribers.',
ARRAY['store_url', 'year'],
'marketing')

ON CONFLICT (slug) DO NOTHING;


-- =============================================
-- 6. SITE TRANSLATIONS TABLE (SEO + i18n)
-- Stores translations for all UI strings per language
-- =============================================

CREATE TABLE IF NOT EXISTS public.site_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language_code TEXT NOT NULL, -- 'en', 'es', 'fr', etc.
  translation_key TEXT NOT NULL, -- dot notation: 'store.header.shop', 'common.addToCart'
  translation_value TEXT NOT NULL, -- The translated string
  context TEXT, -- Optional context for translators
  is_verified BOOLEAN DEFAULT false, -- Whether a human verified this
  UNIQUE(language_code, translation_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_translations_lang ON public.site_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.site_translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_translations_lang_key ON public.site_translations(language_code, translation_key);

-- RLS
ALTER TABLE public.site_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read translations" ON public.site_translations FOR SELECT USING (true);
CREATE POLICY "Service role write translations" ON public.site_translations FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 7. STORE ANALYTICS / PAGE VIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type TEXT NOT NULL, -- 'page_view', 'add_to_cart', 'purchase', 'search', 'wishlist_add'
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
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  value DECIMAL(10,2), -- monetary value for purchase events
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.store_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.store_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON public.store_analytics(product_id);

-- RLS
ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on analytics" ON public.store_analytics FOR ALL USING (true) WITH CHECK (true);


-- =============================================
-- 8. ADD STORE COLUMNS TO RECRUITS TABLE
-- (Run as ALTER if table already exists)
-- =============================================

DO $$
BEGIN
  -- Display name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'display_name') THEN
    ALTER TABLE public.recruits ADD COLUMN display_name TEXT;
  END IF;
  
  -- Shipping addresses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'shipping_addresses') THEN
    ALTER TABLE public.recruits ADD COLUMN shipping_addresses JSONB DEFAULT '[]'::JSONB;
  END IF;
  
  -- Preferred currency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'preferred_currency') THEN
    ALTER TABLE public.recruits ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Preferred language
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.recruits ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
  
  -- Store stats
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_order_count') THEN
    ALTER TABLE public.recruits ADD COLUMN store_order_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_total_spent') THEN
    ALTER TABLE public.recruits ADD COLUMN store_total_spent DECIMAL(10,2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_wishlist_ids') THEN
    ALTER TABLE public.recruits ADD COLUMN store_wishlist_ids TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_last_order_at') THEN
    ALTER TABLE public.recruits ADD COLUMN store_last_order_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_customer_since') THEN
    ALTER TABLE public.recruits ADD COLUMN store_customer_since TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_newsletter_subscribed') THEN
    ALTER TABLE public.recruits ADD COLUMN store_newsletter_subscribed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'store_size_preferences') THEN
    ALTER TABLE public.recruits ADD COLUMN store_size_preferences JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recruits' AND column_name = 'back_in_stock_subscriptions') THEN
    ALTER TABLE public.recruits ADD COLUMN back_in_stock_subscriptions TEXT[];
  END IF;
END$$;


-- =============================================
-- DONE! All store feature tables created.
-- =============================================
