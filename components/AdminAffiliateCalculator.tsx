"use client";

import React, { useState, useMemo } from "react";
import { 
  DollarSign, Users, TrendingUp, Award, Target, 
  Star, Trophy, Sparkles, Calculator, Info,
  BarChart3, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- AFFILIATE TIER SYSTEM (Same as AffiliateModal) ---
const AFFILIATE_TIERS = [
  { 
    name: 'Starter', 
    minTraders: 1, 
    maxTraders: 4, 
    commissionPercent: 5, 
    xmRate: 11, 
    vantageRate: 5.50,
    color: '#ffffff',
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
    color: '#ffffff',
    icon: Sparkles 
  },
];

// --- EARNINGS CALCULATOR (Same as AffiliateModal) ---
const calculateEarnings = (
  traders: number, 
  avgLotsPerTrader: number, 
  broker: 'XM' | 'Vantage',
  socialPosts: number
): { 
  commission: number; 
  bonus: number; 
  total: number; 
  tier: typeof AFFILIATE_TIERS[0];
  breakdown: {
    baseRate: number;
    commissionPerLot: number;
    totalLots: number;
    monthlyPosts: number;
    socialMultiplier: number;
  }
} => {
  const tier = AFFILIATE_TIERS.find(t => traders >= t.minTraders && traders <= t.maxTraders) || AFFILIATE_TIERS[0];
  const baseRate = broker === 'XM' ? tier.xmRate : tier.vantageRate;
  const commissionPerLot = baseRate * (tier.commissionPercent / 100);
  const totalLots = traders * avgLotsPerTrader;
  const commission = totalLots * commissionPerLot;
  
  let bonus = 0;
  const monthlyPosts = socialPosts * 4;
  const socialMultiplier = monthlyPosts >= 8 ? 2 : monthlyPosts >= 6 ? 1.5 : 1;
  
  if (totalLots >= 20) {
    bonus = commissionPerLot * traders * socialMultiplier;
  }
  
  return {
    commission: Math.round(commission * 100) / 100,
    bonus: Math.round(bonus * 100) / 100,
    total: Math.round((commission + bonus) * 100) / 100,
    tier,
    breakdown: {
      baseRate,
      commissionPerLot,
      totalLots,
      monthlyPosts,
      socialMultiplier
    }
  };
};

export function AdminAffiliateCalculator() {
  const [traders, setTraders] = useState(10);
  const [avgLotsPerTrader, setAvgLotsPerTrader] = useState(5);
  const [broker, setBroker] = useState<'XM' | 'Vantage'>('XM');
  const [socialPosts, setSocialPosts] = useState(2);

  const earnings = useMemo(() => {
    return calculateEarnings(traders, avgLotsPerTrader, broker, socialPosts);
  }, [traders, avgLotsPerTrader, broker, socialPosts]);

  const TierIcon = earnings.tier.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-white/10 border border-white/30">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Affiliate Earnings Calculator</h2>
          <p className="text-sm text-slate-400">Calculate commission based on tier, lots, and social activity</p>
        </div>
      </div>

      {/* Calculator Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Number of Traders */}
        <div className="bg-slate-900/70 rounded-lg border border-slate-800 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Users className="w-4 h-4 text-white" />
            Number of Referred Traders
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={traders}
            onChange={(e) => setTraders(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-white focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="100"
              value={traders}
              onChange={(e) => setTraders(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-slate-500">{traders}</span>
          </div>
        </div>

        {/* Avg Lots Per Trader */}
        <div className="bg-slate-900/70 rounded-lg border border-slate-800 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <BarChart3 className="w-4 h-4 text-white" />
            Avg Lots Per Trader (Monthly)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={avgLotsPerTrader}
            onChange={(e) => setAvgLotsPerTrader(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-white focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="50"
              value={avgLotsPerTrader}
              onChange={(e) => setAvgLotsPerTrader(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-slate-500">{avgLotsPerTrader}</span>
          </div>
        </div>

        {/* Broker Selection */}
        <div className="bg-slate-900/70 rounded-lg border border-slate-800 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <TrendingUp className="w-4 h-4 text-white" />
            Broker
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setBroker('XM')}
              className={cn(
                "flex-1 py-3 rounded-lg font-medium transition-all",
                broker === 'XM'
                  ? "bg-white text-black border-2 border-white"
                  : "bg-black/50 text-slate-400 border border-slate-700 hover:border-slate-600"
              )}
            >
              XM
            </button>
            <button
              onClick={() => setBroker('Vantage')}
              className={cn(
                "flex-1 py-3 rounded-lg font-medium transition-all",
                broker === 'Vantage'
                  ? "bg-white text-black border-2 border-white"
                  : "bg-black/50 text-slate-400 border border-slate-700 hover:border-slate-600"
              )}
            >
              Vantage
            </button>
          </div>
        </div>

        {/* Social Posts Per Week */}
        <div className="bg-slate-900/70 rounded-lg border border-slate-800 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <Award className="w-4 h-4 text-white" />
            Social Posts Per Week
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={socialPosts}
            onChange={(e) => setSocialPosts(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:border-white focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="10"
              value={socialPosts}
              onChange={(e) => setSocialPosts(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-slate-500">{socialPosts}/week</span>
          </div>
        </div>
      </div>

      {/* Current Tier Display */}
      <div 
        className="bg-linear-to-br from-slate-900 to-black rounded-xl border-2 p-6"
        style={{ borderColor: earnings.tier.color }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${earnings.tier.color}20` }}
            >
              <TierIcon className="w-6 h-6" style={{ color: earnings.tier.color }} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Current Tier</p>
              <h3 className="text-2xl font-bold" style={{ color: earnings.tier.color }}>
                {earnings.tier.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Commission Rate</p>
            <p className="text-2xl font-bold text-white">{earnings.tier.commissionPercent}%</p>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <p>Range: {earnings.tier.minTraders} - {earnings.tier.maxTraders === Infinity ? '∞' : earnings.tier.maxTraders} traders</p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-slate-900/70 rounded-lg border border-slate-800 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-white" />
            <p className="text-sm font-medium text-slate-300">Base Commission</p>
          </div>
          <p className="text-3xl font-bold text-white">${earnings.commission.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {earnings.breakdown.totalLots} lots × ${earnings.breakdown.commissionPerLot.toFixed(2)}/lot
          </p>
        </div>

        <div 
          className="bg-slate-900/70 rounded-lg border border-slate-800 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <p className="text-sm font-medium text-slate-300">Social Bonus</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400">${earnings.bonus.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {earnings.breakdown.socialMultiplier}x multiplier ({earnings.breakdown.monthlyPosts} posts/month)
          </p>
        </div>

        <div 
          className="bg-linear-to-br from-white/20 to-white/20 rounded-lg border-2 border-white/50 p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-white" />
            <p className="text-sm font-medium text-white">Total Earnings</p>
          </div>
          <p className="text-3xl font-bold text-white">${earnings.total.toFixed(2)}</p>
          <p className="text-xs text-white mt-1">Monthly Potential</p>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div className="bg-white/10 border border-white/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 space-y-2 w-full">
            <p className="font-semibold text-white">Step-by-Step Calculation:</p>
            
            <div className="space-y-3 mt-3">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 1: Base Rate</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-300">Broker: <strong className="text-white">{broker}</strong></span>
                  <span className="text-slate-500">→</span>
                  <span className="text-white font-mono text-lg">${earnings.breakdown.baseRate.toFixed(2)}/lot</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 2: Commission %</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-300">Tier: <strong className="text-white">{earnings.tier.name}</strong></span>
                  <span className="text-slate-500">→</span>
                  <span className="text-white font-mono text-lg">{earnings.tier.commissionPercent}%</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 3: Commission Per Lot</div>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-slate-300">${earnings.breakdown.baseRate.toFixed(2)}</span>
                  <span className="text-slate-500">×</span>
                  <span className="text-slate-300">{earnings.tier.commissionPercent}%</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-white font-mono text-lg">${earnings.breakdown.commissionPerLot.toFixed(2)}/lot</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 4: Total Lots</div>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-slate-300">{traders} traders</span>
                  <span className="text-slate-500">×</span>
                  <span className="text-slate-300">{avgLotsPerTrader} lots</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-white font-mono text-lg">{earnings.breakdown.totalLots} lots</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 5: Base Commission</div>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-slate-300">{earnings.breakdown.totalLots} lots</span>
                  <span className="text-slate-500">×</span>
                  <span className="text-slate-300">${earnings.breakdown.commissionPerLot.toFixed(2)}</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-white font-mono text-lg font-bold">${earnings.commission.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">STEP 6: Social Bonus</div>
                {earnings.breakdown.totalLots >= 20 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-slate-300">{socialPosts} posts/week</span>
                      <span className="text-slate-500">×</span>
                      <span className="text-slate-300">4 weeks</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-white">{earnings.breakdown.monthlyPosts} posts/mo</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-yellow-300 font-mono">{earnings.breakdown.socialMultiplier}x</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-slate-300">{traders} traders</span>
                      <span className="text-slate-500">×</span>
                      <span className="text-slate-300">${earnings.breakdown.commissionPerLot.toFixed(2)}</span>
                      <span className="text-slate-500">×</span>
                      <span className="text-slate-300">{earnings.breakdown.socialMultiplier}x</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-yellow-400 font-mono text-lg font-bold">${earnings.bonus.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-white">
                      ✓ {earnings.breakdown.monthlyPosts >= 8 ? '2x bonus! (8+ posts)' : earnings.breakdown.monthlyPosts >= 6 ? '1.5x bonus! (6+ posts)' : 'Post more!'}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-orange-400">
                    ⚠ Need {20 - earnings.breakdown.totalLots} more lots (20 min)
                  </div>
                )}
              </div>

              <div className="bg-linear-to-r from-white/20 to-white/20 rounded-lg p-4 border-2 border-white/50">
                <div className="text-xs text-white mb-2 font-semibold">TOTAL EARNINGS</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white">${earnings.commission.toFixed(2)}</span>
                  <span className="text-slate-400">+</span>
                  <span className="text-white">${earnings.bonus.toFixed(2)}</span>
                  <span className="text-slate-400">=</span>
                  <span className="text-white font-mono text-2xl font-bold">${earnings.total.toFixed(2)}</span>
                  <span className="text-xs text-white">/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Structure */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Tier Structure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AFFILIATE_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isActive = tier.name === earnings.tier.name;
            return (
              <div
                key={tier.name}
                className={cn(
                  "rounded-lg p-4 border-2 transition-all",
                  isActive ? "bg-slate-900" : "bg-slate-950/50 opacity-60"
                )}
                style={{ borderColor: isActive ? tier.color : 'rgba(100, 116, 139, 0.3)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" style={{ color: tier.color }} />
                  <h4 className="font-bold text-white text-sm">{tier.name}</h4>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  {tier.minTraders} - {tier.maxTraders === Infinity ? '∞' : tier.maxTraders} traders
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Commission:</span>
                    <span className="font-semibold" style={{ color: tier.color }}>
                      {tier.commissionPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">XM:</span>
                    <span className="text-slate-300">${tier.xmRate}/lot</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Vantage:</span>
                    <span className="text-slate-300">${tier.vantageRate}/lot</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminAffiliateCalculator;
