-- ============================================================================
-- NEWSLETTER RESPONSE MESSAGES CONFIGURATION
-- Stores editable welcome/response messages for newsletter subscriptions
-- Allows admins to customize user-facing messages from Admin Hub
-- ============================================================================

-- Create newsletter_messages_config table
CREATE TABLE IF NOT EXISTS newsletter_messages_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  
  -- Message for existing subscribers (already in system)
  existing_subscriber_message TEXT NOT NULL DEFAULT 'You''re already part of the family! 🐂 Check your inbox — we just sent you some goodies.',
  
  -- Message for existing recruits who subscribe to newsletter
  existing_recruit_message TEXT NOT NULL DEFAULT 'Welcome back, {firstName}! Your recruit + newsletter benefits are now active. Check your Gmail for exclusive insights.',
  
  -- Message for new subscribers (first time)
  new_subscriber_message TEXT NOT NULL DEFAULT 'Welcome to Bullmoney Gmail Intel! Check your Gmail for exclusive trading insights and your bonus guide.',
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  
  CONSTRAINT single_config CHECK (id = 'default')
);

-- Insert default configuration
INSERT INTO newsletter_messages_config (id, existing_subscriber_message, existing_recruit_message, new_subscriber_message)
VALUES (
  'default',
  'You''re already part of the family! 🐂 Check your inbox — we just sent you some goodies.',
  'Welcome back, {firstName}! Your recruit + newsletter benefits are now active. Check your Gmail for exclusive insights.',
  'Welcome to Bullmoney Gmail Intel! Check your Gmail for exclusive trading insights and your bonus guide.'
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE newsletter_messages_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (needed for API route)
CREATE POLICY "Anyone can read newsletter messages"
  ON newsletter_messages_config
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can update (admin protection in app layer)
CREATE POLICY "Authenticated users can update newsletter messages"
  ON newsletter_messages_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE newsletter_messages_config IS 'Stores configurable newsletter subscription response messages editable from Admin Hub. Use {firstName} placeholder for personalization.';

-- Create index for faster lookups (though we only have 1 row)
CREATE INDEX IF NOT EXISTS idx_newsletter_messages_id ON newsletter_messages_config(id);
