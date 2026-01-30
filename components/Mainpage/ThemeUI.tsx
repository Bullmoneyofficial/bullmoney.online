// src/components/themes/ThemeUI.tsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';

const SHIMMER_GRADIENT_BLUE = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ffffff 50%, #00000000 100%)";

const GLOBAL_STYLES = `
  .mac-gpu-accelerate { transform: translateZ(0); will-change: transform, opacity; backface-visibility: hidden; }
  @keyframes textShine { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
  .text-shimmer-effect {
    background: linear-gradient(to right, #ffffff 20%, #ffffff 50%, #ffffff 80%);
    background-size: 200% auto;
    color: #ffffff;
    background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: textShine 3s linear infinite;
  }
  .text-glow { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3); }
  
  .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.5); border-radius: 2px; }
  .custom-scrollbar::-webkit-scrollbar-track { background-color: rgba(0, 0, 0, 0.1); }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  .snap-x-mandatory { scroll-snap-type: x mandatory; }
  .snap-center { scroll-snap-align: center; }
  
  .touch-scroll { -webkit-overflow-scrolling: touch; }
`;

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

export const ShimmerBorder = ({ active = true }: { active?: boolean }) => (
    <motion.div
        className="absolute inset-[-100%] pointer-events-none"
        animate={{ opacity: active ? 1 : 0, rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ background: SHIMMER_GRADIENT_BLUE }}
    />
);

export const ShimmerCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`relative group w-full rounded-2xl p-[1px] shadow-[0_0_30px_-10px_rgba(255, 255, 255,0.2)] overflow-hidden ${className}`}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden"><ShimmerBorder active={true} /></div>
        <div className="relative bg-[#050505] rounded-[15px] h-full z-10 overflow-hidden backdrop-blur-xl">{children}</div>
    </div>
);

export const ShimmerButton = ({ onClick, children, className = "", icon: Icon, disabled = false }: { onClick?: () => void, children: React.ReactNode, className?: string, icon?: any, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} className={`group/btn relative w-full h-12 overflow-hidden rounded-xl transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95' } ${className}`}>
        <ShimmerBorder active={!disabled} />
        <div className="absolute inset-[1px] bg-[#0a0a0a] group-hover/btn:bg-[#151515] transition-colors rounded-[11px] flex items-center justify-center gap-2">
            <span className="font-bold text-white text-[10px] md:text-xs tracking-[0.2em] uppercase text-glow">{children}</span>
            {Icon && <Icon className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(255, 255, 255,1)]" />}
        </div>
    </button>
);

export const GlowText = ({ text, className = "" }: { text: string | number, className?: string }) => (
    <span className={`text-white/90 text-glow font-mono ${className}`}>{text}</span>
);

export const IllusionLayer = ({ type = 'SCANLINES' }: { type?: string }) => (
    <div className="fixed inset-0 pointer-events-none z-[40] mix-blend-overlay opacity-30 select-none">
        <div className="w-full h-full" style={{
            background: type === 'SCANLINES' ? 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))' : 'none',
            backgroundSize: type === 'SCANLINES' ? '100% 2px, 3px 100%' : 'auto'
        }} />
    </div>
);