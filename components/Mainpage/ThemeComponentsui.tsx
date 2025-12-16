"use client";

import React, { useMemo, useCallback } from 'react';
import { 
  Command, DollarSign, Zap, VolumeX, MessageCircle, ArrowRight, SkipForward, Check, Info, Lock, Volume2, Music, Wifi, WifiOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ====================================================================
// --- 1. UTILITIES & TYPES (DEFINITIVE LIST with Status) ---
// ====================================================================

// Utility function to merge class names conditionally
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT'; 

export type ThemeCategory = 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC';

export type Theme = { 
  id: string; 
  name: string; 
  description: string; 
  filter: string; 
  mobileFilter: string; 
  category: ThemeCategory; 
  isLight?: boolean; 
  illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE'; 
  accentColor?: string; 
  status: 'AVAILABLE' | 'UNAVAILABLE'; // <-- MANDATORY STATUS FIELD
};

export type LiveCryptoItem = { symbol: string; price: number; change: number; };

// --- SOUND PACKS ---
export const SOUND_PACKS = [
    { id: 'MECHANICAL' as const, label: 'MECH', icon: Command, description: 'Tactile, clicky keyboard sounds.' },
    { id: 'SOROS' as const, label: 'SOROS', icon: DollarSign, description: 'Classic trading floor sounds and alerts.' },
    { id: 'SCI-FI' as const, label: 'SCI-FI', icon: Zap, description: 'Futuristic, low-fi synth sound effects.' },
    { id: 'SILENT' as const, label: 'MUTE', icon: VolumeX, description: 'No sound effects. Peaceful silence.' },
];


export const THEMES: Theme[] = [
  // --- AVAILABLE THEMES ---
  { id: 'bull-money-special', name: 'Bull Money Chrome', description: 'REFRESH TO REVEAL', category: 'SPECIAL', filter: 'url(#chrome-liquid) sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', illusion: 'SCANLINES', accentColor: '#00FFFF', status: 'AVAILABLE' },
  { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE' },
  { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
  { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
  { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE' },
  { id: 'a01', name: 'Gold Bullion', description: 'XAU/USD', category: 'ASSETS', filter: 'url(#gold-shine) sepia(1) hue-rotate(10deg) saturate(3) brightness(0.9)', mobileFilter: 'sepia(1) hue-rotate(10deg) saturate(2)', illusion: 'NONE', accentColor: '#FBBF24', status: 'AVAILABLE' },
  { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE' },
  { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
  { id: 'a02', name: 'Silver Spot', description: 'XAG/USD', category: 'ASSETS', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.5))', mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
  { id: 'e01', name: 'Miami Vice', description: 'OTC Desk', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(300deg) saturate(2) contrast(1.1)', mobileFilter: 'sepia(0.5) hue-rotate(300deg)', illusion: 'NONE', accentColor: '#EC4899', status: 'AVAILABLE' },

  // --- UNAVAILABLE THEMES ---
  { id: 'c03', name: 'Solana Speed', description: 'SOL Summer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(220deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#14F195', status: 'UNAVAILABLE' },
  { id: 'c04', name: 'Doge Meme', description: 'To The Moon', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2)', mobileFilter: 'sepia(0.8) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#CBA6F7', status: 'UNAVAILABLE' },
  { id: 'c05', name: 'Monero Dark', description: 'Privacy', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.4)', mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#FF6600', status: 'UNAVAILABLE' },
  { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'UNAVAILABLE' },
  { id: 't04', name: 'Moon Mission', description: 'ATH Break', category: 'SENTIMENT', filter: 'brightness(1.2) contrast(1.1) saturate(0) sepia(0.2) drop-shadow(0 0 5px white)', mobileFilter: 'brightness(1.2) grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF', status: 'UNAVAILABLE' },
  { id: 't05', name: 'Whale Watch', description: 'Ocean', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(170deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(170deg)', illusion: 'SCANLINES', accentColor: '#1E3A8A', status: 'UNAVAILABLE' },
  { id: 't06', name: 'FUD Storm', description: 'Panic', category: 'SENTIMENT', filter: 'grayscale(1) contrast(2) brightness(0.6)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#525252', status: 'UNAVAILABLE' },
  { id: 'a03', name: 'Crude Oil', description: 'WTI Barrel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) brightness(0.4) contrast(1.5)', mobileFilter: 'sepia(1) brightness(0.5)', illusion: 'NOISE', accentColor: '#1C1917', status: 'UNAVAILABLE' },
  { id: 'a04', name: 'US Dollar', description: 'Fiat', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) contrast(0.9)', mobileFilter: 'sepia(1) hue-rotate(70deg)', illusion: 'VIGNETTE', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'a05', name: 'Lithium', description: 'Battery', category: 'ASSETS', filter: 'sepia(1) hue-rotate(290deg) saturate(0.5) contrast(2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#A855F7', status: 'UNAVAILABLE' },
  { id: 'o01', name: 'Night Vis', description: 'NVG-11', category: 'OPTICS', filter: 'grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1) sepia(1) hue-rotate(70deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'UNAVAILABLE' },
  { id: 'o02', name: 'Thermal', description: 'Predator', category: 'OPTICS', filter: 'invert(1) hue-rotate(180deg) saturate(2) contrast(1.5)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F43F5E', status: 'UNAVAILABLE' },
  { id: 'o03', name: 'CRT 1999', description: 'Legacy', category: 'OPTICS', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) grayscale(0.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#A3A3A3', status: 'UNAVAILABLE' },
  { id: 'e02', name: 'Vaporwave', description: 'Aesthetic', category: 'EXOTIC', filter: 'sepia(0.4) hue-rotate(290deg) saturate(1.5) contrast(1.1)', mobileFilter: 'sepia(0.4) hue-rotate(290deg)', illusion: 'SCANLINES', accentColor: '#D946EF', status: 'UNAVAILABLE' },
  { id: 'e03', name: 'Bank Note', description: 'Cash', category: 'EXOTIC', filter: 'url(#banknote) contrast(0.8)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#84CC16', status: 'UNAVAILABLE' },
  { id: 'e04', name: 'Blueprint', description: 'Architect', category: 'EXOTIC', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1) sepia(1) hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'UNAVAILABLE' },
];

export const getAvailableThemes = (): Theme[] => {
    return THEMES.filter(theme => theme.status === 'AVAILABLE');
}

// ====================================================================
// --- 2. CORE PRIMITIVES (Styles & Components) ---
// ====================================================================

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
  .animate-marquee { animation: marquee 20s linear infinite; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .locked-theme-preview {
      filter: grayscale(100%) contrast(0.8);
  }
`;

// FIX: Explicitly define ShimmerBorderProps for clarity and robustness
interface ShimmerBorderProps {
    active?: boolean;
}

export const ShimmerBorder = ({ active = true }: ShimmerBorderProps) => (
    <motion.div
        className="absolute inset-[-100%] pointer-events-none"
        animate={{ opacity: active ? 1 : 0, rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ background: SHIMMER_GRADIENT_BLUE }}
    />
);

interface ShimmerCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    'aria-label'?: string; 
}

export const ShimmerCard = ({ children, className = "", onClick, ...props }: ShimmerCardProps) => (
    <div onClick={onClick} className={cn("relative group w-full rounded-2xl p-[1px] shadow-[0_0_30px_-10px_rgba(37,99,235,0.2)] overflow-hidden", className)} {...props}>
        {/* ShimmerBorder is correctly used here */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden"><ShimmerBorder active={true} /></div>
        <div className="relative bg-[#050505] rounded-[15px] h-full z-10 overflow-hidden backdrop-blur-xl">{children}</div>
    </div>
);

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ElementType;
}

export const ShimmerButton = ({ onClick = () => {}, children, className = "", icon: Icon, disabled = false, title, ...props }: ShimmerButtonProps) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        title={title}
        className={cn('group/btn relative w-full h-12 overflow-hidden rounded-xl transition-all', 
                     disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95', 
                     className)}
        {...props}
    >
        {/* ShimmerBorder is correctly used here */}
        <ShimmerBorder active={!disabled} />
        <div className="absolute inset-[1px] bg-[#0a0a0a] group-hover/btn:bg-[#151515] transition-colors rounded-[11px] flex items-center justify-center gap-2">
            <span className="font-bold text-blue-500 text-[10px] md:text-xs tracking-[0.2em] uppercase text-glow">{children}</span>
            {Icon && <Icon className="w-4 h-4 text-blue-500 group-hover/btn:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(59,130,246,1)]" aria-hidden="true" />}
        </div>
    </button>
);

export const GlowText = ({ text, className = "" }: { text: string | number, className?: string }) => (
    <span className={`text-blue-200/90 text-glow font-mono ${className}`}>{text}</span>
);

// ====================================================================
// --- 3. GLOBAL SVG FILTERS (THE FIX) ---
// ====================================================================

export const GlobalSvgFilters = () => (
    <>
        <style jsx global>{GLOBAL_STYLES}</style>
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
            <defs>
                {/* 1. GLITCH HEAVY (General Purpose) */}
                <filter id="glitch-heavy"><feOffset in="SourceGraphic" dx="4" dy="0" result="layer1"/><feOffset in="SourceGraphic" dx="-4" dy="0" result="layer2"/><feMerge><feMergeNode in="layer1" /><feMergeNode in="layer2" /><feMergeNode in="SourceGraphic" /></feMerge><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" /></filter>
                
                {/* 2. CHROME LIQUID (Used by: bull-money-special) */}
                <filter id="chrome-liquid"><feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="warp" /><feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" /></filter>
                
                {/* 3. GOLD SHINE (Used by: a01 - Gold Bullion) */}
                <filter id="gold-shine">
                    <feSpecularLighting result="spec" specularConstant="1" specularExponent="20" lightingColor="#FFD700">
                        <fePointLight x="-5000" y="-10000" z="20000" />
                    </feSpecularLighting>
                    <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>
                
                {/* 4. BANK NOTE (Used by: e03 - Bank Note) */}
                <filter id="banknote">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                    <feDiffuseLighting in="noise" lightingColor="#85bb65" surfaceScale="2">
                        <feDistantLight azimuth="45" elevation="60" />
                    </feDiffuseLighting>
                    <feComposite operator="in" in2="SourceGraphic" />
                    <feBlend mode="multiply" in="SourceGraphic" />
                </filter>
            </defs>
        </svg>
    </>
);

// ====================================================================
// --- 4. DISPLAY COMPONENTS ---
// ====================================================================

export const IllusionLayer = ({ type = 'SCANLINES' }: { type?: string }) => (
    <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-30" aria-hidden="true">
        <div className="w-full h-full" style={{
            background: type === 'SCANLINES' 
                ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))'
                : type === 'NOISE' ? 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.1\'/%3E%3C/svg%3E")' 
                : type === 'VIGNETTE' ? 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)'
                : 'none',
            backgroundSize: type === 'SCANLINES' ? '100% 2px, 3px 100%' : 'auto'
        }} />
    </div>
);

export const TickerTape = ({ liveData = [] }: { liveData?: LiveCryptoItem[] }) => {
    // FIX: Added A11y attributes for marquee
    return (
        <div 
            className="relative w-full h-10 shrink-0 z-40 bg-black border-b border-blue-900/30"
            role="marquee"
            aria-label="Live Cryptocurrency Prices"
        >
            <div className="w-full h-full bg-neutral-950/80 backdrop-blur-sm flex items-center overflow-hidden">
                {/* FIX: Removed duplicate animate-marquee on inner div. Assuming outer div is the actual marquee */}
                <div className="animate-marquee whitespace-nowrap flex text-[10px] md:text-xs">
                     {[1,2,3,4].map((i) => (
                         <div key={i} className="flex items-center gap-2 px-4 border-r border-blue-900/30 h-full">
                            <GlowText text="BTC" className="font-bold text-blue-400" />
                            <GlowText text="$98,000.20" className="text-white" />
                            <span className="text-[10px] ml-1 text-blue-500 animate-pulse">+1.2%</span>
                         </div>
                     ))}
                     <div className="px-4 text-blue-500 font-mono text-[10px] animate-pulse">| SYSTEM_OPTIMAL |</div>
                </div>
            </div>
        </div>
    );
};

export const WelcomeBackModal = ({ isOpen, onContinue, onSkip }: { isOpen: boolean, onContinue: () => void, onSkip: () => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 font-sans"
                role="dialog"
                aria-modal="true"
                aria-label="Welcome Back Modal"
            >
                <div className="max-w-lg w-full">
                    <ShimmerCard className="p-0">
                        <div className="px-8 py-10 flex flex-col items-center justify-center text-center">
                            <h2 className="text-3xl font-bold tracking-tight mb-4 text-shimmer-effect uppercase">Welcome Back</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-blue-900/30 rounded-full mb-10 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                <GlowText text="TERMINAL DETECTED" className="text-[10px] font-bold" />
                            </div>
                            <ShimmerButton onClick={onContinue} icon={ArrowRight}>Continue Setup</ShimmerButton>
                            <button onClick={onSkip} className="mt-6 flex items-center gap-2 group" aria-label="Skip to Dashboard">
                                <GlowText text="Skip to Dashboard" className="text-xs group-hover:text-white transition-colors" />
                                <SkipForward className="w-3 h-3 text-blue-500 group-hover:text-white" aria-hidden="true" />
                            </button>
                        </div>
                    </ShimmerCard>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const SupportWidget = () => (
    <div className="fixed bottom-6 right-6 z-[90]">
        <button 
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#050505] border border-blue-900/50 shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group hover:scale-110 transition-transform"
            aria-label="Open Support Chat" // Added A11y Label
        >
            <ShimmerBorder active={true} />
            <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center z-10">
                <MessageCircle className="w-6 h-6 text-blue-500 text-glow" aria-hidden="true" />
            </div>
        </button>
    </div>
);

export const SoundSelector = ({ active, onSelect }: { active: SoundProfile, onSelect: (id: SoundProfile) => void }) => {
    const packs: {id: SoundProfile, label: string, icon: any}[] = [
        { id: 'MECHANICAL', label: 'MECH', icon: Command },
        { id: 'SOROS', label: 'SOROS', icon: DollarSign },
        { id: 'SCI-FI', label: 'SCI-FI', icon: Zap },
        { id: 'SILENT', label: 'MUTE', icon: VolumeX },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full" role="radiogroup" aria-label="Select Sound Profile">
            {packs.map((pack) => (
                <ShimmerButton 
                    key={pack.id} 
                    onClick={() => onSelect(pack.id)} 
                    icon={pack.icon} 
                    className={active !== pack.id ? "opacity-50 hover:opacity-100" : "ring-2 ring-blue-500 shadow-lg shadow-blue-500/30"}
                    role="radio"
                    aria-checked={active === pack.id}
                    title={`${pack.label} Sound Pack`}
                >
                    {pack.label}
                </ShimmerButton>
            ))}
        </div>
    );
};

// Assuming you have a simplified mock component for the preview content:
const SimpleMockDashboard = () => (
    <div className="w-full h-full p-1 flex flex-col gap-0.5">
        <div className="w-1/3 h-1 bg-white/40 rounded-full mb-1" />
        <div className="flex gap-0.5 h-full">
            <div className="w-1/2 h-full rounded border border-white/20 flex flex-col justify-center items-center bg-white/10" />
            <div className="w-1/2 h-full flex flex-col gap-0.5">
               <div className="h-1/2 rounded border border-white/20 bg-white/20" />
               <div className="h-1/2 rounded border border-white/20 bg-white/10" />
            </div>
        </div>
    </div>
);


export const ThemePreviewCard = ({ theme, active, onClick, isMobile = false }: { theme: Theme, active: boolean, onClick: () => void, isMobile?: boolean }) => {
    
    const isDisabled = theme.status === 'UNAVAILABLE';
    const filterToApply = isMobile ? theme.mobileFilter : theme.filter;

    const handleClick = useCallback(() => {
        if (!isDisabled) {
            onClick();
        }
    }, [isDisabled, onClick]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    }, [isDisabled, onClick]);

    return (
        <div 
            onClick={handleClick} 
            onKeyDown={handleKeyDown}
            role="radio" // A11y role
            aria-checked={active} // A11y state
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0} // A11y keyboard focus
            className={cn(
                "cursor-pointer outline-none rounded-2xl transition-all duration-200",
                isDisabled ? 'opacity-70 pointer-events-none' : 'hover:scale-[1.03] focus:scale-[1.03]'
            )}
            aria-label={`Select theme ${theme.name}. Status: ${isDisabled ? 'Unavailable' : 'Available'}.`}
        >
            <ShimmerCard className={cn('aspect-[4/3]', active ? 'ring-1 ring-blue-500' : 'opacity-80 hover:opacity-100')}>
                <div className="p-2 flex flex-col justify-between h-full">
                    <div 
                        className={cn(
                            "w-full flex-1 bg-black rounded-lg mb-2 border border-blue-500/10 relative overflow-hidden transition-all duration-300",
                            isDisabled && "locked-theme-preview" // Use a dedicated class for styling unavailable state
                        )}
                        style={{ filter: filterToApply }}
                    >
                        {/* RENDER THE MOCK DASHBOARD INSIDE THE FILTER CONTAINER */}
                        <SimpleMockDashboard />
                        {isDisabled && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                                <Lock className="w-6 h-6 text-red-400 mb-1" aria-hidden="true" />
                                <span className="text-red-400 text-xs font-mono">UNAVAILABLE</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <GlowText text={theme.name} className={cn('text-[10px] font-bold', isDisabled && 'text-gray-400')} />
                        {active && <Check className="w-4 h-4 text-blue-500" aria-hidden="true" />}
                    </div>
                </div>
            </ShimmerCard>
        </div>
    );
};