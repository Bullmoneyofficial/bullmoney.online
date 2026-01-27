"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { 
  X, Check, Mail, Hash, Lock, ArrowRight, ChevronLeft, ExternalLink, AlertCircle, 
  Copy, Eye, EyeOff, Loader2, User, DollarSign, Users, TrendingUp, Award, 
  Zap, Target, Gift, Calendar, ChevronRight, Info, Star, Sparkles, 
  Share2, MessageCircle, Clock, BarChart3, Percent, Coins, Trophy, ChevronDown,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js';

// --- ANALYTICS ---
import { BullMoneyAnalytics, trackEvent } from '@/lib/analytics';

// --- GLOBAL THEME CONTEXT ---
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";

// --- PERFORMANCE HOOKS ---
// import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// --- SUPABASE SETUP ---
const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ MISSING SUPABASE KEYS in .env.local file");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- DYNAMIC IMPORTS ---
const AffiliateRecruitsDashboard = dynamic(() => import("@/app/recruit/AffiliateRecruitsDashboard"), { ssr: false });
const AffiliateAdminPanel = dynamic(() => import("@/app/recruit/AffiliateAdminPanel"), { ssr: false });

const AFFILIATE_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// --- NEON BLUE THEME COLORS (Matching Navbar) ---
const NEON_BLUE = {
  // Primary neon blue (theme-driven)
  primary: 'var(--accent-color, #3b82f6)',
  primaryLight: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
  primaryDark: 'rgba(var(--accent-rgb, 59, 130, 246), 1)',
  // Cyan accent (kept for contrast)
  cyan: '#22d3ee',
  cyanLight: '#67e8f9',
  // Static neon glow values
  border: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)',
  borderHover: 'rgba(var(--accent-rgb, 59, 130, 246), 0.9)',
  glow: '0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.4)',
  glowStrong: '0 0 30px rgba(var(--accent-rgb, 59, 130, 246), 0.6)',
  glowIntense: '0 0 40px rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
  // Background
  bgDark: 'rgba(0, 0, 0, 0.95)',
  bgCard: 'rgba(0, 0, 0, 0.8)',
  // Text
  textPrimary: 'rgba(var(--accent-rgb, 59, 130, 246), 0.8)',
  textSecondary: 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)',
  textMuted: 'rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
  textWhite: '#ffffff',
};

// --- FORM DATA INTERFACES ---
interface FormData {
  email: string;
  mt5Number: string;
  password: string;
  referralCode: string;
}

// --- AFFILIATE TIER SYSTEM ---
const AFFILIATE_TIERS = [
  { 
    name: 'Starter', 
    minTraders: 1, 
    maxTraders: 4, 
    commissionPercent: 5, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: NEON_BLUE.primary,
    icon: Target 
  },
  { 
    name: 'Bronze', 
    minTraders: 5, 
    maxTraders: 14, 
    commissionPercent: 10, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: '#cd7f32',
    icon: Award 
  },
  { 
    name: 'Silver', 
    minTraders: 15, 
    maxTraders: 29, 
    commissionPercent: 15, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: '#c0c0c0',
    icon: Star 
  },
  { 
    name: 'Gold', 
    minTraders: 30, 
    maxTraders: 49, 
    commissionPercent: 20, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: '#ffd700',
    icon: Trophy 
  },
  { 
    name: 'Elite', 
    minTraders: 50, 
    maxTraders: Infinity, 
    commissionPercent: 25, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: '#00d4ff',
    icon: Sparkles 
  },
];

// --- EARNINGS CALCULATOR ---
const calculateEarnings = (
  traders: number, 
  avgLotsPerTrader: number, 
  broker: 'XM' | 'Vantage',
  socialPosts: number // posts per week
): { commission: number; bonus: number; total: number; tier: typeof AFFILIATE_TIERS[0] } => {
  // Find tier based on traders
  const tier = AFFILIATE_TIERS.find(t => traders >= t.minTraders && traders <= t.maxTraders) || AFFILIATE_TIERS[0];
  
  // Base rate per lot
  const baseRate = broker === 'XM' ? tier.xmRate : tier.vantageRate;
  
  // Commission per lot = baseRate * (commissionPercent / 100)
  const commissionPerLot = baseRate * (tier.commissionPercent / 100);
  
  // Total lots traded by all referred traders
  const totalLots = traders * avgLotsPerTrader;
  
  // Base commission
  const commission = totalLots * commissionPerLot;
  
  // Bonus calculation: If traders trade >20 lots/month total
  // Bonus = commission difference * traders * social multiplier
  let bonus = 0;
  if (totalLots >= 20) {
    // Social media multiplier: 2x if posted 2x/week (8x/month), 1.5x if 6x/month
    const monthlyPosts = socialPosts * 4; // Convert weekly to monthly
    const socialMultiplier = monthlyPosts >= 8 ? 2 : monthlyPosts >= 6 ? 1.5 : 1;
    
    // Bonus = commissionPerLot * traders * socialMultiplier
    bonus = commissionPerLot * traders * socialMultiplier;
  }
  
  return {
    commission: Math.round(commission * 100) / 100,
    bonus: Math.round(bonus * 100) / 100,
    total: Math.round((commission + bonus) * 100) / 100,
    tier
  };
};

// --- NEON CARD COMPONENT ---
const NeonCard = memo(({ 
  children, 
  className,
  glow = true,
  padding = 'default'
}: { 
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

// --- NEON BUTTON COMPONENT ---
const NeonButton = memo(({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  size = 'default',
  className,
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'default' | 'large';
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  const sizeClasses = {
    small: 'py-2 px-4 text-sm',
    default: 'py-3 px-6 text-base',
    large: 'py-4 px-8 text-lg'
  };
  
  const variantStyles = {
    primary: {
      background: 'transparent',
      border: `2px solid ${disabled ? 'rgba(59, 130, 246, 0.3)' : NEON_BLUE.border}`,
      color: disabled ? 'rgba(147, 197, 253, 0.4)' : NEON_BLUE.textPrimary,
      boxShadow: disabled ? 'none' : NEON_BLUE.glow,
    },
    secondary: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: `2px solid ${disabled ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.4)'}`,
      color: disabled ? 'rgba(147, 197, 253, 0.4)' : NEON_BLUE.textPrimary,
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      border: '2px solid transparent',
      color: disabled ? 'rgba(147, 197, 253, 0.4)' : NEON_BLUE.textSecondary,
      boxShadow: 'none',
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-xl font-bold tracking-wide transition-all duration-300",
        "flex items-center justify-center gap-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        sizeClasses[size],
        className
      )}
      style={variantStyles[variant]}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
});

NeonButton.displayName = "NeonButton";

// --- NEON INPUT COMPONENT ---
const NeonInput = memo(({ 
  type = 'text',
  name,
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
  autoFocus = false,
  icon: Icon,
  className
}: { 
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) => {
  return (
    <div className={cn("relative group", className)}>
      {Icon && (
        <Icon 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
          style={{ color: 'rgba(59, 130, 246, 0.5)' }}
        />
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-lg py-3.5 text-white placeholder-blue-300/30",
          "focus:outline-none transition-all duration-300",
          "bg-black/60 border-2",
          Icon ? "pl-10 pr-4" : "px-4",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          borderColor: 'rgba(59, 130, 246, 0.3)',
        }}
      />
    </div>
  );
});
NeonInput.displayName = "NeonInput";

// --- STAT CARD COMPONENT ---
const StatCard = memo(({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  highlight = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}) => (
  <div 
    className={cn(
      "flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all",
      "bg-black/40"
    )}
    style={{
      borderColor: highlight ? NEON_BLUE.primary : 'rgba(59, 130, 246, 0.3)',
      boxShadow: highlight ? NEON_BLUE.glow : 'none',
    }}
  >
    <Icon 
      className="w-5 h-5 sm:w-6 sm:h-6 mb-2" 
      style={{ color: highlight ? NEON_BLUE.cyan : NEON_BLUE.textPrimary }} 
    />
    <span 
      className="text-lg sm:text-xl font-bold"
      style={{ color: NEON_BLUE.textWhite }}
    >
      {value}
    </span>
    <span 
      className="text-[10px] sm:text-xs text-center"
      style={{ color: NEON_BLUE.textMuted }}
    >
      {label}
    </span>
    {subtext && (
      <span 
        className="text-[9px] sm:text-[10px] mt-1"
        style={{ color: NEON_BLUE.textMuted }}
      >
        {subtext}
      </span>
    )}
  </div>
));
StatCard.displayName = "StatCard";

// --- TIER BADGE COMPONENT ---
const TierBadge = memo(({ tier, size = 'default' }: { tier: typeof AFFILIATE_TIERS[0]; size?: 'small' | 'default' | 'large' }) => {
  const Icon = tier.icon;
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  };
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border-2",
        sizeClasses[size]
      )}
      style={{
        borderColor: tier.color,
        color: tier.color,
        background: `${tier.color}15`,
        boxShadow: `0 0 15px ${tier.color}40`,
      }}
    >
      <Icon className="w-4 h-4" />
      {tier.name}
    </span>
  );
});
TierBadge.displayName = "TierBadge";

// --- COLLAPSIBLE SECTION ---
const CollapsibleSection = memo(({ title, subtitle, icon: Icon, children, defaultOpen = false }: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <details
    className="group rounded-2xl border-2 bg-black/70"
    style={{ borderColor: 'rgba(59, 130, 246, 0.35)' }}
    open={defaultOpen}
  >
    <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: NEON_BLUE.primary, background: 'rgba(59, 130, 246, 0.12)' }}
        >
          <Icon className="w-4 h-4" style={{ color: NEON_BLUE.cyan }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: NEON_BLUE.textWhite }}>{title}</p>
          {subtitle && <p className="text-[11px]" style={{ color: NEON_BLUE.textMuted }}>{subtitle}</p>}
        </div>
      </div>
      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" style={{ color: NEON_BLUE.textMuted }} />
    </summary>
    <div className="px-4 pb-4 pt-1">
      {children}
    </div>
  </details>
));
CollapsibleSection.displayName = "CollapsibleSection";

// --- CODE VAULT CARD (Static Evervault Style) ---
const CodeVaultCard = memo(({ label, code, onCopy, copied }: {
  label: string;
  code: string;
  onCopy: () => void;
  copied: boolean;
}) => (
  <div
    className="relative overflow-hidden rounded-2xl border-2 p-4"
    style={{ borderColor: NEON_BLUE.border, boxShadow: NEON_BLUE.glow }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background: 'conic-gradient(from 180deg at 50% 50%, rgba(59,130,246,0.0), rgba(34,211,238,0.35), rgba(59,130,246,0.0))'
      }}
    />
    <div className="relative z-10">
      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: NEON_BLUE.textMuted }}>{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xl sm:text-2xl font-black" style={{ color: NEON_BLUE.textWhite }}>{code}</span>
        <button
          onClick={onCopy}
          className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold"
          style={{
            borderColor: NEON_BLUE.border,
            color: NEON_BLUE.textPrimary,
            background: 'rgba(59, 130, 246, 0.12)'
          }}
        >
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <p className="text-[11px] mt-2" style={{ color: NEON_BLUE.textMuted }}>
        Paste this code during broker signup to connect your traders to you.
      </p>
    </div>
  </div>
));
CodeVaultCard.displayName = "CodeVaultCard";

// =========================================
// MAIN AFFILIATE MODAL COMPONENT
// =========================================

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'intro' | 'how-it-works' | 'signup-broker' | 'signup-mt5' | 'signup-account' | 'loading' | 'success' | 'dashboard';

export default function AffiliateModal({ isOpen, onClose }: AffiliateModalProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // const { isMobile: isMobileDevice } = useMobilePerformance();
  
  // Global theme context
  const { setIsXMUser } = useGlobalTheme();
  
  // Step management
  const [step, setStep] = useState<ModalStep>('intro');
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Session state
  const [savedSession, setSavedSession] = useState<{ id: string; email: string; mt5_id?: string } | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isVerifyingMT5, setIsVerifyingMT5] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'admin'>('dashboard');
  
  // Calculator state
  const [calcTraders, setCalcTraders] = useState(10);
  const [calcLots, setCalcLots] = useState(5);
  const [calcPosts, setCalcPosts] = useState(2);

  const brokerCode = activeBroker === 'Vantage' ? "BULLMONEY" : "X3R7P";
  const earnings = calculateEarnings(calcTraders, calcLots, activeBroker, calcPosts);

  const isAffiliateAdmin = useMemo(() => {
    const email = savedSession?.email?.toLowerCase();
    if (!email) return false;
    return AFFILIATE_ADMIN_EMAILS.includes(email);
  }, [savedSession]);

  // Initialize and check for saved session
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const savedSessionStr = localStorage.getItem('bullmoney_session');
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        if (session && session.email && session.id) {
          setSavedSession({ id: session.id, email: session.email, mt5_id: session.mt5_id });
          setFormData(prev => ({ ...prev, email: session.email }));
          setIsReturningUser(true);
          
          // If user has existing MT5 ID, go directly to dashboard
          if (session.mt5_id) {
            setFormData(prev => ({ ...prev, mt5Number: session.mt5_id }));
            setStep('dashboard');
          }
        }
      }
    } catch (e) {
      console.error('Error reading saved session:', e);
    }
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mt5Number' && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pass: string) => pass.length >= 6;
  const isValidMT5 = (id: string) => id.length >= 5;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  const handleBrokerClick = () => {
    const link = activeBroker === 'Vantage' ? "https://vigco.co/iQbe2u" : "https://affs.click/t5wni";
    BullMoneyAnalytics.trackAffiliateClick(activeBroker, 'affiliate_modal');
    window.open(link, '_blank');
  };

  const handleNext = async () => {
    setSubmitError(null);
    
    switch (step) {
      case 'intro':
        setStep('how-it-works');
        break;
      case 'how-it-works':
        setStep('signup-broker');
        break;
      case 'signup-broker':
        setStep('signup-mt5');
        break;
      case 'signup-mt5':
        if (!isValidMT5(formData.mt5Number)) {
          setSubmitError("Please enter a valid MT5 ID (min 5 digits).");
          return;
        }
        await verifyMT5Id();
        break;
      case 'signup-account':
        if (!isValidEmail(formData.email)) {
          setSubmitError("Please enter a valid email address.");
          return;
        }
        if (!isValidPassword(formData.password)) {
          setSubmitError("Password must be at least 6 characters.");
          return;
        }
        if (!acceptedTerms) {
          setSubmitError("You must agree to the Terms & Conditions.");
          return;
        }
        await handleRegisterSubmit();
        break;
    }
  };

  const handleBack = () => {
    const backMap: Partial<Record<ModalStep, ModalStep>> = {
      'how-it-works': 'intro',
      'signup-broker': 'how-it-works',
      'signup-mt5': 'signup-broker',
      'signup-account': 'signup-mt5',
    };
    const prevStep = backMap[step];
    if (prevStep) {
      setStep(prevStep);
      setSubmitError(null);
    }
  };

  const verifyMT5Id = async () => {
    setIsVerifyingMT5(true);
    setSubmitError(null);
    
    try {
      const { data: existingMT5, error: mt5Error } = await supabase
        .from("recruits")
        .select("id, email, mt5_id")
        .eq("mt5_id", formData.mt5Number)
        .maybeSingle();
      
      if (mt5Error) {
        console.error("MT5 verification error:", mt5Error);
      }
      
      if (existingMT5) {
        // MT5 ID exists - log them in
        if (isReturningUser && savedSession && existingMT5.email === savedSession.email) {
          localStorage.setItem("bullmoney_session", JSON.stringify({
            id: existingMT5.id,
            email: existingMT5.email,
            mt5_id: existingMT5.mt5_id,
            timestamp: Date.now(),
            broker: activeBroker
          }));
          if (activeBroker === 'XM') setIsXMUser(true);
          setStep('success');
          return;
        }
        
        // MT5 belongs to different account - still log them in
        setSavedSession({
          id: existingMT5.id,
          email: existingMT5.email,
          mt5_id: existingMT5.mt5_id
        });
        setIsReturningUser(true);
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: existingMT5.id,
          email: existingMT5.email,
          mt5_id: existingMT5.mt5_id,
          timestamp: Date.now(),
          broker: activeBroker
        }));
        if (activeBroker === 'XM') setIsXMUser(true);
        setStep('success');
        return;
      }
      
      // MT5 ID is new - proceed to registration
      setStep('signup-account');
    } catch (err: any) {
      console.error("MT5 verification error:", err);
      setSubmitError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingMT5(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setStep('loading');
    setSubmitError(null);
    
    trackEvent('checkout_start', { 
      broker: activeBroker, 
      hasReferralCode: !!formData.referralCode 
    });

    try {
      const { data: existingUser } = await supabase
        .from("recruits")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please Login.");
      }

      const insertPayload = {
        email: formData.email,
        mt5_id: formData.mt5Number,
        password: formData.password,
        referred_by_code: formData.referralCode || null,
        used_code: true,
      };

      const { data: newUser, error } = await supabase
        .from("recruits")
        .insert([insertPayload])
        .select()
        .single();
      
      if (error) throw error;

      if (newUser) {
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          mt5_id: formData.mt5Number,
          timestamp: Date.now(),
          broker: activeBroker
        }));
        
        BullMoneyAnalytics.trackAffiliateSignup(formData.referralCode || 'direct');
        trackEvent('signup', { 
          method: 'email', 
          broker: activeBroker,
          source: 'affiliate_modal' 
        });
        
        if (activeBroker === 'XM') {
          setIsXMUser(true);
        }
      }

      setTimeout(() => setStep('success'), 1000);

    } catch (err: any) {
      console.error("Submission Error:", err);
      trackEvent('error', { 
        type: 'registration_failed', 
        message: err.message || 'Unknown error' 
      });
      
      setSubmitError(err.message || "Connection failed. Please check your internet.");
      setStep('signup-account');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bullmoney_session');
    setFormData({ email: '', mt5Number: '', password: '', referralCode: '' });
    setSavedSession(null);
    setIsReturningUser(false);
    setAcceptedTerms(false);
    setSubmitError(null);
    setStep('intro');
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // =========================================
  // RENDER INTRO SCREEN
  // =========================================
  const renderIntro = () => (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <NeonCard padding="large" className="text-center">
        {/* Header Icon */}
        <div 
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border-2"
          style={{ 
            borderColor: NEON_BLUE.primary,
            boxShadow: NEON_BLUE.glowStrong,
            background: 'rgba(59, 130, 246, 0.1)'
          }}
        >
          <DollarSign className="w-10 h-10" style={{ color: NEON_BLUE.cyan }} />
        </div>
        
        <h1 
          className="text-2xl sm:text-3xl font-black mb-3"
          style={{ color: NEON_BLUE.textWhite }}
        >
          BullMoney Affiliate Program
        </h1>
        
        <p 
          className="text-sm sm:text-base mb-5 leading-relaxed"
          style={{ color: NEON_BLUE.textSecondary }}
        >
          Earn <span style={{ color: NEON_BLUE.cyan }}>5-25% commission</span> every time your traders place real trades.
          Bring more traders → unlock higher tiers → stack bigger monthly payouts.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="text-[11px] px-2 py-1 rounded-full border-2" style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}>Fast payout</span>
          <span className="text-[11px] px-2 py-1 rounded-full border-2" style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}>No cap earnings</span>
          <span className="text-[11px] px-2 py-1 rounded-full border-2" style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}>Bonus boosts</span>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Percent} label="Commission" value="5-25%" highlight />
          <StatCard icon={Users} label="No Limit" value="∞ Traders" />
          <StatCard icon={Gift} label="Bonuses" value="2x" subtext="with social" />
        </div>
        
        {/* CTA Buttons */}
        <div className="space-y-3">
          <NeonButton 
            onClick={handleNext} 
            variant="primary" 
            size="large" 
            className="w-full"
            icon={ArrowRight}
          >
            See How You Earn
          </NeonButton>
          
          {savedSession && (
            <NeonButton 
              onClick={() => setStep('dashboard')} 
              variant="secondary" 
              className="w-full"
              icon={User}
            >
              Continue as {savedSession.email.split('@')[0]}
            </NeonButton>
          )}
        </div>
        
        <p 
          className="text-[10px] sm:text-xs mt-4 flex items-center justify-center gap-1"
          style={{ color: NEON_BLUE.textMuted }}
        >
          <Lock className="w-3 h-3" /> Free to join • No hidden fees
        </p>
      </NeonCard>
    </motion.div>
  );

  // =========================================
  // RENDER HOW IT WORKS SCREEN
  // =========================================
  const renderHowItWorks = () => (
    <motion.div
      key="how-it-works"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <div className="space-y-3">
        <CollapsibleSection
          title="How You Earn Money"
          subtitle="Tap to expand the 3-step flow"
          icon={Info}
          defaultOpen
        >
          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-xl border-2" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ background: NEON_BLUE.primary, color: NEON_BLUE.textWhite }}>1</div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: NEON_BLUE.textWhite }}>Recruit Traders</h3>
                <p className="text-sm" style={{ color: NEON_BLUE.textSecondary }}>
                  Share your affiliate code. Traders sign up, open accounts, and get verified under you.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-xl border-2" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ background: NEON_BLUE.primary, color: NEON_BLUE.textWhite }}>2</div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: NEON_BLUE.textWhite }}>They Trade, You Earn</h3>
                <p className="text-sm" style={{ color: NEON_BLUE.textSecondary }}>
                  XM: $11/lot × your tier %. Vantage: $5.50/lot × your tier %.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-xl border-2" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs" style={{ background: NEON_BLUE.primary, color: NEON_BLUE.textWhite }}>3</div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: NEON_BLUE.textWhite }}>Boost With Bonuses</h3>
                <p className="text-sm" style={{ color: NEON_BLUE.textSecondary }}>
                  Hit 20+ lots/month and post 2× per week to unlock higher multipliers.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Commission Tiers"
          subtitle="More traders = higher %"
          icon={Trophy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {AFFILIATE_TIERS.map((tier) => (
              <div 
                key={tier.name}
                className="flex flex-col items-center p-3 rounded-xl border-2 text-center"
                style={{ 
                  borderColor: `${tier.color}40`,
                  background: `${tier.color}10`
                }}
              >
                <tier.icon className="w-5 h-5 mb-1" style={{ color: tier.color }} />
                <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.name}</span>
                <span className="text-lg font-black" style={{ color: NEON_BLUE.textWhite }}>{tier.commissionPercent}%</span>
                <span className="text-[10px]" style={{ color: NEON_BLUE.textMuted }}>
                  {tier.minTraders}-{tier.maxTraders === Infinity ? '∞' : tier.maxTraders} traders
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Earnings Calculator"
          subtitle="Tap to estimate your monthly payout"
          icon={BarChart3}
        >
          <div>
            <div className="flex justify-center gap-2 mb-4">
              {(['Vantage', 'XM'] as const).map((broker) => (
                <button
                  key={broker}
                  onClick={() => setActiveBroker(broker)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all border-2"
                  style={{
                    borderColor: activeBroker === broker ? NEON_BLUE.primary : 'rgba(59, 130, 246, 0.3)',
                    background: activeBroker === broker ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: activeBroker === broker ? NEON_BLUE.textWhite : NEON_BLUE.textMuted,
                    boxShadow: activeBroker === broker ? NEON_BLUE.glow : 'none',
                  }}
                >
                  {broker}
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: NEON_BLUE.textSecondary }}>Traders Referred</span>
                  <span className="font-bold" style={{ color: NEON_BLUE.cyan }}>{calcTraders}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={calcTraders}
                  onChange={(e) => setCalcTraders(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${NEON_BLUE.primary} ${calcTraders}%, rgba(59, 130, 246, 0.2) ${calcTraders}%)` 
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: NEON_BLUE.textSecondary }}>Avg Lots/Trader/Month</span>
                  <span className="font-bold" style={{ color: NEON_BLUE.cyan }}>{calcLots}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={calcLots}
                  onChange={(e) => setCalcLots(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${NEON_BLUE.primary} ${calcLots * 2}%, rgba(59, 130, 246, 0.2) ${calcLots * 2}%)` 
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: NEON_BLUE.textSecondary }}>Social Posts/Week</span>
                  <span className="font-bold" style={{ color: NEON_BLUE.cyan }}>{calcPosts}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={calcPosts}
                  onChange={(e) => setCalcPosts(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, ${NEON_BLUE.primary} ${(calcPosts / 7) * 100}%, rgba(59, 130, 246, 0.2) ${(calcPosts / 7) * 100}%)` 
                  }}
                />
              </div>
            </div>

            <div 
              className="p-4 rounded-xl border-2"
              style={{ borderColor: NEON_BLUE.primary, background: 'rgba(59, 130, 246, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: NEON_BLUE.textSecondary }}>Your Tier</span>
                <TierBadge tier={earnings.tier} size="small" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs" style={{ color: NEON_BLUE.textMuted }}>Base Commission</p>
                  <p className="text-lg font-bold" style={{ color: NEON_BLUE.textWhite }}>${earnings.commission}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: NEON_BLUE.textMuted }}>Social Bonus</p>
                  <p className="text-lg font-bold" style={{ color: NEON_BLUE.cyan }}>+${earnings.bonus}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: NEON_BLUE.textMuted }}>Total/Month</p>
                  <p className="text-xl font-black" style={{ color: NEON_BLUE.cyan, textShadow: `0 0 20px ${NEON_BLUE.cyan}` }}>
                    ${earnings.total}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Payment Schedule"
          subtitle="When payouts hit your account"
          icon={Calendar}
        >
          <p className="text-sm" style={{ color: NEON_BLUE.textSecondary }}>
            Paid monthly in the first week (latest Friday). Most payments clear in 1–15 minutes. Some take 1–7 days. New accounts can take up to 30 days for international processing.
          </p>
        </CollapsibleSection>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <NeonButton onClick={handleBack} variant="ghost" className="sm:w-auto">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </NeonButton>
        <NeonButton onClick={handleNext} variant="primary" size="large" className="flex-1" icon={ArrowRight}>
          Start Earning Now
        </NeonButton>
      </div>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP BROKER SCREEN
  // =========================================
  const renderSignupBroker = () => (
    <motion.div
      key="signup-broker"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1 rounded-full border-2"
            style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}
          >
            Step 1 of 3
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: NEON_BLUE.textWhite }}>
          Open Trading Account
        </h2>
        <p className="text-sm mb-6" style={{ color: NEON_BLUE.textSecondary }}>
          Choose your preferred broker and open a free trading account. This only takes about 1 minute.
        </p>
        
        {/* Broker Toggle */}
        <div className="flex justify-center gap-3 mb-6">
          {(['Vantage', 'XM'] as const).map((broker) => (
            <button
              key={broker}
              onClick={() => setActiveBroker(broker)}
              className="px-6 py-3 rounded-xl text-base font-bold transition-all border-2"
              style={{
                borderColor: activeBroker === broker ? NEON_BLUE.primary : 'rgba(59, 130, 246, 0.3)',
                background: activeBroker === broker ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: activeBroker === broker ? NEON_BLUE.textWhite : NEON_BLUE.textMuted,
                boxShadow: activeBroker === broker ? NEON_BLUE.glowStrong : 'none',
              }}
            >
              {broker}
            </button>
          ))}
        </div>
        
        {/* Referral Code - Evervault Style */}
        <div className="mb-4">
          <CodeVaultCard label="Your Affiliate Code" code={brokerCode} onCopy={() => copyCode(brokerCode)} copied={copied} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: NEON_BLUE.border, background: 'rgba(59,130,246,0.08)' }}>
            <p className="text-[11px]" style={{ color: NEON_BLUE.textMuted }}>Step A</p>
            <p className="text-xs font-semibold" style={{ color: NEON_BLUE.textWhite }}>Open account</p>
          </div>
          <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: NEON_BLUE.border, background: 'rgba(59,130,246,0.08)' }}>
            <p className="text-[11px]" style={{ color: NEON_BLUE.textMuted }}>Step B</p>
            <p className="text-xs font-semibold" style={{ color: NEON_BLUE.textWhite }}>Paste code</p>
          </div>
          <div className="rounded-xl border-2 p-3 text-center" style={{ borderColor: NEON_BLUE.border, background: 'rgba(59,130,246,0.08)' }}>
            <p className="text-[11px]" style={{ color: NEON_BLUE.textMuted }}>Step C</p>
            <p className="text-xs font-semibold" style={{ color: NEON_BLUE.textWhite }}>Start earning</p>
          </div>
        </div>
        
        {/* Open Account Button */}
        <NeonButton onClick={handleBrokerClick} variant="primary" size="large" className="w-full mb-4">
          Open Free {activeBroker} Account
          <ExternalLink className="w-4 h-4 ml-2" />
        </NeonButton>
        
        {/* Already have account */}
        <NeonButton onClick={handleNext} variant="secondary" className="w-full">
          I already have an account
        </NeonButton>
        
        <p 
          className="text-[10px] sm:text-xs mt-4 flex items-center justify-center gap-1"
          style={{ color: NEON_BLUE.textMuted }}
        >
          <Clock className="w-3 h-3" /> Takes about 1 minute • No deposit required
        </p>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: NEON_BLUE.textMuted }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP MT5 SCREEN
  // =========================================
  const renderSignupMT5 = () => (
    <motion.div
      key="signup-mt5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1 rounded-full border-2"
            style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}
          >
            Step 2 of 3
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: NEON_BLUE.textWhite }}>
          {isReturningUser ? "Verify Your MT5 ID" : "Enter Your Trading ID"}
        </h2>
        <p className="text-sm mb-6" style={{ color: NEON_BLUE.textSecondary }}>
          {isReturningUser 
            ? "Enter your MetaTrader 5 ID to verify your account." 
            : "After opening your account, you'll receive an email with your MT5 trading ID."}
        </p>
        
        {/* Returning User Info */}
        {isReturningUser && savedSession && (
          <div 
            className="p-3 rounded-xl mb-4 border-2"
            style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <p className="text-xs" style={{ color: NEON_BLUE.textSecondary }}>
              Welcome back, <span style={{ color: NEON_BLUE.cyan }}>{savedSession.email}</span>
            </p>
          </div>
        )}
        
        {/* MT5 Input */}
        <div className="space-y-4">
          <NeonInput
            type="tel"
            name="mt5Number"
            value={formData.mt5Number}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter MT5 ID (numbers only)"
            icon={Hash}
            disabled={isVerifyingMT5}
            autoFocus
          />
          
          <p className="text-xs flex items-center gap-1" style={{ color: NEON_BLUE.textMuted }}>
            <Lock className="w-3 h-3" /> Used only to verify your access
          </p>
          
          {submitError && (
            <div 
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{ borderColor: 'rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">{submitError}</span>
            </div>
          )}
        </div>
        
        {/* Continue Button */}
        <NeonButton 
          onClick={handleNext} 
          variant="primary" 
          size="large" 
          className="w-full mt-6"
          disabled={!formData.mt5Number || isVerifyingMT5}
        >
          {isVerifyingMT5 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </NeonButton>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: NEON_BLUE.textMuted }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP ACCOUNT SCREEN
  // =========================================
  const renderSignupAccount = () => (
    <motion.div
      key="signup-account"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1 rounded-full border-2"
            style={{ borderColor: NEON_BLUE.border, color: NEON_BLUE.textPrimary }}
          >
            Step 3 of 3
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: NEON_BLUE.textWhite }}>
          Create Your Affiliate Account
        </h2>
        <p className="text-sm mb-6" style={{ color: NEON_BLUE.textSecondary }}>
          Set up your login to access your affiliate dashboard and track earnings.
        </p>
        
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Email */}
          <div>
            <NeonInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Email address"
              icon={Mail}
              disabled={isReturningUser}
              autoFocus={!isReturningUser}
            />
            <p className="text-[10px] mt-1 ml-1" style={{ color: NEON_BLUE.textMuted }}>
              {isReturningUser ? "Using your saved email." : "We'll send your login details here."}
            </p>
          </div>
          
          {/* Password */}
          <div className="relative">
            <NeonInput
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Create password (min 6 chars)"
              icon={Lock}
              autoFocus={isReturningUser}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: NEON_BLUE.textMuted }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <p className="text-[10px] mt-1 ml-1" style={{ color: NEON_BLUE.textMuted }}>
              Must be at least 6 characters.
            </p>
          </div>
          
          {/* Referral Code (if new user) */}
          {!isReturningUser && (
            <div>
              <NeonInput
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Referral Code (Optional)"
                icon={User}
              />
              <p className="text-[10px] mt-1 ml-1" style={{ color: NEON_BLUE.textMuted }}>
                Leave blank if you don't have one.
              </p>
            </div>
          )}
          
          {/* Terms Checkbox */}
          <div 
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
            style={{ 
              borderColor: 'rgba(59, 130, 246, 0.3)', 
              background: acceptedTerms ? 'rgba(59, 130, 246, 0.1)' : 'transparent' 
            }}
          >
            <div 
              className="w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors"
              style={{ 
                borderColor: acceptedTerms ? NEON_BLUE.primary : 'rgba(59, 130, 246, 0.4)',
                background: acceptedTerms ? NEON_BLUE.primary : 'transparent'
              }}
            >
              {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <p className="text-xs leading-tight" style={{ color: NEON_BLUE.textSecondary }}>
              I agree to the Terms of Service and understand this is educational content.
            </p>
          </div>
          
          {submitError && (
            <div 
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{ borderColor: 'rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">{submitError}</span>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <NeonButton 
          onClick={handleNext} 
          variant="primary" 
          size="large" 
          className="w-full mt-6"
          disabled={!formData.email || !formData.password || !acceptedTerms}
        >
          Create Account & Start Earning
          <ArrowRight className="w-4 h-4 ml-2" />
        </NeonButton>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: NEON_BLUE.textMuted }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER LOADING SCREEN
  // =========================================
  const renderLoading = () => (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[300px]"
    >
      <Loader2 
        className="w-16 h-16 animate-spin mb-4" 
        style={{ color: NEON_BLUE.primary }} 
      />
      <h2 className="text-xl font-bold" style={{ color: NEON_BLUE.textPrimary }}>
        Creating Your Account...
      </h2>
    </motion.div>
  );

  // =========================================
  // RENDER SUCCESS SCREEN
  // =========================================
  const renderSuccess = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      <NeonCard padding="large" className="text-center">
        {/* Success Icon */}
        <div 
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2"
          style={{ 
            borderColor: NEON_BLUE.cyan,
            boxShadow: `0 0 40px ${NEON_BLUE.cyan}60`,
            background: `${NEON_BLUE.cyan}20`
          }}
        >
          <Check className="w-12 h-12" style={{ color: NEON_BLUE.cyan }} />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: NEON_BLUE.textWhite }}>
          You're In! 🚀
        </h2>
        <p className="text-sm sm:text-base mb-8" style={{ color: NEON_BLUE.textSecondary }}>
          Your affiliate account is now active. Start recruiting traders and earning commissions!
        </p>
        
        <NeonButton 
          onClick={() => setStep('dashboard')} 
          variant="primary" 
          size="large" 
          className="w-full mb-4"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </NeonButton>
        
        <button 
          onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
          className="flex items-center justify-center gap-2 text-sm mx-auto transition-colors"
          style={{ color: NEON_BLUE.textMuted }}
        >
          <MessageCircle className="w-4 h-4" /> Join Free Telegram
        </button>
      </NeonCard>
    </motion.div>
  );

  // =========================================
  // RENDER DASHBOARD SCREEN
  // =========================================
  const renderDashboard = () => (
    <div className="fixed inset-0 z-[999999] flex flex-col" style={{ background: NEON_BLUE.bgDark }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(0, 0, 0, 0.8)' }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold" style={{ color: NEON_BLUE.textPrimary }}>
            Affiliate Dashboard
          </h1>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setDashboardTab('dashboard')}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
                dashboardTab === 'dashboard' ? "bg-white/10" : "bg-transparent"
              )}
              style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: NEON_BLUE.textPrimary }}
            >
              Dashboard
            </button>
            {isAffiliateAdmin && (
              <button
                onClick={() => setDashboardTab('admin')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1",
                  dashboardTab === 'admin' ? "bg-white/10" : "bg-transparent"
                )}
                style={{ borderColor: 'rgba(59, 130, 246, 0.3)', color: NEON_BLUE.textPrimary }}
              >
                <Shield className="w-3 h-3" /> Admin Panel
              </button>
            )}
          </div>
          {savedSession && (
            <span className="text-xs hidden sm:inline" style={{ color: NEON_BLUE.textMuted }}>
              {savedSession.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NeonButton onClick={handleLogout} variant="ghost" size="small">
            <Lock className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </NeonButton>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full transition-all border-2"
            style={{ 
              borderColor: 'rgba(59, 130, 246, 0.3)',
              color: NEON_BLUE.textMuted
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto">
        {dashboardTab === 'dashboard' && (
          <AffiliateRecruitsDashboard onBack={() => setStep('success')} />
        )}
        {dashboardTab === 'admin' && isAffiliateAdmin && (
          <AffiliateAdminPanel />
        )}
      </div>
    </div>
  );

  // =========================================
  // MAIN RENDER
  // =========================================
  
  // Dashboard is fullscreen
  if (step === 'dashboard') {
    return renderDashboard();
  }

  // Modal wrapper for other steps
  return (
    <div 
      className="affiliate-modal fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
    >
      {/* Close Button */}
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full transition-all border-2"
        style={{ 
          borderColor: 'rgba(59, 130, 246, 0.3)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: NEON_BLUE.textMuted
        }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content Container */}
      <div 
        ref={scrollContainerRef}
        className="w-full max-h-[90vh] overflow-y-auto py-8"
      >
        <AnimatePresence mode="wait">
          {step === 'intro' && renderIntro()}
          {step === 'how-it-works' && renderHowItWorks()}
          {step === 'signup-broker' && renderSignupBroker()}
          {step === 'signup-mt5' && renderSignupMT5()}
          {step === 'signup-account' && renderSignupAccount()}
          {step === 'loading' && renderLoading()}
          {step === 'success' && renderSuccess()}
        </AnimatePresence>
      </div>
    </div>
  );
}
