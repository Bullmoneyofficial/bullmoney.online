'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Headphones,
} from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useSupportDrawerUI, useStoreMenuUI } from '@/contexts/UIStateContext';

// next/dynamic with ssr:false — Turbopack fully defers this chunk
const SupportDrawer = dynamic(() => import('@/components/shop/SupportDrawer'), { ssr: false });

// ============================================================================
// SUPPORT BUTTON — Floating button that opens the SupportDrawer via UIState
// The drawer itself is rendered globally in LayoutProviders
// Hides when store header menus (mobile/desktop) are open
// ============================================================================

const IDLE_PROMPTS = [
  'Need help? Tap here',
  'AI support — ask anything',
  'Chat live on Telegram',
  'Join our Discord',
  'Track your order',
  'Return or refund help',
  'Free shipping questions?',
  'Got a question?',
];

interface SupportButtonProps {
  position?: 'left' | 'right';
}

export function SupportButton({ position = 'right' }: SupportButtonProps) {
  const { isOpen, setIsOpen } = useSupportDrawerUI();
  const { isMobileMenuOpen: isStoreMobileMenuOpen, isDesktopMenuOpen: isStoreDesktopMenuOpen, isDropdownMenuOpen: isStoreDropdownMenuOpen } = useStoreMenuUI();
  const [hasUnread, setHasUnread] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastIdx, setToastIdx] = useState(0);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const isLeft = position === 'left';

  // Hide support button when any store menu is open
  const isAnyStoreMenuOpen = isStoreMobileMenuOpen || isStoreDesktopMenuOpen || isStoreDropdownMenuOpen;
  const shouldHide = isAnyStoreMenuOpen;

  // Idle toast rotation
  useEffect(() => {
    if (isOpen) { setToastMsg(null); return; }
    const initial = setTimeout(() => setToastMsg(IDLE_PROMPTS[0]), 4000);
    const interval = setInterval(() => {
      setToastIdx(prev => {
        const next = (prev + 1) % IDLE_PROMPTS.length;
        setToastMsg(IDLE_PROMPTS[next]);
        return next;
      });
    }, 6000);
    return () => { clearTimeout(initial); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Unread indicator
  useEffect(() => {
    const t = setTimeout(() => { if (!isOpen) setHasUnread(true); }, 10000);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleOpen = () => {
    SoundEffects.open();
    setIsOpen(true);
    setHasUnread(false);
    if (!drawerMounted) setDrawerMounted(true); // mount drawer on first open
  };

  const handleClose = () => {
    SoundEffects.close();
    setIsOpen(false);
  };

  const side = isLeft ? 'left-5 md:left-auto md:right-5' : 'right-5';

  // Don't render if any store menu is open
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Button — compact on mobile */}
      <motion.button
        onClick={isOpen ? handleClose : handleOpen}
        className={`fixed bottom-6 md:bottom-24 ${side} z-[2147483647] flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-full`}
        style={{
          position: 'fixed',
          background: isOpen ? 'rgba(255,255,255,0.06)' : 'rgb(0, 0, 0)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid rgba(255,255,255,${isOpen ? '0.1' : '0.12'})`,
          boxShadow: isOpen ? '0 2px 20px rgba(0,0,0,0.4)' : '0 4px 30px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.1)',
          transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? 'Close support' : 'Open support'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-4 h-4 md:w-5 md:h-5 text-white/70" />
            </motion.div>
          ) : (
            <motion.div key="h" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Headphones className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {hasUnread && !isOpen && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`absolute -top-0.5 ${isLeft ? '-left-0.5' : '-right-0.5'} w-2 h-2 md:w-2.5 md:h-2.5 rounded-full`}
            style={{ background: 'rgb(255, 255, 255)', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
        )}
      </motion.button>

      {/* Floating Toast */}
      <AnimatePresence>
        {toastMsg && !isOpen && (
          <motion.div
            key={toastMsg}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={handleOpen}
            className={`fixed bottom-16 md:bottom-40 ${side} z-[2147483647] cursor-pointer max-w-48 md:max-w-55`}
            style={{
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '6px 10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-white/80 text-[10px] md:text-[12px] leading-snug font-medium">{toastMsg}</p>
            <div
              className={`absolute -bottom-1.5 ${isLeft ? 'left-4 md:right-4 md:left-auto' : 'right-4'}`}
              style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(0, 0, 0, 0.92)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SupportDrawer — lazy loaded on first open, stays mounted after */}
      {drawerMounted && <SupportDrawer />}
    </>
  );
}

// Convenience named exports
export const StoreSupportButton = () => <SupportButton position="right" />;
export const AppSupportButton = () => <SupportButton position="left" />;
export default SupportButton;
