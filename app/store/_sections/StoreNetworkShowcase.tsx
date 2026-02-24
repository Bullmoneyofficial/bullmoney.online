'use client';

/**
 * StoreNetworkShowcase.tsx
 *
 * Displays BullMoney social-media network posts fetched from /api/network.
 * Shows a tabbed interface (one tab per account) with an auto-cycling iframe
 * carousel, prev/next navigation, and social profile links.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Typewriter, FallingWords, SlideInLabel } from '@/components/shop/StoreTextEffects';

const PLATFORM_ICONS: Record<string, string> = {
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  tiktok:
    'M9 3v11.5a3.5 3.5 0 11-2.5-3.36V7.5c0-.69.56-1.25 1.25-1.25H9zm6.25 1.25c.82 1.36 2.25 2.22 3.75 2.5v2.44c-1.74-.2-3.34-.96-4.5-2.12v7.98a4.5 4.5 0 11-4.5-4.5c.35 0 .7.04 1.03.12V9.6c-.34-.05-.68-.08-1.03-.08a3 3 0 103 3v-9.3h1.25z',
  youtube:
    'M19.615 3.184c-3.604-.246-7.226-.246-10.83 0-3.898.266-4.356 2.62-4.356 8.816 0 6.196.458 8.55 4.356 8.816 3.604.246 7.226.246 10.83 0 3.898-.266 4.356-2.62 4.356-8.816 0-6.196-.458-8.55-4.356-8.816zM9.75 15.02V8.98l5.5 3.02-5.5 3.02z',
};

function platformLabel(platform?: string) {
  if (platform === 'instagram') return 'Instagram';
  if (platform === 'tiktok') return 'TikTok';
  if (platform === 'youtube') return 'YouTube';
  return 'Network';
}

function accountDisplay(account: any): string {
  const handle = account?.handle?.replace(/^@/, '');
  if (handle) return `@${handle}`;
  return account?.label || 'Network';
}

function resolveProfileUrl(account: any): string | null {
  if (account?.profileUrl) return account.profileUrl;
  const handle = account?.handle?.replace(/^@/, '');
  if (!handle) return null;
  if (account.platform === 'instagram') return `https://instagram.com/${handle}`;
  if (account.platform === 'tiktok') return `https://www.tiktok.com/@${handle}`;
  if (account.platform === 'youtube') return `https://www.youtube.com/@${handle}`;
  return null;
}

export function StoreNetworkShowcase() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [postIndex, setPostIndex] = useState(0);

  const fetchAccounts = useCallback(() => {
    fetch('/api/network')
      .then((r) => r.json())
      .then((json) => setAccounts(json.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 60_000);
    return () => clearInterval(interval);
  }, [fetchAccounts]);

  const activeAccount = accounts[activeTab];
  const activePosts = activeAccount?.posts || [];
  const hasRealPosts = activePosts.some((post: any) => !post.isExample);
  const placeholderPosts = useMemo<any[]>(
    () => Array.from({ length: 3 }).map((_, i) => ({ id: `placeholder-${i}`, isPlaceholder: true })),
    []
  );
  const visiblePosts = useMemo(() => {
    if (hasRealPosts) return activePosts.filter((p: any) => !p.isExample);
    return placeholderPosts;
  }, [activePosts, hasRealPosts, placeholderPosts]);

  const activeProfileUrl = resolveProfileUrl(activeAccount);
  const activeDisplay = accountDisplay(activeAccount);
  const activePlatform = platformLabel(activeAccount?.platform);

  // Reset post index when tab changes
  useEffect(() => { setPostIndex(0); }, [activeTab]);
  useEffect(() => {
    if (postIndex >= visiblePosts.length) setPostIndex(0);
  }, [postIndex, visiblePosts.length]);

  // Auto-cycle posts
  useEffect(() => {
    if (visiblePosts.length <= 1) return;
    const id = setInterval(() => {
      setPostIndex((prev) => (prev + 1) % visiblePosts.length);
    }, 5200);
    return () => clearInterval(id);
  }, [visiblePosts.length]);

  const handlePrev = useCallback(() => {
    if (visiblePosts.length <= 1) return;
    setPostIndex((prev) => (prev - 1 + visiblePosts.length) % visiblePosts.length);
  }, [visiblePosts.length]);

  const handleNext = useCallback(() => {
    if (visiblePosts.length <= 1) return;
    setPostIndex((prev) => (prev + 1) % visiblePosts.length);
  }, [visiblePosts.length]);

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
        style={{ paddingTop: 24, paddingBottom: 32 }}
      >
        <div className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SlideInLabel
                className="text-[11px] uppercase tracking-[0.28em]"
                style={{ color: 'rgba(0,0,0,0.45)' }}
              >
                Network drop
              </SlideInLabel>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                <Typewriter text="Network drops." />
              </h2>
              <p
                className="mt-2 max-w-2xl text-sm sm:text-base"
                style={{ color: 'rgba(0,0,0,0.6)' }}
              >
                <FallingWords text="Fresh visuals from the BullMoney network across Instagram, TikTok, and YouTube." />
              </p>
            </div>
            {activeProfileUrl && (
              <a
                href={activeProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open {activePlatform}
              </a>
            )}
          </div>

          {/* Account tabs */}
          <div className="mt-5 flex flex-wrap gap-2">
            {accounts.map((account: any, index: number) => {
              const isActive = index === activeTab;
              return (
                <button
                  key={account.id || `${account.platform}-${index}`}
                  onClick={() => setActiveTab(index)}
                  className="relative rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? '#111111' : '#ffffff',
                    border: `1px solid ${isActive ? '#111111' : 'rgba(0,0,0,0.12)'}`,
                    color: isActive ? '#ffffff' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  <span className="flex items-center gap-2">{accountDisplay(account)}</span>
                </button>
              );
            })}
          </div>

          {/* Post viewer */}
          <div className="mt-6">
            <div
              className="relative overflow-hidden rounded-2xl border border-black/10 bg-white"
              style={{ boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}
            >
              {visiblePosts[postIndex]?.isPlaceholder ? (
                activeProfileUrl ? (
                  <a
                    href={activeProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[420px] items-center justify-center"
                  >
                    <div className="text-center">
                      <p className="text-sm font-semibold text-black">{activeDisplay}</p>
                      <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        View on {activePlatform}
                      </p>
                    </div>
                  </a>
                ) : (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <div className="text-center">
                      <p className="mt-3 text-sm font-semibold text-black">No network posts yet</p>
                      <p className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        Add embeds in Admin Hub → Network
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <iframe
                  key={visiblePosts[postIndex]?.id}
                  src={visiblePosts[postIndex]?.embedUrl}
                  className="w-full border-0"
                  style={{ minHeight: '480px', background: '#ffffff' }}
                  loading="lazy"
                  scrolling="no"
                  title={`Network post from ${activeDisplay}`}
                />
              )}

              {/* Controls */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={visiblePosts.length <= 1}
                  className="rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Prev
                </button>
                <div
                  className="text-[11px] uppercase tracking-[0.28em]"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  {visiblePosts.length
                    ? `${postIndex + 1} / ${visiblePosts.length}`
                    : '0 / 0'}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={visiblePosts.length <= 1}
                  className="rounded-full bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Network links */}
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3">
            <span
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: 'rgba(0,0,0,0.45)' }}
            >
              Network links
            </span>
            {accounts.map((account: any) => {
              const link = resolveProfileUrl(account);
              if (!link) return null;
              return (
                <a
                  key={account.id || account.handle}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {accountDisplay(account)}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
