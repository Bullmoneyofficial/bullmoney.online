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
  animationFrameRate: 30 | 60;
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

    // Mobile devices - aggressive optimization
    if (isMobile) {
      if (hasHighMemory && hasGPU && fps >= 50) {
        return {
          quality: "high",
          maxPolygons: 500000,
          textureResolution: "2k",
          useInstancing: true,
          enablePhysics: true,
          animationFrameRate: 60,
        };
      }
      if (hasHighMemory || (hasGPU && fps >= 40)) {
        return {
          quality: "medium",
          maxPolygons: 250000,
          textureResolution: "1k",
          useInstancing: true,
          enablePhysics: false,
          animationFrameRate: 30,
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

    // Desktop - use high quality
    if (hasGPU && fps >= 55) {
      return {
        quality: "high",
        maxPolygons: 2000000,
        textureResolution: "4k",
        useInstancing: true,
        enablePhysics: true,
        animationFrameRate: 60,
      };
    }

    return {
      quality: "medium",
      maxPolygons: 1000000,
      textureResolution: "2k",
      useInstancing: true,
      enablePhysics: true,
      animationFrameRate: 60,
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
