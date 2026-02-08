'use client';

import React, { useRef, useEffect, useState, useMemo, memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE PRODUCTS SECTION — Horizontal scrolling product timeline
   
   Apple-style horizontal scroll with snap, year markers, and smooth
   momentum. Fully self-isolated with inline styles + scoped CSS.
   ═══════════════════════════════════════════════════════════════════════════ */

interface TimelineProduct {
  title: string;
  src: string;
  price: number;
  description: string;
  comingSoon: boolean;
  buyUrl: string;
}

interface TimelineProductsSectionProps {
  products: TimelineProduct[];
}

const SF = "'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif";

// ── Scoped CSS ─────────────────────────────────────────────────────────
const SCOPED_CSS = `
[data-timeline-products],
[data-timeline-products] *,
[data-timeline-products] *::before,
[data-timeline-products] *::after {
  filter: none !important;
  -webkit-filter: none !important;
  text-shadow: none !important;
}
[data-timeline-products] {
  background-color: rgb(0,0,0) !important;
  color: #f5f5f7 !important;
  border-color: transparent !important;
  box-shadow: none !important;
  isolation: isolate !important;
  position: relative !important;
}
[data-timeline-products] a,
[data-timeline-products] a:hover,
[data-timeline-products] a:focus {
  text-decoration: none !important;
  text-shadow: none !important;
  color: #f5f5f7 !important;
}
[data-timeline-products] p {
  color: rgba(255,255,255,0.6) !important;
}

/* Hide scrollbar */
[data-timeline-products] .tps-scroll::-webkit-scrollbar { display: none; }
[data-timeline-products] .tps-scroll { -ms-overflow-style: none; scrollbar-width: none; }

/* Snap */
[data-timeline-products] .tps-scroll { scroll-snap-type: x mandatory; }
[data-timeline-products] .tps-card { scroll-snap-align: start; }

/* Hover lift */
[data-timeline-products] .tps-card:hover .tps-img {
  transform: scale(1.05);
}
[data-timeline-products] .tps-card:hover .tps-overlay {
  opacity: 0.85;
}

@keyframes tps-fade-up {
  0% { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tps-line-grow {
  0% { width: 0; }
  100% { width: 100%; }
}
`;

/* ── Single Product Card ─────────────────────────────────────────────── */
const TimelineCard = memo(({ product, index }: { product: TimelineProduct; index: number }) => (
  <Link
    href={product.buyUrl}
    className="tps-card"
    style={{
      display: 'block',
      flexShrink: 0,
      width: 280,
      minWidth: 280,
      textDecoration: 'none',
      animation: `tps-fade-up 0.6s ease-out ${index * 80}ms both`,
    }}
  >
    {/* Image */}
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgb(18,18,18)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Image
        src={product.src}
        alt={product.title}
        fill
        sizes="280px"
        className="tps-img"
        style={{
          objectFit: 'cover',
          transition: 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
          filter: product.comingSoon ? 'grayscale(1) brightness(0.5)' : 'none',
        }}
      />

      {/* Gradient overlay */}
      <div
        className="tps-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          opacity: 0.7,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Coming Soon badge */}
      {product.comingSoon && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '4px 12px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'rgb(0,0,0)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          fontFamily: SF,
        }}>
          Coming Soon
        </div>
      )}

      {/* Bottom info */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
      }}>
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'rgb(255,255,255)',
          fontFamily: SF,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {product.title}
        </span>
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: SF,
        }}>
          ${product.price?.toFixed(2) || '0.00'}
        </span>
      </div>
    </div>

    {/* Timeline dot below card */}
    <div style={{
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      marginTop: 16,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: product.comingSoon ? 'rgba(255,255,255,0.2)' : 'rgb(255,255,255)',
        boxShadow: product.comingSoon ? 'none' : '0 0 12px rgba(255,255,255,0.3)',
        transition: 'all 0.3s ease',
      }} />
    </div>
  </Link>
));
TimelineCard.displayName = 'TimelineCard';

/* ── Main Component ───────────────────────────────────────────────────── */
export function TimelineProductsSection({ products }: TimelineProductsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Visibility observer
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { rootMargin: '100px 0px', threshold: 0.05 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Scroll state tracking
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  }, []);

  // Split into available and coming soon  
  const { available, upcoming } = useMemo(() => ({
    available: products.filter(p => !p.comingSoon),
    upcoming: products.filter(p => p.comingSoon),
  }), [products]);

  const allOrdered = useMemo(() => [...available, ...upcoming], [available, upcoming]);

  if (products.length === 0) return null;

  return (
    <div
      ref={containerRef}
      data-timeline-products
      style={{
        width: '100%',
        backgroundColor: 'rgb(0,0,0)',
        fontFamily: SF,
        padding: '80px 0 60px',
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />

      {/* Header */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        marginBottom: 48,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap' as const,
        }}>
          <div>
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.35)',
              marginBottom: 8,
              fontFamily: SF,
            }}>
              Our Collection
            </p>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 700,
              color: 'rgb(255,255,255)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: SF,
              margin: 0,
            }}>
              Product Timeline
            </h2>
            <p style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 8,
              fontFamily: SF,
              maxWidth: 400,
              lineHeight: 1.5,
            }}>
              Every product tells a story. Scroll through our journey.
            </p>
          </div>

          {/* Navigation arrows */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: canScrollLeft ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: canScrollLeft ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.2)',
                cursor: canScrollLeft ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontSize: 18,
              }}
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: canScrollRight ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: canScrollRight ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.2)',
                cursor: canScrollRight ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                fontSize: 18,
              }}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Timeline line */}
      <div style={{
        position: 'relative',
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
      }}>
        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="tps-scroll"
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 40,
            paddingTop: 4,
          }}
        >
          {allOrdered.map((product, i) => (
            <TimelineCard key={`${product.title}-${i}`} product={product} index={i} />
          ))}
        </div>

        {/* Continuous timeline bar */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 24,
          right: 24,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}>
          {isVisible && (
            <div style={{
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              animation: 'tps-line-grow 1.5s ease-out both',
            }} />
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '32px 24px 0',
        display: 'flex',
        gap: 40,
        flexWrap: 'wrap' as const,
      }}>
        {[
          { label: 'Products', value: available.length.toString() },
          { label: 'Coming Soon', value: upcoming.length.toString() },
          { label: 'Categories', value: 'Premium' },
        ].map((stat, j) => (
          <div key={j} style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            <span style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'rgb(255,255,255)',
              fontFamily: SF,
            }}>
              {stat.value}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              fontFamily: SF,
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelineProductsSection;
