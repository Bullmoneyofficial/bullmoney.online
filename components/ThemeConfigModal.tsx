"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
// Import the necessary types: YouTubeProps for options and YouTubeEvent for event handlers
import YouTube, { YouTubeEvent } from 'react-youtube'; 

// Imports
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ALL_THEMES, ThemeCategory, SoundProfile } from '@/constants/theme-data';
import { THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents'; 

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

    const handleApply = () => {
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
                    {/* This player is active only while modal is open to preview tracks */}
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
                            onReady={(e: YouTubeEvent) => { // FIX: Explicitly type 'e' as YouTubeEvent
                                // Lower volume for preview so it doesn't blast the user
                                e.target.setVolume(tempMuted ? 0 : 20); 
                            }}
                        />
                    </div>

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        // Added min-h-0 to ensure flex child scrolling works correctly
                        className="w-full h-full lg:max-w-7xl lg:max-h-[90vh] bg-[#050505] lg:rounded-xl overflow-hidden border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex flex-col min-h-0"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            // Apply theme filter to the whole modal content for live preview
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
                                onHover={setHoveredThemeId} // Using the fixed setter here
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};