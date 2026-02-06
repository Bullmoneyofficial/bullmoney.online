"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Award, Gift, Sparkles, ArrowRight, CreditCard, Star, Zap, Crown, Check } from "lucide-react";
import LogoLoop from "./LogoLoop";
import type { LogoItem } from "./LogoLoop";

// ============================================================================
// REWARDS CARD BANNER — Premium banner with LogoLoop + Punch Card
// Shown above hero section on store page
// ============================================================================

// Partner/Feature logos for the loop
const rewardLogos: LogoItem[] = [
  { node: <Star className="w-5 h-5 text-white" />, title: "5% Cashback" },
  { node: <Gift className="w-5 h-5 text-white" />, title: "Free Rewards" },
  { node: <Zap className="w-5 h-5 text-white" />, title: "Instant Points" },
  { node: <Crown className="w-5 h-5 text-white" />, title: "VIP Perks" },
  { node: <CreditCard className="w-5 h-5 text-white" />, title: "Store Credit" },
  { node: <Award className="w-5 h-5 text-white" />, title: "Exclusive Deals" },
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
    <div className="relative w-full bg-black border-b border-white/20 overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-white blur-3xl" />
      </div>

      {/* Logo Loop Strip */}
      <div className="relative h-8 bg-white/5 border-b border-white/10">
        <LogoLoop
          logos={rewardLogos}
          speed={60}
          direction="left"
          logoHeight={20}
          gap={80}
          hoverSpeed={20}
          fadeOut
          fadeOutColor="#000000"
          scaleOnHover
          ariaLabel="Rewards benefits"
          className="h-full"
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          {/* Left: Branding + Info */}
          <div className="flex items-center gap-4">
            {/* Bullmoney Card Icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl blur-md bg-white/20 animate-pulse" />
              <div className="relative w-14 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-md bg-linear-to-br from-white/90 to-white/70" />
                <span className="relative text-black font-black text-[10px] tracking-tighter">BULL</span>
                <div className="absolute bottom-1 right-1">
                  <Award className="w-2.5 h-2.5 text-black/80" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="shimmer-text">Bullmoney Rewards</span>
              </h3>
              <p className="text-white/60 text-[11px] sm:text-xs">
                Earn <span className="font-semibold text-white">1 punch</span> per $25 spent
                <span className="hidden sm:inline"> · 20 punches = FREE reward</span>
              </p>
            </div>
          </div>

          {/* Center: Mini Punch Progress (if logged in) */}
          {rewards && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/20">
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all"
                    style={i < Math.min(rewards.punches, 10) 
                      ? { background: "white", boxShadow: "0 1px 2px rgba(255, 255, 255, 0.3)" }
                      : { background: "rgba(255, 255, 255, 0.2)" }
                    }
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/50">
                {rewards.punches}/20
              </span>
              {rewards.punches >= 10 && (
                <span className="text-[9px] font-medium text-white shimmer-text">Halfway!</span>
              )}
            </div>
          )}

          {/* Right: CTA */}
          <button
            onClick={onOpenRewardsCard}
            className="group flex items-center gap-2 px-4 py-2 bg-black text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap border-2 border-white hover:bg-white hover:text-black"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="shimmer-text">{userEmail ? "View Card" : "Get Rewards"}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
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
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 255, 255, 0.8) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        
        .group:hover .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 1) 50%,
            rgba(0, 0, 0, 0.8) 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
