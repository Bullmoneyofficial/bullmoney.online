"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { 
  Users, Search, Calendar, CheckCircle2, 
  ArrowLeft, RefreshCw, Download, 
  Shield, TrendingUp, Lock, AlertTriangle, Tag,
  X, Copy, Activity, DollarSign, ChevronLeft, ChevronRight,
  Zap, Target, Award, Star, Trophy, Sparkles, 
  BarChart3, Clock, Wallet, ExternalLink, Share2,
  ArrowUpRight, ArrowDownRight, Eye, PieChart,
  Filter, LayoutGrid, List,
  Gift, Link2, MessageSquare, Bell, Settings
} from 'lucide-react';
import { cn } from "@/lib/utils"; 
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import AffiliateAdminPanel from "@/app/recruit/AffiliateAdminPanel";
import AffiliateContentAdminPanel from "@/components/admin/AffiliateContentAdminPanel";
import ProfileManger, { type AffiliateProfileForm } from "@/app/recruit/ProfileManger";
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { useAffiliateDashboardContent, type AffiliateTier } from '@/hooks/useAffiliateDashboardContent';

// --- SUPABASE SETUP ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin email normalization helper (matches AdminHubModal)
const normalizeEmail = (email?: string | null) => (email || "").trim().toLowerCase();

// Main admin email (same as AdminHub)
const MAIN_ADMIN_EMAIL = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);

// Affiliate-specific admin emails
const AFFILIATE_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Combined check: is this email an admin?
const isAdminEmail = (email?: string | null): boolean => {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  // Check main admin OR affiliate admin list
  return normalized === MAIN_ADMIN_EMAIL || AFFILIATE_ADMIN_EMAILS.includes(normalized);
};

const STAFF_GROUP_LINK = 'https://t.me/+aKB315PRM5A2OGI0';
const STAFF_GROUP_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_STAFF_CHAT_ID || '';

// --- TYPES ---
interface Recruit {
  id: string | number;
  email: string;
  created_at: string;
  mt5_id: string | null;
  affiliate_code: string | null; 
  referred_by_code: string | null; 
  task_broker_verified?: boolean; 
  status?: 'Active' | 'Pending';
  total_lots_traded?: number;
  estimated_earnings?: number;
}

interface AffiliateEarnings {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  this_month: number;
  last_month: number;
  lifetime_lots: number;
  monthly_lots: number;
}

// AffiliateTier type is now imported from useAffiliateDashboardContent hook

interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  conversionRate: string;
  linkClicks: number;
}

interface AffiliateAttribution {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
}

interface AffiliateLiveMetrics {
  total_recruits: number;
  active_traders: number;
  pending_traders: number;
  lifetime_lots: number;
  this_month_earnings: number;
  last_month_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  total_earnings: number;
  link_clicks: number;
  current_tier: string;
  next_tier: string | null;
  traders_to_next: number;
  updated_at: string;
}

interface TelegramFeedMessage {
  id: string;
  timestamp: number;
  text: string;
  author: string;
  authorUsername?: string;
  hasMedia: boolean;
  mediaType?: 'photo' | 'video' | 'document' | 'audio';
  formattedTime: string;
}

type DashboardTabId = 'overview' | 'recruits' | 'earnings' | 'analytics' | 'admin';

// --- TIER DEFINITIONS: Now loaded dynamically from useAffiliateDashboardContent hook ---
// See /hooks/useAffiliateDashboardContent.ts for the data source

// --- HELPERS ---
const maskEmail = (email: string) => {
  if (!email) return 'Unknown';
  const [name, domain] = email.split('@');
  if (name.length <= 3) return `${name}***@${domain}`;
  return `${name.slice(0, 3)}***${name.slice(-1)}@${domain}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
};

const formatId = (id: string | number) => {
  if (!id) return '---';
  const strId = String(id);
  return strId.length > 8 ? strId.slice(0, 8) : strId;
};

const formatCurrency = (amount: number) => {
  return useCurrencyLocaleStore.getState().formatPrice(amount);
};

const formatNumber = (num: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

// getTierFromActive, getNextTier, getProgressToNextTier now come from useAffiliateDashboardContent hook

const getTierIcon = (iconName: string): React.ElementType => {
  const icons: Record<string, React.ElementType> = {
    target: Target,
    award: Award,
    star: Star,
    trophy: Trophy,
    sparkles: Sparkles,
  };
  return icons[iconName] || Target;
};

const getIsoWeekKey = () => {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

// --- MAIN COMPONENT ---
export default function AffiliateRecruitsDashboard({
  onBack,
  skipAuthInDev = false,
}: {
  onBack: () => void;
  skipAuthInDev?: boolean;
}) {
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrProfileModal, setShowQrProfileModal] = useState(false);
  const [qrEmailInput, setQrEmailInput] = useState('');
  const [qrEmailSending, setQrEmailSending] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showAdminContentEditor, setShowAdminContentEditor] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<AffiliateProfileForm>({
    email: '',
    full_name: '',
    telegram_username: '',
    discord_username: '',
    instagram_username: '',
    facebook_username: '',
    twitter_username: '',
    youtube_username: '',
    twitch_username: '',
    tiktok_username: '',
    cell_number: '',
    preferred_contact_method: '',
    country: '',
    city: '',
    timezone: '',
    birth_date: '',
    trading_experience_years: '',
    trading_style: '',
    risk_tolerance: '',
    preferred_instruments: '',
    trading_timezone: '',
    account_balance_range: '',
    preferred_leverage: '',
    favorite_pairs: '',
    trading_strategy: '',
    win_rate_target: '',
    monthly_profit_target: '',
    hobbies: '',
    personality_traits: '',
    trading_goals: '',
    learning_style: '',
    notification_preferences: '',
    preferred_chart_timeframe: '',
    uses_automated_trading: false,
    attends_live_sessions: false,
    bio: '',
  });
  const [weeklyTaskChecks, setWeeklyTaskChecks] = useState<Record<string, boolean>>({});
  const [staffMessages, setStaffMessages] = useState<TelegramFeedMessage[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isStaffFeedExpanded, setIsStaffFeedExpanded] = useState(false);

  // --- DYNAMIC CONTENT FROM DATABASE ---
  const {
    content: dashboardContent,
    tiers: AFFILIATE_TIERS,
    weeklyTasks: TIER_WEEKLY_TASKS,
    tips: affiliateTips,
    faqItems: affiliateFaq,
    getTierFromActive,
    getNextTier,
    getProgressToNextTier,
    showQrCode,
    showTasks,
    showTips,
    showLeaderboard,
    showTelegramFeed,
    loading: contentLoading,
  } = useAffiliateDashboardContent();
  const [staffError, setStaffError] = useState<string | null>(null);

  // Default to card view on mobile for better UX
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, []);

  const [myTrackingCode, setMyTrackingCode] = useState<string>('Loading...');
  
  // --- VIP STATUS FROM PAGEMODE SESSION ---
  const [isVipUser, setIsVipUser] = useState<boolean>(false);
  
  // Check VIP status from pageMode session on mount
  useEffect(() => {
    const checkVipStatus = () => {
      try {
        const pagemodeSession = localStorage.getItem('bullmoney_session');
        if (pagemodeSession) {
          const sessionData = JSON.parse(pagemodeSession);
          setIsVipUser(sessionData.is_vip === true);
        }
      } catch (error) {
        console.error('Failed to parse pageMode session:', error);
        setIsVipUser(false);
      }
    };

    checkVipStatus();

    // Listen for session changes to update VIP status dynamically
    const handleSessionChange = () => checkVipStatus();
    window.addEventListener('bullmoney_session_changed', handleSessionChange);
    
    return () => {
      window.removeEventListener('bullmoney_session_changed', handleSessionChange);
    };
  }, []);
  
  // --- DYNAMIC THEME ---
  const { isXMUser } = useGlobalTheme();
  const accentColor = isXMUser ? 'red' : 'blue';

  const [stats, setStats] = useState<DashboardStats>({
    total: 0, active: 0, pending: 0, conversionRate: '0%', linkClicks: 0
  });

  const [earnings, setEarnings] = useState<AffiliateEarnings>({
    total_earnings: 0,
    pending_earnings: 0,
    paid_earnings: 0,
    this_month: 0,
    last_month: 0,
    lifetime_lots: 0,
    monthly_lots: 0
  });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [isAffiliateAdmin, setIsAffiliateAdmin] = useState(false);
  const [affiliateUserId, setAffiliateUserId] = useState<number | null>(null);
  const [affiliateAttribution, setAffiliateAttribution] = useState<AffiliateAttribution>({
    affiliateId: '',
    affiliateName: '',
    affiliateEmail: '',
  });
  const isDevMode = process.env.NODE_ENV !== 'production';
  const authBypassed = isDevMode && skipAuthInDev;

  const currentTier = useMemo(() => getTierFromActive(stats.active), [stats.active, getTierFromActive]);
  const nextTier = useMemo(() => getNextTier(stats.active), [stats.active, getNextTier]);
  const tierProgress = useMemo(() => getProgressToNextTier(stats.active), [stats.active, getProgressToNextTier]);
  const currentMonthLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
    []
  );
  const liveThisMonthEarnings = useMemo(() => {
    const derived = earnings.total_earnings - earnings.paid_earnings - earnings.pending_earnings;
    return Number.isFinite(derived) ? Math.max(derived, 0) : 0;
  }, [earnings.total_earnings, earnings.paid_earnings, earnings.pending_earnings]);
  const liveSyncLabel = useMemo(() => {
    if (!lastUpdatedAt) return 'Syncing...';
    return `Live • ${lastUpdatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }, [lastUpdatedAt]);

  const appBaseUrl = useMemo(() => {
    // ALWAYS use the canonical production domain for referral/QR links
    // so they work correctly regardless of which domain the affiliate
    // is currently browsing from (Vercel preview URLs, localhost, etc.)
    const CANONICAL_DOMAIN = 'https://bullmoney.online';

    if (process.env.NODE_ENV === 'development') {
      // In development, use localhost so devs can test locally
      const devUrl = 'http://localhost:3000';
      console.log('[AffiliateRecruitsDashboard] Base URL (dev):', devUrl);
      return devUrl;
    }

    console.log('[AffiliateRecruitsDashboard] Base URL (canonical):', CANONICAL_DOMAIN);
    return CANONICAL_DOMAIN;
  }, []);

  const currentWeekKey = useMemo(() => getIsoWeekKey(), []);
  const currentTierTasks = useMemo(() => TIER_WEEKLY_TASKS[currentTier.name] || [], [currentTier.name, TIER_WEEKLY_TASKS]);
  const weeklyTaskStorageKey = useMemo(() => {
    if (!affiliateUserId) return null;
    return `affiliate-weekly-tasks:${affiliateUserId}:${currentWeekKey}`;
  }, [affiliateUserId, currentWeekKey]);

  const profileCompletionPercent = useMemo(() => {
    const keys = Object.keys(profileForm) as Array<keyof AffiliateProfileForm>;
    const completed = keys.reduce((count, key) => {
      const value = profileForm[key];
      if (typeof value === 'boolean') {
        return count + (value ? 1 : 0);
      }
      return count + (String(value || '').trim() ? 1 : 0);
    }, 0);
    return Math.round((completed / keys.length) * 100);
  }, [profileForm]);

  const completedWeeklyTaskCount = useMemo(() => {
    return currentTierTasks.filter((_, idx) => Boolean(weeklyTaskChecks[`${currentTier.name}-${idx}`])).length;
  }, [currentTierTasks, weeklyTaskChecks, currentTier.name]);

  const loadStaffFeed = async (silent = false) => {
    try {
      if (!silent) setStaffLoading(true);
      setStaffError(null);

      const params = new URLSearchParams();
      params.set('limit', '6');
      if (STAFF_GROUP_CHAT_ID) params.set('chatId', STAFF_GROUP_CHAT_ID);

      const response = await fetch(`/api/telegram/messages?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(String(data?.error || 'Could not load staff updates'));
      }

      const parsed = Array.isArray(data.messages) ? data.messages : [];
      setStaffMessages(parsed);
    } catch (error: any) {
      console.error('Failed to load staff feed:', error);
      setStaffError(String(error?.message || 'Failed to load staff updates'));
    } finally {
      if (!silent) setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadStaffFeed(false);
    const intervalId = window.setInterval(() => {
      void loadStaffFeed(true);
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!weeklyTaskStorageKey || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(weeklyTaskStorageKey);
      if (!raw) {
        setWeeklyTaskChecks({});
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setWeeklyTaskChecks(parsed);
      }
    } catch (error) {
      console.error('Failed to load weekly task progress:', error);
    }
  }, [weeklyTaskStorageKey]);

  useEffect(() => {
    if (!weeklyTaskStorageKey || typeof window === 'undefined') return;
    try {
      localStorage.setItem(weeklyTaskStorageKey, JSON.stringify(weeklyTaskChecks));
    } catch (error) {
      console.error('Failed to save weekly task progress:', error);
    }
  }, [weeklyTaskChecks, weeklyTaskStorageKey]);
  
  const referralLink = useMemo(() => {
    const referralPath = '/';

    // Return base URL if no valid tracking code
    if (!myTrackingCode || myTrackingCode === 'Loading...' || myTrackingCode === 'No Code Found' || myTrackingCode.trim() === '') {
      const link = `${appBaseUrl}${referralPath}`;
      console.log('[AffiliateRecruitsDashboard] Referral link (no code):', link);
      return link;
    }
    
    // Build URL safely without using URL constructor (which can fail in some SSR contexts)
    const baseUrl = `${appBaseUrl}${referralPath}`;
    const params = new URLSearchParams();
    params.set('ref', myTrackingCode.trim());
    if (affiliateAttribution.affiliateId) params.set('aff_id', affiliateAttribution.affiliateId);
    if (affiliateAttribution.affiliateName) params.set('aff_name', affiliateAttribution.affiliateName);
    if (affiliateAttribution.affiliateEmail) params.set('aff_email', affiliateAttribution.affiliateEmail);
    params.set('aff_code', myTrackingCode.trim());
    params.set('utm_source', 'affiliate');
    params.set('utm_medium', 'dashboard');
    params.set('utm_campaign', 'partner_link');
    
    const link = `${baseUrl}?${params.toString()}`;
    console.log('[AffiliateRecruitsDashboard] Referral link generated:', link);
    return link;
  }, [myTrackingCode, appBaseUrl, affiliateAttribution]);

  const affiliateDisplayName = useMemo(() => {
    const profileName = String(profileForm.full_name || '').trim();
    if (profileName) return profileName;
    const attribName = String(affiliateAttribution.affiliateName || '').trim();
    if (attribName) return attribName;
    const attribEmail = String(affiliateAttribution.affiliateEmail || '').trim();
    if (attribEmail) return attribEmail.split('@')[0] || 'BullMoney Partner';
    return 'BullMoney Partner';
  }, [profileForm.full_name, affiliateAttribution.affiliateName, affiliateAttribution.affiliateEmail]);

  const shortReferralDisplay = useMemo(() => {
    const safeCode = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
      ? myTrackingCode.trim()
      : 'partner';
    const nameSlug = affiliateDisplayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'partner';

    try {
      const parsed = new URL(referralLink);
      const host = parsed.hostname.replace(/^www\./, '');
      return `${host}/${nameSlug}-${safeCode}`;
    } catch {
      return `bullmoney.online/${nameSlug}-${safeCode}`;
    }
  }, [referralLink, affiliateDisplayName, myTrackingCode]);

  const bullMoneyShortInfo = 'BullMoney: Trading education, tools, and community support.';

  const dashboardTabs = useMemo(() => {
    const base = [
      { id: 'overview', label: 'Overview', icon: LayoutGrid },
      { id: 'recruits', label: 'Recruits', icon: Users },
      { id: 'earnings', label: 'Earnings', icon: Wallet },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ] as const;

    if (isAffiliateAdmin) {
      return [...base, { id: 'admin', label: 'Admin', icon: Shield }] as const;
    }

    return base;
  }, [isAffiliateAdmin]);

  // --- CHECK AUTH & FETCH DATA ---
  const checkAuthAndLoad = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setErrorMsg(null);
    
    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      if (!savedSession && !authBypassed) {
        setIsAuthorized(false);
        if (!isPolling) setLoading(false);
        return;
      }

      if (!savedSession && authBypassed) {
        setIsAuthorized(true);
        setRecruits([]);
        setStats({ total: 0, active: 0, pending: 0, conversionRate: '0%', linkClicks: 0 });
        setEarnings({
          total_earnings: 0,
          pending_earnings: 0,
          paid_earnings: 0,
          this_month: 0,
          last_month: 0,
          lifetime_lots: 0,
          monthly_lots: 0,
        });
        if (!isPolling) {
          setErrorMsg('Dev auth bypass enabled. Connect a session to load live affiliate data.');
          setLoading(false);
        }
        return;
      }

      setIsAuthorized(true);
      const session = JSON.parse(savedSession as string);
      const userId = Number(session.id);
      if (Number.isFinite(userId)) {
        setAffiliateUserId(userId);
      }

      let codeToSearch = myTrackingCode;
      
      let trackedLinkClicks = stats.linkClicks;

      if (!isPolling || myTrackingCode === 'Loading...') {
        const { data: userData, error: userError } = await supabase
          .from('recruits')
          .select('affiliate_code, total_earnings, pending_earnings, paid_earnings, link_clicks, email, full_name, telegram_username, discord_username, instagram_username, facebook_username, twitter_username, youtube_username, twitch_username, tiktok_username, cell_number, preferred_contact_method, country, city, timezone, birth_date, trading_experience_years, trading_style, risk_tolerance, preferred_instruments, trading_timezone, account_balance_range, preferred_leverage, favorite_pairs, trading_strategy, win_rate_target, monthly_profit_target, hobbies, personality_traits, trading_goals, learning_style, notification_preferences, preferred_chart_timeframe, uses_automated_trading, attends_live_sessions, bio')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Supabase user data error:', userError);
          if (userError.code === 'PGRST116') {
            // No rows found - user doesn't exist in recruits table
            setMyTrackingCode('No Code Found');
            setErrorMsg('No affiliate account found. Please complete your registration first.');
          } else {
            setErrorMsg(`Database error: ${userError.message || 'Failed to load user data'}`);
          }
          setRecruits([]);
          if (!isPolling) setLoading(false);
          return;
        }
        
        if (!userData?.affiliate_code) {
          // Try to generate an affiliate code if one doesn't exist
          try {
            const genResponse = await fetch('/api/recruit/generate-affiliate-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                email: userData?.email || session?.email || '',
              }),
            });

            const genData = await genResponse.json();
            if (genData.success && genData.affiliateCode) {
              codeToSearch = genData.affiliateCode;
              setMyTrackingCode(genData.affiliateCode);
              console.log(`[AffiliateRecruitsDashboard] Generated new affiliate code: ${genData.affiliateCode}`);
            } else {
              throw new Error(genData.error || 'Failed to generate affiliate code');
            }
          } catch (genError: any) {
            console.error('[AffiliateRecruitsDashboard] Code generation error:', genError);
            setMyTrackingCode('No Code Found');
            setErrorMsg(`Could not generate affiliate code: ${genError.message || 'Please try again later'}`);
            setRecruits([]);
            if (!isPolling) setLoading(false);
            return;
          }
        }

        codeToSearch = userData.affiliate_code;
        trackedLinkClicks = Number(userData.link_clicks || 0);
        setMyTrackingCode(codeToSearch);
        setAffiliateAttribution({
          affiliateId: String(userId || ''),
          affiliateName: String(userData.full_name || session?.email || '').trim(),
          affiliateEmail: String(session?.email || '').trim(),
        });
        setProfileForm({
          email: String(userData.email || session?.email || ''),
          full_name: String(userData.full_name || ''),
          telegram_username: String(userData.telegram_username || ''),
          discord_username: String(userData.discord_username || ''),
          instagram_username: String(userData.instagram_username || ''),
          facebook_username: String(userData.facebook_username || ''),
          twitter_username: String(userData.twitter_username || ''),
          youtube_username: String(userData.youtube_username || ''),
          twitch_username: String(userData.twitch_username || ''),
          tiktok_username: String(userData.tiktok_username || ''),
          cell_number: String(userData.cell_number || ''),
          preferred_contact_method: String(userData.preferred_contact_method || ''),
          country: String(userData.country || ''),
          city: String(userData.city || ''),
          timezone: String(userData.timezone || ''),
          birth_date: String(userData.birth_date || ''),
          trading_experience_years: String(userData.trading_experience_years || ''),
          trading_style: String(userData.trading_style || ''),
          risk_tolerance: String(userData.risk_tolerance || ''),
          preferred_instruments: String(userData.preferred_instruments || ''),
          trading_timezone: String(userData.trading_timezone || ''),
          account_balance_range: String(userData.account_balance_range || ''),
          preferred_leverage: String(userData.preferred_leverage || ''),
          favorite_pairs: String(userData.favorite_pairs || ''),
          trading_strategy: String(userData.trading_strategy || ''),
          win_rate_target: String(userData.win_rate_target || ''),
          monthly_profit_target: String(userData.monthly_profit_target || ''),
          hobbies: String(userData.hobbies || ''),
          personality_traits: String(userData.personality_traits || ''),
          trading_goals: String(userData.trading_goals || ''),
          learning_style: String(userData.learning_style || ''),
          notification_preferences: String(userData.notification_preferences || ''),
          preferred_chart_timeframe: String(userData.preferred_chart_timeframe || ''),
          uses_automated_trading: Boolean(userData.uses_automated_trading || false),
          attends_live_sessions: Boolean(userData.attends_live_sessions || false),
          bio: String(userData.bio || ''),
        });
        
        // Clear any previous error messages on successful load
        if (!isPolling) setErrorMsg(null);
        
        // Set earnings data
        setEarnings(prev => ({
          ...prev,
          total_earnings: userData.total_earnings || 0,
          pending_earnings: userData.pending_earnings || 0,
          paid_earnings: userData.paid_earnings || 0
        }));
      }

      const { data, error } = await supabase
        .from('recruits')
        .select('*')
        .eq('referred_by_code', codeToSearch) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase recruits query error:', error);
        throw new Error(`Failed to load recruits: ${error.message || 'Unknown database error'}`);
      }

      if (data) {
        const normalized: Recruit[] = data.map((item: any) => {
          const isActive = item.task_broker_verified || (item.mt5_id && String(item.mt5_id).length > 3);
          const lotsTraded = Number(item.total_lots_traded ?? 0);
          return {
            ...item,
            id: item.id,
            affiliate_code: item.affiliate_code,
            referred_by_code: item.referred_by_code,
            status: isActive ? 'Active' : 'Pending',
            total_lots_traded: lotsTraded,
          };
        });

        const fallbackTotal = normalized.length;
        const fallbackActive = normalized.filter(r => r.status === 'Active').length;
        const fallbackPending = fallbackTotal - fallbackActive;
        const fallbackLots = normalized.reduce((sum, r) => sum + Number(r.total_lots_traded || 0), 0);

        let liveMetrics: AffiliateLiveMetrics | null = null;
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_affiliate_live_metrics', {
              p_affiliate_id: Number.isFinite(userId) ? userId : null,
              p_affiliate_code: codeToSearch,
            })
            .single();

          if (rpcError) {
            console.warn('[AffiliateDashboard] Live metrics RPC unavailable, using fallback metrics.', rpcError.message);
          } else if (rpcData) {
            liveMetrics = rpcData as AffiliateLiveMetrics;
          }
        } catch (rpcException) {
          console.warn('[AffiliateDashboard] Live metrics RPC failed, using fallback metrics.', rpcException);
        }

        const effectiveActive = Number(liveMetrics?.active_traders ?? fallbackActive);
        const effectiveTier = getTierFromActive(effectiveActive);

        const processed: Recruit[] = normalized.map((recruit) => {
          const lots = Number(recruit.total_lots_traded || 0);
          return {
            ...recruit,
            estimated_earnings: lots * (isXMUser ? 11 : 5.5) * (effectiveTier.commissionPercent / 100),
          };
        });

        setRecruits(processed);

        const total = Number(liveMetrics?.total_recruits ?? fallbackTotal);
        const active = effectiveActive;
        const pending = Number(liveMetrics?.pending_traders ?? fallbackPending);
        const linkClicks = Number(liveMetrics?.link_clicks ?? trackedLinkClicks);

        setStats({
          total,
          active,
          pending,
          conversionRate: total > 0 ? `${((active / total) * 100).toFixed(1)}%` : '0%',
          linkClicks,
        });

        setEarnings(prev => ({
          ...prev,
          total_earnings: Number(liveMetrics?.total_earnings ?? prev.total_earnings ?? 0),
          pending_earnings: Number(liveMetrics?.pending_earnings ?? prev.pending_earnings ?? 0),
          paid_earnings: Number(liveMetrics?.paid_earnings ?? prev.paid_earnings ?? 0),
          lifetime_lots: Number(liveMetrics?.lifetime_lots ?? fallbackLots),
          monthly_lots: Number(liveMetrics?.lifetime_lots ?? fallbackLots),
          this_month: Number(liveMetrics?.this_month_earnings ?? 0),
          last_month: Number(liveMetrics?.last_month_earnings ?? 0),
        }));
        setLastUpdatedAt(liveMetrics?.updated_at ? new Date(liveMetrics.updated_at) : new Date());
      }
    } catch (err: any) {
      console.error("Error loading recruits:", err);
      if (!isPolling) setErrorMsg("Could not load affiliate data.");
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndLoad(false);
    const intervalId = setInterval(() => checkAuthAndLoad(true), 15000); 
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!affiliateUserId || !myTrackingCode || myTrackingCode === 'Loading...' || myTrackingCode === 'No Code Found') {
      return;
    }

    const channel = supabase
      .channel(`affiliate-live-${affiliateUserId}-${myTrackingCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recruits',
          filter: `referred_by_code=eq.${myTrackingCode}`,
        },
        () => {
          void checkAuthAndLoad(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recruits',
          filter: `id=eq.${affiliateUserId}`,
        },
        () => {
          void checkAuthAndLoad(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'affiliate_earnings',
          filter: `affiliate_id=eq.${affiliateUserId}`,
        },
        () => {
          void checkAuthAndLoad(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [affiliateUserId, myTrackingCode]);

  // Admin check - matches AdminHubModal logic (pagemode + Supabase auth + isAdmin flag)
  useEffect(() => {
    let mounted = true;
    
    const checkAdmin = async () => {
      // Check 1: Pagemode session (localStorage)
      try {
        const raw = localStorage.getItem("bullmoney_session");
        if (raw) {
          const parsed = JSON.parse(raw);
          const email = normalizeEmail(parsed?.email);
          const isAdminFlag = Boolean(parsed?.isAdmin);
          
          // If pagemode session has admin flag OR email is in admin list
          if (isAdminFlag || isAdminEmail(email)) {
            if (mounted) setIsAffiliateAdmin(true);
            return;
          }
        }
      } catch (err) {
        console.error("Pagemode session parse error:", err);
      }
      
      // Check 2: Supabase auth session
      try {
        const { data } = await supabase.auth.getSession();
        const supabaseEmail = data?.session?.user?.email;
        if (isAdminEmail(supabaseEmail)) {
          if (mounted) setIsAffiliateAdmin(true);
          return;
        }
      } catch (err) {
        console.error("Supabase auth check error:", err);
      }
      
      // Not admin
      if (mounted) setIsAffiliateAdmin(false);
    };
    
    checkAdmin();
    
    // Listen for auth state changes
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isAdminEmail(session?.user?.email)) {
        if (mounted) setIsAffiliateAdmin(true);
      }
    });
    
    // Listen for storage changes (pagemode session updates)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bullmoney_session") checkAdmin();
    };
    window.addEventListener("storage", onStorage);
    
    return () => {
      mounted = false;
      authSub?.subscription?.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Helper function for secure clipboard copy with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Method 1: Try modern Clipboard API (works in HTTPS)
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipboardErr) {
        console.warn('Clipboard API failed, trying fallback:', clipboardErr);
      }
    }

    // Method 2: Fallback using textarea (works in most environments)
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
      document.body.appendChild(textarea);
      
      // iOS Safari specific handling
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, textarea.value.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (!success) {
        throw new Error('execCommand copy failed');
      }
      return true;
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
      return false;
    }
  };

  const handleCopyCode = async () => {
    if (!myTrackingCode || myTrackingCode === 'Loading...' || myTrackingCode === 'No Code Found') return;
    try {
      const success = await copyToClipboard(myTrackingCode);
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
        setErrorMsg('Affiliate code copied.');
        setTimeout(() => setErrorMsg(null), 1500);
      } else {
        // Show error to user
        setErrorMsg('Failed to copy code. Please copy manually: ' + myTrackingCode);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err) {
      console.error('Copy failed', err);
      setErrorMsg('Failed to copy code. Please copy manually: ' + myTrackingCode);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleCopyLink = async () => {
    const hasActiveCode = Boolean(
      myTrackingCode &&
      myTrackingCode !== 'Loading...' &&
      myTrackingCode !== 'No Code Found' &&
      myTrackingCode.trim() !== ''
    );

    if (!referralLink) {
      setErrorMsg('No referral link available. Please ensure you have an affiliate code.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (!hasActiveCode && !isDevMode) {
      setErrorMsg('No referral link available. Please ensure you have an affiliate code.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    try {
      if (!hasActiveCode && isDevMode) {
        console.log('[AffiliateRecruitsDashboard][DEV] Copying development default referral link:', referralLink);
      } else {
        console.log('[AffiliateRecruitsDashboard] Copying referral link:', referralLink);
      }
      const success = await copyToClipboard(referralLink);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        setErrorMsg('✓ Referral link copied to clipboard!');
        setTimeout(() => setErrorMsg(null), 2000);
      } else {
        // Show error to user
        setErrorMsg('Failed to copy link. Please copy manually.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err) {
      console.error('[AffiliateRecruitsDashboard] Copy failed', err);
      setErrorMsg('Failed to copy link. Please copy manually.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleOpenReferralLink = () => {
    const hasActiveCode = Boolean(
      myTrackingCode &&
      myTrackingCode !== 'Loading...' &&
      myTrackingCode !== 'No Code Found' &&
      myTrackingCode.trim() !== ''
    );

    if (!referralLink || (!hasActiveCode && !isDevMode)) {
      setErrorMsg('Referral link unavailable until your affiliate code is active.');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    if (!hasActiveCode && isDevMode) {
      console.log('[AffiliateRecruitsDashboard][DEV] Opening development default referral link:', referralLink);
    }

    window.open(referralLink, '_blank', 'noopener,noreferrer');
  };

  const handleShareReferralLink = async () => {
    const hasActiveCode = Boolean(
      myTrackingCode &&
      myTrackingCode !== 'Loading...' &&
      myTrackingCode !== 'No Code Found' &&
      myTrackingCode.trim() !== ''
    );

    if (!referralLink || (!hasActiveCode && !isDevMode)) {
      setErrorMsg('Referral link unavailable until your affiliate code is active.');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    try {
      if (!hasActiveCode && isDevMode) {
        console.log('[AffiliateRecruitsDashboard][DEV] Sharing development default referral link:', referralLink);
      }
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Join BullMoney',
          text: 'Use my referral link to join BullMoney:',
          url: referralLink,
        });
        return;
      }

      const copied = await copyToClipboard(referralLink);
      if (copied) {
        setErrorMsg('Share link copied. Paste it into your social post.');
      } else {
        setErrorMsg('Unable to share right now. Please copy the referral link manually.');
      }
      setTimeout(() => setErrorMsg(null), 2500);
    } catch (error) {
      console.error('Share failed:', error);
      setErrorMsg('Unable to open share dialog right now.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleDownloadQrCode = () => {
    try {
      const canvas = document.getElementById('affiliate-referral-qr-export') as HTMLCanvasElement | null;
      if (!canvas) {
        setErrorMsg('QR code is not ready yet.');
        setTimeout(() => setErrorMsg(null), 2500);
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      const codePart = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
        ? myTrackingCode.trim()
        : 'affiliate';

      anchor.href = dataUrl;
      anchor.download = `bullmoney-referral-qr-${codePart}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error('QR download failed:', error);
      setErrorMsg('Could not download QR code.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const getQrCanvas = () => {
    return document.getElementById('affiliate-referral-qr-export') as HTMLCanvasElement | null;
  };

  const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const createQrProfileCardDataUrl = (format: 'png' | 'jpeg') => {
    const qrCanvas = getQrCanvas();
    if (!qrCanvas) throw new Error('QR canvas not available');

    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.font = '700 54px Inter, Arial, sans-serif';
    ctx.fillText('BullMoney', width / 2, 200);

    ctx.font = '600 44px Inter, Arial, sans-serif';
    ctx.fillText(affiliateDisplayName, width / 2, 300);

    const codeLabel = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
      ? myTrackingCode
      : 'PARTNER';
    ctx.font = '500 32px Inter, Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText(`Code: ${codeLabel}`, width / 2, 360);

    const qrSize = 560;
    const qrX = (width - qrSize) / 2;
    const qrY = 460;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    ctx.font = '500 30px Inter, Arial, sans-serif';
    ctx.fillStyle = '#111111';
    ctx.fillText(shortReferralDisplay, width / 2, 1100);

    ctx.font = '400 26px Inter, Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('Scan to join with my affiliate link', width / 2, 1170);
    ctx.fillText(bullMoneyShortInfo, width / 2, 1230);

    return format === 'jpeg'
      ? canvas.toDataURL('image/jpeg', 0.95)
      : canvas.toDataURL('image/png');
  };

  const handleDownloadQrProfileImage = (format: 'png' | 'jpeg') => {
    try {
      const dataUrl = createQrProfileCardDataUrl(format);
      const fileCode = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
        ? myTrackingCode.trim()
        : 'partner';
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `bullmoney-qr-card-${fileCode}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error('QR profile image download failed:', error);
      setErrorMsg('Could not download QR image.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleAutoSaveQrProfileImages = () => {
    handleDownloadQrProfileImage('png');
    handleDownloadQrProfileImage('jpeg');
  };

  const handleDownloadQrProfileSvg = () => {
    try {
      const qrCanvas = getQrCanvas();
      if (!qrCanvas) throw new Error('QR canvas unavailable');

      const qrDataUrl = qrCanvas.toDataURL('image/png');
      const codeLabel = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
        ? myTrackingCode
        : 'PARTNER';
      const escapedName = affiliateDisplayName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedShort = shortReferralDisplay.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedInfo = bullMoneyShortInfo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#ffffff"/>
  <text x="540" y="200" text-anchor="middle" font-size="54" font-family="Inter, Arial, sans-serif" font-weight="700" fill="#111111">BullMoney</text>
  <text x="540" y="300" text-anchor="middle" font-size="44" font-family="Inter, Arial, sans-serif" font-weight="600" fill="#111111">${escapedName}</text>
  <text x="540" y="360" text-anchor="middle" font-size="32" font-family="Inter, Arial, sans-serif" font-weight="500" fill="#333333">Code: ${codeLabel}</text>
  <rect x="240" y="440" width="600" height="600" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <image href="${qrDataUrl}" x="260" y="460" width="560" height="560"/>
  <text x="540" y="1100" text-anchor="middle" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="500" fill="#111111">${escapedShort}</text>
  <text x="540" y="1170" text-anchor="middle" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="400" fill="#666666">Scan to join with my affiliate link</text>
  <text x="540" y="1230" text-anchor="middle" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="400" fill="#666666">${escapedInfo}</text>
</svg>`;

      const fileCode = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
        ? myTrackingCode.trim()
        : 'partner';
      downloadBlobFile(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `bullmoney-qr-card-${fileCode}.svg`);
    } catch (error) {
      console.error('QR profile SVG download failed:', error);
      setErrorMsg('Could not download SVG.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleDownloadQrProfileDataFile = (fileType: 'csv' | 'txt' | 'doc') => {
    try {
      const codeLabel = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
        ? myTrackingCode.trim()
        : 'partner';

      if (fileType === 'csv') {
        const csv = [
          'name,code,short_link,full_link,about',
          `"${affiliateDisplayName.replace(/"/g, '""')}","${codeLabel}","${shortReferralDisplay}","${referralLink}","${bullMoneyShortInfo}"`,
        ].join('\n');
        downloadBlobFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `bullmoney-qr-card-${codeLabel}.csv`);
      }

      if (fileType === 'txt') {
        const text = [
          'BullMoney Affiliate QR Card',
          `Name: ${affiliateDisplayName}`,
          `Code: ${codeLabel}`,
          `Short Link: ${shortReferralDisplay}`,
          `Full Link: ${referralLink}`,
          `About: ${bullMoneyShortInfo}`,
        ].join('\n');
        downloadBlobFile(new Blob([text], { type: 'text/plain;charset=utf-8;' }), `bullmoney-qr-card-${codeLabel}.txt`);
      }

      if (fileType === 'doc') {
        const html = `
          <html><head><meta charset="utf-8"/></head><body>
            <h1>BullMoney Affiliate QR Card</h1>
            <p><strong>Name:</strong> ${affiliateDisplayName}</p>
            <p><strong>Code:</strong> ${codeLabel}</p>
            <p><strong>Short Link:</strong> ${shortReferralDisplay}</p>
            <p><strong>Full Link:</strong> ${referralLink}</p>
            <p><strong>About:</strong> ${bullMoneyShortInfo}</p>
          </body></html>
        `;
        downloadBlobFile(new Blob([html], { type: 'application/msword;charset=utf-8;' }), `bullmoney-qr-card-${codeLabel}.doc`);
      }
    } catch (error) {
      console.error('QR profile data file download failed:', error);
      setErrorMsg('Could not download selected file.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const createQrProfileSvgString = () => {
    const qrCanvas = getQrCanvas();
    if (!qrCanvas) throw new Error('QR canvas unavailable');

    const qrDataUrl = qrCanvas.toDataURL('image/png');
    const codeLabel = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
      ? myTrackingCode
      : 'PARTNER';
    const escapedName = affiliateDisplayName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedShort = shortReferralDisplay.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedInfo = bullMoneyShortInfo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#ffffff"/>
  <text x="540" y="200" text-anchor="middle" font-size="54" font-family="Inter, Arial, sans-serif" font-weight="700" fill="#111111">BullMoney</text>
  <text x="540" y="300" text-anchor="middle" font-size="44" font-family="Inter, Arial, sans-serif" font-weight="600" fill="#111111">${escapedName}</text>
  <text x="540" y="360" text-anchor="middle" font-size="32" font-family="Inter, Arial, sans-serif" font-weight="500" fill="#333333">Code: ${codeLabel}</text>
  <rect x="240" y="440" width="600" height="600" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
  <image href="${qrDataUrl}" x="260" y="460" width="560" height="560"/>
  <text x="540" y="1100" text-anchor="middle" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="500" fill="#111111">${escapedShort}</text>
  <text x="540" y="1170" text-anchor="middle" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="400" fill="#666666">Scan to join with my affiliate link</text>
  <text x="540" y="1230" text-anchor="middle" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="400" fill="#666666">${escapedInfo}</text>
</svg>`;
  };

  const handleSendQrCardToGmail = async () => {
    const email = qrEmailInput.trim().toLowerCase();
    const isGmail = /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email);

    if (!isGmail) {
      setErrorMsg('Please enter a valid Gmail address.');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    const codeLabel = (myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found')
      ? myTrackingCode
      : 'PARTNER';

    try {
      setQrEmailSending(true);
      const pngDataUrl = createQrProfileCardDataUrl('png');
      const jpegDataUrl = createQrProfileCardDataUrl('jpeg');
      const svgContent = createQrProfileSvgString();
      const codeSlug = codeLabel.trim() || 'partner';

      const csvContent = [
        'name,code,short_link,full_link,about',
        `"${affiliateDisplayName.replace(/"/g, '""')}","${codeSlug}","${shortReferralDisplay}","${referralLink}","${bullMoneyShortInfo}"`,
      ].join('\n');

      const txtContent = [
        'BullMoney Affiliate QR Card',
        `Name: ${affiliateDisplayName}`,
        `Code: ${codeSlug}`,
        `Short Link: ${shortReferralDisplay}`,
        `Full Link: ${referralLink}`,
        `About: ${bullMoneyShortInfo}`,
      ].join('\n');

      const docContent = `
        <html><head><meta charset="utf-8"/></head><body>
          <h1>BullMoney Affiliate QR Card</h1>
          <p><strong>Name:</strong> ${affiliateDisplayName}</p>
          <p><strong>Code:</strong> ${codeSlug}</p>
          <p><strong>Short Link:</strong> ${shortReferralDisplay}</p>
          <p><strong>Full Link:</strong> ${referralLink}</p>
          <p><strong>About:</strong> ${bullMoneyShortInfo}</p>
        </body></html>
      `;

      const response = await fetch('/api/recruit/send-qr-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          name: affiliateDisplayName,
          code: codeSlug,
          shortLink: shortReferralDisplay,
          referralLink,
          info: bullMoneyShortInfo,
          files: {
            pngDataUrl,
            jpegDataUrl,
            svgContent,
            csvContent,
            txtContent,
            docContent,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Could not send email right now.');
      }

      setErrorMsg(`Sent to ${email}`);
      setTimeout(() => setErrorMsg(null), 2500);
    } catch (error) {
      console.error('QR Gmail send failed:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Could not send email right now.');
      setTimeout(() => setErrorMsg(null), 2500);
    } finally {
      setQrEmailSending(false);
    }
  };

  useEffect(() => {
    if (!showQrProfileModal) return;
    if (qrEmailInput.trim()) return;

    const candidate = String(profileForm.email || '').trim();
    if (/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(candidate)) {
      setQrEmailInput(candidate);
    }
  }, [showQrProfileModal, profileForm.email, qrEmailInput]);

  const handleShareQrCard = async () => {
    try {
      const shareText = `${affiliateDisplayName} • ${shortReferralDisplay} • ${bullMoneyShortInfo}`;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'BullMoney Affiliate QR',
          text: shareText,
          url: referralLink,
        });
        return;
      }

      const copied = await copyToClipboard(`${shareText}\n${referralLink}`);
      setErrorMsg(copied ? 'Share text copied.' : 'Unable to share right now.');
      setTimeout(() => setErrorMsg(null), 2500);
    } catch (error) {
      console.error('Share QR card failed:', error);
      setErrorMsg('Unable to open share options right now.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleOpenSocialShare = async (platform: 'instagram' | 'facebook' | 'whatsapp') => {
    const shareText = `${affiliateDisplayName} • ${shortReferralDisplay} • ${bullMoneyShortInfo}`;
    const encodedText = encodeURIComponent(`${shareText}\n${referralLink}`);
    const encodedUrl = encodeURIComponent(referralLink);

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,noreferrer');
      return;
    }

    await copyToClipboard(`${shareText}\n${referralLink}`);
    setErrorMsg('Instagram web cannot auto-post stories. Caption copied—paste into Instagram Story/Status.');
    setTimeout(() => setErrorMsg(null), 3500);
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  };

  const handleRequestPromoMaterials = () => {
    const subject = encodeURIComponent('BullMoney Affiliate Promo Materials Request');
    const body = encodeURIComponent(
      `Hi BullMoney Team,%0D%0A%0D%0APlease share the latest affiliate promo materials.%0D%0A%0D%0AMy referral code: ${myTrackingCode}%0D%0AMy referral link: ${referralLink}%0D%0A`
    );
    window.open(`mailto:support@bullmoney.online?subject=${subject}&body=${body}`, '_self');
  };

  const handleContactSupport = () => {
    window.open('mailto:support@bullmoney.online?subject=Affiliate%20Support', '_self');
  };

  const handleRefreshDashboard = () => {
    checkAuthAndLoad(false);
  };

  const handleShowNotifications = () => {
    const pendingCount = stats.pending;
    const activeCount = stats.active;
    const pendingAmount = earnings.pending_earnings + earnings.this_month * 0.8;
    const message = `Notifications: ${pendingCount} pending recruits, ${activeCount} active traders, pending payout ${formatCurrency(pendingAmount)}.`;
    setErrorMsg(message);
    setTimeout(() => setErrorMsg(null), 3500);
  };

  const handleDownloadReport = () => {
    try {
      const rows = filteredRecruits.map((recruit) => ({
        id: recruit.id,
        email: recruit.email,
        joined_date: formatDate(recruit.created_at),
        mt5_id: recruit.mt5_id || '',
        status: recruit.status || 'Pending',
        lots_traded: Number(recruit.total_lots_traded || 0).toFixed(2),
        estimated_earnings: Number(recruit.estimated_earnings || 0).toFixed(2),
        affiliate_code: recruit.affiliate_code || '',
        referred_by_code: recruit.referred_by_code || '',
      }));

      const headers = [
        'id',
        'email',
        'joined_date',
        'mt5_id',
        'status',
        'lots_traded',
        'estimated_earnings',
        'affiliate_code',
        'referred_by_code',
      ];

      const escapeCsvValue = (value: string | number) => {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvLines = [
        headers.join(','),
        ...rows.map((row) => headers.map((header) => escapeCsvValue((row as any)[header] ?? '')).join(',')),
      ];

      const csv = csvLines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

      link.href = url;
      link.download = `affiliate-dashboard-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setErrorMsg(`Export complete: ${rows.length} recruits downloaded.`);
      setTimeout(() => setErrorMsg(null), 2500);
    } catch (error) {
      console.error('Export failed:', error);
      setErrorMsg('Failed to export dashboard data.');
      setTimeout(() => setErrorMsg(null), 2500);
    }
  };

  const handleProfileFieldChange = (field: keyof AffiliateProfileForm, next: string | boolean) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: next,
    }));
  };

  const handleSaveProfile = async () => {
    if (!affiliateUserId) {
      setErrorMsg('Profile save unavailable: missing affiliate account id.');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }

    setProfileSaving(true);
    try {
      const updates: Record<string, unknown> = {
        email: profileForm.email.trim() || null,
        full_name: profileForm.full_name.trim() || null,
        telegram_username: profileForm.telegram_username.trim() || null,
        discord_username: profileForm.discord_username.trim() || null,
        instagram_username: profileForm.instagram_username.trim() || null,
        facebook_username: profileForm.facebook_username.trim() || null,
        twitter_username: profileForm.twitter_username.trim() || null,
        youtube_username: profileForm.youtube_username.trim() || null,
        twitch_username: profileForm.twitch_username.trim() || null,
        tiktok_username: profileForm.tiktok_username.trim() || null,
        cell_number: profileForm.cell_number.trim() || null,
        preferred_contact_method: profileForm.preferred_contact_method.trim() || null,
        country: profileForm.country.trim() || null,
        city: profileForm.city.trim() || null,
        timezone: profileForm.timezone.trim() || null,
        birth_date: profileForm.birth_date.trim() || null,
        trading_experience_years: profileForm.trading_experience_years.trim() ? Number(profileForm.trading_experience_years.trim()) : null,
        trading_style: profileForm.trading_style.trim() || null,
        risk_tolerance: profileForm.risk_tolerance.trim() || null,
        preferred_instruments: profileForm.preferred_instruments.trim() || null,
        trading_timezone: profileForm.trading_timezone.trim() || null,
        account_balance_range: profileForm.account_balance_range.trim() || null,
        preferred_leverage: profileForm.preferred_leverage.trim() || null,
        favorite_pairs: profileForm.favorite_pairs.trim() || null,
        trading_strategy: profileForm.trading_strategy.trim() || null,
        win_rate_target: profileForm.win_rate_target.trim() ? Number(profileForm.win_rate_target.trim()) : null,
        monthly_profit_target: profileForm.monthly_profit_target.trim() || null,
        hobbies: profileForm.hobbies.trim() || null,
        personality_traits: profileForm.personality_traits.trim() || null,
        trading_goals: profileForm.trading_goals.trim() || null,
        learning_style: profileForm.learning_style.trim() || null,
        notification_preferences: profileForm.notification_preferences.trim() || null,
        preferred_chart_timeframe: profileForm.preferred_chart_timeframe.trim() || null,
        uses_automated_trading: profileForm.uses_automated_trading,
        attends_live_sessions: profileForm.attends_live_sessions,
        bio: profileForm.bio.trim() || null,
      };

      const rawSession = localStorage.getItem('bullmoney_session');
      const parsedSession = rawSession ? JSON.parse(rawSession) : null;
      const sessionPayload = {
        id: Number(parsedSession?.id || affiliateUserId),
        email: String(parsedSession?.email || profileForm.email || '').trim(),
      };

      const response = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionPayload,
          updates,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(String(result?.error || 'Failed to update account'));
      }

      if (rawSession) {
        const nextSession = {
          ...parsedSession,
          email: profileForm.email.trim() || parsedSession?.email || '',
        };
        localStorage.setItem('bullmoney_session', JSON.stringify(nextSession));
      }

      setAffiliateAttribution((prev) => ({
        ...prev,
        affiliateName: profileForm.full_name.trim() || prev.affiliateName,
        affiliateEmail: profileForm.email.trim() || prev.affiliateEmail,
      }));

      setErrorMsg('Profile saved successfully.');
      setTimeout(() => setErrorMsg(null), 2000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setErrorMsg(`Could not save profile: ${String(error?.message || 'Unknown error')}`);
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleWeeklyTask = (taskIndex: number) => {
    const key = `${currentTier.name}-${taskIndex}`;
    setWeeklyTaskChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // --- FILTER LOGIC ---
  const filteredRecruits = recruits.filter(recruit => {
    const sTerm = searchTerm.toLowerCase();
    const emailMatch = recruit.email.toLowerCase().includes(sTerm);
    const idMatch = String(recruit.mt5_id || '').includes(sTerm); 
    const codeMatch = String(recruit.affiliate_code || '').toLowerCase().includes(sTerm);
    const matchesSearch = emailMatch || idMatch || codeMatch;
    const matchesFilter = filter === 'All' || recruit.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate monthly growth
  const monthlyGrowth = earnings.last_month > 0 
    ? ((earnings.this_month - earnings.last_month) / earnings.last_month * 100).toFixed(1)
    : '0';

  type TutorialSlide = {
    id: string;
    title: string;
    summary: string;
    bullets: string[];
    ctaLabel?: string;
    ctaAction?: () => void | Promise<void>;
  };

  const tutorialSlides: TutorialSlide[] = [
    {
      id: 'goal',
      title: 'Main Goal: Get Active Traders, Not Just Clicks',
      summary: 'BullMoney affiliates are not forced to do jobs. You earn commission from trader activity. If you want faster growth, use a simple weekly plan.',
      bullets: [
        'Focus on quality referrals who are likely to connect MT5 and trade.',
        'Use this dashboard to track your progress, earnings, and next tier.',
        'Small weekly consistency beats random hard pushes.'
      ],
      ctaLabel: 'Go to Overview',
      ctaAction: () => setActiveTab('overview'),
    },
    {
      id: 'top-actions',
      title: 'Top Buttons (Header)',
      summary: 'These are your quick actions for daily use.',
      bullets: [
        'Refresh: updates dashboard numbers from live data.',
        'Notifications: shows pending recruits and payout status.',
        'Export: downloads your recruits data as CSV.'
      ],
      ctaLabel: 'Run Refresh',
      ctaAction: handleRefreshDashboard,
    },
    {
      id: 'link-tools',
      title: 'Referral Link Tools (What to Click)',
      summary: 'This is the most important area for growth and conversions.',
      bullets: [
        'Copy Link: share this in posts, DMs, and bio.',
        'Code button: quickly copy your affiliate code.',
        'Open Link / QR: test exactly what your referrals will see.'
      ],
      ctaLabel: 'Copy My Link',
      ctaAction: handleCopyLink,
    },
    {
      id: 'tabs',
      title: 'Menu Tabs Explained',
      summary: 'Use each tab for one clear job so you do not get overwhelmed.',
      bullets: [
        'Overview: check earnings, tier progress, and your key metrics.',
        'Recruits: monitor each person and who is active/pending.',
        'Earnings + Analytics: see payout flow and where growth is happening.'
      ],
      ctaLabel: 'Open Recruits Tab',
      ctaAction: () => setActiveTab('recruits'),
    },
    {
      id: 'weekly-tasks',
      title: 'Weekly Tasks by Tier (1-3 Tasks, 1-90 Minutes)',
      summary: `Your current tier is ${currentTier.name}. Tasks stay realistic and optional.` ,
      bullets: [
        'Starter levels begin very easy and quick.',
        'Higher tiers get more strategic tasks, not impossible tasks.',
        'Choose the tasks that match your time this week.'
      ],
    },
    {
      id: 'social-growth',
      title: 'How to Grow Your Socials as a Trader Affiliate',
      summary: 'You do not need to be famous. You need trust, clarity, and consistency.',
      bullets: [
        'Post simple educational content: beginner tips, risk basics, market habits.',
        'Share proof of process (not hype): routines, lessons, and helpful insights.',
        'Use a clean CTA: “If you want to start, use my link and I will guide you.”'
      ],
      ctaLabel: 'Open Analytics Tab',
      ctaAction: () => setActiveTab('analytics'),
    },
    {
      id: 'networking',
      title: 'Networking Plan (Simple English)',
      summary: 'Networking means building real relationships, not spamming links.',
      bullets: [
        'Message warm contacts first (friends, old clients, trader groups).',
        'Ask one question before pitching: “Are you trading now or learning?”',
        'Give value first, then send your referral link with clear next steps.'
      ],
      ctaLabel: 'Open Link to Test Flow',
      ctaAction: handleOpenReferralLink,
    },
    {
      id: 'growth-plan',
      title: '4-Week Growth Plan to Reach Next Tier',
      summary: nextTier
        ? `Your next tier is ${nextTier.name}. Keep it focused and measurable.`
        : 'You are already at max tier. Focus on quality and retention.',
      bullets: [
        'Week 1: profile cleanup + referral link setup + 1 post.',
        'Week 2: outreach sprint + follow-up + 1 trader onboarding.',
        'Week 3-4: repeat what works, track conversions, and optimize.'
      ],
      ctaLabel: 'View Earnings',
      ctaAction: () => setActiveTab('earnings'),
    },
  ];

  const activeTutorialSlide = tutorialSlides[tutorialIndex];

  const handleTutorialCta = async () => {
    if (!activeTutorialSlide?.ctaAction) return;

    await Promise.resolve(activeTutorialSlide.ctaAction());

    const closeAfterAction = new Set(['goal', 'tabs', 'social-growth', 'growth-plan']);
    if (closeAfterAction.has(activeTutorialSlide.id)) {
      setShowTutorial(false);
    }
  };

  const handleNextTutorialSlide = () => {
    setTutorialIndex((prev) => Math.min(prev + 1, tutorialSlides.length - 1));
  };

  const handlePrevTutorialSlide = () => {
    setTutorialIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleToggleTutorialPanel = () => {
    setShowTutorial((prev) => {
      const next = !prev;
      if (next) setShowProfileManager(false);
      return next;
    });
  };

  const handleToggleProfileManagerPanel = () => {
    setShowProfileManager((prev) => {
      const next = !prev;
      if (next) setShowTutorial(false);
      return next;
    });
  };

  const handleOpenProfileManagerFromTutorial = () => {
    setShowTutorial(false);
    setShowProfileManager(true);
  };

  const mt5ConnectedCount = useMemo(() => {
    return recruits.filter((recruit) => Boolean(recruit.mt5_id && String(recruit.mt5_id).length > 3)).length;
  }, [recruits]);

  const activeTradingCount = useMemo(() => {
    return recruits.filter((recruit) => Number(recruit.total_lots_traded || 0) > 0).length;
  }, [recruits]);

  const funnelData = useMemo(() => {
    const linkClicks = Number(stats.linkClicks || 0);
    const registrations = Number(stats.total || 0);
    const mt5Connected = Number(mt5ConnectedCount || 0);
    const activeTrading = Number(activeTradingCount || 0);

    const registrationPct = linkClicks > 0 ? Math.round((registrations / linkClicks) * 100) : 0;
    const mt5Pct = registrations > 0 ? Math.round((mt5Connected / registrations) * 100) : 0;
    const activePct = mt5Connected > 0 ? Math.round((activeTrading / mt5Connected) * 100) : 0;

    return [
      { label: 'Link Clicks', value: linkClicks, percentage: linkClicks > 0 ? 100 : 0 },
      { label: 'Registrations', value: registrations, percentage: registrationPct },
      { label: 'MT5 Connected', value: mt5Connected, percentage: mt5Pct },
      { label: 'Active Trading', value: activeTrading, percentage: activePct },
    ];
  }, [stats.linkClicks, stats.total, mt5ConnectedCount, activeTradingCount]);

  // --- UNAUTHORIZED STATE ---
  if (!loading && !isAuthorized) {
    return (
      <div className="bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-black/10 p-8 rounded-2xl max-w-md w-full text-center shadow-lg">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-black mb-2">Access Restricted</h2>
          <p className="text-black/45 text-sm mb-4">Sign in to access your affiliate dashboard</p>
          <button onClick={onBack} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-black/5 transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className={cn(
      "affiliate-dashboard-reset bg-white text-black font-sans selection:bg-black/20"
    )}>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 relative z-10">
        
        {/* TOP NAVIGATION BAR - Improved mobile/desktop layout */}
        <header className="relative z-30 flex-shrink-0 mb-6 md:mb-8 bg-white border border-black/10 rounded-2xl p-4">
          {/* Mobile: Stack vertically, Desktop: Horizontal */}
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3 md:mb-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="p-2 sm:p-2.5 rounded-lg bg-white hover:bg-black/5 text-black border border-black/15 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-black truncate">
                  Affiliate Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-black/60 mt-0.5 hidden sm:block">Track, manage & grow your affiliate network</p>
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={handleRefreshDashboard}
                className="p-2.5 rounded-lg bg-white hover:bg-black/5 text-black border border-black/15 transition-all"
                title="Refresh Data"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={handleShowNotifications}
                className="p-2.5 rounded-lg bg-white hover:bg-black/5 text-black border border-black/15 transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black font-semibold text-sm transition-all bg-white hover:bg-black/5 border border-black/20"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              <button
                onClick={handleToggleTutorialPanel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black font-semibold text-sm transition-all bg-white hover:bg-black/5 border border-black/20"
              >
                <MessageSquare className="w-4 h-4" /> {showTutorial ? 'Hide Tutorial' : 'Tutorial'}
              </button>
              <button
                onClick={handleToggleProfileManagerPanel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black font-semibold text-sm transition-all bg-white hover:bg-black/5 border border-black/20"
              >
                <Settings className="w-4 h-4" /> {showProfileManager ? 'Hide Profile' : 'Profile Manager'}
              </button>
              {isAffiliateAdmin && (
                <button
                  onClick={() => setShowAdminContentEditor(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-amber-500 hover:bg-amber-400 text-black border border-amber-600"
                  title="Edit Dashboard Content"
                >
                  <Shield className="w-4 h-4" /> Admin
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Tier badge + action buttons row */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-white text-black border-black/20">
              {React.createElement(getTierIcon(currentTier.icon), { className: "w-3 h-3" })}
              {currentTier.name}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRefreshDashboard}
                className="p-2 rounded-lg bg-white hover:bg-black/5 text-black border border-black/15 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={handleShowNotifications}
                className="p-2 rounded-lg bg-white hover:bg-black/5 text-black border border-black/15 transition-all"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadReport}
                className="p-2 rounded-lg transition-all bg-white text-black border border-black/20 hover:bg-black/5"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleTutorialPanel}
                className="p-2 rounded-lg transition-all bg-white text-black border border-black/20 hover:bg-black/5"
                title="Affiliate Tutorial"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleProfileManagerPanel}
                className="p-2 rounded-lg transition-all bg-white text-black border border-black/20 hover:bg-black/5"
                title="Profile Manager"
              >
                <Settings className="w-4 h-4" />
              </button>
              {isAffiliateAdmin && (
                <button
                  onClick={() => setShowAdminContentEditor(true)}
                  className="p-2 rounded-lg transition-all bg-amber-500 text-black border border-amber-600 hover:bg-amber-400"
                  title="Admin: Edit Dashboard"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop tier badge - inline with title */}
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-2 bg-white text-black border-black/20">
            {React.createElement(getTierIcon(currentTier.icon), { className: "w-3.5 h-3.5" })}
            {currentTier.name} Partner
          </div>
        </header>

        {showTutorial && (
          <div className="mb-6 rounded-2xl border border-black/15 bg-white p-4 md:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-bold text-black">Affiliate Tutorial & Growth Plan</h3>
                <p className="text-xs md:text-sm text-black/60 mt-1">
                  Simple guide to each menu/button, how the program works, and what to do each week.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenProfileManagerFromTutorial}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5"
                  title="Open Profile Manager"
                >
                  Profile Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowTutorial(false)}
                  className="p-2 rounded-lg bg-white hover:bg-black/5 border border-black/15"
                  title="Close tutorial"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border border-black/10 bg-white p-4 md:p-5 md:px-12">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                  Step {tutorialIndex + 1} of {tutorialSlides.length}
                </span>
                <span className="text-[11px] text-black/45">{activeTutorialSlide.id.replace('-', ' ')}</span>
              </div>

              <button
                type="button"
                onClick={handlePrevTutorialSlide}
                disabled={tutorialIndex === 0}
                className="hidden md:inline-flex absolute left-2 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 rounded-full text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous tutorial step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextTutorialSlide}
                disabled={tutorialIndex === tutorialSlides.length - 1}
                className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 rounded-full text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next tutorial step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <h4 className="text-sm md:text-base font-bold text-black mb-1">{activeTutorialSlide.title}</h4>
              <p className="text-xs md:text-sm text-black/65 mb-3">{activeTutorialSlide.summary}</p>

              <ul className="space-y-2">
                {activeTutorialSlide.bullets.map((item) => (
                  <li key={item} className="text-xs md:text-sm text-black/80 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-black" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {activeTutorialSlide.ctaLabel && activeTutorialSlide.ctaAction && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleTutorialCta}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5"
                  >
                    {activeTutorialSlide.ctaLabel}
                  </button>
                </div>
              )}

              {activeTutorialSlide.id === 'weekly-tasks' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {AFFILIATE_TIERS.map((tier) => {
                    const tierTasks = TIER_WEEKLY_TASKS[tier.name] || [];
                    const isCurrent = tier.name === currentTier.name;
                    return (
                      <div
                        key={tier.name}
                        className={cn(
                          "rounded-xl border p-3",
                          isCurrent ? "border-black/35 bg-black/5" : "border-black/15 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-black">{tier.name}</p>
                          <span className="text-[10px] text-black/55">{tier.minTraders}+ active</span>
                        </div>
                        <div className="space-y-2">
                          {tierTasks.map((task) => (
                            <div key={`${tier.name}-${task.title}`} className="rounded-lg border border-black/10 p-2">
                              <p className="text-[11px] font-semibold text-black">{task.title}</p>
                              <p className="text-[10px] text-black/55 mt-0.5">{task.timeMinutes} min • {task.whyItMatters}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTutorialSlide.id === 'growth-plan' && (
                <div className="mt-4 rounded-xl border border-black/10 p-3 bg-black/5">
                  <p className="text-xs font-semibold text-black mb-2">Weekly rhythm (not forced):</p>
                  <ul className="space-y-1.5 text-[11px] text-black/80">
                    <li>Week 1: Setup and clarity (profile, link, one post).</li>
                    <li>Week 2: Outreach and follow-up (quality conversations).</li>
                    <li>Week 3: Activation help (guide leads to MT5 connection).</li>
                    <li>Week 4: Review metrics and double down on what worked.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 md:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm md:text-base font-bold text-black">This Week Tasks ({currentTier.name})</h4>
                  <p className="text-xs text-black/60">Week {currentWeekKey} • {completedWeeklyTaskCount}/{currentTierTasks.length} completed</p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full border border-black/20 bg-white text-black/70">
                  Optional Growth Mode
                </span>
              </div>
              <div className="space-y-2">
                {currentTierTasks.map((task, idx) => {
                  const checkKey = `${currentTier.name}-${idx}`;
                  const checked = Boolean(weeklyTaskChecks[checkKey]);
                  return (
                    <button
                      key={`${task.title}-${idx}`}
                      onClick={() => toggleWeeklyTask(idx)}
                      className={cn(
                        "w-full text-left rounded-lg border p-3 transition-colors",
                        checked ? "border-black/30 bg-black/5" : "border-black/15 bg-white hover:bg-black/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className={cn("w-4 h-4 mt-0.5 shrink-0", checked ? "text-black" : "text-black/30")} />
                        <div>
                          <p className="text-xs font-semibold text-black">{task.title}</p>
                          <p className="text-[11px] text-black/55 mt-0.5">{task.timeMinutes} min • {task.whyItMatters}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrevTutorialSlide}
                disabled={tutorialIndex === 0}
                className="inline-flex md:hidden items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex items-center gap-1">
                {tutorialSlides.map((slide, idx) => (
                  <button
                    type="button"
                    key={slide.id}
                    onClick={() => setTutorialIndex(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      tutorialIndex === idx ? "w-6 bg-black" : "w-2 bg-black/20 hover:bg-black/35"
                    )}
                    title={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNextTutorialSlide}
                disabled={tutorialIndex === tutorialSlides.length - 1}
                className="inline-flex md:hidden items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {showProfileManager && (
          <div className="mb-6">
            <ProfileManger
              value={profileForm}
              onChange={handleProfileFieldChange}
              onSave={handleSaveProfile}
              saving={profileSaving}
              completionPercent={profileCompletionPercent}
            />
          </div>
        )}

        {/* ERROR MSG */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-white border border-black/20 flex items-center gap-3 text-black"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </motion.div>
        )}

        {/* REFERRAL LINK BANNER - Improved mobile layout */}
        <div className={cn(
          "relative z-10 shrink-0 mb-6 md:mb-8 p-4 md:p-6 rounded-2xl border",
          "bg-white border-black/20"
        )}>
          <div className="hidden" aria-hidden="true">
            <QRCodeCanvas id="affiliate-referral-qr-export" value={referralLink} size={512} includeMargin />
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-black/5 text-black">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-black text-base">Your Referral Link</h3>
                <p className="text-xs text-black/45">Share to earn commissions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center bg-black/5">
                <p className="text-xl font-black text-black">{currentTier.commissionPercent}%</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Commission</p>
              </div>
              <div className="p-3 rounded-xl text-center bg-black/5">
                <p className="text-xl font-black text-black">${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Per Lot</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border text-xs font-mono break-all leading-relaxed bg-white border-black/20 text-black">
              {referralLink}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all bg-white border-black/20 text-black active:bg-black/10"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all bg-white border-black/20 text-black active:bg-black/10"
              >
                <Tag className="w-4 h-4" />
                {copiedCode ? 'Copied!' : myTrackingCode}
              </button>
            </div>

            <div className="rounded-xl border border-black/20 p-4 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-black">Referral QR Code</p>
                  <p className="text-xs text-black/55">Clients can scan and auto-fill your code in pagemode.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrProfileModal((prev) => !prev)}
                  className="rounded-lg border border-black/20 bg-white p-1 hover:bg-black/5"
                  title="Show QR card details"
                >
                  <QRCodeSVG value={referralLink} size={84} includeMargin />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={handleOpenReferralLink}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5"
                >
                  Open Link
                </button>
                <button
                  onClick={handleDownloadQrCode}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5"
                >
                  Download QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrProfileModal((prev) => !prev)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 col-span-2"
                >
                  {showQrProfileModal ? 'Hide QR Card Details' : 'Show QR Card Details'}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl shrink-0 bg-black/5 text-black">
                <Link2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-black text-lg">Your Referral Link</h3>
                <p className="text-sm text-black/45 mb-3">Share this link to earn commissions on every trade your referrals make</p>
                <div className="flex items-center gap-3">
                  <code className="px-3 py-2 rounded-lg text-sm font-mono border truncate max-w-[450px] bg-white border-black/20 text-black">
                    {referralLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all shrink-0 bg-white border-black/20 text-black hover:bg-black/5"
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all shrink-0 bg-white border-black/20 text-black hover:bg-black/5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {copiedCode ? 'Copied!' : myTrackingCode}
                  </button>
                  <button
                    onClick={handleOpenReferralLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all shrink-0 bg-white border-black/20 text-black hover:bg-black/5"
                  >
                    Open Link
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l border-black/10 pl-6 shrink-0">
              <div className="rounded-xl border border-black/20 p-2 bg-white">
                <button
                  type="button"
                  onClick={() => setShowQrProfileModal((prev) => !prev)}
                  className="rounded-md p-0.5 hover:bg-black/5"
                  title="Show QR card details"
                >
                  <QRCodeSVG value={referralLink} size={92} includeMargin />
                </button>
                <button
                  onClick={handleDownloadQrCode}
                  className="w-full mt-2 px-2 py-1.5 rounded-md text-[11px] font-semibold border border-black/20 bg-white hover:bg-black/5"
                >
                  Download QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrProfileModal((prev) => !prev)}
                  className="w-full mt-1 px-2 py-1.5 rounded-md text-[11px] font-semibold border border-black/20 bg-white hover:bg-black/5"
                >
                  {showQrProfileModal ? 'Hide Card Details' : 'Show Card Details'}
                </button>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-black">{currentTier.commissionPercent}%</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Commission</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-black">${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Per Lot</p>
              </div>
            </div>
          </div>
        </div>

        {showQrProfileModal && (
          <div className="mb-6 rounded-2xl border border-black/15 bg-white shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="p-4 md:p-6 sticky top-0 bg-white border-b border-black/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-black/50">BullMoney</p>
                <h3 className="text-lg md:text-xl font-bold text-black">Affiliate QR Card</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrProfileModal(false)}
                className="p-2 rounded-lg border border-black/20 bg-white hover:bg-black/5 shrink-0"
                title="Close QR card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <div className="rounded-xl border border-black/15 bg-black/2 p-5 md:p-6 text-center mb-4">
                <p className="text-2xl font-black text-black mb-1">BullMoney</p>
                <p className="text-sm font-semibold text-black">{affiliateDisplayName}</p>
                <p className="text-xs text-black/60 mb-4">
                  Code: {(myTrackingCode && myTrackingCode !== 'Loading...' && myTrackingCode !== 'No Code Found') ? myTrackingCode : 'PARTNER'}
                </p>

                <button
                  type="button"
                  onClick={handleAutoSaveQrProfileImages}
                  className="inline-flex rounded-xl border border-black/20 bg-white p-2 hover:bg-black/5 transition-colors"
                  title="Tap to auto-save PNG and JPEG"
                >
                  <QRCodeSVG value={referralLink} size={210} includeMargin />
                </button>

                <p className="mt-2 text-[11px] font-medium text-black/55">Tap QR to auto-save PNG + JPEG</p>

                <p className="mt-4 text-sm font-semibold text-black break-all">{shortReferralDisplay}</p>
                <p className="mt-1 text-xs text-black/55">{bullMoneyShortInfo}</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-black/15 bg-black/2 p-3">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide mb-2">Email this QR card</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={qrEmailInput}
                      onChange={(e) => setQrEmailInput(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="flex-1 px-3 py-2.5 rounded-lg text-sm border border-black/20 bg-white text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                    <button
                      type="button"
                      onClick={handleSendQrCardToGmail}
                      disabled={qrEmailSending}
                      className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors disabled:opacity-60"
                    >
                      {qrEmailSending ? 'Sending...' : 'Send to Gmail'}
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-black/60 uppercase tracking-wide">Download Options</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button type="button" onClick={() => handleDownloadQrProfileImage('png')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">PNG</button>
                  <button type="button" onClick={() => handleDownloadQrProfileImage('jpeg')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">JPEG</button>
                  <button type="button" onClick={handleDownloadQrProfileSvg} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">SVG</button>
                  <button type="button" onClick={() => handleDownloadQrProfileDataFile('csv')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Excel</button>
                  <button type="button" onClick={() => handleDownloadQrProfileDataFile('doc')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Word</button>
                  <button type="button" onClick={() => handleDownloadQrProfileDataFile('txt')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Text</button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-black/10">
                <div className="text-xs font-semibold text-black/60 uppercase tracking-wide mb-3">Share On Social</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button type="button" onClick={handleShareQrCard} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Share</button>
                  <button type="button" onClick={() => handleOpenSocialShare('instagram')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Instagram</button>
                  <button type="button" onClick={() => handleOpenSocialShare('facebook')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">Facebook</button>
                  <button type="button" onClick={() => handleOpenSocialShare('whatsapp')} className="px-3 py-2.5 rounded-lg text-xs font-semibold border border-black/20 bg-white hover:bg-black/5 transition-colors">WhatsApp</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION - Improved mobile sizing */}
        <div className="relative z-20 shrink-0 flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide bg-white border border-black/10 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-2 rounded-xl">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-black/10 text-black border border-black/20"
                  : "text-black/60 hover:text-black hover:bg-black/5 border border-transparent"
              )}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* EARNINGS SUMMARY TABLE */}
              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
                <table className="w-full table-fixed text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-black/5 text-[10px] sm:text-xs uppercase text-black/45 font-medium">
                      <th className="p-3 sm:p-4 pl-4 sm:pl-6">Metric</th>
                      <th className="p-3 sm:p-4">Amount</th>
                      <th className="p-3 sm:p-4 pr-4 sm:pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    <tr className="hover:bg-black/5 transition-colors">
                      <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-semibold text-black">Total Earnings</td>
                      <td className="p-3 sm:p-4 font-bold text-black">{formatCurrency(earnings.total_earnings)}</td>
                      <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-black/55">{liveSyncLabel}</td>
                    </tr>
                    <tr className="hover:bg-black/5 transition-colors">
                      <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-semibold text-black">This Month</td>
                      <td className="p-3 sm:p-4 font-bold text-black">{formatCurrency(liveThisMonthEarnings)}</td>
                      <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-black/55">{currentMonthLabel}</td>
                    </tr>
                    <tr className="hover:bg-black/5 transition-colors">
                      <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-semibold text-black">Pending Payout</td>
                      <td className="p-3 sm:p-4 font-bold text-black">{formatCurrency(earnings.pending_earnings)}</td>
                      <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-black/55">{earnings.pending_earnings > 0 ? 'Processing' : 'No pending payout'}</td>
                    </tr>
                    <tr className="hover:bg-black/5 transition-colors">
                      <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-semibold text-black">Already Paid</td>
                      <td className="p-3 sm:p-4 font-bold text-black">{formatCurrency(earnings.paid_earnings)}</td>
                      <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-black/55">{earnings.paid_earnings > 0 ? 'Withdrawn' : 'No withdrawals'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TIER PROGRESSION - compact and live */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-black">Tier Progression</h3>
                      <p className="text-xs text-black/50">Live from SQL metrics</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-black/5 text-black/60">
                      {liveSyncLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {React.createElement(getTierIcon(currentTier.icon), {
                      className: "w-4 h-4",
                      style: { color: currentTier.color },
                    })}
                    <span className="text-sm font-semibold text-black">{currentTier.name}</span>
                    <span className="text-xs text-black/50">{currentTier.commissionPercent}% commission</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-black/55">{nextTier ? `Progress to ${nextTier.name}` : 'Max tier reached'}</span>
                      <span className="text-black/75">{stats.active} active</span>
                    </div>
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tierProgress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          isXMUser ? 'bg-linear-to-r from-red-600 to-orange-500' : 'bg-black'
                        )}
                      />
                    </div>
                    <p className="text-[11px] text-black/50 mt-1.5">
                      {nextTier
                        ? `${Math.max(nextTier.minTraders - stats.active, 0)} more active traders to unlock ${nextTier.name}`
                        : 'You are at the highest commission tier.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AFFILIATE_TIERS.map((tier) => {
                      const isCurrent = tier.name === currentTier.name;
                      const isUnlocked = stats.active >= tier.minTraders;
                      return (
                        <div
                          key={tier.name}
                          className={cn(
                            'rounded-lg border px-2.5 py-2 text-center',
                            isCurrent
                              ? 'border-black/30 bg-black/5'
                              : isUnlocked
                                ? 'border-black/10 bg-white'
                                : 'border-black/5 bg-black/[0.02] opacity-60'
                          )}
                        >
                          <p className="text-[11px] font-semibold text-black truncate">{tier.name}</p>
                          <p className="text-[10px] text-black/50">{tier.minTraders}+</p>
                          <p className="text-[11px] font-semibold" style={{ color: tier.color }}>{tier.commissionPercent}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-black/10 rounded-2xl p-4 md:p-5">
                  <h3 className="text-sm font-bold text-black mb-3">Current Tier Benefits</h3>
                  <div className="space-y-2.5">
                    {currentTier.perks.slice(0, 3).map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black mt-0.5" />
                        <span className="text-xs text-black/65 leading-relaxed">{perk}</span>
                      </div>
                    ))}
                  </div>
                  {nextTier && (
                    <div className="mt-4 pt-3 border-t border-black/5 text-xs text-black/55">
                      Next unlock: <span className="font-semibold text-black">{nextTier.name}</span> ({nextTier.commissionPercent}%)
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT SETUP - Skrill */}
              <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
                <div className="p-4 md:p-5 border-b border-black/5 flex items-start gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl shrink-0",
                    isXMUser ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-500"
                  )}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black">Payment Setup</h3>
                    <p className="text-xs text-black/50 mt-0.5">Set up Skrill to receive your affiliate commissions</p>
                  </div>
                </div>

                <div className="p-4 md:p-5 space-y-4">
                  {/* Why Skrill */}
                  <div className="bg-linear-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-4 border border-purple-500/10">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#8B2B8B"/>
                          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#8B2B8B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-black text-sm">Why Skrill?</h4>
                        <p className="text-xs text-black/60 mt-1 leading-relaxed">
                          Skrill is our preferred payment method for fast, secure international transfers. 
                          No bank hassles, low fees, and instant access to your funds worldwide.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Setup Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-black">Quick Setup (2 mins)</h4>
                    <div className="grid gap-2.5">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-black/2 border border-black/5">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">1</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">Create a Skrill Account</p>
                          <p className="text-xs text-black/50 mt-0.5">Sign up free and verify your email</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-black/2 border border-black/5">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">2</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">Verify Your Identity</p>
                          <p className="text-xs text-black/50 mt-0.5">Upload ID for full account access</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-black/2 border border-black/5">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">3</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black">Share Your Skrill Email</p>
                          <p className="text-xs text-black/50 mt-0.5">Update your profile with your Skrill email to receive payments</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Apps */}
                  <div className="pt-3 border-t border-black/5">
                    <h4 className="text-sm font-semibold text-black mb-3">Download Skrill App</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <a
                        href="https://apps.apple.com/app/skrill/id311462091"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-black/50 uppercase tracking-wide">Download on the</p>
                          <p className="text-sm font-semibold text-black">App Store</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/30 group-hover:text-black/60 transition-colors shrink-0" />
                      </a>

                      <a
                        href="https://play.google.com/store/apps/details?id=com.skrill.android.wallet"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                            <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5zm5.5-2.5l7-6-7-6v12z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-black/50 uppercase tracking-wide">Get it on</p>
                          <p className="text-sm font-semibold text-black">Google Play</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/30 group-hover:text-black/60 transition-colors shrink-0" />
                      </a>

                      <a
                        href="https://www.skrill.com/en/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-black/10 bg-white hover:bg-black/5 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-black/50 uppercase tracking-wide">Sign up at</p>
                          <p className="text-sm font-semibold text-black">Skrill.com</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-black/30 group-hover:text-black/60 transition-colors shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      <span className="font-semibold">Pro tip:</span> Use the same email for Skrill that you used to sign up. 
                      This makes payout matching instant and avoids delays.
                    </p>
                  </div>
                </div>
              </div>

              {/* QUICK STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickStatCard
                  label="Total Recruits"
                  value={stats.total}
                  icon={Users}
                  isXMUser={isXMUser}
                />
                <QuickStatCard
                  label="Active Traders"
                  value={stats.active}
                  icon={CheckCircle2}
                  color="green"
                  isXMUser={isXMUser}
                />
                <QuickStatCard
                  label="Conversion Rate"
                  value={stats.conversionRate}
                  icon={PieChart}
                  color="purple"
                  isXMUser={isXMUser}
                />
                <QuickStatCard
                  label="Total Lots Traded"
                  value={formatNumber(earnings.lifetime_lots, 1)}
                  icon={BarChart3}
                  color="orange"
                  isXMUser={isXMUser}
                />
              </div>

              {/* RECENT RECRUITS PREVIEW */}
              <div className="relative z-10 bg-white border border-black/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-black/5 flex items-center justify-between">
                  <h3 className="font-bold text-black">Recent Recruits</h3>
                  <button
                    onClick={() => setActiveTab('recruits')}
                    className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      isXMUser ? "text-red-400 hover:text-red-300" : "text-black hover:text-black"
                    )}
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredRecruits.slice(0, 5).map((recruit) => (
                    <div
                      key={recruit.id}
                      onClick={() => setSelectedRecruit(recruit)}
                      className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          recruit.status === 'Active'
                            ? isXMUser ? "bg-red-500/20 text-red-300" : "bg-black/20 text-black"
                            : "bg-black/5 text-black/50"
                        )}>
                          {recruit.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{maskEmail(recruit.email)}</p>
                          <p className="text-xs text-black/50">{formatDate(recruit.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-mono text-black">
                            {recruit.status === 'Active' ? `${formatNumber(recruit.total_lots_traded || 0, 1)} lots` : '---'}
                          </p>
                          <p className="text-xs text-black/50">
                            {recruit.status === 'Active' ? formatCurrency(recruit.estimated_earnings || 0) : 'Pending'}
                          </p>
                        </div>
                        <StatusBadge status={recruit.status || 'Pending'} />
                      </div>
                    </div>
                  ))}
                  {filteredRecruits.length === 0 && (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-black mb-1">No Recruits Yet</h3>
                      <p className="text-sm text-black/50">Share your referral link to start building your network</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recruits' && (
            <motion.div
              key="recruits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* RECRUITS LIST SECTION - Improved mobile layout */}
              <div className="relative z-10 bg-white border border-black/10 rounded-xl md:rounded-2xl overflow-hidden">

                {/* Controls - Stack on mobile */}
                <div className="relative z-10 shrink-0 p-3 md:p-4 border-b border-black/5 flex flex-col gap-3 bg-white/80">
                  {/* Search bar */}
                  <div className="relative w-full group">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 transition-colors",
                      isXMUser ? "group-focus-within:text-red-400" : "group-focus-within:text-black"
                    )} />
                    <input
                      type="text"
                      placeholder="Search email, MT5 ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={cn(
                        "w-full bg-white border border-black/10 rounded-lg pl-10 pr-4 py-2 md:py-2.5 text-sm text-black focus:outline-none transition-all placeholder:text-black/45",
                        isXMUser ? "focus:border-red-500/50" : "focus:border-black/50"
                      )}
                    />
                  </div>

                  {/* Filter and view controls - side by side */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1 bg-black/5 p-1 rounded-lg flex-1 sm:flex-none">
                      {(['All', 'Active', 'Pending'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={cn(
                            "flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap",
                            filter === f
                              ? isXMUser
                                ? "bg-red-500 text-black"
                                : "bg-white text-black"
                              : "text-black/45 hover:text-black"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 bg-black/5 p-1 rounded-lg shrink-0">
                      <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-md transition-all",
                          viewMode === 'table' ? "bg-black/10 text-black" : "text-black/50 hover:text-black"
                        )}
                        title="Table view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-md transition-all",
                          viewMode === 'cards' ? "bg-black/10 text-black" : "text-black/50 hover:text-black"
                        )}
                        title="Card view"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'table' ? (
                  /* Table View */
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-left border-collapse text-[10px] sm:text-xs md:text-sm">
                      <thead>
                        <tr className="bg-black/5 text-[9px] sm:text-xs uppercase text-black/45 font-medium">
                          <th className="p-1.5 sm:p-4 pl-2 sm:pl-6">Recruit</th>
                          <th className="p-1.5 sm:p-4">Join</th>
                          <th className="p-1.5 sm:p-4">MT5</th>
                          <th className="p-1.5 sm:p-4">Lots</th>
                          <th className="p-1.5 sm:p-4">Earn</th>
                          <th className="p-1.5 sm:p-4">St</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loading && recruits.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-black/50">Loading affiliate data...</td></tr>
                        ) : filteredRecruits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center opacity-50">
                                <Users className="w-12 h-12 text-black/50 mb-4" />
                                <h3 className="text-lg font-bold text-black">No Recruits Found</h3>
                                <p className="text-sm text-black/45">
                                  {searchTerm ? 'No matches for your search' : 'Share your link to start recruiting!'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredRecruits.map((recruit) => (
                            <motion.tr 
                              key={recruit.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              onClick={() => setSelectedRecruit(recruit)}
                              className="group hover:bg-black/5 transition-colors cursor-pointer active:bg-black/8"
                            >
                              <td className="p-1.5 sm:p-4 pl-2 sm:pl-6">
                                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                                  <div className={cn(
                                    "w-5 h-5 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[9px] sm:text-sm font-bold border transition-colors shrink-0",
                                    recruit.status === 'Active'
                                      ? isXMUser 
                                        ? "bg-red-500/20 text-red-300 border-red-500/20" 
                                        : "bg-black/20 text-black border-black/20"
                                      : "bg-black/5 text-black/50 border-black/5"
                                  )}>
                                    {recruit.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] sm:text-sm font-medium text-black truncate">{maskEmail(recruit.email)}</p>
                                    <p className="hidden sm:block text-[10px] text-black/50 font-mono">#{formatId(recruit.id)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-1.5 sm:p-4">
                                <p className="text-[10px] sm:text-sm text-black">{formatDate(recruit.created_at)}</p>
                                <p className="hidden sm:block text-[10px] text-black/50">{formatTime(recruit.created_at)}</p>
                              </td>
                              <td className="p-1.5 sm:p-4">
                                {recruit.mt5_id ? (
                                  <span className={cn(
                                    "font-mono text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border",
                                    isXMUser 
                                      ? "bg-red-500/10 text-red-300 border-red-500/20" 
                                      : "bg-black/10 text-black border-black/20"
                                  )}>
                                    {recruit.mt5_id}
                                  </span>
                                ) : (
                                  <span className="text-[9px] sm:text-xs text-slate-600">—</span>
                                )}
                              </td>
                              <td className="p-1.5 sm:p-4">
                                <p className="text-[10px] sm:text-sm font-mono text-black">
                                  {recruit.status === 'Active' ? formatNumber(recruit.total_lots_traded || 0, 2) : '0.00'}
                                </p>
                              </td>
                              <td className="p-1.5 sm:p-4">
                                <p className={cn(
                                  "text-[10px] sm:text-sm font-bold",
                                  recruit.status === 'Active' 
                                    ? "text-black" 
                                    : "text-slate-600"
                                )}>
                                  {recruit.status === 'Active' 
                                    ? formatCurrency(recruit.estimated_earnings || 0)
                                    : '$0.00'
                                  }
                                </p>
                              </td>
                              <td className="p-1.5 sm:p-4">
                                <span className="sm:hidden text-[10px] font-semibold text-black">
                                  {recruit.status === 'Active' ? 'A' : 'P'}
                                </span>
                                <span className="hidden sm:inline">
                                  <StatusBadge status={recruit.status || 'Pending'} />
                                </span>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Card View */
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecruits.length === 0 ? (
                      <div className="col-span-full p-12 text-center">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-black mb-1">No Recruits Found</h3>
                        <p className="text-sm text-black/50">Share your link to start recruiting!</p>
                      </div>
                    ) : (
                      filteredRecruits.map((recruit) => (
                        <motion.div
                          key={recruit.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedRecruit(recruit)}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02]",
                            recruit.status === 'Active'
                              ? isXMUser 
                                ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                                : "bg-black/5 border-black/20 hover:border-black/40"
                              : "bg-black/5 border-black/10 hover:border-black/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                                recruit.status === 'Active'
                                  ? isXMUser ? "bg-red-500/20 text-red-300" : "bg-black/20 text-black"
                                  : "bg-black/5 text-black/50"
                              )}>
                                {recruit.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-black">{maskEmail(recruit.email)}</p>
                                <p className="text-xs text-black/50">Joined {formatDate(recruit.created_at)}</p>
                              </div>
                            </div>
                            <StatusBadge status={recruit.status || 'Pending'} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 rounded-lg p-3">
                              <p className="text-[10px] text-black/50 uppercase tracking-wide mb-1">Lots Traded</p>
                              <p className="text-lg font-mono font-bold text-black">
                                {recruit.status === 'Active' ? formatNumber(recruit.total_lots_traded || 0, 1) : '0.0'}
                              </p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                              <p className="text-[10px] text-black/50 uppercase tracking-wide mb-1">Your Earnings</p>
                              <p className={cn(
                                "text-lg font-bold",
                                recruit.status === 'Active' ? "text-black" : "text-slate-600"
                              )}>
                                {recruit.status === 'Active' 
                                  ? formatCurrency(recruit.estimated_earnings || 0)
                                  : '$0.00'
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {/* Pagination Footer */}
                <div className="p-4 border-t border-black/5 flex items-center justify-between">
                  <p className="text-sm text-black/50">
                    Showing <span className="text-black font-medium">{filteredRecruits.length}</span> of {stats.total} recruits
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/50">
                      {stats.active} active • {stats.pending} pending
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Earnings Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={cn(
                  "p-6 rounded-2xl border",
                  isXMUser 
                    ? "bg-linear-to-br from-red-950/50 to-orange-950/50 border-red-500/20" 
                    : "bg-linear-to-br from-cyan-950/50 to-cyan-950/50 border-black/20"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      isXMUser ? "bg-red-500/20 text-red-400" : "bg-black/20 text-black"
                    )}>
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-black bg-black/10 px-2 py-1 rounded-full">
                      +{monthlyGrowth}%
                    </span>
                  </div>
                  <p className="text-sm text-black/45 mb-1">Total Lifetime Earnings</p>
                  <p className="text-3xl font-black text-black">
                    {formatCurrency(earnings.total_earnings + earnings.this_month)}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-black/45 mb-1">Pending Payout</p>
                  <p className="text-3xl font-black text-black">
                    {formatCurrency(earnings.pending_earnings + earnings.this_month * 0.8)}
                  </p>
                  <p className="text-xs text-black/50 mt-2">Next payout: First week of Feb</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-black/10 text-black">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-black/45 mb-1">Already Withdrawn</p>
                  <p className="text-3xl font-black text-black">
                    {formatCurrency(earnings.paid_earnings)}
                  </p>
                  <p className="text-xs text-black/50 mt-2">Across all payouts</p>
                </div>
              </div>

              {/* Commission Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-black mb-6">Commission Structure</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
                        )}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-black">Your Commission Rate</p>
                          <p className="text-xs text-black/50">{currentTier.name} Tier</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-black">{currentTier.commissionPercent}%</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
                        )}>
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-black">Per Lot Rate</p>
                          <p className="text-xs text-black/50">{isXMUser ? 'XM Broker' : 'Vantage Broker'}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-black">
                        ${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black/10 text-black">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-black">Bonus Multiplier</p>
                          <p className="text-xs text-black/50">Applied to all earnings</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-black">{currentTier.bonusMultiplier}x</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-black mb-6">Payout Information</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-black/45" />
                        <span className="text-sm font-medium text-black">Payout Schedule</span>
                      </div>
                      <p className="text-sm text-black/45">
                        Payments are processed on the <span className="text-black">first week of each month</span> (typically Friday).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-black/45" />
                        <span className="text-sm font-medium text-black">Payment Methods</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Bank Transfer', 'PayPal', 'Crypto', 'Wise'].map((method) => (
                          <span key={method} className="text-xs px-2.5 py-1 rounded-full bg-black/5 text-black/60 border border-black/10">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-black/45" />
                        <span className="text-sm font-medium text-black">Processing Time</span>
                      </div>
                      <ul className="text-sm text-black/45 space-y-1">
                        <li>• Most payments: 1-15 minutes</li>
                        <li>• Some banks: 1-7 business days</li>
                        <li>• New accounts: Up to 30 days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings Calculator */}
              <div className="bg-white border border-black/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-black mb-4">Earnings Calculator</h3>
                <p className="text-sm text-black/45 mb-6">See how much you could earn with your current tier</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[10, 50, 100, 500].map((lots) => {
                    const rate = isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot;
                    const commission = currentTier.commissionPercent / 100;
                    const calcEarnings = lots * rate * commission * currentTier.bonusMultiplier;
                    
                    return (
                      <div key={lots} className="p-4 rounded-xl bg-black/5 text-center">
                        <p className="text-sm text-black/45 mb-1">{lots} lots/month</p>
                        <p className={cn(
                          "text-2xl font-black",
                          isXMUser ? "text-red-400" : "text-black"
                        )}>
                          {formatCurrency(calcEarnings)}
                        </p>
                        <p className="text-xs text-black/50 mt-1">per trader</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-black/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                    <span className="text-xs text-black/50 uppercase tracking-wide">Conversion</span>
                  </div>
                  <p className="text-3xl font-black text-black">{stats.conversionRate}</p>
                  <p className="text-xs text-black/50 mt-1">Active vs Total</p>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                    <span className="text-xs text-black/50 uppercase tracking-wide">Avg Lots</span>
                  </div>
                  <p className="text-3xl font-black text-black">
                    {stats.active > 0 ? formatNumber(earnings.lifetime_lots / stats.active, 1) : '0.0'}
                  </p>
                  <p className="text-xs text-black/50 mt-1">Per active trader</p>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                    <span className="text-xs text-black/50 uppercase tracking-wide">Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-black text-black">+{monthlyGrowth}%</p>
                    {Number(monthlyGrowth) >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-black" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-black/50 mt-1">This month</p>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                    <span className="text-xs text-black/50 uppercase tracking-wide">Link Clicks</span>
                  </div>
                  <p className="text-3xl font-black text-black">{stats.total * 3 + 42}</p>
                  <p className="text-xs text-black/50 mt-1">All time</p>
                </div>
              </div>

              {/* Recruitment Funnel */}
              <div className="bg-white border border-black/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-black mb-6">Recruitment Funnel</h3>
                <div className="space-y-4">
                  {funnelData.map((item, idx) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-black/45">{item.label}</span>
                        <span className="text-black font-medium">{item.value} ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            isXMUser 
                              ? "bg-linear-to-r from-red-600 to-orange-500" 
                              : "bg-linear-to-r from-white to-white"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-black mb-4">💡 Growth Tips</h3>
                  <div className="space-y-3">
                    {[
                      'Share your link on trading forums and Discord servers',
                      'Create content showing your trading journey',
                      'Offer to help new traders get started',
                      'Post consistently on social media (2x/week recommended)',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          isXMUser ? "bg-red-500/20 text-red-400" : "bg-black/20 text-black"
                        )}>
                          {i + 1}
                        </div>
                        <p className="text-sm text-black/60">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-black mb-4">🎯 Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleShareReferralLink}
                      className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group",
                      isXMUser 
                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                        : "bg-black/5 border-black/20 hover:bg-black/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                        <span className="text-sm font-medium text-black">Share on Social Media</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    </button>
                    <button
                      onClick={handleRequestPromoMaterials}
                      className="w-full p-4 rounded-xl border bg-black/5 border-black/10 text-left transition-all hover:bg-black/10 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-black" />
                        <span className="text-sm font-medium text-black">Request Promo Materials</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    </button>
                    <button
                      onClick={handleContactSupport}
                      className="w-full p-4 rounded-xl border bg-black/5 border-black/10 text-left transition-all hover:bg-black/10 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-black" />
                        <span className="text-sm font-medium text-black">Contact Support</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && isAffiliateAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AffiliateAdminPanel />
            </motion.div>
          )}
        </AnimatePresence>

      {/* --- EXPANDED OVERLAY --- */}
      <AnimatePresence>
        {selectedRecruit && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
             {/* Backdrop */}
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRecruit(null)}
               className="absolute inset-0 bg-white/90 backdrop-blur-sm"
             />

            {/* Card - Bottom sheet on mobile, centered modal on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-black/20" />
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedRecruit(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 bg-white hover:bg-black/5 rounded-full text-black border border-black/10 transition-colors"
                >
                   <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Header */}
                <div className={cn(
                  "p-4 sm:p-6 border-b border-black/5 shrink-0",
                  isXMUser
                    ? "bg-linear-to-br from-red-950/50 to-transparent"
                    : "bg-linear-to-br from-cyan-950/50 to-transparent"
                )}>
                    <div className="flex items-start gap-3 sm:gap-4">
                         <div className={cn(
                            "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold text-black shadow-lg shrink-0",
                            isXMUser
                              ? "bg-linear-to-br from-red-600 to-orange-600"
                              : "bg-linear-to-br from-white to-white"
                          )}>
                            {selectedRecruit.email.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0 pr-8 sm:pr-10">
                             <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                <h2 className="text-base sm:text-xl font-bold text-black truncate">{maskEmail(selectedRecruit.email)}</h2>
                                <StatusBadge status={selectedRecruit.status || 'Pending'} />
                             </div>
                             <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-black/45">
                                 <span className="flex items-center gap-1">
                                   <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
                                   ID: <span className="font-mono text-black/60">{formatId(selectedRecruit.id)}</span>
                                 </span>
                                 <span className="hidden xs:block">•</span>
                                 <span className="flex items-center gap-1">
                                   <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>
                                   {formatDate(selectedRecruit.created_at)}
                                 </span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/80 border border-black/5">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-black/10 text-black">
                                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-black/45 font-medium">Lots Traded</span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-black">
                                {selectedRecruit.status === 'Active'
                                  ? formatNumber(selectedRecruit.total_lots_traded || 0, 2)
                                  : "0.00"
                                }
                            </p>
                        </div>
                        <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/80 border border-black/5">
                             <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <div className={cn(
                                  "p-1 sm:p-1.5 rounded-md sm:rounded-lg",
                                  isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
                                )}>
                                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-[10px] sm:text-xs text-black/45 font-medium">Earnings</span>
                            </div>
                            <p className={cn(
                              "text-lg sm:text-2xl font-bold",
                              selectedRecruit.status === 'Active' ? "text-black" : "text-slate-600"
                            )}>
                                {selectedRecruit.status === 'Active'
                                  ? formatCurrency(selectedRecruit.estimated_earnings || 0)
                                  : "$0.00"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Journey Timeline */}
                    <div>
                        <h3 className="text-sm font-bold text-black/45 uppercase tracking-wider mb-4">Customer Journey</h3>
                        <div className="relative pl-6 space-y-6 border-l-2 border-black/10 ml-2">
                            {/* Step 1: Registered */}
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-black" />
                                </div>
                                <h4 className="text-black font-semibold text-sm">Account Created</h4>
                                <p className="text-xs text-black/50 mt-1">
                                    Registered via code <span className={cn("font-mono", isXMUser ? "text-red-400" : "text-black")}>{selectedRecruit.referred_by_code}</span>
                                </p>
                                <p className="text-[10px] text-slate-600 mt-0.5">
                                    {formatDate(selectedRecruit.created_at)} at {formatTime(selectedRecruit.created_at)}
                                </p>
                            </div>

                            {/* Step 2: Broker Connection */}
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[25px] top-0 w-4 h-4 rounded-full flex items-center justify-center",
                                    selectedRecruit.mt5_id 
                                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                                      : "bg-black/10 border-2 border-black/15"
                                )}>
                                  {selectedRecruit.mt5_id && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                                </div>
                                <h4 className={cn("font-semibold text-sm", selectedRecruit.mt5_id ? "text-black" : "text-black/50")}>
                                    MT5 Account Linked
                                </h4>
                                {selectedRecruit.mt5_id ? (
                                    <p className="text-xs text-black/50 mt-1">
                                        Account ID: <span className="text-black font-mono">{selectedRecruit.mt5_id}</span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-amber-400/80 mt-1">
                                        ⏳ Awaiting broker account setup
                                    </p>
                                )}
                            </div>

                            {/* Step 3: Trading Active */}
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[25px] top-0 w-4 h-4 rounded-full flex items-center justify-center",
                                    selectedRecruit.status === 'Active' 
                                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                                      : "bg-black/10 border-2 border-black/15"
                                )}>
                                  {selectedRecruit.status === 'Active' && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                                </div>
                                <h4 className={cn("font-semibold text-sm", selectedRecruit.status === 'Active' ? "text-black" : "text-black/50")}>
                                    Active Trading
                                </h4>
                                <p className="text-xs text-black/50 mt-1">
                                    {selectedRecruit.status === 'Active' 
                                      ? "✅ Generating commissions on live trades"
                                      : "⏳ Waiting for first trade execution"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="p-4 rounded-xl bg-black/5 border border-black/5">
                      <h4 className="text-xs font-bold text-black/45 uppercase tracking-wider mb-3">Recruit Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-black/50">Referral Code Used</span>
                          <span className={cn("font-mono", isXMUser ? "text-red-400" : "text-black")}>
                            {selectedRecruit.referred_by_code || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/50">Their Affiliate Code</span>
                          <span className="text-black/60 font-mono">
                            {selectedRecruit.affiliate_code || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/50">Commission Tier</span>
                          <span className="text-black font-medium">{currentTier.name} ({currentTier.commissionPercent}%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Notice */}
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-200/70 leading-relaxed">
                            Earnings are calculated based on lot volume and your current tier. Final payout amounts are confirmed during the monthly payment cycle.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 sm:p-4 border-t border-black/5 flex gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(selectedRecruit.id));
                    }}
                    className="flex-1 py-2 sm:py-2.5 rounded-lg bg-black/5 border border-black/10 hover:bg-black/10 active:bg-black/15 text-xs sm:text-sm text-black font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Copy</span> ID
                  </button>
                  <button
                    onClick={() => setSelectedRecruit(null)}
                    className={cn(
                      "flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors",
                      isXMUser
                        ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-black"
                        : "bg-white hover:bg-black/90 active:bg-black/80 text-black"
                    )}
                  >
                    Close
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Content Editor Modal */}
      <AnimatePresence>
        {showAdminContentEditor && isAffiliateAdmin && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminContentEditor(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full max-w-6xl my-4 mx-4 bg-gray-950 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Admin: Dashboard Content Editor</h2>
                    <p className="text-xs text-gray-400">Edit text, tiers, tasks, tips, FAQ and feature toggles for all affiliates</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminContentEditor(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-[85vh] overflow-y-auto">
                <AffiliateContentAdminPanel />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

const QuickStatCard = ({
  label,
  value,
  icon: Icon,
  color = 'accent',
  isXMUser
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'accent' | 'green' | 'purple' | 'orange';
  isXMUser: boolean;
}) => {
  const colorClasses = {
    accent: isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
    orange: "bg-orange-500/10 text-orange-400",
  };

  return (
    <div className="bg-white border border-black/5 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0", colorClasses[color])}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-black/50 uppercase tracking-wide truncate">{label}</p>
        <p className="text-base sm:text-lg md:text-xl font-bold text-black truncate">{value}</p>
      </div>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'Active';
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
      isActive 
        ? "bg-black/10 text-black border-black/20" 
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {status}
    </div>
  );
};