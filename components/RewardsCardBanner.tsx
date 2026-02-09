"use client";

import React, { useState, useEffect, useCallback } from "react";
import Award from 'lucide-react/dist/esm/icons/award';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';

// ============================================================================
// REWARDS CARD BANNER — Premium banner with LogoLoop + Punch Card
// Shown above hero section on store page
// ============================================================================


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
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Branding + Info */}
          <div className="flex items-center gap-2.5">
            {/* Bullmoney Card Icon */}
            <div className="relative shrink-0">
              <div className="relative w-10 h-7 rounded-md bg-white shadow-sm flex items-center justify-center border border-black/10">
                <div className="absolute inset-0.5 rounded-md bg-linear-to-br from-white to-zinc-100" />
                <span className="relative text-black font-black text-[8px] tracking-tight">BULL</span>
                <div className="absolute bottom-1 right-1">
                  <Award className="w-2 h-2 text-black/60" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-black font-semibold text-[11px] sm:text-[12px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-black" />
                <span className="shimmer-text">Bullmoney Rewards</span>
              </h3>
              <p className="text-black/55 text-[9.5px] sm:text-[10px]">
                Earn <span className="font-semibold text-black">1 punch</span> per {formatPrice(25)} spent
                <span className="hidden sm:inline"> · 20 punches = FREE reward</span>
              </p>
            </div>
          </div>

          {/* Center: Mini Punch Progress (if logged in) */}
          {rewards && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10">
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={i < Math.min(rewards.punches, 10) 
                      ? { background: "rgb(0,0,0)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" }
                      : { background: "rgba(0, 0, 0, 0.15)" }
                    }
                  />
                ))}
              </div>
              <span className="text-[9px] text-black/50">
                {rewards.punches}/20
              </span>
              {rewards.punches >= 10 && (
                <span className="text-[8px] font-medium text-black shimmer-text">Halfway!</span>
              )}
            </div>
          )}

          {/* Right: CTA */}
          <button
            onClick={onOpenRewardsCard}
            className="group flex items-center gap-2 px-3 py-1.5 bg-white text-black font-semibold text-[11px] rounded-full shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap border border-black/15"
          >
            <CreditCard className="w-3 h-3" />
            <span className="shimmer-text">{userEmail ? "View Card" : "Get Rewards"}</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
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
