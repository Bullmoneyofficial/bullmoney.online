'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { ShoppingBag, Heart, X, Wallet } from 'lucide-react';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import CountUp from '@/components/CountUp';
import { CryptoPayButton } from '@/components/shop/CryptoPayButton';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';
import { ProductMediaCarousel } from '@/components/shop/ProductMediaCarousel';
import dynamic from 'next/dynamic';
const FooterComponent = dynamic(() => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })), { ssr: false });
import type { ProductMedia, ProductWithDetails } from '@/types/store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { toast } from 'sonner';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// PULSE ANIMATION FOR HEART ICON
// ============================================================================
const heartPulseStyle = `
@keyframes heartPulseBlue {
  0% {
    filter: drop-shadow(0 0 3px rgba(50,117,248,0.3));
    transform: scale(1);
  }
  15% {
    filter: drop-shadow(0 0 10px rgba(50,117,248,0.8)) drop-shadow(0 0 20px rgba(56,189,248,0.4));
    transform: scale(1.22);
  }
  30% {
    filter: drop-shadow(0 0 4px rgba(50,117,248,0.4));
    transform: scale(0.95);
  }
  45% {
    filter: drop-shadow(0 0 8px rgba(50,117,248,0.7)) drop-shadow(0 0 16px rgba(56,189,248,0.35));
    transform: scale(1.12);
  }
  60%, 100% {
    filter: drop-shadow(0 0 3px rgba(50,117,248,0.3));
    transform: scale(1);
  }
}
@keyframes heartFillCycle {
  0%, 60%, 100% {
    fill: transparent;
    stroke: #3b82f6;
  }
  15%, 45% {
    fill: #3b82f6;
    stroke: #60a5fa;
  }
  30% {
    fill: rgba(59,130,246,0.3);
    stroke: #60a5fa;
  }
}
.heart-pulse-blue {
  animation: heartPulseBlue 1.8s ease-in-out infinite;
}
.heart-pulse-blue path {
  animation: heartFillCycle 1.8s ease-in-out infinite;
}
@keyframes heartLineDash {
  0% {
    stroke-dashoffset: 80;
  }
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes heartLineGlow {
  0%, 60%, 100% {
    opacity: 0.35;
    filter: drop-shadow(0 0 1px rgba(59,130,246,0.2));
  }
  15% {
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(59,130,246,0.9)) drop-shadow(0 0 16px rgba(96,165,250,0.4));
  }
  45% {
    opacity: 0.85;
    filter: drop-shadow(0 0 6px rgba(59,130,246,0.7));
  }
}
@keyframes heartLineThick {
  0%, 60%, 100% {
    stroke-width: 1;
  }
  15% {
    stroke-width: 2;
  }
  45% {
    stroke-width: 1.6;
  }
}
.heart-ecg-line {
  stroke-dasharray: 40;
  stroke-dashoffset: 80;
  animation: heartLineDash 1.8s linear infinite, heartLineGlow 1.8s ease-in-out infinite, heartLineThick 1.8s ease-in-out infinite;
}
`;

// ============================================================================
// PREMIUM CARD CSS — GPU-accelerated, zero JS overhead
// ============================================================================
const premiumCardStyle = `
/* Premium Product Card — GPU Optimized */
.product-card-premium {
  background: linear-gradient(135deg, #0a1628 0%, #0d2147 40%, #102a5a 60%, #0a1628 100%);
  border: 1px solid rgba(50,117,248,0.22);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  transition: transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.5s ease;
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
  contain: layout style;
  touch-action: manipulation;
  position: relative;
}
.product-card-premium:hover {
  transform: translateY(-4px) translateZ(0);
  border-color: rgba(80,160,255,0.5);
  box-shadow:
    0 12px 30px rgba(0,0,0,0.35),
    0 0 20px rgba(50,117,248,0.4),
    0 0 40px rgba(50,117,248,0.15),
    inset 0 1px 0 rgba(120,180,255,0.3);
}
.product-card-premium:active {
  transform: translateY(-2px) scale(0.98) translateZ(0);
  transition-duration: 0.15s;
}

/* Neon top edge */
.neon-edge-top {
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(50,117,248,0.35), rgba(120,180,255,0.5), rgba(50,117,248,0.35), transparent);
  z-index: 2; pointer-events: none;
  transition: all 0.4s ease;
}
.product-card-premium:hover .neon-edge-top {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(80,160,255,0.8), rgba(180,220,255,0.95), rgba(80,160,255,0.8), transparent);
  box-shadow: 0 0 15px rgba(80,160,255,0.7), 0 0 30px rgba(50,117,248,0.3);
}

/* Neon bottom edge */
.neon-edge-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 0; opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(80,160,255,0.6), rgba(160,210,255,0.7), rgba(80,160,255,0.6), transparent);
  z-index: 2; pointer-events: none;
  transition: all 0.4s ease;
}
.product-card-premium:hover .neon-edge-bottom {
  height: 2px; opacity: 1;
  box-shadow: 0 0 15px rgba(80,160,255,0.5);
}

/* Card shine sweep on hover — uses transform for GPU perf, no layout thrash */
@keyframes card-shine-sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.card-shine-sweep {
  position: absolute; top: 0; bottom: 0; left: 0;
  width: 33%;
  transform: translateX(-100%);
  background: linear-gradient(105deg, transparent 0%, rgba(50,117,248,0.04) 20%, rgba(120,180,255,0.15) 50%, rgba(50,117,248,0.04) 80%, transparent 100%);
  z-index: 3; pointer-events: none;
  border-radius: inherit;
}
.product-card-premium:hover .card-shine-sweep {
  animation: card-shine-sweep 0.7s ease-out forwards;
}

/* Image shine sweep — transform-based */
@keyframes card-image-shine-sweep {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
.card-image-shine {
  position: absolute; top: 0; bottom: 0; left: 0;
  width: 30%;
  transform: translateX(-100%);
  background: linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.02) 75%, transparent 100%);
  z-index: 15; pointer-events: none;
}
.product-card-premium:hover .card-image-shine {
  animation: card-image-shine-sweep 0.6s 0.06s ease-out forwards;
}

/* Image border glow */
.card-image-border {
  border: 1px solid rgba(50,117,248,0.1);
  transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.product-card-premium:hover .card-image-border {
  border-color: rgba(80,160,255,0.35);
  box-shadow: inset 0 0 20px rgba(50,117,248,0.1);
}

/* Badge entrance */
@keyframes badge-slide-in {
  from { opacity: 0; transform: translateX(-10px) translateZ(0); }
  to   { opacity: 1; transform: translateX(0) translateZ(0); }
}
.card-badge { animation: badge-slide-in 0.4s ease-out both; }
.card-badge:nth-child(2) { animation-delay: 0.1s; }
.card-badge:nth-child(3) { animation-delay: 0.2s; }

/* Badge shimmer — transform-based, stays inside pill */
@keyframes badge-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(360%); }
}
.badge-shimmer-el {
  animation: badge-shimmer 2.4s linear 0.8s infinite;
  pointer-events: none;
  left: 0 !important;
  width: 28%;
}

/* Heart button CSS */
.heart-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.heart-btn:active {
  transform: scale(0.88);
}
.heart-btn:hover {
  box-shadow: 0 4px 16px rgba(50,117,248,0.4);
}

/* Wrapper */
.product-card-wrapper {
  perspective: 900px;
  z-index: 1;
  position: relative;
}
.product-card-wrapper:hover {
  z-index: 10;
}
/* Desktop: clip glow to card boundary */
@media (min-width: 768px) {
  .product-card-wrapper {
    overflow: clip;
  }
}

/* ── Mobile floating card + neon glow (JS sets --f-dur, --f-del, --f-y, --f-rot) ── */
@keyframes mobile-card-float {
  0%, 100% { transform: translateY(0) rotate(0deg) translateZ(0); }
  50%      { transform: translateY(var(--f-y, -7px)) rotate(var(--f-rot, 0.4deg)) translateZ(0); }
}
@keyframes mobile-neon-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.92) translateZ(0);
    filter: blur(28px);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05) translateZ(0);
    filter: blur(38px);
  }
}
.mobile-neon-glow {
  display: none;
}
@media (max-width: 767px) {
  .product-card-wrapper {
    animation: mobile-card-float var(--f-dur, 4.5s) ease-in-out var(--f-del, 0s) infinite;
    will-change: transform;
    backface-visibility: hidden;
  }
  .mobile-neon-glow {
    display: block;
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: radial-gradient(ellipse at 50% 50%, rgba(50,117,248,0.6) 0%, rgba(30,80,220,0.4) 30%, rgba(20,60,180,0.18) 60%, transparent 100%);
    z-index: 0;
    pointer-events: none;
    animation: mobile-neon-pulse 3s ease-in-out infinite;
    will-change: transform, opacity, filter;
    backface-visibility: hidden;
  }
}
`;

// ============================================================================
// BRAND LOGO SVG COMPONENTS
// ============================================================================

const WhopLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6.5L6.5 17.5L10 9.5L13.5 17.5L18 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20.5" cy="7" r="1.8" fill="currentColor"/>
  </svg>
);

const SkrillLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 8.5C7 8.5 8.5 6 12 6C15.5 6 17 8 17 9.5C17 11 16 12 14 12.5L10 13.5C8 14 7 15 7 16.5C7 18 8.5 20 12 20C15.5 20 17 17.5 17 17.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="12" y1="4" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StripeLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.918 3.757 7.085c0 4.29 2.626 5.635 5.474 6.695 1.886.7 2.552 1.203 2.552 2.012 0 .942-.812 1.481-2.284 1.481-1.844 0-4.606-.838-6.532-2.012L2 20.844C3.766 21.978 6.665 23 9.837 23c2.642 0 4.81-.634 6.345-1.832 1.637-1.276 2.462-3.143 2.462-5.522 0-4.39-2.667-5.735-4.668-6.496z" fill="currentColor"/>
  </svg>
);

// ============================================================================
// PRODUCT CARD - LUXURY GLASS MORPHISM DESIGN
// Mobile-First with Touch-Friendly Interactions
// ============================================================================

interface ProductCardProps {
  product: ProductWithDetails & { media?: ProductMedia[] };
  compact?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, compact = false }: ProductCardProps) {
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  const [isHovered, setIsHovered] = useState(false);

  // Per-instance random float params (stable across renders)
  const floatVars = useMemo(() => ({
    '--f-dur': `${3.8 + Math.random() * 2.4}s`,
    '--f-del': `${Math.random() * 2}s`,
    '--f-y':   `${-(5 + Math.random() * 6)}px`,
    '--f-rot': `${(Math.random() - 0.5) * 1.2}deg`,
  } as React.CSSProperties), []);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [payMethod, setPayMethod] = useState<'whop' | 'skrill' | 'cart' | 'stripe'>('cart');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrolling = useRef(false);
  const { addItem, openCart, getItemCount } = useCartStore();
  const { toggleItem, hasItem: isWishlisted } = useWishlistStore();
  const isLiked = isWishlisted(product.id);
  const itemCount = getItemCount();

  const price = product.base_price;
  const comparePrice = product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;
  const discount = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;
  
  const isInStock = (product.total_inventory || 0) > 0;
  const defaultVariant = product.variants?.[0];
  


  const overviewText = product.short_description || product.description || product.seo_description || '';
  const fullDescription = product.description || product.seo_description || product.short_description || '';

  const detailRows = useMemo(() => {
    const details = product.details || {};
    const rows: { label: string; value: string }[] = [];

    if (details.material) rows.push({ label: 'Material', value: String(details.material) });
    if (details.weight) rows.push({ label: 'Weight', value: String(details.weight) });
    if (details.dimensions) {
      const { width, height, depth } = details.dimensions;
      const parts = [width ? `${width}W` : null, height ? `${height}H` : null, depth ? `${depth}D` : null].filter(Boolean);
      if (parts.length > 0) rows.push({ label: 'Dimensions', value: parts.join(' x ') });
    }
    if (details.care_instructions) rows.push({ label: 'Care', value: String(details.care_instructions) });

    Object.entries(details).forEach(([key, value]) => {
      if (['material', 'weight', 'dimensions', 'care_instructions', 'rating_stats'].includes(key)) return;
      if (value === null || value === undefined) return;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        rows.push({ label: key.replace(/_/g, ' ').replace(/\b[a-z]/g, (char) => char.toUpperCase()), value: String(value) });
      }
    });

    return rows;
  }, [product.details]);

  useEffect(() => {
    setMounted(true);
    // Inject heart pulse + premium card styles once globally
    const styleId = 'heart-pulse-global-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = heartPulseStyle + premiumCardStyle;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (defaultVariant) {
      setSelectedVariant(defaultVariant);
    }
  }, [defaultVariant]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showQuickView) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('quick-view-open');
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.classList.remove('quick-view-open');
      };
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('quick-view-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('quick-view-open');
    };
  }, [showQuickView]);

  // ESC key to close modal
  useEffect(() => {
    if (!showQuickView) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickView(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showQuickView]);

  // Long press handlers with scroll detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isScrolling.current = false;
    
    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        setIsLongPress(true);
        setShowQuickView(true);
      }
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If finger moved more than 10px, it's a scroll
    if (deltaX > 10 || deltaY > 10) {
      isScrolling.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Don't open quick view here — let onClick handle it to avoid double-fire
    // touchEnd fires before the synthetic click event on mobile
    
    setIsLongPress(false);
    touchStartPos.current = null;
    isScrolling.current = false;
  }, []);

  const handleQuickAdd = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!defaultVariant) {
      toast.error('Please select options on the product page');
      return;
    }
    
    if (!isInStock) {
      toast.error('Out of stock');
      return;
    }

    setIsAdding(true);
    
    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    addItem(product, defaultVariant, 1);
    toast.success('Added to cart', {
      icon: <ShoppingBag className="w-4 h-4" />,
    });
    
    setIsAdding(false);
  }, [defaultVariant, isInStock, addItem, product]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.base_price,
      image: product.primary_image || null,
    });
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  }, [toggleItem, product]);

  const handleDirectCheckout = useCallback(async (paymentMethod: string) => {
    if (paymentMethod === 'Stripe') {
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              productId: product.id,
              variantId: selectedVariant?.id || defaultVariant?.id,
              name: product.name,
              description: product.description,
              price: selectedVariant?.price || price,
              quantity: 1,
              image: product.primary_image,
            }],
            metadata: {
              productId: product.id,
              variantId: selectedVariant?.id || defaultVariant?.id,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stripe API error:', response.status, errorText);
          throw new Error(`API returned ${response.status}: ${errorText.slice(0, 100)}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned invalid response. Please check your Stripe configuration.');
        }

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.error('Failed to create checkout session');
        }
      } catch (error: any) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to initiate checkout. Please try again.');
      }
    } else if (paymentMethod === 'Skrill') {
      try {
        const response = await fetch('/api/skrill/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantId: selectedVariant?.id || defaultVariant?.id,
            name: product.name,
            description: product.description,
            price: selectedVariant?.price || price,
            quantity: 1,
            image: product.primary_image,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || 'Failed to create Skrill checkout');
        }
      } catch (error: any) {
        console.error('Skrill checkout error:', error);
        toast.error('Failed to initiate Skrill checkout');
      }
    } else {
      const whopLink = `https://whop.com/checkout/${product.slug}`;
      window.open(whopLink, '_blank');
      toast.success(`Opening ${paymentMethod} checkout`);
    }
  }, [product, selectedVariant, defaultVariant, price]);

  const handleBuyNow = useCallback(async () => {
    // Coming soon - Stripe checkout disabled temporarily
    toast('Coming Soon!', {
      icon: '🚀',
      duration: 3000,
    });
    return;
  }, []);

  const getCheckoutItems = useCallback(() => {
    if (!selectedVariant) return [];
    
    return [{
      productId: product.id.toString(),
      variantId: selectedVariant.id.toString(),
      name: product.name,
      description: product.description || undefined,
      price: selectedVariant.price || product.base_price,
      quantity: 1,
      image: product.primary_image,
    }];
  }, [selectedVariant, product]);

  const cardContent = (
    <>
      <article
        className="group relative h-full w-full flex flex-col cursor-pointer overflow-hidden rounded-xl md:rounded-2xl product-card-premium"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowQuickView(true)}
      >
      {/* Neon edges — pure CSS */}
      <div className="neon-edge-top" />
      <div className="neon-edge-bottom" />
      {/* Premium shine sweep on hover */}
      <div className="card-shine-sweep" />
      {/* Image Container - Light theme with blue shimmer */}
      <div
        className={`relative overflow-hidden ${
          compact ? 'aspect-4/5 rounded-lg' : 'aspect-3/4 rounded-xl md:rounded-2xl'
        }`}
        style={{ backgroundColor: 'rgba(10,22,40,0.6)', boxShadow: '0 2px 12px rgba(50,117,248,0.12)' }}
      >
          {/* Clean border glow — CSS driven */}
          <div className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none z-2 card-image-border" />
          {/* Image shine sweep on hover */}
          <div className="card-image-shine" />
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {product.primary_image ? (
            <Image
              src={(() => {
                let src = product.primary_image;
                // Strip leading slash from absolute URLs
                if (src.startsWith('/http://') || src.startsWith('/https://')) {
                  src = src.substring(1);
                }
                // Return absolute URLs as-is
                if (src.startsWith('http://') || src.startsWith('https://')) {
                  return src;
                }
                // Handle relative paths
                return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
              })()}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgba(50,117,248,0.08), rgba(50,117,248,0.04))' }}>
              <span style={{ color: 'rgba(120,180,255,0.3)', fontSize: '3rem', fontWeight: 300 }}>B</span>
            </div>
          )}

          {/* Badges - Black style */}
          <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-1.5" style={{ zIndex: 9990 }}>
            {hasDiscount && (
              <span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 bg-black text-white text-[10px] md:text-xs font-bold rounded-full shadow-lg overflow-hidden card-badge"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div
                  className="absolute top-0 bottom-0 badge-shimmer-el"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(50,117,248,0.35) 40%, rgba(80,160,255,0.55) 50%, rgba(50,117,248,0.35) 60%, transparent 100%)' }}
                />
                <span className="relative z-10 tracking-wide">-{discount}%</span>
              </span>
            )}
            {!isInStock && (
              <span className="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full shadow-lg font-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.95)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                Sold out
              </span>
            )}
            {product.featured && isInStock && (
              <span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 bg-black text-white text-[10px] md:text-xs font-bold rounded-full overflow-hidden shadow-lg card-badge"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <div
                  className="absolute top-0 bottom-0 badge-shimmer-el"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(50,117,248,0.35) 40%, rgba(80,160,255,0.55) 50%, rgba(50,117,248,0.35) 60%, transparent 100%)' }}
                />
                <span className="relative z-10 tracking-wide">Featured</span>
              </span>
            )}
          </div>

          {/* Wishlist & Add buttons moved outside card wrapper - see end of component */}
        </div>

        {/* Product Info */}
        <div className={`mt-1.5 flex-1 flex flex-col relative px-2 md:px-3 pb-2 md:pb-3 ${compact ? 'space-y-1' : 'md:mt-4 space-y-1.5 md:space-y-2'}`} style={{ zIndex: 9990 }}>
          {product.category && !compact && (
            <p className="text-[10px] md:text-xs uppercase tracking-wider truncate" style={{ color: 'rgba(120,180,255,0.6)' }}>
              {product.category.name}
            </p>
          )}
          
          <h3 className={`font-medium transition-colors ${compact ? 'text-xs md:text-sm line-clamp-1' : 'text-sm md:text-base line-clamp-2'}`} style={{ color: '#f5f5f7' }}>
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 md:gap-2">
            <span className={`font-semibold ${compact ? 'text-sm' : 'text-sm md:text-base'}`} style={{ color: '#ffffff' }}>
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="line-through text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          {/* Variant Preview - Hidden on compact */}
          {!compact && product.variants && product.variants.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 pt-1">
              {product.variants
                .slice(0, 4)
                .filter((variant) => variant.options?.color)
                .map((variant) => (
                  <div
                    key={variant.id}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full shadow-sm"
                    style={{ 
                      backgroundColor: variant.options!.color!.toLowerCase() === 'white' 
                        ? '#ffffff' 
                        : variant.options!.color!.toLowerCase(),
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    title={variant.options!.color}
                  />
              ))}
              {product.variants.length > 4 && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>+{product.variants.length - 4}</span>
              )}
            </div>
          )}
          
          {/* Mobile variant count */}
          {!compact && product.variants && product.variants.length > 1 && (
            <p className="md:hidden text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {product.variants.length} options
            </p>
          )}
        </div>
    </article>

    {/* Quick View Modal - Rendered via Portal ONLY when opened (lazy mount) */}
    {mounted && showQuickView && createPortal(
      <AnimatePresence>
        {showQuickView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={`fixed inset-0 z-[2147483647] flex items-stretch justify-end bg-black/60 ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-md'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowQuickView(false);
          }}
            style={{ pointerEvents: 'all', overscrollBehavior: 'none', touchAction: 'none' }}
        >
          {/* Tap hints - Skip on mobile for performance */}
          {!shouldSkipHeavyEffects && ['top', 'bottom', 'left', 'right'].map(pos => (
            <motion.div
              key={pos}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute text-blue-300/50 text-xs pointer-events-none ${
                pos === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
                pos === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                pos === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
                'right-2 top-1/2 -translate-y-1/2'
              }`}
            >
              {pos === 'top' || pos === 'bottom' ? (
                <span>↑ Tap anywhere to close ↑</span>
              ) : (
                <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
              )}
            </motion.div>
          ))}

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className={`relative w-full h-[100dvh] max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white text-black border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-2xl'} ${isMobile ? '' : 'shadow-2xl'}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ pointerEvents: 'all' }}
          >
            <div className="flex items-center justify-between p-1.5 sm:p-4 md:p-5 border-b border-black/10 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/50">Quick View</p>
                  <p className="text-sm font-medium text-black truncate">{product.name}</p>
                </div>
              </div>
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickView(false);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuickView(false);
                }}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="w-full flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-1.5 sm:px-6 md:px-8 py-2 sm:py-6 md:py-8">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-2 sm:gap-6 lg:gap-10">
                {/* Product Media Column */}
                <div className="space-y-4 lg:sticky lg:top-24 self-start">
                  <div className="rounded-3xl border border-black/10 bg-white shadow-sm p-3">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#f5f5f7]">
                      {product.media && product.media.length > 0 ? (
                        <ProductMediaCarousel
                          media={product.media}
                          productName={product.name}
                          autoPlay={false}
                          showThumbnails={true}
                          enableZoom={true}
                          enableFullscreen={true}
                          className="h-full"
                        />
                      ) : product.primary_image ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={(() => {
                              let src = product.primary_image;
                              if (src.startsWith('/http://') || src.startsWith('/https://')) {
                                src = src.substring(1);
                              }
                              if (src.startsWith('http://') || src.startsWith('https://')) {
                                return src;
                              }
                              return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                            })()}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                          />
                          {hasDiscount && (
                            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full shadow-md">
                              -<CountUp to={discount} from={0} duration={1} className="" />% OFF
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <span className="text-black/20 text-8xl font-light">B</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Availability</p>
                      <p className="mt-1 font-medium text-black">
                        {isInStock ? 'In stock and ready to ship' : 'Out of stock'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Delivery</p>
                      <p className="mt-1 font-medium text-black">Free standard shipping over $150</p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex flex-col space-y-6 pr-1">
                  <div className="space-y-2">
                    {product.category && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">
                        {product.category.name}
                      </p>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-black">
                      {product.name}
                    </h1>
                    {overviewText && (
                      <p className="text-sm md:text-base text-black/60 leading-relaxed">
                        {overviewText}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 py-3 border-y border-black/10">
                    <span className="text-3xl md:text-4xl font-semibold text-black">
                      {formatPrice(selectedVariant?.price || price)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-base md:text-lg text-black/40 line-through">
                          {formatPrice(comparePrice)}
                        </span>
                        <span className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">
                          Save <CountUp to={discount} from={0} duration={1} className="" />%
                        </span>
                      </>
                    )}
                  </div>

                  {product.variants && product.variants.length > 1 && (
                    <div className="w-full">
                      <p className="text-sm font-semibold text-black mb-3">Choose your option</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant, index) => (
                          <motion.button
                            key={variant.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedVariant(variant);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedVariant(variant);
                            }}
                            style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              selectedVariant?.id === variant.id
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-black/10 hover:border-black/30'
                            }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04, duration: 0.25 }}
                          >
                            {variant.options?.size || variant.options?.color || `Option ${variant.id}`}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Highlights</p>
                    <div className="mt-3 space-y-2 text-sm text-black/70">
                      {detailRows.length > 0 ? (
                        detailRows.slice(0, 6).map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3">
                            <span className="text-black/60">{row.label}</span>
                            <span className="font-medium text-black">{row.value}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-black/60">Premium materials, refined fit, and elevated everyday comfort.</p>
                      )}
                    </div>
                  </div>

                  {fullDescription && fullDescription !== overviewText && (
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Full Description</p>
                      <p className="mt-3 text-sm text-black/70 leading-relaxed">{fullDescription}</p>
                    </div>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs bg-black/5 text-black/70 border border-black/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-black">Checkout</p>

                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                    >
                      <CryptoCheckoutTrigger
                        productName={product.name}
                        productImage={product.primary_image}
                        priceUSD={selectedVariant?.price || price}
                        productId={product.id.toString()}
                        variantId={selectedVariant?.id?.toString()}
                        quantity={1}
                        disabled={!isInStock}
                      />
                    </div>

                    <div className="w-full flex flex-col gap-0">
                      <div
                        className="grid grid-cols-4 w-full rounded-t-2xl overflow-hidden border border-black/10 border-b-0"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onTouchEnd={(e) => { e.stopPropagation(); }}
                        style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                      >
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('cart'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('cart'); }}
                          className={`py-3 text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'cart'
                              ? 'bg-black text-white'
                              : 'bg-white text-black/60 hover:text-black'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Cart</span>
                        </button>

                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('whop'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('whop'); }}
                          className={`py-3 text-[10px] font-semibold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'whop'
                              ? 'bg-black text-white'
                              : 'bg-white text-black/60 hover:text-black'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <WhopLogo className="w-5 h-5" />
                          <span>Whop</span>
                        </button>

                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('skrill'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('skrill'); }}
                          className={`py-3 text-[10px] font-semibold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'skrill'
                              ? 'bg-black text-white'
                              : 'bg-white text-black/50 hover:text-black'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <SkrillLogo className="w-5 h-5" />
                          <span>Skrill</span>
                          <span className="text-[7px] opacity-50 leading-none -mt-0.5">Soon</span>
                        </button>

                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('stripe'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('stripe'); }}
                          className={`py-3 text-[10px] font-semibold transition-all border-l border-black/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'stripe'
                              ? 'bg-black text-white'
                              : 'bg-white text-black/50 hover:text-black'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <StripeLogo className="w-5 h-5" />
                          <span>Stripe</span>
                          <span className="text-[7px] opacity-50 leading-none -mt-0.5">Soon</span>
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.button
                          key={payMethod}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (payMethod === 'cart') {
                              handleQuickAdd();
                            } else if (payMethod === 'stripe') {
                              handleBuyNow();
                            } else {
                              handleDirectCheckout(payMethod === 'whop' ? 'Whop' : 'Skrill');
                            }
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={payMethod === 'stripe' || payMethod === 'skrill' || !isInStock}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                          className={`w-full py-3.5 rounded-b-2xl transition-all flex items-center justify-center gap-2 text-sm font-semibold border border-t-0 border-black/10 ${
                            payMethod === 'stripe' || payMethod === 'skrill'
                              ? 'bg-black/10 text-black/40 cursor-not-allowed'
                              : payMethod === 'cart'
                                ? 'bg-black text-white hover:bg-black/90'
                                : 'bg-white text-black hover:bg-black/5'
                          }`}
                          whileHover={payMethod !== 'stripe' && payMethod !== 'skrill' ? { scale: 1.02 } : {}}
                          whileTap={payMethod !== 'stripe' && payMethod !== 'skrill' ? { scale: 0.98 } : {}}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {payMethod === 'whop' && (
                            <>
                              <WhopLogo className="w-5 h-5" />
                              <span>Pay with Whop</span>
                            </>
                          )}
                          {payMethod === 'skrill' && (
                            <>
                              <SkrillLogo className="w-5 h-5" />
                              <span>Skrill — Coming Soon</span>
                            </>
                          )}
                          {payMethod === 'cart' && (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </>
                          )}
                          {payMethod === 'stripe' && (
                            <>
                              <StripeLogo className="w-5 h-5" />
                              <span>Stripe — Coming Soon</span>
                            </>
                          )}
                        </motion.button>
                      </AnimatePresence>
                    </div>

                    <motion.a
                      href="/crypto-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.stopPropagation(); }}
                      onTouchEnd={(e) => { e.stopPropagation(); }}
                      className="w-full py-2.5 bg-white text-black/70 hover:text-black text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-black/10"
                      style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>How to Pay with Crypto</span>
                    </motion.a>

                    <div className="flex items-center justify-center gap-2 text-black/40 text-xs pt-2 flex-wrap">
                      <span>Secure</span>
                      <span>•</span>
                      <span>Cards</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden md:inline">Apple Pay</span>
                      <span className="hidden md:inline">•</span>
                      <span>Crypto</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );

  return (
    <div 
      data-product-card
      className="block h-full w-full relative cursor-pointer product-card-wrapper" 
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 320px', ...floatVars } as React.CSSProperties}
    >
      {/* Mobile neon glow behind card — GPU animated, hidden on desktop */}
      <div className="mobile-neon-glow" aria-hidden />
      {cardContent}
      
      {/* Floating Heart Button — CSS transitions only */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(e); }}
        className={`absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full 
                   flex items-center justify-center
                   pointer-events-auto heart-btn
                   ${isLiked ? 'text-sky-400' : ''}`}
        style={{ 
          zIndex: 9999,
          backgroundColor: 'rgba(10,22,40,0.92)',
          border: '1px solid rgba(50,117,248,0.3)',
          boxShadow: '0 2px 8px rgba(16,42,90,0.3)',
          color: isLiked ? undefined : 'rgba(255,255,255,0.6)'
        }}
      >
        <svg className="absolute -top-3 left-1/2 -translate-x-1/2" width="30" height="10" viewBox="0 0 30 10" fill="none">
          <path
            d="M0 5 L5 5 L7 2 L9 8 L11 1 L13 7 L15 3 L17 6 L19 5 L23 5 L25 3 L27 6 L30 5"
            stroke={isLiked ? '#38bdf8' : '#3b82f6'}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="heart-ecg-line"
            fill="none"
          />
        </svg>
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-sky-400' : 'heart-pulse-blue'}`} style={!isLiked ? { fill: 'transparent', stroke: '#3b82f6' } : undefined} />
      </button>
    </div>
  );
});
