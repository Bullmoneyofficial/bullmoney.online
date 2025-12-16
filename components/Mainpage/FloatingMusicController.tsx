"use client";

import React, { memo } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingMusicControllerProps {
    isPlaying: boolean;
    onToggle: () => void;
    sfx: { click: () => void; hover: () => void; }; // Typing for the sfx object
    openThemeSelector: () => void;
}

export const FloatingMusicController = memo(({ isPlaying, onToggle, sfx, openThemeSelector }: FloatingMusicControllerProps) => (
    <div className="fixed bottom-6 left-6 z-[50] flex items-center gap-3">
        {/* Mute/Unmute Button */}
        <motion.button 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            onClick={() => { sfx.click(); onToggle(); }}
            onMouseEnter={sfx.hover}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl hover:bg-white/20 transition-colors"
        >
            {isPlaying ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-neutral-400" />}
        </motion.button>

        {/* Theme Settings Button */}
        <motion.button 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            onClick={openThemeSelector}
            onMouseEnter={sfx.hover}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl hover:bg-white/20 transition-colors group"
        >
            <Settings className="w-5 h-5 text-white group-hover:rotate-45 transition-transform" />
        </motion.button>
    </div>
));

FloatingMusicController.displayName = 'FloatingMusicController';