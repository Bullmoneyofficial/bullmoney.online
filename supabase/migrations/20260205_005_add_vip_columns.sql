-- Ensure bullmoney_vip has image_url and plan_options columns (idempotent)
BEGIN;

ALTER TABLE IF EXISTS bullmoney_vip
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS plan_options JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
