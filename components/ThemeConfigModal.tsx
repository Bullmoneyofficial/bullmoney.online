"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Added useRef and useCallback
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import YouTube, { YouTubeEvent } from 'react-youtube'; 

// Imports
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ALL_THEMES, ThemeCategory, SoundProfile } from '@/constants/theme-data';
import { THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents'; 

const PREVIEW_VOLUME = 20; // Volume level for theme preview

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
    // State is managed locally while the modal is open
    const [tempThemeId, setTempThemeId] = useState(initialThemeId);
    const [tempCategory, setTempCategory] = useState(initialCategory);
    const [tempSound, setTempSound] = useState(initialSound);
    const [tempMuted, setTempMuted] = useState(initialMuted);
    
    // Hover state for "Preview on Hover" logic
    const [hoveredThemeId, setHoveredThemeId] = useState<string | null>(null);

    // REF: Reference for the hidden YouTube player instance
    const youtubePlayerRef = useRef<any>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTempThemeId(initialThemeId);
            setTempCategory(initialCategory);
            setTempSound(initialSound);
            setTempMuted(initialMuted);
            setHoveredThemeId(null);
        }
    }, [isOpen, initialThemeId, initialCategory, initialSound, initialMuted]);

// --- EFFECT TO CONTROL HIDDEN PLAYER VOLUME/PLAYBACK ---
    useEffect(() => {
        const player = youtubePlayerRef.current;
        
        // Ensure player exists and has methods before calling them
        if (player && typeof player.setVolume === 'function') {
            
            if (tempMuted) {
                player.setVolume(0);
                if (typeof player.pauseVideo === 'function') {
                    player.pauseVideo();
                }
            } else {
                player.setVolume(PREVIEW_VOLUME);
                
                // Attempt to play only if the modal is open
                if (isOpen && typeof player.playVideo === 'function') {
                     // FIX: playVideo() returns void (undefined), so we removed .catch()
                     player.playVideo();
                }
            }
        }
        // Dependencies: tempMuted (user toggles mute inside the modal), 
        // tempThemeId (changes video source), isOpen (ensures we only play when visible)
    }, [tempMuted, tempThemeId, isOpen]);

    const handleApply = () => {
        // Ensure the main player is updated with the final theme/mute status
        onSave(tempThemeId, tempSound, tempMuted);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // Use ALL_THEMES for current filter
    const currentTheme = useMemo(() => ALL_THEMES.find(t => t.id === tempThemeId) || ALL_THEMES[0], [tempThemeId]);

    // DETERMINE ACTIVE VIDEO ID
    // Priority: Hovered Theme -> Selected Theme -> Default
    const activeVideoId = useMemo(() => {
        const targetId = hoveredThemeId || tempThemeId;
        return THEME_SOUNDTRACKS[targetId] || THEME_SOUNDTRACKS['default'];
    }, [hoveredThemeId, tempThemeId]);

    // Pass the player reference to the handler that gets the player instance
    const handlePlayerReady = useCallback((e: YouTubeEvent) => {
        youtubePlayerRef.current = e.target;
        // Initial volume set here, but primarily managed by the useEffect above
        e.target.setVolume(tempMuted ? 0 : PREVIEW_VOLUME);
    }, [tempMuted]);


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md font-sans overflow-hidden flex justify-center items-center"
                    onClick={handleCancel}
                >
                    {/* HIDDEN PREVIEW PLAYER */}
                    <div className="hidden pointer-events-none opacity-0">
                        <YouTube 
                            videoId={activeVideoId}
                            opts={{
                                height: '0',
                                width: '0',
                                playerVars: {
                                    autoplay: 1,
                                    controls: 0,
                                    loop: 1,
                                    modestbranding: 1,
                                },
                            }}
                            onReady={handlePlayerReady} // Use the ref handler
                            onStateChange={(e: YouTubeEvent) => {
                                // Ensure it loops if playlist ends
                                if (e.data === 0) e.target.playVideo();
                            }}
                        />
                    </div>

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full h-full lg:max-w-7xl lg:max-h-[90vh] bg-[#050505] lg:rounded-xl overflow-hidden border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex flex-col min-h-0"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            filter: isMobile ? currentTheme.mobileFilter : currentTheme.filter, 
                            transition: 'filter 0.5s ease-in-out'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="shrink-0 p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/70 z-20">
                            <h2 className="text-lg md:text-xl font-bold tracking-widest text-shimmer-effect uppercase flex items-center gap-3">
                                <Settings className="w-5 h-5 text-blue-500" /> 
                                SYNTHESIS_OS CONFIGURATION
                            </h2>
                            <button onClick={handleCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Main scrolling container */}
                        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0"> 
                            <ThemeSelector 
                                activeThemeId={tempThemeId} setActiveThemeId={setTempThemeId}
                                activeCategory={tempCategory} setActiveCategory={setTempCategory}
                                isMobile={isMobile} currentSound={tempSound} setCurrentSound={setTempSound}
                                isMuted={tempMuted} setIsMuted={setTempMuted}
                                onSave={handleApply} 
                                onExit={handleCancel}
                                onHover={setHoveredThemeId} 
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};