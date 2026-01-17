"use client";

/**
 * FPS Performance Audit - Development Tool
 * 
 * Use this to identify performance bottlenecks in your app.
 * Only active in development mode.
 * 
 * Features:
 * - Identifies slow renders (>16ms)
 * - Tracks expensive DOM operations
 * - Monitors memory usage
 * - Logs animation frame drops
 */

// ============================================================================
// PERFORMANCE OBSERVER - Track long tasks
// ============================================================================

let isAuditActive = false;
let longTaskObserver: PerformanceObserver | null = null;
let frameDrops = 0;
let lastFrameTime = 0;
let auditInterval: NodeJS.Timeout | null = null;

interface PerformanceAuditResults {
  longTasks: number;
  frameDrops: number;
  avgFrameTime: number;
  memoryUsage: number | null;
  domNodes: number;
  slowestComponents: string[];
}

const results: PerformanceAuditResults = {
  longTasks: 0,
  frameDrops: 0,
  avgFrameTime: 0,
  memoryUsage: null,
  domNodes: 0,
  slowestComponents: [],
};

const frameTimes: number[] = [];
const MAX_FRAME_SAMPLES = 120;

/**
 * Start the FPS audit - only works in development
 */
export function startFpsAudit() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') {
    console.log('[FpsAudit] Only available in development mode');
    return;
  }
  
  if (isAuditActive) {
    console.log('[FpsAudit] Already running');
    return;
  }
  
  isAuditActive = true;
  frameDrops = 0;
  frameTimes.length = 0;
  results.longTasks = 0;
  
  console.log('[FpsAudit] 🔍 Starting performance audit...');
  
  // Track long tasks (>50ms)
  if ('PerformanceObserver' in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          results.longTasks++;
          if (entry.duration > 100) {
            console.warn(`[FpsAudit] ⚠️ Very long task: ${entry.duration.toFixed(1)}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // longtask not supported
    }
  }
  
  // Track frame times
  let rafId: number;
  const trackFrames = (timestamp: number) => {
    if (!isAuditActive) return;
    
    if (lastFrameTime > 0) {
      const frameTime = timestamp - lastFrameTime;
      frameTimes.push(frameTime);
      
      // Keep only recent samples
      if (frameTimes.length > MAX_FRAME_SAMPLES) {
        frameTimes.shift();
      }
      
      // Detect frame drop (>32ms = below 30fps)
      if (frameTime > 32) {
        frameDrops++;
      }
      
      // Severe frame drop warning
      if (frameTime > 100) {
        console.warn(`[FpsAudit] 🔴 Major frame drop: ${frameTime.toFixed(1)}ms`);
      }
    }
    
    lastFrameTime = timestamp;
    rafId = requestAnimationFrame(trackFrames);
  };
  
  rafId = requestAnimationFrame(trackFrames);
  
  // Periodic stats logging
  auditInterval = setInterval(() => {
    if (!isAuditActive) return;
    
    // Calculate stats
    const avgFrameTime = frameTimes.length > 0
      ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      : 0;
    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
    const minFrameTime = Math.min(...frameTimes);
    const maxFrameTime = Math.max(...frameTimes);
    
    // Memory usage (if available)
    const memory = (performance as any).memory;
    const memoryMB = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null;
    
    // DOM node count
    const domNodes = document.querySelectorAll('*').length;
    
    // Update results
    results.avgFrameTime = avgFrameTime;
    results.frameDrops = frameDrops;
    results.memoryUsage = memoryMB;
    results.domNodes = domNodes;
    
    // Log summary
    console.log(`[FpsAudit] 📊 FPS: ${fps} | Avg: ${avgFrameTime.toFixed(1)}ms | Drops: ${frameDrops} | DOM: ${domNodes} | Memory: ${memoryMB || 'N/A'}MB | Long tasks: ${results.longTasks}`);
    
    // Warnings
    if (fps < 30) {
      console.error('[FpsAudit] 🔴 CRITICAL: FPS below 30!');
    } else if (fps < 50) {
      console.warn('[FpsAudit] 🟡 WARNING: FPS below 50');
    }
    
    if (domNodes > 3000) {
      console.warn(`[FpsAudit] ⚠️ High DOM node count: ${domNodes}`);
    }
    
    if (memoryMB && memoryMB > 200) {
      console.warn(`[FpsAudit] ⚠️ High memory usage: ${memoryMB}MB`);
    }
  }, 5000);
}

/**
 * Stop the FPS audit and get results
 */
export function stopFpsAudit(): PerformanceAuditResults {
  if (!isAuditActive) {
    console.log('[FpsAudit] Not running');
    return results;
  }
  
  isAuditActive = false;
  lastFrameTime = 0;
  
  if (longTaskObserver) {
    longTaskObserver.disconnect();
    longTaskObserver = null;
  }
  
  if (auditInterval) {
    clearInterval(auditInterval);
    auditInterval = null;
  }
  
  // Final report
  const avgFrameTime = frameTimes.length > 0
    ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    : 0;
  const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
  
  console.log('\n[FpsAudit] 📋 FINAL REPORT:');
  console.log(`  Average FPS: ${fps}`);
  console.log(`  Frame drops: ${frameDrops}`);
  console.log(`  Long tasks: ${results.longTasks}`);
  console.log(`  DOM nodes: ${document.querySelectorAll('*').length}`);
  console.log(`  Recommendations:`);
  
  if (fps < 50) {
    console.log('  - 🔴 Reduce animation complexity');
    console.log('  - 🔴 Check for backdrop-blur usage');
    console.log('  - 🔴 Disable non-essential shimmers');
  }
  
  if (results.longTasks > 10) {
    console.log('  - 🟡 Split long-running tasks with requestIdleCallback');
  }
  
  if (document.querySelectorAll('*').length > 2000) {
    console.log('  - 🟡 Consider virtualizing long lists');
    console.log('  - 🟡 Unmount hidden components');
  }
  
  console.log('\n[FpsAudit] ✅ Audit complete');
  
  return results;
}

/**
 * Quick FPS check - returns current FPS without starting full audit
 */
export function getQuickFps(): Promise<number> {
  return new Promise((resolve) => {
    const times: number[] = [];
    let last = performance.now();
    let count = 0;
    
    const measure = () => {
      const now = performance.now();
      times.push(now - last);
      last = now;
      count++;
      
      if (count < 30) {
        requestAnimationFrame(measure);
      } else {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        resolve(Math.round(1000 / avg));
      }
    };
    
    requestAnimationFrame(measure);
  });
}

/**
 * Identify expensive elements on the page
 */
export function findExpensiveElements(): void {
  if (typeof window === 'undefined') return;
  
  console.log('[FpsAudit] 🔍 Scanning for expensive elements...\n');
  
  // Find elements with backdrop-blur
  const blurElements = document.querySelectorAll('[class*="backdrop-blur"]');
  if (blurElements.length > 0) {
    console.warn(`[FpsAudit] 🔴 Found ${blurElements.length} elements with backdrop-blur (expensive!)`);
    blurElements.forEach((el, i) => {
      if (i < 5) console.log('  -', el.tagName, el.className.split(' ').find(c => c.includes('backdrop-blur')));
    });
  }
  
  // Find spinning animations
  const spinElements = document.querySelectorAll('[class*="animate-spin"], [style*="animation"][style*="spin"]');
  if (spinElements.length > 0) {
    console.warn(`[FpsAudit] 🟡 Found ${spinElements.length} spinning elements`);
  }
  
  // Find elements with complex box-shadows
  const shadowElements = document.querySelectorAll('[class*="shadow-2xl"], [class*="shadow-xl"]');
  if (shadowElements.length > 10) {
    console.warn(`[FpsAudit] 🟡 Found ${shadowElements.length} elements with complex shadows`);
  }
  
  // Find shimmer elements
  const shimmerElements = document.querySelectorAll('[data-shimmer], .shimmer-line, .shimmer-border, .shimmer-glow');
  console.log(`[FpsAudit] 💫 Active shimmer elements: ${shimmerElements.length}`);
  
  // Find canvas elements
  const canvases = document.querySelectorAll('canvas');
  console.log(`[FpsAudit] 🎨 Canvas elements: ${canvases.length}`);
  
  // Find video elements
  const videos = document.querySelectorAll('video');
  console.log(`[FpsAudit] 🎬 Video elements: ${videos.length}`);
  
  // Count total animations
  const allAnimated = document.querySelectorAll('[class*="animate-"]');
  console.log(`[FpsAudit] ✨ Animated elements: ${allAnimated.length}`);
  
  console.log('\n[FpsAudit] ✅ Scan complete');
}

// Export for console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).fpsAudit = {
    start: startFpsAudit,
    stop: stopFpsAudit,
    quickFps: getQuickFps,
    findExpensive: findExpensiveElements,
  };
  console.log('[FpsAudit] 🛠️ Dev tools available: window.fpsAudit.start(), .stop(), .quickFps(), .findExpensive()');
}

export default { startFpsAudit, stopFpsAudit, getQuickFps, findExpensiveElements };
