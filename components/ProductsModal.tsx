"use client";

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { 
  X, 
  Search, 
  ChevronDown,
  ArrowUpNarrowWide, 
  ArrowDownWideNarrow,
  ShoppingCart,
  Package
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop, Product, Category } from '@/components/ShopContext';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within ProductsModal');
  return context;
};

// Price formatting utility
const formatPriceDisplay = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return "0.00";
  const num = Number(price);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

// Sort Direction type
type SortDirection = 'asc' | 'desc';

// Filters type
type Filters = {
  search: string;
  category: string;
};

// Main Modal Component - Now uses centralized UIStateContext for mutual exclusion
export const ProductsModal = memo(() => {
  // Use centralized UI state for mutual exclusion with other modals
  const { isOpen, setIsOpen } = useProductsModalUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      <ProductsTrigger />
      {createPortal(
        <AnimatePresence>
          {isOpen && <ProductsContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
ProductsModal.displayName = 'ProductsModal';

// Trigger Button
const ProductsTrigger = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Open Products"
    />
  );
});
ProductsTrigger.displayName = 'ProductsTrigger';

// Product Card Component
const ProductCard = memo(({ 
  product, 
  onClick 
}: { 
  product: Product & { id: string }; 
  onClick: () => void;
}) => {
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = product.buyUrl?.trim();
    if (!url) {
      alert("This product does not have a Buy now link set yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.8))',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-indigo-950/70 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30 backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-slate-400 text-xs line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">
            ${formatPriceDisplay(product.price)}
          </span>
          
          <button
            onClick={handleBuyNow}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
          >
            Get Access
          </button>
        </div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = 'ProductCard';

// Main Content
const ProductsContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { state: { products, categories } } = useShop();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProduct, setExpandedProduct] = useState<(Product & { id: string }) | null>(null);

  const toggleSortDirection = () => {
    SoundEffects.click();
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    const filtered = products.filter((p) => {
      // Exclude specific categories
      if (['VIDEO', 'BLOGVIDEO', 'LIVESTREAMS', 'BLOGS'].includes(p.category)) return false;
      if (!p.visible) return false;

      const searchMatch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      const categoryMatch = filters.category === "all" || p.category === filters.category;
      
      return searchMatch && categoryMatch;
    });

    return filtered.sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
      return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [products, filters, sortDirection]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-5 sm:p-6 bg-black/95 ${
        shouldDisableBackdropBlur ? '' : 'backdrop-blur-md'
      }`}
      onClick={handleClose}
    >
      {/* Animated tap to close hints - skip on mobile */}
      {!shouldSkipHeavyEffects && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↑</span> Tap anywhere to close <span>↑</span>
        </motion.div>
      )}
      {!shouldSkipHeavyEffects && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium pointer-events-none flex items-center gap-1"
        >
          <span>↓</span> Tap anywhere to close <span>↓</span>
        </motion.div>
      )}
      {!shouldSkipHeavyEffects && (
        <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        ← Tap to close
      </motion.div>
      )}
      {!shouldSkipHeavyEffects && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 text-xs font-medium pointer-events-none writing-mode-vertical hidden sm:flex items-center gap-1"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        Tap to close →
      </motion.div>
      )}
      
      {/* Modal */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl"
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-2xl pointer-events-none z-0">
            <ShimmerBorder color="blue" intensity="low" />
          </div>
        )}
        
        {/* Inner Container */}
        <div className="relative z-10 bg-gradient-to-b from-neutral-900 to-black rounded-2xl border border-indigo-500/30 overflow-hidden max-h-[90vh] flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="blue" />}
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-indigo-500/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney VIP</h2>
                <p className="text-xs text-indigo-400/70">Premium trading products</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors group relative flex items-center justify-center"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ESC</span>
            </motion.button>
          </div>
          
          {/* Filters Bar */}
          <div className="p-3 border-b border-indigo-500/20 flex flex-col sm:flex-row gap-3 flex-shrink-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search products..."
                className="w-full bg-black/50 border border-indigo-500/30 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full sm:w-40">
              <select
                value={filters.category}
                onChange={(e) => { SoundEffects.click(); setFilters((f) => ({ ...f, category: e.target.value })); }}
                className="w-full appearance-none bg-black/50 border border-indigo-500/30 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
              >
                <option value="all">All Categories</option>
                {categories.map((c: Category) => (
                  <option key={c._id || c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={toggleSortDirection}
              className="px-3 py-2 rounded-lg bg-black/50 border border-indigo-500/30 hover:border-indigo-500 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {sortDirection === 'asc' ? <ArrowUpNarrowWide size={14} /> : <ArrowDownWideNarrow size={14} />}
              {sortDirection === 'asc' ? "Low → High" : "High → Low"}
            </button>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedProducts.map((p) => {
                  const pid = p._id || p.id!;
                  return (
                    <ProductCard
                      key={pid}
                      product={{ ...p, id: pid }}
                      onClick={() => setExpandedProduct({ ...p, id: pid })}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-500">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Expanded Product View */}
      <AnimatePresence>
        {expandedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={() => setExpandedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, #0a0015, #000)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 0 60px rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setExpandedProduct(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                {/* Image Side */}
                <div className="relative w-full md:w-1/2 h-56 md:h-auto shrink-0">
                  <img
                    src={expandedProduct.imageUrl}
                    alt={expandedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 md:hidden" />
                  <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent opacity-80 hidden md:block" />
                  
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-indigo-500/30 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    {expandedProduct.category}
                  </span>
                </div>

                {/* Content Side */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                    {expandedProduct.name}
                  </h2>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">
                      ${formatPriceDisplay(expandedProduct.price)}
                    </span>
                  </div>

                  <div className="text-slate-300 text-sm leading-relaxed mb-6 flex-grow">
                    <p className="whitespace-pre-line">{expandedProduct.description}</p>
                  </div>

                  {/* Action Footer */}
                  <div className="mt-auto pt-6 border-t border-indigo-900/30">
                    <button
                      onClick={() => {
                        const url = expandedProduct.buyUrl?.trim();
                        if (url) window.open(url, "_blank");
                        else alert("No buy link available");
                      }}
                      className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                    >
                      <ShoppingCart size={18} /> Buy Now
                    </button>
                    <p className="text-center text-slate-500 text-xs mt-3">
                      Instant digital delivery via email.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
ProductsContent.displayName = 'ProductsContent';
