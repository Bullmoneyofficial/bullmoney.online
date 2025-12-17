"use client";

import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Palette, Sparkles } from 'lucide-react';

interface BottomControlsProps {
    isPlaying: boolean;
    onToggleMusic: () => void;
    onOpenTheme: () => void;
    themeName: string;
    volume: number;
    onVolumeChange: (val: number) => void;
    visible: boolean;
}

export const BottomControls = ({ 
    isPlaying, 
    onToggleMusic, 
    onOpenTheme,
    themeName, 
    volume, 
    onVolumeChange,
    visible
}: BottomControlsProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showHelper, setShowHelper] = useState(true);

    // Hide helper after 8 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowHelper(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div 
            // FIX: 'fixed' ensures it stays on screen while scrolling
            // 'z-[9998]' ensures it sits on top of other content
            className="fixed bottom-8 left-8 z-[9998] flex flex-col items-start gap-4 transition-all duration-700 ease-in-out animate-bounce-subtle"
            style={{ 
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)' 
            }}
            onMouseEnter={() => {
                setIsHovered(true);
                setShowHelper(false);
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* HELPER TOOLTIP */}
            {showHelper && (
                <div className="absolute -top-12 left-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl animate-pulse flex items-center gap-2 whitespace-nowrap border border-white/20">
                    <Sparkles size={12} />
                    Customize your vibe here!
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-blue-600 rotate-45" />
                </div>
            )}

            {/* MUSIC BEAM ANIMATION */}
            {isPlaying && (
                <div className="fixed inset-0 pointer-events-none z-[-1]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-blue-400 rounded-full animate-ping-to-bottom" />
                </div>
            )}

            {/* Control Bar Container */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-white/20 transition-colors">
                
                {/* THEME WIDGET BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenTheme(); }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-transparent hover:border-purple-500/50 group relative"
                >
                    <Palette size={18} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Change Theme
                    </span>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* MUSIC BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} 
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative
                    ${isPlaying ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800 text-gray-500'}`}
                >
                    {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                    
                    {/* Pulsing ring when playing */}
                    {isPlaying && <span className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20" />}
                </button>

                {/* VOLUME SLIDER */}
                <div className={`flex items-center transition-all duration-500 overflow-hidden ${isHovered ? 'w-24 px-2 opacity-100' : 'w-0 opacity-0'}`}>
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
            
            {/* NOW PLAYING TEXT */}
            <div className={`
                hidden md:flex flex-col overflow-hidden transition-all duration-500 pl-2
                ${isPlaying ? 'max-h-12 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}
            `}>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Now Streaming</span>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-white truncate font-mono">{themeName} Radio</span>
                    <div className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-1"/>
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-2"/>
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-3"/>
                    </div>
                </div>
            </div>
        </div>
    );
};