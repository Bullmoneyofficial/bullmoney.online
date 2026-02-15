-- =============================================
-- AFFILIATE DASHBOARD CONTENT TABLE
-- Stores all editable content for affiliate dashboard
-- Run this in Supabase SQL Editor
-- =============================================

-- Create table for storing all editable affiliate dashboard content
CREATE TABLE IF NOT EXISTS public.affiliate_dashboard_content (
    id TEXT PRIMARY KEY DEFAULT 'main',
    
    -- Tier definitions (override the hardcoded AFFILIATE_TIERS)
    tiers JSONB DEFAULT '[]'::jsonb,
    
    -- Weekly tasks per tier
    weekly_tasks JSONB DEFAULT '{}'::jsonb,
    
    -- Info sections
    how_to_become_affiliate TEXT DEFAULT 'Join BullMoney as an affiliate partner and earn commissions on every trade your referrals make.',
    tips_title TEXT DEFAULT 'Tips for Success',
    tips JSONB DEFAULT '[]'::jsonb,
    
    -- FAQ/Info content
    faq_items JSONB DEFAULT '[]'::jsonb,
    
    -- General text content
    welcome_message TEXT DEFAULT 'Welcome to the BullMoney Affiliate Program',
    welcome_subtitle TEXT DEFAULT 'Earn commissions by referring traders to BullMoney',
    
    -- Dashboard section titles
    overview_title TEXT DEFAULT 'Overview',
    recruits_title TEXT DEFAULT 'Your Recruits',
    earnings_title TEXT DEFAULT 'Earnings',
    analytics_title TEXT DEFAULT 'Analytics',
    
    -- Commission info
    commission_info TEXT DEFAULT 'Earn up to 25% commission on broker rates per lot traded by your referrals.',
    
    -- QR code section
    qr_section_title TEXT DEFAULT 'Your Referral QR Code',
    qr_section_description TEXT DEFAULT 'Clients can scan and auto-fill your code in pagemode.',
    
    -- Referral link section
    referral_link_title TEXT DEFAULT 'Your Referral Link',
    referral_link_description TEXT DEFAULT 'Share this link to earn commissions on every trade your referrals make',
    
    -- Payout info
    payout_info TEXT DEFAULT 'Payouts are processed monthly for balances over $50.',
    
    -- Contact info
    support_email TEXT DEFAULT 'support@bullmoney.online',
    telegram_group_link TEXT DEFAULT 'https://t.me/+aKB315PRM5A2OGI0',
    staff_group_link TEXT DEFAULT 'https://t.me/+aKB315PRM5A2OGI0',
    
    -- Custom CSS/styling overrides
    custom_styles JSONB DEFAULT '{}'::jsonb,
    
    -- Feature flags
    show_qr_code BOOLEAN DEFAULT true,
    show_tasks BOOLEAN DEFAULT true,
    show_tips BOOLEAN DEFAULT true,
    show_leaderboard BOOLEAN DEFAULT false,
    show_telegram_feed BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

-- Insert default content
INSERT INTO public.affiliate_dashboard_content (
    id,
    tiers,
    weekly_tasks,
    tips,
    faq_items
) VALUES (
    'main',
    '[
        {"name": "Starter", "minTraders": 1, "maxTraders": 4, "commissionPercent": 5, "xmRatePerLot": 11, "vantageRatePerLot": 5.5, "bonusMultiplier": 1.0, "color": "#000000", "icon": "target", "perks": ["Basic dashboard access", "Monthly payouts", "Email support"]},
        {"name": "Bronze", "minTraders": 5, "maxTraders": 14, "commissionPercent": 10, "xmRatePerLot": 11, "vantageRatePerLot": 5.5, "bonusMultiplier": 1.1, "color": "#cd7f32", "icon": "award", "perks": ["Priority email support", "Weekly performance reports", "Custom referral link"]},
        {"name": "Silver", "minTraders": 15, "maxTraders": 29, "commissionPercent": 15, "xmRatePerLot": 11, "vantageRatePerLot": 5.5, "bonusMultiplier": 1.2, "color": "#c0c0c0", "icon": "star", "perks": ["Telegram support", "Marketing materials", "Bi-weekly payouts"]},
        {"name": "Gold", "minTraders": 30, "maxTraders": 49, "commissionPercent": 20, "xmRatePerLot": 11, "vantageRatePerLot": 5.5, "bonusMultiplier": 1.35, "color": "#ffd700", "icon": "trophy", "perks": ["1-on-1 support calls", "Co-branded landing pages", "Weekly payouts"]},
        {"name": "Elite", "minTraders": 50, "maxTraders": null, "commissionPercent": 25, "xmRatePerLot": 11, "vantageRatePerLot": 5.5, "bonusMultiplier": 1.5, "color": "#000000", "icon": "sparkles", "perks": ["Dedicated account manager", "Custom commission rates", "Instant payouts", "Exclusive bonuses"]}
    ]'::jsonb,
    '{
        "Starter": [
            {"title": "Repost 1 BullMoney post on your story/feed", "timeMinutes": 10, "whyItMatters": "Keeps your audience warm and reminds them you are active."},
            {"title": "Invite 1 trader friend to register with your link", "timeMinutes": 20, "whyItMatters": "One direct invite each week compounds fast over time."}
        ],
        "Bronze": [
            {"title": "Repost 2 BullMoney posts with your own short caption", "timeMinutes": 25, "whyItMatters": "Personal captions convert better than plain reposts."},
            {"title": "DM 3 warm contacts who trade or want to learn", "timeMinutes": 35, "whyItMatters": "Warm outreach usually gives the highest reply rate."},
            {"title": "Follow up with last week leads", "timeMinutes": 20, "whyItMatters": "Most signups happen after follow-up, not first message."}
        ],
        "Silver": [
            {"title": "Publish 1 simple market insight post + referral CTA", "timeMinutes": 45, "whyItMatters": "Educational posts build trust and inbound leads."},
            {"title": "Host 1 quick Q&A in Telegram/Instagram stories", "timeMinutes": 30, "whyItMatters": "Live interaction shortens the trust cycle."},
            {"title": "Recruit 1 qualified trader and help them connect MT5", "timeMinutes": 60, "whyItMatters": "Activation quality matters more than raw signups."}
        ],
        "Gold": [
            {"title": "Post 2 educational clips (entry basics or risk tips)", "timeMinutes": 90, "whyItMatters": "Video content drives stronger long-term growth."},
            {"title": "Run 1 small networking session with trader friends", "timeMinutes": 60, "whyItMatters": "Group conversations produce multiple referrals at once."},
            {"title": "Review analytics tab and optimize your best channel", "timeMinutes": 30, "whyItMatters": "Data-led tweaks can increase conversions quickly."}
        ],
        "Elite": [
            {"title": "Build a weekly content sequence (3-post funnel)", "timeMinutes": 90, "whyItMatters": "A repeatable funnel scales without constant manual effort."},
            {"title": "Mentor 1 newer affiliate and co-promote together", "timeMinutes": 60, "whyItMatters": "Partnership growth creates new audience overlap."},
            {"title": "Audit top leads and set a next-step action for each", "timeMinutes": 45, "whyItMatters": "Systematic follow-up protects revenue opportunities."}
        ]
    }'::jsonb,
    '[
        {"title": "Be Consistent", "description": "Post regularly and engage with your audience daily."},
        {"title": "Add Value First", "description": "Share helpful trading tips before promoting your link."},
        {"title": "Use Multiple Channels", "description": "Spread your reach across Instagram, Telegram, YouTube, and Discord."},
        {"title": "Follow Up", "description": "Most signups happen after 2-3 follow-up messages."},
        {"title": "Track Your Results", "description": "Use the analytics tab to see what works best for you."}
    ]'::jsonb,
    '[
        {"question": "How do I get paid?", "answer": "Payments are processed monthly via your preferred method (bank transfer, PayPal, crypto, or Wise)."},
        {"question": "When do I get my commissions?", "answer": "Commissions are calculated weekly and paid out monthly once you reach the $50 minimum threshold."},
        {"question": "How are commissions calculated?", "answer": "You earn a percentage of the broker rate per lot traded by your referrals. The percentage depends on your tier level."},
        {"question": "Can I track my referrals?", "answer": "Yes! The dashboard shows all your referrals, their trading activity, and your earnings in real-time."}
    ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Enable RLS
ALTER TABLE public.affiliate_dashboard_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view content" ON public.affiliate_dashboard_content 
    FOR SELECT USING (true);

CREATE POLICY "Admins can update content" ON public.affiliate_dashboard_content 
    FOR UPDATE USING (true);

CREATE POLICY "Admins can insert content" ON public.affiliate_dashboard_content 
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.affiliate_dashboard_content TO anon;
GRANT SELECT ON public.affiliate_dashboard_content TO authenticated;
GRANT ALL ON public.affiliate_dashboard_content TO service_role;

-- Create function to get dashboard content
CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard_content()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT to_jsonb(c.*) INTO result
    FROM public.affiliate_dashboard_content c
    WHERE c.id = 'main';
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard_content() TO anon;
GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard_content() TO authenticated;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_affiliate_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_dashboard_content_updated_at
    BEFORE UPDATE ON public.affiliate_dashboard_content
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_content_timestamp();
