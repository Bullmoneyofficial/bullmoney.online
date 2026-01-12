"use client";

/**
 * Mobile-Optimized Spline Loader
 * Detects device capabilities and serves appropriate quality
 */

import { useEffect, useState } from "react";
import { deviceMonitor } from "@/lib/deviceMonitor";

export interface SplineQualityConfig {
  quality: "high" | "medium" | "low";
  maxPolygons: number;
  textureResolution: "4k" | "2k" | "1k" | "512";
  useInstancing: boolean;
  enablePhysics: boolean;
  animationFrameRate: 30 | 60 | 90 | 120;
}

export class MobileSplineOptimizer {
  private static instance: MobileSplineOptimizer;
  private qualityConfig: SplineQualityConfig;

  static getInstance(): MobileSplineOptimizer {
    if (!this.instance) {
      this.instance = new MobileSplineOptimizer();
    }
    return this.instance;
  }

  constructor() {
    this.qualityConfig = this.detectOptimalQuality();
  }

  /**
   * Detect optimal quality based on device capabilities
   */
  private detectOptimalQuality(): SplineQualityConfig {
    const info = deviceMonitor.getInfo();
    const isMobile = window.innerWidth < 768;
    const hasHighMemory = info.performance.memory.total >= 4;
    const hasGPU = info.performance.gpu.tier === "high";
    const fps = info.live.fps;

    // Get native refresh rate (ProMotion iPhones/iPads support 120Hz)
    const nativeHz = typeof window !== 'undefined' 
      ? Math.min((window.screen as any)?.refreshRate || 120, 120) 
      : 60;
    
    // Mobile devices - optimized for high refresh rate displays
    if (isMobile) {
      // High-end mobile (iPhone Pro, iPad Pro, flagship Android)
      if (hasHighMemory && hasGPU && fps >= 50) {
        return {
          quality: "high",
          maxPolygons: 500000,
          textureResolution: "2k",
          useInstancing: true,
          enablePhysics: true,
          animationFrameRate: nativeHz as 60 | 90 | 120, // Up to 120Hz on ProMotion
        };
      }
      // Mid-range mobile
      if (hasHighMemory || (hasGPU && fps >= 40)) {
        return {
          quality: "medium",
          maxPolygons: 250000,
          textureResolution: "1k",
          useInstancing: true,
          enablePhysics: false,
          animationFrameRate: Math.min(nativeHz, 60) as 30 | 60, // Up to 60Hz
        };
      }
      // Low-end mobile
      return {
        quality: "low",
        maxPolygons: 100000,
        textureResolution: "512",
        useInstancing: false,
        enablePhysics: false,
        animationFrameRate: 30,
      };
    }

    // Get native refresh rate for desktop (gaming monitors can be 144Hz+)
    const desktopHz = typeof window !== 'undefined' 
      ? Math.min((window.screen as any)?.refreshRate || 120, 120) 
      : 60;
    
    // Desktop - use high quality with 120Hz support
    if (hasGPU && fps >= 55) {
      return {
        quality: "high",
        maxPolygons: 2000000,
        textureResolution: "4k",
        useInstancing: true,
        enablePhysics: true,
        animationFrameRate: desktopHz as 60 | 90 | 120, // Up to 120Hz
      };
    }

    return {
      quality: "medium",
      maxPolygons: 1000000,
      textureResolution: "2k",
      useInstancing: true,
      enablePhysics: true,
      animationFrameRate: Math.min(desktopHz, 90) as 60 | 90, // Up to 90Hz for medium
    };
  }

  getQualityConfig(): SplineQualityConfig {
    return this.qualityConfig;
  }

  /**
   * Recommend fallback type if spline fails
   */
  recommendFallback(): "static-image" | "gradient" | "hidden" {
    const isMobile = window.innerWidth < 768;
    const info = deviceMonitor.getInfo();

    // Very low-end devices - hide splines
    if (isMobile && info.performance.memory.total < 2) {
      return "hidden";
    }

    // Medium-end mobile - show gradient
    if (isMobile && info.live.fps < 30) {
      return "gradient";
    }

    // Otherwise show static image
    return "static-image";
  }
}

/**
 * Hook for mobile spline optimization
 */
export const useMobileSplineOptimization = () => {
  const [config, setConfig] = useState<SplineQualityConfig | null>(null);

  useEffect(() => {
    const optimizer = MobileSplineOptimizer.getInstance();
    setConfig(optimizer.getQualityConfig());
  }, []);

  return config;
};
