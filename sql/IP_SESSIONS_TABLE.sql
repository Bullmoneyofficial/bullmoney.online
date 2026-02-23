-- IP Sessions Table for Server-Side Login Persistence
-- This table stores login sessions by DEVICE FINGERPRINT for automatic re-authentication
-- Device fingerprint is based on browser/screen/GPU characteristics - unique per device
-- Works in incognito, across different networks, survives cache clears

-- ========================================================================
-- MIGRATION: If you already created the old version, run this first:
-- ========================================================================
-- ALTER TABLE ip_sessions ADD COLUMN IF NOT EXISTS device_id TEXT;
-- ALTER TABLE ip_sessions ALTER COLUMN ip_address DROP NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_ip_sessions_device_id ON ip_sessions(device_id);
-- DROP INDEX IF EXISTS idx_ip_sessions_ip_active;
-- ========================================================================

CREATE TABLE IF NOT EXISTS ip_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,  -- Stored for reference/debugging, not used for lookups
  device_id TEXT NOT NULL,  -- Primary identifier - browser fingerprint
  recruit_id BIGINT NOT NULL REFERENCES recruits(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast device lookups (primary lookup method)
CREATE INDEX IF NOT EXISTS idx_ip_sessions_device_id ON ip_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_ip_sessions_recruit_id ON ip_sessions(recruit_id);
CREATE INDEX IF NOT EXISTS idx_ip_sessions_active ON ip_sessions(is_active) WHERE is_active = true;

-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_ip_sessions_device_active 
  ON ip_sessions(device_id, is_active, created_at DESC) 
  WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE ip_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for API routes)
CREATE POLICY "Service role full access" ON ip_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: Users access their sessions via API routes using service_role
-- No direct user policy needed since recruits.id is BIGINT (not Supabase auth UUID)

-- Function to clean up expired sessions (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_expired_ip_sessions()
RETURNS void AS $$
BEGIN
  UPDATE ip_sessions 
  SET is_active = false 
  WHERE is_active = true 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a cron job to cleanup expired sessions daily
-- (Requires pg_cron extension - skip if not available)
-- SELECT cron.schedule('cleanup-ip-sessions', '0 3 * * *', 'SELECT cleanup_expired_ip_sessions()');

COMMENT ON TABLE ip_sessions IS 'Stores login sessions by device fingerprint for automatic re-authentication. Sessions expire after 90 days.';
COMMENT ON COLUMN ip_sessions.ip_address IS 'Client IP address - stored for reference, not used for session lookup';
COMMENT ON COLUMN ip_sessions.device_id IS 'Browser fingerprint hash - PRIMARY identifier for session matching';
COMMENT ON COLUMN ip_sessions.recruit_id IS 'Reference to the logged-in user';
COMMENT ON COLUMN ip_sessions.is_active IS 'Whether this session is still valid';
COMMENT ON COLUMN ip_sessions.last_used IS 'Last time this session was used for auto-login';
