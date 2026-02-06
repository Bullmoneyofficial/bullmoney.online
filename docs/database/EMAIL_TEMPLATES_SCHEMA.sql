-- ============================================================================
-- EMAIL TEMPLATES SCHEMA
-- Database-driven email templates for admin editing
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'welcome', 'grand_launch', 'store_promo'
  name VARCHAR(100) NOT NULL, -- Display name for admin
  subject VARCHAR(255) NOT NULL, -- Email subject line
  
  -- Hero/Header section
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  hero_icon VARCHAR(50) DEFAULT 'check', -- Icon type: check, play, crown, shopping, tag, dollar, chart, mail
  
  -- Content sections (JSON arrays for flexible content blocks)
  content_blocks JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   { "type": "heading", "text": "What''s waiting for you:" },
  --   { "type": "list", "items": ["Item 1", "Item 2"] },
  --   { "type": "paragraph", "text": "Some text here" },
  --   { "type": "cta", "text": "Shop Now", "url": "/store", "style": "primary" },
  --   { "type": "pricing_grid", "items": [...] },
  --   { "type": "product_table", "items": [...] }
  -- ]
  
  -- CTA buttons
  primary_cta_text VARCHAR(100) DEFAULT '',
  primary_cta_url VARCHAR(255) DEFAULT '',
  secondary_cta_text VARCHAR(100) DEFAULT '',
  secondary_cta_url VARCHAR(255) DEFAULT '',
  
  -- Footer customization
  footer_text TEXT DEFAULT '',
  
  -- Promo code section
  promo_code VARCHAR(50) DEFAULT '',
  promo_description TEXT DEFAULT '',
  
  -- Attachments (inline images, links, files)
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   { "id": "att_123", "type": "image", "name": "Product", "url": "https://...", "cid": "img_123" },
  --   { "id": "att_456", "type": "link", "name": "More Info", "url": "https://..." },
  --   { "id": "att_789", "type": "file", "name": "Guide.pdf", "url": "https://..." }
  -- ]
  
  -- ============================================
  -- FULL STYLE CUSTOMIZATION
  -- ============================================
  styles JSONB DEFAULT '{
    "mode": "dark",
    "colors": {
      "primary": "#3b82f6",
      "primaryDark": "#1d4ed8",
      "background": "#000000",
      "cardBg": "#111111",
      "cardBgAlt": "#0a0a0a",
      "border": "#222222",
      "textPrimary": "#ffffff",
      "textSecondary": "#e0e0e0",
      "textMuted": "#888888",
      "textDim": "#666666",
      "link": "#3b82f6",
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "darkMode": {
      "background": "#000000",
      "cardBg": "#111111",
      "textPrimary": "#ffffff",
      "textSecondary": "#e0e0e0"
    },
    "lightMode": {
      "background": "#ffffff",
      "cardBg": "#f8f9fa",
      "textPrimary": "#1a1a1a",
      "textSecondary": "#4a4a4a"
    },
    "typography": {
      "fontFamily": "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      "heroSize": "32px",
      "headingSize": "18px",
      "bodySize": "16px",
      "smallSize": "14px",
      "tinySize": "12px",
      "lineHeight": "1.7"
    },
    "spacing": {
      "containerPadding": "40px",
      "cardPadding": "24px",
      "sectionGap": "24px",
      "elementGap": "16px"
    },
    "borders": {
      "radius": "16px",
      "radiusSmall": "12px",
      "radiusTiny": "8px",
      "width": "1px"
    },
    "buttons": {
      "primaryBg": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      "primaryText": "#ffffff",
      "primaryRadius": "12px",
      "primaryPadding": "18px 48px",
      "secondaryBg": "transparent",
      "secondaryBorder": "#3b82f6",
      "secondaryText": "#3b82f6"
    },
    "hero": {
      "iconBg": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      "iconSize": "64px",
      "iconRadius": "50%"
    },
    "layout": {
      "maxWidth": "600px",
      "columns": 2,
      "gridGap": "8px"
    }
  }'::jsonb,
  
  -- Template metadata
  category VARCHAR(50) DEFAULT 'general', -- general, promotion, vip, course, affiliate
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  
  -- ============================================
  -- SCHEDULING CONFIGURATION
  -- ============================================
  
  -- Sending type: 'manual', 'recurring', 'once', 'drip'
  send_type VARCHAR(20) DEFAULT 'manual',
  
  -- Interval settings (for recurring emails)
  interval_days INT DEFAULT 0, -- 0=disabled, 1=daily, 7=weekly, 30=monthly
  interval_hours INT DEFAULT 0, -- Additional hours offset
  
  -- Specific time to send (24-hour format)
  send_hour INT DEFAULT 9, -- Hour of day to send (0-23)
  send_minute INT DEFAULT 0, -- Minute of hour (0-59)
  
  -- Days of week to send (for weekly recurring)
  -- JSON array: [1,2,3,4,5] = Mon-Fri, [0,6] = Weekends
  send_days_of_week JSONB DEFAULT '[]'::jsonb,
  
  -- Target audience
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'recruits', 'vip', 'newsletter', 'custom'
  
  -- Drip sequence number (for drip campaigns)
  drip_sequence_number INT DEFAULT 0,
  drip_days_after_signup INT DEFAULT 0, -- Days after signup to send this email
  
  -- Tracking
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  total_sent INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (allows re-running this script)
DROP POLICY IF EXISTS "Allow authenticated read email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow admin manage email_templates" ON email_templates;
DROP POLICY IF EXISTS "Allow service role full access email_templates" ON email_templates;

-- Allow authenticated users to read all templates
CREATE POLICY "Allow authenticated read email_templates"
ON email_templates
FOR SELECT
TO authenticated
USING (true);

-- Allow admin to manage templates (you may want to restrict this further)
CREATE POLICY "Allow admin manage email_templates"
ON email_templates
FOR ALL
TO authenticated
USING (
  auth.jwt()->>'email' = current_setting('app.admin_email', true)
  OR current_setting('app.admin_email', true) IS NULL
)
WITH CHECK (
  auth.jwt()->>'email' = current_setting('app.admin_email', true)
  OR current_setting('app.admin_email', true) IS NULL
);

-- Allow anon/service role full access for API
CREATE POLICY "Allow service role full access email_templates"
ON email_templates
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

INSERT INTO email_templates (slug, name, subject, hero_title, hero_subtitle, hero_icon, primary_cta_text, primary_cta_url, secondary_cta_text, secondary_cta_url, content_blocks, category, display_order) VALUES

('welcome', 'Welcome Email', 'Welcome to Bullmoney — You''re In', 
 'Welcome to Bullmoney', 'You''re in. Get ready for exclusive drops, trading insights, and deals you won''t find anywhere else.', 'check',
 'Shop Store', '/store', 'Join VIP', '/VIP',
 '[
   {"type": "heading", "text": "Here''s What You Get"},
   {"type": "list", "items": [
     {"title": "Exclusive Store Discounts", "desc": "Early access to sales and subscriber-only codes", "color": "#3b82f6"},
     {"title": "Trading Tips & Insights", "desc": "Weekly market analysis and trading education", "color": "#60a5fa"},
     {"title": "New Product Alerts", "desc": "Be the first to know about drops and restocks", "color": "#2563eb"},
     {"title": "VIP & Course Updates", "desc": "Special offers on premium memberships", "color": "#1d4ed8"}
   ]},
   {"type": "links_grid", "items": [
     {"title": "Shop Store", "subtitle": "Hoodies from $29.99", "url": "/store"},
     {"title": "Join VIP", "subtitle": "From $29/month", "url": "/VIP"},
     {"title": "Take the Course", "subtitle": "$199 one-time", "url": "/course"},
     {"title": "Earn Money", "subtitle": "20% commission", "url": "/recruit"}
   ]}
 ]'::jsonb,
 'general', 1),

('grand_launch', 'Grand Launch', 'Bullmoney Is LIVE — Everything You Need Is Here',
 'We''re Live', 'The wait is over. Bullmoney is officially here — built for traders who want real results.', 'play',
 'Shop The Store', '/store', 'Join VIP Access', '/VIP',
 '[
   {"type": "heading", "text": "What''s waiting for you:"},
   {"type": "list", "items": [
     {"title": "VIP Trading Signals", "desc": "Live calls starting at just $49/month", "link": "/VIP"},
     {"title": "The Bullmoney Store", "desc": "Hoodies from $29.99, caps from $14.99", "link": "/store"},
     {"title": "Live Streams", "desc": "Free daily market analysis on YouTube", "link": "/socials"},
     {"title": "Trading Course", "desc": "Full curriculum for only $199 (lifetime)", "link": "/course"},
     {"title": "Affiliate Program", "desc": "Earn 20% commission on every referral", "link": "/recruit"}
   ]}
 ]'::jsonb,
 'promotion', 2),

('store_promo', 'Store Promo', 'The Bullmoney Store Is Open — Hoodies from $29.99',
 'The Bullmoney Store Is Open', 'Premium trader gear at prices you won''t believe', 'shopping',
 'Shop Now', '/store', '', '',
 '[
   {"type": "heading", "text": "Launch Sale — Up to 70% Off"},
   {"type": "products_table", "items": [
     {"name": "Premium Hoodie", "price": "$29.99", "oldPrice": "$89.99", "link": "/store?product=hoodie"},
     {"name": "Trader Snapback Cap", "price": "$14.99", "oldPrice": "$34.99", "link": "/store?product=cap"},
     {"name": "Classic T-Shirt", "price": "$19.99", "oldPrice": "$39.99", "link": "/store?product=tshirt"},
     {"name": "Market Tumbler", "price": "$12.99", "oldPrice": "$34.99", "link": "/store?product=tumbler"}
   ]},
   {"type": "promo_code", "code": "WELCOME10", "desc": "Extra 10% off with code"},
   {"type": "categories_grid", "items": [
     {"name": "Apparel", "price": "From $14.99", "link": "/store?category=apparel"},
     {"name": "Accessories", "price": "From $9.99", "link": "/store?category=accessories"},
     {"name": "Tech & Gear", "price": "From $29.99", "link": "/store?category=tech"},
     {"name": "Limited Edition", "price": "Exclusive drops", "link": "/store?category=limited"}
   ]}
 ]'::jsonb,
 'promotion', 3),

('vip_promo', 'VIP Promo', 'VIP Access Is Live — Plans Starting at $29/month',
 'VIP Access Is Here', 'Join the inner circle of profitable traders', 'crown',
 'Unlock VIP Access', '/VIP', '', '',
 '[
   {"type": "benefits_list", "items": [
     {"title": "Live Trading Signals", "desc": "Real-time entries, exits, and analysis", "color": "#10b981"},
     {"title": "Private Live Streams", "desc": "VIP-only market breakdowns", "color": "#8b5cf6"},
     {"title": "Private Telegram Group", "desc": "Direct access to the team", "color": "#3b82f6"},
     {"title": "Full Course Access", "desc": "Learn the complete trading system", "color": "#1d4ed8"}
   ]},
   {"type": "pricing_tiers", "items": [
     {"name": "MONTHLY", "price": "$49", "interval": "/month"},
     {"name": "BEST VALUE", "price": "$29", "interval": "/month yearly", "featured": true},
     {"name": "LIFETIME", "price": "$499", "interval": "one-time"}
   ]},
   {"type": "testimonial", "quote": "Joined VIP two months ago. Made back my subscription cost in the first week.", "author": "VIP Member since 2024"}
 ]'::jsonb,
 'vip', 4),

('flash_sale', 'Flash Sale', 'FLASH SALE — 24 Hours Only',
 '24-Hour Flash Sale', 'Exclusive deals that won''t last. Don''t miss out.', 'tag',
 'Shop Flash Sale', '/store?sale=flash', '', '',
 '[
   {"type": "countdown", "text": "Sale ends in 24 hours!"},
   {"type": "paragraph", "text": "Use code FLASH20 for an extra 20% off everything."},
   {"type": "promo_code", "code": "FLASH20", "desc": "Limited time only"}
 ]'::jsonb,
 'promotion', 5),

('affiliate_promo', 'Affiliate Promo', 'Earn Money with Bullmoney — 20% Commission',
 'Start Earning Today', 'Join our affiliate program and earn 20% on every sale you refer.', 'dollar',
 'Join Affiliate Program', '/recruit', '', '',
 '[
   {"type": "stats_grid", "items": [
     {"label": "Commission Rate", "value": "20%"},
     {"label": "Cookie Duration", "value": "30 days"},
     {"label": "Payout Threshold", "value": "$50"},
     {"label": "Payment Method", "value": "PayPal/Crypto"}
   ]},
   {"type": "paragraph", "text": "Share your unique referral link and start earning on every purchase your followers make."}
 ]'::jsonb,
 'affiliate', 6),

('weekly_digest', 'Weekly Digest', 'Your Weekly Bullmoney Update',
 'This Week at Bullmoney', 'Here''s what''s new and what you might have missed.', 'chart',
 'Shop Store', '/store', 'Join VIP', '/VIP',
 '[
   {"type": "section", "title": "What''s New This Week", "content": "New products, market analysis, and community updates."},
   {"type": "paragraph", "text": "Stay tuned for more exclusive content and deals coming soon."}
 ]'::jsonb,
 'general', 7),

('new_product', 'New Product', 'New Drop Alert — Check It Out',
 'New Product Drop', 'Fresh gear just landed in the store.', 'shopping',
 'View Product', '/store', 'Shop All', '/store',
 '[
   {"type": "paragraph", "text": "Be the first to grab this new addition to the Bullmoney collection."}
 ]'::jsonb,
 'promotion', 8)

ON CONFLICT (slug) DO NOTHING;

-- Verify insertion
SELECT slug, name, subject, category FROM email_templates ORDER BY display_order;
