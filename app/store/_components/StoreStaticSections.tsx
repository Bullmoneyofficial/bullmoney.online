'use client';

/**
 * StoreStaticSections.tsx
 *
 * Self-contained sections that need no props from the store orchestrator.
 * Each is exported as a named component and can be rendered independently.
 *
 * Includes:
 *   - StoreMetaQuotesSection   (MetaTraderQuotes card)
 *   - StoreFeaturesSection     (Features card)
 *   - StoreMetaMarketSection   (AI market-intelligence grid — static data)
 *   - StoreTestimonialsSection (TestimonialsCarousel card)
 *   - StoreFooterSection       (footer wrapper — requires ref)
 */

import React from 'react';
import {
  MetaTraderQuotes,
  Features,
  TestimonialsCarousel,
  FooterComponent,
} from '../_lazy/store-dynamics';
import { DeferredMount } from './DeferredMount';

/* ── MetaTraderQuotes card (mobile-only by convention in parent) ────────────── */
export function StoreMetaQuotesSection() {
  return (
    <section
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 800px',
      }}
    >
      <div
        className="mx-auto w-full max-w-[90rem] px-4 sm:px-8"
        style={{ paddingTop: 24, paddingBottom: 32 }}
      >
        <div className="w-full rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Market Quotes</h3>
            <span
              className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: 'rgba(0,0,0,0.5)' }}
            >
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[520px] lg:min-h-[calc(100vh-220px)] flex-1">
            <div
              className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
              style={{ filter: 'invert(1) hue-rotate(180deg)' }}
            >
              <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                <MetaTraderQuotes embedded />
              </DeferredMount>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features card (inverted colours for contrast) ──────────────────────────── */
export function StoreFeaturesSection() {
  return (
    <section
      data-apple-section
      className="lg:min-h-[calc(100vh-64px)]"
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 800px',
      }}
    >
      <div
        className="mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:min-h-[calc(100vh-128px)] lg:flex lg:flex-col"
        style={{ paddingTop: 16, paddingBottom: 32 }}
      >
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex lg:flex-col lg:flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Features</h3>
            <span
              className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: 'rgba(0,0,0,0.5)' }}
            >
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white lg:flex-1 lg:min-h-0">
            <div
              className="max-h-[560px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:h-full"
              style={{ filter: 'invert(1) hue-rotate(180deg)' }}
            >
              <Features />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Meta Market Intelligence (AI-powered grid — static illustrative data) ───  */
export function StoreMetaMarketSection() {
  return (
    <section
      data-apple-section
      className="lg:min-h-[calc(100vh-64px)]"
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 800px',
      }}
    >
      <div
        className="mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:min-h-[calc(100vh-128px)] lg:flex lg:flex-col"
        style={{ paddingTop: 16, paddingBottom: 32 }}
      >
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex lg:flex-col lg:flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Meta Market Intelligence</h3>
            <span className="rounded-full border border-green-500/20 bg-green-50 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-green-700">
              AI-Powered
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white lg:flex-1 lg:min-h-0">
            <div className="max-h-[560px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:h-full p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Market Sentiment */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-blue-900">Market Sentiment</h4>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Fear &amp; Greed Index</span>
                      <span className="text-xl font-bold text-green-600">73</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }} />
                    </div>
                    <p className="text-xs text-blue-600">
                      Market showing strong bullish sentiment with institutional inflows
                    </p>
                  </div>
                </div>

                {/* AI Predictions */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-purple-900">AI Predictions</h4>
                    <div className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">95% Accuracy</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">SPY Target</span>
                      <span className="font-semibold text-green-600">↑ $485</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">BTC Forecast</span>
                      <span className="font-semibold text-green-600">↑ $48K</span>
                    </div>
                    <p className="text-xs text-purple-600">
                      Next major support: $445 | Resistance: $495
                    </p>
                  </div>
                </div>

                {/* Options Flow */}
                <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-orange-900">Options Flow</h4>
                    <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Real-time</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Dark Pool Activity</span>
                      <span className="text-sm font-semibold text-red-600">Heavy Buying</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-orange-700">Call/Put Ratio</span>
                      <span className="text-sm font-semibold">1.8:1</span>
                    </div>
                    <p className="text-xs text-orange-600">
                      Unusual activity detected in SPY 480C expiring Friday
                    </p>
                  </div>
                </div>

                {/* Sector Rotation */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-900">Sector Rotation</h4>
                    <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Updated 1m ago</div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Technology', pct: '+2.1%', up: true },
                      { name: 'Financials', pct: '+1.8%', up: true },
                      { name: 'Energy', pct: '-0.8%', up: false },
                    ].map((row) => (
                      <div key={row.name} className="flex justify-between items-center">
                        <span className="text-sm text-green-700">{row.name}</span>
                        <span className={`font-semibold ${row.up ? 'text-green-600' : 'text-red-600'}`}>
                          {row.pct}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-green-600">Tech leading with semiconductor strength</p>
                  </div>
                </div>
              </div>

              {/* Bottom action bar */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Data updated every 30 seconds • Powered by Meta AI
                </p>
                <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  View Full Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials carousel card ─────────────────────────────────────────────── */
export function StoreTestimonialsSection() {
  return (
    <section
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 700px',
      }}
    >
      <div
        className="mx-auto w-full max-w-[90rem] px-4 sm:px-8"
        style={{ paddingTop: 16, paddingBottom: 32 }}
      >
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Testimonials</h3>
            <span
              className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: 'rgba(0,0,0,0.5)' }}
            >
              Live
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white">
            <div className="min-h-[560px] h-full overflow-hidden">
              <TestimonialsCarousel tone="light" className="mt-0 max-w-none px-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer wrapper ─────────────────────────────────────────────────────────── */
interface StoreFooterSectionProps {
  sectionRef?: React.RefObject<HTMLElement | null>;
}

export function StoreFooterSection({ sectionRef }: StoreFooterSectionProps) {
  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement> | undefined}
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 400px',
      }}
    >
      <div className="bg-white">
        <FooterComponent />
      </div>
    </section>
  );
}
