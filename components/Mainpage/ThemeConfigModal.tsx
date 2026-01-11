"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube'; 

// Imports
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ALL_THEMES, ThemeCategory, SoundProfile } from '@/constants/theme-data';

// Higher volume for preview to ensure it's heard over any ambient noise
const PREVIEW_VOLUME = 40; 

export const ThemeConfigModal = ({ 
    isOpen, onClose, onSave, initialThemeId, 
    initialCategory, initialSound, initialMuted,
    isMobile,
}: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (themeId: string, sound: SoundProfile, muted: boolean) => void,
    initialThemeId: string,
    initialCategory: ThemeCategory,
    initialSound: SoundProfile,
    initialMuted: boolean,
    isMobile: boolean
}) => {
    const [tempThemeId, setTempThemeId] = useState(initialThemeId);
    const [tempCategory, setTempCategory] = useState(initialCategory);
    const [tempSound, setTempSound] = useState(initialSound);
    const [tempMuted, setTempMuted] = useState(initialMuted);
    
    const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);
    const youtubePlayerRef = useRef<any>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTempThemeId(initialThemeId);
            setTempCategory(initialCategory);
            setTempSound(initialSound);
            setTempMuted(initialMuted);
            setHoveredThemeId(null);
        } else {
            // 🛑 CRITICAL FIX: Safe check before calling stopVideo
            const player = youtubePlayerRef.current;
            if (player && typeof player.stopVideo === 'function') {
                try {
                    player.stopVideo();
                } catch (e) {
                    console.warn("Could not stop video:", e);
                }
            }
        }
    }, [isOpen, initialThemeId, initialCategory, initialSound, initialMuted]);

    const activeVideoId = useMemo(() => {
        const targetId = hoveredThemeId || tempThemeId;
        const theme = ALL_THEMES.find(t => t.id === targetId);
        return theme?.youtubeId || 'jfKfPfyJRdk';
    }, [hoveredThemeId, tempThemeId]);

    const currentTheme = useMemo(() => ALL_THEMES.find(t => t.id === tempThemeId) || ALL_THEMES[0], [tempThemeId]);

    // --- PLAYER CONTROL EFFECT ---
    useEffect(() => {
        const player = youtubePlayerRef.current;
        
        // Defensive check: Ensure player exists and has methods
        if (!player || typeof player.setVolume !== 'function') return;

        try {
            if (tempMuted || !isOpen) {
                player.setVolume(0);
                if (typeof player.pauseVideo === 'function') player.pauseVideo();
            } else {
                player.setVolume(PREVIEW_VOLUME);
                if (typeof player.playVideo === 'function') {
                     player.playVideo();
                }
            }
        } catch (error) {
            console.warn("YouTube Preview Player error:", error);
        }
    }, [tempMuted, activeVideoId, isOpen]);

    const handleApply = () => {
        onSave(tempThemeId, tempSound, tempMuted);
        onClose();
    };

    const handlePlayerReady = useCallback((e: YouTubeEvent) => {
        youtubePlayerRef.current = e.target;
        
        // Defensive check inside ready handler
        if (e.target && typeof e.target.setVolume === 'function') {
            e.target.setVolume(tempMuted ? 0 : PREVIEW_VOLUME);
            if (!tempMuted && isOpen && typeof e.target.playVideo === 'function') {
                e.target.playVideo();
            }
        }
    }, [tempMuted, isOpen]);

    const playerOpts: YouTubeProps['opts'] = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            controls: 0,
            loop: 1,
            playlist: activeVideoId, 
            modestbranding: 1,
            playsinline: 1,
        },
    };

    // SSR guard for portal
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Don't render on server or before mount
    if (!mounted || typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md font-sans overflow-hidden flex justify-center items-center"
                    onClick={onClose}
                >
                    {/* HIDDEN PREVIEW PLAYER */}
                    <div className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none overflow-hidden">
                        <YouTube 
                            videoId={activeVideoId}
                            opts={playerOpts}
                            onReady={handlePlayerReady} 
                            onStateChange={(e: YouTubeEvent) => {
                                if (e.data === 0 && e.target?.playVideo) e.target.playVideo();
                            }}
                        />
                    </div>

                    <motion.div 
                        initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full h-full lg:max-w-7xl lg:max-h-[90vh] bg-[#050505] lg:rounded-xl overflow-hidden border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex flex-col min-h-0"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            filter: isMobile ? currentTheme?.mobileFilter : currentTheme?.filter,
                            transition: 'filter 0.5s ease-in-out'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="shrink-0 p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/70 z-20">
                            <h2 className="text-lg md:text-xl font-bold tracking-widest text-shimmer-effect uppercase flex items-center gap-3">
                                <Settings className="w-5 h-5 text-blue-500" /> 
                                SYNTHESIS_OS CONFIGURATION
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0"> 
                            <ThemeSelector 
                                activeThemeId={tempThemeId} setActiveThemeId={setTempThemeId}
                                activeCategory={tempCategory} setActiveCategory={setTempCategory}
                                isMobile={isMobile} currentSound={tempSound} setCurrentSound={setTempSound}
                                isMuted={tempMuted} setIsMuted={setTempMuted}
                                onSave={handleApply} 
                                onExit={onClose}
                                onHover={setHoveredThemeId} 
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};