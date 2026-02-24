'use client';

/**
 * StoreDashboardsSection.tsx
 *
 * "Live dashboards" section with collapsible panels for Community, Market Quotes,
 * and Breaking News. On mobile the panels render inline; on desktop they collapse/expand.
 */

import { ChevronDown } from 'lucide-react';
import { Typewriter, FallingWords, SlideInLabel } from '@/components/shop/StoreTextEffects';
import {
  ToastProvider,
  TelegramSection,
  QuotesSection,
  BreakingNewsSection,
  MetaTraderQuotes,
  BreakingNewsTicker,
  BullMoneyCommunity,
} from '../_lazy/store-dynamics';
import { DeferredMount } from './DeferredMount';

interface DesktopMarketIntelState {
  community: boolean;
  quotes: boolean;
  news: boolean;
}

interface StoreDashboardsSectionProps {
  desktopMarketIntelCollapsed: DesktopMarketIntelState;
  onToggle: (key: keyof DesktopMarketIntelState) => void;
}

export function StoreDashboardsSection({
  desktopMarketIntelCollapsed,
  onToggle,
}: StoreDashboardsSectionProps) {
  return (
    <section
      data-apple-section
      style={{
        backgroundColor: 'rgb(255,255,255)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 1200px',
      }}
    >
      <div
        className="mx-auto w-full max-w-[26rem] sm:max-w-3xl lg:max-w-[90rem] px-4 sm:px-8"
        style={{ paddingTop: 24, paddingBottom: 32 }}
      >
        <div className="flex flex-col gap-3">
          <SlideInLabel className="text-[11px] uppercase tracking-[0.28em]" style={{ color: 'rgba(0,0,0,0.45)' }}>
            Live dashboards
          </SlideInLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            <Typewriter text="Market intelligence." />
          </h2>
          <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(0,0,0,0.6)' }}>
            <FallingWords text="A streamlined look at quotes, headlines, and community trades tailored for the store." />
          </p>
        </div>

        {/* Mobile: inline stack */}
        <div className="mt-6 lg:hidden">
          <ToastProvider>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse" />}>
              <TelegramSection />
            </DeferredMount>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse mt-4" />}>
              <QuotesSection />
            </DeferredMount>
            <DeferredMount fallback={<div className="h-64 w-full rounded-2xl bg-black/5 animate-pulse mt-4" />}>
              <BreakingNewsSection />
            </DeferredMount>
          </ToastProvider>
        </div>

        {/* Desktop: collapsible panels */}
        <div className="mt-6 hidden lg:block">
          <div className="space-y-6">
            {/* Community panel */}
            <CollapsiblePanel
              title="Community"
              isCollapsed={desktopMarketIntelCollapsed.community}
              onToggle={() => onToggle('community')}
              id="desktop-market-intel-community"
            >
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <BullMoneyCommunity />
                </DeferredMount>
              </div>
            </CollapsiblePanel>

            {/* Market Quotes panel */}
            <CollapsiblePanel
              title="Market Quotes"
              isCollapsed={desktopMarketIntelCollapsed.quotes}
              onToggle={() => onToggle('quotes')}
              id="desktop-market-intel-quotes"
            >
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <MetaTraderQuotes embedded />
                </DeferredMount>
              </div>
            </CollapsiblePanel>

            {/* Breaking News panel */}
            <CollapsiblePanel
              title="Breaking News"
              isCollapsed={desktopMarketIntelCollapsed.news}
              onToggle={() => onToggle('news')}
              id="desktop-market-intel-news"
            >
              <div
                className="h-full overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain"
                style={{ filter: 'invert(1) hue-rotate(180deg)' }}
              >
                <DeferredMount fallback={<div className="h-full w-full bg-black/5 animate-pulse" />}>
                  <BreakingNewsTicker />
                </DeferredMount>
              </div>
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Internal helper ────────────────────────────────────────────────────────────

interface CollapsiblePanelProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  id: string;
  children: React.ReactNode;
}

function CollapsiblePanel({ title, isCollapsed, onToggle, id, children }: CollapsiblePanelProps) {
  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl border p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-left flex flex-col transition-colors ${
        isCollapsed ? 'bg-black text-white border-white/10' : 'bg-white border-black/10'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-controls={id}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span
            className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${
              isCollapsed ? 'border-white/15 text-white/70' : 'border-black/10'
            }`}
            style={isCollapsed ? undefined : { color: 'rgba(0,0,0,0.5)' }}
          >
            Live
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
          style={isCollapsed ? undefined : { color: 'rgba(0,0,0,0.55)' }}
        />
      </button>
      {!isCollapsed && (
        <div
          id={id}
          className="mt-4 overflow-hidden rounded-2xl border border-black/5 bg-white min-h-[420px] lg:min-h-[calc(100vh-220px)] flex-1"
        >
          {children}
        </div>
      )}
    </div>
  );
}
