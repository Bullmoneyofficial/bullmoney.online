-- ============================================================================
-- RECRUITS PASSWORD SECURITY
-- Add password_hash and migrate existing plaintext passwords
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE recruits
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Allow password to be nulled after migration (was previously NOT NULL in some envs)
ALTER TABLE recruits
  ALTER COLUMN password DROP NOT NULL;

-- Backfill hash for existing plaintext passwords
UPDATE recruits
SET password_hash = crypt(password, gen_salt('bf'))
WHERE password_hash IS NULL AND password IS NOT NULL AND length(password) > 0;

-- Optional: clear plaintext passwords after hashing
UPDATE recruits
SET password = NULL
WHERE password IS NOT NULL AND length(password) > 0;
