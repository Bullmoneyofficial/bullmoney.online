'use client';

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, ArrowRight, Zap, Star, TrendingUp, TrendingDown, Copy, Check, X, Gift, Box, Palette } from 'lucide-react';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import dynamic from 'next/dynamic';

// Dynamic import for Spline (heavy 3D component)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

// Spline scene URL
const SPLINE_SCENE = '/scene1.splinecode';

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

// Default card positions (will be merged with real VIP data) - LARGER SCALES like crypto planets
const CARD_POSITIONS = [
  { x: 12, y: 18, z: 100, rotateX: -15, rotateY: 25, scale: 1.0, delay: 0, glow: BLUE_THEME.primary },
  { x: 78, y: 12, z: 80, rotateX: 10, rotateY: -20, scale: 0.85, delay: 0.2, glow: BLUE_THEME.secondary },
  { x: 88, y: 55, z: 120, rotateX: -5, rotateY: 15, scale: 0.95, delay: 0.4, glow: BLUE_THEME.accent },
  { x: 8, y: 62, z: 60, rotateX: 20, rotateY: -10, scale: 0.8, delay: 0.6, glow: BLUE_THEME.primary },
  { x: 50, y: 78, z: 90, rotateX: -12, rotateY: 8, scale: 0.75, delay: 0.8, glow: BLUE_THEME.secondary },
];

const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT'];

// USD Formatter
const formatUSD = (value: number) => {
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
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
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const promoCode = 'BULLMONEY15';

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 3D rotation effect
  const applyRotation = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const divisor = 15;
    const x = (clientX - left - width / 2) / divisor;
    const y = (clientY - top - height / 2) / divisor;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    applyRotation(e.clientX, e.clientY);
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    }
  };

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = useCallback(() => {
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
          className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
          style={{ 
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          onClick={handleClose}
        >
          {/* 3D Card Container - Same as ProductCard */}
          <CardContainer className="w-full max-w-md md:max-w-lg" containerClassName="py-0">
            <CardBody className="w-full h-auto p-0">
              <CardItem translateZ="100" className="w-full">
                <HoverBorderGradient
                  containerClassName="rounded-3xl w-full"
                  className="p-0 bg-transparent w-full"
                  as="div"
                >
                  {/* Popup Container - 3D Glassmorphism Style */}
                  <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.95, y: 20, rotateX: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ 
                      type: 'spring', 
                      damping: 25, 
                      stiffness: 300,
                      mass: 0.8
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full overflow-hidden"
                    style={{
                      background: 'rgba(0, 0, 0, 0.95)',
                      borderRadius: '24px',
                      boxShadow: '0 30px 80px -10px rgba(0, 0, 0, 0.8), 0 0 60px rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    {/* Animated Shimmer Border */}
                    <div className="absolute inset-0 rounded-3xl p-[1px] overflow-hidden z-[1] pointer-events-none">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                        style={{ width: '100%', filter: 'blur(20px)' }}
                        animate={{
                          x: ['-50%', '50%'],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <div className="absolute inset-[1px] bg-transparent rounded-3xl" />
                    </div>
                    
                    {/* Static White Border */}
                    <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none z-[2]" />
                    
                    {/* Gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent z-10 pointer-events-none rounded-3xl" />

              {/* Content */}
              <div className="relative p-8 md:p-14 md:py-20 z-20" style={{ transform: 'translateZ(50px)' }}>
                {/* Close button - 3D Glassmorphism style */}
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur-sm transition-all hover:bg-white/20 z-50 pointer-events-auto cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(60px)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-white/70 hover:text-white transition-colors pointer-events-none" strokeWidth={2} />
                </motion.button>

                {/* Icon - Blue gradient with shimmer */}
                <motion.div
                  className="relative w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, rgb(25, 86, 180), #3b82f6)',
                    transform: 'translateZ(70px)',
                    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)'
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  {/* Shimmer effect on icon */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 1,
                    }}
                  />
                  <Gift className="w-7 h-7 text-white relative z-10" strokeWidth={2} />
                </motion.div>

                {/* Title */}
                <motion.h3 
                  className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight text-white"
                  style={{ transform: 'translateZ(60px)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  Exclusive Offer
                </motion.h3>
                
                <motion.p 
                  className="text-center mb-8 leading-relaxed text-white/60 text-lg"
                  style={{ transform: 'translateZ(55px)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Get 15% off your first order with this code
                </motion.p>

                {/* Promo Code Box - Glassmorphism */}
                <motion.div 
                  className="relative mb-8"
                  style={{ transform: 'translateZ(65px)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    {/* Shimmer border */}
                    <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden z-[1] pointer-events-none">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        style={{ width: '100%', filter: 'blur(20px)' }}
                        animate={{
                          x: ['-50%', '50%'],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                    
                    <div 
                      className="relative flex items-center justify-between gap-3 p-5 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopy();
                      }}
                    >
                      <div className="flex-1 pointer-events-none">
                        <p className="text-xs font-medium mb-1.5 tracking-wide uppercase text-white/40">
                          Promo Code
                        </p>
                        <p className="text-2xl md:text-3xl font-mono font-bold tracking-wider text-white"
                          style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                        >
                          {promoCode}
                        </p>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopy();
                        }}
                        className="relative w-12 h-12 flex items-center justify-center rounded-full overflow-hidden z-50 pointer-events-auto cursor-pointer"
                        style={{
                          background: copied ? 'rgb(25, 86, 180)' : 'rgba(255, 255, 255, 0.1)',
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                          animate={{
                            x: ['-200%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                            repeatDelay: 2,
                          }}
                        />
                        <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none" />
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                              className="pointer-events-none"
                            >
                              <Check className="w-5 h-5 text-white pointer-events-none" strokeWidth={2.5} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="pointer-events-none"
                            >
                              <Copy className="w-5 h-5 text-white/70 pointer-events-none" strokeWidth={2} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Copied feedback */}
                  <AnimatePresence>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute -bottom-7 left-0 right-0 text-center text-sm font-medium text-white"
                      >
                        ✓ Copied to clipboard
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* CTA Button - Blue gradient with shimmer - Mobile only */}
                <motion.div 
                  className="relative overflow-hidden rounded-2xl md:hidden"
                  style={{ transform: 'translateZ(70px)' }}
                >
                  {/* Shimmer border */}
                  <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden z-[1] pointer-events-none">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                      style={{ width: '100%', filter: 'blur(20px)' }}
                      animate={{
                        x: ['-50%', '50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="relative w-full py-4 rounded-2xl font-bold text-white text-lg transition-all border border-white/20 z-50 pointer-events-auto cursor-pointer"
                    style={{ 
                      background: 'linear-gradient(135deg, rgb(25, 86, 180), #3b82f6)',
                      boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: '0 15px 50px rgba(59, 130, 246, 0.5)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    {/* Button shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl pointer-events-none"
                      animate={{
                        x: ['-200%', '200%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        repeatDelay: 1,
                      }}
                    />
                    <span className="relative z-10 pointer-events-none">Start Shopping</span>
                  </motion.button>
                </motion.div>

                <motion.p 
                  className="text-center mt-6 text-white/40 text-sm md:hidden"
                  style={{ transform: 'translateZ(50px)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  Valid for new customers only. Expires in 24 hours.
                </motion.p>
              </div>
            </motion.div>
                </HoverBorderGradient>
              </CardItem>
            </CardBody>
          </CardContainer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ============================================================================
// LIVE CRYPTO TICKER
// ============================================================================
const CryptoTicker = ({ prices }: { prices: CryptoPrice[] }) => {
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
            {Math.abs(crypto.change24h).toFixed(2)}%
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================================
// ANIMATED PARTICLE
// ============================================================================
const Particle = ({ delay, duration }: { delay: number; duration: number }) => {
  const size = Math.random() * 4 + 2;
  const startX = Math.random() * 100;
  const startY = Math.random() * 100;
  
  return (
    <motion.div
      className="absolute rounded-full bg-[#1956B4]/30"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0, 1.5, 0],
        y: [0, -100],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
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
}: { 
  product: FloatingProduct;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  isExpanded?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onCardClick?: () => void;
}) => {
  const parallaxX = useTransform(mouseX, [0, 1], [-30 * (product.z / 100), 30 * (product.z / 100)]);
  const parallaxY = useTransform(mouseY, [0, 1], [-20 * (product.z / 100), 20 * (product.z / 100)]);
  
  const springX = useSpring(parallaxX, { stiffness: 100, damping: 30 });
  const springY = useSpring(parallaxY, { stiffness: 100, damping: 30 });

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
      whileHover={{ scale: product.scale * 1.15 }}
    >
      <motion.div
        className="relative"
        animate={isExpanded ? {} : {
          y: [0, -15, 0],
          rotateZ: [-2, 2, -2],
        }}
        transition={{
          duration: 6 + product.delay * 2,
          repeat: isExpanded ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Blue glow effect */}
        <div 
          className="absolute inset-0 opacity-50 rounded-3xl"
          style={{ 
            background: `radial-gradient(circle, ${product.glow} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
        
        {/* Product card with TrueBlue theme - MOBILE ENLARGED like crypto planets */}
        <div 
          className="relative w-32 h-40 sm:w-36 sm:h-44 md:w-32 md:h-44 lg:w-40 lg:h-52 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 86, 180, 0.15) 0%, rgba(25, 86, 180, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: `
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
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-[1]" />
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
                className="w-6 h-6 md:w-10 md:h-10 text-[#1956B4]/40" 
                strokeWidth={1}
              />
            </div>
          )}
          
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 4,
              ease: 'easeInOut',
            }}
          />
          
          {/* Price tag with real data */}
          <div className="absolute bottom-2 left-2 right-2 px-2 py-1.5 rounded-lg bg-black/80 border border-white/10 z-[2]">
            <div className="text-[7px] md:text-[9px] text-white/80 truncate font-medium">{productName}</div>
            <div className="text-[10px] md:text-xs text-white font-bold">{formatUSD(productPrice)}</div>
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
  <motion.div
    className={`absolute rounded-full opacity-40 ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 70%)`,
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.25, 0.4, 0.25],
      x: [0, 30, 0],
      y: [0, -20, 0],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
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
}: { 
  grayscale?: boolean;
  onInteraction?: () => void;
  onHover?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const splineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const splineWrapperRef = useRef<HTMLDivElement>(null);

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
    
    // Handle wheel events - scroll page instead of Spline zoom
    const handleWheel = (e: WheelEvent) => {
      // Don't prevent default - let the scroll happen naturally
      // But stop the event from reaching Spline's internal handlers
      e.stopPropagation();
      // Scroll the page instead
      window.scrollBy({ top: e.deltaY, behavior: 'auto' });
    };
    
    // Ensure canvas can receive pointer events
    canvas.style.pointerEvents = 'auto';
    canvas.style.touchAction = 'manipulation';
    
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
    };
  }, [isLoaded, onInteraction, onHover]);

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

  // Handle wheel events on the container - allow page scrolling
  const handleContainerWheel = useCallback((e: React.WheelEvent) => {
    // Allow natural scrolling by not preventing default
    // Just ensure the scroll happens
    e.stopPropagation();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ 
        zIndex: 0,
        backgroundColor: '#000',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        cursor: 'grab',
      }}
      onMouseDown={handleSplineMouseDown}
      onTouchStart={handleSplineMouseDown}
      onMouseEnter={handleSplineMouseEnter}
      onMouseMove={handleSplineMouseEnter}
      onMouseLeave={() => {}}
      onTouchEnd={() => {}}
      onWheel={handleContainerWheel}
    >
      {/* Animated gradient fallback */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), #000',
          opacity: hasError || !isLoaded ? 1 : 0,
          transition: 'opacity 500ms ease-out',
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
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            zIndex: 1,
          }}
        >
          <Spline
            scene={SPLINE_SCENE}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              opacity: isLoaded ? 1 : 0.6,
              transition: 'opacity 400ms ease-out, filter 400ms ease-out',
              filter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
              WebkitFilter: grayscale ? 'grayscale(100%) saturate(0) contrast(1.1)' : 'none',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              zIndex: 1,
          } as React.CSSProperties}
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
    onClick={onClick}
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
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
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
    onClick={onClick}
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
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
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
  onExit
}: { 
  isVisible: boolean;
  onClick: () => void;
  onExit: () => void;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <motion.button
          onClick={onClick}
          className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl overflow-hidden
                     border border-[#1956B4]/50 bg-black/90 backdrop-blur-xl pointer-events-auto"
          style={{
            boxShadow: '0 0 40px rgba(25, 86, 180, 0.4), 0 0 80px rgba(25, 86, 180, 0.2)',
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 0 60px rgba(25, 86, 180, 0.6), 0 0 100px rgba(25, 86, 180, 0.3)',
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              '0 0 40px rgba(25, 86, 180, 0.4), 0 0 80px rgba(25, 86, 180, 0.2)',
              '0 0 60px rgba(25, 86, 180, 0.6), 0 0 100px rgba(25, 86, 180, 0.3)',
              '0 0 40px rgba(25, 86, 180, 0.4), 0 0 80px rgba(25, 86, 180, 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
          />
          
          {/* 3D Icon */}
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Box className="w-5 h-5 text-[#1956B4]" strokeWidth={2} />
          </motion.div>
          
          <span className="text-white font-semibold text-base tracking-wide relative z-10">
            Play with Spline
          </span>
          
          {/* Pulsing dot */}
          <motion.div
            className="w-2 h-2 rounded-full bg-[#1956B4]"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
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
  onClick 
}: { 
  isVisible: boolean;
  onClick: () => void;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.button
        onClick={onClick}
        className="fixed top-4 left-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-2xl
                   bg-black/90 backdrop-blur-xl border border-white/20 hover:border-white/40
                   transition-colors"
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
export function StoreHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [floatingProducts, setFloatingProducts] = useState<FloatingProduct[]>([]);
  const [show3DBackground, setShow3DBackground] = useState(true);
  const [showGrayscale, setShowGrayscale] = useState(false);
  
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
  
  // Content fade cycle effect (5 second intervals) - paused when interacting with product
  useEffect(() => {
    if (isSplinePlayMode || isInteractingWithProduct) return; // Don't fade when in play mode or interacting with product
    
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
  }, [isSplinePlayMode, isInteractingWithProduct]);
  
  // Idle timer effect - show "Play with Spline" after 12 seconds of no clicks/hovers
  useEffect(() => {
    if (isSplinePlayMode || userInteractedWithSpline) return;
    
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
  }, [isSplinePlayMode, userInteractedWithSpline]);

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
    setIsMobile(window.innerWidth < 768);
    
    // Fetch VIP products and crypto prices on mount
    fetchVipProducts();
    fetchCryptoPrices();
    const priceInterval = setInterval(fetchCryptoPrices, 15000);
    
    // Show promo popup after 3 seconds (only if not seen recently)
    const hasSeenPromo = sessionStorage.getItem('store_promo_seen');
    let promoTimer: NodeJS.Timeout | undefined;
    if (!hasSeenPromo) {
      promoTimer = setTimeout(() => {
        setShowPromo(true);
        sessionStorage.setItem('store_promo_seen', 'true');
      }, 3000);
    }
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(priceInterval);
      if (promoTimer) clearTimeout(promoTimer);
      if (splineInteractionTimer.current) clearTimeout(splineInteractionTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (hoverDebounceTimer.current) clearTimeout(hoverDebounceTimer.current);
    };
  }, [handleMouseMove, fetchCryptoPrices, fetchVipProducts]);

  // Generate particles
  const particles = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    })), 
  []);

  return (
    <>
      {/* Promo Code Popup */}
      <PromoCodePopup isOpen={showPromo} onClose={() => setShowPromo(false)} />
      
      {/* Play with Spline Button */}
      <PlayWithSplineButton 
        isVisible={showPlayWithSpline && !isSplinePlayMode} 
        onClick={enterSplinePlayMode}
        onExit={exitSplinePlayMode}
      />
      
      {/* Exit Spline Mode Button */}
      <ExitSplineModeButton 
        isVisible={isSplinePlayMode} 
        onClick={exitSplinePlayMode} 
      />

      <section 
        ref={containerRef}
        className="relative h-[60vh] sm:h-[65vh] md:h-[80vh] lg:h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1000px', pointerEvents: isSplinePlayMode ? 'auto' : 'auto' }}
      >
        {/* === BACKGROUND LAYERS === */}
        
        {/* Toggle Buttons - Top Right - Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="absolute top-4 right-4 z-[700] flex items-center gap-2"
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
          {show3DBackground ? (
            <motion.div
              key="spline-bg"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SplineBackground grayscale={showGrayscale} onInteraction={handleSplineInteraction} onHover={handleSplineHover} />
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
        {/* Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && !isMobile && floatingProducts.length > 0 && (
            <motion.div 
              className="absolute inset-0 pointer-events-none"
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
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile floating elements - LARGER like crypto planets */}
        {/* Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && isMobile && floatingProducts.length > 0 && (
            <motion.div 
              className="absolute inset-0 pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: contentOpacity }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {floatingProducts.slice(0, 3).map((product, idx) => (
              <motion.div
                key={product.id}
                className="absolute rounded-xl overflow-hidden bg-linear-to-br from-[#1956B4]/15 to-[#1956B4]/5 border border-[#1956B4]/20"
                style={{
                  width: '5rem',
                  height: '6.5rem',
                  left: idx === 0 ? '8%' : idx === 1 ? 'auto' : '12%',
                  right: idx === 1 ? '10%' : 'auto',
                  top: idx === 0 ? '15%' : idx === 1 ? '20%' : 'auto',
                  bottom: idx === 2 ? '28%' : 'auto',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 0.7 - (idx * 0.1), 
                  y: [0, -10 + (idx * 2), 0],
                  rotate: [idx % 2 === 0 ? -5 : 5, idx % 2 === 0 ? 5 : -5, idx % 2 === 0 ? -5 : 5],
                }}
                transition={{ duration: 4 + idx, delay: idx * 0.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Product image or fallback */}
                {product.vipData?.image_url || product.vipData?.imageUrl ? (
                  <>
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-[1]" />
                    <img 
                      src={product.vipData.image_url || product.vipData.imageUrl}
                      alt={product.vipData.name || 'Product'}
                      className="absolute inset-0 w-full h-full object-cover object-top opacity-90"
                      loading="lazy"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#1956B4]/10 to-transparent">
                    <ShoppingBag className="w-8 h-8 text-[#1956B4]/40" strokeWidth={1} />
                  </div>
                )}
                {/* Price tag */}
                {product.vipData && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-1 rounded-lg bg-black/80 border border-white/10 z-[2]">
                    <div className="text-[7px] text-white/80 truncate font-medium">{product.vipData.name || 'Product'}</div>
                    <div className="text-[9px] text-white font-bold">{formatUSD(product.vipData.price || 0)}</div>
                  </div>
                )}
              </motion.div>
            ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === CONTENT === */}
        {/* Hide content in Spline play mode, fade with opacity cycle */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="relative z-[500] text-center px-4 max-w-5xl mx-auto pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? (isInteractingWithProduct ? 1 : contentOpacity) : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
          {/* Badge - SEO: Trading Education */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-6 md:mb-8"
            role="banner"
            aria-label="Trading Education Platform"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4 text-[#1956B4]" aria-hidden="true" />
              </motion.div>
              <span className="text-sm text-white font-medium">Premium Trading Education</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#1956B4] animate-pulse" aria-hidden="true" />
            </div>
          </motion.div>

          {/* Main Headline - SEO optimized for trading education */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light tracking-tight mb-4 md:mb-6 overflow-hidden"
          >
            <span className="block text-white">
              Learn to Trade
            </span>
            {/* SEO-friendly subtitle */}
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/60 font-light mt-2">
              Professional Education
            </span>
            {/* Smooth shimmer effect left to right */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              aria-hidden="true"
            />
          </motion.h1>

          {/* Subheadline - SEO: Educational trading services, NO signals */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8 md:mb-10 overflow-hidden"
          >
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
              Master the markets with{' '}
              <span className="text-white relative inline-block">
                expert-led trading courses
                <motion.span
                  className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-white/60 to-white/30"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
              </span>
              {' '}— forex, stocks, crypto education designed to build your skills.
            </p>
            {/* Educational disclaimer - SEO important */}
            <p className="text-xs sm:text-sm text-white/40 mt-3 max-w-lg mx-auto">
              Educational content only • No trading signals • Learn at your own pace
            </p>
            {/* Smooth shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.5 }}
              aria-hidden="true"
            />
          </motion.div>

          {/* CTA Buttons - Trading Education Focus */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[600] flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 md:mb-10 pointer-events-auto"
            role="navigation"
            aria-label="Trading education enrollment options"
            style={{ isolation: 'isolate' }}
          >
            {/* Primary CTA - Start Learning */}
            <motion.button
              onClick={() => openProductsModal(true)}
              className="group relative px-8 py-4 rounded-2xl bg-black text-white font-medium overflow-hidden
                       border border-white/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] pointer-events-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Browse trading courses and VIP membership"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold tracking-wide">
                <span>START LEARNING</span>
              </span>
              {/* Continuous shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                aria-hidden="true"
              />
            </motion.button>

            {/* Secondary CTA - Discount */}
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPromo(true);
              }}
              className="group px-8 py-4 rounded-2xl bg-white/5 border border-white/20 text-white font-medium
                       transition-all duration-300 hover:bg-white/10 hover:border-white/40 pointer-events-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Get 15% discount on trading courses"
            >
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#1956B4]" aria-hidden="true" />
                <span>Get 15% Off</span>
              </span>
            </motion.button>
          </motion.div>

          {/* Live Crypto Prices */}
          {cryptoPrices.length > 0 && <CryptoTicker prices={cryptoPrices} />}

          {/* Trust badges - Education focused */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-6"
            role="list"
            aria-label="Trading education benefits"
          >
            <div className="flex items-center gap-2 text-white/60 text-sm" role="listitem">
              <Zap className="w-4 h-4 text-[#1956B4]" aria-hidden="true" />
              <span>Instant Access</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
            <div className="flex items-center gap-2 text-white/60 text-sm" role="listitem">
              <Star className="w-4 h-4 text-[#1956B4]" aria-hidden="true" />
              <span>Expert Instructors</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
            <div className="flex items-center gap-2 text-white/60 text-sm" role="listitem">
              <span className="w-2 h-2 rounded-full bg-[#1956B4] animate-pulse" aria-hidden="true" />
              <span>Educational Only</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" aria-hidden="true" />
            <div className="flex items-center gap-2 text-white/60 text-sm" role="listitem">
              <TrendingUp className="w-4 h-4 text-[#1956B4]" aria-hidden="true" />
              <span>No Signals</span>
            </div>
          </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === BOTTOM EFFECTS === */}
        
        {/* Chrome edge line - White - Hide in Spline play mode */}
        <AnimatePresence>
          {!isSplinePlayMode && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
              <motion.div
                className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className="w-1 h-2 rounded-full bg-[#1956B4]/60"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}

export default StoreHero3D;
