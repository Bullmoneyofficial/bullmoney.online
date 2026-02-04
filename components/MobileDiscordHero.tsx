"use client";

import { useState } from "react";
import Link from "next/link";
import YouTubeVideoEmbed from "@/components/YouTubeVideoEmbed";

// Simple mobile-friendly YouTube embed wrapper for Discord modal videos
const normalizeYouTubeId = (input: string) => {
  if (!input) return 'Q3dSjSP3t8I';
  if (!input.includes('http')) return input;
  try {
    const u = new URL(input);
    if (u.searchParams.get('v')) return u.searchParams.get('v') as string;
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.pop() || 'Q3dSjSP3t8I';
  } catch {
    return input;
  }
};

interface MobileDiscordHeroProps {
  sources: string[];
  onOpenModal: () => void;
  variant?: 'mobile' | 'desktop';
}

export function MobileDiscordHero({ sources, onOpenModal, variant = 'mobile' }: MobileDiscordHeroProps) {
  const [index, setIndex] = useState(0);
  const videoId = normalizeYouTubeId(sources[index] || sources[0] || 'Q3dSjSP3t8I');

  // Responsive container: auto-adjusts from smallest (320px) to largest mobile views
  // On mobile, content fills entire available space from top to bottom
  const containerClass = variant === 'mobile'
    ? "w-full max-w-5xl mx-auto px-4 xs:px-5 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+22px)] pb-6 flex flex-col gap-6"
    : "w-full max-w-6xl mx-auto px-6 py-12 sm:py-16 min-h-[70vh] flex items-center";

  const cardMarginTop = variant === 'mobile' ? '' : 'mt-0';

  return (
    <div className={containerClass} data-theme-aware>
      <div className={`relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#050505] shadow-[0_25px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl p-5 xs:p-6 sm:p-7 flex flex-col gap-5 ${cardMarginTop} w-full h-full`}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.05), transparent 32%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.04), transparent 30%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 55%)' }} />
        <div className="absolute inset-x-6 top-0 h-px bg-white/15" />

        <div className="flex flex-col gap-3 text-center flex-shrink-0">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Live Trading Community</p>
          <div className="space-y-1">
            <span className="block text-[clamp(1.9rem,6vw,2.05rem)] leading-[1.15] font-semibold tracking-tight text-white max-w-[18ch] mx-auto">Learn. Trade. Profit.</span>
            <span className="block text-[clamp(0.95rem,4.8vw,1rem)] leading-[1.6] font-medium text-white/70 max-w-[26ch] mx-auto">Watch our trades, copy our setups</span>
          </div>
          <p className="text-[15px] leading-[1.6] text-white/70 max-w-xl mx-auto">
            Daily live streams, trade calls, and mentorship. Join 10,000+ traders learning from real funded traders.
          </p>
        </div>

        <div className="relative rounded-[18px] overflow-hidden border border-white/12 bg-white/3 flex-1 min-h-[200px] shadow-[0_16px_50px_-40px_rgba(0,0,0,1)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/35 pointer-events-none" />
          <div className="relative w-full h-full">
            <YouTubeVideoEmbed
              videoId={videoId}
              className="absolute inset-0 w-full h-full"
              title="BullMoney Discord Video"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2.5 bg-black/55 backdrop-blur-md text-white/85">
            <button
              onClick={() => setIndex((prev) => (prev - 1 + sources.length) % sources.length)}
              className="px-3.5 py-1.5 text-[11px] font-semibold rounded-full bg-white text-black hover:opacity-90 transition"
            >
              Prev
            </button>
            <span className="text-[11px] font-semibold">
              {index + 1} / {Math.max(1, sources.length)}
            </span>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % sources.length)}
              className="px-3.5 py-1.5 text-[11px] font-semibold rounded-full bg-white text-black hover:opacity-90 transition"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
          <Link
            href="https://t.me/addlist/gg09afc4lp45YjQ0"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-full bg-white text-black font-semibold text-sm shadow-[0_10px_30px_-18px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition"
          >
            Join Free Trading Group
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MobileDiscordHero;
