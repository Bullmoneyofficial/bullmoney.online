"use client";
import React, { useMemo } from 'react';
import { 
  Zap, DollarSign, Activity, Shield, Lock, Monitor, Hash, 
  MapPin, Sun, Brain, Smile, Layers, Volume2, VolumeX, Command, Check, X, Music
} from 'lucide-react';

// --- IMPORTS ---
import { ALL_THEMES, ThemeCategory, SoundProfile } from '@/constants/theme-data';
import { THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents'; 
import { ShimmerButton, GlowText } from '@/components/ThemeUI';
import { LiveMiniPreview } from '@/components/Mainpage/LiveMiniPreview';

// --- COMPONENTS ---

const SoundSelector = ({ active, onSelect }: { active: SoundProfile, onSelect: (id: SoundProfile) => void }) => {
    const packs: {id: SoundProfile, label: string, icon: any}[] = [
        { id: 'MECHANICAL', label: 'MECH', icon: Command },
        { id: 'SOROS', label: 'SOROS', icon: DollarSign },
        { id: 'SCI-FI', label: 'SCI-FI', icon: Zap },
        { id: 'SILENT', label: 'MUTE', icon: VolumeX },
    ];
    return (
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full shrink-0"> 
            {packs.map((pack) => (
                <button 
                    key={pack.id} 
                    onClick={() => onSelect(pack.id)} 
                    className={`h-10 text-[10px] md:text-[10px] font-bold tracking-wider uppercase rounded-lg border transition-all flex items-center justify-center gap-1
                        ${pack.id === active ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-white/10 text-gray-400 hover:border-blue-500/50'}
                    `}
                >
                   <pack.icon className="w-3 h-3" /> <span className="truncate px-1">{pack.label}</span>
                </button>
            ))}
        </div>
    );
};

// Mini Equalizer Animation for Active Card
const AudioVisualizer = () => (
    <div className="flex gap-0.5 items-end h-3 ml-2">
        <style jsx>{`
            @keyframes pulse {
                0%, 100% { height: 100%; }
                50% { height: 20%; }
            }
        `}</style>
        <span className="w-0.5 h-full bg-blue-400 animate-[pulse_0.6s_ease-in-out_infinite]"/>
        <span className="w-0.5 h-2/3 bg-blue-400 animate-[pulse_0.8s_ease-in-out_infinite] delay-100"/>
        <span className="w-0.5 h-3/4 bg-blue-400 animate-[pulse_0.5s_ease-in-out_infinite] delay-200"/>
        <span className="w-0.5 h-1/2 bg-blue-400 animate-[pulse_0.7s_ease-in-out_infinite] delay-300"/>
    </div>
);

export const ThemeSelector = ({ 
    activeThemeId, setActiveThemeId, activeCategory, setActiveCategory, 
    isMobile, currentSound, setCurrentSound, isMuted, setIsMuted,
    onSave, onExit, onHover // <-- ADDED onHover PROP
}: { 
    activeThemeId: string, setActiveThemeId: (id: string) => void,
    activeCategory: ThemeCategory, setActiveCategory: (cat: ThemeCategory) => void,
    isMobile: boolean,
    currentSound: SoundProfile, setCurrentSound: (s: SoundProfile) => void,
    isMuted: boolean, setIsMuted: (m: boolean) => void,
    onSave: (themeId: string) => void,
    onExit: () => void,
    onHover: (id: string | null) => void // <-- ADDED onHover DEFINITION
}) => {
    const filteredThemes = useMemo(() => ALL_THEMES.filter((t) => t.category === activeCategory), [activeCategory]);
    const allCategories = useMemo(() => Array.from(new Set(ALL_THEMES.map(t => t.category))), []);
    const preferredOrder: ThemeCategory[] = ['SPECIAL', 'CRYPTO', 'SENTIMENT', 'ASSETS', 'CONCEPTS', 'LOCATION', 'ELEMENTAL', 'OPTICS', 'GLITCH', 'EXOTIC', 'MEME', 'HISTORICAL'];
    const sortedCategories = preferredOrder.filter(cat => allCategories.includes(cat));
    const currentTheme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];

    const getCategoryIcon = (cat: ThemeCategory) => {
        if (cat === 'SPECIAL') return <Zap className="w-3 h-3 text-yellow-500" />;
        if (cat === 'CRYPTO') return <DollarSign className="w-3 h-3" />;
        if (cat === 'SENTIMENT') return <Activity className="w-3 h-3" />;
        if (cat === 'ASSETS') return <Shield className="w-3 h-3" />;
        if (cat === 'HISTORICAL') return <Lock className="w-3 h-3" />;
        if (cat === 'OPTICS') return <Monitor className="w-3 h-3" />;
        if (cat === 'EXOTIC') return <Hash className="w-3 h-3" />;
        if (cat === 'LOCATION') return <MapPin className="w-3 h-3" />;
        if (cat === 'ELEMENTAL') return <Sun className="w-3 h-3" />;
        if (cat === 'CONCEPTS') return <Brain className="w-3 h-3" />;
        if (cat === 'MEME') return <Smile className="w-3 h-3" />;
        return <Layers className="w-3 h-3" />;
    };

    return (
        // FIXED: Ensured the outer container is flex-col h-full (inherited from parent modal)
        <div className="flex flex-col lg:flex-row w-full h-full border border-white/10 rounded-lg bg-black/40 overflow-hidden"> 
            
            {/* LEFT RAIL (Desktop) / TOP SCROLL (Mobile) - CATEGORY SELECTION */}
            <div className="
                w-full lg:w-48 bg-[#000000]/80 
                border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 
                flex flex-row lg:flex-col 
                overflow-x-auto lg:overflow-y-auto 
                touch-scroll custom-scrollbar no-scrollbar
            ">
                <div className="flex flex-row lg:flex-col p-2 gap-2 lg:gap-1 min-w-max lg:min-w-0">
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
            {/* flex-1 overflow-hidden ensures inner div handles scrolling correctly */}
            <div className="flex-1 flex flex-col h-full overflow-hidden"> 
                
                {/* Scrollable Area */}
                <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar touch-scroll">
                      
                     {/* 1. AUDIO PROFILE SECTION */}
                    <div className="shrink-0">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Volume2 className="w-3 h-3 text-blue-500"/> SYSTEM_AUDIO_PROFILE
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
                    <div className="flex-1 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                            <Monitor className="w-3 h-3 text-blue-500"/> 
                            VISUAL_INTERFACE: <GlowText text={currentTheme.name.toUpperCase()} className="text-blue-300 ml-1"/>
                            {/* Show current track info based on selection */}
                            <span className="ml-auto flex items-center gap-2 text-[9px] text-gray-500 normal-case tracking-normal">
                                <Music className="w-3 h-3" />
                                {THEME_SOUNDTRACKS[activeThemeId] ? "Background Music Active" : "Default Ambience"}
                            </span>
                        </h3>
                        
                        {/* Grid adapts to screen size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredThemes.map((theme) => {
                                const isUnavailable = theme.status === 'UNAVAILABLE';
                                const isActive = activeThemeId === theme.id;
                                
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => !isUnavailable && setActiveThemeId(theme.id)}
                                        onMouseEnter={() => !isUnavailable && onHover(theme.id)} // <-- FIX: Enable Preview on Hover
                                        onMouseLeave={() => !isUnavailable && onHover(null)}      // <-- FIX: Clear Preview on Leave
                                        disabled={isUnavailable}
                                        className={`
                                            relative group text-left rounded-xl overflow-hidden border transition-all duration-300 w-full aspect-video shrink-0
                                            ${isUnavailable ? 'opacity-40 cursor-not-allowed border-white/5 grayscale'
                                            : isActive 
                                                ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.15)] bg-blue-950/10' 
                                                : 'border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(37,99,235,0.1)] bg-black'}
                                        `}
                                    >
                                        {isUnavailable && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
                                                <Lock className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        
                                        {/* Preview - Scale Effect on Active */}
                                        <div className="w-full h-full relative overflow-hidden bg-gray-950">
                                            <div 
                                                className={`w-full h-full absolute inset-0 transition-all duration-700 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                                                style={{ filter: isMobile ? theme.mobileFilter : theme.filter }}
                                            >
                                                <LiveMiniPreview color={theme.accentColor || '#3b82f6'} isUnavailable={isUnavailable} />
                                            </div>
                                            
                                            {/* Active Overlay Effect */}
                                            {isActive && <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />}
                                        </div>
                                        
                                        {/* Label & Indicators */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/95 to-transparent flex items-end justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white text-glow' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                        {theme.name}
                                                    </span>
                                                    {/* Playing Indicator */}
                                                    {isActive && !isMuted && <AudioVisualizer />}
                                                </div>
                                                <span className="text-[8px] text-gray-600 font-mono line-clamp-1">{theme.description}</span>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            {isActive ? (
                                                <div className="bg-blue-500 rounded-full p-0.5 shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                                    <Check className="w-2 h-2 text-black" />
                                                </div>
                                            ) : !isUnavailable && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white/10 rounded-full p-1 backdrop-blur-md border border-white/20">
                                                        <Volume2 className="w-2 h-2 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* Modal Footer/Save Bar */}
                {/* FIXED: This footer is now correctly positioned below the scrollable area */}
                <div className="shrink-0 p-4 md:p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                        <ShimmerButton icon={Check} onClick={() => onSave(activeThemeId)} className="h-10 text-xs text-green-500">
                            APPLY & SAVE CONFIG
                        </ShimmerButton>
                        <ShimmerButton icon={X} onClick={onExit} className="h-10 text-xs text-red-500/80">
                            EXIT
                        </ShimmerButton>
                    </div>
                </div>
            </div>
        </div>
    );
};