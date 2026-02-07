-- ============================================================================
-- COMPREHENSIVE EMAIL_TEMPLATES MIGRATION
-- Adds all missing columns for full email template functionality
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add scheduling columns if they don't exist
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS send_type VARCHAR(20) DEFAULT 'manual';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS interval_days INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS interval_hours INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS send_hour INT DEFAULT 9;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS send_minute INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS send_days_of_week JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'all';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS drip_sequence_number INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS drip_days_after_signup INT DEFAULT 0;

-- Add tracking columns
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS total_sent INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS total_opened INT DEFAULT 0;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS total_clicked INT DEFAULT 0;

-- Add hero/content columns if missing
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS hero_icon VARCHAR(50) DEFAULT 'check';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS primary_cta_text VARCHAR(100) DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS primary_cta_url VARCHAR(255) DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100) DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS secondary_cta_url VARCHAR(255) DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50) DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS promo_description TEXT DEFAULT '';

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Add styles column (the critical missing column)
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS styles JSONB DEFAULT '{
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
}'::jsonb;

-- Add comments to document the columns
COMMENT ON COLUMN public.email_templates.send_type IS 'Sending type: manual, recurring, once, drip';
COMMENT ON COLUMN public.email_templates.styles IS 'Full style customization including colors, typography, spacing, and layout';
COMMENT ON COLUMN public.email_templates.content_blocks IS 'Flexible content blocks for email body';
COMMENT ON COLUMN public.email_templates.attachments IS 'Inline images, links, and file attachments';
COMMENT ON COLUMN public.email_templates.send_days_of_week IS 'Days of week to send (for recurring): [0-6] where 0=Sunday';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_styles 
ON public.email_templates USING gin(styles);

CREATE INDEX IF NOT EXISTS idx_email_templates_content_blocks 
ON public.email_templates USING gin(content_blocks);

CREATE INDEX IF NOT EXISTS idx_email_templates_send_type 
ON public.email_templates(send_type);

CREATE INDEX IF NOT EXISTS idx_email_templates_category_active 
ON public.email_templates(category, is_active);

CREATE INDEX IF NOT EXISTS idx_email_templates_next_scheduled 
ON public.email_templates(next_scheduled_at) 
WHERE next_scheduled_at IS NOT NULL;

-- Verify all columns were added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
ORDER BY ordinal_position;
