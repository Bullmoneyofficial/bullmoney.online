/**
 * EXAMPLE INTEGRATION
 *
 * This file shows how to integrate all optimization features
 * into your page.tsx component. Copy relevant parts to your actual component.
 *
 * DO NOT IMPORT THIS FILE - IT'S JUST AN EXAMPLE!
 */

"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Settings, Zap } from 'lucide-react';

// Import optimization hooks and components
import { useOptimizations, usePersistedTheme, useUserPreferences } from '@/lib/useOptimizations';
import { SmartSplineLoader } from '@/components/Mainpage/SmartSplineLoader';
import { SwipeablePanel } from '@/components/Mainpage/SwipeablePanel';
import { MobileScrollIndicator } from '@/components/Mainpage/MobileScrollIndicator';

export default function ExamplePage() {
  // 1. INITIALIZE OPTIMIZATIONS
  const { deviceProfile, isReady, serviceWorkerReady, storage } = useOptimizations({
    enableServiceWorker: true,
    criticalScenes: [
      '/scene1.splinecode',  // Hero - load immediately
    ],
    preloadScenes: [
      '/scene.splinecode',    // Showcase - preload in background
      '/scene2.splinecode',   // Final - preload in background
    ]
  });

  // 2. USE THEME PERSISTENCE
  const { theme, setTheme, isLoaded: themeLoaded } = usePersistedTheme('t01');

  // 3. USE USER PREFERENCES
  const { preferences, updatePreference } = useUserPreferences();

  // 4. REFS FOR SCROLL
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 5. STATE
  const [currentPage, setCurrentPage] = useState(1);

  // Example: Save scroll position on page change
  useEffect(() => {
    storage.device.set('last_page', currentPage);
  }, [currentPage, storage]);

  // Example: Restore scroll position on mount
  useEffect(() => {
    const lastPage = storage.device.get('last_page', 1) as number;
    setCurrentPage(lastPage);
  }, [storage]);

  if (!isReady || !themeLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading optimizations...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Main Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="mobile-scroll w-full h-full"
      >
        {/* SECTION 1: Hero with Spline */}
        <section className="w-full h-screen relative">
          <SmartSplineLoader
            scene="/scene1.splinecode"
            priority="critical"
            deviceProfile={deviceProfile}
            enableInteraction={!deviceProfile.prefersReducedMotion}
            onLoad={() => console.log('Hero scene loaded!')}
            onError={(err) => console.error('Hero scene error:', err)}
            className="absolute inset-0"
            fallback={
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-white">Your browser doesn't support 3D scenes</div>
              </div>
            }
          />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-6xl font-bold text-white">
              Welcome to BULLMONEY
            </h1>
          </div>
        </section>

        {/* SECTION 2: Another Spline Scene */}
        <section className="w-full h-screen relative bg-gradient-to-b from-black to-gray-900">
          <SmartSplineLoader
            scene="/scene.splinecode"
            priority="high"
            deviceProfile={deviceProfile}
            enableInteraction={true}
            className="absolute inset-0"
          />
        </section>

        {/* SECTION 3: Regular Content */}
        <section className="w-full min-h-screen relative bg-gray-900 p-12">
          <div className="max-w-4xl mx-auto text-white">
            <h2 className="text-4xl font-bold mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-2">Fast Loading</h3>
                <p className="text-white/70">Service worker caching for instant loads</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-2">Smart Storage</h3>
                <p className="text-white/70">Works in all browsers and WebViews</p>
              </div>
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-semibold mb-2">Device Aware</h3>
                <p className="text-white/70">Optimized for your device</p>
              </div>
            </div>

            {/* Show device info (for testing) */}
            <div className="mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-xl font-semibold mb-4">Device Info</h3>
              <div className="space-y-2 text-sm">
                <div>Mobile: {deviceProfile.isMobile ? '✅' : '❌'}</div>
                <div>WebView: {deviceProfile.isWebView ? '✅' : '❌'}</div>
                <div>High-End: {deviceProfile.isHighEndDevice ? '✅' : '❌'}</div>
                <div>Connection: {deviceProfile.connectionType || 'Unknown'}</div>
                <div>Service Worker: {serviceWorkerReady ? '✅ Active' : '❌ Not available'}</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Scroll Indicator */}
      <MobileScrollIndicator
        scrollContainerRef={scrollContainerRef}
        accentColor="#3b82f6"
        position="right"
        showOnDesktop={false}
      />

      {/* Swipeable Theme Panel */}
      <SwipeablePanel
        title="Theme Settings"
        icon={<Palette size={20} />}
        position="bottom"
        defaultOpen={false}
        accentColor="#3b82f6"
        maxHeight="60vh"
        minHeight="60px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Current Theme: {theme}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['t01', 't02', 't03', 't04', 't05', 't06', 't07'].map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${theme === t
                      ? 'bg-blue-500 text-white scale-105'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <label className="flex items-center justify-between">
              <span className="text-white/70">Enable 3D Scenes</span>
              <input
                type="checkbox"
                checked={preferences.splineEnabled}
                onChange={(e) => updatePreference('splineEnabled', e.target.checked)}
                className="w-5 h-5"
              />
            </label>
          </div>

          <div>
            <label className="flex items-center justify-between">
              <span className="text-white/70">Reduced Motion</span>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
                className="w-5 h-5"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Volume: {Math.round(preferences.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.volume}
              onChange={(e) => updatePreference('volume', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </SwipeablePanel>

      {/* Swipeable Settings Panel (Example of multiple panels) */}
      <SwipeablePanel
        title="Performance"
        icon={<Zap size={20} />}
        position="bottom"
        defaultOpen={false}
        accentColor="#22c55e"
        maxHeight="40vh"
        minHeight="60px"
        className="z-[100001]" // Higher z-index than theme panel
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-semibold text-white mb-2">Cache Status</h4>
            <p className="text-sm text-white/70">
              Service Worker: {serviceWorkerReady ? 'Active ✅' : 'Inactive ❌'}
            </p>
            {serviceWorkerReady && (
              <button
                onClick={async () => {
                  const { swManager } = await import('@/lib/serviceWorker');
                  await swManager.clearCache();
                  alert('Cache cleared!');
                }}
                className="mt-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Clear Cache
              </button>
            )}
          </div>
        </div>
      </SwipeablePanel>

      {/* WebView Warning (Instagram/Facebook) */}
      {deviceProfile.isWebView && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/20 backdrop-blur-sm border-b border-yellow-500/30 px-4 py-2 z-[200000]">
          <p className="text-xs text-yellow-200 text-center">
            For best experience, open in your browser
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * INTEGRATION NOTES:
 *
 * 1. Copy the imports to your page.tsx
 * 2. Copy the useOptimizations() hook initialization
 * 3. Replace your Spline components with SmartSplineLoader
 * 4. Add SwipeablePanel for bottom controls
 * 5. Add MobileScrollIndicator
 * 6. Use storage.user and storage.device instead of localStorage
 *
 * TESTING:
 *
 * 1. Desktop: Should auto-load all scenes
 * 2. Mobile: Should show opt-in prompts for non-critical scenes
 * 3. Instagram/Facebook: Should use sessionStorage and aggressive caching
 * 4. Repeat visits: Should load instantly from cache
 *
 * TROUBLESHOOTING:
 *
 * - Check DevTools > Application > Service Workers
 * - Check DevTools > Application > Cache Storage
 * - Check console for optimization logs
 * - Verify deviceProfile is correct
 */
