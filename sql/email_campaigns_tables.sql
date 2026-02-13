-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- Stores all email campaigns (blast, drip, triggered, recurring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'blast' CHECK (type IN ('blast', 'drip', 'triggered', 'recurring')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')),
  
  -- Template config
  template_slug TEXT,
  template_name TEXT,
  custom_subject TEXT,
  custom_html TEXT,
  
  -- Audience
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'recruits', 'vip', 'newsletter', 'custom')),
  audience_filter JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  recurring_cron TEXT,
  recurring_end_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  
  -- Drip config
  drip_sequence JSONB DEFAULT '[]',
  drip_interval_days INTEGER DEFAULT 2,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_by TEXT
);

-- Index for cron queries (find scheduled campaigns due to send)
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled 
  ON email_campaigns (status, scheduled_at) 
  WHERE status = 'scheduled';

-- Index for listing
CREATE INDEX IF NOT EXISTS idx_campaigns_created 
  ON email_campaigns (created_at DESC);

-- ============================================================================
-- CAMPAIGN SENDS TABLE
-- Tracks each send execution for history/analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign 
  ON campaign_sends (campaign_id, sent_at DESC);

-- ============================================================================
-- NOTIFICATION HISTORY TABLE (if not exists)
-- Used by push notification send route
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT DEFAULT 'trades',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RLS POLICIES (permissive for server-side access via service key)
-- ============================================================================

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Allow full access with service role key
CREATE POLICY "Service role full access on campaigns" ON email_campaigns
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on campaign_sends" ON campaign_sends
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on notification_history" ON notification_history
  FOR ALL USING (true) WITH CHECK (true);
