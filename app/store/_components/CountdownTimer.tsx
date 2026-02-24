'use client';

/**
 * CountdownTimer.tsx
 *
 * Renders four animated blocks (Days / Hours / Minutes / Seconds) counting
 * down to `targetDate`. Shows a "Coming Soon" pulse when the date expires.
 */

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string | null;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const calc = () => {
      const now = Date.now();
      const end = new Date(targetDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return <p className="text-white/40 text-sm">Timer not configured yet.</p>;
  }

  if (expired) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-white animate-pulse">It&apos;s time!</p>
        <p className="text-white/50 text-sm mt-2">
          New products are on the way. Refresh the page soon.
        </p>
      </div>
    );
  }

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center">
            <div
              className="relative w-[72px] h-[88px] sm:w-[90px] sm:h-[110px] rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(79,70,229,0.1) 100%)',
                border: '1px solid rgba(147,51,234,0.25)',
                boxShadow:
                  '0 8px 32px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span
                className="text-3xl sm:text-4xl font-bold text-white tabular-nums"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {String(block.value).padStart(2, '0')}
              </span>
              {/* Center-line accent */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest mt-2 font-medium">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-2xl sm:text-3xl text-white/20 font-light mb-6">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
