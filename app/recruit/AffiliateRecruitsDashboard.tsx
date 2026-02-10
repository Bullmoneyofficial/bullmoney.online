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
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

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
  { name: 'Starter', minTraders: 1, maxTraders: 4, commissionPercent: 5, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.0, color: '#000000', icon: 'target', perks: ['Basic dashboard access', 'Monthly payouts', 'Email support'] },
  { name: 'Bronze', minTraders: 5, maxTraders: 14, commissionPercent: 10, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.1, color: '#cd7f32', icon: 'award', perks: ['Priority email support', 'Weekly performance reports', 'Custom referral link'] },
  { name: 'Silver', minTraders: 15, maxTraders: 29, commissionPercent: 15, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.2, color: '#c0c0c0', icon: 'star', perks: ['Telegram support', 'Marketing materials', 'Bi-weekly payouts'] },
  { name: 'Gold', minTraders: 30, maxTraders: 49, commissionPercent: 20, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.35, color: '#ffd700', icon: 'trophy', perks: ['1-on-1 support calls', 'Co-branded landing pages', 'Weekly payouts'] },
  { name: 'Elite', minTraders: 50, maxTraders: null, commissionPercent: 25, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.5, color: '#000000', icon: 'sparkles', perks: ['Dedicated account manager', 'Custom commission rates', 'Instant payouts', 'Exclusive bonuses'] },
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
  return useCurrencyLocaleStore.getState().formatPrice(amount);
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
    // Return base URL if no valid tracking code
    if (!myTrackingCode || myTrackingCode === 'Loading...' || myTrackingCode === 'No Code Found' || myTrackingCode.trim() === '') {
      return 'https://bullmoney.online/register';
    }
    
    // Build URL safely without using URL constructor (which can fail in some SSR contexts)
    const baseUrl = 'https://bullmoney.online/register';
    const params = new URLSearchParams();
    params.set('ref', myTrackingCode.trim());
    params.set('utm_source', 'affiliate');
    params.set('utm_medium', 'dashboard');
    params.set('utm_campaign', 'partner_link');
    
    return `${baseUrl}?${params.toString()}`;
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
          setMyTrackingCode('No Code Found');
          setErrorMsg('Your affiliate code is not set up yet. Please contact support.');
          setRecruits([]);
          if (!isPolling) setLoading(false);
          return;
        }

        codeToSearch = userData.affiliate_code;
        setMyTrackingCode(codeToSearch);
        
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
    if (!referralLink || referralLink === 'https://bullmoney.online/register') {
      setErrorMsg('No referral link available. Please ensure you have an affiliate code.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    try {
      const success = await copyToClipboard(referralLink);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      } else {
        // Show error to user
        setErrorMsg('Failed to copy link. Please copy manually.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (err) {
      console.error('Copy failed', err);
      setErrorMsg('Failed to copy link. Please copy manually.');
      setTimeout(() => setErrorMsg(null), 3000);
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
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
      "min-h-screen bg-white text-black font-sans",
      isXMUser ? "selection:bg-red-500/30" : "selection:bg-black/30"
    )}>
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-10",
          isXMUser ? "bg-red-400" : "bg-black"
        )} />
        <div className={cn(
          "absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-5",
          isXMUser ? "bg-orange-400" : "bg-black"
        )} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 relative z-10">
        
        {/* TOP NAVIGATION BAR - Improved mobile/desktop layout */}
        <header className="relative z-30 flex-shrink-0 mb-6 md:mb-8 bg-black rounded-2xl p-4">
          {/* Mobile: Stack vertically, Desktop: Horizontal */}
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3 md:mb-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="p-2 sm:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                  Affiliate Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5 hidden sm:block">Track, manage & grow your affiliate network</p>
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => checkAuthAndLoad(false)}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all"
                title="Refresh Data"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all" title="Notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-black font-semibold text-sm transition-all",
                isXMUser
                  ? "bg-linear-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-900/20"
                  : "bg-white hover:bg-white/90 shadow-lg"
              )}>
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Mobile: Tier badge + action buttons row */}
          <div className="flex items-center justify-between gap-2 md:hidden">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
              currentTier.name === 'Elite' ? "bg-white/10 text-white border-white/20" :
              currentTier.name === 'Gold' ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
              currentTier.name === 'Silver' ? "bg-white/10 text-white/70 border-white/20" :
              currentTier.name === 'Bronze' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
              isXMUser ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-white/10 text-white border-white/20"
            )}>
              {React.createElement(getTierIcon(currentTier.icon), { className: "w-3 h-3" })}
              {currentTier.name}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => checkAuthAndLoad(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all">
                <Bell className="w-4 h-4" />
              </button>
              <button className={cn(
                "p-2 rounded-lg transition-all",
                isXMUser
                  ? "bg-linear-to-r from-red-600 to-orange-600 text-white"
                  : "bg-white text-black"
              )}>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop tier badge - inline with title */}
          <div className={cn(
            "hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-2",
            currentTier.name === 'Elite' ? "bg-white/10 text-white border-white/20" :
            currentTier.name === 'Gold' ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
            currentTier.name === 'Silver' ? "bg-white/10 text-white/70 border-white/20" :
            currentTier.name === 'Bronze' ? "bg-orange-500/20 text-orange-300 border-orange-500/30" :
            isXMUser ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-white/10 text-white border-white/20"
          )}>
            {React.createElement(getTierIcon(currentTier.icon), { className: "w-3.5 h-3.5" })}
            {currentTier.name} Partner
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

        {/* REFERRAL LINK BANNER - Improved mobile layout */}
        <div className={cn(
          "relative z-10 shrink-0 mb-6 md:mb-8 p-4 md:p-6 rounded-2xl border",
          isXMUser
            ? "bg-linear-to-br from-red-950/80 to-orange-950/80 border-red-500/20"
            : "bg-linear-to-br from-white to-white/80 border-black/20"
        )}>
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl shrink-0",
                isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
              )}>
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-black text-base">Your Referral Link</h3>
                <p className="text-xs text-black/45">Share to earn commissions</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-3 rounded-xl text-center", isXMUser ? "bg-red-500/10" : "bg-black/5")}>
                <p className="text-xl font-black text-black">{currentTier.commissionPercent}%</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Commission</p>
              </div>
              <div className={cn("p-3 rounded-xl text-center", isXMUser ? "bg-red-500/10" : "bg-black/5")}>
                <p className="text-xl font-black text-black">${isXMUser ? currentTier.xmRatePerLot : currentTier.vantageRatePerLot}</p>
                <p className="text-[10px] text-black/50 uppercase tracking-wide">Per Lot</p>
              </div>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs font-mono break-all leading-relaxed",
              isXMUser ? "bg-red-500/5 border-red-500/20 text-red-200" : "bg-black/5 border-black/20 text-black/80"
            )}>
              {referralLink}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                  copiedLink
                    ? "bg-green-500/20 border-green-500/30 text-green-300"
                    : isXMUser
                      ? "bg-red-500/10 border-red-500/20 text-red-300 active:bg-red-500/20"
                      : "bg-black/10 border-black/20 text-black active:bg-black/20"
                )}
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleCopyCode}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                  copiedCode
                    ? "bg-green-500/20 border-green-500/30 text-green-300"
                    : "bg-black/5 border-black/10 text-black/60 active:bg-black/10"
                )}
              >
                <Tag className="w-4 h-4" />
                {copiedCode ? 'Copied!' : myTrackingCode}
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className={cn("p-3 rounded-xl shrink-0", isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black")}>
                <Link2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-black text-lg">Your Referral Link</h3>
                <p className="text-sm text-black/45 mb-3">Share this link to earn commissions on every trade your referrals make</p>
                <div className="flex items-center gap-3">
                  <code className={cn(
                    "px-3 py-2 rounded-lg text-sm font-mono border truncate max-w-[450px]",
                    isXMUser ? "bg-red-500/5 border-red-500/20 text-red-200" : "bg-black/5 border-black/20 text-black"
                  )}>
                    {referralLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all shrink-0",
                      copiedLink
                        ? "bg-green-500/20 border-green-500/30 text-green-300"
                        : isXMUser
                          ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                          : "bg-black/10 border-black/20 text-black hover:bg-black/20"
                    )}
                  >
                    {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all shrink-0",
                      copiedCode
                        ? "bg-green-500/20 border-green-500/30 text-green-300"
                        : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10"
                    )}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {copiedCode ? 'Copied!' : myTrackingCode}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l border-black/10 pl-6 shrink-0">
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

        {/* TAB NAVIGATION - Improved mobile sizing */}
        <div className="relative z-20 shrink-0 flex items-center gap-1.5 sm:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide bg-black/50 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-2 rounded-xl">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? isXMUser
                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                    : "bg-black/10 text-black border border-black/20"
                  : "text-black/45 hover:text-black hover:bg-black/5 border border-transparent"
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

              {/* TIER PROGRESSION - Improved mobile layout */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-4 md:p-6">
                  {/* Header - Stack on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-black">Tier Progression</h3>
                      <p className="text-xs md:text-sm text-black/50">Level up for higher commissions</p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border self-start sm:self-auto",
                      currentTier.name === 'Elite' ? "bg-black/10 border-black/20" :
                      currentTier.name === 'Gold' ? "bg-yellow-500/10 border-yellow-500/20" :
                      currentTier.name === 'Silver' ? "bg-black/5 border-black/15" :
                      currentTier.name === 'Bronze' ? "bg-orange-500/10 border-orange-500/20" :
                      "bg-black/10 border-black/20"
                    )}>
                      {React.createElement(getTierIcon(currentTier.icon), {
                        className: "w-4 h-4 md:w-5 md:h-5",
                        style: { color: currentTier.color }
                      })}
                      <span className="font-bold text-black text-sm">{currentTier.name}</span>
                      <span className="text-xs md:text-sm text-black/45 hidden xs:inline">({currentTier.commissionPercent}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-5 md:mb-6">
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 text-xs md:text-sm mb-2">
                      <span className="text-black/45">Progress to {nextTier?.name || 'Max Tier'}</span>
                      <span className="text-black font-medium">
                        {stats.active} / {nextTier?.minTraders || stats.active} active traders
                      </span>
                    </div>
                    <div className="h-2.5 md:h-3 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tierProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          isXMUser
                            ? "bg-linear-to-r from-red-600 to-orange-500"
                            : "bg-linear-to-r from-white to-white"
                        )}
                      />
                    </div>
                    {nextTier && (
                      <p className="text-[10px] md:text-xs text-black/50 mt-2">
                        {nextTier.minTraders - stats.active} more active traders to reach {nextTier.name} ({nextTier.commissionPercent}%)
                      </p>
                    )}
                  </div>

                  {/* All Tiers */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {AFFILIATE_TIERS.map((tier, index) => {
                      const TierIcon = getTierIcon(tier.icon) as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                      const isActive = currentTier.name === tier.name;
                      const isUnlocked = stats.active >= tier.minTraders;

                      return (
                        <div
                          key={tier.name}
                          className={cn(
                            "relative p-2 sm:p-3 rounded-lg sm:rounded-xl text-center transition-all border",
                            isActive
                              ? "bg-black/10 border-black/20 shadow-lg"
                              : isUnlocked
                                ? "bg-black/5 border-black/5"
                                : "bg-white/80 border-black/5 opacity-50"
                          )}
                        >
                          {isActive && (
                            <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2">
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-black" />
                              </div>
                            </div>
                          )}
                          <TierIcon
                            className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-0.5 sm:mb-1"
                            style={{ color: tier.color }}
                          />
                          <p className="text-[10px] sm:text-xs font-bold text-black truncate">{tier.name}</p>
                          <p className="text-[8px] sm:text-[10px] text-black/50">{tier.minTraders}+</p>
                          <p className="text-[10px] sm:text-xs font-bold mt-0.5 sm:mt-1" style={{ color: tier.color }}>
                            {tier.commissionPercent}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Tier Perks */}
                <div className="bg-white border border-black/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-black mb-4">Your Perks</h3>
                  <div className="space-y-3">
                    {currentTier.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "p-1.5 rounded-lg mt-0.5",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
                        )}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm text-black/60">{perk}</span>
                      </div>
                    ))}
                  </div>
                  
                  {nextTier && (
                    <div className="mt-6 pt-6 border-t border-black/5">
                      <h4 className="text-sm font-bold text-black/45 mb-3">Unlock at {nextTier.name}:</h4>
                      <div className="space-y-2">
                        {nextTier.perks.filter(p => !currentTier.perks.includes(p)).slice(0, 2).map((perk, i) => (
                          <div key={i} className="flex items-start gap-3 opacity-50">
                            <Lock className="w-4 h-4 text-slate-600 mt-0.5" />
                            <span className="text-sm text-black/50">{perk}</span>
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
              <div className="relative z-10 bg-white border border-black/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-black mb-6">How BullMoney Affiliate Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { step: 1, title: 'Share Your Link', desc: 'Share your unique referral link on social media, blogs, or directly with traders', icon: Share2 },
                    { step: 2, title: 'Users Sign Up', desc: 'When someone registers using your link, they become your recruit', icon: Users },
                    { step: 3, title: 'They Trade', desc: 'Every time your recruits trade, you earn commission on their lot volume', icon: Activity },
                    { step: 4, title: 'Get Paid', desc: 'Receive your earnings via bank transfer, PayPal, or crypto monthly', icon: Banknote },
                  ].map((item) => (
                    <div key={item.step} className="relative">
                      {item.step < 4 && (
                        <div className="hidden md:block absolute top-6 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-linear-to-r from-white/10 to-transparent" />
                      )}
                      <div className="text-center">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3",
                          isXMUser ? "bg-red-500/10 text-red-400" : "bg-black/10 text-black"
                        )}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div className={cn(
                          "text-xs font-bold mb-1",
                          isXMUser ? "text-red-400" : "text-black"
                        )}>
                          Step {item.step}
                        </div>
                        <h4 className="font-bold text-black mb-1">{item.title}</h4>
                        <p className="text-xs text-black/50">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                        "w-full bg-black/40 border border-black/10 rounded-lg pl-10 pr-4 py-2 md:py-2.5 text-sm text-black focus:outline-none transition-all placeholder:text-slate-600",
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
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/5 text-xs uppercase text-black/45 font-medium">
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
                              className="group hover:bg-black/[0.05] transition-colors cursor-pointer active:bg-black/[0.08]"
                            >
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                                    recruit.status === 'Active'
                                      ? isXMUser 
                                        ? "bg-red-500/20 text-red-300 border-red-500/20" 
                                        : "bg-black/20 text-black border-black/20"
                                      : "bg-black/5 text-black/50 border-black/5"
                                  )}>
                                    {recruit.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-black">{maskEmail(recruit.email)}</p>
                                    <p className="text-[10px] text-black/50 font-mono">#{formatId(recruit.id)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-black">{formatDate(recruit.created_at)}</p>
                                <p className="text-[10px] text-black/50">{formatTime(recruit.created_at)}</p>
                              </td>
                              <td className="p-4">
                                {recruit.mt5_id ? (
                                  <span className={cn(
                                    "font-mono text-xs px-2.5 py-1 rounded-lg border",
                                    isXMUser 
                                      ? "bg-red-500/10 text-red-300 border-red-500/20" 
                                      : "bg-black/10 text-black border-black/20"
                                  )}>
                                    {recruit.mt5_id}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600">Not linked</span>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="text-sm font-mono text-black">
                                  {recruit.status === 'Active' ? formatNumber(recruit.total_lots_traded || 0, 2) : '0.00'}
                                </p>
                              </td>
                              <td className="p-4">
                                <p className={cn(
                                  "text-sm font-bold",
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
                  {[
                    { label: 'Link Clicks', value: stats.total * 3 + 42, percentage: 100 },
                    { label: 'Registrations', value: stats.total, percentage: stats.total > 0 ? Math.round((stats.total / (stats.total * 3 + 42)) * 100) : 0 },
                    { label: 'MT5 Connected', value: stats.active + Math.floor(stats.pending * 0.3), percentage: stats.total > 0 ? Math.round(((stats.active + Math.floor(stats.pending * 0.3)) / stats.total) * 100) : 0 },
                    { label: 'Active Trading', value: stats.active, percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0 },
                  ].map((item, idx) => (
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
                    <button className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group",
                      isXMUser 
                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                        : "bg-black/5 border-black/20 hover:bg-black/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <Share2 className={cn("w-5 h-5", isXMUser ? "text-red-400" : "text-black")} />
                        <span className="text-sm font-medium text-black">Share on Social Media</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    </button>
                    <button className="w-full p-4 rounded-xl border bg-black/5 border-black/10 text-left transition-all hover:bg-black/10 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-black" />
                        <span className="text-sm font-medium text-black">Request Promo Materials</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-black/50 group-hover:text-black transition-colors" />
                    </button>
                    <button className="w-full p-4 rounded-xl border bg-black/5 border-black/10 text-left transition-all hover:bg-black/10 flex items-center justify-between group">
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
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />

            {/* Card - Bottom sheet on mobile, centered modal on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full sm:max-w-2xl bg-[#0a0a0a] rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-black/20" />
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedRecruit(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 bg-black/40 hover:bg-black/80 rounded-full text-black border border-black/10 transition-colors"
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
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  isXMUser: boolean;
  primary?: boolean;
}) => (
  <div className={cn(
    "p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border transition-all",
    primary
      ? isXMUser
        ? "bg-linear-to-br from-red-950/60 to-orange-950/60 border-red-500/20"
        : "bg-linear-to-br from-cyan-950/60 to-cyan-950/60 border-black/20"
      : "bg-white border-black/5"
  )}>
    <div className="flex items-center justify-between mb-2 sm:mb-3">
      <div className={cn(
        "p-2 sm:p-2.5 rounded-lg sm:rounded-xl",
        primary
          ? isXMUser ? "bg-red-500/20 text-red-400" : "bg-black/20 text-black"
          : "bg-black/5 text-black/45"
      )}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
          trendUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        )}>
          {trendUp ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-[10px] sm:text-xs text-black/50 uppercase tracking-wide mb-0.5 sm:mb-1">{title}</p>
    <p className="text-lg sm:text-xl md:text-2xl font-black text-black truncate">{value}</p>
    <p className="text-[10px] sm:text-xs text-black/50 mt-0.5 sm:mt-1">{subtitle}</p>
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