"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
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
import { persistSession } from '@/lib/sessionPersistence';

// --- ANALYTICS ---
import { BullMoneyAnalytics, trackEvent } from '@/lib/analytics';

// --- GLOBAL THEME CONTEXT ---
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";

// --- PERFORMANCE HOOKS ---
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

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

// --- APPLE MINIMALIST THEME COLORS ---
const NEON_BLUE = {
  // Primary - Pure black for key elements
  primary: '#000000',
  primaryLight: 'rgba(0, 0, 0, 0.9)',
  primaryDark: '#000000',
  // Accent - Clean black
  cyan: '#000000',
  cyanLight: '#000000',
  // Borders - Subtle grays
  border: 'rgba(0, 0, 0, 0.10)',
  borderHover: 'rgba(0, 0, 0, 0.20)',
  glow: 'none',
  glowStrong: 'none',
  glowIntense: 'none',
  // Background - Light white
  bgDark: '#ffffff',
  bgCard: 'rgba(255, 255, 255, 1)',
  // Text - Apple-style hierarchy
  textPrimary: '#000000',
  textSecondary: 'rgba(0, 0, 0, 0.7)',
  textMuted: 'rgba(0, 0, 0, 0.45)',
  textWhite: '#000000',
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
    color: '#000000',
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

// --- APPLE CARD COMPONENT ---
const NeonCard = memo(({ 
  children, 
  className,
  glow = false,
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
        "relative rounded-3xl overflow-hidden",
        "border",
        paddingClasses[padding],
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 1)',
        borderColor: 'rgba(0, 0, 0, 0.08)',
      }}
    >
      {children}
    </div>
  );
});
NeonCard.displayName = "NeonCard";

// --- APPLE BUTTON COMPONENT ---
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
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) => {
  const sizeClasses = {
    small: 'py-2.5 px-5 text-sm',
    default: 'py-3.5 px-7 text-[15px]',
    large: 'py-4 px-8 text-base'
  };
  
  const variantStyles = {
    primary: {
      background: disabled ? 'rgba(0, 0, 0, 0.1)' : '#000000',
      border: 'none',
      color: disabled ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
    },
    secondary: {
      background: 'rgba(0, 0, 0, 0.05)',
      border: '1px solid rgba(0, 0, 0, 0.10)',
      color: disabled ? 'rgba(0, 0, 0, 0.4)' : '#000000',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      color: disabled ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.7)',
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-2xl font-semibold tracking-tight transition-all duration-200",
        "flex items-center justify-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90 active:scale-[0.98]",
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

// --- APPLE INPUT COMPONENT ---
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
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className?: string;
}) => {
  return (
    <div className={cn("relative group", className)}>
      {Icon && (
        <Icon 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors"
          style={{ color: 'rgba(0, 0, 0, 0.35)' }}
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
          "w-full rounded-xl py-4 text-black text-[15px] placeholder-black/25",
          "focus:outline-none focus:ring-2 focus:ring-black/20 transition-all duration-200",
          "border",
          Icon ? "pl-12 pr-4" : "px-4",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          background: 'rgba(0, 0, 0, 0.03)',
          borderColor: 'rgba(0, 0, 0, 0.08)',
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
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; 
  label: string; 
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}) => (
  <div 
    className={cn(
      "flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all",
      "bg-white"
    )}
    style={{
      borderColor: highlight ? NEON_BLUE.primary : 'rgba(0, 0, 0, 0.10)',
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

// --- TIER BADGE COMPONENT - Apple Style ---
const TierBadge = memo(({ tier, size = 'default' }: { tier: typeof AFFILIATE_TIERS[0]; size?: 'small' | 'default' | 'large' }) => {
  const Icon = tier.icon;
  const sizeClasses = {
    small: 'text-xs px-2.5 py-1',
    default: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  };
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium",
        sizeClasses[size]
      )}
      style={{
        color: '#000000',
        background: 'rgba(0, 0, 0, 0.08)',
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(0, 0, 0, 0.60)' }} />
      {tier.name}
    </span>
  );
});
TierBadge.displayName = "TierBadge";

// --- COLLAPSIBLE SECTION - Apple Style ---
const CollapsibleSection = memo(({ title, subtitle, icon: Icon, children, defaultOpen = false }: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <details
    className="group rounded-2xl"
    style={{ background: 'rgba(0, 0, 0, 0.03)' }}
    open={defaultOpen}
  >
    <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.05)' }}
        >
          <Icon className="w-4 h-4" style={{ color: 'rgba(0, 0, 0, 0.60)' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#000000' }}>{title}</p>
          {subtitle && <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>{subtitle}</p>}
        </div>
      </div>
      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" style={{ color: 'rgba(0, 0, 0, 0.35)' }} />
    </summary>
    <div className="px-4 pb-4 pt-1">
      {children}
    </div>
  </details>
));
CollapsibleSection.displayName = "CollapsibleSection";

// --- CODE VAULT CARD - Apple Minimalist Style ---
const CodeVaultCard = memo(({ label, code, onCopy, copied }: {
  label: string;
  code: string;
  onCopy: () => void;
  copied: boolean;
}) => (
  <div
    className="relative overflow-hidden rounded-2xl p-5"
    style={{ background: 'rgba(0, 0, 0, 0.04)' }}
  >
    <div className="relative z-10">
      <p className="text-xs mb-3" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: '#000000' }}>{code}</span>
        <button
          onClick={onCopy}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: copied ? '#000000' : 'rgba(0, 0, 0, 0.05)',
            color: copied ? '#ffffff' : '#000000',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs mt-3" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
        Clients must use this code when signing up with the broker
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

type ModalStep = 'intro' | 'how-it-works' | 'signup-broker' | 'verify-broker' | 'signup-skrill' | 'signup-mt5' | 'signup-account' | 'loading' | 'success' | 'dashboard';

// Main Affiliate Modal Component - Matches ChartNewsModal pattern
export default function AffiliateModal({ isOpen, onClose }: AffiliateModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && <AffiliateModalContent isOpen={isOpen} onClose={onClose} />}
    </AnimatePresence>,
    document.body
  );
}

// Affiliate Modal Content Component
function AffiliateModalContent({ isOpen, onClose }: AffiliateModalProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobilePerformance();
  
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
  
  // Detect mobile/desktop for layout switching
  const [isMobileView, setIsMobileView] = useState(false);
  
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

  // Detect screen size for responsive layout switching
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768); // 768px is typical tablet/desktop breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ESC key support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

  // Robust clipboard copy with fallback for production environments
  const copyCode = async (code: string) => {
    if (!code) return;
    
    try {
      // Method 1: Try modern Clipboard API (works in HTTPS)
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1100);
          return;
        } catch (clipboardErr) {
          console.warn('Clipboard API failed, trying fallback:', clipboardErr);
        }
      }

      // Method 2: Fallback using textarea (works in most environments)
      const textarea = document.createElement('textarea');
      textarea.value = code;
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
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      } else {
        setSubmitError('Failed to copy code. Please copy manually: ' + code);
        setTimeout(() => setSubmitError(null), 3000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setSubmitError('Failed to copy code. Please copy manually: ' + code);
      setTimeout(() => setSubmitError(null), 3000);
    }
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
        setStep('verify-broker');
        break;
      case 'verify-broker':
        setStep('signup-skrill');
        break;
      case 'signup-skrill':
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
      'verify-broker': 'signup-broker',
      'signup-skrill': 'verify-broker',
      'signup-mt5': 'signup-skrill',
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
      const res = await fetch('/api/recruit-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          mt5_id: formData.mt5Number,
          referred_by_code: formData.referralCode || null,
          used_code: true,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result?.success || !result?.recruit) {
        if (res.status === 409) {
          throw new Error('This email is already registered. Please Login.');
        }
        throw new Error(result?.error || 'Connection failed. Please check your internet.');
      }

      const newUser = result.recruit;
      persistSession({
        recruitId: newUser.id,
        email: newUser.email,
        mt5Id: newUser.mt5_id || formData.mt5Number,
        isVip: newUser.is_vip === true,
        timestamp: Date.now(),
      });

      BullMoneyAnalytics.trackAffiliateSignup(formData.referralCode || 'direct');
      trackEvent('signup', { 
        method: 'email', 
        broker: activeBroker,
        source: 'affiliate_modal' 
      });
      
      if (activeBroker === 'XM') {
        setIsXMUser(true);
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

  // =========================================
  // RENDER INTRO SCREEN
  // =========================================
  const renderIntro = () => (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large" className="text-center">
        {/* Header Icon - Apple minimalist */}
        <div 
          className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{ 
            background: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <DollarSign className="w-10 h-10" style={{ color: '#000000' }} />
        </div>
        
        <h1 
          className="text-2xl sm:text-3xl font-semibold mb-4 tracking-tight"
          style={{ color: '#000000' }}
        >
          Affiliate Program
        </h1>
        
        <p 
          className="text-[15px] sm:text-base mb-6 leading-relaxed"
          style={{ color: 'rgba(0, 0, 0, 0.85)' }}
        >
          Earn <span style={{ color: '#000000', fontWeight: 600 }}>5-25% commission</span> every time your traders place real trades.
          More traders means higher tiers and bigger payouts.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.70)' }}>Fast payouts</span>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.70)' }}>Unlimited earnings</span>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.70)' }}>Bonus rewards</span>
        </div>
        
        {/* Quick Stats - Apple clean grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
            <Percent className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
            <p className="text-lg font-semibold text-black">5-25%</p>
            <p className="text-[11px]" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Commission</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
            <Users className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
            <p className="text-lg font-semibold text-black">∞</p>
            <p className="text-[11px]" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>No Limit</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
            <Gift className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
            <p className="text-lg font-semibold text-black">2x</p>
            <p className="text-[11px]" style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Social Bonus</p>
          </div>
        </div>
        
        {/* CTA Buttons - Apple style */}
        <div className="space-y-3">
          <NeonButton 
            onClick={handleNext} 
            variant="primary" 
            size="large" 
            className="w-full"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </NeonButton>
          
          {savedSession && (
            <NeonButton 
              onClick={() => setStep('dashboard')} 
              variant="secondary" 
              className="w-full"
            >
              Continue as {savedSession.email.split('@')[0]}
            </NeonButton>
          )}
        </div>
        
        <p 
          className="text-xs mt-5 flex items-center justify-center gap-1.5"
          style={{ color: 'rgba(0, 0, 0, 0.35)' }}
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
      className="w-full max-w-4xl mx-auto space-y-4"
    >
      <div className="space-y-3">
        <CollapsibleSection
          title="How You Earn Money"
          subtitle="The 3-step process"
          icon={Info}
          defaultOpen
        >
          <div className="space-y-3">
            <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-medium text-xs" style={{ background: 'rgba(0, 0, 0, 0.08)', color: '#000000' }}>1</div>
              <div>
                <h3 className="font-medium mb-1" style={{ color: '#000000' }}>Recruit Traders</h3>
                <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                  Share your affiliate code. Traders sign up and get verified under you.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-medium text-xs" style={{ background: 'rgba(0, 0, 0, 0.08)', color: '#000000' }}>2</div>
              <div>
                <h3 className="font-medium mb-1" style={{ color: '#000000' }}>They Trade, You Earn</h3>
                <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                  XM: $11/lot × your tier %. Vantage: $5.50/lot × your tier %.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-medium text-xs" style={{ background: 'rgba(0, 0, 0, 0.08)', color: '#000000' }}>3</div>
              <div>
                <h3 className="font-medium mb-1" style={{ color: '#000000' }}>Get Paid via Skrill</h3>
                <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                  Monthly payouts sent directly to your Skrill account.
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
                className="flex flex-col items-center p-3 rounded-xl text-center"
                style={{ background: 'rgba(0, 0, 0, 0.03)' }}
              >
                <tier.icon className="w-5 h-5 mb-1" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>{tier.name}</span>
                <span className="text-lg font-semibold" style={{ color: '#000000' }}>{tier.commissionPercent}%</span>
                <span className="text-[10px]" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                  {tier.minTraders}-{tier.maxTraders === Infinity ? '∞' : tier.maxTraders} traders
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Earnings Calculator"
          subtitle="Estimate your monthly payout"
          icon={BarChart3}
        >
          <div>
            <div className="flex justify-center gap-2 mb-4 p-1 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              {(['Vantage', 'XM'] as const).map((broker) => (
                <button
                  key={broker}
                  onClick={() => setActiveBroker(broker)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeBroker === broker ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                    color: activeBroker === broker ? '#ffffff' : 'rgba(0, 0, 0, 0.50)',
                  }}
                >
                  {broker}
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'rgba(0, 0, 0, 0.60)' }}>Traders Referred</span>
                  <span className="font-medium" style={{ color: '#000000' }}>{calcTraders}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={calcTraders}
                  onChange={(e) => setCalcTraders(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, #000000 ${calcTraders}%, rgba(0, 0, 0, 0.10) ${calcTraders}%)` 
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'rgba(0, 0, 0, 0.60)' }}>Avg Lots/Trader/Month</span>
                  <span className="font-medium" style={{ color: '#000000' }}>{calcLots}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={calcLots}
                  onChange={(e) => setCalcLots(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, #000000 ${calcLots * 2}%, rgba(0, 0, 0, 0.10) ${calcLots * 2}%)` 
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'rgba(0, 0, 0, 0.60)' }}>Social Posts/Week</span>
                  <span className="font-medium" style={{ color: '#000000' }}>{calcPosts}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  value={calcPosts}
                  onChange={(e) => setCalcPosts(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ 
                    background: `linear-gradient(to right, #000000 ${(calcPosts / 7) * 100}%, rgba(0, 0, 0, 0.10) ${(calcPosts / 7) * 100}%)` 
                  }}
                />
              </div>
            </div>

            <div 
              className="p-4 rounded-xl"
              style={{ background: 'rgba(0, 0, 0, 0.04)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>Your Tier</span>
                <TierBadge tier={earnings.tier} size="small" />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Base Commission</p>
                  <p className="text-lg font-semibold" style={{ color: '#000000' }}>${earnings.commission}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Social Bonus</p>
                  <p className="text-lg font-semibold" style={{ color: '#000000' }}>+${earnings.bonus}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Total/Month</p>
                  <p className="text-xl font-semibold" style={{ color: '#000000' }}>
                    ${earnings.total}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Payment Schedule"
          subtitle="When you get paid"
          icon={Calendar}
        >
          <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
            Paid monthly via Skrill in the first week (latest Friday). Most payments arrive in 1–15 minutes. Some take 1–7 days. New accounts may take up to 30 days for international processing.
          </p>
        </CollapsibleSection>
      </div>
      
      {/* Action Buttons - Apple Style */}
      <div className="flex flex-col sm:flex-row gap-3">
        <NeonButton onClick={handleBack} variant="ghost" className="sm:w-auto">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </NeonButton>
        <NeonButton onClick={handleNext} variant="primary" size="large" className="flex-1">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </NeonButton>
      </div>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP BROKER SCREEN - Apple Style
  // =========================================
  const renderSignupBroker = () => (
    <motion.div
      key="signup-broker"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.60)' }}
          >
            Step 1 of 5
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          Open a Broker Account
        </h2>
        <p className="text-[15px] mb-6" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
          Choose your preferred broker and create a free trading account.
        </p>
        
        {/* Important Notice - Apple Alert Style */}
        <div 
          className="mb-6 p-4 rounded-2xl border"
          style={{ background: 'rgba(0, 0, 0, 0.03)', borderColor: 'rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#000000' }} />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Broker codes are #1 priority
              </p>
              <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                Without clients using your broker code, you cannot earn commissions. Make sure every client signs up with your code.
              </p>
            </div>
          </div>
        </div>
        
        {/* Broker Toggle - Apple Segmented Control */}
        <div className="flex justify-center gap-2 mb-6 p-1 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
          {(['Vantage', 'XM'] as const).map((broker) => (
            <button
              key={broker}
              onClick={() => setActiveBroker(broker)}
              className="flex-1 px-6 py-3 rounded-lg text-[15px] font-medium transition-all"
              style={{
                background: activeBroker === broker ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                color: activeBroker === broker ? '#ffffff' : 'rgba(0, 0, 0, 0.50)',
              }}
            >
              {broker}
            </button>
          ))}
        </div>
        
        {/* Referral Code - Clean Apple style */}
        <div className="mb-6">
          <CodeVaultCard label="Your Affiliate Code" code={brokerCode} onCopy={() => copyCode(brokerCode)} copied={copied} />
        </div>

        {/* Steps - Apple minimalist */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
            <p className="text-[10px] mb-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Step A</p>
            <p className="text-xs font-medium" style={{ color: '#000000' }}>Open account</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
            <p className="text-[10px] mb-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Step B</p>
            <p className="text-xs font-medium" style={{ color: '#000000' }}>Paste code</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
            <p className="text-[10px] mb-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>Step C</p>
            <p className="text-xs font-medium" style={{ color: '#000000' }}>Get MT5 ID</p>
          </div>
        </div>
        
        {/* Open Account Button */}
        <NeonButton onClick={handleBrokerClick} variant="primary" size="large" className="w-full mb-3">
          Open Free {activeBroker} Account
          <ExternalLink className="w-4 h-4 ml-2" />
        </NeonButton>
        
        {/* Already have account */}
        <NeonButton onClick={handleNext} variant="secondary" className="w-full">
          I already have an account
        </NeonButton>
        
        <p 
          className="text-xs mt-4 flex items-center justify-center gap-1.5"
          style={{ color: 'rgba(0, 0, 0, 0.35)' }}
        >
          <Clock className="w-3 h-3" /> Takes about 1 minute • No deposit required
        </p>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: 'rgba(0, 0, 0, 0.35)' }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER VERIFY BROKER SCREEN - NEW Apple Style
  // =========================================
  const renderVerifyBroker = () => (
    <motion.div
      key="verify-broker"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.60)' }}
          >
            Step 2 of 5
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          Verify Your Setup
        </h2>
        <p className="text-[15px] mb-6" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
          Please confirm you&apos;ve completed the broker registration properly.
        </p>
        
        {/* Critical Reminder */}
        <div 
          className="mb-6 p-5 rounded-2xl"
          style={{ background: 'rgba(0, 0, 0, 0.03)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.05)' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#000000' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                Important Checklist
              </p>
              <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                Your earnings depend on this
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <Check className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.60)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.80)' }}>
                I opened a {activeBroker} trading account
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <Check className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.60)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.80)' }}>
                I used the affiliate code: <span className="font-mono font-bold">{brokerCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)' }}>
              <Check className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.60)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.80)' }}>
                I received my MT5 trading ID via email
              </p>
            </div>
          </div>
        </div>
        
        {/* Warning Box */}
        <div 
          className="mb-6 p-4 rounded-xl border"
          style={{ background: 'rgba(180, 120, 0, 0.08)', borderColor: 'rgba(180, 120, 0, 0.25)' }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: '#92600a' }}>
            ⚠️ No code = No earnings
          </p>
          <p className="text-xs" style={{ color: 'rgba(120, 80, 0, 0.8)' }}>
            If your clients don&apos;t use your broker code when signing up, you will not receive any commission from their trades.
          </p>
        </div>
        
        {/* Confirm Button */}
        <NeonButton onClick={handleNext} variant="primary" size="large" className="w-full">
          Yes, I&apos;ve Completed All Steps
          <ArrowRight className="w-4 h-4 ml-2" />
        </NeonButton>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: 'rgba(0, 0, 0, 0.35)' }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP SKRILL SCREEN - NEW Apple Style
  // =========================================
  const renderSignupSkrill = () => (
    <motion.div
      key="signup-skrill"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.60)' }}
          >
            Step 3 of 5
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          Set Up Skrill for Payouts
        </h2>
        <p className="text-[15px] mb-6" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
          We use Skrill to send your affiliate commissions. Create a free account to receive payments.
        </p>
        
        {/* Skrill Info Card */}
        <div 
          className="mb-6 p-5 rounded-2xl text-center"
          style={{ background: 'rgba(0, 0, 0, 0.03)' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.05)' }}>
            <Coins className="w-8 h-8" style={{ color: '#000000' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
            Why Skrill?
          </h3>
          <div className="space-y-2 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.70)' }}>Fast international transfers</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.70)' }}>Low fees compared to banks</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.70)' }}>Secure and trusted worldwide</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
              <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.70)' }}>Most payments arrive in minutes</p>
            </div>
          </div>
        </div>
        
        {/* Payment Schedule */}
        <div 
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(0, 0, 0, 0.03)' }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5" style={{ color: 'rgba(0, 0, 0, 0.50)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#000000' }}>Paid Monthly</p>
              <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.50)' }}>
                First week of each month (latest Friday)
              </p>
            </div>
          </div>
        </div>
        
        {/* Create Skrill Button */}
        <NeonButton 
          onClick={() => window.open('https://www.skrill.com/en/', '_blank')} 
          variant="primary" 
          size="large" 
          className="w-full mb-3"
        >
          Create Free Skrill Account
          <ExternalLink className="w-4 h-4 ml-2" />
        </NeonButton>
        
        {/* Already have account */}
        <NeonButton onClick={handleNext} variant="secondary" className="w-full">
          I already have Skrill
        </NeonButton>
        
        <p 
          className="text-xs mt-4 text-center"
          style={{ color: 'rgba(0, 0, 0, 0.35)' }}
        >
          You&apos;ll enter your Skrill email in your dashboard later
        </p>
      </NeonCard>
      
      <button 
        onClick={handleBack} 
        className="mt-4 flex items-center text-sm mx-auto transition-colors"
        style={{ color: 'rgba(0, 0, 0, 0.35)' }}
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </button>
    </motion.div>
  );

  // =========================================
  // RENDER SIGNUP MT5 SCREEN - Apple Style
  // =========================================
  const renderSignupMT5 = () => (
    <motion.div
      key="signup-mt5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.60)' }}
          >
            Step 4 of 5
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          {isReturningUser ? "Verify Your MT5 ID" : "Enter Your Trading ID"}
        </h2>
        <p className="text-[15px] mb-6" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
          {isReturningUser 
            ? "Enter your MetaTrader 5 ID to verify your account." 
            : "After opening your account, you'll receive an email with your MT5 trading ID."}
        </p>
        
        {/* Returning User Info */}
        {isReturningUser && savedSession && (
          <div 
            className="p-4 rounded-xl mb-5"
            style={{ background: 'rgba(0, 0, 0, 0.03)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
              Welcome back, <span style={{ color: '#000000', fontWeight: 500 }}>{savedSession.email}</span>
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
          
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
            <Lock className="w-3 h-3" /> Used only to verify your access
          </p>
          
          {submitError && (
            <div 
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(255, 100, 100, 0.08)', color: 'rgba(255, 150, 150, 0.9)' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{submitError}</span>
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
  // RENDER SIGNUP ACCOUNT SCREEN - Apple Style
  // =========================================
  const renderSignupAccount = () => (
    <motion.div
      key="signup-account"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span 
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'rgba(0, 0, 0, 0.60)' }}
          >
            Step 5 of 5
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          Create Your Account
        </h2>
        <p className="text-[15px] mb-6" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
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
            <p className="text-xs mt-2 ml-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
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
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'rgba(0, 0, 0, 0.35)' }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <p className="text-xs mt-2 ml-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
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
              <p className="text-xs mt-2 ml-1" style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                Leave blank if you don&apos;t have one.
              </p>
            </div>
          )}
          
          {/* Terms Checkbox - Apple Toggle Style */}
          <div 
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
            style={{ 
              background: acceptedTerms ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }}
          >
            <div 
              className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-all"
              style={{ 
                background: acceptedTerms ? '#ffffff' : 'transparent',
                border: acceptedTerms ? 'none' : '1.5px solid rgba(0, 0, 0, 0.15)'
              }}
            >
              {acceptedTerms && <Check className="w-3.5 h-3.5 text-black" />}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
              I agree to the Terms of Service and understand this is educational content.
            </p>
          </div>
          
          {submitError && (
            <div 
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(255, 100, 100, 0.08)', color: 'rgba(255, 150, 150, 0.9)' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{submitError}</span>
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
  // RENDER LOADING SCREEN - Apple Style
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
        className="w-12 h-12 animate-spin mb-5" 
        style={{ color: '#000000' }} 
      />
      <h2 className="text-lg font-medium" style={{ color: '#000000' }}>
        Creating Your Account...
      </h2>
    </motion.div>
  );

  // =========================================
  // RENDER SUCCESS SCREEN - Apple Style
  // =========================================
  const renderSuccess = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <NeonCard padding="large" className="text-center">
        {/* Success Icon - Apple minimal */}
        <div 
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.05)' }}
        >
          <Check className="w-10 h-10" style={{ color: '#000000' }} />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3 tracking-tight" style={{ color: '#000000' }}>
          You&apos;re In!
        </h2>
        <p className="text-[15px] mb-8" style={{ color: 'rgba(0, 0, 0, 0.60)' }}>
          Your affiliate account is now active. Start recruiting traders and earning commissions.
        </p>
        
        <NeonButton 
          onClick={() => setStep('dashboard')} 
          variant="primary" 
          size="large" 
          className="w-full mb-4"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </NeonButton>
        
        <button 
          onClick={() => window.open(TELEGRAM_GROUP_LINK, '_blank')}
          className="flex items-center justify-center gap-2 text-sm mx-auto transition-colors"
          style={{ color: 'rgba(0, 0, 0, 0.35)' }}
        >
          <MessageCircle className="w-4 h-4" /> Join Free Telegram
        </button>
      </NeonCard>
    </motion.div>
  );

  // =========================================
  // RENDER DASHBOARD SCREEN
  // =========================================
  const renderDashboard = () => {
    // Mobile view - Keep existing compact modal layout
    if (isMobileView) {
      return (
        <div className="fixed inset-0 z-[2147483647] flex flex-col bg-white">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-white/10 bg-black backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">
                Affiliate Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NeonButton
                onClick={() => setStep('success')}
                variant="ghost"
                size="small"
                className="text-xs text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </NeonButton>
              <button 
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg cursor-pointer"
              >
                <X className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          {/* Mobile Dashboard Content */}
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
    }

    // Desktop view - Full layout from AffiliateRecruitsDashboard
    return (
      <div className="fixed inset-0 z-[2147483647] flex flex-col bg-white">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-white/10 bg-black backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">
              Affiliate Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDashboardTab('dashboard')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 transition-all",
                  dashboardTab === 'dashboard' ? "bg-white text-black" : "bg-white/10 text-white"
                )}
              >
                Dashboard
              </button>
              {isAffiliateAdmin && (
                <button
                  onClick={() => setDashboardTab('admin')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 transition-all flex items-center gap-1",
                    dashboardTab === 'admin' ? "bg-white text-black" : "bg-white/10 text-white"
                  )}
                >
                  <Shield className="w-3 h-3" /> Admin Panel
                </button>
              )}
            </div>
            {savedSession && (
              <span className="text-xs text-white/70">
                {savedSession.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NeonButton
              onClick={() => setStep('success')}
              variant="ghost"
              size="small"
              className="text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </NeonButton>
            <button 
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Desktop Dashboard Content - Full width layout */}
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
  };

  // OLD renderDashboard for reference - replaced above
  const renderDashboard_OLD = () => (
    <div className="fixed inset-0 z-[2147483647] flex flex-col bg-white">
      {/* This old implementation is kept for reference but not used */}
    </div>
  );

  // =========================================
  // MAIN RENDER
  // =========================================
  
  // Dashboard is fullscreen
  if (step === 'dashboard') {
    return renderDashboard();
  }

  // Modal wrapper for other steps - EXACT ChartNewsModal pattern
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[2147483647] bg-black/60 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Tap to close hints */}
      {!isMobile && ['top', 'bottom', 'left', 'right'].map(pos => (
        <motion.div
          key={pos}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute text-blue-300/50 text-xs pointer-events-none ${
            pos === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
            pos === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
            pos === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
            'right-2 top-1/2 -translate-y-1/2'
          }`}
        >
          {pos === 'top' || pos === 'bottom' ? (
            <span>↑ Tap anywhere to close ↑</span>
          ) : (
            <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
          )}
        </motion.div>
      ))}
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-hidden my-auto mx-auto rounded-2xl md:rounded-3xl"
      >
        {/* Inner Container */}
        <div className="relative z-10 bg-white rounded-2xl md:rounded-3xl border border-black/10 overflow-hidden h-full flex flex-col shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-black backdrop-blur-md">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Affiliate Program</h2>
                <p className="text-xs text-white/70">Earn commissions with BullMoney</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleClose}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-4 h-4 text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
          
          {/* Content */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            <AnimatePresence mode="wait">
              {step === 'intro' && renderIntro()}
              {step === 'how-it-works' && renderHowItWorks()}
              {step === 'signup-broker' && renderSignupBroker()}
              {step === 'verify-broker' && renderVerifyBroker()}
              {step === 'signup-skrill' && renderSignupSkrill()}
              {step === 'signup-mt5' && renderSignupMT5()}
              {step === 'signup-account' && renderSignupAccount()}
              {step === 'loading' && renderLoading()}
              {step === 'success' && renderSuccess()}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
