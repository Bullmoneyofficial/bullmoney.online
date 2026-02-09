'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import type { ProductFilters } from '@/types/store';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// FILTER SHEET - MOBILE-FRIENDLY FILTER PANEL WITH PORTAL
// Uses React Portal to escape stacking context
// ============================================================================

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onFilterChange: (filters: Partial<ProductFilters>) => void;
  onClear: () => void;
}

function getPriceRanges() {
  const fp = useCurrencyLocaleStore.getState().formatPrice;
  return [
    { min: 0, max: 50, label: `Under ${fp(50)}` },
    { min: 50, max: 100, label: `${fp(50)} - ${fp(100)}` },
    { min: 100, max: 200, label: `${fp(100)} - ${fp(200)}` },
    { min: 200, max: 500, label: `${fp(200)} - ${fp(500)}` },
    { min: 500, max: undefined, label: `${fp(500)}+` },
  ];
}

const CATEGORIES = [
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'tech', label: 'Tech' },
  { value: 'education', label: 'Education' },
];

export function FilterSheet({ isOpen, onClose, filters, onFilterChange, onClear }: FilterSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'price'])
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handlePriceSelect = (min: number, max: number | undefined) => {
    const isSelected = filters.min_price === min && filters.max_price === max;
    onFilterChange({
      min_price: isSelected ? undefined : min,
      max_price: isSelected ? undefined : max,
    });
  };

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Semi-transparent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20"
            style={{ zIndex: 2147483648 }}
          />

          {/* Sheet - Opens from right like StoreHeader mobile menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white border-l border-black/10 flex flex-col"
            style={{ zIndex: 2147483649 }}
            data-apple-section
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/10">
              <h2 className="text-xl font-light" style={{ color: '#111111' }}>Filters</h2>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                style={{ color: '#111111' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Category Filter */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('category')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium">Category</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.has('category') ? 'rotate-180' : ''}`} 
                    style={{ color: 'rgba(0,0,0,0.5)' }}
                  />
                </button>
                
                <AnimatePresence>
                  {expandedSections.has('category') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {CATEGORIES.map((category) => (
                        <label
                          key={category.value}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div
                            className={`w-5 h-5 rounded-md border transition-colors flex items-center justify-center
                              ${filters.category === category.value 
                                ? 'bg-black border-black' 
                                : 'border-black/20 group-hover:border-black/40'
                              }`}
                          >
                            {filters.category === category.value && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span 
                            className={`transition-colors ${filters.category === category.value ? 'text-black' : 'text-black/60'}`}
                            onClick={() => onFilterChange({ 
                              category: filters.category === category.value ? '' : category.value 
                            })}
                          >
                            {category.label}
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Filter */}
              <div className="space-y-3">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-medium">Price Range</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${expandedSections.has('price') ? 'rotate-180' : ''}`} 
                    style={{ color: 'rgba(0,0,0,0.5)' }}
                  />
                </button>
                
                <AnimatePresence>
                  {expandedSections.has('price') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {getPriceRanges().map((range) => {
                        const isSelected = filters.min_price === range.min && filters.max_price === range.max;
                        return (
                          <button
                            key={range.label}
                            onClick={() => handlePriceSelect(range.min, range.max)}
                            className={`w-full py-3 px-4 rounded-xl border text-left text-sm transition-colors
                              ${isSelected 
                                ? 'bg-black text-white border-black' 
                                : 'border-black/10 text-black/60 hover:border-black/20 hover:text-black'
                              }`}
                          >
                            {range.label}
                          </button>
                        );
                      })}

                      {/* Custom Range */}
                      <div className="pt-2 space-y-2">
                        <p className="text-sm text-black/50">Custom range</p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.min_price || ''}
                            onChange={(e) => onFilterChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 h-10 px-3 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-black/20"
                          />
                          <span className="flex items-center text-black/40">-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.max_price || ''}
                            onChange={(e) => onFilterChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 h-10 px-3 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-black/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/10 space-y-3">
              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl font-medium transition-colors"
                style={{ background: '#111111', color: '#ffffff' }}
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  onClear();
                  onClose();
                }}
                className="w-full h-12 text-sm transition-colors"
                style={{ color: 'rgba(0,0,0,0.6)' }}
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document.body level
  if (!mounted) return null;
  
  return createPortal(sheetContent, document.body);
}
