"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { LiveMarketTicker } from "@/components/LiveMarketTicker";

const DraggableSplit = lazy(() => import('@/components/DraggableSplit'));
const SplineScene = lazy(() => import('@/components/SplineScene'));

function LazySplineContainer({ scene }: { scene: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {shouldLoad ? (
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full bg-black/5 animate-pulse rounded">
            <span className="text-white/40 text-sm">Loading scene...</span>
          </div>
        }>
          <SplineScene scene={scene} />
        </Suspense>
      ) : (
        <div className="w-full h-full bg-black/5 rounded" />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <CTA />
      <Features />

      <section className="w-full max-w-7xl mx-auto px-4 py-16">
        <Suspense fallback={
          <div className="w-full h-[800px] bg-black/5 rounded-lg animate-pulse" />
        }>
          <DraggableSplit>
            <LazySplineContainer scene="/scene4.splinecode" />
            <LazySplineContainer scene="/scene3.splinecode" />
          </DraggableSplit>
        </Suspense>
      </section>

      <LiveMarketTicker />
    </main>
  );
}