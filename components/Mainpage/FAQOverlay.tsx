"use client";

import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { playClick, playHover } from '@/lib/interactionUtils';

const InlineFaq = dynamic(() => import('@/components/Mainpage/InlineFaq'), {
  ssr: false,
  loading: () => <div className="p-6 text-white/60 text-center">Loading help...</div>
});

interface FAQOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQOverlay({ isOpen, onClose }: FAQOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      style={{
        zIndex: 260000,
        maxWidth: '100vw',
        maxHeight: '100dvh',
        touchAction: 'manipulation'
      }}
      onClick={() => {
        playClick();
        onClose();
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (touch) {
          (e.currentTarget as any)._swipeStartY = touch.clientY;
        }
      }}
      onTouchEnd={(e) => {
        const startY = (e.currentTarget as any)._swipeStartY;
        const touch = e.changedTouches[0];
        if (startY && touch) {
          const endY = touch.clientY;
          if (Math.abs(endY - startY) > 100) {
            playClick();
            onClose();
            if (navigator.vibrate) navigator.vibrate(15);
          }
        }
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[min(90vh,calc(100dvh-2rem))] overflow-hidden" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClick();
            if (navigator.vibrate) navigator.vibrate(10);
            onClose();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            playHover();
            e.currentTarget.style.transform = 'scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.currentTarget.style.transform = '';
          }}
          className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation active:scale-90"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          aria-label="Close FAQ"
        >
          <X size={24} strokeWidth={2.5} />
        </button>
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/80 shadow-[0_10px_60px_rgba(0,0,0,0.5)] overflow-y-auto max-h-full">
          <InlineFaq />
        </div>
      </div>
    </div>
  );
}
