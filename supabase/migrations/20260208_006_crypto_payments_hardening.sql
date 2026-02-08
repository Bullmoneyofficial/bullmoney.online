-- ============================================================================
-- CRYPTO PAYMENTS HARDENING
-- Add tx hash lookup column + tighten refund RLS
-- ============================================================================

ALTER TABLE crypto_payments
  ADD COLUMN IF NOT EXISTS tx_hash_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_hash_hash
  ON crypto_payments(tx_hash_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crypto_payments_tx_hash_hash
  ON crypto_payments(tx_hash_hash)
  WHERE tx_hash_hash IS NOT NULL;

ALTER TABLE crypto_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crypto_refunds_admin_all ON crypto_refunds;

CREATE POLICY crypto_refunds_admin_service_role ON crypto_refunds
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
