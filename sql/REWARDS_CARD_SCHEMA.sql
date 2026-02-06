-- =============================================
-- REWARDS CARD SYSTEM — Punch Card Loyalty
-- Run in Supabase SQL Editor
-- Adds rewards tracking to recruits table
-- =============================================

-- =============================================
-- PART 1: ADD REWARDS COLUMNS TO RECRUITS
-- =============================================

-- Rewards punch card columns
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_punches INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_cards_completed INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_last_punch_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_tier TEXT DEFAULT 'bronze'; -- bronze, silver, gold, platinum
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_lifetime_points INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_available_points INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS rewards_free_item_claimed BOOLEAN DEFAULT false;

-- =============================================
-- PART 2: REWARDS HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.rewards_history (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recruit_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'punch', 'redeem', 'card_complete', 'bonus', 'tier_upgrade'
  punches_added INTEGER DEFAULT 0,
  punches_before INTEGER,
  punches_after INTEGER,
  points_changed INTEGER DEFAULT 0,
  order_id TEXT,
  order_total DECIMAL(10,2),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_history_email ON public.rewards_history(email);
CREATE INDEX IF NOT EXISTS idx_rewards_history_recruit_id ON public.rewards_history(recruit_id);
CREATE INDEX IF NOT EXISTS idx_rewards_history_created_at ON public.rewards_history(created_at DESC);

-- =============================================
-- PART 3: DUMMY DATA FOR TESTING
-- =============================================

-- Update mrbullmoney@gmail.com with test rewards data
UPDATE public.recruits SET 
  rewards_punches = 7,
  rewards_total_spent = 175.00,
  rewards_cards_completed = 0,
  rewards_last_punch_at = NOW() - INTERVAL '2 days',
  rewards_tier = 'silver',
  rewards_lifetime_points = 350,
  rewards_available_points = 175,
  rewards_free_item_claimed = false
WHERE LOWER(email) = 'mrbullmoney@gmail.com';

-- Insert some history for testing
INSERT INTO public.rewards_history (email, recruit_id, action, punches_added, punches_before, punches_after, order_total, notes)
SELECT 
  'mrbullmoney@gmail.com',
  id,
  'punch',
  1,
  6,
  7,
  25.00,
  'Purchase reward punch'
FROM public.recruits WHERE LOWER(email) = 'mrbullmoney@gmail.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- PART 4: FUNCTION TO SYNC REWARDS FROM ORDERS
-- =============================================

-- Function to calculate punches from order amount ($25 = 1 punch)
CREATE OR REPLACE FUNCTION calculate_punches(order_amount DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(order_amount / 25.00)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-sync rewards for a user based on their store orders
CREATE OR REPLACE FUNCTION sync_recruit_rewards(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_recruit_id BIGINT;
  v_total_spent DECIMAL(10,2);
  v_total_punches INTEGER;
  v_current_punches INTEGER;
  v_cards_completed INTEGER;
  v_remaining_punches INTEGER;
  v_tier TEXT;
BEGIN
  -- Get recruit ID
  SELECT id INTO v_recruit_id FROM public.recruits WHERE LOWER(email) = LOWER(p_email);
  
  IF v_recruit_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Recruit not found');
  END IF;
  
  -- Calculate total spent from store_orders
  SELECT COALESCE(SUM(total), 0) INTO v_total_spent
  FROM public.store_orders
  WHERE LOWER(email) = LOWER(p_email)
    AND payment_status = 'paid';
  
  -- Calculate total punches earned (1 punch per $25)
  v_total_punches := FLOOR(v_total_spent / 25.00)::INTEGER;
  
  -- Calculate completed cards (20 punches = 1 card)
  v_cards_completed := FLOOR(v_total_punches / 20)::INTEGER;
  
  -- Remaining punches on current card
  v_remaining_punches := v_total_punches % 20;
  
  -- Determine tier based on cards completed
  v_tier := CASE 
    WHEN v_cards_completed >= 10 THEN 'platinum'
    WHEN v_cards_completed >= 5 THEN 'gold'
    WHEN v_cards_completed >= 2 THEN 'silver'
    ELSE 'bronze'
  END;
  
  -- Update recruit record
  UPDATE public.recruits SET
    rewards_punches = v_remaining_punches,
    rewards_total_spent = v_total_spent,
    rewards_cards_completed = v_cards_completed,
    rewards_lifetime_points = v_total_punches * 10, -- 10 points per punch
    rewards_available_points = v_remaining_punches * 10,
    rewards_tier = v_tier,
    rewards_last_punch_at = NOW(),
    store_total_spent = v_total_spent -- Also update store field
  WHERE id = v_recruit_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'email', p_email,
    'total_spent', v_total_spent,
    'punches', v_remaining_punches,
    'cards_completed', v_cards_completed,
    'tier', v_tier,
    'lifetime_points', v_total_punches * 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PART 5: RLS POLICIES
-- =============================================

ALTER TABLE public.rewards_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own history
CREATE POLICY IF NOT EXISTS "Users can view own rewards history"
  ON public.rewards_history FOR SELECT
  USING (true); -- Will filter by email in API

-- Service role can insert/update
CREATE POLICY IF NOT EXISTS "Service can manage rewards history"
  ON public.rewards_history FOR ALL
  USING (true);

-- =============================================
-- VERIFICATION
-- =============================================

-- Check columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'recruits' 
  AND column_name LIKE 'rewards_%';

-- Check test user data
SELECT 
  email,
  rewards_punches,
  rewards_total_spent,
  rewards_cards_completed,
  rewards_tier,
  rewards_lifetime_points
FROM public.recruits 
WHERE LOWER(email) = 'mrbullmoney@gmail.com';
