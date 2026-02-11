'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Sparkles, Ghost, Shuffle, Wind,
  X, Edit3, Ruler, Maximize2, ChevronRight,
  Grid3X3, Image as ImageIcon, ShoppingCart, ShoppingBag, Check,
} from 'lucide-react';
import { SAMPLE_PRINT_PRODUCTS, type PrintProduct } from './PrintProductsSection';
import { useCartStore } from '@/stores/cart-store';
import type { ProductWithDetails, Variant } from '@/types/store';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

const FooterComponent = dynamic(() => import('@/components/Mainpage/footer').then((mod) => ({ default: mod.Footer })), { ssr: false });

/* ─────── Animation Type System ─────── */
type GridAnimation =
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'pop'
  | 'disappear'
  | 'ghost'
  | 'float';

interface AnimationConfig {
  id: GridAnimation;
  label: string;
  icon: React.ReactNode;
}

const ANIMATIONS: AnimationConfig[] = [
  { id: 'slide-up',    label: 'Slide Up',    icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { id: 'slide-down',  label: 'Slide Down',  icon: <ArrowDown className="h-3.5 w-3.5" /> },
  { id: 'slide-left',  label: 'Slide Left',  icon: <ArrowLeft className="h-3.5 w-3.5" /> },
  { id: 'slide-right', label: 'Slide Right', icon: <ArrowRight className="h-3.5 w-3.5" /> },
  { id: 'pop',         label: 'Pop',         icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'disappear',   label: 'Dissolve',    icon: <Ghost className="h-3.5 w-3.5" /> },
  { id: 'ghost',       label: 'Ghost',       icon: <Shuffle className="h-3.5 w-3.5" /> },
  { id: 'float',       label: 'Float',       icon: <Wind className="h-3.5 w-3.5" /> },
];

/* ─────── Keyframe Helpers ─────── */
function getInitialTransform(anim: GridAnimation, idx: number): string {
  switch (anim) {
    case 'slide-up':    return 'translateY(80px)';
    case 'slide-down':  return 'translateY(-80px)';
    case 'slide-left':  return 'translateX(80px)';
    case 'slide-right': return 'translateX(-80px)';
    case 'pop':         return 'scale(0.3)';
    case 'disappear':   return 'scale(1.15)';
    case 'ghost':       return `translateY(${idx % 2 === 0 ? 40 : -40}px) rotate(${idx % 2 === 0 ? -6 : 6}deg)`;
    case 'float':       return `translateY(${20 + idx * 8}px)`;
    default:            return 'none';
  }
}

function getInitialOpacity(anim: GridAnimation): number {
  switch (anim) {
    case 'disappear': return 0;
    case 'ghost':     return 0;
    case 'pop':       return 0;
    default:          return 0;
  }
}

function getInitialFilter(anim: GridAnimation): string {
  switch (anim) {
    case 'ghost':     return 'blur(12px)';
    case 'disappear': return 'blur(8px)';
    default:          return 'blur(0px)';
  }
}

/* ─────── Type Badge Color ─────── */
function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'poster':    return 'bg-blue-500';
    case 'banner':    return 'bg-purple-500';
    case 'wallpaper': return 'bg-green-500';
    case 'canvas':    return 'bg-orange-500';
    case 'tshirt':    return 'bg-pink-500';
    case 'cap':       return 'bg-indigo-500';
    case 'hoodie':    return 'bg-rose-500';
    case 'pants':     return 'bg-amber-500';
    case 'sticker':   return 'bg-lime-600';
    case 'business-card': return 'bg-cyan-500';
    case 'window-design': return 'bg-teal-600';
    default:          return 'bg-gray-500';
  }
}

/* ─────── Animated Card ─────── */
interface AnimatedCardProps {
  product: PrintProduct;
  index: number;
  animation: GridAnimation;
  triggerKey: number;
  onQuickView: (p: PrintProduct) => void;
}

function AnimatedCard({ product, index, animation, triggerKey, onQuickView }: AnimatedCardProps) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(false);
    const delay = index * 90 + 50;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [triggerKey, index]);

  const style: React.CSSProperties = visible
    ? {
        opacity: 1,
        transform: 'translateY(0) translateX(0) scale(1) rotate(0deg)',
        filter: 'blur(0px)',
        transition: `all 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.07}s`,
      }
    : {
        opacity: getInitialOpacity(animation),
        transform: getInitialTransform(animation, index),
        filter: getInitialFilter(animation),
        transition: 'none',
      };

  // Float keyframe for the float animation
  const floatStyle: React.CSSProperties =
    animation === 'float' && visible
      ? {
          animation: `promo-float-${index % 3} 3.5s ease-in-out ${index * 0.15}s infinite alternate`,
        }
      : {};

  return (
    <div
      ref={cardRef}
      style={{ ...style, ...floatStyle }}
      className="group relative overflow-hidden rounded-2xl bg-white border border-black/[0.06] shadow-sm transition-shadow hover:shadow-xl will-change-transform"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />

        {/* Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`${getTypeBadgeColor(product.type)} px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-widest shadow-lg`}>
            {product.type}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
            className="flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-sm px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Quick View
          </button>
        </div>

        {/* Mobile tap target */}
        <button
          onClick={() => onQuickView(product)}
          className="absolute inset-0 z-[5] md:hidden"
          aria-label={`Quick view ${product.name}`}
        />
      </div>

      {/* Info */}
      <div className="px-3.5 py-3">
        <h3 className="text-[13px] font-semibold text-black truncate">{product.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-bold text-black">${product.basePrice.toFixed(2)}</span>
          <span className="text-[10px] text-black/50">{product.sizes.length} sizes</span>
        </div>
      </div>
    </div>
  );
}

/* ─────── Quick View Modal ─────── */
interface PromoQuickViewProps {
  product: PrintProduct;
  onClose: () => void;
}

function PromoQuickView({ product, onClose }: PromoQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  const totalPrice = selectedSize.price * quantity;

  // Convert print product to cart-compatible format
  const handleAddToCart = () => {
    const cartProduct: ProductWithDetails = {
      id: `print-${product.id}`,
      name: product.name,
      slug: product.id,
      description: product.description || null,
      short_description: `${product.type} - ${selectedSize.label}`,
      base_price: selectedSize.price,
      compare_at_price: null,
      category_id: null,
      status: 'ACTIVE',
      featured: false,
      tags: [product.type, 'print'],
      details: { material: 'Premium Print', dimensions: { width: selectedSize.width, height: selectedSize.height } },
      seo_title: null,
      seo_description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: '1', product_id: `print-${product.id}`, url: product.image, alt_text: product.name, sort_order: 0, is_primary: true, created_at: new Date().toISOString() }],
      variants: [],
      primary_image: product.image,
    };

    const variant: Variant = {
      id: `${product.id}-${selectedSize.label}`,
      product_id: `print-${product.id}`,
      sku: `PRINT-${product.id}-${selectedSize.label}`.toUpperCase(),
      name: selectedSize.label,
      options: { size: selectedSize.label, type: product.type },
      price_adjustment: 0,
      inventory_count: 999,
      low_stock_threshold: 5,
      weight_grams: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(cartProduct, variant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Lock body scroll
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.classList.add('quick-view-open');
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.classList.remove('quick-view-open');
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className={`fixed inset-0 z-[2147483647] flex items-stretch justify-end bg-white/80 ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-md'}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{ pointerEvents: 'all', overscrollBehavior: 'none', touchAction: 'none' }}
      >
        {!shouldSkipHeavyEffects && ['top', 'bottom', 'left', 'right'].map((pos) => (
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
          className={`relative w-full h-[100dvh] max-w-[320px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white text-black border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden ${shouldDisableBackdropBlur ? '' : 'sm:backdrop-blur-2xl'} ${isMobile ? '' : 'shadow-2xl'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{ pointerEvents: 'all', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center justify-between p-1 sm:p-4 md:p-5 border-b border-black/10 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white border border-black/10 flex items-center justify-center shrink-0">
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
                onClose();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="h-10 w-10 rounded-xl bg-white border border-black/10 flex items-center justify-center hover:border-black/20 active:scale-95 transition-all"
              style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="w-full flex-1 overflow-y-auto overscroll-contain overflow-x-hidden px-1 sm:px-6 md:px-8 py-1.5 sm:py-6 md:py-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-1.5 sm:gap-6 lg:gap-10">
            {/* Image */}
            <div className="space-y-4 lg:sticky lg:top-24 self-start">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="aspect-square">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-[9px] font-bold text-black uppercase tracking-widest border border-black/10 bg-white shadow-sm">
                    {product.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col space-y-6 pr-1">
              {product.description && (
                <p className="text-sm text-black/65 leading-relaxed">{product.description}</p>
              )}

              {/* Size picker */}
              <div className="mb-6">
                <label className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-black">
                  <Ruler className="h-3.5 w-3.5" />Size
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all text-xs ${
                        selectedSize.label === size.label
                          ? 'border-black bg-white text-black'
                          : 'border-black/8 bg-white text-black hover:border-black/20'
                      }`}
                    >
                      <span className="font-semibold">{size.label}</span>
                      {size.width && size.height && (
                        <span className="block text-[10px] mt-0.5 opacity-60">{size.width}" × {size.height}"</span>
                      )}
                      <span className="block mt-0.5 font-bold">${size.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block mb-2.5 text-xs font-semibold text-black">Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black font-medium transition hover:bg-black/5 text-sm">−</button>
                  <span className="text-base font-bold text-black w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black font-medium transition hover:bg-black/5 text-sm">+</button>
                </div>
              </div>

              {/* Printer compatibility */}
              {product.printerCompatible.length > 0 && (
                <div className="mb-6 p-3.5 rounded-xl bg-white border border-black/5">
                  <p className="text-[10px] font-semibold text-black/60 mb-1.5">Printed With</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.printerCompatible.map((p) => (
                      <span key={p} className="px-2.5 py-1 rounded-full bg-white text-[11px] font-medium text-black border border-black/8">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price + CTA */}
              <div className="mt-auto pt-6 border-t border-black/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/50">Total</span>
                  <span className="text-3xl font-bold text-black">${totalPrice.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className={`w-full rounded-full px-6 py-4 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-black/20 bg-white`}
                >
                  {added ? <><Check className="h-4 w-4" />Added to Cart!</> : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
                </button>
              </div>
            </div>
          </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

/* ─────── Grid Picker Pill Bar ─────── */
interface GridPickerProps {
  active: GridAnimation;
  onChange: (a: GridAnimation) => void;
}

function GridPicker({ active, onChange }: GridPickerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {ANIMATIONS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all ${
            active === a.id
              ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
              : 'bg-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white'
          }`}
        >
          {a.icon}
          <span className="hidden sm:inline">{a.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────── MAIN PROMO SECTION ─────── */
export function PrintDesignPromoGrid({
  onOpenStudio,
}: {
  onOpenStudio?: (opts?: { tab?: 'browse' | 'product' | 'upload' | 'create' | 'orders' | 'designs'; productId?: string }) => void;
}) {
  const [animation, setAnimation] = useState<GridAnimation>('slide-up');
  const [triggerKey, setTriggerKey] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<PrintProduct | null>(null);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleAnimationChange = useCallback((a: GridAnimation) => {
    setAnimation(a);
    setTriggerKey((k) => k + 1);
  }, []);

  // Re-trigger animation on scroll into view
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTriggerKey((k) => k + 1);
      },
      { threshold: 0.15 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const products = useMemo(() => SAMPLE_PRINT_PRODUCTS, []);

  const handleQuickView = useCallback((product: PrintProduct) => {
    setQuickViewProduct(product);
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative w-full overflow-hidden bg-black border-t border-b border-white/[0.04]"
      >
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/15 to-pink-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          {/* Header */}
          <div className="mb-10 sm:mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-5">
              <Grid3X3 className="h-3.5 w-3.5 text-white/80" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Print & Design Studio</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Custom Prints,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Your Way
              </span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
              Premium posters, banners, canvas prints &amp; more — printed on professional Roland &amp; Mimaki equipment.
            </p>

            {/* CTA */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <a
                href="#print-design"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-white/15"
              >
                Explore Collection
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Grid Picker */}
          <div className="mb-8 sm:mb-10">
            <GridPicker active={animation} onChange={handleAnimationChange} />
          </div>

          {/* Animated Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {products.map((product, i) => (
              <AnimatedCard
                key={`${product.id}-${triggerKey}`}
                product={product}
                index={i}
                animation={animation}
                triggerKey={triggerKey}
                onQuickView={handleQuickView}
              />
            ))}
          </div>

          {/* View All Link */}
          <div className="mt-10 sm:mt-12 text-center">
            <a
              href="#print-design"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              View All Print Products
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Float keyframes */}
        <style jsx global>{`
          @keyframes promo-float-0 {
            from { transform: translateY(0px); }
            to   { transform: translateY(-8px); }
          }
          @keyframes promo-float-1 {
            from { transform: translateY(0px); }
            to   { transform: translateY(-12px); }
          }
          @keyframes promo-float-2 {
            from { transform: translateY(0px); }
            to   { transform: translateY(-6px); }
          }
        `}</style>
      </section>

      {/* Quick View */}
      {mounted && quickViewProduct && (
        <PromoQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}

export default PrintDesignPromoGrid;
