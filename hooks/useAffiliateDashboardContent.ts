"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase";

// Types for dashboard content
export interface TierTask {
  title: string;
  timeMinutes: number;
  whyItMatters: string;
}

export interface AffiliateTier {
  name: string;
  minTraders: number;
  maxTraders: number | null;
  commissionPercent: number;
  xmRatePerLot: number;
  vantageRatePerLot: number;
  bonusMultiplier: number;
  color: string;
  icon: string;
  perks: string[];
}

export interface TipItem {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface AffiliateDashboardContent {
  id: string;
  tiers: AffiliateTier[];
  weekly_tasks: Record<string, TierTask[]>;
  how_to_become_affiliate: string;
  tips_title: string;
  tips: TipItem[];
  faq_items: FaqItem[];
  welcome_message: string;
  welcome_subtitle: string;
  overview_title: string;
  recruits_title: string;
  earnings_title: string;
  analytics_title: string;
  commission_info: string;
  qr_section_title: string;
  qr_section_description: string;
  referral_link_title: string;
  referral_link_description: string;
  payout_info: string;
  support_email: string;
  telegram_group_link: string;
  staff_group_link: string;
  custom_styles: Record<string, string>;
  show_qr_code: boolean;
  show_tasks: boolean;
  show_tips: boolean;
  show_leaderboard: boolean;
  show_telegram_feed: boolean;
}

// Default content (fallback if database not available)
export const DEFAULT_AFFILIATE_CONTENT: AffiliateDashboardContent = {
  id: "main",
  tiers: [
    { name: "Starter", minTraders: 1, maxTraders: 4, commissionPercent: 5, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.0, color: "#000000", icon: "target", perks: ["Basic dashboard access", "Monthly payouts", "Email support"] },
    { name: "Bronze", minTraders: 5, maxTraders: 14, commissionPercent: 10, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.1, color: "#cd7f32", icon: "award", perks: ["Priority email support", "Weekly performance reports", "Custom referral link"] },
    { name: "Silver", minTraders: 15, maxTraders: 29, commissionPercent: 15, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.2, color: "#c0c0c0", icon: "star", perks: ["Telegram support", "Marketing materials", "Bi-weekly payouts"] },
    { name: "Gold", minTraders: 30, maxTraders: 49, commissionPercent: 20, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.35, color: "#ffd700", icon: "trophy", perks: ["1-on-1 support calls", "Co-branded landing pages", "Weekly payouts"] },
    { name: "Elite", minTraders: 50, maxTraders: null, commissionPercent: 25, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.5, color: "#000000", icon: "sparkles", perks: ["Dedicated account manager", "Custom commission rates", "Instant payouts", "Exclusive bonuses"] },
  ],
  weekly_tasks: {
    Starter: [
      { title: "Repost 1 BullMoney post on your story/feed", timeMinutes: 10, whyItMatters: "Keeps your audience warm and reminds them you are active." },
      { title: "Invite 1 trader friend to register with your link", timeMinutes: 20, whyItMatters: "One direct invite each week compounds fast over time." },
    ],
    Bronze: [
      { title: "Repost 2 BullMoney posts with your own short caption", timeMinutes: 25, whyItMatters: "Personal captions convert better than plain reposts." },
      { title: "DM 3 warm contacts who trade or want to learn", timeMinutes: 35, whyItMatters: "Warm outreach usually gives the highest reply rate." },
      { title: "Follow up with last week leads", timeMinutes: 20, whyItMatters: "Most signups happen after follow-up, not first message." },
    ],
    Silver: [
      { title: "Publish 1 simple market insight post + referral CTA", timeMinutes: 45, whyItMatters: "Educational posts build trust and inbound leads." },
      { title: "Host 1 quick Q&A in Telegram/Instagram stories", timeMinutes: 30, whyItMatters: "Live interaction shortens the trust cycle." },
      { title: "Recruit 1 qualified trader and help them connect MT5", timeMinutes: 60, whyItMatters: "Activation quality matters more than raw signups." },
    ],
    Gold: [
      { title: "Post 2 educational clips (entry basics or risk tips)", timeMinutes: 90, whyItMatters: "Video content drives stronger long-term growth." },
      { title: "Run 1 small networking session with trader friends", timeMinutes: 60, whyItMatters: "Group conversations produce multiple referrals at once." },
      { title: "Review analytics tab and optimize your best channel", timeMinutes: 30, whyItMatters: "Data-led tweaks can increase conversions quickly." },
    ],
    Elite: [
      { title: "Build a weekly content sequence (3-post funnel)", timeMinutes: 90, whyItMatters: "A repeatable funnel scales without constant manual effort." },
      { title: "Mentor 1 newer affiliate and co-promote together", timeMinutes: 60, whyItMatters: "Partnership growth creates new audience overlap." },
      { title: "Audit top leads and set a next-step action for each", timeMinutes: 45, whyItMatters: "Systematic follow-up protects revenue opportunities." },
    ],
  },
  tips_title: "Tips for Success",
  tips: [
    { title: "Be Consistent", description: "Post regularly and engage with your audience daily." },
    { title: "Add Value First", description: "Share helpful trading tips before promoting your link." },
    { title: "Use Multiple Channels", description: "Spread your reach across Instagram, Telegram, YouTube, and Discord." },
    { title: "Follow Up", description: "Most signups happen after 2-3 follow-up messages." },
    { title: "Track Your Results", description: "Use the analytics tab to see what works best for you." },
  ],
  faq_items: [
    { question: "How do I get paid?", answer: "Payments are processed monthly via your preferred method (bank transfer, PayPal, crypto, or Wise)." },
    { question: "When do I get my commissions?", answer: "Commissions are calculated weekly and paid out monthly once you reach the $50 minimum threshold." },
    { question: "How are commissions calculated?", answer: "You earn a percentage of the broker rate per lot traded by your referrals. The percentage depends on your tier level." },
    { question: "Can I track my referrals?", answer: "Yes! The dashboard shows all your referrals, their trading activity, and your earnings in real-time." },
  ],
  how_to_become_affiliate: "Join BullMoney as an affiliate partner and earn commissions on every trade your referrals make.",
  welcome_message: "Welcome to the BullMoney Affiliate Program",
  welcome_subtitle: "Earn commissions by referring traders to BullMoney",
  overview_title: "Overview",
  recruits_title: "Your Recruits",
  earnings_title: "Earnings",
  analytics_title: "Analytics",
  commission_info: "Earn up to 25% commission on broker rates per lot traded by your referrals.",
  qr_section_title: "Your Referral QR Code",
  qr_section_description: "Clients can scan to open the welcome screen with your referral code auto-filled.",
  referral_link_title: "Your Referral Link",
  referral_link_description: "Share this link to earn commissions on every trade your referrals make",
  payout_info: "Payouts are processed monthly for balances over $50.",
  support_email: "support@bullmoney.online",
  telegram_group_link: "https://t.me/+aKB315PRM5A2OGI0",
  staff_group_link: "https://t.me/+aKB315PRM5A2OGI0",
  custom_styles: {},
  show_qr_code: true,
  show_tasks: true,
  show_tips: true,
  show_leaderboard: false,
  show_telegram_feed: true,
};

// Singleton cache for content - shared across all hook instances
let contentCache: AffiliateDashboardContent | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export function useAffiliateDashboardContent() {
  const [content, setContent] = useState<AffiliateDashboardContent>(
    contentCache || DEFAULT_AFFILIATE_CONTENT
  );
  const [loading, setLoading] = useState(!contentCache);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseClient();

  const fetchContent = useCallback(async (force = false) => {
    // Use cache if available and not expired
    if (!force && contentCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setContent(contentCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("affiliate_dashboard_content")
        .select("*")
        .eq("id", "main")
        .single();

      if (fetchError) {
        // If table doesn't exist or no data, use defaults
        if (fetchError.code === "PGRST116" || fetchError.code === "42P01") {
          console.log("[useAffiliateDashboardContent] No content found, using defaults");
          setContent(DEFAULT_AFFILIATE_CONTENT);
          contentCache = DEFAULT_AFFILIATE_CONTENT;
          cacheTimestamp = Date.now();
        } else {
          console.error("[useAffiliateDashboardContent] Error:", fetchError);
          setError("Failed to load content");
          // Still use defaults as fallback
          setContent(DEFAULT_AFFILIATE_CONTENT);
        }
      } else {
        // Merge with defaults to ensure all fields exist
        const mergedContent = {
          ...DEFAULT_AFFILIATE_CONTENT,
          ...data,
          tiers: data.tiers?.length > 0 ? data.tiers : DEFAULT_AFFILIATE_CONTENT.tiers,
          weekly_tasks: Object.keys(data.weekly_tasks || {}).length > 0 
            ? data.weekly_tasks 
            : DEFAULT_AFFILIATE_CONTENT.weekly_tasks,
          tips: data.tips?.length > 0 ? data.tips : DEFAULT_AFFILIATE_CONTENT.tips,
          faq_items: data.faq_items?.length > 0 ? data.faq_items : DEFAULT_AFFILIATE_CONTENT.faq_items,
        };
        setContent(mergedContent);
        contentCache = mergedContent;
        cacheTimestamp = Date.now();
      }
    } catch (err) {
      console.error("[useAffiliateDashboardContent] Unexpected error:", err);
      setError("Unexpected error loading content");
      setContent(DEFAULT_AFFILIATE_CONTENT);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Public method to force refresh
  const refresh = useCallback(() => fetchContent(true), [fetchContent]);

  // Helper functions that use the dynamic content
  const getTierFromActive = useCallback((activeCount: number): AffiliateTier => {
    const tiers = content.tiers;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (activeCount >= tiers[i].minTraders) {
        return tiers[i];
      }
    }
    return tiers[0];
  }, [content.tiers]);

  const getNextTier = useCallback((activeCount: number): AffiliateTier | null => {
    const tiers = content.tiers;
    const currentTier = getTierFromActive(activeCount);
    const currentIndex = tiers.findIndex(t => t.name === currentTier.name);
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  }, [content.tiers, getTierFromActive]);

  const getProgressToNextTier = useCallback((activeCount: number): number => {
    const currentTier = getTierFromActive(activeCount);
    const nextTier = getNextTier(activeCount);
    
    if (!nextTier) return 100; // Already at Elite
    
    const tradersInCurrentTier = activeCount - currentTier.minTraders;
    const tradersNeededForNext = nextTier.minTraders - currentTier.minTraders;
    
    return Math.min((tradersInCurrentTier / tradersNeededForNext) * 100, 100);
  }, [getTierFromActive, getNextTier]);

  const getTasksForTier = useCallback((tierName: string) => {
    return content.weekly_tasks[tierName] || [];
  }, [content.weekly_tasks]);

  return {
    content,
    loading,
    error,
    refresh,
    // Tier helpers
    tiers: content.tiers,
    weeklyTasks: content.weekly_tasks,
    tips: content.tips,
    faqItems: content.faq_items,
    // Helper functions
    getTierFromActive,
    getNextTier,
    getProgressToNextTier,
    getTasksForTier,
    // Feature flags
    showQrCode: content.show_qr_code,
    showTasks: content.show_tasks,
    showTips: content.show_tips,
    showLeaderboard: content.show_leaderboard,
    showTelegramFeed: content.show_telegram_feed,
  };
}

// Export static helper for components that can't use hooks
export function clearContentCache() {
  contentCache = null;
  cacheTimestamp = 0;
}
