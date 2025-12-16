"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  TrendingUp, DollarSign, Shield, Zap, Lock, Activity, 
  Menu, X, Volume2, VolumeX, Settings, Monitor, RefreshCw, Wifi, WifiOff, Layers, Hash, Command, MessageCircle, ArrowRight, SkipForward, Check, LucideProps
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// 1. TYPES & THEMES
// ============================================================================

export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT'; 
export type ThemeCategory = 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC';

export type Theme = { 
  id: string; name: string; description: string; 
  filter: string; mobileFilter: string; category: ThemeCategory; 
  isLight?: boolean; illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE'; 
  accentColor?: string; status: 'AVAILABLE' | 'UNAVAILABLE';
};

export type TickerData = { symbol: string; price: string; percentChange: string; prevPrice: string; };

export const THEMES: Theme[] = [
  // --- SPECIAL ---
  { id: 'bull-money-special', name: 'Bull Money Chrome', description: 'REFRESH TO REVEAL', category: 'SPECIAL', filter: 'url(#chrome-liquid) sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', illusion: 'SCANLINES', accentColor: '#00FFFF', status: 'AVAILABLE' },

  // --- CRYPTO ---
  { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE' },
  { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
  { id: 'c03', name: 'Solana Speed', description: 'SOL Summer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(220deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#14F195', status: 'UNAVAILABLE' },
  { id: 'c04', name: 'Doge Meme', description: 'To The Moon', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2)', mobileFilter: 'sepia(0.8) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#CBA6F7', status: 'UNAVAILABLE' },
  { id: 'c05', name: 'Monero Dark', description: 'Privacy', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.4)', mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#FF6600', status: 'UNAVAILABLE' },

  // --- SENTIMENT ---
  { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
  { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE' },
  { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 't04', name: 'Moon Mission', description: 'ATH Break', category: 'SENTIMENT', filter: 'brightness(1.2) contrast(1.1) saturate(0) sepia(0.2) drop-shadow(0 0 5px white)', mobileFilter: 'brightness(1.2) grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 't05', name: 'Whale Watch', description: 'Ocean', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(170deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(170deg)', illusion: 'SCANLINES', accentColor: '#1E3A8A', status: 'AVAILABLE' },
  { id: 't06', name: 'FUD Storm', description: 'Panic', category: 'SENTIMENT', filter: 'grayscale(1) contrast(2) brightness(0.6)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#525252', status: 'UNAVAILABLE' },

  // --- ASSETS ---
  { id: 'a01', name: 'Gold Bullion', description: 'XAU/USD', category: 'ASSETS', filter: 'url(#gold-shine) sepia(1) hue-rotate(10deg) saturate(3) brightness(0.9)', mobileFilter: 'sepia(1) hue-rotate(10deg) saturate(2)', illusion: 'NONE', accentColor: '#FBBF24', status: 'AVAILABLE' },
  { id: 'a02', name: 'Silver Spot', description: 'XAG/USD', category: 'ASSETS', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.5))', mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
  { id: 'a03', name: 'Crude Oil', description: 'WTI Barrel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) brightness(0.4) contrast(1.5)', mobileFilter: 'sepia(1) brightness(0.5)', illusion: 'NOISE', accentColor: '#1C1917', status: 'UNAVAILABLE' },
  { id: 'a04', name: 'US Dollar', description: 'Fiat', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) contrast(0.9)', mobileFilter: 'sepia(1) hue-rotate(70deg)', illusion: 'VIGNETTE', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'a05', name: 'Lithium', description: 'Battery', category: 'ASSETS', filter: 'sepia(1) hue-rotate(290deg) saturate(0.5) contrast(2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#A855F7', status: 'UNAVAILABLE' },

  // --- HISTORICAL ---
  { id: 'h01', name: 'Dot Com Bubble', description: '2000 Peak', category: 'HISTORICAL', filter: 'sepia(0.5) contrast(1.5) hue-rotate(290deg)', mobileFilter: 'sepia(0.5) contrast(1.2)', illusion: 'NOISE', accentColor: '#5B21B6', status: 'UNAVAILABLE' },
  { id: 'h02', name: '80s Oil Shock', description: 'WTI High', category: 'HISTORICAL', filter: 'grayscale(0.5) sepia(0.8) contrast(1.2)', mobileFilter: 'grayscale(0.5) sepia(0.8)', illusion: 'VIGNETTE', accentColor: '#9A3412', status: 'UNAVAILABLE' },

  // --- OPTICS ---
  { id: 'o01', name: 'Night Vis', description: 'NVG-11', category: 'OPTICS', filter: 'grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1) sepia(1) hue-rotate(70deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'o02', name: 'Thermal', description: 'Predator', category: 'OPTICS', filter: 'invert(1) hue-rotate(180deg) saturate(2) contrast(1.5)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F43F5E', status: 'UNAVAILABLE' },
  { id: 'o03', name: 'CRT 1999', description: 'Legacy', category: 'OPTICS', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) grayscale(0.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#A3A3A3', status: 'UNAVAILABLE' },
  { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE' },

  // --- EXOTIC ---
  { id: 'e01', name: 'Miami Vice', description: 'OTC Desk', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(300deg) saturate(2) contrast(1.1)', mobileFilter: 'sepia(0.5) hue-rotate(300deg)', illusion: 'NONE', accentColor: '#EC4899', status: 'AVAILABLE' },
  { id: 'e02', name: 'Vaporwave', description: 'Aesthetic', category: 'EXOTIC', filter: 'sepia(0.4) hue-rotate(290deg) saturate(1.5) contrast(1.1)', mobileFilter: 'sepia(0.4) hue-rotate(290deg)', illusion: 'SCANLINES', accentColor: '#D946EF', status: 'UNAVAILABLE' },
  { id: 'e03', name: 'Bank Note', description: 'Cash', category: 'EXOTIC', filter: 'url(#banknote) contrast(0.8)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#84CC16', status: 'UNAVAILABLE' },
  { id: 'e04', name: 'Blueprint', description: 'Architect', category: 'EXOTIC', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1) sepia(1) hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
  { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
];


// ============================================================================
// 2. CORE PRIMITIVES
// ============================================================================

const SHIMMER_GRADIENT_BLUE = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #2563eb 50%, #00000000 100%)";
const GLOBAL_STYLES = `
  .mac-gpu-accelerate { transform: translateZ(0); will-change: transform, opacity; backface-visibility: hidden; }
  @keyframes textShine { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
  .text-shimmer-effect {
    background: linear-gradient(to right, #3b82f6 20%, #ffffff 50%, #3b82f6 80%);
    background-size: 200% auto;
    color: #3b82f6;
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: textShine 3s linear infinite;
  }
  .text-glow { text-shadow: 0 0 10px rgba(37, 99, 235, 0.5), 0 0 20px rgba(37, 99, 235, 0.3); }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(59, 130, 246, 0.5); border-radius: 2px; }
  .custom-scrollbar::-webkit-scrollbar-track { background-color: rgba(0, 0, 0, 0.1); }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Snap utilities for smooth mobile scrolling */
  .snap-x-mandatory { scroll-snap-type: x mandatory; }
  .snap-center { scroll-snap-align: center; }
`;

export const ShimmerBorder = ({ active = true }: { active?: boolean }) => (
    <motion.div
        className="absolute inset-[-100%] pointer-events-none"
        animate={{ opacity: active ? 1 : 0, rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ background: SHIMMER_GRADIENT_BLUE }}
    />
);

export const ShimmerCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`relative group w-full rounded-2xl p-[1px] shadow-[0_0_30px_-10px_rgba(37,99,235,0.2)] overflow-hidden ${className}`}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden"><ShimmerBorder active={true} /></div>
        <div className="relative bg-[#050505] rounded-[15px] h-full z-10 overflow-hidden backdrop-blur-xl">{children}</div>
    </div>
);

export const ShimmerButton = ({ onClick, children, className = "", icon: Icon, disabled = false }: { onClick?: () => void, children: React.ReactNode, className?: string, icon?: any, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`group/btn relative w-full h-12 overflow-hidden rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95' } ${className}`}>
        <ShimmerBorder active={!disabled} />
        <div className="absolute inset-[1px] bg-[#0a0a0a] group-hover/btn:bg-[#151515] transition-colors rounded-[11px] flex items-center justify-center gap-2">
            <span className="font-bold text-blue-500 text-[10px] md:text-xs tracking-[0.2em] uppercase text-glow">{children}</span>
            {Icon && <Icon className="w-4 h-4 text-blue-500 group-hover/btn:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(59,130,246,1)]" />}
        </div>
    </button>
);

export const GlowText = ({ text, className = "" }: { text: string | number, className?: string }) => (
    <span className={`text-blue-200/90 text-glow font-mono ${className}`}>{text}</span>
);

export const GlobalSvgFilters = () => (
    <>
        <style jsx global>{GLOBAL_STYLES}</style>
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                <filter id="chrome-liquid"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="warp" /><feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" /></filter>
                <filter id="gold-shine"><feSpecularLighting result="spec" specularConstant="1" specularExponent="20" lightingColor="#FFD700"><fePointLight x="-5000" y="-10000" z="20000" /></feSpecularLighting><feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" /></filter>
                <filter id="banknote"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" /><feDiffuseLighting in="noise" lightingColor="#85bb65" surfaceScale="2"><feDistantLight azimuth="45" elevation="60" /></feDiffuseLighting><feComposite operator="in" in2="SourceGraphic" /><feBlend mode="multiply" in="SourceGraphic" /></filter>
            </defs>
        </svg>
    </>
);

// ============================================================================
// 3. UI COMPONENTS
// ============================================================================

export const IllusionLayer = ({ type = 'SCANLINES' }: { type?: string }) => (
    <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-30">
        <div className="w-full h-full" style={{
            background: type === 'SCANLINES' ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))' : 'none',
            backgroundSize: type === 'SCANLINES' ? '100% 2px, 3px 100%' : 'auto'
        }} />
    </div>
);

const MiniDashboardPreview = ({ color, isUnavailable }: { color: string, isUnavailable: boolean }) => (
    <div className={`w-full h-full p-2 flex flex-col gap-1 bg-black/50 ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className="w-1/3 h-1 bg-white/20 rounded-full mb-1" />
      <div className="flex gap-1 h-full">
        <div className="w-1/2 h-full rounded border border-white/10 flex flex-col justify-center items-center">
          <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: color, opacity: 0.8 }} />
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="w-1/2 h-full flex flex-col gap-1">
           <div className="h-1/2 rounded border border-white/10 bg-white/5" />
           <div className="h-1/2 rounded border border-white/10" />
        </div>
      </div>
    </div>
);

// ----------------------------------------------------------------------------
// AssetKpiCard (Reusable Component for Ticker Data) - FIXED TYPESCRIPT
// ----------------------------------------------------------------------------

// Define the exact keys accepted by ICON_MAP for TypeScript safety
type IconMapKeys = 'TOTAL' | 'BTC' | 'ETH'; 

// Apply the explicit keys to ICON_MAP
const ICON_MAP: Record<IconMapKeys, { Icon: any; color: string; bg: string; border: string }> = {
    TOTAL: { Icon: TrendingUp, color: 'rgb(96 165 250)', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    BTC: { Icon: DollarSign, color: '#F7931A', bg: 'bg-[#F7931A]/20', border: 'border-[#F7931A]/30' },
    ETH: { Icon: Zap, color: 'rgb(96 165 250)', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
};

const AssetKpiCard = ({ symbol, price, prevPrice, percentChange, isTotalTraded = false, portfolioValue }: { 
    // Fix: Use IconMapKeys instead of generic string
    symbol: IconMapKeys, 
    price: string, prevPrice: string, percentChange: string, 
    isTotalTraded?: boolean, portfolioValue?: number 
}) => {
    
    // Determine props based on the symbol (TypeScript is now satisfied)
    const { Icon, color, bg, border } = ICON_MAP[symbol] || ICON_MAP.TOTAL;
    
    // Display values
    const isPositive = parseFloat(percentChange) >= 0;
    const priceToDisplay = isTotalTraded && portfolioValue !== undefined ? portfolioValue.toFixed(2) : price;
    const prevPriceToDisplay = isTotalTraded && portfolioValue !== undefined ? (portfolioValue - 100).toString() : prevPrice;
    const percentChangeToDisplay = isTotalTraded ? '+4.2' : percentChange;
    
    const percentChangeColorClass = isTotalTraded 
        ? 'text-green-400' 
        : (isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400');

    return (
        <div className="snap-center w-[85vw] md:w-auto flex-none">
            <ShimmerCard className="h-32 md:h-40 w-full">
                <div className="p-4 md:p-6 flex flex-col justify-between h-full">
                    {/* Top Row: Icon & Percent Change/Status */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${bg} border ${border}`}>
                                <Icon className={`w-4 h-4`} style={{ color: color }} /> 
                            </div>
                            {!isTotalTraded && <span className="font-bold text-xs">{symbol}</span>}
                        </div>
                        {/* Percent Change / Fixed Status */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isTotalTraded ? '' : 'text-xs'} ${percentChangeColorClass}`}>
                            {percentChangeToDisplay}%
                        </span>
                    </div>

                    {/* Bottom Row: Title & Price */}
                    <div>
                        {isTotalTraded && <div className="text-gray-500 text-[9px] uppercase tracking-widest mb-1">TOTAL TRADED</div>}
                        <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-white mt-auto">
                            <LivePriceDisplay price={priceToDisplay} prevPrice={prevPriceToDisplay} />
                        </div>
                    </div>
                </div>
            </ShimmerCard>
        </div>
    );
};
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// SoundSelector 
// ----------------------------------------------------------------------------
const SoundSelector = ({ active, onSelect }: { active: SoundProfile, onSelect: (id: SoundProfile) => void }) => {
    const packs: {id: SoundProfile, label: string, icon: any}[] = [
        { id: 'MECHANICAL', label: 'MECH', icon: Command },
        { id: 'SOROS', label: 'SOROS', icon: DollarSign },
        { id: 'SCI-FI', label: 'SCI-FI', icon: Zap },
        { id: 'SILENT', label: 'MUTE', icon: VolumeX },
    ];
    return (
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full"> 
            {packs.map((pack) => (
                <button 
                    key={pack.id} 
                    onClick={() => onSelect(pack.id)} 
                    className={`h-10 text-[10px] md:text-[10px] font-bold tracking-wider uppercase rounded-lg border transition-all flex items-center justify-center
                        ${pack.id === active ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-white/10 text-gray-400 hover:border-blue-500/50'}
                    `}
                >
                    {/* Simplified for mobile: Always show text, trust the grid */}
                    <span className="truncate px-1">{pack.label}</span>
                </button>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------------
// SetupThemeInterface (FIXED FOR MOBILE SCROLLING)
// ----------------------------------------------------------------------------
const SetupThemeInterface = ({ 
    activeThemeId, setActiveThemeId, activeCategory, setActiveCategory, 
    isMobile, currentSound, setCurrentSound, isMuted, setIsMuted 
}: { 
    activeThemeId: string, setActiveThemeId: (id: string) => void,
    activeCategory: ThemeCategory, setActiveCategory: (cat: ThemeCategory) => void,
    isMobile: boolean,
    currentSound: SoundProfile, setCurrentSound: (s: SoundProfile) => void,
    isMuted: boolean, setIsMuted: (m: boolean) => void
}) => {
    const filteredThemes = useMemo(() => THEMES.filter((t) => t.category === activeCategory), [activeCategory]);
    const allCategories = useMemo(() => Array.from(new Set(THEMES.map(t => t.category))), []);
    const preferredOrder: ThemeCategory[] = ['SPECIAL', 'CRYPTO', 'SENTIMENT', 'ASSETS', 'HISTORICAL', 'OPTICS', 'EXOTIC', 'GLITCH'];
    const sortedCategories = preferredOrder.filter(cat => allCategories.includes(cat));

    const getCategoryIcon = (cat: ThemeCategory) => {
        if (cat === 'SPECIAL') return <Zap className="w-3 h-3 text-yellow-500" />;
        if (cat === 'CRYPTO') return <DollarSign className="w-3 h-3" />;
        if (cat === 'SENTIMENT') return <Activity className="w-3 h-3" />;
        if (cat === 'ASSETS') return <Shield className="w-3 h-3" />;
        if (cat === 'HISTORICAL') return <Lock className="w-3 h-3" />;
        if (cat === 'OPTICS') return <Monitor className="w-3 h-3" />;
        if (cat === 'EXOTIC') return <Hash className="w-3 h-3" />;
        return <Layers className="w-3 h-3" />;
    };

    return (
        // KEY FIX: Removed fixed height constraints on mobile (h-auto) and added min-height only on desktop.
        // This prevents the "scrollception" where mobile content gets hidden inside a fixed-height box.
        <div className="flex flex-col lg:flex-row h-auto lg:h-full lg:min-h-[450px] border border-white/10 rounded-lg overflow-hidden bg-black/40">
            
            {/* LEFT RAIL (Desktop) / TOP SCROLL (Mobile) */}
            <div className="
                w-full lg:w-48 bg-[#000000]/80 
                border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 
                flex flex-row lg:flex-col 
                overflow-x-auto lg:overflow-y-auto 
                custom-scrollbar no-scrollbar
            ">
                <div className="flex flex-row lg:flex-col p-2 gap-2 lg:gap-1">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-3 text-blue-500 font-bold text-xs tracking-widest border-b border-white/10 mb-2">
                        <Layers className="w-3 h-3" /> CATEGORIES
                    </div>
                    {sortedCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`
                                flex items-center gap-2 flex-shrink-0 
                                lg:w-full px-4 py-3 rounded-md
                                text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all
                                whitespace-nowrap
                                ${cat === activeCategory 
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                    : 'text-gray-500 hover:bg-white/5 border border-transparent bg-white/5 lg:bg-transparent'
                                }
                            `}
                        >
                            {getCategoryIcon(cat)} {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL: CONTENT */}
            {/* KEY FIX: 'overflow-visible' on mobile, 'overflow-y-auto' on desktop. 
                This ensures mobile users scroll the whole page, not a tiny internal box. */}
            <div className="flex-1 p-4 md:p-6 overflow-visible lg:overflow-y-auto custom-scrollbar flex flex-col gap-6">
                 
                 {/* 1. AUDIO PROFILE SECTION */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                        <Volume2 className="w-3 h-3 text-blue-500"/> AUDIO_PROFILE
                    </h3>
                    <SoundSelector 
                        active={currentSound} 
                        onSelect={(s) => { 
                            setCurrentSound(s); 
                            if (s === 'SILENT') setIsMuted(true); 
                            else if (isMuted) setIsMuted(false); 
                        }} 
                    />
                </div>

                {/* 2. VISUAL INTERFACE SECTION (Themes) */}
                <div className="flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Monitor className="w-3 h-3 text-blue-500"/> VISUAL_INTERFACE
                    </h3>
                    
                    {/* Grid adapts to screen size */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
                        {filteredThemes.map((theme) => {
                            const isAvailable = theme.status === 'UNAVAILABLE';
                            
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => !isAvailable && setActiveThemeId(theme.id)}
                                    disabled={isAvailable}
                                    className={`
                                        relative group text-left rounded-xl overflow-hidden border transition-all duration-300 w-full aspect-video
                                        ${isAvailable ? 'opacity-40 cursor-not-allowed border-white/5 grayscale'
                                        : activeThemeId === theme.id ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)]' : 'border-white/10 hover:border-white/30 bg-black'}
                                    `}
                                >
                                    {isAvailable && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                                            <Lock className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                    {/* Preview */}
                                    <div className="w-full h-full relative overflow-hidden bg-gray-950">
                                        <div 
                                            className={`w-full h-full absolute inset-0 transition-all duration-500 ${activeThemeId === theme.id ? 'scale-105' : 'group-hover:scale-105'}`}
                                            style={{ filter: isMobile ? theme.mobileFilter : theme.filter }}
                                        >
                                            <MiniDashboardPreview color={theme.accentColor || '#3b82f6'} isUnavailable={isAvailable} />
                                        </div>
                                    </div>
                                    
                                    {/* Label */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex items-end justify-between">
                                        <div>
                                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${activeThemeId === theme.id ? 'text-white text-glow' : 'text-gray-400'}`}>{theme.name}</span>
                                            <span className="text-[8px] text-gray-600 font-mono">{theme.description}</span>
                                        </div>
                                        {activeThemeId === theme.id && <div className="bg-blue-500 rounded-full p-0.5"><Check className="w-2 h-2 text-black" /></div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------
// HELPER: Simulated Stats Card
// ----------------------------------------------------------------------------

const SimulatedStatsCard = ({ label, value, icon: Icon }: { label: string, value: string, icon: any }) => (
    <ShimmerCard className="h-16 md:h-20 shrink-0">
        <div className="p-3 flex items-center justify-between h-full">
            <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
                <span className="text-base md:text-lg font-bold text-white font-mono">{value}</span>
            </div>
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-400/50" />
        </div>
    </ShimmerCard>
);

// ----------------------------------------------------------------------------
// ControlPanel (Sidebar Content)
// ----------------------------------------------------------------------------
const ControlPanel = ({ 
    activeThemeId, setActiveThemeId, activeCategory, setActiveCategory, 
    isMobile, isMuted, setIsMuted, currentSound, setCurrentSound,
    onAction, onSaveTheme 
}: {
    activeThemeId: string, setActiveThemeId: (id: string) => void,
    activeCategory: ThemeCategory, setActiveCategory: (cat: ThemeCategory) => void,
    isMobile: boolean,
    isMuted: boolean, setIsMuted: (muted: boolean) => void,
    currentSound: SoundProfile, setCurrentSound: (sound: SoundProfile) => void,
    onAction: (action: string) => void,
    onSaveTheme: (themeId: string) => void
}) => {
    // Simulated values for the sidebar
    const simulatedTraders = '18,451';
    const simulatedAssets = '$2.13B';

    return (
        <div className="flex flex-col h-full gap-4">
            {/* BOTTOM: QUICK OPS & SIMULATED STATS */}
            <ShimmerCard className="shrink-0">
                <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-yellow-400" /> <span className="font-bold text-xs tracking-wider text-gray-200">QUICK OPS & STATS</span>
                    </div>
                    
                    {/* Simulated Stats Section */}
                    <div className="grid grid-cols-2 gap-2 mb-4 pt-1 border-b border-white/5 pb-4">
                        <SimulatedStatsCard label="Simulated Traders" value={simulatedTraders} icon={Activity} />
                        <SimulatedStatsCard label="Simulated Assets" value={simulatedAssets} icon={DollarSign} />
                    </div>

                    {/* Action Buttons Section */}
                    <div className="grid grid-cols-1 gap-3">
                        <ShimmerButton icon={Check} onClick={() => onSaveTheme(activeThemeId)} className="h-10 text-xs text-green-500">SAVE THEME TO PAGE</ShimmerButton>
                        <ShimmerButton icon={ArrowRight} onClick={() => onAction('exit')} className="h-10 text-xs">EXIT TO DASHBOARD</ShimmerButton>
                    </div>
                </div>
            </ShimmerCard>
        </div>
    );
};


// ============================================================================
// 4. DATA ENGINES
// ============================================================================

const TARGET_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
const LOWER_CASE_PAIRS = TARGET_PAIRS.map(p => p.toLowerCase());

export const useBinanceTickers = () => {
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true; 
    const streams = LOWER_CASE_PAIRS.map(p => `${p}@miniTicker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
    if (isMounted) setStatus('CONNECTING');
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => { if (isMounted) setStatus('CONNECTED'); };
    const handleMessage = (event: MessageEvent) => { 
      const data = JSON.parse(event.data);
      if (isMounted) {
          setTickers(prev => {
            const symbol = data.s; const currentPrice = parseFloat(data.c || '0').toFixed(2); 
            return { ...prev, [symbol]: { symbol: data.s, price: currentPrice, percentChange: parseFloat(data.P || '0').toFixed(2), prevPrice: prev[symbol] ? prev[symbol].price : currentPrice } };
          });
      }
    };
    wsRef.current.onmessage = handleMessage;
    wsRef.current.onclose = () => { if (isMounted) setStatus('DISCONNECTED'); };
    wsRef.current.onerror = () => { if (isMounted) setStatus('DISCONNECTED'); };
    return () => { isMounted = false; if (wsRef.current) wsRef.current.close(); };
  }, []);
  return { tickers, status };
};

export const useBinanceChart = (symbol: string = 'BTCUSDT') => {
    const [chartData, setChartData] = useState<number[]>([]); 
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`);
                if (!res.ok) throw new Error("Binance API fetch failed");
                const data = await res.json();
                setChartData(data.map((d: any[]) => parseFloat(d[4])));
            } catch (e) { setChartData([]); }
        };
        fetchHistory();
        const intervalId = setInterval(fetchHistory, 3600000); 
        return () => clearInterval(intervalId);
    }, [symbol]);
    return chartData;
};

const LivePriceDisplay = ({ price, prevPrice }: { price: string, prevPrice: string }) => {
  const direction = parseFloat(price) > parseFloat(prevPrice) ? 'up' : parseFloat(price) < parseFloat(prevPrice) ? 'down' : 'neutral';
  return (
    <span className={`transition-colors duration-300 ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white'}`}>
      ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

const LiveTickerTape = ({ tickers }: { tickers: Record<string, TickerData> }) => {
  const tickerList = TARGET_PAIRS.map(symbol => tickers[symbol]).filter(Boolean);
  const displayList = tickerList.length > 0 ? tickerList : TARGET_PAIRS.map(p => ({ symbol: p, price: '---', percentChange: '0.00', prevPrice: '0' }));
  return (
    <div className="relative w-full h-8 md:h-10 shrink-0 z-50 bg-black border-b border-white/10">
      <div className="w-full h-full bg-neutral-950/80 backdrop-blur-sm flex items-center overflow-hidden">
        <motion.div className="flex whitespace-nowrap" animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }}>
          {[...displayList, ...displayList, ...displayList].map((t, i) => (
             <div key={`${t.symbol}-${i}`} className="flex items-center gap-3 px-6 border-r border-white/10 h-10">
                <span className="font-bold text-blue-500 text-[10px] md:text-xs">{t.symbol.replace('USDT', '')}</span>
                <span className="text-white font-mono text-[10px] md:text-xs">{t.price === '---' ? t.price : `$${t.price}`}</span>
                <span className={`text-[10px] ${parseFloat(t.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{parseFloat(t.percentChange) > 0 ? '+' : ''}{t.percentChange}%</span>
             </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export const WelcomeBackModal = ({ isOpen, onContinue, onSkip }: { isOpen: boolean, onContinue: () => void, onSkip: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-6 font-sans">
                <div className="max-w-lg w-full">
                    <ShimmerCard className="p-0">
                        <div className="px-6 md:px-8 py-8 md:py-10 flex flex-col items-center justify-center text-center">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 text-shimmer-effect uppercase">Welcome Back</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-blue-900/30 rounded-full mb-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                <GlowText text="TERMINAL DETECTED" className="text-[10px] font-bold" />
                            </div>
                            <ShimmerButton onClick={onContinue} icon={ArrowRight}>CONTINUE SETUP</ShimmerButton>
                            <button onClick={onSkip} className="mt-6 flex items-center gap-2 group">
                                <GlowText text="Skip to Dashboard" className="text-xs group-hover:text-white transition-colors" />
                                <SkipForward className="w-3 h-3 text-blue-500 group-hover:text-white" />
                            </button>
                        </div>
                    </ShimmerCard>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const SupportWidget = () => (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90]">
        <button className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#050505] border border-blue-900/50 shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group hover:scale-110 transition-transform">
            <ShimmerBorder active={true} />
            <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center z-10">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-500 text-glow" />
            </div>
        </button>
    </div>
);

// ============================================================================
// 5. MAIN PAGE COMPONENT
// ============================================================================

export default function FixedThemeConfigurator({ initialThemeId, onThemeChange }: { initialThemeId: string, onThemeChange: (themeId: string) => void }) {
    // --- HOOKS ---
    const { tickers, status: wsStatus } = useBinanceTickers();
    const chartData = useBinanceChart('BTCUSDT'); 
    
    // --- STATE ---
    // These states and setters are correctly inferred as (string, fn) and (ThemeCategory, fn)
    const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
    const [isMuted, setIsMuted] = useState(true);
    const [activeCategory, setActiveCategory] = useState<ThemeCategory>('SENTIMENT');
    const [isMobile, setIsMobile] = useState(false); 
    const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- DERIVED ---
    const activeTheme = useMemo(() => THEMES.find(t => t.id === activeThemeId) || THEMES[0], [activeThemeId]);
    const btcData = tickers['BTCUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    const ethData = tickers['ETHUSDT'] || { price: '0.00', percentChange: '0.00', prevPrice: '0' };
    const portfolioValue = useMemo(() => (parseFloat(btcData.price) * 0.45) + (parseFloat(ethData.price) * 12.5) + 15240, [btcData.price, ethData.price]);
    
    // Chart Mini-Logic
    const normalizedChartBars = useMemo(() => {
        if (chartData.length === 0) return Array(12).fill(50);
        const min = Math.min(...chartData); const max = Math.max(...chartData);
        return chartData.slice(-12).map(val => ((val - min) / (max - min || 1)) * 40 + 10); 
    }, [chartData]);

    const handleSaveTheme = useCallback((themeId: string) => {
        onThemeChange(themeId); 
        setIsMobileMenuOpen(false); 
    }, [onThemeChange]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); 
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.volume = 0.15;
            !isMuted ? audioRef.current.play().catch(() => setIsMuted(true)) : audioRef.current.pause();
        }
    }, [isMuted]);

    return (
        <main 
            className="relative min-h-screen bg-black overflow-hidden font-sans selection:bg-blue-500/30 text-white"
            style={{ filter: isMobile ? activeTheme.mobileFilter : activeTheme.filter, transition: 'filter 0.5s ease-in-out' }}
        >
            <GlobalSvgFilters />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay"><IllusionLayer type={activeTheme.illusion} /></div>
            <audio ref={audioRef} loop src="/assets/ambient-drone.mp3" />

            {/* --- HEADER --- */}
            <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
                <LiveTickerTape tickers={tickers} />
                <div className="h-12 md:h-14 flex items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-500 font-bold tracking-[0.2em] text-xs md:text-base">SYNTHESIS_OS</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-6">
                        <GlowText text={activeTheme.name.toUpperCase()} className="text-xs tracking-wider" />
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10">
                            <Wifi className={`w-3 h-3 ${wsStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`} />
                            <span className="text-[10px] font-mono text-gray-400">UPLINK: {wsStatus}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1 text-white">
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* --- MOBILE DRAWER (For Config Actions) --- FIX APPLIED HERE */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 z-[60] bg-black lg:hidden pt-20 px-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-lg font-bold tracking-widest text-blue-500">SYSTEM CONFIG</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 text-white" /></button>
                        </div>
                        {/* Mobile Content Scroll Area */}
                        <div className="h-full pb-10 flex flex-col"> 
                             {/* 1. Control Panel (Quick Ops & Save/Exit) */}
                             <ControlPanel 
                                activeThemeId={activeThemeId} setActiveThemeId={setActiveThemeId}
                                activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                                isMobile={true} currentSound={currentSound} setCurrentSound={setCurrentSound}
                                isMuted={isMuted} setIsMuted={setIsMuted}
                                onAction={() => setIsMobileMenuOpen(false)}
                                onSaveTheme={handleSaveTheme}
                             />
                            
                             {/* FIX: Explicitly add vertical spacing between ControlPanel and SetupThemeInterface on mobile. */}
                             <div className="h-6 shrink-0"/> 

                             {/* 2. Setup Theme Interface (Main content of the drawer) */}
                             <SetupThemeInterface 
                                activeThemeId={activeThemeId} setActiveThemeId={setActiveThemeId}
                                activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                                isMobile={isMobile} currentSound={currentSound} setCurrentSound={setCurrentSound}
                                isMuted={isMuted} setIsMuted={setIsMuted}
                             />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <WelcomeBackModal isOpen={showWelcome} onContinue={() => { setShowWelcome(false); setIsMuted(false); }} onSkip={() => setShowWelcome(false)} />

            {/* --- MAIN DASHBOARD GRID (Original Left Column Structure - Spacing already fixed) --- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-24 md:pt-28 pb-6 px-4 md:px-6 h-screen flex flex-col z-10 relative max-w-[1600px] mx-auto" style={{ filter: showWelcome ? 'blur(10px)' : 'none' }}>
                <div className="mb-4 md:mb-6 shrink-0">
                    <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">COMMAND DECK</h1>
                </div>

                {/* Grid Layout Container */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0 overflow-y-auto lg:overflow-visible pb-20 lg:pb-0">
                    
                    {/* LEFT SECTION (9 COLUMNS) */}
                    {/* Note: This section's gap is already set correctly for the desktop/main view */}
                    <div className="lg:col-span-9 flex flex-col gap-6 md:gap-8 min-h-0"> 
                        
                        {/* 📈 KPI Cards - Horizontal Scroll on Mobile */}
                        <div className="flex overflow-x-auto gap-4 shrink-0 pb-4 md:pb-6 snap-x-mandatory no-scrollbar md:grid md:grid-cols-3">
                            
                            {/* 1. TOTAL TRADED */}
                            <AssetKpiCard
                                symbol="TOTAL"
                                isTotalTraded={true}
                                portfolioValue={portfolioValue}
                                percentChange="+4.2" 
                                price={portfolioValue.toFixed(2)}
                                prevPrice={(portfolioValue - 100).toString()}
                            />
                            
                            {/* 2. BTC (Live from Binance) */}
                            <AssetKpiCard
                                symbol="BTC"
                                price={btcData.price}
                                prevPrice={btcData.prevPrice}
                                percentChange={btcData.percentChange}
                            />
                            
                            {/* 3. ETH (Live from Binance) */}
                            <AssetKpiCard
                                symbol="ETH"
                                price={ethData.price}
                                prevPrice={ethData.prevPrice}
                                percentChange={ethData.percentChange}
                            />
                        </div>

                        {/* BIG THEME CONFIG */}
                        <div className="flex-1 lg:min-h-[400px]">
                            <ShimmerCard className="h-auto">
                                <div className="p-3 md:p-5 h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3 shrink-0">
                                        <Settings className="w-4 h-4 text-blue-400" /> 
                                        <span className="font-bold text-[10px] md:text-xs tracking-wider uppercase text-blue-400">System Configuration // SETUP.EXE</span>
                                    </div>
                                    <SetupThemeInterface 
                                        activeThemeId={activeThemeId} setActiveThemeId={setActiveThemeId}
                                        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                                        isMobile={isMobile} currentSound={currentSound} setCurrentSound={setCurrentSound}
                                        isMuted={isMuted} setIsMuted={setIsMuted}
                                    />
                                </div>
                            </ShimmerCard>
                        </div>
                    </div>

                    {/* RIGHT SECTION (Sidebar on Desktop, Bottom Stack on Mobile) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: 0.5, delay: 0.4 }} 
                        className="flex flex-col w-full lg:w-auto lg:col-span-3 h-auto min-h-0 gap-4"
                    >
                         <ControlPanel 
                            activeThemeId={activeThemeId} setActiveThemeId={setActiveThemeId}
                            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                            isMobile={isMobile} isMuted={isMuted} setIsMuted={setIsMuted}
                            currentSound={currentSound} setCurrentSound={setCurrentSound}
                            onAction={() => setIsMobileMenuOpen(false)} 
                            onSaveTheme={handleSaveTheme}
                         />
                        
                        
                    </motion.div>

                </div>
            </motion.div>
            <SupportWidget />
        </main>
    );
};