"use client";

import { useState, useEffect, useRef } from 'react';

interface MemoryStats {
  jsHeapUsed: number; // MB - Current JS heap
  jsHeapLimit: number; // MB - Max JS heap browser allows
  deviceRam: number; // GB - Total device RAM
  browserAllocated: number; // MB - Browser process allocation
  percentage: number; // 0-100 - JS heap percentage
  external: number; // MB - Non-heap memory
  updateTime: number; // timestamp
}

/**
 * Hook for real-time JavaScript heap memory monitoring + device RAM detection
 * Updates every 500ms with actual browser memory usage vs device capacity
 */
export function useRealTimeMemory(): MemoryStats {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    jsHeapUsed: 0,
    jsHeapLimit: 0,
    deviceRam: 4,
    browserAllocated: 0,
    percentage: 0,
    external: 0,
    updateTime: Date.now(),
  });

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get device memory API value (actual device RAM)
    const deviceMemory = typeof (navigator as any).deviceMemory === 'number' 
      ? (navigator as any).deviceMemory 
      : 4;

    const updateMemory = () => {
      const now = Date.now();
      const jsMemory = (performance as any).memory;

      if (jsMemory) {
        const jsHeapUsedMB = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
        const jsHeapLimitMB = Math.round(jsMemory.jsHeapSizeLimit / 1024 / 1024);
        const externalMB = Math.round(jsMemory.jsExternalMemoryUsage ? jsMemory.jsExternalMemoryUsage / 1024 / 1024 : 0);
        
        // Total browser process allocation (heap + external)
        const browserAllocatedMB = jsHeapUsedMB + externalMB;
        
        // Calculate percentage based on heap limit
        const percentage = Math.round((jsHeapUsedMB / jsHeapLimitMB) * 100);

        setMemoryStats({
          jsHeapUsed: jsHeapUsedMB,
          jsHeapLimit: jsHeapLimitMB,
          deviceRam: deviceMemory,
          browserAllocated: browserAllocatedMB,
          percentage,
          external: externalMB,
          updateTime: now,
        });
      }
    };

    // Initial update
    updateMemory();

    // Update every 500ms for smooth real-time tracking
    updateIntervalRef.current = setInterval(updateMemory, 500);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return memoryStats;
}
