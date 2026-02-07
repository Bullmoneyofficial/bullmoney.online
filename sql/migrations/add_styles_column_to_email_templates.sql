-- ============================================================================
-- ADD STYLES COLUMN TO EMAIL_TEMPLATES TABLE
-- Migration to add full style customization support
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add styles column to email_templates
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

-- Add comment to document the column
COMMENT ON COLUMN public.email_templates.styles IS 'Full style customization for email templates. Includes color schemes, typography, spacing, borders, and layout settings for both dark and light modes.';

-- Create index for better query performance on styles
CREATE INDEX IF NOT EXISTS idx_email_templates_styles 
ON public.email_templates USING gin(styles);

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
  AND column_name = 'styles';
