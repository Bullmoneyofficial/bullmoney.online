'use client';

/**
 * StoreTimerSection.tsx
 *
 * Full-viewport countdown display shown when the store is in `timer` display mode.
 * Renders pulsing glow backgrounds, a headline + subtext, and the CountdownTimer.
 */

import { CountdownTimer } from './CountdownTimer';

interface StoreTimerSectionProps {
  timerEnd: string | null;
  timerHeadline: string;
  timerSubtext: string;
}

export function StoreTimerSection({ timerEnd, timerHeadline, timerSubtext }: StoreTimerSectionProps) {
  return (
    <section data-apple-section style={{ backgroundColor: 'rgb(0,0,0)' }}>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 py-20 text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(79,70,229,0.2) 40%, transparent 70%)',
              animation: 'timerPulse 4s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 60%)',
              animation: 'timerPulse 3s ease-in-out infinite 1s',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs font-medium tracking-wider uppercase">Coming Soon</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            {timerHeadline}
          </h2>
          <p className="text-white/50 text-base sm:text-lg mb-10 max-w-md mx-auto">
            {timerSubtext}
          </p>

          <CountdownTimer targetDate={timerEnd} />
        </div>

        <style>{`
          @keyframes timerPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.25; }
          }
        `}</style>
      </div>
    </section>
  );
}
