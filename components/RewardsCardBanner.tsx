"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Award, Gift, Sparkles, ArrowRight, CreditCard, Star, Zap, Crown, Check } from "lucide-react";
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';
import LogoLoop from "./LogoLoop";
import type { LogoItem } from "./LogoLoop";

// ============================================================================
// REWARDS CARD BANNER — Premium banner with LogoLoop + Punch Card
// Shown above hero section on store page
// ============================================================================

// Partner/Feature logos for the loop
const rewardLogos: LogoItem[] = [
  { node: <Star className="w-4 h-4 text-black/80" />, title: "5% Cashback" },
  { node: <Gift className="w-4 h-4 text-black/80" />, title: "Free Rewards" },
  { node: <Zap className="w-4 h-4 text-black/80" />, title: "Instant Points" },
  { node: <Crown className="w-4 h-4 text-black/80" />, title: "VIP Perks" },
  { node: <CreditCard className="w-4 h-4 text-black/80" />, title: "Store Credit" },
  { node: <Award className="w-4 h-4 text-black/80" />, title: "Exclusive Deals" },
];

interface RewardsData {
  punches: number;
  max_punches: number;
  cards_completed: number;
  tier: string;
  total_spent: number;
  available_points: number;
}

interface RewardsCardBannerProps {
  userEmail?: string | null;
  onOpenRewardsCard?: () => void;
}

export default function RewardsCardBanner({ userEmail, onOpenRewardsCard }: RewardsCardBannerProps) {
  const { formatPrice } = useCurrencyLocaleStore();
  const { isMobile, shouldSkipHeavyEffects } = useUnifiedPerformance();
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRewards = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rewards?email=${encodeURIComponent(userEmail)}&sync=true`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return (
    <div className="relative w-full bg-white overflow-hidden">

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5">
          {/* Left: Branding + Info */}
          <div className="flex items-center gap-3">
            {/* Bullmoney Card Icon */}
            <div className="relative shrink-0">
              <div className="relative w-12 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center border border-black/10">
                <div className="absolute inset-0.5 rounded-md bg-linear-to-br from-white to-zinc-100" />
                <span className="relative text-black font-black text-[9px] tracking-tighter">BULL</span>
                <div className="absolute bottom-1 right-1">
                  <Award className="w-2.5 h-2.5 text-black/70" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-black font-bold text-[12px] sm:text-[13px] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span className="shimmer-text">Bullmoney Rewards</span>
              </h3>
              <p className="text-black/60 text-[10px] sm:text-[11px]">
                Earn <span className="font-semibold text-black">1 punch</span> per {formatPrice(25)} spent
                <span className="hidden sm:inline"> · 20 punches = FREE reward</span>
              </p>
            </div>
          </div>

          {/* Center: Mini Punch Progress (if logged in) */}
          {rewards && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/10">
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all"
                    style={i < Math.min(rewards.punches, 10) 
                      ? { background: "rgb(0,0,0)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" }
                      : { background: "rgba(0, 0, 0, 0.15)" }
                    }
                  />
                ))}
              </div>
              <span className="text-[10px] text-black/50">
                {rewards.punches}/20
              </span>
              {rewards.punches >= 10 && (
                <span className="text-[9px] font-medium text-black shimmer-text">Halfway!</span>
              )}
            </div>
          )}

          {/* Right: CTA */}
          <button
            onClick={onOpenRewardsCard}
            className="group flex items-center gap-2 px-4 py-2 bg-white text-black font-bold text-xs rounded-full shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap border border-black/15"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="shimmer-text">{userEmail ? "View Card" : "Get Rewards"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Logo Loop Strip */}
      <div className="relative h-7 bg-white">
        <LogoLoop
          logos={rewardLogos}
          speed={isMobile ? 40 : 60}
          direction="right"
          logoHeight={16}
          gap={isMobile ? 50 : 70}
          hoverSpeed={20}
          fadeOut
          fadeOutColor="#ffffff"
          scaleOnHover={!isMobile}
          ariaLabel="Rewards benefits"
          className="h-full logoloop--force-motion"
        />
      </div>

      {/* Shimmer CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 1) 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: ${shouldSkipHeavyEffects ? 'none' : 'shimmer 3s linear infinite'};
        }
      `}</style>
    </div>
  );
}
