// src/components/themes/ThemeConfigModal.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { ThemeSelector } from '@/components/Mainpage/ThemeSelector';
import { ALL_THEMES, ThemeCategory, SoundProfile } from '@/constants/theme-data';

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
    
    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setTempThemeId(initialThemeId);
            setTempCategory(initialCategory);
            setTempSound(initialSound);
            setTempMuted(initialMuted);
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

    return (
        <AnimatePresence>
            {isOpen && (
                // Modal Backdrop - High Z-index. Use overflow-y-auto here for the full viewport scroll if needed.
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md font-sans overflow-hidden flex justify-center items-center"
                    onClick={handleCancel}
                >
                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: isMobile ? 1 : 0.95, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        // Full height on mobile, bounded on desktop
                        className="w-full h-full lg:max-w-7xl lg:max-h-[90vh] bg-[#050505] lg:rounded-xl overflow-hidden border border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            // Apply theme filter to the whole modal content for live preview
                            filter: isMobile ? currentTheme.mobileFilter : currentTheme.filter, 
                            transition: 'filter 0.5s ease-in-out'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="shrink-0 p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/70">
                            <h2 className="text-lg md:text-xl font-bold tracking-widest text-shimmer-effect uppercase flex items-center gap-3">
                                <Settings className="w-5 h-5 text-blue-500" /> 
                                SYNTHESIS_OS CONFIGURATION
                            </h2>
                            <button onClick={handleCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Main scrolling container */}
                        <div className="flex-1 overflow-hidden relative"> 
                            <ThemeSelector 
                                activeThemeId={tempThemeId} setActiveThemeId={setTempThemeId}
                                activeCategory={tempCategory} setActiveCategory={setTempCategory}
                                isMobile={isMobile} currentSound={tempSound} setCurrentSound={setTempSound}
                                isMuted={tempMuted} setIsMuted={setTempMuted}
                                onSave={handleApply} 
                                onExit={handleCancel}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};