-- =============================================
-- AFFILIATE PROGRAM ENHANCED TRACKING TABLES
-- Run this in Supabase SQL Editor
-- Adds comprehensive affiliate tracking, tiers, and earnings
-- =============================================

-- =============================================
-- PART 1: ADD NEW COLUMNS TO RECRUITS TABLE
-- For affiliate tracking and tier system
-- =============================================

-- Add affiliate tracking columns
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS affiliate_tier TEXT DEFAULT 'Starter';
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS affiliate_tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add earnings tracking columns
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS paid_earnings DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS last_payout_amount DECIMAL(10,2);

-- Add trader tracking columns
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS total_referred_traders INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS active_traders INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS total_lots_traded DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS monthly_lots_traded DECIMAL(12,2) DEFAULT 0.00;

-- Add social media activity tracking
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS social_posts_this_week INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS social_posts_this_month INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS social_bonus_multiplier DECIMAL(3,2) DEFAULT 1.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS last_social_post_date TIMESTAMP WITH TIME ZONE;

-- Add broker preference
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS preferred_broker TEXT DEFAULT 'Vantage';

-- Add performance metrics
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS avg_trader_volume DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS best_month_earnings DECIMAL(10,2) DEFAULT 0.00;

-- Add contact/payment info
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'bank', 'paypal', 'crypto', 'wise'
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS payment_details JSONB;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false;

-- Add affiliate links
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS custom_referral_link TEXT;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS link_clicks INTEGER DEFAULT 0;
ALTER TABLE public.recruits ADD COLUMN IF NOT EXISTS link_last_clicked TIMESTAMP WITH TIME ZONE;


-- =============================================
-- PART 2: AFFILIATE TIERS TABLE
-- Stores tier definitions and requirements
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    min_traders INTEGER NOT NULL,
    max_traders INTEGER, -- NULL means unlimited
    commission_percent DECIMAL(5,2) NOT NULL,
    xm_rate_per_lot DECIMAL(10,2) NOT NULL,
    vantage_rate_per_lot DECIMAL(10,2) NOT NULL,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.00,
    perks TEXT[], -- Array of perk descriptions
    color TEXT DEFAULT '#ffffff',
    icon TEXT DEFAULT 'target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO public.affiliate_tiers (name, min_traders, max_traders, commission_percent, xm_rate_per_lot, vantage_rate_per_lot, bonus_multiplier, color, icon, perks) VALUES 
('Starter', 1, 4, 5.00, 11.00, 5.50, 1.00, '#ffffff', 'target', ARRAY['Basic dashboard access', 'Monthly payouts', 'Email support']),
('Bronze', 5, 14, 10.00, 11.00, 5.50, 1.10, '#cd7f32', 'award', ARRAY['Priority email support', 'Weekly performance reports', 'Custom referral link']),
('Silver', 15, 29, 15.00, 11.00, 5.50, 1.20, '#c0c0c0', 'star', ARRAY['Telegram support', 'Marketing materials', 'Bi-weekly payouts']),
('Gold', 30, 49, 20.00, 11.00, 5.50, 1.35, '#ffd700', 'trophy', ARRAY['1-on-1 support calls', 'Co-branded landing pages', 'Weekly payouts']),
('Elite', 50, NULL, 25.00, 11.00, 5.50, 1.50, '#ffffff', 'sparkles', ARRAY['Dedicated account manager', 'Custom commission rates', 'Instant payouts', 'Exclusive bonuses'])
ON CONFLICT (name) DO UPDATE SET 
    min_traders = EXCLUDED.min_traders,
    max_traders = EXCLUDED.max_traders,
    commission_percent = EXCLUDED.commission_percent,
    xm_rate_per_lot = EXCLUDED.xm_rate_per_lot,
    vantage_rate_per_lot = EXCLUDED.vantage_rate_per_lot,
    bonus_multiplier = EXCLUDED.bonus_multiplier,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    perks = EXCLUDED.perks,
    updated_at = NOW();


-- =============================================
-- PART 3: AFFILIATE EARNINGS TABLE
-- Tracks all earnings transactions
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
    trader_id BIGINT REFERENCES public.recruits(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type TEXT NOT NULL, -- 'commission', 'bonus', 'payout', 'adjustment'
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Commission details
    lots_traded DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    broker TEXT, -- 'XM', 'Vantage'
    tier_at_time TEXT,
    
    -- Bonus details
    bonus_type TEXT, -- 'social_media', 'volume', 'milestone', 'referral'
    bonus_multiplier DECIMAL(3,2),
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment details (for payouts)
    payment_method TEXT,
    payment_reference TEXT,
    payment_notes TEXT,
    
    -- Period tracking
    earning_period_start DATE,
    earning_period_end DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for affiliate_earnings
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate ON public.affiliate_earnings(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_trader ON public.affiliate_earnings(trader_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_status ON public.affiliate_earnings(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_type ON public.affiliate_earnings(transaction_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_period ON public.affiliate_earnings(earning_period_start, earning_period_end);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_created ON public.affiliate_earnings(created_at DESC);


-- =============================================
-- PART 4: AFFILIATE REFERRED TRADERS TABLE
-- Tracks relationship between affiliates and their referred traders
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
    trader_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
    
    -- Referral details
    referral_code_used TEXT,
    broker TEXT, -- 'XM', 'Vantage'
    mt5_account TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'active', 'inactive', 'churned'
    verified_at TIMESTAMP WITH TIME ZONE,
    first_trade_date TIMESTAMP WITH TIME ZONE,
    last_trade_date TIMESTAMP WITH TIME ZONE,
    
    -- Activity metrics
    total_lots_traded DECIMAL(12,2) DEFAULT 0.00,
    total_deposits DECIMAL(12,2) DEFAULT 0.00,
    total_commission_generated DECIMAL(10,2) DEFAULT 0.00,
    current_month_lots DECIMAL(10,2) DEFAULT 0.00,
    
    -- Engagement
    is_active BOOLEAN DEFAULT false, -- traded in last 30 days
    activity_score INTEGER DEFAULT 0, -- 0-100
    
    -- Timestamps
    referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique affiliate-trader pair
    UNIQUE(affiliate_id, trader_id)
);

-- Indexes for affiliate_referrals
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_trader ON public.affiliate_referrals(trader_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_active ON public.affiliate_referrals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_broker ON public.affiliate_referrals(broker);


-- =============================================
-- PART 5: AFFILIATE SOCIAL POSTS TABLE
-- Tracks social media posts for bonus eligibility
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
    
    -- Post details
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'youtube', 'facebook', 'telegram'
    post_url TEXT,
    post_screenshot_url TEXT,
    post_type TEXT, -- 'story', 'post', 'reel', 'video', 'thread'
    
    -- Verification
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by TEXT,
    rejection_reason TEXT,
    
    -- Engagement metrics (optional, for tracking)
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    
    -- Timestamps
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for affiliate_social_posts
CREATE INDEX IF NOT EXISTS idx_affiliate_social_posts_affiliate ON public.affiliate_social_posts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_social_posts_status ON public.affiliate_social_posts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_social_posts_platform ON public.affiliate_social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_affiliate_social_posts_posted ON public.affiliate_social_posts(posted_at DESC);


-- =============================================
-- PART 6: AFFILIATE PAYOUTS TABLE
-- Tracks all payout requests and history
-- =============================================

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id BIGINT REFERENCES public.recruits(id) ON DELETE CASCADE,
    
    -- Payout details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL, -- 'bank', 'paypal', 'crypto', 'wise'
    
    -- Payment info (encrypted in production)
    payment_details JSONB, -- Bank account, PayPal email, wallet address, etc.
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Admin handling
    processed_by TEXT,
    admin_notes TEXT,
    
    -- Transaction reference
    transaction_id TEXT,
    transaction_proof_url TEXT,
    
    -- Error handling
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for affiliate_payouts
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_period ON public.affiliate_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_requested ON public.affiliate_payouts(requested_at DESC);


-- =============================================
-- PART 7: FUNCTIONS & TRIGGERS
-- =============================================

-- Function to calculate affiliate tier based on active traders
CREATE OR REPLACE FUNCTION calculate_affiliate_tier(trader_count INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF trader_count >= 50 THEN
        RETURN 'Elite';
    ELSIF trader_count >= 30 THEN
        RETURN 'Gold';
    ELSIF trader_count >= 15 THEN
        RETURN 'Silver';
    ELSIF trader_count >= 5 THEN
        RETURN 'Bronze';
    ELSE
        RETURN 'Starter';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate social media bonus multiplier
CREATE OR REPLACE FUNCTION calculate_social_bonus_multiplier(posts_this_month INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF posts_this_month >= 8 THEN
        RETURN 2.00; -- 2x multiplier for 8+ posts/month (2/week)
    ELSIF posts_this_month >= 6 THEN
        RETURN 1.50; -- 1.5x for 6-7 posts/month
    ELSIF posts_this_month >= 4 THEN
        RETURN 1.25; -- 1.25x for 4-5 posts/month
    ELSE
        RETURN 1.00; -- No bonus
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update affiliate stats
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
DECLARE
    new_tier TEXT;
    active_count INTEGER;
BEGIN
    -- Count active referrals
    SELECT COUNT(*) INTO active_count
    FROM public.affiliate_referrals
    WHERE affiliate_id = NEW.affiliate_id AND is_active = true;
    
    -- Calculate new tier
    new_tier := calculate_affiliate_tier(active_count);
    
    -- Update affiliate's stats
    UPDATE public.recruits
    SET 
        active_traders = active_count,
        affiliate_tier = new_tier,
        affiliate_tier_updated_at = CASE WHEN affiliate_tier != new_tier THEN NOW() ELSE affiliate_tier_updated_at END,
        updated_at = NOW()
    WHERE id = NEW.affiliate_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affiliate stats when referrals change
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.affiliate_referrals;
CREATE TRIGGER trigger_update_affiliate_stats
    AFTER INSERT OR UPDATE ON public.affiliate_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_stats();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_affiliate_earnings_updated_at ON public.affiliate_earnings;
CREATE TRIGGER update_affiliate_earnings_updated_at
    BEFORE UPDATE ON public.affiliate_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_referrals_updated_at ON public.affiliate_referrals;
CREATE TRIGGER update_affiliate_referrals_updated_at
    BEFORE UPDATE ON public.affiliate_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_social_posts_updated_at ON public.affiliate_social_posts;
CREATE TRIGGER update_affiliate_social_posts_updated_at
    BEFORE UPDATE ON public.affiliate_social_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_payouts_updated_at ON public.affiliate_payouts;
CREATE TRIGGER update_affiliate_payouts_updated_at
    BEFORE UPDATE ON public.affiliate_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- PART 8: VIEWS
-- =============================================

-- View: Affiliate Dashboard Summary
CREATE OR REPLACE VIEW public.affiliate_dashboard_summary AS
SELECT 
    r.id AS affiliate_id,
    r.email,
    r.full_name,
    r.affiliate_code,
    r.affiliate_tier,
    r.total_earnings,
    r.pending_earnings,
    r.paid_earnings,
    r.active_traders,
    r.total_referred_traders,
    r.social_bonus_multiplier,
    r.social_posts_this_month,
    r.preferred_broker,
    at.commission_percent,
    at.color AS tier_color,
    at.perks AS tier_perks,
    (SELECT COUNT(*) FROM affiliate_referrals ar WHERE ar.affiliate_id = r.id AND ar.status = 'pending') AS pending_referrals,
    (SELECT COALESCE(SUM(ae.amount), 0) FROM affiliate_earnings ae WHERE ae.affiliate_id = r.id AND ae.status = 'pending') AS pending_commission,
    (SELECT MAX(ap.completed_at) FROM affiliate_payouts ap WHERE ap.affiliate_id = r.id AND ap.status = 'completed') AS last_payout_date
FROM public.recruits r
LEFT JOIN public.affiliate_tiers at ON at.name = r.affiliate_tier
WHERE r.affiliate_code IS NOT NULL;

-- View: Monthly Earnings Report
CREATE OR REPLACE VIEW public.affiliate_monthly_earnings AS
SELECT 
    ae.affiliate_id,
    r.email,
    r.affiliate_tier,
    DATE_TRUNC('month', ae.created_at) AS month,
    ae.broker,
    SUM(CASE WHEN ae.transaction_type = 'commission' THEN ae.amount ELSE 0 END) AS commission_total,
    SUM(CASE WHEN ae.transaction_type = 'bonus' THEN ae.amount ELSE 0 END) AS bonus_total,
    SUM(ae.amount) AS total_earnings,
    SUM(ae.lots_traded) AS total_lots,
    COUNT(DISTINCT ae.trader_id) AS active_traders
FROM public.affiliate_earnings ae
JOIN public.recruits r ON r.id = ae.affiliate_id
WHERE ae.transaction_type IN ('commission', 'bonus')
GROUP BY ae.affiliate_id, r.email, r.affiliate_tier, DATE_TRUNC('month', ae.created_at), ae.broker;


-- =============================================
-- PART 9: ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate_tiers (public read)
CREATE POLICY "Anyone can view tiers" ON public.affiliate_tiers FOR SELECT USING (true);

-- Policies for affiliate_earnings (users see own, admins see all)
CREATE POLICY "Users can view own earnings" ON public.affiliate_earnings 
    FOR SELECT USING (affiliate_id IN (SELECT id FROM recruits WHERE email = auth.email()));

CREATE POLICY "Service role full access to earnings" ON public.affiliate_earnings 
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for affiliate_referrals
CREATE POLICY "Users can view own referrals" ON public.affiliate_referrals 
    FOR SELECT USING (affiliate_id IN (SELECT id FROM recruits WHERE email = auth.email()));

CREATE POLICY "Service role full access to referrals" ON public.affiliate_referrals 
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for affiliate_social_posts
CREATE POLICY "Users can view own posts" ON public.affiliate_social_posts 
    FOR SELECT USING (affiliate_id IN (SELECT id FROM recruits WHERE email = auth.email()));

CREATE POLICY "Users can insert own posts" ON public.affiliate_social_posts 
    FOR INSERT WITH CHECK (affiliate_id IN (SELECT id FROM recruits WHERE email = auth.email()));

CREATE POLICY "Service role full access to social posts" ON public.affiliate_social_posts 
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for affiliate_payouts
CREATE POLICY "Users can view own payouts" ON public.affiliate_payouts 
    FOR SELECT USING (affiliate_id IN (SELECT id FROM recruits WHERE email = auth.email()));

CREATE POLICY "Service role full access to payouts" ON public.affiliate_payouts 
    FOR ALL USING (auth.role() = 'service_role');


-- =============================================
-- PART 10: GRANTS
-- =============================================

GRANT SELECT ON public.affiliate_tiers TO anon;
GRANT SELECT ON public.affiliate_tiers TO authenticated;
GRANT ALL ON public.affiliate_tiers TO service_role;

GRANT SELECT ON public.affiliate_earnings TO authenticated;
GRANT ALL ON public.affiliate_earnings TO service_role;

GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT ALL ON public.affiliate_referrals TO service_role;

GRANT SELECT, INSERT ON public.affiliate_social_posts TO authenticated;
GRANT ALL ON public.affiliate_social_posts TO service_role;

GRANT SELECT ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

GRANT SELECT ON public.affiliate_dashboard_summary TO authenticated;
GRANT SELECT ON public.affiliate_dashboard_summary TO service_role;

GRANT SELECT ON public.affiliate_monthly_earnings TO authenticated;
GRANT SELECT ON public.affiliate_monthly_earnings TO service_role;


-- =============================================
-- DONE! Run this SQL in Supabase SQL Editor
-- =============================================
-- 
-- SUMMARY OF CHANGES:
-- 
-- 1. Enhanced recruits table with:
--    - affiliate_tier (Starter/Bronze/Silver/Gold/Elite)
--    - Earnings tracking (total, pending, paid)
--    - Trader tracking (total, active, lots)
--    - Social media activity tracking
--    - Performance metrics
--    - Payment info
-- 
-- 2. New Tables:
--    - affiliate_tiers: Tier definitions (5%, 10%, 15%, 20%, 25%)
--    - affiliate_earnings: All commission & bonus transactions
--    - affiliate_referrals: Affiliate-trader relationships
--    - affiliate_social_posts: Social media post tracking for bonuses
--    - affiliate_payouts: Payout requests & history
-- 
-- 3. Functions:
--    - calculate_affiliate_tier(): Auto tier based on active traders
--    - calculate_social_bonus_multiplier(): 1x-2x based on posts
--    - update_affiliate_stats(): Trigger to update stats
-- 
-- 4. Views:
--    - affiliate_dashboard_summary: Quick stats for dashboard
--    - affiliate_monthly_earnings: Monthly earnings breakdown
-- 
-- COMMISSION CALCULATION:
-- - XM: $11/lot × tier% (e.g., 10% tier = $1.10/lot)
-- - Vantage: $5.50/lot × tier% (e.g., 10% tier = $0.55/lot)
-- - Bonus: Applied when >20 lots/month + social posting
-- - Social multiplier: 2x for 8+ posts/month
-- 
-- PAYMENT SCHEDULE:
-- - Monthly payouts, first week (latest Friday)
-- - Processing: 1-15min (most), 1-7 days (some), 30 days (new accounts)
-- 
