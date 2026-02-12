// Auto-extracted from UltimateHub for modular structure
export const GLOBAL_NEON_STYLES = `
  .neon-blue-text,
  .neon-white-text {
    color: rgba(255, 255, 255, 0.92);
    text-shadow: none !important;
  }

  .neon-white-icon,
  .neon-blue-icon {
    filter: none !important;
    color: rgba(255, 255, 255, 0.9);
  }

  .neon-blue-border,
  .neon-subtle-border {
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 18px 40px rgba(0, 0, 0, 0.45);
  }

  .neon-blue-bg {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  .glass-panel {
    background: linear-gradient(135deg, rgba(8, 8, 10, 0.92), rgba(20, 20, 24, 0.82));
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px) saturate(140%);
  }

  .glass-surface {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(16px) saturate(130%);
  }

  .glass-chip {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.95);
  }

  .animate-neon-pulse-optimized,
  .animate-neon-pulse-red {
    animation: none !important;
    text-shadow: none !important;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }

  .ultimate-hub-mobile-open [data-ultimate-hub],
  .ultimate-hub-mobile-open [data-ultimate-hub] *,
  .ultimate-hub-mobile-open .ultimate-hub-backdrop,
  .ultimate-hub-mobile-open .backdrop-blur-sm,
  .ultimate-hub-mobile-open .backdrop-blur-md,
  .ultimate-hub-mobile-open .backdrop-blur-xl,
  .ultimate-hub-mobile-open .backdrop-blur-2xl,
  .ultimate-hub-mobile-open .glass-panel,
  .ultimate-hub-mobile-open .glass-surface {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
`;

export const NEON_STYLES = {
  blueText: 'text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.9)]',
  blueTextBright: 'text-white drop-shadow-[0_0_12px_rgba(255, 255, 255,1)]',
  cyanText: 'text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.9)]',
  amberText: 'text-amber-600',
  orangeText: 'text-orange-600',
  purpleText: 'text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.9)]',
  emeraldText: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]',
  whiteGlow: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
  
  blueBorder: 'border-white/60 shadow-[0_0_12px_rgba(255, 255, 255,0.6),inset_0_0_8px_rgba(255, 255, 255,0.3)]',
  cyanBorder: 'border-white/60 shadow-[0_0_12px_rgba(255, 255, 255,0.6),inset_0_0_8px_rgba(255, 255, 255,0.3)]',
  purpleBorder: 'border-white/60 shadow-[0_0_12px_rgba(255, 255, 255,0.6),inset_0_0_8px_rgba(255, 255, 255,0.3)]',
  emeraldBorder: 'border-white/60 shadow-[0_0_12px_rgba(255,255,255,0.6),inset_0_0_8px_rgba(255,255,255,0.3)]',
  
  blueBg: 'bg-linear-to-br from-white/40 via-white/25 to-white/30 shadow-[0_0_20px_rgba(255, 255, 255,0.4)]',
  cyanBg: 'bg-linear-to-br from-white/40 via-white/25 to-white/30 shadow-[0_0_20px_rgba(255, 255, 255,0.4)]',
  purpleBg: 'bg-linear-to-br from-white/40 via-white/25 to-fuchsia-600/30 shadow-[0_0_20px_rgba(255, 255, 255,0.4)]',
  darkBg: 'bg-white/98 backdrop-blur-xl',
  
  iconGlow: 'drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]',
  iconGlowCyan: 'drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]',
  iconGlowPurple: 'drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]',
  iconGlowAmber: 'drop-shadow-sm',
  iconGlowOrange: 'drop-shadow-sm',
  iconGlowEmerald: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]',
};

export const getFpsColor = (fps: number) => {
  if (fps >= 58) return { text: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)', bg: 'rgba(255, 255, 255, 0.15)' };
  if (fps >= 50) return { text: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)', bg: 'rgba(255, 255, 255, 0.15)' };
  if (fps >= 40) return { text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', bg: 'rgba(251, 191, 36, 0.15)' };
  if (fps >= 30) return { text: '#fb923c', glow: 'rgba(251, 146, 60, 0.8)', bg: 'rgba(251, 146, 60, 0.15)' };
  return { text: '#f87171', glow: 'rgba(248, 113, 113, 0.8)', bg: 'rgba(248, 113, 113, 0.15)' };
};
