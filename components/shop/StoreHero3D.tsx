'use client';

import { useRef, useEffect, useState, useMemo, useCallback, memo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Zap, Star, TrendingUp, TrendingDown, Copy, Check, X, Gift, Box, Palette } from 'lucide-react';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useUnifiedPerformance } from '@/hooks/useDesktopPerformance';

import TextType from '@/components/TextType';
import CountUp from '@/components/CountUp';
import dynamic from 'next/dynamic';

// Spline scene URL
const SPLINE_SCENE = '/scene1.splinecode';

// ---- Aggressive Spline Preloading (disabled by default in production) ----
const shouldPreloadSpline = typeof window !== 'undefined' && process.env.NODE_ENV !== 'production';

// 1. Eagerly preload the Spline runtime JS bundle (warms module cache)
const splineModulePromise = shouldPreloadSpline
  ? import('@splinetool/react-spline')
  : null;

// 2. Eagerly preload the .splinecode scene file via fetch (warms HTTP cache)
if (shouldPreloadSpline) {
  // Use link preload for highest priority
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = SPLINE_SCENE;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  // @ts-ignore - fetchpriority is valid but not in all TS defs
  link.fetchPriority = 'high';
  document.head.appendChild(link);

  // Also start a background fetch to fully cache the scene bytes
  fetch(SPLINE_SCENE, { priority: 'high', cache: 'force-cache' } as RequestInit).catch(() => {});
}

// Dynamic import for Spline (heavy 3D component) - resolves from pre-warmed promise
const Spline = dynamic(
  () => splineModulePromise || import('@splinetool/react-spline'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    ),
  }
);

// ============================================================================
// STORE HERO 3D - Trading-Themed Premium Experience
// Features: Real crypto prices, blue trading aesthetic, promo code popup,
//           3D floating products, parallax effects, dynamic lighting
// ============================================================================

// Live Crypto Price Types
interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  isUp: boolean;
}

// VIP Product from Supabase
interface VipProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
  visible?: boolean;
  coming_soon?: boolean;
}

// Floating Product Card Types (includes real VIP data)
interface FloatingProduct {
  id: number;
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  scale: number;
  delay: number;
  glow: string;
  floatSeed: number; // For random space vacuum floating
  // Real product data from Supabase
  vipData?: VipProduct;
}

// Trading Theme Colors - TrueBlue for icons
const BLUE_THEME = {
  primary: '#1956B4',      // TrueBlue
  secondary: '#1956B4',    // TrueBlue
  accent: '#1956B4',       // TrueBlue
  glow: '#1956B4',         // TrueBlue
  success: '#22c55e',      // Green for up
  danger: '#ef4444',       // Red for down
};

// Default card positions - space vacuum floating effect
// Positions adjusted to keep cards safely in view, optimized for mobile
const CARD_POSITIONS = [
  { x: 15, y: 22, z: 100, rotateX: -12, rotateY: 20, scale: 1.0, delay: 0, glow: BLUE_THEME.primary, floatSeed: 1 },
  { x: 72, y: 18, z: 80, rotateX: 8, rotateY: -15, scale: 0.9, delay: 0.2, glow: BLUE_THEME.secondary, floatSeed: 2 },
  { x: 75, y: 52, z: 120, rotateX: -5, rotateY: 12, scale: 0.95, delay: 0.4, glow: BLUE_THEME.accent, floatSeed: 3 },
  { x: 12, y: 60, z: 60, rotateX: 15, rotateY: -8, scale: 0.85, delay: 0.6, glow: BLUE_THEME.primary, floatSeed: 4 },
  { x: 45, y: 75, z: 90, rotateX: -10, rotateY: 6, scale: 0.8, delay: 0.8, glow: BLUE_THEME.secondary, floatSeed: 5 },
];

const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'];

// USD Formatter - uses store currency
const formatUSD = (value: number) => {
  return useCurrencyLocaleStore.getState().formatPrice(value);
};

// ============================================================================
// PROMO CODE POPUP COMPONENT - 3D Glassmorphism Style (Matches ProductCard)
// ============================================================================
const PromoCodePopup = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const promoCode = 'BULLMONEY15';
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gentle 3D tilt on desktop (subtle, not dramatic)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isMobile) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 30; // divisor 30 = very gentle
    const y = (e.clientY - top - height / 2) / 30;
    containerRef.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
  };
  const handleMouseLeave = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(promoCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = promoCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      SoundEffects.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = useCallback(() => {
    SoundEffects.close();
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-2147483647 flex items-center justify-center p-4"
          style={{ 
            background: 'transparent',
          }}
          onClick={handleClose}
        >
          {/* Desktop: subtle 3D wrapper | Mobile: flat */}
          {!isMobile ? (
            <CardContainer className="w-full max-w-sm" containerClassName="py-0">
              <CardBody className="w-full h-auto p-0">
                <CardItem translateZ="40" className="w-full">
                  <HoverBorderGradient
                    containerClassName="rounded-2xl w-full"
                    className="p-0 w-full"
                    style={{ backgroundColor: '#000000' }}
                    as="div"
                  >
                    <motion.div
                      ref={containerRef}
                      initial={{ opacity: 0, scale: 0.96, y: 24 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 24 }}
                      transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      className="relative w-full overflow-hidden rounded-2xl"
                      style={{ transition: 'transform 0.15s ease-out', backgroundColor: '#000000' }}
                    >
                      {/* Subtle top highlight line */}
                      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                      {/* Faint border */}
                      <div className="absolute inset-0 border border-white/[0.06] rounded-2xl pointer-events-none z-2" />
                      {/* Top light reflection */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl" />

                      <div className="relative px-7 pt-10 pb-8">
                        {/* Close button */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleClose(); }}
                          className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full
                                     border border-white/10 bg-white/[0.05]
                                     hover:bg-white/10 hover:border-white/20
                                     active:scale-90
                                     transition-all duration-200 ease-out z-50 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
                        </button>

                        {/* Icon */}
                        <CardItem translateZ="20" className="w-full">
                          <motion.div
                            className="w-14 h-14 mx-auto mb-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <Gift className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                          </motion.div>
                        </CardItem>

                        {/* Title */}
                        <CardItem translateZ="15" className="w-full">
                          <motion.h3
                            className="text-[22px] font-semibold text-white text-center tracking-tight leading-tight mb-1.5"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          >
                            15% Off Your First Order
                          </motion.h3>
                        </CardItem>

                        {/* Subtitle */}
                        <motion.p
                          className="text-[13px] text-white/40 text-center tracking-wide mb-7 font-normal leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.18, duration: 0.35 }}
                        >
                          Use this exclusive code at checkout
                        </motion.p>

                        {/* Promo code box */}
                        <CardItem translateZ="25" className="w-full">
                          <motion.div
                            className="relative mb-5"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <div
                              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 cursor-pointer
                                         hover:bg-white/[0.06] hover:border-white/[0.14]
                                         active:scale-[0.98]
                                         transition-all duration-200 ease-out"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleCopy(); }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-white/30 font-medium uppercase tracking-[0.12em] mb-1.5">Promo Code</p>
                                  <p className="text-2xl font-bold text-white font-mono tracking-[0.15em]">{promoCode}</p>
                                </div>
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 ease-out ${copied ? 'bg-white border-white/20' : 'bg-white/[0.05] border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-90'}`}>
                                  {copied ? <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> : <Copy className="w-4 h-4 text-white/50" strokeWidth={2} />}
                                </div>
                              </div>
                              <AnimatePresence>
                                {copied && (
                                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-white/50 font-medium mt-2.5 text-center tracking-wide">Copied to clipboard</motion.p>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        </CardItem>

                        {/* CTA Button */}
                        <CardItem translateZ="20" className="w-full">
                          <motion.button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleClose(); }}
                            className="w-full py-3.5 rounded-xl font-semibold text-[15px] tracking-wide
                                       bg-white text-black border border-white/20
                                       hover:bg-white/90 active:scale-[0.97] active:bg-white/80
                                       transition-all duration-200 ease-out cursor-pointer"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          >
                            Start Shopping
                          </motion.button>
                        </CardItem>

                        {/* Fine print */}
                        <motion.p className="text-center text-white/25 text-[11px] mt-5 tracking-wide font-normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.3 }}>
                          New customers only · Expires in 24 hours
                        </motion.p>
                      </div>
                    </motion.div>
                  </HoverBorderGradient>
                </CardItem>
              </CardBody>
            </CardContainer>
          ) : (
            /* Mobile — flat Apple-style, no 3D */
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl"
              style={{ backgroundColor: '#000000' }}
            >
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <div className="relative px-7 pt-10 pb-8">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleClose(); }}
                  className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center rounded-full
                             border border-white/10 bg-white/[0.05]
                             hover:bg-white/10 hover:border-white/20
                             active:scale-90
                             transition-all duration-200 ease-out z-50 cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
                </button>

                <motion.div
                  className="w-14 h-14 mx-auto mb-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Gift className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                </motion.div>

                <motion.h3
                  className="text-[22px] font-semibold text-white text-center tracking-tight leading-tight mb-1.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  15% Off Your First Order
                </motion.h3>

                <motion.p
                  className="text-[13px] text-white/40 text-center tracking-wide mb-7 font-normal leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.35 }}
                >
                  Use this exclusive code at checkout
                </motion.p>

                <motion.div
                  className="relative mb-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 cursor-pointer
                               hover:bg-white/[0.06] hover:border-white/[0.14]
                               active:scale-[0.98]
                               transition-all duration-200 ease-out"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleCopy(); }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/30 font-medium uppercase tracking-[0.12em] mb-1.5">Promo Code</p>
                        <p className="text-2xl font-bold text-white font-mono tracking-[0.15em]">{promoCode}</p>
                      </div>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-200 ease-out ${copied ? 'bg-white border-white/20' : 'bg-white/[0.05] border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-90'}`}>
                        {copied ? <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> : <Copy className="w-4 h-4 text-white/50" strokeWidth={2} />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {copied && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[11px] text-white/50 font-medium mt-2.5 text-center tracking-wide">Copied to clipboard</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); SoundEffects.click(); handleClose(); }}
                  className="w-full py-3.5 rounded-xl font-semibold text-[15px] tracking-wide
                             bg-white text-black border border-white/20
                             hover:bg-white/90 active:scale-[0.97] active:bg-white/80
                             transition-all duration-200 ease-out cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  Start Shopping
                </motion.button>

                <motion.p className="text-center text-white/25 text-[11px] mt-5 tracking-wide font-normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.3 }}>
                  New customers only · Expires in 24 hours
                </motion.p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ============================================================================
// LIVE CRYPTO TICKER
// ============================================================================
const CryptoTicker = memo(function CryptoTicker({ prices }: { prices: CryptoPrice[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-6"
    >
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse" />
        <span className="text-[10px] text-white/50 uppercase tracking-wider">LIVE</span>
      </div>
      {prices.map((crypto, i) => (
        <motion.div
          key={crypto.symbol}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 + i * 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"
        >
          <span className="text-xs font-medium text-white/80">{crypto.symbol.replace('USDT', '')}</span>
          <span className="text-xs text-white/50 font-mono">{formatUSD(crypto.price)}</span>
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${crypto.isUp ? 'text-green-400' : 'text-red-400'}`}>
            {crypto.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <CountUp to={Math.abs(crypto.change24h)} from={0} duration={1.5} className="" />%
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
});

// ============================================================================
// ANIMATED PARTICLE - Pure CSS animation (GPU composited, zero JS cost)
// ============================================================================
const Particle = ({ delay, duration }: { delay: number; duration: number }) => {
  const size = Math.random() * 4 + 2;
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  
  return (
    <div
      className="absolute rounded-full bg-[#1956B4]/30"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
        animation: `store-particle ${duration}s ${delay}s ease-out infinite`,
        willChange: 'transform, opacity',
      }}
    />
  );
};

// ============================================================================
// FLOATING 3D PRODUCT CARD - Now with real VIP data and interaction
// ============================================================================
const FloatingProductCard = ({ 
  product, 
  mouseX, 
  mouseY,
  isExpanded,
  onInteractionStart,
  onInteractionEnd,
  onCardClick,
  skipParallax = false,
}: { 
  product: FloatingProduct;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isExpanded?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onCardClick?: () => void;
  skipParallax?: boolean;
}) => {
  // Skip expensive parallax springs on mobile — zero overhead from useTransform/useSpring
  const parallaxX = useTransform(mouseX, [0, 1], skipParallax ? [0, 0] : [-30 * (product.z / 100), 30 * (product.z / 100)]);
  const parallaxY = useTransform(mouseY, [0, 1], skipParallax ? [0, 0] : [-20 * (product.z / 100), 20 * (product.z / 100)]);
  
  const springConfig = skipParallax ? { stiffness: 300, damping: 50 } : { stiffness: 100, damping: 30 };
  const springX = useSpring(parallaxX, springConfig);
  const springY = useSpring(parallaxY, springConfig);

  const vip = product.vipData;
  const productName = vip?.name || 'Premium';
  const productPrice = vip?.price ?? 0;
  const productImage = vip?.image_url || vip?.imageUrl;

  return (
    <motion.div
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        x: springX,
        y: springY,
        zIndex: isExpanded ? 200 : Math.floor(product.z),
        touchAction: 'pan-y',
      }}
      initial={{ opacity: 0, scale: 0, rotateX: 45, rotateY: -45 }}
      animate={{ 
        opacity: 1, 
        scale: isExpanded ? product.scale * 1.8 : product.scale,
        rotateX: isExpanded ? 0 : product.rotateX,
        rotateY: isExpanded ? 0 : product.rotateY,
      }}
      transition={{
        duration: isExpanded ? 0.4 : 1.2,
        delay: isExpanded ? 0 : product.delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={onInteractionStart}
      onMouseLeave={onInteractionEnd}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      onClick={onCardClick}
      whileHover={{ scale: product.scale * 1.1 }}
    >
      <motion.div
        className="relative"
        animate={isExpanded ? {} : (skipParallax ? {
          // Mobile: Simple gentle float only (2 keyframes = much cheaper)
          y: [0, -4, 0],
          x: [0, 2, 0],
        } : {
          // Desktop: Random space vacuum floating - subtle movements to stay in view
          y: [
            0, 
            -5 * (product.floatSeed % 3 + 1), 
            3 * ((product.floatSeed + 1) % 2), 
            -6 * (product.floatSeed % 2 + 0.5),
            3 * (product.floatSeed % 4 - 1),
            0
          ],
          x: [
            0, 
            3 * (product.floatSeed % 2 - 0.5), 
            -4 * ((product.floatSeed + 2) % 3 - 1),
            4 * (product.floatSeed % 3 - 1.5),
            -3 * (product.floatSeed % 2),
            0
          ],
          rotateZ: [
            0, 
            1.5 * (product.floatSeed % 3 - 1), 
            -2 * ((product.floatSeed + 1) % 2),
            1 * (product.floatSeed % 4 - 2),
            -1.5 * (product.floatSeed % 2 + 0.5),
            0
          ],
          rotateX: [
            product.rotateX,
            product.rotateX + 2 * (product.floatSeed % 2),
            product.rotateX - 1.5 * ((product.floatSeed + 1) % 3),
            product.rotateX + 1.5 * (product.floatSeed % 3 - 1),
            product.rotateX
          ],
          rotateY: [
            product.rotateY,
            product.rotateY - 2.5 * (product.floatSeed % 3 - 1),
            product.rotateY + 2 * ((product.floatSeed + 2) % 2),
            product.rotateY - 2 * (product.floatSeed % 2),
            product.rotateY
          ],
        })}
        transition={{
          duration: skipParallax ? 6 : (10 + product.floatSeed * 2 + product.delay * 2),
          repeat: isExpanded ? 0 : Infinity,
          ease: 'easeInOut',
          ...(skipParallax ? {} : { times: [0, 0.2, 0.4, 0.6, 0.8, 1] }),
        }}
      >
        {/* Blue glow effect — skip on mobile for GPU savings */}
        {!skipParallax && (
          <div 
            className="absolute inset-0 opacity-40 sm:opacity-50 rounded-3xl"
            style={{ 
              background: `radial-gradient(circle, ${product.glow} 0%, transparent 70%)`,
              transform: 'scale(1.2)',
            }}
          />
        )}
        
        {/* Product card with TrueBlue theme - Floating cards */}
        <div 
          className="relative w-20 h-28 sm:w-32 sm:h-40 md:w-40 md:h-52 lg:w-44 lg:h-56 rounded-xl sm:rounded-2xl overflow-hidden touch-pan-y"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 86, 180, 0.15) 0%, rgba(25, 86, 180, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: skipParallax
              ? '0 12px 24px -6px rgba(0, 0, 0, 0.4)'
              : `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset,
              0 0 60px -20px ${product.glow}40
            `,
            transform: 'perspective(1000px)',
          }}
        >
          {/* Product image or fallback icon */}
          {productImage ? (
            <>
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-1" />
              {/* Image filling full card height */}
              <img 
                src={productImage}
                alt={productName}
                className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
                loading="lazy"
              />
            </>
          ) : (
            <div className="absolute inset-2 rounded-xl bg-linear-to-br from-[#1956B4]/10 to-transparent flex items-center justify-center">
              <ShoppingBag 
                className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 text-[#1956B4]/40" 
                strokeWidth={1}
              />
            </div>
          )}
          
          {/* Shimmer overlay - GPU CSS animation */}
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent store-shimmer"
          />
          
          {/* Price tag with real data */}
          <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg bg-black/80 border border-white/10 z-2">
            <div className="text-[6px] sm:text-[7px] md:text-[9px] text-white/80 truncate font-medium"><TextType text={productName} typingSpeed={Math.max(5, 25 - productName.length)} showCursor={false} loop={false} as="span" /></div>
            <div className="text-[9px] sm:text-[10px] md:text-xs text-white font-bold">{useCurrencyLocaleStore.getState().formatPrice(productPrice)}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// ANIMATED GRADIENT ORB (Blue Theme)
// ============================================================================
const GradientOrb = ({ 
  className, 
  color1, 
  color2, 
  size,
  delay = 0 
}: { 
  className: string;
  color1: string;
  color2: string;
  size: string;
  delay?: number;
}) => (
  <div
    className={`absolute rounded-full store-orb-float ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 70%)`,
      animationDelay: `${delay}s`,
    }}
  />
);

// ============================================================================
// SPLINE BACKGROUND COMPONENT - 3D Interactive Scene
// ============================================================================
const SplineBackground = memo(function SplineBackground({ 
  grayscale = true,
  onInteraction,
  onHover,
  playMode = false,
}: { 
  grayscale?: boolean;
  onInteraction?: () => void;
  onHover?: () => void;
  playMode?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const splineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const splineWrapperRef = useRef<HTMLDivElement>(null);

  // Memoize Spline style object to prevent re-renders (big perf win)
  const splineStyle = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    display: 'block' as const,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 200ms ease-out, filter 200ms ease-out',
    filter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
    WebkitFilter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
    pointerEvents: (playMode ? 'auto' : 'none') as any,
    touchAction: playMode ? 'none' : 'pan-y',
    zIndex: 1,
  }), [isLoaded, grayscale, playMode]);

  const handleLoad = useCallback((splineApp: any) => {
    console.log('[StoreHero3D] Spline loaded');
    splineRef.current = splineApp;
    setIsLoaded(true);
    setHasError(false);
  }, []);

  // Attach canvas event listeners once Spline is loaded
  useEffect(() => {
    if (!isLoaded || !splineWrapperRef.current) return;
    
    const canvas = splineWrapperRef.current.querySelector('canvas');
    if (!canvas) return;
    
    console.log('[StoreHero3D] ✅ Canvas found, attaching event listeners');
    
    // Generic interaction handlers
    const handleInteraction = () => {
      console.log('[StoreHero3D] Canvas interaction detected');
      if (onInteraction) onInteraction();
    };
    
    const handleHover = () => {
      if (onHover) onHover();
    };
    
    // Handle wheel events - in play mode let Spline handle zoom, otherwise scroll page
    const handleWheel = (e: WheelEvent) => {
      if (playMode) {
        // In play mode, let Spline handle its own zoom/scroll
        return;
      }
      // Normal mode: don't interfere - let the event bubble up naturally for page scroll
    };
    
    // Ensure canvas pointer events respect play mode
    canvas.style.pointerEvents = playMode ? 'auto' : 'none';
    // In play mode, allow all touch gestures for Spline interaction; otherwise allow vertical scrolling
    canvas.style.touchAction = playMode ? 'none' : 'pan-y';
    
    // Attach wheel event handler to allow page scrolling
    canvas.addEventListener('wheel', handleWheel, { passive: true });
    
    // Attach multiple event types for broad compatibility
    canvas.addEventListener('pointerdown', handleInteraction as EventListener);
    canvas.addEventListener('pointermove', handleHover as EventListener);
    canvas.addEventListener('touchstart', handleInteraction as EventListener, { passive: true });
    canvas.addEventListener('mousedown', handleInteraction as EventListener);
    canvas.addEventListener('mousemove', handleHover as EventListener);
    
    // Cleanup function
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handleInteraction as EventListener);
      canvas.removeEventListener('pointermove', handleHover as EventListener);
      canvas.removeEventListener('touchstart', handleInteraction as EventListener);
      canvas.removeEventListener('mousedown', handleInteraction as EventListener);
      canvas.removeEventListener('mousemove', handleHover as EventListener);
      // Reset touch action on cleanup
      canvas.style.touchAction = 'pan-y';
    };
  }, [isLoaded, onInteraction, onHover, playMode]);

  const handleError = useCallback((error: any) => {
    console.error('[StoreHero3D] Spline load error:', error);
    setHasError(true);
  }, []);
  
  // Handle container-level interactions as fallback
  const handleSplineMouseDown = useCallback(() => {
    console.log('[StoreHero3D] Container mousedown detected');
    if (onInteraction) onInteraction();
  }, [onInteraction]);
  
  // Handle mouse hover on Spline
  const handleSplineMouseEnter = useCallback(() => {
    if (onHover) onHover();
  }, [onHover]);

  // Handle wheel events on the container - in play mode let Spline handle, otherwise scroll page
  const handleContainerWheel = useCallback((e: React.WheelEvent) => {
    if (playMode) {
      // In play mode, let Spline handle its own zoom/scroll
      return;
    }
    // Normal mode: don't interfere - let scroll bubble naturally
  }, [playMode]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ 
        zIndex: 0,
        backgroundColor: '#000',
        pointerEvents: playMode ? 'auto' : 'none',
        touchAction: playMode ? 'none' : 'pan-y',
        cursor: playMode ? 'grab' : 'default',
      }}
      onMouseDown={handleSplineMouseDown}
      onTouchStart={handleSplineMouseDown}
      onMouseEnter={handleSplineMouseEnter}
      onMouseMove={handleSplineMouseEnter}
      onMouseLeave={() => {}}
      onTouchEnd={() => {}}
      onWheel={handleContainerWheel}
    >
      {/* Animated gradient fallback - fast fade once Spline is ready */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), #000',
          opacity: hasError || !isLoaded ? 1 : 0,
          transition: 'opacity 200ms ease-out',
          zIndex: -1,
        }}
      />

      {/* Spline 3D Scene - Interactive Wrapper */}
      {!hasError && (
        <div
          ref={splineWrapperRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: playMode ? 'auto' : 'none',
            touchAction: playMode ? 'none' : 'pan-y',
            zIndex: 1,
          }}
        >
          <Spline
            scene={SPLINE_SCENE}
            onLoad={handleLoad}
            onError={handleError}
            style={splineStyle as React.CSSProperties}
          />
        </div>
      )}

      {/* Color-kill overlay - grayscale effect */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          backgroundColor: grayscale ? '#808080' : 'transparent',
          mixBlendMode: grayscale ? 'color' : 'normal',
          WebkitMixBlendMode: grayscale ? 'color' : 'normal',
          pointerEvents: 'none',
          transition: 'background-color 400ms ease-out',
        } as React.CSSProperties}
      />
    </div>
  );
});

// ============================================================================
// 3D TOGGLE BUTTON - Activates Spline Background
// ============================================================================
const Toggle3DButton = ({ 
  isActive, 
  onClick 
}: { 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    onClick={() => { SoundEffects.click(); onClick(); }}
    className="group relative z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl overflow-hidden
               border transition-all duration-300"
    style={{
      background: isActive 
        ? 'linear-gradient(135deg, rgba(25, 86, 180, 0.3) 0%, rgba(25, 86, 180, 0.1) 100%)' 
        : 'rgba(255, 255, 255, 0.05)',
      borderColor: isActive ? 'rgba(25, 86, 180, 0.5)' : 'rgba(255, 255, 255, 0.2)',
      boxShadow: isActive 
        ? '0 0 30px rgba(25, 86, 180, 0.3), inset 0 0 20px rgba(25, 86, 180, 0.1)' 
        : 'none',
    }}
    whileHover={{ 
      scale: 1.05,
      boxShadow: '0 0 40px rgba(25, 86, 180, 0.4), inset 0 0 25px rgba(25, 86, 180, 0.15)',
    }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20, rotateX: 45 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ 
      type: 'spring', 
      damping: 20, 
      stiffness: 300,
      delay: 1.5 
    }}
  >
    {/* 3D depth effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }}
    />
    
    {/* Shimmer effect */}
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: isActive ? ['-200%', '200%'] : '-200%' }}
      transition={{ 
        duration: 2, 
        repeat: isActive ? Infinity : 0, 
        ease: 'easeInOut',
        repeatDelay: 1 
      }}
    />
    
    {/* Icon with 3D rotation */}
    <motion.div
      animate={{ 
        rotateY: isActive ? [0, 360] : 0,
      }}
      transition={{ 
        duration: 2, 
        repeat: isActive ? Infinity : 0,
        ease: 'linear',
      }}
    >
      <Box 
        className={`w-4 h-4 relative z-10 transition-colors duration-300 ${
          isActive ? 'text-[#1956B4]' : 'text-white/60'
        }`} 
        strokeWidth={2} 
      />
    </motion.div>
    
    <span className={`text-sm font-medium relative z-10 transition-colors duration-300 ${
      isActive ? 'text-white' : 'text-white/60'
    }`}>
      3D
    </span>
    
    {/* Active indicator dot */}
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse relative z-10"
        />
      )}
    </AnimatePresence>
  </motion.button>
);

// ============================================================================
// GRAYSCALE TOGGLE BUTTON - Toggles Color/B&W
// ============================================================================
const ToggleGrayscaleButton = ({ 
  isActive, 
  onClick 
}: { 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    onClick={() => { SoundEffects.click(); onClick(); }}
    className="group relative z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl overflow-hidden
               border transition-all duration-300"
    style={{
      background: isActive 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'linear-gradient(135deg, rgba(25, 86, 180, 0.3) 0%, rgba(25, 86, 180, 0.1) 100%)',
      borderColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(25, 86, 180, 0.5)',
      boxShadow: !isActive 
        ? '0 0 30px rgba(25, 86, 180, 0.3), inset 0 0 20px rgba(25, 86, 180, 0.1)' 
        : 'none',
    }}
    whileHover={{ 
      scale: 1.05,
      boxShadow: '0 0 40px rgba(25, 86, 180, 0.4)',
    }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20, rotateX: 45 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ 
      type: 'spring', 
      damping: 20, 
      stiffness: 300,
      delay: 1.6 
    }}
  >
    {/* 3D depth effect */}
    <motion.div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
        pointerEvents: 'none',
      }}
    />
    
    {/* Shimmer effect when color is on */}
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: !isActive ? ['-200%', '200%'] : '-200%' }}
      transition={{ 
        duration: 2, 
        repeat: !isActive ? Infinity : 0, 
        ease: 'easeInOut',
        repeatDelay: 1 
      }}
    />
    
    {/* Icon */}
    <Palette 
      className={`w-4 h-4 relative z-10 transition-colors duration-300 ${
        !isActive ? 'text-[#1956B4]' : 'text-white/60'
      }`} 
      strokeWidth={2} 
    />
    
    <span className={`text-sm font-medium relative z-10 transition-colors duration-300 ${
      !isActive ? 'text-white' : 'text-white/60'
    }`}>
      {isActive ? 'B&W' : 'Color'}
    </span>
    
    {/* Active indicator dot when color is ON */}
    <AnimatePresence>
      {!isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse relative z-10"
        />
      )}
    </AnimatePresence>
  </motion.button>
);

// ============================================================================
// PLAY WITH SPLINE BUTTON - Appears when user interacts with Spline
// ============================================================================
const PlayWithSplineButton = ({ 
  isVisible, 
  onClick,
  onExit,
  skipHeavyEffects = false
}: { 
  isVisible: boolean;
  onClick: () => void;
  onExit: () => void;
  skipHeavyEffects?: boolean;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="absolute inset-0 z-100 flex items-start justify-center pt-6 md:pt-8 pointer-events-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <motion.button
          onClick={() => { SoundEffects.click(); onClick(); }}
          className={`group relative flex items-center gap-3 px-6 py-3 rounded-2xl overflow-hidden
                     border border-[#1956B4]/50 bg-black/90 pointer-events-auto store-glow-pulse ${skipHeavyEffects ? '' : 'backdrop-blur-xl'}`}
          whileHover={skipHeavyEffects ? { scale: 1.05 } : { 
            scale: 1.05,
            boxShadow: '0 0 60px rgba(25, 86, 180, 0.6), 0 0 100px rgba(25, 86, 180, 0.3)',
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Shimmer effect - GPU CSS */}
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 store-shimmer-fast"
          />
          
          {/* 3D Icon - GPU CSS */}
          <div style={{ animation: 'store-spin 3s linear infinite' }}>
            <Box className="w-5 h-5 text-[#1956B4]" strokeWidth={2} />
          </div>
          
          <span className="text-white font-semibold text-base tracking-wide relative z-10">
            Play with Spline
          </span>
          
          {/* Pulsing dot - GPU CSS */}
          <div
            className="w-2 h-2 rounded-full bg-[#1956B4] store-pulse-dot"
          />
        </motion.button>
        
        {/* Exit button - only shows when in play mode */}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// EXIT SPLINE MODE BUTTON
// ============================================================================
const ExitSplineModeButton = ({ 
  isVisible, 
  onClick,
  skipHeavyEffects = false
}: { 
  isVisible: boolean;
  onClick: () => void;
  skipHeavyEffects?: boolean;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.button
        onClick={() => { SoundEffects.click(); onClick(); }}
        className={`fixed top-4 left-4 z-100 flex items-center gap-2 px-4 py-2.5 rounded-2xl
                   bg-black/90 border border-white/20 hover:border-white/40
                   transition-colors ${skipHeavyEffects ? '' : 'backdrop-blur-xl'}`}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <X className="w-4 h-4 text-white/70" strokeWidth={2} />
        <span className="text-white/80 text-sm font-medium">Exit Spline Mode</span>
      </motion.button>
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN STORE HERO COMPONENT
// ============================================================================
export function StoreHero3D({ paused = false }: { paused?: boolean }) {
  const isProd = process.env.NODE_ENV === 'production';
  const autoLoad3D = !isProd || process.env.NEXT_PUBLIC_STORE_AUTO_3D === 'true';
  const enableLiveCrypto = !isProd || process.env.NEXT_PUBLIC_STORE_LIVE_CRYPTO === 'true';
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [floatingProducts, setFloatingProducts] = useState<FloatingProduct[]>([]);
  const [show3DBackground, setShow3DBackground] = useState(() => {
    // Initialize to true for desktop (SSR-safe check)
    if (typeof window === 'undefined') return false;
    if (!autoLoad3D) return false;
    return window.innerWidth >= 768;
  });
  const [showGrayscale, setShowGrayscale] = useState(false);
  
  // Performance optimization
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  const enableParticles = !isProd && !shouldSkipHeavyEffects;
  
  // Mobile performance: Track if hero section is in viewport
  const [isHeroInView, setIsHeroInView] = useState(true);
  
  // Spline interaction states
  const [showPlayWithSpline, setShowPlayWithSpline] = useState(false);
  const [isSplinePlayMode, setIsSplinePlayMode] = useState(false);
  const [userInteractedWithSpline, setUserInteractedWithSpline] = useState(false);
  const splineInteractionTimer = useRef<NodeJS.Timeout | null>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const hoverDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Floating product card interaction state
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [isInteractingWithProduct, setIsInteractingWithProduct] = useState(false);
  
  // Content fade cycle for visibility (0-100 opacity every 5 seconds)
  const [contentOpacity, setContentOpacity] = useState(1);
  
  // Products Modal UI state
  const { setIsOpen: openProductsModal } = useProductsModalUI();
  
  // Handle Spline click interaction (immediate trigger)
  const handleSplineInteraction = useCallback(() => {
    if (!userInteractedWithSpline && !isSplinePlayMode) {
      setUserInteractedWithSpline(true);
      setShowPlayWithSpline(true);
      
      // Clear idle timer since user clicked
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
      
      // Auto-hide the button after 8 seconds if not clicked
      if (splineInteractionTimer.current) {
        clearTimeout(splineInteractionTimer.current);
      }
      splineInteractionTimer.current = setTimeout(() => {
        if (!isSplinePlayMode) {
          setShowPlayWithSpline(false);
        }
      }, 8000);
    }
  }, [userInteractedWithSpline, isSplinePlayMode]);
  
  // Handle Spline hover interaction (debounced trigger)
  const handleSplineHover = useCallback(() => {
    if (userInteractedWithSpline || isSplinePlayMode) return;
    
    // Debounce hover - only trigger after hovering for 2 seconds
    if (hoverDebounceTimer.current) {
      clearTimeout(hoverDebounceTimer.current);
    }
    hoverDebounceTimer.current = setTimeout(() => {
      if (!userInteractedWithSpline && !isSplinePlayMode) {
        setUserInteractedWithSpline(true);
        setShowPlayWithSpline(true);
        
        // Clear idle timer since user is hovering
        if (idleTimer.current) {
          clearTimeout(idleTimer.current);
          idleTimer.current = null;
        }
        
        // Auto-hide the button after 8 seconds if not clicked
        if (splineInteractionTimer.current) {
          clearTimeout(splineInteractionTimer.current);
        }
        splineInteractionTimer.current = setTimeout(() => {
          if (!isSplinePlayMode) {
            setShowPlayWithSpline(false);
          }
        }, 8000);
      }
    }, 2000);
  }, [userInteractedWithSpline, isSplinePlayMode]);
  
  // Handle floating product card interaction start
  const handleProductInteractionStart = useCallback((productId: number) => {
    setExpandedProductId(productId);
    setIsInteractingWithProduct(true);
    setContentOpacity(1); // Force full opacity
    
    // Clear all Spline-related timers
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (hoverDebounceTimer.current) clearTimeout(hoverDebounceTimer.current);
    if (splineInteractionTimer.current) clearTimeout(splineInteractionTimer.current);
  }, []);
  
  // Handle floating product card interaction end
  const handleProductInteractionEnd = useCallback(() => {
    setExpandedProductId(null);
    setIsInteractingWithProduct(false);
  }, []);
  
  // Enter Spline play mode - hide everything
  const enterSplinePlayMode = useCallback(() => {
    setIsSplinePlayMode(true);
    setShowPlayWithSpline(false);
    // Clear all timers
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (hoverDebounceTimer.current) clearTimeout(hoverDebounceTimer.current);
    if (splineInteractionTimer.current) clearTimeout(splineInteractionTimer.current);
  }, []);
  
  // Exit Spline play mode - show everything again
  const exitSplinePlayMode = useCallback(() => {
    setIsSplinePlayMode(false);
    setUserInteractedWithSpline(false);
    // Clear all timers
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (hoverDebounceTimer.current) clearTimeout(hoverDebounceTimer.current);
    if (splineInteractionTimer.current) clearTimeout(splineInteractionTimer.current);
  }, []);
  
  // Content fade cycle effect (5 second intervals) - paused when interacting with product or component paused
  // PERF: Skip on mobile — the opacity state updates every 5s cause unnecessary re-renders
  useEffect(() => {
    if (isProd || isSplinePlayMode || isInteractingWithProduct || paused || isMobile) return; // Don't fade when paused, in prod, or on mobile
    
    const fadeCycle = () => {
      // Fade out over 2.5s, then fade in over 2.5s
      setContentOpacity(0);
      setTimeout(() => {
        setContentOpacity(1);
      }, 2500);
    };
    
    // Start fade cycle every 5 seconds
    const interval = setInterval(fadeCycle, 5000);
    
    return () => clearInterval(interval);
  }, [isSplinePlayMode, isInteractingWithProduct, paused, isMobile]);
  
  // Idle timer effect - show "Play with Spline" after 12 seconds of no clicks/hovers
  useEffect(() => {
    if (isSplinePlayMode || userInteractedWithSpline || paused) return;
    
    // Start idle timer when component mounts
    idleTimer.current = setTimeout(() => {
      if (!userInteractedWithSpline && !isSplinePlayMode) {
        setUserInteractedWithSpline(true);
        setShowPlayWithSpline(true);
        
        // Auto-hide after 8 seconds
        if (splineInteractionTimer.current) {
          clearTimeout(splineInteractionTimer.current);
        }
        splineInteractionTimer.current = setTimeout(() => {
          if (!isSplinePlayMode) {
            setShowPlayWithSpline(false);
          }
        }, 8000);
      }
    }, 12000); // 12 seconds idle
    
    return () => {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
    };  
  }, [isSplinePlayMode, userInteractedWithSpline, paused]);

  // Fetch VIP products from Supabase
  const fetchVipProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/store/vip');
      if (!res.ok) throw new Error('Failed to load VIP tiers');
      const json = await res.json();
      
      const vipData: VipProduct[] = (json.data || [])
        .filter((item: any) => item.visible !== false)
        .slice(0, 5); // Max 5 cards
      
      // Merge VIP data with card positions
      const products: FloatingProduct[] = vipData.map((vip, idx) => ({
        id: idx + 1,
        ...CARD_POSITIONS[idx % CARD_POSITIONS.length],
        delay: idx * 0.2,
        vipData: vip,
      }));
      
      setFloatingProducts(products);
    } catch (error) {
      console.error('Failed to fetch VIP products:', error);
      // Fallback to positions without VIP data
      setFloatingProducts(CARD_POSITIONS.map((pos, idx) => ({ id: idx + 1, ...pos })));
    }
  }, []);

  // Fetch real crypto prices from Binance
  const fetchCryptoPrices = useCallback(async () => {
    try {
      const responses = await Promise.all(
        CRYPTO_SYMBOLS.map(symbol =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
            .then(res => res.json())
            .catch(() => null)
        )
      );

      const prices: CryptoPrice[] = responses
        .filter(Boolean)
        .map((data: any) => ({
          symbol: data.symbol,
          price: parseFloat(data.lastPrice),
          change24h: parseFloat(data.priceChangePercent),
          isUp: parseFloat(data.priceChangePercent) >= 0,
        }));

      setCryptoPrices(prices);
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
    }
  }, []);

  // Handle mouse movement for parallax
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || isMobile) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, isMobile]);

  useEffect(() => {
    setIsVisible(true);
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    
    // Mobile Scroll Performance Optimization
    // Use Intersection Observer to detect when hero leaves viewport
    let observer: IntersectionObserver | null = null;
    if (mobile && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Hero is in view when intersecting
            setIsHeroInView(entry.isIntersecting);
            
            // Log for debugging
            if (!entry.isIntersecting) {
              console.log('[StoreHero3D] Mobile: Hero scrolled out of view - pausing Spline');
            } else {
              console.log('[StoreHero3D] Mobile: Hero in view - resuming Spline');
            }
          });
        },
        {
          threshold: 0.1, // Trigger when 10% of hero is visible
          rootMargin: '0px',
        }
      );
      
      observer.observe(containerRef.current);
    }
    
    // Smart 3D Background Loading Strategy
    // Desktop: Load immediately (scene already preloaded at module level)
    // Mobile: Minimal delay then load to reduce perceived latency
    let splineLoadTimer: NodeJS.Timeout | undefined;
    
    if (!mobile) {
      // Desktop - immediate load (runtime + scene already pre-warmed)
      if (autoLoad3D) setShow3DBackground(true);
    } else {
      // Mobile - load immediately once the tab is visible
      if (document.visibilityState === 'visible') {
        if (autoLoad3D) setShow3DBackground(true);
      } else {
        const onVisible = () => {
          if (document.visibilityState === 'visible') {
            if (autoLoad3D) setShow3DBackground(true);
            document.removeEventListener('visibilitychange', onVisible);
          }
        };
        document.addEventListener('visibilitychange', onVisible);
      }
    }
    
    // Fetch VIP products and crypto prices on mount
    // PERF: Mobile uses 30s polling vs 15s desktop
    fetchVipProducts();
    if (enableLiveCrypto && !paused) fetchCryptoPrices();
    const cryptoInterval = mobile ? 30000 : 15000;
    const priceInterval = (!enableLiveCrypto || paused) ? null : setInterval(fetchCryptoPrices, cryptoInterval);
    
    // Show promo popup after 3 seconds (once per hour)
    // For testing: Clear localStorage.removeItem('store_promo_seen') to reset
    const promoSeenKey = 'store_promo_seen';
    let promoTimer: NodeJS.Timeout | undefined;
    
    try {
      const lastSeenTime = localStorage.getItem(promoSeenKey);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const shouldShowPromo = !lastSeenTime || parseInt(lastSeenTime) < oneHourAgo;
      
      console.log('[StoreHero3D] 🎉 Promo check:', { 
        lastSeenTime, 
        lastSeenDate: lastSeenTime ? new Date(parseInt(lastSeenTime)).toISOString() : 'never',
        shouldShowPromo, 
        isMobile: mobile,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'ssr'
      });
      
      if (shouldShowPromo) {
        console.log('[StoreHero3D] ⏰ Setting promo timer for 3 seconds...');
        promoTimer = setTimeout(() => {
          console.log('[StoreHero3D] ✨ SHOWING PROMO POPUP NOW - isMobile:', mobile);
          setShowPromo(true);
          try {
            localStorage.setItem(promoSeenKey, Date.now().toString());
            console.log('[StoreHero3D] 💾 Saved timestamp to localStorage');
          } catch (e) {
            console.error('[StoreHero3D] ❌ Failed to set localStorage:', e);
          }
        }, 3000);
      } else {
        const timeUntilNextShow = parseInt(lastSeenTime || '0') + (60 * 60 * 1000) - Date.now();
        const minutesRemaining = Math.ceil(timeUntilNextShow / 60000);
        console.log('[StoreHero3D] ⏳ Promo not showing - seen recently. Will show again in', minutesRemaining, 'minutes');
      }
    } catch (e) {
      // If localStorage fails (private browsing, etc), show popup anyway
      console.warn('[StoreHero3D] ⚠️ localStorage error, showing promo anyway:', e);
      promoTimer = setTimeout(() => {
        console.log('[StoreHero3D] ✨ SHOWING PROMO POPUP (localStorage fallback)');
        setShowPromo(true);
      }, 3000);
    }
    
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Smart resize behavior:
      // - If switching TO mobile: only disable 3D if already loaded (don't interfere with delayed loading)
      // - If switching TO desktop: enable 3D immediately
      if (mobile && show3DBackground) {
        // User resized to mobile while Spline was showing - disable it
        setShow3DBackground(false);
      } else if (!mobile && !show3DBackground && autoLoad3D) {
        // User resized to desktop - enable immediately
        setShow3DBackground(true);
      }
      // Don't interfere with mobile delayed loading (when mobile && !show3DBackground)
    };
    window.addEventListener('resize', handleResize);
    if (!paused) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (priceInterval) clearInterval(priceInterval);
      if (promoTimer) clearTimeout(promoTimer);
      if (splineLoadTimer) clearTimeout(splineLoadTimer);
      if (splineInteractionTimer.current) clearTimeout(splineInteractionTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (hoverDebounceTimer.current) clearTimeout(hoverDebounceTimer.current);
      // Cleanup intersection observer
      if (observer && containerRef.current) {
        observer.unobserve(containerRef.current);
        observer.disconnect();
      }
    };
  }, [autoLoad3D, enableLiveCrypto, fetchCryptoPrices, fetchVipProducts, handleMouseMove, paused]);

  // Generate particles — fewer on mobile for better perf
  const particleCount = enableParticles ? (isMobile ? 8 : 20) : 0;
  const particles = useMemo(() => 
    Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    })), 
  [particleCount]);

  return (
    <>
      {/* Promo Code Popup */}
      <PromoCodePopup isOpen={showPromo} onClose={() => setShowPromo(false)} />
      
      {/* Exit Spline Mode Button - stays fixed so user can always exit */}
      <ExitSplineModeButton 
        isVisible={isSplinePlayMode} 
        onClick={exitSplinePlayMode} 
      />

      <section 
        ref={containerRef}
        className="relative h-screen md:h-[80vh] lg:h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ 
          perspective: '1000px', 
          touchAction: 'pan-y',
          contain: 'layout style paint',      // PERF: Isolate layout/paint to this subtree
          contentVisibility: 'auto' as any,   // PERF: Skip rendering when off-screen
          containIntrinsicSize: '0 100vh',    // Hint for content-visibility sizing
        }}
      >
        {/* === BACKGROUND LAYERS === */}
        
        {/* Play with Spline Button - positioned within hero only - Desktop only */}
        {!isMobile && (
          <PlayWithSplineButton 
            isVisible={showPlayWithSpline && !isSplinePlayMode} 
            onClick={enterSplinePlayMode}
            onExit={exitSplinePlayMode}
          />
        )}
        
        {/* Toggle Buttons - Top Right - Hide in Spline play mode and on mobile */}
        <AnimatePresence>
          {!isSplinePlayMode && !isMobile && (
            <motion.div 
              className="absolute top-4 right-4 z-700 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ pointerEvents: 'auto' }}
            >
              {/* Grayscale Toggle - only show when 3D is active */}
              {show3DBackground && (
                <ToggleGrayscaleButton 
                  isActive={showGrayscale} 
                  onClick={() => setShowGrayscale(!showGrayscale)} 
                />
              )}
              <Toggle3DButton 
                isActive={show3DBackground} 
                onClick={() => setShow3DBackground(!show3DBackground)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Conditional Background: Spline 3D or Plain Black */}
        <AnimatePresence mode="wait">
          {/* Mobile: Hide Spline when out of view for performance */}
          {/* Desktop: Always show if enabled */}
          {show3DBackground && (!isMobile || isHeroInView) ? (
            <motion.div
              key="spline-bg"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SplineBackground grayscale={showGrayscale} onInteraction={handleSplineInteraction} onHover={handleSplineHover} playMode={isSplinePlayMode} />
            </motion.div>
          ) : (
            <motion.div
              key="plain-bg"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Full black background */}
              <div className="absolute inset-0 bg-black" />
        
              {/* Animated mesh gradient - Subtle TrueBlue Theme */}
              <div className="absolute inset-0 opacity-30">
                <GradientOrb 
                  className="top-0 left-1/4" 
                  color1="#1956B4" 
                  color2="#0a2d5c" 
                  size="60vw" 
                  delay={0}
                />
                <GradientOrb 
                  className="bottom-0 right-1/4" 
                  color1="#1956B4" 
                  color2="#0a2d5c" 
                  size="50vw" 
                  delay={2}
                />
                <GradientOrb 
                  className="top-1/3 right-0" 
                  color1="#1956B4" 
                  color2="#0a2d5c" 
                  size="40vw" 
                  delay={4}
                />
              </div>

              {/* Noise texture overlay */}
              <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Trading grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(25, 86, 180, 0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(25, 86, 180, 0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating particles - always visible */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(p => (
            <Particle key={p.id} delay={p.delay} duration={p.duration} />
          ))}
        </div>

        {/* === 3D FLOATING PRODUCTS - Real VIP Data === */}
        {/* Visible on all devices - Hide only in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && floatingProducts.length > 0 && (
            <motion.div 
              className="absolute inset-0 pointer-events-none"
              style={{ touchAction: 'pan-y' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isInteractingWithProduct ? 1 : contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {floatingProducts.map(product => (
                <FloatingProductCard 
                  key={product.id} 
                  product={product} 
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isExpanded={expandedProductId === product.id}
                  onInteractionStart={() => handleProductInteractionStart(product.id)}
                  onInteractionEnd={handleProductInteractionEnd}
                  onCardClick={() => openProductsModal(true)}
                  skipParallax={isMobile}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === CONTENT === */}
        {/* Hide content in Spline play mode, fade with opacity cycle */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="relative z-500 text-center px-4 max-w-3xl mx-auto"
              style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? (isInteractingWithProduct ? 1 : contentOpacity) : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
          {/* Main Headline - Clean & Simple */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 md:mb-8"
          >
            <TextType
              text={["BullMoney"]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              loop={false}
              cursorBlinkDuration={0.5}
              className="text-white"
            />
          </motion.h1>

          {/* Single CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-600 pointer-events-auto"
            style={{ isolation: 'isolate' }}
          >
            <motion.button
              onClick={() => { SoundEffects.click(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
              className="group relative px-8 py-4 rounded-2xl bg-black text-white font-medium overflow-hidden
                       border border-white/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] pointer-events-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Shop now"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold tracking-wide">
                <ShoppingBag className="w-4 h-4" />
                <span>SHOP NOW</span>
              </span>
              {/* Continuous shimmer effect */}
              {/* Continuous shimmer effect - GPU CSS */}
              <div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-12 store-shimmer-fast"
                aria-hidden="true"
              />
            </motion.button>
          </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === BOTTOM EFFECTS === */}
        
        {/* Chrome edge line - White - Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
        
        {/* Fade to black - Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* Scroll indicator - Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 * contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs text-white/60 uppercase tracking-widest">Scroll</span>
              <div
                className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1 store-opacity-pulse"
              >
                <div
                  className="w-1 h-2 rounded-full bg-[#1956B4]/60 store-scroll-bounce"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}

export default StoreHero3D;
