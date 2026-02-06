-- ============================================================================
-- NEWSLETTER SUBSCRIBERS TABLE FOR GMAIL ADMIN HUB EMAIL SYSTEM
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create newsletter_subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'store_footer', -- 'store_footer', 'popup', 'checkout', etc.
  first_name TEXT,
  last_name TEXT,
  preferences JSONB DEFAULT '{"marketing": true, "updates": true}'::jsonb,
  tags TEXT[] DEFAULT '{}', -- For segmentation
  
  -- Subscription tracking
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  resubscribed_at TIMESTAMP WITH TIME ZONE,
  
  -- Email engagement tracking
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  last_email_opened_at TIMESTAMP WITH TIME ZONE,
  last_email_clicked_at TIMESTAMP WITH TIME ZONE,
  total_emails_sent INTEGER DEFAULT 0,
  total_emails_opened INTEGER DEFAULT 0,
  total_emails_clicked INTEGER DEFAULT 0,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Admin notes
  admin_notes TEXT,
  is_vip BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if table already exists
DO $$ 
BEGIN
  -- Core newsletter columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'source') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN source TEXT DEFAULT 'store_footer';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'preferences') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN preferences JSONB DEFAULT '{"marketing": true, "updates": true}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'tags') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'resubscribed_at') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN resubscribed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Email tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'last_email_sent_at') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN last_email_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'total_emails_sent') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN total_emails_sent INTEGER DEFAULT 0;
  END IF;
  
  -- Admin specific columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'admin_notes') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN admin_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'is_vip') THEN
    ALTER TABLE public.newsletter_subscribers ADD COLUMN is_vip BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed ON public.newsletter_subscribers(subscribed) WHERE subscribed = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON public.newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON public.newsletter_subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_vip ON public.newsletter_subscribers(is_vip) WHERE is_vip = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_tags ON public.newsletter_subscribers USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public insert newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Service role full access newsletter" ON public.newsletter_subscribers;

-- Allow public to subscribe (insert)
CREATE POLICY "Public insert newsletter subscribers" 
  ON public.newsletter_subscribers FOR INSERT 
  TO anon WITH CHECK (true);

-- Allow public to read their own subscription (for unsubscribe links)
CREATE POLICY "Public read newsletter subscribers" 
  ON public.newsletter_subscribers FOR SELECT 
  TO anon USING (true);

-- Allow service role full access for admin operations
CREATE POLICY "Service role full access newsletter" 
  ON public.newsletter_subscribers FOR ALL 
  TO service_role USING (true) WITH CHECK (true);

-- Admin access for authenticated users (Gmail admin hub)
CREATE POLICY "Admin full access newsletter" 
  ON public.newsletter_subscribers FOR ALL 
  TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS newsletter_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

-- Unsubscribe function for links
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.newsletter_subscribers 
  SET subscribed = false, 
      unsubscribed_at = NOW(),
      updated_at = NOW()
  WHERE email = LOWER(TRIM(user_email)) AND subscribed = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get newsletter stats function for admin
CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS TABLE (
  total_subscribers BIGINT,
  active_subscribers BIGINT,
  unsubscribed BIGINT,
  vip_subscribers BIGINT,
  this_week_signups BIGINT,
  this_month_signups BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
    COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
    COUNT(*) FILTER (WHERE subscribed = true AND is_vip = true) as vip_subscribers,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as this_week_signups,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month_signups
  FROM public.newsletter_subscribers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.newsletter_subscribers TO anon;
GRANT ALL ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

-- Success message
SELECT 'Newsletter subscribers table created successfully with Gmail admin hub integration!' as message;