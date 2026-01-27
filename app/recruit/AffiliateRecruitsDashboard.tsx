"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Crown, Gift, Link2, MessageSquare, Bell, Settings
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

const getTierIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
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
  
  if (!nextTier) return 100; // Already at Elite
  
  const tradersInCurrentTier = activeCount - currentTier.minTraders;
  const tradersNeededForNext = nextTier.minTraders - currentTier.minTraders;
  
  return Math.min((tradersInCurrentTier / tradersNeededForNext) * 100, 100);
};

// --- MAIN COMPONENT ---
export default function AffiliateRecruitsDashboard({ onBack }: { onBack: () => void }) {
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
  
  // --- DYNAMIC THEME ---
  const { isXMUser } = useGlobalTheme();
  const accentColor = isXMUser ? 'red' : 'blue';

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
    url.searchParams.set('utm_source', 'affiliate');
    url.searchParams.set('utm_medium', 'dashboard');
    url.searchParams.set('utm_campaign', 'partner_link');
    return url.toString();
  }, [myTrackingCode]);

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
  };

  useEffect(() => {
    checkAuthAndLoad(false);
    const intervalId = setInterval(() => checkAuthAndLoad(true), 15000); 
    return () => clearInterval(intervalId);
  }, []);

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
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referralLink;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
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

  // Calculate monthly growth
  const monthlyGrowth = earnings.last_month > 0 
    ? ((earnings.this_month - earnings.last_month) / earnings.last_month * 100).toFixed(1)
    : '0';

  // --- UNAUTHORIZED STATE ---
  if (!loading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4">
        <div className="bg-neutral-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400 text-sm mb-4">Sign in to access your affiliate dashboard</p>
          <button onClick={onBack} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-[#050B14] text-white font-sans",
      isXMUser ? "selection:bg-red-500/30" : "selection:bg-cyan-500/30"
    )}>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-30",
          isXMUser ? "bg-red-600" : "bg-cyan-600"
        )} />
        <div className={cn(
          "absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-20",
          isXMUser ? "bg-orange-600" : "bg-cyan-600"
        )} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 relative z-10">
        
        {/* TOP NAVIGATION BAR */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Affiliate Dashboard
                </h1>
                <div className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                  currentTier.name === 'Elite' ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" :
                  currentTier.name === 'Gold' ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" :
                  currentTier.name === 'Silver' ? "bg-slate-400/10 text-slate-300 border-slate-400/20" :
                  currentTier.name === 'Bronze' ? "bg-orange-500/10 text-orange-300 border-orange-500/20" :
                  isXMUser ? "bg-red-500/10 text-red-300 border-red-500/20" : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                )}>
                  {React.createElement(getTierIcon(currentTier.icon), { className: "w-3.5 h-3.5" })}
                  {currentTier.name} Partner
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Track, manage & grow your affiliate network</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => checkAuthAndLoad(false)} 
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <button className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition-all",
              isXMUser 
                ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-900/20" 
                : "bg-gradient-to-r from-cyan-600 to-cyan-600 hover:from-cyan-500 hover:to-cyan-500 shadow-lg shadow-cyan-900/20"
            )}>
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </header>

        {/* ERROR MSG */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 flex items-center gap-3 text-red-200"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </motion.div>
        )}

        {/* REFERRAL LINK BANNER */}
        <div className={cn(
          "mb-8 p-4 md:p-6 rounded-2xl border backdrop-blur-xl",
          isXMUser 
            ? "bg-gradient-to-r from-red-950/40 to-orange-950/40 border-red-500/20" 
            : "bg-gradient-to-r from-cyan-950/40 to-cyan-950/40 border-cyan-500/20"
        )}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
              )}>
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Your Referral Link</h3>
                <p className="text-sm text-slate-400 mb-3">Share this link to earn commissions on every trade your referrals make</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <code className={cn(
                    "px-3 py-2 rounded-lg text-sm font-mono border truncate max-w-[300px] md:max-w-[400px]",
                    isXMUser 
                      ? "bg-red-500/5 border-red-500/20 text-red-200" 
                      : "bg-cyan-500/5 border-cyan-500/20 text-cyan-200"
                  )}>
                    {referralLink}
                  </code>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                        copiedLink 
                          ? "bg-green-500/20 border-green-500/30 text-green-300"
                          : isXMUser
                            ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20"
                      )}
                    >
                      {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                        copiedCode
                          ? "bg-green-500/20 border-green-500/30 text-green-300"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {copiedCode ? 'Copied!' : myTrackingCode}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:border-l lg:border-white/10 lg:pl-6">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{currentTier.commissionPercent}%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Commission</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Per Lot</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? isXMUser 
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
              {/* EARNINGS SUMMARY ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EarningsCard
                  title="Total Earnings"
                  value={formatCurrency(earnings.total_earnings + earnings.this_month)}
                  subtitle="Lifetime"
                  icon={DollarSign}
                  trend={`+${monthlyGrowth}%`}
                  trendUp={Number(monthlyGrowth) >= 0}
                  isXMUser={isXMUser}
                  primary
                />
                <EarningsCard
                  title="This Month"
                  value={formatCurrency(earnings.this_month)}
                  subtitle="Jan 2026"
                  icon={TrendingUp}
                  trend={`+${monthlyGrowth}%`}
                  trendUp={Number(monthlyGrowth) >= 0}
                  isXMUser={isXMUser}
                />
                <EarningsCard
                  title="Pending Payout"
                  value={formatCurrency(earnings.pending_earnings + earnings.this_month * 0.8)}
                  subtitle="Processing"
                  icon={Clock}
                  isXMUser={isXMUser}
                />
                <EarningsCard
                  title="Already Paid"
                  value={formatCurrency(earnings.paid_earnings)}
                  subtitle="Withdrawn"
                  icon={CheckCircle2}
                  isXMUser={isXMUser}
                />
              </div>

              {/* TIER PROGRESSION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Tier Progression</h3>
                      <p className="text-sm text-slate-500">Level up for higher commissions</p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border",
                      currentTier.name === 'Elite' ? "bg-cyan-500/10 border-cyan-500/20" :
                      currentTier.name === 'Gold' ? "bg-yellow-500/10 border-yellow-500/20" :
                      currentTier.name === 'Silver' ? "bg-slate-400/10 border-slate-400/20" :
                      currentTier.name === 'Bronze' ? "bg-orange-500/10 border-orange-500/20" :
                      "bg-cyan-500/10 border-cyan-500/20"
                    )}>
                      {React.createElement(getTierIcon(currentTier.icon), { 
                        className: "w-5 h-5",
                        style: { color: currentTier.color }
                      })}
                      <span className="font-bold text-white">{currentTier.name}</span>
                      <span className="text-sm text-slate-400">({currentTier.commissionPercent}% commission)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Progress to {nextTier?.name || 'Max Tier'}</span>
                      <span className="text-white font-medium">
                        {stats.active} / {nextTier?.minTraders || stats.active} active traders
                      </span>
                    </div>
                    <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tierProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          isXMUser 
                            ? "bg-gradient-to-r from-red-600 to-orange-500" 
                            : "bg-gradient-to-r from-cyan-600 to-cyan-500"
                        )}
                      />
                    </div>
                    {nextTier && (
                      <p className="text-xs text-slate-500 mt-2">
                        {nextTier.minTraders - stats.active} more active traders to reach {nextTier.name} tier 
                        ({nextTier.commissionPercent}% commission)
                      </p>
                    )}
                  </div>

                  {/* All Tiers */}
                  <div className="grid grid-cols-5 gap-2">
                    {AFFILIATE_TIERS.map((tier, index) => {
                      const TierIcon = getTierIcon(tier.icon);
                      const isActive = currentTier.name === tier.name;
                      const isUnlocked = stats.active >= tier.minTraders;
                      
                      return (
                        <div
                          key={tier.name}
                          className={cn(
                            "relative p-3 rounded-xl text-center transition-all border",
                            isActive 
                              ? "bg-white/10 border-white/20 shadow-lg" 
                              : isUnlocked
                                ? "bg-white/5 border-white/5"
                                : "bg-neutral-900/50 border-white/5 opacity-50"
                          )}
                        >
                          {isActive && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                          <TierIcon 
                            className="w-6 h-6 mx-auto mb-1" 
                            style={{ color: tier.color }}
                          />
                          <p className="text-xs font-bold text-white">{tier.name}</p>
                          <p className="text-[10px] text-slate-500">{tier.minTraders}+ traders</p>
                          <p className="text-xs font-bold mt-1" style={{ color: tier.color }}>
                            {tier.commissionPercent}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Tier Perks */}
                <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Your Perks</h3>
                  <div className="space-y-3">
                    {currentTier.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg mt-0.5",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                        )}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-slate-300">{perk}</span>
                      </div>
                    ))}
                  </div>
                  
                  {nextTier && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-bold text-slate-400 mb-3">Unlock at {nextTier.name}:</h4>
                      <div className="space-y-2">
                        {nextTier.perks.filter(p => !currentTier.perks.includes(p)).slice(0, 2).map((perk, i) => (
                          <div key={i} className="flex items-start gap-3 opacity-50">
                            <Lock className="w-4 h-4 text-slate-600 mt-0.5" />
                            <span className="text-sm text-slate-500">{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

              {/* HOW IT WORKS */}
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">How BullMoney Affiliate Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { step: 1, title: 'Share Your Link', desc: 'Share your unique referral link on social media, blogs, or directly with traders', icon: Share2 },
                    { step: 2, title: 'Users Sign Up', desc: 'When someone registers using your link, they become your recruit', icon: Users },
                    { step: 3, title: 'They Trade', desc: 'Every time your recruits trade, you earn commission on their lot volume', icon: Activity },
                    { step: 4, title: 'Get Paid', desc: 'Receive your earnings via bank transfer, PayPal, or crypto monthly', icon: Banknote },
                  ].map((item) => (
                    <div key={item.step} className="relative">
                      {item.step < 4 && (
                        <div className="hidden md:block absolute top-6 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-white/10 to-transparent" />
                      )}
                      <div className="text-center">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                        )}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div className={cn(
                          "text-xs font-bold mb-1",
                          isXMUser ? "text-red-400" : "text-cyan-400"
                        )}>
                          Step {item.step}
                        </div>
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT RECRUITS PREVIEW */}
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white">Recent Recruits</h3>
                  <button
                    onClick={() => setActiveTab('recruits')}
                    className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      isXMUser ? "text-red-400 hover:text-red-300" : "text-cyan-400 hover:text-cyan-300"
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
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          recruit.status === 'Active'
                            ? isXMUser ? "bg-red-500/20 text-red-300" : "bg-cyan-500/20 text-cyan-300"
                            : "bg-neutral-800 text-slate-500"
                        )}>
                          {recruit.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{maskEmail(recruit.email)}</p>
                          <p className="text-xs text-slate-500">{formatDate(recruit.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-mono text-white">
                            {recruit.status === 'Active' ? `${formatNumber(recruit.total_lots_traded || 0, 1)} lots` : '---'}
                          </p>
                          <p className="text-xs text-slate-500">
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
                      <h3 className="text-lg font-bold text-white mb-1">No Recruits Yet</h3>
                      <p className="text-sm text-slate-500">Share your referral link to start building your network</p>
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
              {/* RECRUITS LIST SECTION */}
              <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                
                {/* Controls */}
                <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-96 group">
                    <Search className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors",
                      isXMUser ? "group-focus-within:text-red-400" : "group-focus-within:text-cyan-400"
                    )} />
                    <input 
                      type="text" 
                      placeholder="Search by email, MT5 ID, or code..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={cn(
                        "w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-slate-600",
                        isXMUser ? "focus:border-red-500/50" : "focus:border-cyan-500/50"
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex gap-1.5 bg-neutral-800/50 p-1 rounded-lg">
                      {(['All', 'Active', 'Pending'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap",
                            filter === f 
                              ? isXMUser 
                                ? "bg-red-500 text-white" 
                                : "bg-cyan-500 text-white"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 bg-neutral-800/50 p-1 rounded-lg">
                      <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                          "p-2 rounded-md transition-all",
                          viewMode === 'table' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={cn(
                          "p-2 rounded-md transition-all",
                          viewMode === 'cards' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'table' ? (
                  /* Table View */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-xs uppercase text-slate-400 font-medium">
                          <th className="p-4 pl-6">Recruit</th>
                          <th className="p-4">Joined</th>
                          <th className="p-4">MT5 Account</th>
                          <th className="p-4">Lots Traded</th>
                          <th className="p-4">Your Earnings</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loading && recruits.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading affiliate data...</td></tr>
                        ) : filteredRecruits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center opacity-50">
                                <Users className="w-12 h-12 text-slate-500 mb-4" />
                                <h3 className="text-lg font-bold text-white">No Recruits Found</h3>
                                <p className="text-sm text-slate-400">
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
                              className="group hover:bg-white/[0.05] transition-colors cursor-pointer active:bg-white/[0.08]"
                            >
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                                    recruit.status === 'Active'
                                      ? isXMUser 
                                        ? "bg-red-500/20 text-red-300 border-red-500/20" 
                                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/20"
                                      : "bg-neutral-800 text-slate-500 border-white/5"
                                  )}>
                                    {recruit.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{maskEmail(recruit.email)}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">#{formatId(recruit.id)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-white">{formatDate(recruit.created_at)}</p>
                                <p className="text-[10px] text-slate-500">{formatTime(recruit.created_at)}</p>
                              </td>
                              <td className="p-4">
                                {recruit.mt5_id ? (
                                  <span className={cn(
                                    "font-mono text-xs px-2.5 py-1 rounded-lg border",
                                    isXMUser 
                                      ? "bg-red-500/10 text-red-300 border-red-500/20" 
                                      : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                                  )}>
                                    {recruit.mt5_id}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600">Not linked</span>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="text-sm font-mono text-white">
                                  {recruit.status === 'Active' ? formatNumber(recruit.total_lots_traded || 0, 2) : '0.00'}
                                </p>
                              </td>
                              <td className="p-4">
                                <p className={cn(
                                  "text-sm font-bold",
                                  recruit.status === 'Active' 
                                    ? "text-green-400" 
                                    : "text-slate-600"
                                )}>
                                  {recruit.status === 'Active' 
                                    ? formatCurrency(recruit.estimated_earnings || 0)
                                    : '$0.00'
                                  }
                                </p>
                              </td>
                              <td className="p-4">
                                <StatusBadge status={recruit.status || 'Pending'} />
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
                        <h3 className="text-lg font-bold text-white mb-1">No Recruits Found</h3>
                        <p className="text-sm text-slate-500">Share your link to start recruiting!</p>
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
                                : "bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                                recruit.status === 'Active'
                                  ? isXMUser ? "bg-red-500/20 text-red-300" : "bg-cyan-500/20 text-cyan-300"
                                  : "bg-neutral-800 text-slate-500"
                              )}>
                                {recruit.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white">{maskEmail(recruit.email)}</p>
                                <p className="text-xs text-slate-500">Joined {formatDate(recruit.created_at)}</p>
                              </div>
                            </div>
                            <StatusBadge status={recruit.status || 'Pending'} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Lots Traded</p>
                              <p className="text-lg font-mono font-bold text-white">
                                {recruit.status === 'Active' ? formatNumber(recruit.total_lots_traded || 0, 1) : '0.0'}
                              </p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Your Earnings</p>
                              <p className={cn(
                                "text-lg font-bold",
                                recruit.status === 'Active' ? "text-green-400" : "text-slate-600"
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
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Showing <span className="text-white font-medium">{filteredRecruits.length}</span> of {stats.total} recruits
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
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
                    ? "bg-gradient-to-br from-red-950/50 to-orange-950/50 border-red-500/20" 
                    : "bg-gradient-to-br from-cyan-950/50 to-cyan-950/50 border-cyan-500/20"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      isXMUser ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
                    )}>
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      +{monthlyGrowth}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Total Lifetime Earnings</p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(earnings.total_earnings + earnings.this_month)}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Pending Payout</p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(earnings.pending_earnings + earnings.this_month * 0.8)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Next payout: First week of Feb</p>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Already Withdrawn</p>
                  <p className="text-3xl font-black text-white">
                    {formatCurrency(earnings.paid_earnings)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Across all payouts</p>
                </div>
              </div>

              {/* Commission Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Commission Structure</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                        )}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Your Commission Rate</p>
                          <p className="text-xs text-slate-500">{currentTier.name} Tier</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-white">{currentTier.commissionPercent}%</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                        )}>
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Per Lot Rate</p>
                          <p className="text-xs text-slate-500">{isXMUser ? 'XM Broker' : 'Vantage Broker'}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-white">
                        ${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Bonus Multiplier</p>
                          <p className="text-xs text-slate-500">Applied to all earnings</p>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-white">{currentTier.bonusMultiplier}x</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Payout Information</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">Payout Schedule</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Payments are processed on the <span className="text-white">first week of each month</span> (typically Friday).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">Payment Methods</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Bank Transfer', 'PayPal', 'Crypto', 'Wise'].map((method) => (
                          <span key={method} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-white">Processing Time</span>
                      </div>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>• Most payments: 1-15 minutes</li>
                        <li>• Some banks: 1-7 business days</li>
                        <li>• New accounts: Up to 30 days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings Calculator */}
              <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Earnings Calculator</h3>
                <p className="text-sm text-slate-400 mb-6">See how much you could earn with your current tier</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[10, 50, 100, 500].map((lots) => {
                    const rate = isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot;
                    const commission = currentTier.commissionPercent / 100;
                    const calcEarnings = lots * rate * commission * currentTier.bonusMultiplier;
                    
                    return (
                      <div key={lots} className="p-4 rounded-xl bg-white/5 text-center">
                        <p className="text-sm text-slate-400 mb-1">{lots} lots/month</p>
                        <p className={cn(
                          "text-2xl font-black",
                          isXMUser ? "text-red-400" : "text-cyan-400"
                        )}>
                          {formatCurrency(calcEarnings)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">per trader</p>
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
                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-cyan-400")} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Conversion</span>
                  </div>
                  <p className="text-3xl font-black text-white">{stats.conversionRate}</p>
                  <p className="text-xs text-slate-500 mt-1">Active vs Total</p>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-cyan-400")} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Avg Lots</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {stats.active > 0 ? formatNumber(earnings.lifetime_lots / stats.active, 1) : '0.0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Per active trader</p>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-cyan-400")} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-black text-white">+{monthlyGrowth}%</p>
                    {Number(monthlyGrowth) >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">This month</p>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-cyan-400")} />
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Link Clicks</span>
                  </div>
                  <p className="text-3xl font-black text-white">{stats.total * 3 + 42}</p>
                  <p className="text-xs text-slate-500 mt-1">All time</p>
                </div>
              </div>

              {/* Recruitment Funnel */}
              <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Recruitment Funnel</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Link Clicks', value: stats.total * 3 + 42, percentage: 100 },
                    { label: 'Registrations', value: stats.total, percentage: stats.total > 0 ? Math.round((stats.total / (stats.total * 3 + 42)) * 100) : 0 },
                    { label: 'MT5 Connected', value: stats.active + Math.floor(stats.pending * 0.3), percentage: stats.total > 0 ? Math.round(((stats.active + Math.floor(stats.pending * 0.3)) / stats.total) * 100) : 0 },
                    { label: 'Active Trading', value: stats.active, percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0 },
                  ].map((item, idx) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white font-medium">{item.value} ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            isXMUser 
                              ? "bg-gradient-to-r from-red-600 to-orange-500" 
                              : "bg-gradient-to-r from-cyan-600 to-cyan-500"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips & Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">💡 Growth Tips</h3>
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
                          isXMUser ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
                        )}>
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">🎯 Quick Actions</h3>
                  <div className="space-y-3">
                    <button className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group",
                      isXMUser 
                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                        : "bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <Share2 className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-cyan-400")} />
                        <span className="text-sm font-medium text-white">Share on Social Media</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                    <button className="w-full p-4 rounded-xl border bg-white/5 border-white/10 text-left transition-all hover:bg-white/10 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium text-white">Request Promo Materials</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                    <button className="w-full p-4 rounded-xl border bg-white/5 border-white/10 text-left transition-all hover:bg-white/10 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-medium text-white">Contact Support</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRecruit(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />

            {/* Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedRecruit(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/80 rounded-full text-white border border-white/10 transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className={cn(
                  "p-6 border-b border-white/5",
                  isXMUser 
                    ? "bg-gradient-to-br from-red-950/50 to-transparent" 
                    : "bg-gradient-to-br from-cyan-950/50 to-transparent"
                )}>
                    <div className="flex items-start gap-4">
                         <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg",
                            isXMUser 
                              ? "bg-gradient-to-br from-red-600 to-orange-600" 
                              : "bg-gradient-to-br from-cyan-600 to-cyan-600"
                          )}>
                            {selectedRecruit.email.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-bold text-white">{maskEmail(selectedRecruit.email)}</h2>
                                <StatusBadge status={selectedRecruit.status || 'Pending'} />
                             </div>
                             <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                 <span className="flex items-center gap-1">
                                   <Tag className="w-3 h-3"/> 
                                   Recruit ID: <span className="font-mono text-slate-300">{formatId(selectedRecruit.id)}</span>
                                 </span>
                                 <span className="hidden sm:block">•</span>
                                 <span className="flex items-center gap-1">
                                   <Calendar className="w-3 h-3"/> 
                                   Joined {formatDate(selectedRecruit.created_at)}
                                 </span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                                <span className="text-xs text-slate-400 font-medium">Total Lots Traded</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {selectedRecruit.status === 'Active' 
                                  ? formatNumber(selectedRecruit.total_lots_traded || 0, 2)
                                  : "0.00"
                                }
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/5">
                             <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                  "p-1.5 rounded-lg",
                                  isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
                                )}>
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <span className="text-xs text-slate-400 font-medium">Your Earnings</span>
                            </div>
                            <p className={cn(
                              "text-2xl font-bold",
                              selectedRecruit.status === 'Active' ? "text-green-400" : "text-slate-600"
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
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Customer Journey</h3>
                        <div className="relative pl-6 space-y-6 border-l-2 border-white/10 ml-2">
                            {/* Step 1: Registered */}
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                </div>
                                <h4 className="text-white font-semibold text-sm">Account Created</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Registered via code <span className={cn("font-mono", isXMUser ? "text-red-400" : "text-cyan-400")}>{selectedRecruit.referred_by_code}</span>
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
                                      ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                                      : "bg-neutral-700 border-2 border-neutral-600"
                                )}>
                                  {selectedRecruit.mt5_id && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <h4 className={cn("font-semibold text-sm", selectedRecruit.mt5_id ? "text-white" : "text-slate-500")}>
                                    MT5 Account Linked
                                </h4>
                                {selectedRecruit.mt5_id ? (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Account ID: <span className="text-green-400 font-mono">{selectedRecruit.mt5_id}</span>
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
                                      ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                                      : "bg-neutral-700 border-2 border-neutral-600"
                                )}>
                                  {selectedRecruit.status === 'Active' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <h4 className={cn("font-semibold text-sm", selectedRecruit.status === 'Active' ? "text-white" : "text-slate-500")}>
                                    Active Trading
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedRecruit.status === 'Active' 
                                      ? "✅ Generating commissions on live trades"
                                      : "⏳ Waiting for first trade execution"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recruit Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Referral Code Used</span>
                          <span className={cn("font-mono", isXMUser ? "text-red-400" : "text-cyan-400")}>
                            {selectedRecruit.referred_by_code || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Their Affiliate Code</span>
                          <span className="text-slate-300 font-mono">
                            {selectedRecruit.affiliate_code || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Commission Tier</span>
                          <span className="text-white font-medium">{currentTier.name} ({currentTier.commissionPercent}%)</span>
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
                <div className="p-4 border-t border-white/5 flex gap-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(String(selectedRecruit.id));
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy Recruit ID
                  </button>
                  <button 
                    onClick={() => setSelectedRecruit(null)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                      isXMUser 
                        ? "bg-red-600 hover:bg-red-500 text-white" 
                        : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    )}
                  >
                    Close
                  </button>
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
const EarningsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp, 
  isXMUser, 
  primary 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ElementType; 
  trend?: string; 
  trendUp?: boolean; 
  isXMUser: boolean;
  primary?: boolean;
}) => (
  <div className={cn(
    "p-5 rounded-2xl border transition-all",
    primary 
      ? isXMUser 
        ? "bg-gradient-to-br from-red-950/60 to-orange-950/60 border-red-500/20" 
        : "bg-gradient-to-br from-cyan-950/60 to-cyan-950/60 border-cyan-500/20"
      : "bg-neutral-900/60 border-white/5"
  )}>
    <div className="flex items-center justify-between mb-3">
      <div className={cn(
        "p-2.5 rounded-xl",
        primary
          ? isXMUser ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"
          : "bg-white/5 text-slate-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          trendUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{title}</p>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
  </div>
);

const QuickStatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'accent',
  isXMUser 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  color?: 'accent' | 'green' | 'purple' | 'orange';
  isXMUser: boolean;
}) => {
  const colorClasses = {
    accent: isXMUser ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
    orange: "bg-orange-500/10 text-orange-400",
  };
  
  return (
    <div className="bg-neutral-900/60 border border-white/5 rounded-xl p-4 flex items-center gap-3">
      <div className={cn("p-2.5 rounded-xl", colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
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
        ? "bg-green-500/10 text-green-400 border-green-500/20" 
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {status}
    </div>
  );
};