-- Enable RLS on bullmoney_vip (idempotent)
ALTER TABLE bullmoney_vip ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read VIP tiers
DROP POLICY IF EXISTS "Allow public read access on bullmoney_vip" ON bullmoney_vip;
CREATE POLICY "Allow public read access on bullmoney_vip"
  ON bullmoney_vip
  FOR SELECT
  USING (true);
