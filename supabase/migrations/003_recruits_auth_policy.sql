-- ============================================
-- RECRUITS TABLE AUTH POLICY
-- Run this in Supabase SQL Editor to enable login from the app
-- ============================================

-- Enable RLS on recruits table (if not already)
ALTER TABLE recruits ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT access for authentication
-- This allows the app to query email/password for login
DROP POLICY IF EXISTS "Allow public read for auth" ON recruits;
CREATE POLICY "Allow public read for auth" 
  ON recruits FOR SELECT 
  USING (true);

-- Verify the policy is created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'recruits';

-- Test query (should return data if policy works)
SELECT id, email, status FROM recruits LIMIT 3;
