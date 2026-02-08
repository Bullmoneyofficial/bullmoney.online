'use client';

import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURED PRODUCT SPOTLIGHT — Full-width hero showcase for top product
   
   Apple keynote-style single-product spotlight with large imagery,
   bold typography, and a CTA. Fully self-isolated.
   ═══════════════════════════════════════════════════════════════════════════ */

interface FeaturedProduct {
  title: string;
  src: string;
  price: number;
  description: string;
  comingSoon: boolean;
  buyUrl: string;
}

interface FeaturedProductSpotlightProps {
  products: FeaturedProduct[];
}

const SF = "'SF Pro Display','SF Pro Text',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif";

// ── Scoped CSS ─────────────────────────────────────────────────────────
const SCOPED_CSS = `
[data-featured-spotlight],
[data-featured-spotlight] *,
[data-featured-spotlight] *::before,
[data-featured-spotlight] *::after {
  filter: none !important;
  -webkit-filter: none !important;
  text-shadow: none !important;
}
[data-featured-spotlight] {
  background-color: rgb(0,0,0) !important;
  color: #f5f5f7 !important;
  border-color: transparent !important;
  box-shadow: none !important;
  isolation: isolate !important;
  position: relative !important;
}
[data-featured-spotlight] a,
[data-featured-spotlight] a:hover,
[data-featured-spotlight] a:focus {
  text-decoration: none !important;
  text-shadow: none !important;
}
[data-featured-spotlight] p {
  color: rgba(255,255,255,0.6) !important;
}

@keyframes fps-reveal {
  0% { opacity: 0; transform: translateY(40px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fps-text-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes fps-shimmer {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
@keyframes fps-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
  50% { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
}
`;

/* ── Featured Card ────────────────────────────────────────────────────── */
const SpotlightCard = memo(({
  product,
  index,
  isMain,
}: {
  product: FeaturedProduct;
  index: number;
  isMain: boolean;
}) => (
  <Link
    href={product.buyUrl}
    style={{
      display: 'block',
      position: 'relative',
      borderRadius: isMain ? 28 : 20,
      overflow: 'hidden',
      backgroundColor: 'rgb(12,12,12)',
      border: `1px solid rgba(255,255,255,${isMain ? 0.1 : 0.05})`,
      textDecoration: 'none',
      animation: `fps-reveal 0.8s ease-out ${index * 120}ms both`,
      transition: 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.5s ease',
      gridColumn: isMain ? 'span 2' : 'span 1',
      gridRow: isMain ? 'span 2' : 'span 1',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.02)';
      e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {/* Image container */}
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: isMain ? '3/4' : '1/1',
      overflow: 'hidden',
    }}>
      <Image
        src={product.src}
        alt={product.title}
        fill
        sizes={isMain ? '(max-width:768px) 100vw, 60vw' : '(max-width:768px) 50vw, 30vw'}
        style={{
          objectFit: 'cover',
          transition: 'transform 0.7s cubic-bezier(0.2,0.8,0.2,1)',
          filter: product.comingSoon ? 'grayscale(0.8) brightness(0.4)' : 'none',
        }}
      />

      {/* Gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isMain
          ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
      }} />

      {/* Coming Soon */}
      {product.comingSoon && (
        <div style={{
          position: 'absolute',
          top: isMain ? 20 : 12,
          right: isMain ? 20 : 12,
          padding: '5px 14px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: 'rgb(0,0,0)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          fontFamily: SF,
        }}>
          Coming Soon
        </div>
      )}

      {/* Main badge */}
      {isMain && !product.comingSoon && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '6px 16px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'rgb(0,0,0)',
          background: 'linear-gradient(135deg, rgb(255,255,255) 0%, rgb(200,200,200) 100%)',
          borderRadius: 20,
          fontFamily: SF,
          animation: 'fps-pulse 2.5s ease-in-out infinite',
        }}>
          ★ Featured
        </div>
      )}

      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMain ? '40px 28px' : '20px 16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: isMain ? 12 : 6,
      }}>
        {isMain && (
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.4) !important' as any,
            fontFamily: SF,
            margin: 0,
            animation: `fps-text-up 0.6s ease-out 200ms both`,
          }}>
            Staff Pick
          </p>
        )}
        <h3 style={{
          fontSize: isMain ? 'clamp(24px, 4vw, 36px)' : 16,
          fontWeight: isMain ? 700 : 600,
          color: 'rgb(255,255,255)',
          fontFamily: SF,
          lineHeight: 1.2,
          letterSpacing: isMain ? '-0.02em' : '-0.01em',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          animation: `fps-text-up 0.6s ease-out ${isMain ? 300 : 150}ms both`,
        }}>
          {product.title}
        </h3>
        {isMain && product.description && (
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.5) !important' as any,
            fontFamily: SF,
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 400,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            animation: `fps-text-up 0.6s ease-out 400ms both`,
          }}>
            {product.description}
          </p>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: isMain ? 8 : 0,
          animation: `fps-text-up 0.6s ease-out ${isMain ? 500 : 200}ms both`,
        }}>
          <span style={{
            fontSize: isMain ? 22 : 15,
            fontWeight: 700,
            color: 'rgb(255,255,255)',
            fontFamily: SF,
          }}>
            ${product.price?.toFixed(2) || '0.00'}
          </span>
          {isMain && !product.comingSoon && (
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'rgb(0,0,0)',
              backgroundColor: 'rgb(255,255,255)',
              padding: '8px 20px',
              borderRadius: 24,
              fontFamily: SF,
              transition: 'all 0.2s ease',
            }}>
              Shop Now
            </span>
          )}
        </div>
      </div>
    </div>
  </Link>
));
SpotlightCard.displayName = 'SpotlightCard';

/* ── Main Component ───────────────────────────────────────────────────── */
export function FeaturedProductSpotlight({ products }: FeaturedProductSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { rootMargin: '100px 0px', threshold: 0.05 },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Pick the best products - first non-comingSoon as main, then fill grid
  const { main, secondary } = useMemo(() => {
    const available = products.filter(p => !p.comingSoon);
    const comingSoon = products.filter(p => p.comingSoon);
    const all = [...available, ...comingSoon];
    return {
      main: all[0] || null,
      secondary: all.slice(1, 5), // up to 4 secondary
    };
  }, [products]);

  if (!main) return null;

  return (
    <div
      ref={containerRef}
      data-featured-spotlight
      style={{
        width: '100%',
        backgroundColor: 'rgb(0,0,0)',
        fontFamily: SF,
        padding: '80px 0',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />

      {/* Section header */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        marginBottom: 48,
      }}>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.35) !important' as any,
          marginBottom: 8,
          fontFamily: SF,
        }}>
          Handpicked For You
        </p>
        <h2 style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 700,
          color: 'rgb(255,255,255)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          fontFamily: SF,
          margin: 0,
          background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: isVisible ? 'fps-shimmer 4s linear infinite' : 'none',
        }}>
          Featured Products
        </h2>
      </div>

      {/* Bento-style grid */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {/* Main featured product */}
          {isVisible && (
            <>
              <SpotlightCard product={main} index={0} isMain={true} />
              {secondary.map((p, i) => (
                <SpotlightCard key={`${p.title}-${i}`} product={p} index={i + 1} isMain={false} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {products.length > 5 && (
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '40px 24px 0',
          textAlign: 'center' as const,
        }}>
          <Link
            href="/store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 32px',
              fontSize: 14,
              fontWeight: 600,
              color: 'rgb(255,255,255)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 28,
              backgroundColor: 'rgba(255,255,255,0.05)',
              fontFamily: SF,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            View All Products →
          </Link>
        </div>
      )}
    </div>
  );
}

export default FeaturedProductSpotlight;
