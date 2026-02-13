'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, X, ArrowRight, ShoppingBag, BookOpen, Users, Sparkles, GraduationCap, TrendingUp, Home, BarChart3 } from 'lucide-react';
import { useUIState } from '@/contexts/UIStateContext';

// ============================================================================
// SITE-WIDE SEARCH OVERLAY
// Command-palette style search that finds pages, products, blog posts, and more
// across the entire BullMoney website
// ============================================================================

// --- Search index: all navigable pages/sections on the site ---
interface SearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'page' | 'store' | 'blog' | 'trading' | 'community' | 'education';
  keywords: string[];
  icon: typeof Home;
}

const SITE_SEARCH_INDEX: SearchItem[] = [
  // Main pages
  { id: 'home', title: 'Home', description: 'BullMoney main page', href: '/', category: 'page', keywords: ['home', 'main', 'landing', 'bull money'], icon: Home },
  { id: 'about', title: 'About', description: 'Learn about BullMoney', href: '/about', category: 'page', keywords: ['about', 'who', 'team', 'story', 'mission'], icon: Home },
  { id: 'vip', title: 'VIP Membership', description: 'Exclusive VIP trading community', href: '/VIP', category: 'page', keywords: ['vip', 'premium', 'membership', 'exclusive', 'signals', 'subscribe'], icon: Sparkles },
  { id: 'recruit', title: 'Affiliates', description: 'Join the affiliate program', href: '/recruit', category: 'page', keywords: ['affiliate', 'recruit', 'referral', 'earn', 'commission', 'partner'], icon: Users },
  { id: 'socials', title: 'Social Media', description: 'Follow us on social platforms', href: '/socials', category: 'page', keywords: ['social', 'instagram', 'twitter', 'tiktok', 'youtube', 'discord', 'telegram'], icon: Users },

  // Store
  { id: 'store', title: 'Store - All Products', description: 'Browse the BullMoney store', href: '/store', category: 'store', keywords: ['store', 'shop', 'products', 'merch', 'buy', 'merchandise'], icon: ShoppingBag },
  { id: 'store-apparel', title: 'Apparel', description: 'T-shirts, hoodies, and clothing', href: '/store?category=apparel', category: 'store', keywords: ['apparel', 'clothing', 'shirt', 'hoodie', 'tshirt', 't-shirt', 'wear', 'jacket'], icon: ShoppingBag },
  { id: 'store-accessories', title: 'Accessories', description: 'Hats, bags, phone cases and more', href: '/store?category=accessories', category: 'store', keywords: ['accessories', 'hat', 'cap', 'bag', 'phone case', 'sticker', 'keychain'], icon: ShoppingBag },
  { id: 'store-tech', title: 'Tech & Gear', description: 'Tech gadgets and trading gear', href: '/store?category=tech-gear', category: 'store', keywords: ['tech', 'gear', 'gadget', 'mouse pad', 'setup', 'desk'], icon: ShoppingBag },
  { id: 'store-home', title: 'Home & Office', description: 'Home and office trading setup', href: '/store?category=home-office', category: 'store', keywords: ['home', 'office', 'desk', 'decoration', 'poster', 'wall art', 'candle'], icon: ShoppingBag },
  { id: 'store-drinkware', title: 'Drinkware', description: 'Mugs, bottles and drinkware', href: '/store?category=drinkware', category: 'store', keywords: ['drinkware', 'mug', 'bottle', 'cup', 'water bottle', 'coffee'], icon: ShoppingBag },
  { id: 'store-limited', title: 'Limited Edition', description: 'Exclusive limited edition drops', href: '/store?category=limited-edition', category: 'store', keywords: ['limited', 'edition', 'exclusive', 'rare', 'drop', 'special'], icon: ShoppingBag },
  { id: 'store-account', title: 'My Account', description: 'View orders and account settings', href: '/store/account', category: 'store', keywords: ['account', 'orders', 'profile', 'settings', 'my orders', 'login'], icon: ShoppingBag },

  // Blog / Content
  { id: 'blogs', title: 'Blog & News', description: 'Trading insights, analysis, and news', href: '/Blogs', category: 'blog', keywords: ['blog', 'news', 'article', 'post', 'analysis', 'insights', 'updates'], icon: BookOpen },

  // Trading
  { id: 'prop', title: 'Prop Trading', description: 'BullMoney prop firm challenge', href: '/Prop', category: 'trading', keywords: ['prop', 'trading', 'firm', 'challenge', 'funded', 'account', 'evaluation'], icon: TrendingUp },
  { id: 'journal', title: 'Trading Journal', description: 'Track and analyze your trades', href: '/journal', category: 'trading', keywords: ['journal', 'diary', 'trades', 'track', 'log', 'performance', 'pnl'], icon: BarChart3 },
  { id: 'quotes', title: 'Live Quotes', description: 'Real-time forex & crypto prices', href: '/quotes', category: 'trading', keywords: ['quotes', 'prices', 'live', 'forex', 'crypto', 'bitcoin', 'gold', 'market', 'ticker'], icon: TrendingUp },
  { id: 'crypto-guide', title: 'Crypto Guide', description: 'Learn about cryptocurrency', href: '/crypto-guide', category: 'trading', keywords: ['crypto', 'guide', 'bitcoin', 'ethereum', 'learn', 'blockchain', 'defi'], icon: TrendingUp },

  // Community
  { id: 'community', title: 'Community', description: 'Join the BullMoney community', href: '/community', category: 'community', keywords: ['community', 'chat', 'discuss', 'feed', 'members', 'post'], icon: Users },
  { id: 'course', title: 'Trading Course', description: 'Free trading education', href: '/course', category: 'education', keywords: ['course', 'learn', 'education', 'tutorial', 'lesson', 'beginner', 'forex', 'trading course'], icon: GraduationCap },
  { id: 'crypto-game', title: 'Crypto Game', description: 'Play the crypto trading game', href: '/crypto-game', category: 'education', keywords: ['game', 'play', 'crypto', 'simulation', 'practice', 'fun'], icon: Sparkles },
];

// Category colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  page: { label: 'Page', color: 'rgba(255,255,255,0.5)' },
  store: { label: 'Store', color: 'rgba(255,184,0,0.8)' },
  blog: { label: 'Blog', color: 'rgba(96,165,250,0.8)' },
  trading: { label: 'Trading', color: 'rgba(52,211,153,0.8)' },
  community: { label: 'Community', color: 'rgba(167,139,250,0.8)' },
  education: { label: 'Learn', color: 'rgba(251,146,60,0.8)' },
};

interface SiteSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SiteSearchOverlay({ isOpen, onClose }: SiteSearchOverlayProps) {
  const { shouldSkipHeavyEffects } = useUIState();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveProducts, setLiveProducts] = useState<Array<{ title: string; slug: string; image?: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const productFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setLiveProducts([]);
      // Small delay to ensure portal is mounted
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Filter static search index
  const filteredResults = useMemo(() => {
    if (!query.trim()) return SITE_SEARCH_INDEX.slice(0, 8); // Show top pages when empty
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/);

    return SITE_SEARCH_INDEX
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();

        // Exact title match = highest
        if (titleLower === q) score += 100;
        // Title starts with query
        else if (titleLower.startsWith(q)) score += 60;
        // Title contains query
        else if (titleLower.includes(q)) score += 40;

        // Keyword matches
        for (const kw of item.keywords) {
          if (kw === q) score += 50;
          else if (kw.startsWith(q)) score += 30;
          else if (kw.includes(q)) score += 15;
        }

        // Multi-word: every word must match somewhere
        if (words.length > 1) {
          const allMatch = words.every(w =>
            titleLower.includes(w) ||
            descLower.includes(w) ||
            item.keywords.some(kw => kw.includes(w))
          );
          if (allMatch) score += 25;
          else score = Math.floor(score * 0.3); // Heavily penalize partial multi-word
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query]);

  // Fetch live products when query changes (debounced)
  useEffect(() => {
    if (productFetchTimer.current) clearTimeout(productFetchTimer.current);
    if (!query.trim() || query.length < 2) {
      setLiveProducts([]);
      return;
    }

    productFetchTimer.current = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch('/api/store/products');
        if (res.ok) {
          const data = await res.json();
          const products = (data.products || data.data || data || [])
            .filter((p: any) => {
              if (!p || p.visible === false) return false;
              const q = query.toLowerCase();
              const name = (p.name || p.title || '').toLowerCase();
              const desc = (p.description || '').toLowerCase();
              const cat = (p.category || '').toLowerCase();
              return name.includes(q) || desc.includes(q) || cat.includes(q);
            })
            .slice(0, 4)
            .map((p: any) => ({
              title: p.name || p.title || 'Product',
              slug: p.slug || p.id,
              image: p.images?.[0] || p.image || undefined,
            }));
          setLiveProducts(products);
        }
      } catch {
        // Silently fail — static results still work
      } finally {
        setLoadingProducts(false);
      }
    }, 300);

    return () => {
      if (productFetchTimer.current) clearTimeout(productFetchTimer.current);
    };
  }, [query]);

  // Total results count for keyboard nav
  const totalResults = filteredResults.length + liveProducts.length;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredResults.length) {
        navigateTo(filteredResults[selectedIndex].href);
      } else {
        const productIdx = selectedIndex - filteredResults.length;
        if (liveProducts[productIdx]) {
          navigateTo(`/store/product/${liveProducts[productIdx].slug}`);
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [selectedIndex, filteredResults, liveProducts, totalResults, onClose]);

  const navigateTo = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        // Note: opening is handled by the parent via state
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render in portal for guaranteed z-index
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'min(20vh, 140px)',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.6)',
          backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(8px)',
          WebkitBackdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(8px)',
          animation: shouldSkipHeavyEffects ? 'none' : 'searchFadeIn 120ms ease-out',
        }}
      />

      {/* Search Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 580,
          margin: '0 16px',
          background: 'rgba(24,24,27,0.98)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: shouldSkipHeavyEffects ? 'none' : 'searchSlideIn 150ms ease-out',
        }}
      >
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Search size={20} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, products, features..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: 16,
              fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
            title="Close (Esc)"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: 'min(50vh, 400px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            padding: '8px',
          }}
        >
          {/* Static page results */}
          {filteredResults.length > 0 && (
            <div>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {query.trim() ? 'Results' : 'Quick Links'}
              </div>
              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-selected={isSelected}
                    onClick={() => navigateTo(item.href)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 60ms',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color: catConfig.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{item.title}</div>
                      <div style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: 12,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{item.description}</div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${catConfig.color}20`,
                      color: catConfig.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}>{catConfig.label}</span>
                    {isSelected && (
                      <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Live product results */}
          {liveProducts.length > 0 && (
            <div style={{ marginTop: filteredResults.length > 0 ? 4 : 0 }}>
              <div style={{
                padding: '6px 12px 4px',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Products
              </div>
              {liveProducts.map((product, idx) => {
                const globalIdx = filteredResults.length + idx;
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={`product-${product.slug}`}
                    data-selected={isSelected}
                    onClick={() => navigateTo(`/store/product/${product.slug}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 60ms',
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                  >
                    {product.image ? (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.06)',
                      }}>
                        <img
                          src={product.image}
                          alt=""
                          width={36}
                          height={36}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ShoppingBag size={18} style={{ color: 'rgba(255,184,0,0.8)' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>{product.title}</div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,184,0,0.12)',
                      color: 'rgba(255,184,0,0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}>Product</span>
                    {isSelected && (
                      <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {loadingProducts && query.length >= 2 && liveProducts.length === 0 && (
            <div style={{
              padding: '12px 16px',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 13,
              textAlign: 'center',
            }}>
              Searching products...
            </div>
          )}

          {/* No results */}
          {query.trim() && filteredResults.length === 0 && liveProducts.length === 0 && !loadingProducts && (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                No results for &ldquo;{query}&rdquo;
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>
                Try a different search term
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
          }}>
            <span style={{
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              fontSize: 10,
              fontWeight: 600,
            }}>↑↓</span>
            Navigate
            <span style={{
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.08)',
              fontSize: 10,
              fontWeight: 600,
            }}>↵</span>
            Open
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
          }}>
            BullMoney Search
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
