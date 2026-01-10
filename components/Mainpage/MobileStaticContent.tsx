"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDeviceProfile } from "@/lib/deviceProfile";
import { SmartSplineLoader } from "@/components/Mainpage/SmartSplineLoader";

// ============================================================================
// DYNAMIC IMPORTS - Optimize bundle splitting
// ============================================================================

const SocialsFooter = dynamic(() => import("@/components/Mainpage/Socialsfooter"), {
  ssr: false,
  loading: () => <div className="h-24 bg-black/50 animate-pulse" />
});

const HeroMain = dynamic(() => import("@/app/VIP/heromain"), {
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

const ShopFunnel = dynamic(() => import("@/app/shop/ShopFunnel"), {
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

const ProductsSection = dynamic(() => import("@/app/VIP/ProductsSection"), {
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

const ShopScrollFunnel = dynamic(() => import("@/app/shop/ShopScrollFunnel"), {
  ssr: false,
  loading: () => <div className="h-screen bg-black/50 animate-pulse" />
});

const Vorb = dynamic(() => import("@/components/Mainpage/Vorb"), {
  ssr: false,
  loading: () => null
});

// ============================================================================
// OPTIMIZED SPLINE SECTION - Universal (Mobile + Desktop)
// ============================================================================

interface OptimizedSplineSectionProps {
  scene: string;
  priority: "critical" | "high" | "normal" | "low";
  deviceProfile: ReturnType<typeof useDeviceProfile>;
  label?: string;
  disableSpline?: boolean;
  className?: string;
}

const OptimizedSplineSection = React.memo(({
  scene,
  priority,
  deviceProfile,
  label,
  disableSpline = false,
  className = "",
}: OptimizedSplineSectionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [shouldRender, setShouldRender] = useState(priority === "critical");
  const pointerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CRITICAL: Always render hero scene, otherwise respect performance settings
  const canRender = priority === "critical" || !disableSpline;

  // Track viewport intersection with optimized thresholds
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canRender) return;

    const root = el.closest("[data-scroll-container]") as Element | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        const inView = entry.isIntersecting && entry.intersectionRatio > 0.1;
        setIsInView(inView);

        // Lazy render non-critical scenes when they come into view
        if (inView && !shouldRender && priority !== "critical") {
          // Use requestIdleCallback for non-blocking render trigger
          if (typeof window !== 'undefined') {
            const scheduleRender = (window as any).requestIdleCallback || window.requestAnimationFrame;
            scheduleRender(() => {
              setShouldRender(true);
            });
          } else {
            setShouldRender(true);
          }
        }

        // Disable pointer when out of view to save resources
        if (!inView) {
          setIsPointerActive(false);
        }
      },
      {
        root,
        threshold: [0, 0.1, 0.5],
        rootMargin: "150px" // Preload slightly before visible for smooth experience
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [canRender, priority, shouldRender]);

  // Pointer event handlers with debouncing for performance
  const handlePointerEnter = useCallback(() => {
    if (isInView) {
      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
      setIsPointerActive(true);
    }
  }, [isInView]);

  const handlePointerLeave = useCallback(() => {
    if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
    pointerTimeoutRef.current = setTimeout(() => {
      setIsPointerActive(false);
    }, 150);
  }, []);

  const handlePointerDown = useCallback(() => {
    if (isInView) {
      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
      setIsPointerActive(true);
    }
  }, [isInView]);

  const handlePointerUp = useCallback(() => {
    if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
    pointerTimeoutRef.current = setTimeout(() => {
      setIsPointerActive(false);
    }, 200);
  }, []);

  // Cleanup pointer timeout on unmount
  useEffect(() => {
    return () => {
      if (pointerTimeoutRef.current) {
        clearTimeout(pointerTimeoutRef.current);
      }
    };
  }, []);

  // Render fallback if Spline is disabled (except for critical scenes)
  if (!canRender) {
    return (
      <div className={`relative w-full h-[100dvh] bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20 flex items-center justify-center ${className}`}>
        <div className="text-center px-6">
          <h2 className="text-4xl font-bold text-white/60 mb-4">3D Disabled</h2>
          <p className="text-white/40 text-sm">Enable in performance settings</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[100dvh] overflow-hidden bg-black ${className}`}
      style={{
        touchAction: "none",
        contain: "layout paint size style",
        isolation: "isolate",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        willChange: isInView ? "transform" : "auto",
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerLeave}
    >
      {/* Scene Label */}
      {label && (
        <div className="absolute bottom-20 sm:bottom-24 left-4 sm:left-6 z-20 pointer-events-none transition-all duration-1000 ease-out max-w-[85%]">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter select-none drop-shadow-2xl">
            {label}
          </h2>
        </div>
      )}

      {/* Smart Spline Loader - Only render when shouldRender is true */}
      {shouldRender && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: isPointerActive ? "auto" : "none",
            opacity: isInView ? 1 : 0.3,
            transition: "opacity 0.5s ease-out"
          }}
        >
          <SmartSplineLoader
            scene={scene}
            priority={priority}
            enableInteraction={isInView && isPointerActive}
            deviceProfile={deviceProfile}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      )}

      {/* Gradient overlays for smooth blending */}
      <div className="absolute top-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
});

OptimizedSplineSection.displayName = "OptimizedSplineSection";

// ============================================================================
// MAIN MOBILE CONTENT COMPONENT
// ============================================================================

interface MobileStaticContentProps {
  disableSpline?: boolean;
}

export function MobileStaticContent({ disableSpline = false }: MobileStaticContentProps) {
  const deviceProfile = useDeviceProfile();
  const [isClient, setIsClient] = useState(false);
  const enableVorb = !disableSpline && !deviceProfile.prefersReducedMotion && !deviceProfile.isMobile && deviceProfile.isHighEndDevice;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading Trading Platform...</div>
      </div>
    );
  }

  return (
    <div className="w-full text-white bg-black">
      {/* Vorb Background - Universal Ghost Cursor Effect */}
      {enableVorb && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Vorb />
        </div>
      )}

      {/* Main Content Stack */}
      <div className="relative z-10">
        {/* 1. Socials Footer */}
        <section className="w-full py-8 sm:py-12">
          <SocialsFooter />
        </section>

        {/* 2. Hero Spline - ALWAYS RENDERS (Critical Scene) */}
        <section className="w-full">
          <OptimizedSplineSection
            scene="/scene1.splinecode"
            priority="critical"
            deviceProfile={deviceProfile}
            label="TRADING COMMAND CENTER"
            disableSpline={false} // Hero always renders regardless of performance settings
          />
        </section>

        {/* 3. VIP Hero Main */}
        <section className="w-full py-12 sm:py-16">
          <HeroMain />
        </section>

        {/* 4. Shop Funnel */}
        <section className="w-full py-12 sm:py-16">
          <ShopFunnel />
        </section>

        {/* 5. Products Section */}
        <section className="w-full py-12 sm:py-16">
          <ProductsSection />
        </section>

        {/* 6. Shop Scroll Funnel */}
        <section className="w-full py-12 sm:py-16">
          <ShopScrollFunnel />
        </section>
      </div>
    </div>
  );
}

export default MobileStaticContent;
