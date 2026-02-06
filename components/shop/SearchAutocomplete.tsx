'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductWithDetails } from '@/types/store';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// SEARCH AUTOCOMPLETE - Dropdown suggestions with product previews
// ============================================================================

interface SearchAutocompleteProps {
  query?: string;
  searchQuery?: string;
  onSelect: (query: string) => void;
  onProductSelect?: (slug: string) => void;
  onClose?: () => void;
  isVisible?: boolean;
}

const TRENDING_SEARCHES = [
  'hoodie', 'cap', 'trading journal', 'bull shirt', 'mug', 'phone case',
];

export function SearchAutocomplete({ query, searchQuery, onSelect, onProductSelect, onClose, isVisible }: SearchAutocompleteProps) {
  const actualQuery = query ?? searchQuery ?? '';
  const actualIsVisible = isVisible ?? (actualQuery.length > 0);
  const [suggestions, setSuggestions] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bullmoney-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!actualQuery || actualQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/store/products?search=${encodeURIComponent(actualQuery)}&limit=5`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.data || []);
      } catch {
        // Aborted or error
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [actualQuery]);

  // Close on outside click
  useEffect(() => {
    if (!onClose) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleSelectSearch = (term: string) => {
    // Save to recent searches
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 8);
    setRecentSearches(updated);
    try { localStorage.setItem('bullmoney-recent-searches', JSON.stringify(updated)); } catch {}
    onSelect(term);
  };

  const handleProductClick = (product: ProductWithDetails) => {
    if (onProductSelect && product.slug) {
      onProductSelect(product.slug);
    }
  };

  if (!actualIsVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-xl
                   shadow-2xl overflow-hidden z-200"
      >
        {/* No Query State - Show trending & recent */}
        {!query && (
          <div className="p-4 space-y-4">
            {recentSearches.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSearch(term)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70
                               hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Trending
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectSearch(term)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70
                             hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Query Results */}
        {query && query.length >= 2 && (
          <div>
            {loading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">No products found for &ldquo;{query}&rdquo;</p>
                <p className="text-white/30 text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/store/product/${product.slug}`}
                    onClick={() => {
                      handleSelectSearch(actualQuery);
                      onClose?.();
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {product.primary_image ? (
                        <Image
                          src={product.primary_image}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">B</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{product.name}</p>
                      <p className="text-white/50 text-xs">{product.category?.name} • {useCurrencyLocaleStore.getState().formatPrice(product.base_price)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
                  </Link>
                ))}
                <button
                  onClick={() => handleSelectSearch(query)}
                  className="w-full p-3 text-center text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  View all results for &ldquo;{query}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
