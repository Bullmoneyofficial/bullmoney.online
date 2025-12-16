"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
    TrendingUp, Shield, Lock, Activity, 
    Menu, X, Volume2, Settings, Monitor, RefreshCw, Wifi, WifiOff, Layers, Hash, Info, MessageCircle, ArrowRight, SkipForward, Check, Database, Globe,
    Command, DollarSign, Zap, VolumeX, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// 1. TYPES & THEMES & CONSTANTS 
// (Incorporating the complete theme list and required 'status' property)
// ============================================================================

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
    status: 'AVAILABLE' | 'UNAVAILABLE'; // Added status back for full functionality
};

// **COMPLETE THEMES ARRAY (Updated with status property)**
export const THEMES: Theme[] = [
    // SPECIAL
    { id: 'bull-money-special', name: 'Bull Money Chrome', description: 'REFRESH TO REVEAL', category: 'SPECIAL', filter: 'url(#chrome-liquid) sepia(1) hue-rotate(190deg) saturate(4) contrast(1.1) brightness(1.1) drop-shadow(0 0 5px rgba(0,255,255,0.5))', mobileFilter: 'sepia(1) hue-rotate(190deg) saturate(3) contrast(1.2)', illusion: 'SCANLINES', accentColor: '#00FFFF', status: 'AVAILABLE' },
    
    // CRYPTO
    { id: 'c01', name: 'Bitcoin Orange', description: 'BTC Core', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(350deg) saturate(3) contrast(1.1)', mobileFilter: 'sepia(1) hue-rotate(350deg)', illusion: 'NONE', accentColor: '#F7931A', status: 'AVAILABLE' },
    { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
    { id: 'c03', name: 'Solana Speed', description: 'SOL Summer', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(220deg) saturate(4) contrast(1.2)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#14F195', status: 'UNAVAILABLE' },
    { id: 'c04', name: 'Doge Meme', description: 'To The Moon', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(40deg) saturate(2) brightness(1.2)', mobileFilter: 'sepia(0.8) hue-rotate(40deg)', illusion: 'NONE', accentColor: '#CBA6F7', status: 'AVAILABLE' },
    { id: 'c05', name: 'Monero Dark', description: 'Privacy', category: 'CRYPTO', filter: 'grayscale(1) contrast(2) brightness(0.4)', mobileFilter: 'grayscale(1) contrast(1.5)', illusion: 'NOISE', accentColor: '#FF6600', status: 'AVAILABLE' },

    // SENTIMENT
    { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
    { id: 't02', name: 'God Candle', description: 'Up Only', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(60deg) saturate(3) brightness(1.1)', mobileFilter: 'sepia(1) hue-rotate(60deg) saturate(2)', illusion: 'VIGNETTE', accentColor: '#10B981', status: 'AVAILABLE' },
    { id: 't03', name: 'Blood Bath', description: 'Capitulation', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(320deg) saturate(4) contrast(1.2)', mobileFilter: 'sepia(1) hue-rotate(320deg)', illusion: 'NOISE', accentColor: '#EF4444', status: 'AVAILABLE' },
    { id: 't04', name: 'Moon Mission', description: 'ATH Break', category: 'SENTIMENT', filter: 'brightness(1.2) contrast(1.1) saturate(0) sepia(0.2) drop-shadow(0 0 5px white)', mobileFilter: 'brightness(1.2) grayscale(1)', illusion: 'VIGNETTE', accentColor: '#FFFFFF', status: 'AVAILABLE' },
    { id: 't05', name: 'Whale Watch', description: 'Ocean', category: 'SENTIMENT', filter: 'sepia(1) hue-rotate(170deg) saturate(2) brightness(0.8)', mobileFilter: 'hue-rotate(170deg)', illusion: 'SCANLINES', accentColor: '#1E3A8A', status: 'AVAILABLE' },
    { id: 't06', name: 'FUD Storm', description: 'Panic', category: 'SENTIMENT', filter: 'grayscale(1) contrast(2) brightness(0.6)', mobileFilter: 'contrast(1.5)', illusion: 'NOISE', accentColor: '#525252', status: 'AVAILABLE' },
    
    // ASSETS
    { id: 'a01', name: 'Gold Bullion', description: 'XAU/USD', category: 'ASSETS', filter: 'url(#gold-shine) sepia(1) hue-rotate(10deg) saturate(3) brightness(0.9)', mobileFilter: 'sepia(1) hue-rotate(10deg) saturate(2)', illusion: 'NONE', accentColor: '#FBBF24', status: 'AVAILABLE' },
    { id: 'a02', name: 'Silver Spot', description: 'XAG/USD', category: 'ASSETS', filter: 'grayscale(1) brightness(1.2) contrast(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.5))', mobileFilter: 'grayscale(1) brightness(1.2)', illusion: 'NONE', accentColor: '#E5E5E5', status: 'AVAILABLE' },
    { id: 'a03', name: 'Crude Oil', description: 'WTI Barrel', category: 'ASSETS', filter: 'sepia(1) hue-rotate(350deg) saturate(0.5) brightness(0.4) contrast(1.5)', mobileFilter: 'sepia(1) brightness(0.5)', illusion: 'NOISE', accentColor: '#1C1917', status: 'AVAILABLE' },
    { id: 'a04', name: 'US Dollar', description: 'Fiat', category: 'ASSETS', filter: 'sepia(1) hue-rotate(70deg) saturate(1.5) contrast(0.9)', mobileFilter: 'sepia(1) hue-rotate(70deg)', illusion: 'VIGNETTE', accentColor: '#22C55E', status: 'AVAILABLE' },
    { id: 'a05', name: 'Lithium', description: 'Battery', category: 'ASSETS', filter: 'sepia(1) hue-rotate(290deg) saturate(0.5) contrast(2)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#A855F7', status: 'AVAILABLE' },
    
    // OPTICS
    { id: 'o01', name: 'Night Vis', description: 'NVG-11', category: 'OPTICS', filter: 'grayscale(1) sepia(1) hue-rotate(70deg) saturate(3) brightness(0.8) contrast(1.2)', mobileFilter: 'grayscale(1) sepia(1) hue-rotate(70deg)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
    { id: 'o02', name: 'Thermal', description: 'Predator', category: 'OPTICS', filter: 'invert(1) hue-rotate(180deg) saturate(2) contrast(1.5)', mobileFilter: 'invert(1)', isLight: true, illusion: 'NONE', accentColor: '#F43F5E', status: 'AVAILABLE' },
    { id: 'o03', name: 'CRT 1999', description: 'Legacy', category: 'OPTICS', filter: 'sepia(0.5) contrast(1.2) brightness(0.9) grayscale(0.2)', mobileFilter: 'sepia(0.5)', illusion: 'SCANLINES', accentColor: '#A3A3A3', status: 'AVAILABLE' },
    { id: 'o04', name: 'Cyberdeck', description: 'Hacker', category: 'OPTICS', filter: 'hue-rotate(220deg) saturate(2) contrast(1.3) brightness(0.7)', mobileFilter: 'hue-rotate(220deg)', illusion: 'SCANLINES', accentColor: '#0EA5E9', status: 'AVAILABLE' },

    // EXOTIC
    { id: 'e01', name: 'Miami Vice', description: 'OTC Desk', category: 'EXOTIC', filter: 'sepia(0.5) hue-rotate(300deg) saturate(2) contrast(1.1)', mobileFilter: 'sepia(0.5) hue-rotate(300deg)', illusion: 'NONE', accentColor: '#EC4899', status: 'AVAILABLE' },
    { id: 'e02', name: 'Vaporwave', description: 'Aesthetic', category: 'EXOTIC', filter: 'sepia(0.4) hue-rotate(290deg) saturate(1.5) contrast(1.1)', mobileFilter: 'sepia(0.4) hue-rotate(290deg)', illusion: 'SCANLINES', accentColor: '#D946EF', status: 'AVAILABLE' },
    { id: 'e03', name: 'Bank Note', description: 'Cash', category: 'EXOTIC', filter: 'url(#banknote) contrast(0.8)', mobileFilter: 'contrast(1.5)', illusion: 'NONE', accentColor: '#84CC16', status: 'AVAILABLE' },
    { id: 'e04', name: 'Blueprint', description: 'Architect', category: 'EXOTIC', filter: 'invert(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.2)', mobileFilter: 'invert(1) sepia(1) hue-rotate(180deg)', isLight: true, illusion: 'NONE', accentColor: '#3B82F6', status: 'AVAILABLE' },
    { id: 'e05', name: 'Matrix', description: 'Source', category: 'EXOTIC', filter: 'sepia(1) hue-rotate(50deg) saturate(5) contrast(1.5) brightness(0.8)', mobileFilter: 'sepia(1) hue-rotate(50deg) saturate(3)', illusion: 'SCANLINES', accentColor: '#22C55E', status: 'AVAILABLE' },
];

export type SoundProfile = 'MECHANICAL' | 'SOROS' | 'SCI-FI' | 'SILENT';

interface SoundPack {
    id: SoundProfile;
    label: string;
    icon: any; 
    description: string;
}

export const SOUND_PACKS: SoundPack[] = [
    { id: 'MECHANICAL', label: 'MECH', icon: Command, description: 'Tactile, clicky keyboard sounds.' },
    { id: 'SOROS', label: 'SOROS', icon: DollarSign, description: 'Classic trading floor sounds and alerts.' },
    { id: 'SCI-FI', label: 'SCI-FI', icon: Zap, description: 'Futuristic, low-fi synth sound effects.' },
    { id: 'SILENT', label: 'MUTE', icon: VolumeX, description: 'No sound effects. Peaceful silence.' },
];

// ============================================================================
// 1.5. CUSTOM HOOK FOR STATE PERSISTENCE (useTerminalSettings)
// ============================================================================

export type ThemeID = string;

// --- LOCAL STORAGE KEYS ---
const THEME_KEY = 'synthesis_theme';
const SOUND_KEY = 'synthesis_sound';
const MUTE_KEY = 'synthesis_muted';

export const useTerminalSettings = (initialThemeId: ThemeID = 't01', initialSound: SoundProfile = 'MECHANICAL') => {
    
    const [activeThemeId, setActiveThemeId] = useState<ThemeID>(() => {
        if (typeof window === 'undefined') return initialThemeId;
        return (localStorage.getItem(THEME_KEY) as ThemeID) || initialThemeId;
    });

    const [activeSound, setActiveSoundInternal] = useState<SoundProfile>(() => {
        if (typeof window === 'undefined') return initialSound;
        return (localStorage.getItem(SOUND_KEY) as SoundProfile) || initialSound;
    });

    const [isMuted, setIsMutedInternal] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const storedMute = localStorage.getItem(MUTE_KEY);
        return storedMute === 'true'; 
    });

    const [pendingThemeId, setPendingThemeId] = useState<ThemeID>(activeThemeId);
    
    const activeTheme = useMemo(() => {
        return THEMES.find(t => t.id === activeThemeId) || THEMES[0];
    }, [activeThemeId]);
    
    const handleApplyTheme = useCallback(() => {
        if (pendingThemeId !== activeThemeId) {
            setActiveThemeId(pendingThemeId);
            localStorage.setItem(THEME_KEY, pendingThemeId);
            return true;
        }
        return false;
    }, [pendingThemeId, activeThemeId]);

    const handleSetSound = useCallback((soundId: SoundProfile) => {
        setActiveSoundInternal(soundId);
        localStorage.setItem(SOUND_KEY, soundId);
    }, []);

    const handleSetMuted = useCallback((muted: boolean) => {
        setIsMutedInternal(muted);
        localStorage.setItem(MUTE_KEY, muted.toString());
    }, []);
    
    useEffect(() => {
        if (pendingThemeId !== activeThemeId) {
            setPendingThemeId(activeThemeId);
        }
    }, [activeThemeId]);

    return {
        activeTheme,
        activeThemeId,
        pendingThemeId,
        activeSound,
        isMuted,
        setPendingThemeId,
        setActiveSound: handleSetSound,
        setIsMuted: handleSetMuted,
        handleApplyTheme,
    };
};

// ============================================================================
// 2. CORE PRIMITIVES (Keeping as-is for brevity, assume they are available)
// ============================================================================
const SHIMMER_GRADIENT_BLUE = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #2563eb 50%, #00000000 100%)";

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

export const ShimmerButton = ({ onClick, children, className = "", icon: Icon, disabled = false, title }: { onClick?: () => void, children: React.ReactNode, className?: string, icon?: any, disabled?: boolean, title?: string }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        title={title}
        className={`group/btn relative w-full h-12 overflow-hidden rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95' } ${className}`}
    >
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

export const IllusionLayer = ({ type = 'SCANLINES' }: { type?: string }) => (
    <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-50">
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

export const WelcomeBackModal = ({ isOpen, onContinue, onSkip }: { isOpen: boolean, onContinue: () => void, onSkip: () => void }) => {
    const boardField = "CYBERDECK-01";
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 font-sans">
                    <div className="max-w-lg w-full">
                        <ShimmerCard className="p-0">
                            <div className="px-8 py-10 flex flex-col items-center justify-center text-center">
                                <h2 className="text-3xl font-bold tracking-tight mb-4 text-shimmer-effect uppercase">Welcome Back</h2>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-blue-900/30 rounded-full mb-6 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                                    <GlowText text="TERMINAL DETECTED" className="text-[10px] font-bold" />
                                </div>
                                
                                <div className="w-full text-left mb-8 space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <span className="text-gray-500 text-xs font-mono tracking-wider">BOARD FIELD:</span>
                                        <GlowText text={boardField} className="text-sm text-blue-400" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs font-mono tracking-wider">SYSTEM DATE:</span>
                                        <GlowText text={day} className="text-sm" />
                                    </div>
                                </div>

                                <ShimmerButton onClick={onContinue} icon={ArrowRight}>Continue Setup</ShimmerButton>
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
};

export const SupportWidget = () => (
    <div className="fixed bottom-6 right-6 z-[90]">
        <button className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#050505] border border-blue-900/50 shadow-[0_0_30px_rgba(37,99,235,0.4)] overflow-hidden group hover:scale-110 transition-transform">
            <ShimmerBorder active={true} />
            <div className="absolute inset-[2px] rounded-full bg-black flex items-center justify-center z-10">
                <MessageCircle className="w-6 h-6 text-blue-500 text-glow" />
            </div>
        </button>
    </div>
);

// --- Audio Control Button ---
const AudioControl = ({ isMuted, setIsMuted }: { isMuted: boolean, setIsMuted: (muted: boolean) => void }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2">
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />}
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Master Volume</h3>
        </div>
        <ShimmerButton onClick={() => setIsMuted(!isMuted)} icon={isMuted ? VolumeX : Volume2}>
            {isMuted ? 'ENABLE AUDIO' : 'DISABLE AUDIO'}
        </ShimmerButton>
    </div>
);

// --- SoundSelector Component (Audio Mixer) ---
interface SoundSelectorProps {
    active: SoundProfile;
    onSelect: (id: SoundProfile) => void;
}

export const SoundSelector = ({ active, onSelect }: SoundSelectorProps) => {
    return (
        <div className="space-y-4"> 
            
            <div className="flex items-center gap-2 border-b border-gray-700/50 pb-2">
                <Music className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
                    Audio Sound Pack Mixer
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
                {SOUND_PACKS.map((pack) => {
                    const isActive = active === pack.id;
                    const baseClasses = "transition duration-150 ease-in-out";
                    
                    return (
                        <ShimmerButton
                            key={pack.id}
                            onClick={() => onSelect(pack.id)}
                            icon={pack.icon}
                            title={pack.description}
                            className={`
                                ${baseClasses}
                                ${isActive 
                                    ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/30 font-bold"
                                    : "opacity-70 hover:opacity-100 hover:ring-1 hover:ring-gray-600/50"
                                }
                            `}
                        >
                            {pack.label}
                        </ShimmerButton>
                    );
                })}
            </div>
        </div>
    );
};

// --- MiniDashboardPreview & ThemeSelector ---
export const MiniDashboardPreview = ({ color, isUnavailable }: { color: string, isUnavailable: boolean }) => (
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

export const ThemeSelector = ({
    activeThemeId,
    setPendingThemeId,
    pendingThemeId,
    activeCategory,
    setActiveCategory,
    isMobile,
}: {
    activeThemeId: string;
    setPendingThemeId: (id: string) => void;
    pendingThemeId: string;
    activeCategory: ThemeCategory;
    setActiveCategory: (category: ThemeCategory) => void;
    isMobile: boolean;
}) => {
    const categories = useMemo(() => Array.from(new Set(THEMES.map(t => t.category))), []);
    const filteredThemes = useMemo(() => THEMES.filter(t => t.category === activeCategory), [activeCategory]);
    
    // Fallback logic for pendingTheme: 1. pendingId, 2. activeId, 3. first theme
    const pendingTheme = useMemo(() => {
        return THEMES.find(t => t.id === pendingThemeId) 
            || THEMES.find(t => t.id === activeThemeId) 
            || THEMES[0];
    }, [pendingThemeId, activeThemeId]);
    
    const previewFilter = isMobile ? pendingTheme.mobileFilter : pendingTheme.filter;

    return (
        <div className="space-y-6">
            {/* Theme Preview Card */}
            <div className="rounded-xl p-4 bg-white/5 border border-white/10 relative overflow-hidden h-32">
                <div className="absolute inset-0 transition-filter duration-500" style={{ filter: previewFilter }}>
                    <MiniDashboardPreview color={pendingTheme.accentColor || '#ffffff'} isUnavailable={pendingTheme.status === 'UNAVAILABLE'} />
                </div>
                <div className='absolute bottom-2 left-2 right-2 text-center'>
                    <span className='text-[10px] font-bold tracking-widest text-blue-300 uppercase'>
                        {pendingTheme.name}
                    </span>
                    {pendingTheme.id !== activeThemeId && pendingTheme.status === 'AVAILABLE' && (
                         <div className="mt-1 flex items-center justify-center gap-1">
                             <Check className='w-3 h-3 text-green-400' />
                             <span className='text-[8px] text-green-400 uppercase font-mono'>
                                 Pending Selection
                             </span>
                         </div>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 custom-scrollbar overflow-x-auto mask-linear-fade pb-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`text-xs font-mono uppercase px-3 py-1 rounded-full transition-all shrink-0 ${
                            activeCategory === category
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-black/50 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Theme Cards */}
            <div className="grid grid-cols-2 gap-4">
                {filteredThemes.map((theme) => (
                    <ShimmerCard 
                        key={theme.id} 
                        onClick={() => theme.status === 'AVAILABLE' && setPendingThemeId(theme.id)} 
                        className={`h-28 transition-shadow duration-300 ${pendingThemeId === theme.id ? 'shadow-[0_0_20px_rgba(37,99,235,0.8)] border-2 border-blue-500/50' : ''} ${theme.status === 'UNAVAILABLE' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] cursor-pointer'}`}
                    >
                        <div className="p-2 h-full flex flex-col justify-end relative overflow-hidden">
                            <div className="absolute inset-0 opacity-80 transition-filter duration-500" 
                                style={{ filter: isMobile ? theme.mobileFilter : theme.filter }}>
                                <MiniDashboardPreview color={theme.accentColor || '#ffffff'} isUnavailable={theme.status === 'UNAVAILABLE'} />
                            </div>

                            <div className="relative z-10 text-center">
                                <span className="text-[9px] font-bold tracking-widest uppercase text-white drop-shadow-md">
                                    {theme.name}
                                </span>
                                {theme.status === 'UNAVAILABLE' && (
                                    <span className="text-[8px] block font-mono text-red-400">
                                        [LOCKED]
                                    </span>
                                )}
                            </div>
                        </div>
                    </ShimmerCard>
                ))}
            </div>
        </div>
    );
};


// ====================================================================
// --- 3. GLOBAL SVG FILTERS ---
// ====================================================================

export const GlobalSvgFilters = () => (
    <>
        <style jsx global>{`
            .mac-gpu-accelerate { transform: translateZ(0); will-change: transform, opacity, filter; backface-visibility: hidden; }
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
            .mask-linear-fade { mask-image: linear-gradient(to right, transparent, white 5%, white 95%, transparent); }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(59, 130, 246, 0.3); border-radius: 2px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        `}</style>
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                <filter id="chrome-liquid">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="warp" />
                    <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" />
                </filter>
                <filter id="gold-shine">
                    <feSpecularLighting result="spec" specularConstant="1" specularExponent="20" lightingColor="#FFD700">
                        <fePointLight x="-5000" y="-10000" z="20000" />
                    </feSpecularLighting>
                    <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                </filter>
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


// 3. Data Engines
export type TickerData = {
  symbol: string;
  price: string;
  percentChange: string;
  prevPrice: string; 
};

export const useBinanceTickers = () => {
    const TARGET_PAIRS = useMemo(() => ['BTCUSDT', 'ETHUSDT'], []);
    const LOWER_CASE_PAIRS = useMemo(() => TARGET_PAIRS.map(p => p.toLowerCase()), [TARGET_PAIRS]);

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
        wsRef.current.onmessage = (event) => {
            const data: any = JSON.parse(event.data);
            if (isMounted) {
                setTickers(prev => {
                    const symbol: string = data.s;
                    const currentPrice = parseFloat(data.c || '0').toFixed(2);
                    
                    const newTickerData: TickerData = {
                        symbol: data.s,
                        price: currentPrice,
                        percentChange: parseFloat(data.P || '0').toFixed(2),
                        prevPrice: prev[symbol] ? prev[symbol].price : currentPrice
                    };

                    return {
                        ...prev,
                        [symbol]: newTickerData
                    };
                });
            }
        };
        wsRef.current.onclose = () => { if (isMounted) setStatus('DISCONNECTED'); };
        wsRef.current.onerror = () => { if (isMounted) setStatus('DISCONNECTED'); };

        return () => { 
            isMounted = false;
            if (wsRef.current) wsRef.current.close(); 
        };
    }, [LOWER_CASE_PAIRS]);

    if (Object.keys(tickers).length === 0 && status !== 'CONNECTED') {
         const mockTickers: Record<string, TickerData> = {
            'BTCUSDT': { symbol: 'BTCUSDT', price: '68000.50', percentChange: '1.25', prevPrice: '67900.20' },
            'ETHUSDT': { symbol: 'ETHUSDT', price: '3800.75', percentChange: '2.10', prevPrice: '3750.10' },
        };
         return {
            tickers: mockTickers,
            status: 'DISCONNECTED'
         };
    }

    return { tickers, status };
};

export const useBinanceChart = (symbol: string = 'BTCUSDT') => {
    const chartData = useMemo(() => {
        return Array(24).fill(0).map((_, i) => 65000 + i * 100 + Math.sin(i / 3) * 500 + Math.random() * 200);
    }, []);

    return chartData;
};


// 4. LIVE UI COMPONENTS
const LivePriceDisplay = ({ price, prevPrice, className = "" }: { price: string, prevPrice: string, className?: string }) => {
  const priceNum = parseFloat(price);
  const prevNum = parseFloat(prevPrice);
  const direction = priceNum > prevNum ? 'up' : priceNum < prevNum ? 'down' : 'neutral';
  
  return (
    <span key={price} className={`${className} transition-colors duration-300 ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white'}`}>
      ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

const LiveTickerTape = ({ tickers }: { tickers: Record<string, TickerData> }) => {
    const DISPLAY_PAIRS = ['BTCUSDT', 'ETHUSDT'];
    const displayList = DISPLAY_PAIRS.map(symbol => tickers[symbol]).filter(Boolean);
    const fallbackTicker: TickerData = { symbol: '---', price: '0.00', percentChange: '0.00', prevPrice: '0.00' };
    const listToDisplay = displayList.length > 0 ? displayList : DISPLAY_PAIRS.map(() => fallbackTicker);

    return (
        <div className="relative w-full h-10 shrink-0 z-40 bg-black border-b border-white/10">
            <div className="w-full h-full bg-neutral-950/80 backdrop-blur-sm flex items-center overflow-hidden">
                <motion.div 
                    className="flex whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                >
                    {[...listToDisplay, ...listToDisplay, ...listToDisplay, ...listToDisplay].map((t, i) => (
                        <div key={`${t.symbol}-${i}`} className="flex items-center gap-3 px-6 border-r border-white/10 h-10">
                            <span className="font-bold text-blue-500 text-[10px] md:text-xs">{t.symbol.replace('USDT', '')}</span>
                            <span className="text-white font-mono text-[10px] md:text-xs">{t.price === '---' ? t.price : `$${t.price}`}</span>
                            <span className={`text-[10px] ${parseFloat(t.percentChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {parseFloat(t.percentChange) > 0 ? '+' : ''}{t.percentChange}%
                            </span>
                        </div>
                    ))}
                    <div className="px-6 text-blue-500 font-mono text-[10px] animate-pulse">| SYSTEM_OPTIMAL |</div>
                </motion.div>
            </div>
        </div>
    );
};

// ============================================================================
// NEW COMPONENT: ThemeSettingsModal (The Requested Modal/Sidebar)
// ============================================================================

interface ThemeSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ReturnType<typeof useTerminalSettings>;
    isMobile: boolean;
}

/**
 * Renders the Theme and System Settings as a sidebar on desktop 
 * and a full-screen drawer on mobile.
 */
export const ThemeSettingsModal = ({ isOpen, onClose, settings, isMobile }: ThemeSettingsModalProps) => {
    const { 
        activeThemeId, 
        pendingThemeId, 
        activeSound, 
        isMuted, 
        setPendingThemeId, 
        setActiveSound, 
        setIsMuted, 
        handleApplyTheme,
        activeTheme
    } = settings;
    
    // Initialize category based on the current active theme
    const initialCategory = useMemo(() => activeTheme.category, [activeTheme]);
    const [activeCategory, setActiveCategory] = useState<ThemeCategory>(initialCategory);

    const handleSaveTheme = () => {
        if (handleApplyTheme()) {
            onClose(); 
        }
    }
    
    // Desktop Sidebar Configuration
    if (!isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    // Backdrop for blocking content interaction (optional for sidebar, but good for focus)
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/50 z-[59] cursor-pointer"
                        onClick={onClose}
                    >
                        {/* Sidebar Panel */}
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '400px' }} 
                            exit={{ width: 0 }} 
                            transition={{ duration: 0.3 }} 
                            // Stop event propagation so clicking inside doesn't close the sidebar
                            onClick={(e) => e.stopPropagation()}
                            className="fixed right-0 top-0 h-full bg-[#050505] border-l border-white/10 z-[60] pt-24 overflow-x-hidden shadow-2xl shadow-blue-900/50"
                        >
                            {/* Inner div manages scrolling */}
                            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                                    <h2 className="text-xl font-bold tracking-widest text-blue-500">INTERFACE CONFIGURATION</h2>
                                    <button onClick={onClose} className="p-1"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                                </div>
                                <div className="space-y-6">
                                    {/* Theme Selector Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className='flex items-center gap-2'>
                                                <Layers className="w-5 h-5 text-blue-500" />
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Theme Selector</h3>
                                            </div>
                                            <ShimmerButton 
                                                onClick={handleSaveTheme} 
                                                disabled={pendingThemeId === activeThemeId}
                                                className='!h-8 !w-24 text-xs !px-1 shrink-0'
                                            >
                                                {pendingThemeId === activeThemeId ? 'SAVED' : 'SAVE THEME'}
                                            </ShimmerButton>
                                        </div>
                                        <ThemeSelector 
                                            activeThemeId={activeThemeId} 
                                            setPendingThemeId={setPendingThemeId} 
                                            pendingThemeId={pendingThemeId}
                                            activeCategory={activeCategory} 
                                            setActiveCategory={setActiveCategory} 
                                            isMobile={isMobile} 
                                        />
                                    </div>
                                    
                                    {/* Audio Mixer Menu */}
                                    <div className='pt-4 border-t border-white/10 space-y-4'>
                                        <AudioControl isMuted={isMuted} setIsMuted={setIsMuted} />
                                        <SoundSelector active={activeSound} onSelect={setActiveSound} />
                                    </div>

                                    {/* System Info */}
                                    <div className='pt-4 border-t border-white/10'>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Info className="w-5 h-5 text-yellow-500" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">System Info</h3>
                                        </div>
                                        <div className="space-y-2 text-xs font-mono text-gray-400">
                                            <p><span>Terminal ID: </span><GlowText text="TXN-4927-ALPHA" className='text-white'/></p>
                                            <p><span>Uptime: </span><GlowText text="00:12:45" className='text-white'/></p>
                                            <p><span>Current Theme: </span><GlowText text={activeTheme.name.toUpperCase()} className='text-white'/></p>
                                        </div>
                                    </div>
                                    <div className="pb-10" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    // Mobile Drawer Configuration
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
                    {/* Drawer Panel */}
                    <motion.div 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }} 
                        transition={{ duration: 0.3 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-sm bg-[#050505] border-l border-white/10 z-[70] pt-20 shadow-2xl shadow-blue-900/50"
                    >
                        <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <h2 className="text-lg font-bold tracking-widest text-blue-500">SYSTEM CONFIG</h2>
                                <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                            </div>
                            <div className="space-y-8">
                                {/* Visual Interface (Theme Selector) */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layers className="w-4 h-4 text-blue-500" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Visual Interface</h3>
                                    </div>
                                    <ThemeSelector 
                                        activeThemeId={activeThemeId} 
                                        setPendingThemeId={setPendingThemeId} 
                                        pendingThemeId={pendingThemeId}
                                        activeCategory={activeCategory} 
                                        setActiveCategory={setActiveCategory} 
                                        isMobile={isMobile} 
                                    />
                                    <div className='mt-6'>
                                        <ShimmerButton 
                                            onClick={handleSaveTheme} 
                                            disabled={pendingThemeId === activeThemeId}
                                            className='!h-10 text-xs'
                                        >
                                            {pendingThemeId === activeThemeId ? 'ACTIVE THEME SAVED' : 'APPLY & SAVE THEME'}
                                        </ShimmerButton>
                                    </div>
                                </div>
                                {/* Audio Mixer Menu */}
                                <div className='pt-4 border-t border-white/10 space-y-4'>
                                    <AudioControl isMuted={isMuted} setIsMuted={setIsMuted} />
                                    <SoundSelector active={activeSound} onSelect={setActiveSound} />
                                </div>
                            </div>
                            <div className="pb-10" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ============================================================================
// 5. MAIN PAGE COMPONENT (Updated)
// ============================================================================

export default function Page() {
    // --- HOOKS ---
    const { tickers, status: wsStatus } = useBinanceTickers();
    const chartData = useBinanceChart('BTCUSDT'); 
    
    // --- SETTINGS HOOK ---
    const settings = useTerminalSettings();
    const { activeTheme, activeThemeId, isMuted, setIsMuted } = settings;

    // --- LOCAL UI STATE ---
    const [showWelcome, setShowWelcome] = useState(true);
    // State to control the visibility of the new modal/sidebar
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
    const [isMobile, setIsMobile] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- DERIVED DATA ---
    const getTicker = useCallback((s: string): TickerData => {
        return tickers[s] || { symbol: s, price: '0.00', percentChange: '0.00', prevPrice: '0.00' };
    }, [tickers]);

    const btcData = getTicker('BTCUSDT');
    const ethData = getTicker('ETHUSDT');

    const portfolioValue = useMemo(() => {
        const btcPrice = parseFloat(btcData.price) || 0;
        const ethPrice = parseFloat(ethData.price) || 0;
        // Mock calculation: 0.45 BTC + 12.5 ETH + $15,240 Fiat
        const total = (btcPrice * 0.45) + (ethPrice * 12.5) + 15240; 
        return total;
    }, [btcData.price, ethData.price]);

    const prevPortfolioValue = useRef(portfolioValue);
    useEffect(() => { prevPortfolioValue.current = portfolioValue; }, [portfolioValue]);

    // --- EFFECTS (Mobile, Audio, Resize) ---
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Body Scroll Lock Implementation
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.height = '100vh'; 
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.height = 'unset'; 
            document.documentElement.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.height = 'unset'; 
            document.documentElement.style.overflow = 'unset';
        };
    }, [isSettingsOpen]);


    useEffect(() => {
        const soundSrc = settings.activeSound === 'SILENT' ? '' : '/assets/ambient-drone.mp3';

        if(audioRef.current) {
            if (audioRef.current.src !== soundSrc) {
                audioRef.current.src = soundSrc;
            }
            audioRef.current.volume = 0.15;
            
            if (!isMuted && soundSrc) {
                audioRef.current.play().catch(() => {});
            } else {
                audioRef.current.pause();
            }
        }
    }, [isMuted, settings.activeSound]); 

    // Chart logic remains the same
    const normalizedChartBars = useMemo(() => {
        if (chartData.length === 0) return Array(24).fill(50);
        const min = Math.min(...chartData);
        const max = Math.max(...chartData);
        const range = max - min === 0 ? max * 0.1 : max - min; 
        return chartData.map(val => ((val - min) / range) * 80 + 10); 
    }, [chartData]);
    
    const chartDirection = useMemo(() => {
        if (chartData.length < 2) return 'neutral';
        const startPrice = chartData[0];
        const endPrice = chartData[chartData.length - 1];
        return endPrice > startPrice ? 'up' : endPrice < startPrice ? 'down' : 'neutral';
    }, [chartData]);
    
    const chartBarColor = chartDirection === 'up' ? 'bg-green-600/50 hover:bg-green-400' : chartDirection === 'down' ? 'bg-red-600/50 hover:bg-red-400' : 'bg-blue-600/50 hover:bg-blue-400';
    const chartGlowColor = chartDirection === 'up' ? 'shadow-[0_0_10px_rgba(16,185,129,0.8)]' : chartDirection === 'down' ? 'shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_10px_rgba(59,130,246,0.8)]';

    return (
        <main 
            className="relative min-h-screen bg-black font-sans selection:bg-blue-500/30 text-white"
            style={{ 
                filter: isMobile ? activeTheme.mobileFilter : activeTheme.filter,
                transition: 'filter 0.5s ease-in-out'
            }}
        >
            <GlobalSvgFilters />
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay">
                <IllusionLayer type={activeTheme.illusion} /> 
            </div>
            {/* Audio source is managed dynamically in the useEffect */}
            <audio ref={audioRef} loop />

            {/* --- HEADER (Navigation Bar) --- */}
            <header className="fixed top-0 w-full z-50">
                <LiveTickerTape tickers={tickers} />
                <div className="relative h-16 bg-black/60 backdrop-blur-md flex items-center px-4 md:px-8 justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-500 font-bold tracking-[0.2em] text-sm text-shadow-glow">
                            SYNTHESIS_OS
                        </span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            {wsStatus === 'CONNECTED' ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500 animate-pulse" />}
                            <span className={`text-[10px] font-mono ${wsStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
                                {wsStatus === 'CONNECTED' ? 'UPLINK_ESTABLISHED' : 'SEARCHING...'}
                            </span>
                        </div>
                        
                        <GlowText text={`THEME: ${activeTheme.name.toUpperCase()}`} className="hidden lg:block text-[10px] text-gray-500" />
                        
                        {/* THEME BUTTON/MODAL TRIGGER */}
                        <button 
                            onClick={() => setIsSettingsOpen(true)} 
                            className="p-2 text-white/80 hover:text-white active:scale-95 transition-transform"
                        >
                            {isMobile 
                                ? isSettingsOpen ? <X className="w-6 h-6 text-blue-500" /> : <Menu /> 
                                : <Settings className={`w-6 h-6 ${isSettingsOpen ? 'text-blue-500' : 'text-gray-400'}`} />
                            }
                        </button>
                    </div>
                </div>
            </header>

            {/* --- THEME SETTINGS MODAL / SIDEBAR (The requested component) --- */}
            <ThemeSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                settings={settings}
                isMobile={isMobile}
            />

            {/* --- Welcome Back Modal --- */}
            {/* Note: Auto-unmute upon continuing from Welcome Modal */}
            <WelcomeBackModal isOpen={showWelcome} onContinue={() => { setShowWelcome(false); setIsMuted(false); }} onSkip={() => setShowWelcome(false)} />

            {/* --- MAIN CONTENT AREA --- */}
            <motion.div 
                initial="hidden" 
                animate="show" 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } }} 
                className={`pt-32 px-4 md:px-8 pb-24 mx-auto z-10 relative transition-all duration-300 ${isSettingsOpen && !isMobile ? 'max-w-[calc(100vw-400px-64px)]' : 'max-w-7xl'}`} 
                style={{ filter: showWelcome ? 'blur(10px)' : 'none', transition: 'filter 0.5s' }}
            >
                
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-600">COMMAND</h1>
                        <div className="flex items-center gap-3">
                            <div className="h-[2px] w-12 bg-blue-500" />
                            <p className="text-xs md:text-sm font-mono text-blue-400">NET_WORTH_OPTIMIZED</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* STAT CARD 1: LIVE PORTFOLIO */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                        <ShimmerCard className="h-48 group hover:-translate-y-1 transition-transform duration-500">
                            <div className="p-6 flex flex-col justify-between h-full relative z-20">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
                                    <GlowText text="+4.2%" className="text-green-400 text-xs font-bold" /> 
                                </div>
                                <div>
                                    <span className="text-gray-500 text-[10px] tracking-widest uppercase">Total Net Worth (Live)</span>
                                    <div className="text-3xl md:text-4xl font-bold block mt-1 font-mono tracking-tight">
                                        <LivePriceDisplay 
                                            price={portfolioValue.toString()} 
                                            prevPrice={prevPortfolioValue.current.toString()} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </ShimmerCard>
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                        <ShimmerCard className="h-48 group hover:-translate-y-1 transition-transform duration-500">
                            {/* BTC Card Content */}
                            <div className="p-6 flex flex-col justify-between h-full relative z-20">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded bg-[#F7931A]/20 border border-[#F7931A]/30"><DollarSign className="w-5 h-5 text-[#F7931A]" /></div>
                                        <span className="font-bold text-sm tracking-widest">BTC / USDT</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${parseFloat(btcData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{btcData.percentChange}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-[10px] tracking-widest uppercase">Live Price</span>
                                    <div className="text-3xl md:text-4xl font-bold mt-1 font-mono tracking-tight">
                                        <LivePriceDisplay price={btcData.price} prevPrice={btcData.prevPrice} />
                                    </div>
                                </div>
                            </div>
                        </ShimmerCard>
                    </motion.div>
                    
                    {/* ACTION PANEL (Contains Go To Website button) */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="md:row-span-2">
                           <ShimmerCard className="h-full min-h-[300px]">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                                        <Zap className="w-4 h-4 text-yellow-400" /> <span className="font-bold text-sm tracking-wider">QUICK ACTIONS</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3 justify-center">
                                        <ShimmerButton icon={DollarSign} onClick={() => {}}>INITIATE TRADE</ShimmerButton>
                                        <ShimmerButton icon={Database} onClick={() => {}}>FETCH MARKET DATA</ShimmerButton>
                                        <ShimmerButton icon={RefreshCw} onClick={() => {}}>RECALCULATE ALPHA</ShimmerButton>
                                        <ShimmerButton icon={Globe} onClick={() => window.open('https://www.google.com', '_blank')}>GO TO WEBSITE</ShimmerButton>
                                        <ShimmerButton icon={Lock} onClick={() => {}}>FREEZE ACCOUNT</ShimmerButton>
                                    </div>
                                </div>
                            </ShimmerCard>
                    </motion.div>

                    {/* WIDE CHART AREA */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="md:col-span-2">
                        <ShimmerCard className="h-64">
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-mono text-gray-500">MARKET_HISTORY // BTC_USD (Last 24H)</span>
                                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-400">1H INTERVAL</span>
                                </div>
                                <div className="flex-1 flex items-end justify-between gap-1 px-2 border-b border-l border-white/10 relative overflow-hidden">
                                    {normalizedChartBars.map((h, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.02, duration: 0.8 }}
                                            className={`w-full transition-colors relative group ${chartBarColor}`}
                                        >
                                            <div className={`absolute top-0 w-full h-1 bg-current ${chartGlowColor}`} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </ShimmerCard>
                    </motion.div>
                    
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                        <ShimmerCard className="h-48 group hover:-translate-y-1 transition-transform duration-500">
                            {/* ETH Card Content */}
                            <div className="p-6 flex flex-col justify-between h-full relative z-20">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded bg-[#627EEA]/20 border border-[#627EEA]/30"><Globe className="w-5 h-5 text-[#627EEA]" /></div>
                                        <span className="font-bold text-sm tracking-widest">ETH / USDT</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${parseFloat(ethData.percentChange) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{ethData.percentChange}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-[10px] tracking-widest uppercase">Live Price</span>
                                    <div className="text-3xl md:text-4xl font-bold mt-1 font-mono tracking-tight">
                                        <LivePriceDisplay price={ethData.price} prevPrice={ethData.prevPrice} />
                                    </div>
                                </div>
                            </div>
                        </ShimmerCard>
                    </motion.div>

                </div>
            </motion.div>

            <SupportWidget />
        </main>
    );
}