-- ============================================================================
-- EMAIL BROADCAST LOG TABLE
-- Tracks promotional email campaigns sent via /api/email/broadcast
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_broadcast_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template VARCHAR(100) NOT NULL,
    audience VARCHAR(50) NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    params JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_broadcast_log_sent_at ON email_broadcast_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_log_template ON email_broadcast_log(template);

-- Enable RLS
ALTER TABLE email_broadcast_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access broadcast_log" ON email_broadcast_log;
CREATE POLICY "Service role full access broadcast_log" ON email_broadcast_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
