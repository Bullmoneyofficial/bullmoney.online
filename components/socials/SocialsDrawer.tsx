// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, ExternalLink, X, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSocialsDrawerUI, useUIState } from '@/contexts/UIStateContext';
import type { ChannelKey } from '@/components/ultimate-hub/types';
import { TELEGRAM_CHANNELS } from '@/components/ultimate-hub/constants';

const TelegramChannelEmbed = dynamic(
  () => import('@/components/ultimate-hub/components/TelegramChannelEmbed').then((m) => ({ default: m.TelegramChannelEmbed })),
  { ssr: false, loading: () => null }
);

// ============================================================================
// SOCIALS DRAWER — CartDrawer-style slide-out panel with React Portal
// Mirrors Ultimate Hub "Social" tab (community): ChannelCarousel + Telegram feed
// ============================================================================

export function SocialsDrawer() {
  const { shouldSkipHeavyEffects } = useUIState();
  const { isOpen, setIsOpen } = useSocialsDrawerUI();
  const SOCIALS_DRAWER_BACKDROP_Z_INDEX = 2147483596;
  const SOCIALS_DRAWER_PANEL_Z_INDEX = 2147483597;
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [renderContent, setRenderContent] = useState(false);

  const [activeChannel, setActiveChannel] = useState<ChannelKey>('trades');
  const [isVip, setIsVip] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', updateMatch);
    else mediaQuery.addListener(updateMatch);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', updateMatch);
      else mediaQuery.removeListener(updateMatch);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    if (isOpen) {
      html.setAttribute('data-socials-open', 'true');
      body.setAttribute('data-socials-open', 'true');
      return () => {
        html.removeAttribute('data-socials-open');
        body.removeAttribute('data-socials-open');
      };
    }
    html.removeAttribute('data-socials-open');
    body.removeAttribute('data-socials-open');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset to default channel when opening for predictable UX
    setActiveChannel('trades');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setRenderContent(false);
      return;
    }

    // Defer heavy embed mount until after drawer transition for smoother open.
    const delayMs = shouldSkipHeavyEffects ? 0 : 160;
    const timer = setTimeout(() => setRenderContent(true), delayMs);
    return () => clearTimeout(timer);
  }, [isOpen, shouldSkipHeavyEffects]);

  useEffect(() => {
    // Lightweight VIP detection from localStorage (avoid heavy access hooks)
    if (typeof window === 'undefined') return;
    const readVip = () => {
      try {
        const savedSession = localStorage.getItem('bullmoney_session');
        if (!savedSession) return false;
        const session = JSON.parse(savedSession);
        return session?.is_vip === true || session?.is_admin === true;
      } catch {
        return false;
      }
    };

    setIsVip(readVip());
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const viewAllHref = useMemo(() => {
    const meta = TELEGRAM_CHANNELS?.[activeChannel];
    if (!meta?.handle) return null;
    return `https://t.me/${meta.handle}`;
  }, [activeChannel]);

  const channels = useMemo(() => {
    // Keep ordering consistent and simple for drawer UX
    const order: ChannelKey[] = ['trades', 'main', 'shop', 'vip2', 'vip'];
    return order.filter((key) => Boolean((TELEGRAM_CHANNELS as any)?.[key]));
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.12 }}
            onClick={close}
            className="fixed inset-0"
            style={{
              zIndex: SOCIALS_DRAWER_BACKDROP_Z_INDEX,
              background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)',
            }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={shouldSkipHeavyEffects ? false : isDesktop ? { y: '-100%' } : { x: '100%' }}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : isDesktop ? { y: '-100%' } : { x: '100%' }}
            transition={
              shouldSkipHeavyEffects
                ? { duration: 0 }
                : { type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }
            }
            onClick={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{
              zIndex: SOCIALS_DRAWER_PANEL_Z_INDEX,
              color: '#1d1d1f',
              backgroundColor: '#ffffff',
              colorScheme: 'light' as const,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={close}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close social"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                <h2 className="text-lg md:text-xl font-light">Social</h2>
              </div>

              <button
                onClick={close}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white">
              <div className="h-full flex flex-col">
                {/* Channel selector (white drawer style) */}
                <div className="p-4 md:p-6 border-b border-black/10 bg-white">
                  <div className="flex gap-2 overflow-x-auto overscroll-contain touch-pan-x scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {channels.map((chKey) => {
                      const ch = (TELEGRAM_CHANNELS as any)[chKey];
                      const locked = Boolean(ch?.requiresVip && !isVip);
                      const active = activeChannel === chKey;
                      return (
                        <button
                          key={chKey}
                          onClick={() => {
                            if (locked) return;
                            setActiveChannel(chKey);
                          }}
                          className={
                            'px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ' +
                            (active ? 'bg-black/5 border-black/20 text-black' : 'bg-white border-black/10 text-black/70 hover:bg-black/5') +
                            (locked ? ' opacity-60 cursor-not-allowed' : '')
                          }
                        >
                          <span>{ch?.name || chKey}</span>
                          {locked ? <Lock className="w-3.5 h-3.5" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="flex-1 min-h-0 bg-white overflow-hidden"
                  style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                  data-scrollable
                >
                  {renderContent ? (
                    <TelegramChannelEmbed channel={activeChannel} isVip={isVip} />
                  ) : (
                    <div className="flex items-center justify-center py-12 bg-white">
                      <div className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Loading feed…</div>
                    </div>
                  )}
                </div>

                {activeChannel !== 'vip' && viewAllHref && (
                  <div className="shrink-0 px-4 py-3 border-t border-black/10 bg-white md:hidden">
                    <a
                      href={viewAllHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs transition-colors"
                      style={{ color: 'rgba(0,0,0,0.75)' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View all on Telegram
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
