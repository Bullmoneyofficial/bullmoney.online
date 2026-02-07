"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X, Award, Gift, Star, Crown, Zap, Check, RefreshCw, TrendingUp,
  CreditCard, Sparkles, ShoppingBag, DollarSign, Trophy
} from "lucide-react";
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';

// ============================================================================
// REWARDS CARD — Real Credit Card Style with Bullmoney Branding
// 20 punches = 1 free reward, $25 = 1 punch (auto-synced from store orders)
// ============================================================================

interface RewardsData {
  email: string;
  punches: number;
  max_punches: number;
  total_spent: number;
  cards_completed: number;
  tier: string;
  lifetime_points: number;
  available_points: number;
  last_punch_at?: string;
  free_item_claimed?: boolean;
  exists: boolean;
}

interface RewardsCardProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
}

const TIER_CONFIG: Record<string, { color: string; cardBg: string; icon: React.ReactNode; label: string }> = {
  bronze: {
    color: "text-white",
    cardBg: "linear-gradient(135deg, rgb(30, 64, 175) 0%, rgb(29, 78, 216) 50%, rgb(15, 23, 42) 100%)",
    icon: <Star className="w-3.5 h-3.5" />,
    label: "Bronze",
  },
  silver: {
    color: "text-white",
    cardBg: "linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(29, 78, 216) 50%, rgb(30, 64, 175) 100%)",
    icon: <Award className="w-3.5 h-3.5" />,
    label: "Silver",
  },
  gold: {
    color: "text-white",
    cardBg: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 50%, rgb(29, 78, 216) 100%)",
    icon: <Crown className="w-3.5 h-3.5" />,
    label: "Gold",
  },
  platinum: {
    color: "text-white",
    cardBg: "linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(59, 130, 246) 50%, rgb(37, 99, 235) 100%)",
    icon: <Trophy className="w-3.5 h-3.5" />,
    label: "Platinum",
  },
};

export default function RewardsCard({ isOpen, onClose, userEmail }: RewardsCardProps) {
  const { formatPrice } = useCurrencyLocaleStore();
  const { isMobile, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [animatedPunches, setAnimatedPunches] = useState(0);

  const fetchRewards = useCallback(async (sync = false) => {
    if (!userEmail) return;
    
    if (sync) setSyncing(true);
    else setLoading(true);
    
    try {
      const res = await fetch(`/api/rewards?email=${encodeURIComponent(userEmail)}&sync=${sync}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
        setAnimatedPunches(0);
        setTimeout(() => {
          setAnimatedPunches(data.punches || 0);
        }, 200);
      }
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [userEmail]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchRewards(true);
    }
  }, [isOpen, userEmail, fetchRewards]);

  if (!isOpen) return null;

  const tier = TIER_CONFIG[rewards?.tier || "bronze"];
  const progressPct = rewards ? (rewards.punches / rewards.max_punches) * 100 : 0;
  const punchesNeeded = rewards ? rewards.max_punches - rewards.punches : 20;
  const amountToNextPunch = rewards ? 25 - (rewards.total_spent % 25) : 25;

  return (
    <div className="fixed inset-0 z-9999999 flex items-center justify-center pointer-events-none p-2 pt-20 md:p-4">
      {/* Detached Close Button - Fixed Position */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10000000 p-3 rounded-full bg-black/90 hover:bg-black border border-white/20 hover:border-white/40 text-white/80 hover:text-white transition-all shadow-2xl pointer-events-auto"
        aria-label="Close rewards card (ESC)"
        title="Press ESC to close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Container - Card first on mobile, stats first on desktop */}
      <div className="relative flex flex-col md:flex-col-reverse items-center gap-4 pointer-events-auto max-h-[85vh] overflow-y-auto p-2">
        {/* Card Wrapper */}
        <div className="w-full max-w-90 md:max-w-130 shrink-0">
          {/* The Physical Card */}
          <div 
            className="relative overflow-hidden rounded-2xl transition-all duration-300 ease-out"
            style={{ 
              aspectRatio: "1.586/1",
              background: tier.cardBg,
              boxShadow: shouldSkipHeavyEffects
                ? '0 25px 50px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
                : `
                0 50px 100px -20px rgba(0,0,0,0.6),
                0 30px 60px -30px rgba(0,0,0,0.5),
                0 0 0 1px rgba(255,255,255,0.1),
                inset 0 1px 0 rgba(255,255,255,0.2),
                inset 0 -1px 0 rgba(0,0,0,0.3)
              `
            }}
          >
          {/* Holographic/Metallic shimmer overlay — skip on mobile */}
          {!shouldSkipHeavyEffects && (
            <>
              <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: "linear-gradient(to top right, rgba(59, 130, 246, 0.2), transparent, transparent)" }} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(0,0,0,0.2),transparent_50%)] pointer-events-none" />
            </>
          )}
          
          {/* Card Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Top Row - Logo & Tier */}
            <div className="flex items-start justify-between">
              {/* Bullmoney Logo */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg blur-md opacity-50" style={{ backgroundColor: "rgb(59, 130, 246)" }} />
                  <div className="relative w-11 h-11 rounded-lg flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(59, 130, 246) 50%, rgb(37, 99, 235) 100%)", border: "1px solid rgba(147, 197, 253, 0.2)" }}>
                    <span className="text-white font-black text-xs tracking-tight">BM</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-base tracking-wide drop-shadow-sm">BULLMONEY</h2>
                  <p className="text-white/50 text-[9px] tracking-[0.2em] font-medium">REWARDS CARD</p>
                </div>
              </div>
              
              {/* Tier Badge */}
              {rewards && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 ${tier.color} text-[9px] font-bold uppercase tracking-wider`}>
                  {tier.icon}
                  <span>{tier.label}</span>
                </div>
              )}
            </div>

            {/* Middle Row - Chip & Contactless */}
            <div className="flex items-center gap-4">
              {/* EMV Chip - Realistic */}
              <div className="w-12 h-9 rounded-md shadow-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgb(147, 197, 253) 0%, rgb(96, 165, 250) 50%, rgb(59, 130, 246) 100%)", border: "1px solid rgba(37, 99, 235, 0.3)" }}>
                <div className="absolute inset-1 grid grid-cols-3 grid-rows-2 gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ backgroundColor: "rgba(37, 99, 235, 0.3)" }} className="rounded-[1px]" />
                  ))}
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent, transparent)" }} />
              </div>
              
              {/* Contactless Symbol */}
              <svg className="w-7 h-7 text-white/40" viewBox="0 0 24 24" fill="none">
                <path d="M12.5 8.5a3.5 3.5 0 00-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 5.5a6.5 6.5 0 00-6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 2.5a9.5 9.5 0 00-9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Bottom Row - Progress & Member Info */}
            <div className="space-y-2.5">
              {/* Punch Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, rgb(96, 165, 250) 0%, rgb(59, 130, 246) 50%, rgb(96, 165, 250) 100%)" }}
                  />
                </div>
                <span className="text-white font-mono font-bold text-sm tabular-nums">{rewards?.punches || 0}<span className="text-white/40">/20</span></span>
              </div>
              
              {/* Member Details Row */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/30 text-[8px] uppercase tracking-[0.15em] mb-0.5 font-medium">MEMBER SINCE 2024</p>
                  <p className="text-white font-semibold text-sm tracking-wider truncate max-w-40">
                    {userEmail?.split("@")[0]?.toUpperCase() || "GUEST"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[8px] uppercase tracking-[0.15em] mb-0.5 font-medium">POINTS</p>
                  <p className="text-white font-bold text-lg tabular-nums">{rewards?.available_points || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card number emboss effect line */}
          <div className="absolute bottom-18 left-5 right-5 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>
        </div>

        {/* Stats Panel - Below card */}
        <div 
          className="w-full max-w-90 md:max-w-130 rounded-2xl bg-black/95 border border-white/10 shadow-2xl overflow-hidden"
          style={{ backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(12px)' }}
        >
          <div className="overflow-y-auto p-4 max-h-62.5 md:max-h-75">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mb-2" style={{ color: "rgb(96, 165, 250)" }} />
                <p className="text-white/60 text-sm">Loading rewards...</p>
              </div>
            ) : !userEmail ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard className="w-8 h-8 text-white/20 mb-3" />
                <h3 className="text-white font-semibold text-sm mb-1">Sign In Required</h3>
                <p className="text-white/50 text-xs">Log in to view your rewards card</p>
              </div>
            ) : (
              <>
                {/* Compact Punch Grid - 10 columns */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Punch Card</p>
                    {(rewards?.punches || 0) >= 20 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${shouldSkipHeavyEffects ? '' : 'animate-pulse'}`} style={{ backgroundColor: "rgba(59, 130, 246, 0.2)", color: "rgb(96, 165, 250)" }}>
                        FREE REWARD!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-10 gap-1.5">
                    {[...Array(20)].map((_, i) => {
                      const isFilled = i < animatedPunches;
                      const isReward = i === 19;
                      
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                            isFilled 
                              ? "text-white shadow-md scale-100" 
                              : isReward
                                ? "border border-dashed scale-100"
                                : "bg-white/5 border border-white/10 text-white/20 scale-95"
                          }`}
                          style={{ 
                            transitionDelay: isFilled ? `${i * (shouldSkipHeavyEffects ? 10 : 30)}ms` : "0ms",
                            ...(isFilled ? { background: "linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(37, 99, 235) 100%)", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)" } : {}),
                            ...(isReward && !isFilled ? { backgroundColor: "rgba(59, 130, 246, 0.2)", borderColor: "rgba(96, 165, 250, 0.5)", color: "rgb(96, 165, 250)" } : {})
                          }}
                        >
                          {isFilled ? <Check className="w-3 h-3" /> : isReward ? <Gift className="w-3 h-3" /> : i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats Grid - Compact */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <ShoppingBag className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(96, 165, 250, 0.7)" }} />
                    <p className="text-white font-bold text-sm">{formatPrice(rewards?.total_spent || 0)}</p>
                    <p className="text-white/40 text-[8px] uppercase">Spent</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <Trophy className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(96, 165, 250, 0.7)" }} />
                    <p className="text-white font-bold text-sm">{rewards?.cards_completed || 0}</p>
                    <p className="text-white/40 text-[8px] uppercase">Cards</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <Star className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(96, 165, 250, 0.7)" }} />
                    <p className="text-white font-bold text-sm">{rewards?.lifetime_points || 0}</p>
                    <p className="text-white/40 text-[8px] uppercase">Lifetime</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <Zap className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(96, 165, 250, 0.7)" }} />
                    <p className="font-bold text-sm" style={{ color: "rgb(96, 165, 250)" }}>{rewards?.available_points || 0}</p>
                    <p className="text-white/40 text-[8px] uppercase">Points</p>
                  </div>
                </div>

                {/* Next Punch Progress */}
                <div className="rounded-xl p-3 border mb-4" style={{ background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" style={{ color: "rgb(96, 165, 250)" }} />
                      <div>
                        <p className="text-white text-xs font-medium">Next Punch</p>
                        <p className="text-white/50 text-[10px]">
                          Spend <span className="font-bold" style={{ color: "rgb(96, 165, 250)" }}>{formatPrice(amountToNextPunch)}</span> more
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{punchesNeeded}</p>
                      <p className="text-white/40 text-[8px] uppercase">to reward</p>
                    </div>
                  </div>
                </div>

                {/* How It Works - Compact */}
                <div className="mb-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-medium">How It Works</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { icon: <ShoppingBag className="w-3 h-3" />, text: `${formatPrice(25)} = 1 punch` },
                      { icon: <Check className="w-3 h-3" />, text: "20 punches = reward" },
                      { icon: <Gift className="w-3 h-3" />, text: "Free item at checkout" },
                      { icon: <TrendingUp className="w-3 h-3" />, text: "Tier up for perks" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/60">
                        <span style={{ color: "rgba(96, 165, 250, 0.8)" }}>{item.icon}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sync Button */}
                <button
                  onClick={() => fetchRewards(true)}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Orders"}
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] text-white/25">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Bullmoney Trading Rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
