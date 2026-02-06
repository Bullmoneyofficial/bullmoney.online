-- ============================================================================
-- EMAIL TEMPLATES SCHEDULING & STYLES MIGRATION
-- Adds scheduling, automation, and full style customization
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add scheduling columns to email_templates
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS send_type VARCHAR(20) DEFAULT 'manual',
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
    "fontFamily": "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
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
    "width": "1px",
    "style": "solid"
  },
  "buttons": {
    "primaryBg": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "primaryText": "#ffffff",
    "primaryRadius": "12px",
    "primaryPadding": "18px 48px",
    "secondaryBg": "transparent",
    "secondaryBorder": "#3b82f6",
    "secondaryText": "#3b82f6",
    "secondaryRadius": "12px",
    "secondaryPadding": "14px 40px"
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
ADD COLUMN IF NOT EXISTS interval_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS interval_hours INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS send_hour INT DEFAULT 9,
ADD COLUMN IF NOT EXISTS send_minute INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS send_days_of_week JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'all',
ADD COLUMN IF NOT EXISTS drip_sequence_number INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS drip_days_after_signup INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_sent INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_opened INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_clicked INT DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN email_templates.send_type IS 'manual: send manually, recurring: send on schedule, once: send one time, drip: send as part of drip sequence';
COMMENT ON COLUMN email_templates.interval_days IS 'Days between recurring sends: 1=daily, 7=weekly, 30=monthly';
COMMENT ON COLUMN email_templates.interval_hours IS 'Additional hours offset for recurring';
COMMENT ON COLUMN email_templates.send_hour IS 'Hour of day to send (0-23 in 24h format)';
COMMENT ON COLUMN email_templates.send_minute IS 'Minute of hour to send (0-59)';
COMMENT ON COLUMN email_templates.send_days_of_week IS 'JSON array of weekdays: [1,2,3,4,5] = Mon-Fri, [0,6] = Weekends';
COMMENT ON COLUMN email_templates.target_audience IS 'Who to send to: all, recruits, vip, newsletter, custom';
COMMENT ON COLUMN email_templates.drip_sequence_number IS 'Order in drip sequence (1 = first email)';
COMMENT ON COLUMN email_templates.drip_days_after_signup IS 'Days after user signup to send this drip email';

-- Create indexes for scheduling queries
CREATE INDEX IF NOT EXISTS idx_email_templates_send_type ON email_templates(send_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_next_scheduled ON email_templates(next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_target_audience ON email_templates(target_audience);

-- ============================================================================
-- SAMPLE SCHEDULING PRESETS (EXAMPLES - DO NOT RUN)
-- These are commented out examples. Customize and uncomment as needed.
-- ============================================================================

/*
-- EXAMPLE: Daily at 9am to all recruits:
UPDATE email_templates 
SET send_type = 'recurring', 
    interval_days = 1, 
    send_hour = 9, 
    target_audience = 'recruits' 
WHERE slug = 'daily_tip';

-- EXAMPLE: Weekly on Monday at 10am:
UPDATE email_templates 
SET send_type = 'recurring', 
    interval_days = 7, 
    send_hour = 10, 
    send_days_of_week = '[1]' 
WHERE slug = 'weekly_newsletter';

-- EXAMPLE: Monthly on the 1st at 8am:
UPDATE email_templates 
SET send_type = 'recurring', 
    interval_days = 30, 
    send_hour = 8 
WHERE slug = 'monthly_digest';
*/
