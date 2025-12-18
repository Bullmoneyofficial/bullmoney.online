"use client";

import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';

interface Props {
  scene: string;          // The URL to your .splinecode file
  className?: string;     // Extra styling if needed
  children?: React.ReactNode; // Your website content (Hero, Shop, etc.)
}

export default function LazySplineSection({ scene, className = "", children }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only load the heavy 3D scene when the user scrolls near it (10% visible)
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); 
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* 1. BACKGROUND: The 3D Scene */}
      <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
        {isVisible ? (
          <Spline className="w-full h-full object-cover" scene={scene} />
        ) : (
          // Lightweight placeholder while loading
          <div className="w-full h-full bg-black/20" />
        )}
      </div>

      {/* 2. FOREGROUND: Your Page Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}