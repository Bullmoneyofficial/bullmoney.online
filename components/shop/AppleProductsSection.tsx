'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, Sparkles, Package, Shirt, BriefcaseBusiness } from 'lucide-react';
import type { ProductWithDetails, Category } from '@/types/store';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

/* ═══════════════════════════════════════════════════════════════════════════
   APPLE-STYLE PRODUCTS SECTION — FULLY SELF-ISOLATED
   
   Every visual property (color, background, border, shadow, font) is set
   via inline styles so that NO external CSS (theme overlays, globals,
   dark-mode, media queries) can override them.
   
   A scoped <style> block with [data-apple-section] !important rules acts
   as a nuclear fallback to defeat any `section`, `a`, `button` etc.
   selectors from globals.css / 40-theme-overlays.css.
   ═══════════════════════════════════════════════════════════════════════════ */

const SF = "'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,'Helvetica Neue','Helvetica','Arial',sans-serif";

// ── Scoped CSS injected once ─────────────────────────────────────────────
const SCOPED_RESET = `
[data-apple-section],
[data-apple-section] *,
[data-apple-section] *::before,
[data-apple-section] *::after {
  filter: none !important;
  -webkit-filter: none !important;
  text-shadow: none !important;
  transition-delay: 0s !important;
}
[data-apple-section] {
  background-color: transparent !important;
  color: #f5f5f7 !important;
  border-color: transparent !important;
  box-shadow: none !important;
  isolation: isolate !important;
  position: relative !important;
  z-index: 1 !important;
}
[data-apple-section] a,
[data-apple-section] a:hover,
[data-apple-section] a:focus,
[data-apple-section] a:visited {
  text-decoration: none !important;
  text-shadow: none !important;
}
[data-apple-section] button {
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  background: transparent !important;
}
[data-apple-section] .apple-nav-btn {
  background: rgba(255,255,255,0.1) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
}
[data-apple-section] .apple-nav-btn:hover {
  background: rgba(255,255,255,0.2) !important;
}
[data-apple-section] .apple-arrow-btn {
  background: #ffffff !important;
  border: 1px solid rgba(210,210,215,0.6) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}
[data-apple-section] .apple-arrow-btn:hover {
  background: rgba(255,255,255,0.9) !important;
}
[data-apple-section] .apple-card-dark {
  background-color: #1d1d1f !important;
  color: #f5f5f7 !important;
}
[data-apple-section] .apple-card-light {
  background-color: #f5f5f7 !important;
  color: #f5f5f7 !important;
}
[data-apple-section] .apple-card-dark a,
[data-apple-section] .apple-card-dark a:hover {
  color: #f5f5f7 !important;
}
[data-apple-section] .apple-card-light a,
[data-apple-section] .apple-card-light a:hover {
  color: #f5f5f7 !important;
}
[data-apple-section] .apple-card-glow,
[data-apple-section] .apple-card-shimmer {
  pointer-events: none !important;
}
[data-apple-section] .apple-card-buy {
  background-color: #0071e3 !important;
  color: #ffffff !important;
  border: none !important;
  cursor: pointer !important;
}
[data-apple-section] .apple-ribbon-border {
  border-bottom: 1px solid rgba(50,117,248,0.2) !important;
  background-color: transparent !important;
}
[data-apple-section] .apple-cat-icon-box {
  background-color: rgba(255,255,255,0.1) !important;
}
[data-apple-section] .apple-cat-icon-box-active {
  ring: 2px solid #0071e3;
  outline: 2px solid #0071e3 !important;
  outline-offset: 3px !important;
}
[data-apple-section] .apple-scrollbar-hide {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
[data-apple-section] .apple-scrollbar-hide::-webkit-scrollbar {
  display: none !important;
}
[data-apple-section] .apple-dot {
  background-color: rgba(255,255,255,0.3) !important;
}
[data-apple-section] .apple-dot-active {
  background-color: #ffffff !important;
}
`;

// ── Inject once ──────────────────────────────────────────────────────────
let styleInjected = false;
function InjectScopedStyle() {
  useEffect(() => {
    if (styleInjected) return;
    if (typeof document === 'undefined') return;
    const id = '__apple-section-scoped-css';
    if (document.getElementById(id)) { styleInjected = true; return; }
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = SCOPED_RESET;
    document.head.appendChild(tag);
    styleInjected = true;
  }, []);
  return null;
}

// ── Props ────────────────────────────────────────────────────────────────
interface AppleProductsSectionProps {
  products: ProductWithDetails[];
  categories?: Category[];
  title?: string;
  subtitle?: string;
  showCategoryNav?: boolean;
  showControls?: boolean;
  showFilters?: boolean;
  className?: string;
  onCategoryChange?: (categoryId: string | null) => void;
  onFilterChange?: (filters: any) => void;
  selectedCategory?: string | null;
}

// ── Fallback categories ──────────────────────────────────────────────────
const FALLBACK_CATEGORIES: Category[] = [
  { id: 'vip', name: 'VIP', slug: 'vip', description: null, image_url: null, parent_id: null, sort_order: 0, created_at: '', updated_at: '' },
  { id: 'bullmoney-plus', name: 'BULLMONEY +', slug: 'bullmoney-plus', description: null, image_url: null, parent_id: null, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'products', name: 'PRODUCTS', slug: 'products', description: null, image_url: null, parent_id: null, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'apparel', name: 'APPAREL', slug: 'apparel', description: null, image_url: null, parent_id: null, sort_order: 3, created_at: '', updated_at: '' },
  { id: 'services', name: 'SERVICES', slug: 'services', description: null, image_url: null, parent_id: null, sort_order: 4, created_at: '', updated_at: '' },
];

const CARD_FRAME_GRADIENT = 'linear-gradient(135deg, rgba(0,113,227,0.85), rgba(255,255,255,0.95), rgba(0,113,227,0.85))';
const CARD_BG_GRADIENT = 'linear-gradient(155deg, rgba(29,29,31,0.95), rgba(29,29,31,0.75))';
const CARD_BACKGROUND_SHIMMER = 'linear-gradient(130deg, rgba(255,255,255,0.18), rgba(71,149,255,0.35), rgba(255,255,255,0.18))';

const CARD_FRAME_SHIMMER = { backgroundPosition: ['0% 50%', '200% 50%'] };
const CARD_FRAME_TRANSITION = { duration: 6, repeat: Infinity, ease: 'linear' as const };
const CARD_BG_SHIMMER = { backgroundPosition: ['0% 0%', '200% 200%'] };
const CARD_BG_TRANSITION = { duration: 10, repeat: Infinity, ease: 'linear' as const };

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  vip: Crown,
  'bullmoney-plus': Sparkles,
  products: Package,
  apparel: Shirt,
  services: BriefcaseBusiness,
};

const CATEGORY_DESCRIPTION_MAP: Record<string, string> = {
  vip: 'Exclusive access',
  'bullmoney-plus': 'Premium tools',
  products: 'Shop all',
  apparel: 'Wear the brand',
  services: 'Expert help',
};

// ═════════════════════════════════════════════════════════════════════════
// 1. CATEGORY RIBBON
// ═════════════════════════════════════════════════════════════════════════

function CategoryRibbon({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    check();
    const el = ref.current;
    el?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el?.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [check]);

  const scroll = (dir: -1 | 1) =>
    ref.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  return (
    <div
      className="apple-ribbon-border"
      style={{
        position: 'relative',
        backgroundColor: 'transparent',
        borderBottom: '1px solid rgba(50,117,248,0.2)',
      }}
    >
      {/* LEFT fade + arrow (desktop) */}
      <AnimatePresence>
        {canLeft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              width: 80,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: 'linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.15), transparent)',
            }}
            // show only ≥768px via class override
            className="apple-fade-left"
          >
            <button
              onClick={() => scroll(-1)}
              className="apple-nav-btn"
              style={{
                marginLeft: 8,
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                color: '#ffffff',
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft style={{ width: 16, height: 16, color: '#ffffff' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT fade + arrow (desktop) */}
      <AnimatePresence>
        {canRight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              width: 80,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'flex-end',
              background: 'linear-gradient(to left, rgba(0,0,0,0.3), rgba(0,0,0,0.15), transparent)',
            }}
            className="apple-fade-right"
          >
            <button
              onClick={() => scroll(1)}
              className="apple-nav-btn"
              style={{
                marginRight: 8,
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                color: '#ffffff',
              }}
              aria-label="Scroll right"
            >
              <ChevronRight style={{ width: 16, height: 16, color: '#ffffff' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCROLLABLE ROW */}
      <div
        ref={ref}
        className="apple-scrollbar-hide"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 24,
          overflowX: 'auto',
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 16,
          paddingBottom: 12,
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {categories.map((cat, idx) => {
          const active = selected === cat.id || (!selected && idx === 0);
          const IconComponent = CATEGORY_ICON_MAP[cat.id] || CATEGORY_ICON_MAP[cat.slug ?? ''] || Sparkles;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(selected === cat.id ? null : cat.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: 0,
                outline: 'none',
              }}
            >
              <div
                className={active ? 'apple-cat-icon-box-active' : ''}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transition: 'transform 0.2s',
                  outline: active ? '2px solid #0071e3' : 'none',
                  outlineOffset: active ? 3 : 0,
                }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(12,12,16,0.85)',
                  }}
                  animate={{
                    backgroundColor: active
                      ? ['rgba(255,255,255,0.95)', '#050505', 'rgba(255,255,255,0.95)']
                      : ['rgba(18,18,24,0.9)', '#050505', 'rgba(18,18,24,0.9)'],
                  }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.span
                    style={{ display: 'inline-flex', color: active ? '#050505' : '#f5f5f7' }}
                    animate={{
                      color: active
                        ? ['#050505', '#f5f5f7', '#050505']
                        : ['#f5f5f7', '#050505', '#f5f5f7'],
                    }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <IconComponent size={26} strokeWidth={1.8} />
                  </motion.span>
                </motion.div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span
                  style={{
                    fontFamily: SF,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    transition: 'color 0.2s',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cat.name}
                </span>
                <span
                  style={{
                    fontFamily: SF,
                    fontSize: 9,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.2s',
                  }}
                >
                  {CATEGORY_DESCRIPTION_MAP[cat.id] || CATEGORY_DESCRIPTION_MAP[cat.slug ?? ''] || ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 2. PRODUCT CARD
// ═════════════════════════════════════════════════════════════════════════

function AppleCard({ product, index }: { product: ProductWithDetails; index: number }) {
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);
  const [hovered, setHovered] = useState(false);

  const price = product.base_price;
  const monthly = (price / 12).toFixed(2);
  const dark = index % 3 !== 2;

  const bg = dark ? '#1d1d1f' : 'rgba(19,19,21,0.85)';
  const fg = '#f5f5f7';
  const subFg = 'rgba(255,255,255,0.75)';
  const mutedFg = 'rgba(255,255,255,0.55)';
  const tagColor = '#f59d0b';

  return (
    <motion.div
      className="apple-card-chrome"
      style={{
        flexShrink: 0,
        width: 260,
        height: 340,
        borderRadius: 28,
        padding: 1.5,
        backgroundImage: CARD_FRAME_GRADIENT,
        backgroundSize: '260% 260%',
        position: 'relative',
        overflow: 'visible',
      }}
      animate={CARD_FRAME_SHIMMER}
      transition={CARD_FRAME_TRANSITION}
    >
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -14,
          borderRadius: 34,
          background: 'radial-gradient(circle, rgba(71,149,255,0.35), transparent 60%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: hovered ? 0.8 : 0.35, scale: hovered ? 1.05 : 0.98 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <Link
        href={`/store/product/${product.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`apple-card ${dark ? 'apple-card-dark' : 'apple-card-light'}`}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: bg,
          backgroundImage: CARD_BG_GRADIENT,
          color: fg,
          textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: hovered ? '0 25px 55px rgba(0,0,0,0.55)' : '0 12px 32px rgba(0,0,0,0.4)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0px)',
          transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 24,
            backgroundImage: CARD_BACKGROUND_SHIMMER,
            backgroundSize: '240% 240%',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
          animate={CARD_BG_SHIMMER}
          transition={CARD_BG_TRANSITION}
        />

        {/* TEXT CONTENT */}
        <div style={{ flexShrink: 0, padding: '22px 22px 4px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.tags?.[0] && (
            <p style={{
              fontFamily: SF,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 500,
              color: tagColor,
              margin: 0,
            }}>
              {product.tags[0]}
            </p>
          )}
          <h3 style={{
            fontFamily: SF,
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: fg,
            margin: 0,
          }}>
            {product.name}
          </h3>
          {(product.short_description || product.description) && (
            <p style={{
              fontFamily: SF,
              fontSize: 13,
              fontWeight: 400,
              color: subFg,
              margin: '2px 0 0',
            }}>
              {(product.short_description || product.description || '').slice(0, 60)}
            </p>
          )}
          <p style={{
            fontFamily: SF,
            fontSize: 11,
            color: mutedFg,
            margin: '8px 0 0',
          }}>
            From {formatPrice(price)} or {formatPrice(parseFloat(monthly))}/mo.
          </p>
        </div>

        {/* IMAGE */}
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 20px 18px',
        }}>
          <motion.div
            style={{ position: 'relative', width: '65%', aspectRatio: '1/1', maxWidth: 240 }}
            animate={{ y: hovered ? -8 : 0, scale: hovered ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width:768px) 180px, 240px"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#e5e5ea',
                color: dark ? '#6e6e73' : '#a1a1a6',
              }}>
                No image
              </div>
            )}
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// 3. HORIZONTAL CAROUSEL
// ═════════════════════════════════════════════════════════════════════════

function CardCarousel({ products }: { products: ProductWithDetails[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - el.scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setIdx(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [check, products.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = scrollStart.current - (e.clientX - startX.current);
  };
  const onUp = () => { dragging.current = false; };

  const dotCount = Math.min(products.length, 8);
  const activeDot = products.length <= 8 ? idx : Math.round((idx / Math.max(products.length - 1, 1)) * (dotCount - 1));

  return (
    <div style={{ position: 'relative' }}>
      {/* RIGHT arrow */}
      <AnimatePresence>
        {canRight && (
          <motion.button
            key="r"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scrollByCard(1)}
            className="apple-arrow-btn apple-carousel-arrow-right"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(210,210,215,0.6)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            aria-label="Next"
          >
            <ChevronRight style={{ width: 20, height: 20, color: '#1d1d1f' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* LEFT arrow */}
      <AnimatePresence>
        {canLeft && (
          <motion.button
            key="l"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scrollByCard(-1)}
            className="apple-arrow-btn apple-carousel-arrow-left"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(210,210,215,0.6)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            aria-label="Previous"
          >
            <ChevronLeft style={{ width: 20, height: 20, color: '#1d1d1f' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* SCROLLABLE STRIP */}
      <div
        ref={scrollRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="apple-scrollbar-hide"
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 24,
          scrollSnapType: 'x mandatory',
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: dragging.current ? 'none' : 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {products.map((p, i) => (
          <div key={p.id} data-card style={{ scrollSnapAlign: 'start' }}>
            <AppleCard product={p} index={i} />
          </div>
        ))}
      </div>

      {/* DOTS */}
      {products.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 8, paddingBottom: 4 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={activeDot === i ? 'apple-dot-active' : 'apple-dot'}
              style={{
                display: 'block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: activeDot === i ? '#ffffff' : 'rgba(255,255,255,0.3)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// RESPONSIVE STYLE INJECTION (media queries for desktop overrides)
// We inject a separate <style> for responsive rules since inline can't
// handle @media queries.
// ═════════════════════════════════════════════════════════════════════════

const RESPONSIVE_CSS = `
/* Desktop (≥768px) */
@media (min-width: 768px) {
  /* Show navigation fades & arrows */
  [data-apple-section] .apple-fade-left,
  [data-apple-section] .apple-fade-right {
    display: flex !important;
  }
  [data-apple-section] .apple-carousel-arrow-right,
  [data-apple-section] .apple-carousel-arrow-left {
    display: flex !important;
  }

  /* Category ribbon */
  [data-apple-section] .apple-ribbon-scroll {
    gap: 40px !important;
    padding-left: 64px !important;
    padding-right: 64px !important;
  }
  [data-apple-section] .apple-cat-icon-wrap {
    width: 76px !important;
    height: 76px !important;
  }
  [data-apple-section] .apple-cat-label {
    font-size: 12px !important;
  }

  /* Heading */
  [data-apple-section] .apple-heading-wrap {
    padding-left: 56px !important;
    padding-right: 56px !important;
    padding-top: 56px !important;
    padding-bottom: 24px !important;
  }
  [data-apple-section] .apple-heading-card {
    border-radius: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  [data-apple-section] .apple-heading {
    font-size: 36px !important;
    color: #1d1d1f !important;
    line-height: 1.1 !important;
  }
  [data-apple-section] .apple-heading-phrase {
    display: inline !important;
    font-size: inherit !important;
  }
  [data-apple-section] .apple-heading-bar {
    display: none !important;
  }

  /* ── Apple Store white cards on desktop ── */
  [data-apple-section] .apple-card-chrome {
    width: 300px !important;
    height: 500px !important;
    border-radius: 20px !important;
    padding: 0 !important;
    background-image: none !important;
    background-color: transparent !important;
  }
  [data-apple-section] .apple-card-glow {
    display: none !important;
  }
  [data-apple-section] .apple-card-shimmer {
    display: none !important;
  }
  [data-apple-section] .apple-card,
  [data-apple-section] .apple-card-dark,
  [data-apple-section] .apple-card-light {
    background-color: #ffffff !important;
    background-image: none !important;
    color: #1d1d1f !important;
    border: 1px solid #d2d2d7 !important;
    border-radius: 20px !important;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
  }
  [data-apple-section] .apple-card-dark a,
  [data-apple-section] .apple-card-dark a:hover,
  [data-apple-section] .apple-card-light a,
  [data-apple-section] .apple-card-light a:hover {
    color: #1d1d1f !important;
  }
  [data-apple-section] .apple-card-name {
    color: #1d1d1f !important;
    font-size: 22px !important;
  }
  [data-apple-section] .apple-card-desc {
    color: #6e6e73 !important;
    font-size: 14px !important;
  }
  [data-apple-section] .apple-card-price {
    color: #86868b !important;
    font-size: 12px !important;
  }
  [data-apple-section] .apple-card-text {
    padding: 28px 28px 0 28px !important;
  }
  [data-apple-section] .apple-card-footer {
    padding: 0 24px 24px 24px !important;
  }
  [data-apple-section] .apple-card-buy {
    background-color: #0071e3 !important;
    color: #ffffff !important;
    border: none !important;
    padding: 10px 22px !important;
    font-size: 15px !important;
  }
  [data-apple-section] .apple-card-img-wrap {
    padding: 8px 24px !important;
  }
  [data-apple-section] .apple-card-img-wrap img {
    filter: none !important;
  }

  /* Carousel */
  [data-apple-section] .apple-scroll-strip {
    gap: 20px !important;
    padding-left: 56px !important;
    padding-right: 56px !important;
  }

  /* Dots — darker on desktop */
  [data-apple-section] .apple-dot {
    background-color: rgba(0,0,0,0.2) !important;
  }
  [data-apple-section] .apple-dot-active {
    background-color: #1d1d1f !important;
  }
}

/* Large desktop (≥1024px) */
@media (min-width: 1024px) {
  [data-apple-section] .apple-heading-wrap {
    padding-left: 64px !important;
    padding-right: 64px !important;
  }
  [data-apple-section] .apple-heading {
    font-size: 40px !important;
  }
  [data-apple-section] .apple-heading-card {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  [data-apple-section] .apple-card-chrome {
    width: 320px !important;
    height: 530px !important;
  }
  [data-apple-section] .apple-card-name {
    font-size: 24px !important;
  }
  [data-apple-section] .apple-scroll-strip {
    padding-left: 64px !important;
    padding-right: 64px !important;
  }
  [data-apple-section] .apple-carousel-arrow-right {
    right: 24px !important;
  }
  [data-apple-section] .apple-carousel-arrow-left {
    left: 24px !important;
  }
}

/* Extra-large desktop (≥1280px) */
@media (min-width: 1280px) {
  [data-apple-section] .apple-card-chrome {
    width: 340px !important;
    height: 550px !important;
  }
  [data-apple-section] .apple-card-name {
    font-size: 26px !important;
  }
  [data-apple-section] .apple-card-text {
    padding: 32px 32px 0 32px !important;
  }
  [data-apple-section] .apple-card-footer {
    padding: 0 28px 28px 28px !important;
  }
}
`;

let responsiveInjected = false;
function InjectResponsiveStyle() {
  useEffect(() => {
    if (responsiveInjected) return;
    if (typeof document === 'undefined') return;
    const id = '__apple-section-responsive-css';
    if (document.getElementById(id)) { responsiveInjected = true; return; }
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = RESPONSIVE_CSS;
    document.head.appendChild(tag);
    responsiveInjected = true;
  }, []);
  return null;
}

// ═════════════════════════════════════════════════════════════════════════
// CARD (responsive version using className hooks)
// ═════════════════════════════════════════════════════════════════════════

function AppleCardResponsive({ product, index }: { product: ProductWithDetails; index: number }) {
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);
  const [hovered, setHovered] = useState(false);

  const price = product.base_price;
  const monthly = (price / 12).toFixed(2);

  // Mobile defaults (dark). Desktop overridden to white via RESPONSIVE_CSS.
  const fg = '#f5f5f7';
  const mutedFg = 'rgba(255,255,255,0.55)';

  return (
    <motion.div
      className="apple-card-chrome"
      style={{
        flexShrink: 0,
        width: 260,
        height: 380,
        borderRadius: 20,
        padding: 1.5,
        backgroundImage: CARD_FRAME_GRADIENT,
        backgroundSize: '260% 260%',
        position: 'relative',
        overflow: 'visible',
      }}
      animate={CARD_FRAME_SHIMMER}
      transition={CARD_FRAME_TRANSITION}
    >
      {/* Glow — hidden on desktop via CSS */}
      <motion.div
        aria-hidden
        className="apple-card-glow"
        style={{
          position: 'absolute',
          inset: -14,
          borderRadius: 34,
          background: 'radial-gradient(circle, rgba(71,149,255,0.35), transparent 60%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: hovered ? 0.8 : 0.35, scale: hovered ? 1.05 : 0.98 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <Link
        href={`/store/product/${product.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="apple-card apple-card-dark"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#1d1d1f',
          backgroundImage: CARD_BG_GRADIENT,
          color: fg,
          textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: hovered ? '0 8px 40px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0px)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Shimmer overlay — hidden on desktop via CSS */}
        <motion.div
          aria-hidden
          className="apple-card-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 20,
            backgroundImage: CARD_BACKGROUND_SHIMMER,
            backgroundSize: '240% 240%',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
          animate={CARD_BG_SHIMMER}
          transition={CARD_BG_TRANSITION}
        />

        {/* TEXT — top of card */}
        <div className="apple-card-text" style={{
          flexShrink: 0, padding: '22px 22px 0 22px',
          display: 'flex', flexDirection: 'column', gap: 2,
          position: 'relative', zIndex: 1,
        }}>
          <h3 className="apple-card-name" style={{
            fontFamily: SF, fontSize: 21, fontWeight: 600, lineHeight: 1.2,
            letterSpacing: '-0.01em', color: fg, margin: 0,
          }}>
            {product.name}
          </h3>
        </div>

        {/* IMAGE — centered */}
        <div className="apple-card-img-wrap" style={{
          flex: 1, position: 'relative', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '8px 20px',
          zIndex: 1,
        }}>
          <motion.div
            style={{ position: 'relative', width: '72%', aspectRatio: '1/1', maxWidth: 220 }}
            animate={{ y: hovered ? -4 : 0, scale: hovered ? 1.03 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width:768px) 180px, 260px"
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, backgroundColor: 'rgba(255,255,255,0.05)', color: '#6e6e73',
              }}>
                No image
              </div>
            )}
          </motion.div>
        </div>

        {/* FOOTER — price + Buy button */}
        <div className="apple-card-footer" style={{
          flexShrink: 0, padding: '0 22px 18px 22px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
          position: 'relative', zIndex: 1,
        }}>
          <p className="apple-card-price" style={{
            fontFamily: SF, fontSize: 11, color: mutedFg,
            margin: 0, lineHeight: 1.35, flex: 1,
          }}>
            From {formatPrice(price)} or {formatPrice(parseFloat(monthly))}/mo.
          </p>
          <span className="apple-card-buy" style={{
            fontFamily: SF, fontSize: 15, fontWeight: 400,
            backgroundColor: '#0071e3', color: '#ffffff',
            borderRadius: 999, padding: '8px 20px',
            whiteSpace: 'nowrap', lineHeight: 1,
            display: 'inline-flex', alignItems: 'center',
            flexShrink: 0,
          }}>
            Buy
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// RESPONSIVE CAROUSEL
// ═════════════════════════════════════════════════════════════════════════

function CardCarouselResponsive({ products }: { products: ProductWithDetails[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - el.scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setIdx(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [check, products.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = scrollStart.current - (e.clientX - startX.current);
  };
  const onUp = () => { dragging.current = false; };

  const dotCount = Math.min(products.length, 8);
  const activeDot = products.length <= 8 ? idx : Math.round((idx / Math.max(products.length - 1, 1)) * (dotCount - 1));

  return (
    <div style={{ position: 'relative' }}>
      {/* RIGHT arrow */}
      <AnimatePresence>
        {canRight && (
          <motion.button
            key="r"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => scrollByCard(1)}
            className="apple-arrow-btn apple-carousel-arrow-right"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 48, height: 48, borderRadius: '50%',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(210,210,215,0.6)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            aria-label="Next"
          >
            <ChevronRight style={{ width: 20, height: 20, color: '#1d1d1f' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* LEFT arrow */}
      <AnimatePresence>
        {canLeft && (
          <motion.button
            key="l"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => scrollByCard(-1)}
            className="apple-arrow-btn apple-carousel-arrow-left"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 48, height: 48, borderRadius: '50%',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(210,210,215,0.6)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
            aria-label="Previous"
          >
            <ChevronLeft style={{ width: 20, height: 20, color: '#1d1d1f' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* SCROLLABLE STRIP */}
      <div
        ref={scrollRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        className="apple-scrollbar-hide apple-scroll-strip"
        style={{
          display: 'flex', gap: 16, overflowX: 'auto',
          paddingLeft: 20, paddingRight: 20, paddingBottom: 24,
          scrollSnapType: 'x mandatory',
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: dragging.current ? 'none' : 'auto',
          WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none',
        }}
      >
        {products.map((p, i) => (
          <div key={p.id} data-card style={{ scrollSnapAlign: 'start' }}>
            <AppleCardResponsive product={p} index={i} />
          </div>
        ))}
      </div>

      {/* DOTS */}
      {products.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 8, paddingBottom: 4 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={activeDot === i ? 'apple-dot-active' : 'apple-dot'}
              style={{
                display: 'block', width: 7, height: 7, borderRadius: '50%',
                backgroundColor: activeDot === i ? '#ffffff' : 'rgba(255,255,255,0.3)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════

export function AppleProductsSection({
  products,
  categories = FALLBACK_CATEGORIES,
  title = 'All-new and lovable.',
  subtitle = 'The latest.',
  showCategoryNav = true,
  className,
  onCategoryChange,
  selectedCategory = null,
}: AppleProductsSectionProps) {
  const [localCat, setLocalCat] = useState<string | null>(selectedCategory);
  const cat = selectedCategory ?? localCat;

  const setCat = (id: string | null) => {
    setLocalCat(id);
    onCategoryChange?.(id);
  };

  const filtered = useMemo(() => {
    if (!cat || cat === 'all') return products;
    return products.filter((p) => p.category_id === cat || p.category?.id === cat);
  }, [products, cat]);

  const headingPhrases = useMemo(
    () => [subtitle, title].filter((phrase): phrase is string => Boolean(phrase)).map((phrase) => phrase.trim()),
    [subtitle, title],
  );

  return (
    <section
      data-apple-section
      className={className}
      style={{
        position: 'relative',
        backgroundColor: 'transparent',
        color: '#f5f5f7',
        fontFamily: SF,
        padding: 0,
        margin: 0,
        isolation: 'isolate',
        zIndex: 1,
        // Kill any inherited theme properties
        filter: 'none',
        WebkitFilter: 'none',
        borderColor: 'transparent',
        boxShadow: 'none',
        textShadow: 'none',
      }}
    >
      <InjectScopedStyle />
      <InjectResponsiveStyle />

      {/* Category ribbon */}
      {showCategoryNav && (
        <CategoryRibbon categories={categories} selected={cat} onSelect={setCat} />
      )}

      {/* Section heading */}
      <div
        className="apple-heading-wrap"
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 40,
          paddingBottom: 16,
        }}
      >
        <motion.div
          className="apple-heading-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          style={{
            borderRadius: 32,
            padding: '28px 26px 32px',
            background: 'linear-gradient(140deg, rgba(255,255,255,0.96), rgba(236,236,239,0.92))',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            color: '#050505',
          }}
        >
          <motion.h2
            className="apple-heading"
            style={{
              fontFamily: SF,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#050505',
            }}
          >
            {headingPhrases.map((phrase, idx) => (
              <motion.span
                key={`${phrase}-${idx}`}
                className="apple-heading-phrase"
                style={{
                  display: idx === 0 ? 'inline' : 'inline',
                  fontSize: idx === 0 ? 20 : 34,
                  fontWeight: idx === 0 ? 700 : 400,
                  textTransform: 'none',
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6, ease: 'easeOut' }}
              >
                {idx === 0 ? phrase + ' ' : phrase}
              </motion.span>
            ))}
          </motion.h2>
          <motion.div
            aria-hidden
            className="apple-heading-bar"
            style={{
              height: 3,
              borderRadius: 999,
              background: '#050505',
              marginTop: 18,
              opacity: 0.9,
            }}
            animate={{ width: ['32%', '68%', '42%'] }}
            transition={{ duration: 4.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Card carousel */}
      {filtered.length > 0 ? (
        <CardCarouselResponsive products={filtered} />
      ) : (
        <div style={{ padding: '64px 20px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: SF, margin: 0 }}>
            No products in this category yet.
          </p>
        </div>
      )}

      {/* Bottom spacer */}
      <div style={{ height: 24 }} />
    </section>
  );
}

export default AppleProductsSection;