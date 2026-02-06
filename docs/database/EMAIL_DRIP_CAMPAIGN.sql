-- ============================================================================
-- EMAIL DRIP CAMPAIGN SYSTEM
-- Sends store reminder emails every 48 hours for 30 days to recruits
-- Uses Resend API (100 free emails/day) - batches to stay under limit
-- ============================================================================

-- Create email_drip_campaigns table to track campaign progress
CREATE TABLE IF NOT EXISTS email_drip_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Recipient info (can be from recruits OR newsletter_subscribers)
    email VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'recruits', -- 'recruits' or 'newsletter'
    recruit_id BIGINT REFERENCES recruits(id) ON DELETE SET NULL,
    newsletter_subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE SET NULL,
    -- Campaign tracking
    campaign_name VARCHAR(100) DEFAULT 'store_reminder_30day',
    email_sequence_number INTEGER DEFAULT 0, -- 1-15 (every 48h for 30 days)
    total_emails_to_send INTEGER DEFAULT 15,
    -- Status
    subscribed BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_email_sent_at TIMESTAMPTZ,
    next_email_scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    -- Email delivery tracking
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    last_opened_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint - one campaign per email
    UNIQUE(email, campaign_name)
);

-- Create email_drip_history to track individual emails sent
CREATE TABLE IF NOT EXISTS email_drip_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_drip_campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    sequence_number INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100),
    -- Delivery status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, failed
    resend_message_id VARCHAR(100),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_email ON email_drip_campaigns(email);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_next_scheduled ON email_drip_campaigns(next_email_scheduled_at) 
    WHERE subscribed = true AND completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_source ON email_drip_campaigns(source);
CREATE INDEX IF NOT EXISTS idx_drip_history_campaign ON email_drip_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_drip_history_status ON email_drip_history(status);
CREATE INDEX IF NOT EXISTS idx_drip_history_resend_id ON email_drip_history(resend_message_id);

-- Enable RLS
ALTER TABLE email_drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drip_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (drop first to make idempotent)
DROP POLICY IF EXISTS "Service role full access campaigns" ON email_drip_campaigns;
DROP POLICY IF EXISTS "Service role full access history" ON email_drip_history;

CREATE POLICY "Service role full access campaigns" ON email_drip_campaigns
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access history" ON email_drip_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- AUTO-ENROLL NEW RECRUITS INTO DRIP CAMPAIGN
-- Trigger that fires when a new recruit is created
-- ============================================================================

CREATE OR REPLACE FUNCTION enroll_recruit_in_drip_campaign()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enroll if notifications are not explicitly disabled
    IF NEW.notifications_enabled IS NULL OR NEW.notifications_enabled = true THEN
        INSERT INTO email_drip_campaigns (
            email,
            source,
            recruit_id,
            campaign_name,
            next_email_scheduled_at
        ) VALUES (
            NEW.email,
            'recruits',
            NEW.id,
            'store_reminder_30day',
            NOW() + INTERVAL '24 hours' -- First email after 24 hours
        )
        ON CONFLICT (email, campaign_name) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new recruits
DROP TRIGGER IF EXISTS trigger_enroll_recruit_drip ON recruits;
CREATE TRIGGER trigger_enroll_recruit_drip
    AFTER INSERT ON recruits
    FOR EACH ROW
    EXECUTE FUNCTION enroll_recruit_in_drip_campaign();

-- ============================================================================
-- AUTO-ENROLL NEWSLETTER SUBSCRIBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION enroll_newsletter_in_drip_campaign()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscribed = true THEN
        INSERT INTO email_drip_campaigns (
            email,
            source,
            newsletter_subscriber_id,
            campaign_name,
            next_email_scheduled_at
        ) VALUES (
            NEW.email,
            'newsletter',
            NEW.id,
            'store_reminder_30day',
            NOW() + INTERVAL '24 hours'
        )
        ON CONFLICT (email, campaign_name) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for newsletter subscribers
DROP TRIGGER IF EXISTS trigger_enroll_newsletter_drip ON newsletter_subscribers;
CREATE TRIGGER trigger_enroll_newsletter_drip
    AFTER INSERT ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION enroll_newsletter_in_drip_campaign();

-- ============================================================================
-- UNSUBSCRIBE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION unsubscribe_from_drip(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mark drip campaign as unsubscribed
    UPDATE email_drip_campaigns 
    SET subscribed = false, 
        updated_at = NOW(),
        completed_at = NOW()
    WHERE email = LOWER(TRIM(user_email));
    
    -- Also update newsletter_subscribers if exists
    UPDATE newsletter_subscribers
    SET subscribed = false,
        unsubscribed_at = NOW()
    WHERE email = LOWER(TRIM(user_email));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GET PENDING EMAILS TO SEND (for cron job)
-- Returns up to 100 emails per batch to stay under Resend free tier limit
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_drip_emails(batch_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    campaign_id UUID,
    email VARCHAR(255),
    sequence_number INTEGER,
    first_name TEXT,
    source VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id as campaign_id,
        dc.email,
        dc.email_sequence_number + 1 as sequence_number,
        COALESCE(r.full_name, SPLIT_PART(dc.email, '@', 1)) as first_name,
        dc.source
    FROM email_drip_campaigns dc
    LEFT JOIN recruits r ON dc.recruit_id = r.id
    WHERE dc.subscribed = true
      AND dc.completed_at IS NULL
      AND dc.next_email_scheduled_at <= NOW()
      AND dc.email_sequence_number < dc.total_emails_to_send
    ORDER BY dc.next_email_scheduled_at ASC
    LIMIT batch_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MARK EMAIL AS SENT (called after successful send)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_drip_email_sent(
    p_campaign_id UUID,
    p_resend_message_id VARCHAR(100),
    p_subject VARCHAR(255),
    p_template_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_new_sequence INTEGER;
    v_total_emails INTEGER;
BEGIN
    -- Get current sequence and total
    SELECT email_sequence_number + 1, total_emails_to_send
    INTO v_new_sequence, v_total_emails
    FROM email_drip_campaigns WHERE id = p_campaign_id;
    
    -- Update campaign
    UPDATE email_drip_campaigns
    SET 
        email_sequence_number = v_new_sequence,
        total_sent = total_sent + 1,
        last_email_sent_at = NOW(),
        next_email_scheduled_at = CASE 
            WHEN v_new_sequence >= v_total_emails THEN NULL
            ELSE NOW() + INTERVAL '48 hours'
        END,
        completed_at = CASE 
            WHEN v_new_sequence >= v_total_emails THEN NOW()
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    -- Record in history
    INSERT INTO email_drip_history (
        campaign_id,
        email,
        sequence_number,
        subject,
        template_name,
        status,
        resend_message_id,
        sent_at
    )
    SELECT 
        p_campaign_id,
        email,
        v_new_sequence,
        p_subject,
        p_template_name,
        'sent',
        p_resend_message_id,
        NOW()
    FROM email_drip_campaigns WHERE id = p_campaign_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKFILL EXISTING RECRUITS INTO DRIP CAMPAIGN
-- Runs automatically when migration is applied
-- ============================================================================

INSERT INTO email_drip_campaigns (email, source, recruit_id, campaign_name, next_email_scheduled_at)
SELECT 
    email,
    'recruits',
    id,
    'store_reminder_30day',
    NOW() + (RANDOM() * INTERVAL '48 hours') -- Stagger to avoid hitting daily email limits
FROM recruits
WHERE email IS NOT NULL
  AND email != ''
ON CONFLICT (email, campaign_name) DO NOTHING;

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Check pending emails to send
-- SELECT * FROM get_pending_drip_emails(100);

-- View campaign stats
-- SELECT 
--     source,
--     COUNT(*) as total_campaigns,
--     COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed,
--     COUNT(CASE WHEN subscribed = false THEN 1 END) as unsubscribed,
--     SUM(total_sent) as emails_sent,
--     SUM(total_opened) as emails_opened
-- FROM email_drip_campaigns
-- GROUP BY source;

-- View email history
-- SELECT * FROM email_drip_history ORDER BY sent_at DESC LIMIT 50;
