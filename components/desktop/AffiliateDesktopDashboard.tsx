"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users, Search, Calendar, CheckCircle2,
  ArrowLeft, RefreshCw, Download,
  Shield, TrendingUp, Lock, AlertTriangle, Tag, AtSign,
  X, Copy, Activity, DollarSign, ChevronRight, CreditCard,
  Zap, Target, Award, Star, Trophy, Sparkles,
  BarChart3, Clock, Wallet, ExternalLink, Share2,
  ArrowUpRight, ArrowDownRight, Eye, PieChart,
  Banknote, TrendingDown, Filter, LayoutGrid, List,
  Crown, Gift, Link2, MessageSquare, Bell, Settings,
  ChevronDown, MoreHorizontal, Mail, Hash
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import AffiliateAdminPanel from "@/app/recruit/AffiliateAdminPanel";

// --- SUPABASE SETUP ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AFFILIATE_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// --- NEON BLUE THEME ---
const NEON_BLUE = {
  primary: '#3b82f6',
  cyan: '#22d3ee',
  border: 'rgba(59, 130, 246, 0.6)',
  glow: '0 0 20px rgba(59, 130, 246, 0.4)',
  glowStrong: '0 0 30px rgba(59, 130, 246, 0.6)',
};

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

interface AffiliateTier {
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

interface DashboardStats {
  total: number;
  active: number;
  pending: number;
  conversionRate: string;
}

// --- TIER DEFINITIONS ---
const AFFILIATE_TIERS: AffiliateTier[] = [
  { name: 'Starter', minTraders: 1, maxTraders: 4, commissionPercent: 5, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.0, color: '#3b82f6', icon: 'target', perks: ['Basic dashboard access', 'Monthly payouts', 'Email support'] },
  { name: 'Bronze', minTraders: 5, maxTraders: 14, commissionPercent: 10, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.1, color: '#cd7f32', icon: 'award', perks: ['Priority email support', 'Weekly performance reports', 'Custom referral link'] },
  { name: 'Silver', minTraders: 15, maxTraders: 29, commissionPercent: 15, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.2, color: '#c0c0c0', icon: 'star', perks: ['Telegram support', 'Marketing materials', 'Bi-weekly payouts'] },
  { name: 'Gold', minTraders: 30, maxTraders: 49, commissionPercent: 20, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.35, color: '#ffd700', icon: 'trophy', perks: ['1-on-1 support calls', 'Co-branded landing pages', 'Weekly payouts'] },
  { name: 'Elite', minTraders: 50, maxTraders: null, commissionPercent: 25, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.5, color: '#00d4ff', icon: 'sparkles', perks: ['Dedicated account manager', 'Custom commission rates', 'Instant payouts', 'Exclusive bonuses'] },
];

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (num: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

const getTierFromActive = (activeCount: number): AffiliateTier => {
  for (let i = AFFILIATE_TIERS.length - 1; i >= 0; i--) {
    if (activeCount >= AFFILIATE_TIERS[i].minTraders) {
      return AFFILIATE_TIERS[i];
    }
  }
  return AFFILIATE_TIERS[0];
};

const getNextTier = (activeCount: number): AffiliateTier | null => {
  const currentTier = getTierFromActive(activeCount);
  const currentIndex = AFFILIATE_TIERS.findIndex(t => t.name === currentTier.name);
  if (currentIndex < AFFILIATE_TIERS.length - 1) {
    return AFFILIATE_TIERS[currentIndex + 1];
  }
  return null;
};

const getTierIcon = (iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    target: Target,
    award: Award,
    star: Star,
    trophy: Trophy,
    sparkles: Sparkles,
  };
  return icons[iconName] || Target;
};

const getProgressToNextTier = (activeCount: number) => {
  const currentTier = getTierFromActive(activeCount);
  const nextTier = getNextTier(activeCount);

  if (!nextTier) return 100;

  const tradersInCurrentTier = activeCount - currentTier.minTraders;
  const tradersNeededForNext = nextTier.minTraders - currentTier.minTraders;

  return Math.min((tradersInCurrentTier / tradersNeededForNext) * 100, 100);
};

// --- NEON CARD COMPONENT ---
const NeonCard = memo(({ children, className, glow = true, padding = 'default' }: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  padding?: 'none' | 'small' | 'default' | 'large';
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-black/80 border-2",
        paddingClasses[padding],
        className
      )}
      style={{
        borderColor: NEON_BLUE.border,
        boxShadow: glow ? NEON_BLUE.glow : 'none',
      }}
    >
      {children}
    </div>
  );
});
NeonCard.displayName = "NeonCard";

// --- STAT CARD COMPONENT ---
const StatCard = memo(({ icon: Icon, label, value, subtext, highlight = false, trend }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <NeonCard padding="default" glow={highlight}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-blue-400/70 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtext && (
          <p className="text-xs text-blue-300/50 mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-400" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-400" />}
            {subtext}
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
    </div>
  </NeonCard>
));
StatCard.displayName = "StatCard";

// --- MAIN DESKTOP DASHBOARD ---
export default function AffiliateDesktopDashboard({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending'>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecruit, setSelectedRecruit] = useState<Recruit | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recruits' | 'earnings' | 'analytics' | 'admin'>('overview');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [myTrackingCode, setMyTrackingCode] = useState<string>('Loading...');

  const { isXMUser } = useGlobalTheme();

  const [stats, setStats] = useState<DashboardStats>({
    total: 0, active: 0, pending: 0, conversionRate: '0%'
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

  const [isAffiliateAdmin, setIsAffiliateAdmin] = useState(false);

  const currentTier = useMemo(() => getTierFromActive(stats.active), [stats.active]);
  const nextTier = useMemo(() => getNextTier(stats.active), [stats.active]);
  const tierProgress = useMemo(() => getProgressToNextTier(stats.active), [stats.active]);

  const referralLink = useMemo(() => {
    if (!myTrackingCode || myTrackingCode === 'Loading...' || myTrackingCode === 'No Code Found') {
      return 'https://bullmoney.online/register';
    }
    const url = new URL('https://bullmoney.online/register');
    url.searchParams.set('ref', myTrackingCode);
    return url.toString();
  }, [myTrackingCode]);

  // --- CHECK AUTH & FETCH DATA ---
  const checkAuthAndLoad = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    setErrorMsg(null);

    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      if (!savedSession) {
        setIsAuthorized(false);
        if (!isPolling) setLoading(false);
        return;
      }

      setIsAuthorized(true);
      const session = JSON.parse(savedSession);
      const userId = session.id;

      let codeToSearch = myTrackingCode;

      if (!isPolling || myTrackingCode === 'Loading...') {
        const { data: userData, error: userError } = await supabase
          .from('recruits')
          .select('affiliate_code, total_earnings, pending_earnings, paid_earnings')
          .eq('id', userId)
          .single();

        if (userError || !userData?.affiliate_code) {
          setMyTrackingCode('No Code Found');
          setRecruits([]);
          if (!isPolling) setLoading(false);
          return;
        }

        codeToSearch = userData.affiliate_code;
        setMyTrackingCode(codeToSearch);

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

      if (error) throw error;

      if (data) {
        const processed: Recruit[] = data.map((item: any) => {
          const isActive = item.task_broker_verified || (item.mt5_id && String(item.mt5_id).length > 3);
          const lotsTraded = Number(item.total_lots_traded ?? 0);
          return {
            ...item,
            id: item.id,
            affiliate_code: item.affiliate_code,
            referred_by_code: item.referred_by_code,
            status: isActive ? 'Active' : 'Pending',
            total_lots_traded: lotsTraded,
            estimated_earnings: lotsTraded * (isXMUser ? 11 : 5.5) * (currentTier.commissionPercent / 100)
          };
        });

        setRecruits(processed);

        const total = processed.length;
        const active = processed.filter(r => r.status === 'Active').length;
        const totalLots = processed.reduce((sum, r) => sum + (r.total_lots_traded || 0), 0);

        setStats({
          total,
          active,
          pending: total - active,
          conversionRate: total > 0 ? `${((active / total) * 100).toFixed(1)}%` : '0%'
        });

        setEarnings(prev => ({
          ...prev,
          lifetime_lots: totalLots,
          monthly_lots: totalLots * 0.3,
          this_month: totalLots * 0.3 * (isXMUser ? 11 : 5.5) * (currentTier.commissionPercent / 100),
          last_month: totalLots * 0.25 * (isXMUser ? 11 : 5.5) * (currentTier.commissionPercent / 100)
        }));
      }
    } catch (err: any) {
      console.error("Error loading recruits:", err);
      if (!isPolling) setErrorMsg("Could not load affiliate data.");
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [myTrackingCode, isXMUser, currentTier.commissionPercent]);

  useEffect(() => {
    checkAuthAndLoad(false);
    const intervalId = setInterval(() => checkAuthAndLoad(true), 15000);
    return () => clearInterval(intervalId);
  }, [checkAuthAndLoad]);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("bullmoney_session");
      if (!savedSession) {
        setIsAffiliateAdmin(false);
        return;
      }

      const session = JSON.parse(savedSession);
      const email = String(session?.email || "").toLowerCase();
      setIsAffiliateAdmin(AFFILIATE_ADMIN_EMAILS.includes(email));
    } catch (err) {
      console.error("Admin allowlist check failed:", err);
      setIsAffiliateAdmin(false);
    }
  }, []);

  const handleCopyCode = async () => {
    if (!myTrackingCode || myTrackingCode === 'Loading...') return;
    try {
      await navigator.clipboard.writeText(myTrackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
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

  const monthlyGrowth = earnings.last_month > 0
    ? ((earnings.this_month - earnings.last_month) / earnings.last_month * 100).toFixed(1)
    : '0';

  // --- UNAUTHORIZED STATE ---
  if (!loading && !isAuthorized) {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
        <NeonCard padding="large" className="max-w-md text-center">
          <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-blue-400/70 text-sm mb-6">Sign in to access your affiliate dashboard</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors"
          >
            Back to Login
          </button>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col overflow-hidden" style={{ background: '#050B14' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 bg-blue-600" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-15 bg-cyan-600" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">Affiliate Dashboard</h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-blue-500/10 text-blue-300 border-blue-500/20">
                {React.createElement(getTierIcon(currentTier.icon), { className: "w-3.5 h-3.5" })}
                {currentTier.name} Partner
              </div>
            </div>
            <p className="text-sm text-blue-400/50 mt-0.5">Track, manage & grow your affiliate network</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => checkAuthAndLoad(false)}
            className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all">
            <Bell className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-900/30">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-hidden flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-blue-500/20 bg-black/30 backdrop-blur-xl p-4 flex flex-col gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'recruits', label: 'Recruits', icon: Users },
            { id: 'earnings', label: 'Earnings', icon: Wallet },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ...(isAffiliateAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all",
                activeTab === tab.id
                  ? "bg-blue-500/20 text-white border border-blue-500/40"
                  : "text-blue-400/70 hover:bg-blue-500/10 hover:text-blue-300 border border-transparent"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}

          {/* Referral Code Section */}
          <div className="mt-auto pt-4 border-t border-blue-500/20">
            <p className="text-xs uppercase tracking-wide text-blue-400/50 mb-2">Your Affiliate Code</p>
            <div
              onClick={handleCopyCode}
              className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-all"
            >
              <span className="font-mono font-bold text-white text-lg">{myTrackingCode}</span>
              <Copy className={cn("w-4 h-4", copiedCode ? "text-green-400" : "text-blue-400")} />
            </div>
            {copiedCode && <p className="text-xs text-green-400 mt-1">Copied!</p>}

            <button
              onClick={handleCopyLink}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all"
            >
              <Link2 className="w-4 h-4" />
              {copiedLink ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Admin Tab */}
          {activeTab === 'admin' && isAffiliateAdmin && (
            <AffiliateAdminPanel />
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Total Recruits"
                  value={stats.total}
                  subtext={`${stats.active} active`}
                  highlight
                />
                <StatCard
                  icon={DollarSign}
                  label="Total Earnings"
                  value={formatCurrency(earnings.total_earnings)}
                  subtext={`+${monthlyGrowth}% this month`}
                  trend={Number(monthlyGrowth) > 0 ? 'up' : 'down'}
                />
                <StatCard
                  icon={Activity}
                  label="Lots Traded"
                  value={formatNumber(earnings.lifetime_lots, 1)}
                  subtext="Lifetime"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Conversion Rate"
                  value={stats.conversionRate}
                  subtext="Pending to Active"
                />
              </div>

              {/* Tier Progress */}
              <NeonCard padding="default">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Tier Progress</h3>
                    <p className="text-sm text-blue-400/60">
                      {nextTier
                        ? `${nextTier.minTraders - stats.active} more traders to ${nextTier.name}`
                        : 'You\'ve reached the highest tier!'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-full font-bold text-sm border"
                      style={{ borderColor: currentTier.color, color: currentTier.color, background: `${currentTier.color}15` }}
                    >
                      {currentTier.commissionPercent}% Commission
                    </div>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-blue-500/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tierProgress}%`,
                      background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`
                    }}
                  />
                </div>

                {/* Tier Badges */}
                <div className="flex items-center justify-between mt-4 gap-2">
                  {AFFILIATE_TIERS.map((tier) => {
                    const TierIcon = getTierIcon(tier.icon);
                    const isActive = stats.active >= tier.minTraders;
                    const isCurrent = currentTier.name === tier.name;

                    return (
                      <div
                        key={tier.name}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                          isCurrent ? "bg-white/5" : "opacity-50"
                        )}
                        style={{
                          borderColor: isActive ? tier.color : 'rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <TierIcon className="w-4 h-4" style={{ color: tier.color }} />
                        <span className="text-sm font-medium" style={{ color: isActive ? tier.color : '#64748b' }}>
                          {tier.name}
                        </span>
                        <span className="text-xs text-blue-400/50">{tier.commissionPercent}%</span>
                      </div>
                    );
                  })}
                </div>
              </NeonCard>

              {/* Recent Recruits */}
              <NeonCard padding="default">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Recruits</h3>
                  <button
                    onClick={() => setActiveTab('recruits')}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {recruits.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
                    <p className="text-blue-400/50">No recruits yet. Share your link to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recruits.slice(0, 5).map((recruit) => (
                      <div
                        key={recruit.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            recruit.status === 'Active' ? "bg-green-400" : "bg-yellow-400"
                          )} />
                          <div>
                            <p className="text-sm font-medium text-white">{maskEmail(recruit.email)}</p>
                            <p className="text-xs text-blue-400/50">MT5: {recruit.mt5_id || 'Pending'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{formatCurrency(recruit.estimated_earnings || 0)}</p>
                          <p className="text-xs text-blue-400/50">{formatDate(recruit.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </NeonCard>
            </div>
          )}

          {/* Recruits Tab */}
          {activeTab === 'recruits' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400/50" />
                  <input
                    type="text"
                    placeholder="Search by email, MT5 ID, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-white placeholder-blue-400/40 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {(['All', 'Active', 'Pending'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                        filter === f
                          ? "bg-blue-500/20 text-white border-blue-500/40"
                          : "text-blue-400/70 border-blue-500/20 hover:bg-blue-500/10"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recruits Table */}
              <NeonCard padding="none" className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-500/20">
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">Status</th>
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">Email</th>
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">MT5 ID</th>
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">Lots Traded</th>
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">Est. Earnings</th>
                      <th className="text-left p-4 text-xs uppercase tracking-wide text-blue-400/60">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecruits.map((recruit) => (
                      <tr
                        key={recruit.id}
                        className="border-b border-blue-500/10 hover:bg-blue-500/5 transition-colors"
                      >
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            recruit.status === 'Active'
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {recruit.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-white">{maskEmail(recruit.email)}</td>
                        <td className="p-4 text-sm text-blue-300 font-mono">{recruit.mt5_id || '—'}</td>
                        <td className="p-4 text-sm text-white">{formatNumber(recruit.total_lots_traded || 0, 1)}</td>
                        <td className="p-4 text-sm text-green-400">{formatCurrency(recruit.estimated_earnings || 0)}</td>
                        <td className="p-4 text-sm text-blue-400/60">{formatDate(recruit.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRecruits.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
                    <p className="text-blue-400/50">No recruits found matching your search.</p>
                  </div>
                )}
              </NeonCard>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              {/* Earnings Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  icon={DollarSign}
                  label="Total Earnings"
                  value={formatCurrency(earnings.total_earnings)}
                  highlight
                />
                <StatCard
                  icon={Clock}
                  label="Pending"
                  value={formatCurrency(earnings.pending_earnings)}
                  subtext="Processing"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Paid Out"
                  value={formatCurrency(earnings.paid_earnings)}
                  subtext="Lifetime"
                  trend="up"
                />
              </div>

              {/* Monthly Breakdown */}
              <NeonCard padding="default">
                <h3 className="text-lg font-bold text-white mb-4">Monthly Breakdown</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs uppercase tracking-wide text-blue-400/60 mb-1">This Month</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(earnings.this_month)}</p>
                    <p className="text-sm text-blue-400/60 mt-1">{formatNumber(earnings.monthly_lots, 1)} lots traded</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs uppercase tracking-wide text-blue-400/60 mb-1">Last Month</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(earnings.last_month)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Number(monthlyGrowth) > 0 ? (
                        <>
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">+{monthlyGrowth}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">{monthlyGrowth}%</span>
                        </>
                      )}
                      <span className="text-sm text-blue-400/50">vs this month</span>
                    </div>
                  </div>
                </div>
              </NeonCard>

              {/* Commission Structure */}
              <NeonCard padding="default">
                <h3 className="text-lg font-bold text-white mb-4">Commission Structure</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-500/20">
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-blue-400/60">Tier</th>
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-blue-400/60">Traders</th>
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-blue-400/60">Commission</th>
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-blue-400/60">XM Rate</th>
                        <th className="text-left p-3 text-xs uppercase tracking-wide text-blue-400/60">Vantage Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {AFFILIATE_TIERS.map((tier) => {
                        const TierIcon = getTierIcon(tier.icon);
                        const isCurrent = currentTier.name === tier.name;

                        return (
                          <tr
                            key={tier.name}
                            className={cn(
                              "border-b border-blue-500/10",
                              isCurrent && "bg-blue-500/10"
                            )}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <TierIcon className="w-4 h-4" style={{ color: tier.color }} />
                                <span className="font-medium" style={{ color: tier.color }}>{tier.name}</span>
                                {isCurrent && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Current</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm text-white">
                              {tier.minTraders}-{tier.maxTraders || '∞'}
                            </td>
                            <td className="p-3 text-sm text-white font-bold">{tier.commissionPercent}%</td>
                            <td className="p-3 text-sm text-blue-300">${tier.xmRatePerLot}/lot</td>
                            <td className="p-3 text-sm text-blue-300">${tier.vantageRatePerLot}/lot</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </NeonCard>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={BarChart3}
                  label="Lifetime Lots"
                  value={formatNumber(earnings.lifetime_lots, 1)}
                />
                <StatCard
                  icon={PieChart}
                  label="Active Rate"
                  value={stats.conversionRate}
                  subtext={`${stats.active} of ${stats.total} recruits`}
                />
              </div>

              <NeonCard padding="default">
                <h3 className="text-lg font-bold text-white mb-4">Performance Insights</h3>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
                  <p className="text-blue-400/50">Detailed analytics coming soon!</p>
                  <p className="text-sm text-blue-400/30 mt-2">Track conversion rates, growth trends, and more.</p>
                </div>
              </NeonCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
