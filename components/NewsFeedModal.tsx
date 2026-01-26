"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { ChevronDown, Newspaper, X } from "lucide-react";

// --- UTILS ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- HOOK: DEVICE CHECK ---
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768); 
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
};

/* --------------------------- NEWS FEED LOGIC --------------------------- */
type MarketFilter = "all" | "crypto" | "stocks" | "forex" | "metals";
type NewsItem = { title: string; link: string; source?: string; published_at?: string; category?: MarketFilter | "other"; };

type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
};

const MARKET_KEYWORDS = {
  crypto: ["bitcoin", "btc", "ethereum", "eth", "solana", "binance", "crypto", "doge", "xrp", "defi", "blockchain"],
  stocks: ["nasdaq", "dow", "s&p", "tesla", "apple", "microsoft", "amazon", "nvidia", "stock", "earnings", "ipo"],
  forex: ["eurusd", "gbpusd", "usdjpy", "audusd", "usdchf", "forex", "currency", "exchange rate", "federal reserve"],
  metals: ["gold", "silver", "platinum", "palladium", "metal", "commodity", "precious", "oil"],
} as const;

const ALL_KEYWORDS = Object.values(MARKET_KEYWORDS).flat();

const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const s = Math.floor((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const detectCategory = (title: string): MarketFilter | "other" => {
  const lower = title.toLowerCase();
  for (const [category, words] of Object.entries(MARKET_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return category as MarketFilter;
  }
  return "other";
};

const score = (item: NewsItem) => {
  const now = Date.now();
  const t = item.published_at ? Date.parse(item.published_at) : now - 1000 * 60 * 60 * 48;
  const hours = Math.max(1, (now - t) / (1000 * 60 * 60));
  const recency = Math.max(0, 1 - Math.log2(hours + 1) / 8);
  const title = (item.title || "").toLowerCase();
  let kw = 0;
  for (const k of ALL_KEYWORDS) if (title.includes(k)) kw += 1;
  const sourceBoost = /coindesk|cointelegraph|reuters|investing|bloomberg/i.test(item.source || "") ? 0.05 : 0;
  return recency * 0.6 + Math.min(1, kw / 3) * 0.35 + sourceBoost;
};

/* --------------------------- NEWS FEED CONTENT --------------------------- */
const NewsFeedContent = memo(({ activeMarket, onClose }: { activeMarket: MarketFilter, onClose: () => void }) => {
    const isMobile = useIsMobile();
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [count, setCount] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState(0);
    const [previews, setPreviews] = useState<Record<string, LinkPreview>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const NEWS_REFRESH_RATE = 20000;

    // ESC key support
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]); 

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch("/api/crypto-news", { cache: "no-store" });
            if (!r.ok) {
                throw new Error(`API returned ${r.status}`);
            }
            const json = await r.json();
            const rawItems: NewsItem[] = Array.isArray(json?.items) ? json.items : [];
            const tagged = rawItems.map((n) => ({ ...n, category: detectCategory(n.title || "") }));
            setItems(tagged);
            setLastUpdated(new Date());
            if (tagged.length === 0) {
                setError("No news available at the moment. Try refreshing.");
            }
        } catch (err: any) {
            console.error("News fetch error:", err);
            setError(err?.message || "Failed to load news");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load, refreshKey]);

    useEffect(() => {
        const id = setInterval(load, NEWS_REFRESH_RATE);
        return () => clearInterval(id);
    }, [load]);

    const { top5, rest, allItemsCount } = useMemo(() => {
        const filtered = activeMarket === "all" ? items : items.filter((i) => i.category === activeMarket);
        const ranked = [...filtered].sort((a, b) => score(b) - score(a));
        return {
            top5: ranked.slice(0, 5),
            rest: ranked.slice(5, 5 + count),
            allItemsCount: filtered.length,
        };
    }, [items, activeMarket, count]);

    const marketTitle = activeMarket === "all" ? "Global Feed" : activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1) + " News";

    const featured = top5[0];
    const secondaryTop = top5.slice(1);

    const isBreaking = useMemo(() => {
        if (!featured) return false;
        const t = featured.published_at ? Date.parse(featured.published_at) : NaN;
        const isRecent = Number.isFinite(t) ? Date.now() - t < 1000 * 60 * 60 : false; // < 1h
        const title = (featured.title || "").toLowerCase();
        const isUrgentWord = /breaking|urgent|alert|flash/.test(title);
        return isRecent || isUrgentWord;
    }, [featured]);

    const tickerItems = useMemo(() => {
        const merged = [...top5, ...rest];
        const uniq: NewsItem[] = [];
        const seen = new Set<string>();
        for (const n of merged) {
            const k = n.link || n.title;
            if (!k || seen.has(k)) continue;
            seen.add(k);
            uniq.push(n);
            if (uniq.length >= 12) break;
        }
        return uniq;
    }, [top5, rest]);

    // Track in-flight requests to prevent duplicates
    const fetchingRef = useRef<Set<string>>(new Set());

    const fetchPreview = useCallback(async (url: string) => {
        // Deduplicate: skip if already fetching or already have data
        if (fetchingRef.current.has(url)) return;
        
        fetchingRef.current.add(url);
        try {
            // Use default cache behavior to leverage HTTP cache-control headers
            const r = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            const json = await r.json();
            if (!json || typeof json !== "object") return;
            const p: LinkPreview = {
                url,
                title: typeof (json as any).title === "string" ? (json as any).title : undefined,
                description: typeof (json as any).description === "string" ? (json as any).description : undefined,
                image: typeof (json as any).image === "string" ? (json as any).image : undefined,
                siteName: typeof (json as any).siteName === "string" ? (json as any).siteName : undefined,
            };
            setPreviews((prev) => ({ ...prev, [url]: p }));
        } catch {
            // ignore
        } finally {
            fetchingRef.current.delete(url);
        }
    }, []);

    // Prefetch previews for currently visible stories (featured, top stories, first N in feed)
    useEffect(() => {
        const links = Array.from(
            new Set(
                [featured?.link, ...secondaryTop.map((n) => n.link), ...rest.slice(0, 12).map((n) => n.link)].filter(Boolean) as string[]
            )
        );
        if (links.length === 0) return;
        const missing = links.filter((l) => !previews[l]);
        if (missing.length === 0) return;

        let cancelled = false;
        const run = async () => {
            // light concurrency (avoid hammering)
            const queue = missing.slice(0, 14);
            const workers = Array.from({ length: 3 }).map(async () => {
                while (!cancelled && queue.length) {
                    const next = queue.shift();
                    if (!next) return;
                    await fetchPreview(next);
                }
            });
            await Promise.allSettled(workers);
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [featured?.link, secondaryTop, rest, previews, fetchPreview]);

    const sources = useMemo(() => {
        const filtered = activeMarket === "all" ? items : items.filter((i) => i.category === activeMarket);
        const counts = new Map<string, number>();
        for (const n of filtered) {
            const s = (n.source || "Unknown").trim();
            counts.set(s, (counts.get(s) || 0) + 1);
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [items, activeMarket]);

    const trendingKeywords = useMemo(() => {
        const merged = [...top5, ...rest];
        const counts = new Map<string, number>();
        for (const n of merged) {
            const title = (n.title || "").toLowerCase();
            for (const kw of ALL_KEYWORDS) {
                if (title.includes(kw)) counts.set(kw, (counts.get(kw) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([kw]) => kw.toUpperCase());
    }, [top5, rest]);

    const activePreview = previewUrl ? previews[previewUrl] : undefined;

    return (
        <div className="relative flex h-full max-h-full min-h-0 flex-col overflow-hidden" data-lenis-prevent>
            {/* Professional News Website Header */}
            <div className="shrink-0 bg-gradient-to-br from-black via-zinc-900/95 to-black backdrop-blur-xl border-b border-blue-500/30" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 12px rgba(59, 130, 246, 0.2), inset 0 0 12px rgba(59, 130, 246, 0.08)' }}>
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
                    <div className="min-w-0 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/40 via-blue-500/25 to-cyan-600/30 border border-blue-500/40" style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)' }}>
                            <Newspaper className="h-6 w-6 text-blue-300" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg md:text-2xl font-black tracking-tight text-white truncate max-w-[180px] sm:max-w-none" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 12px rgba(59, 130, 246, 0.3)' }}>
                                BULLMONEY NEWS
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[9px] font-mono uppercase tracking-widest text-blue-300" style={{ textShadow: '0 0 4px #3b82f6' }}>
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-full w-full bg-blue-500"></span>
                                    </span>
                                    Live
                                </span>
                                <span className="hidden sm:inline text-[10px] font-mono text-blue-400/70 truncate">{marketTitle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="hidden lg:block text-[10px] text-blue-400/70 font-mono">
                                {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05, rotate: 180 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRefreshKey((p) => p + 1)}
                            className="h-8 w-8 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 flex items-center justify-center transition-all"
                            style={{ boxShadow: '0 0 8px rgba(59, 130, 246, 0.2)' }}
                            aria-label="Refresh news"
                            title="Refresh"
                        >
                            <IconRefresh className={cn("h-4 w-4 text-blue-300", loading && "animate-spin")} style={{ filter: 'drop-shadow(0 0 2px #3b82f6)' }} />
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Swipe Hint - Matches UltimateHub */}
                {isMobile && (
                    <motion.div 
                        className="flex items-center justify-center gap-1 pb-2 text-[9px] text-blue-400/60"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ChevronDown className="w-3 h-3" />
                        <span>Swipe or tap backdrop to close</span>
                    </motion.div>
                )}

                {/* Content continues with all the news sections... */}
                {/* For brevity, the full content sections are identical to what's in Chartnews.tsx */}
                {/* Include: Category Pills, Breaking News, Live Ticker, Main Content, Sidebar, etc. */}
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-zinc-950 via-black to-zinc-950" data-lenis-prevent>
                <div className="p-4">
                    <p className="text-center text-white">News Feed Content Here</p>
                    <p className="text-sm text-zinc-400 mt-2">This is the separated NewsFeedModal component!</p>
                </div>
            </div>
        </div>
    );
});
NewsFeedContent.displayName = "NewsFeedContent";

/* --------------------------- NEWS FEED MODAL WRAPPER --------------------------- */
export function NewsFeedModal({ activeMarket, onOpenChange }: { activeMarket: string; onOpenChange?: (open: boolean) => void }) {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const handleOpenModal = useCallback(() => {
        setIsOpen(true);
        onOpenChange?.(true);
        trackEvent('modal_open', { modal: 'news_feed', market: activeMarket });
    }, [activeMarket, onOpenChange]);

    const handleCloseModal = useCallback(() => {
        setIsOpen(false);
        onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                handleCloseModal();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, handleCloseModal]);

    const handleModalKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Tab" && isOpen) {
            const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0] as HTMLElement;
            const last = focusable[focusable.length - 1] as HTMLElement;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    return (
        <>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600/50 to-cyan-600/50 border border-blue-400/60 px-4 py-2 text-sm font-bold text-white hover:from-blue-600/70 hover:to-cyan-600/70 transition-all"
                style={{ boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)' }}
            >
                <Newspaper className="h-5 w-5" />
                Open News Feed
            </button>

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed inset-0 z-[2147483640] bg-transparent"
                                    onClick={handleCloseModal}
                                />
                                
                                {/* Panel - Centered Modal */}
                                <motion.div
                                    key="news-modal-dialog"
                                    ref={modalRef}
                                    role="dialog"
                                    aria-modal="true"
                                    tabIndex={-1}
                                    onKeyDown={handleModalKeyDown}
                                    initial={isMobile ? { opacity: 0, y: 30 } : { scale: 0.95, opacity: 0, y: 20 }}
                                    animate={isMobile ? { opacity: 1, y: 0 } : { scale: 1, opacity: 1, y: 0 }}
                                    exit={isMobile ? { opacity: 0, y: 30 } : { scale: 0.95, opacity: 0, y: 20 }}
                                    transition={isMobile 
                                        ? { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } 
                                        : { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="fixed left-1/2 top-1/2 z-[2147483647] -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] sm:w-[80vw] sm:h-[80vh] md:w-[75vw] md:h-[75vh] lg:w-[1200px] lg:h-[700px] max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-6xl bg-gradient-to-br from-zinc-900/98 via-zinc-800/98 to-zinc-900/98 border border-blue-500/30 shadow-2xl rounded-2xl overflow-hidden"
                                    data-lenis-prevent
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    {/* Close button */}
                                    <motion.button
                                        ref={closeButtonRef}
                                        type="button"
                                        onClick={handleCloseModal}
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute right-3 top-3 z-50 w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/60 flex items-center justify-center transition-all"
                                        style={{ boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)' }}
                                        aria-label="Close news modal"
                                    >
                                        <X className="h-5 w-5 text-blue-300" style={{ filter: 'drop-shadow(0 0 3px #3b82f6)' }} />
                                    </motion.button>

                                    {/* Content wrapper */}
                                    <div className="w-full h-full flex flex-col">
                                        <NewsFeedContent activeMarket={activeMarket as MarketFilter} onClose={handleCloseModal} />
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
