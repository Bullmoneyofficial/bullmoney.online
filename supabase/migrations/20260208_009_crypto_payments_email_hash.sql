-- ============================================================================
-- CRYPTO PAYMENTS EMAIL HASH
-- Add guest_email_hash for secure recruit/payment matching
-- ============================================================================

ALTER TABLE crypto_payments
  ADD COLUMN IF NOT EXISTS guest_email_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_crypto_payments_guest_email_hash ON crypto_payments(guest_email_hash);
