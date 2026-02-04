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
  Package,
  ExternalLink
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

// Product Card Component - First tap opens whop link directly
const ProductCard = memo(({ 
  product, 
  onClick,
  isMobile
}: { 
  product: Product & { id: string }; 
  onClick: () => void;
  isMobile: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Direct link open on first tap (mobile) or click
  const handleOpenLink = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    SoundEffects.click();
    const url = product.buyUrl?.trim();
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // If no buy URL, show expanded view
      onClick();
    }
  }, [product.buyUrl, onClick]);

  // For mobile: single tap opens link
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenLink(e);
  }, [handleOpenLink]);

  return (
    <motion.div
      ref={cardRef}
      whileHover={isMobile ? {} : { scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleOpenLink}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-2xl overflow-hidden cursor-pointer group select-none"
      style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Tap indicator for mobile */}
      {isMobile && (
        <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
          <ExternalLink className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-md">
          {product.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-white/60 text-xs line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">
            ${formatPriceDisplay(product.price)}
          </span>
          
          <div 
            className="px-4 py-2 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/90 active:scale-95 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            Get Access
          </div>
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)'
        }}
      />
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

  // Handle backdrop touch for mobile
  const handleBackdropTouch = useCallback((e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      handleClose();
    }
  }, [handleClose]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: shouldDisableBackdropBlur ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: shouldDisableBackdropBlur ? 'none' : 'blur(20px)'
      }}
      onClick={handleClose}
      onTouchEnd={handleBackdropTouch}
    >
      {/* Tap to close hint - simplified for mobile */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-xs font-medium pointer-events-none border border-white/10"
      >
        Tap outside to close
      </motion.div>
      
      {/* Modal - Apple Glass Style */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-3xl pointer-events-none z-0">
            <ShimmerBorder color="white" intensity="low" />
          </div>
        )}
        
        {/* Inner Container */}
        <div className="relative z-10 rounded-3xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="white" />}
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney VIP</h2>
                <p className="text-xs text-white/50">Premium trading products</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              onTouchEnd={(e) => { e.stopPropagation(); handleClose(); }}
              className="p-3 min-w-[48px] min-h-[48px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Filters Bar */}
          <div className="p-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 flex-shrink-0 bg-black/10">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={filters.category}
                onChange={(e) => { SoundEffects.click(); setFilters((f) => ({ ...f, category: e.target.value })); }}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <option value="all" className="bg-black text-white">All Categories</option>
                {categories.map((c: Category) => (
                  <option key={c._id || c.id} value={c.name} className="bg-black text-white">{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={toggleSortDirection}
              onTouchEnd={(e) => { e.stopPropagation(); toggleSortDirection(); }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-95"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {sortDirection === 'asc' ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
              {sortDirection === 'asc' ? "Low → High" : "High → Low"}
            </button>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedProducts.map((p) => {
                  const pid = p._id || p.id!;
                  return (
                    <ProductCard
                      key={pid}
                      product={{ ...p, id: pid }}
                      onClick={() => setExpandedProduct({ ...p, id: pid })}
                      isMobile={isMobile}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                  <Package className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/50">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Expanded Product View - Apple Glass Style */}
      <AnimatePresence>
        {expandedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
            onClick={() => setExpandedProduct(null)}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) setExpandedProduct(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl"
              style={{
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.8))',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setExpandedProduct(null)}
                onTouchEnd={(e) => { e.stopPropagation(); setExpandedProduct(null); }}
                className="absolute top-4 right-4 z-50 p-3 min-w-[48px] min-h-[48px] bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all border border-white/10 flex items-center justify-center active:scale-95"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                {/* Image Side */}
                <div className="relative w-full md:w-1/2 h-48 sm:h-56 md:h-auto shrink-0">
                  <img
                    src={expandedProduct.imageUrl}
                    alt={expandedProduct.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent md:hidden" />
                  <div className="absolute inset-0 bg-gradient-to-l from-black via-black/30 to-transparent hidden md:block" />
                  
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-white">
                    {expandedProduct.category}
                  </span>
                </div>

                {/* Content Side */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 flex flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">
                    {expandedProduct.name}
                  </h2>
                  
                  <div className="flex items-center gap-4 mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      ${formatPriceDisplay(expandedProduct.price)}
                    </span>
                  </div>

                  <div className="text-white/70 text-sm leading-relaxed mb-4 sm:mb-6 flex-grow">
                    <p className="whitespace-pre-line">{expandedProduct.description}</p>
                  </div>

                  {/* Action Footer */}
                  <div className="mt-auto pt-4 sm:pt-6 border-t border-white/10">
                    <button
                      onClick={() => {
                        const url = expandedProduct.buyUrl?.trim();
                        if (url) window.open(url, "_blank", "noopener,noreferrer");
                        else alert("No buy link available");
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        const url = expandedProduct.buyUrl?.trim();
                        if (url) window.open(url, "_blank", "noopener,noreferrer");
                        else alert("No buy link available");
                      }}
                      className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-white/90 active:scale-[0.98]"
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <ShoppingCart size={18} /> Buy Now
                    </button>
                    <p className="text-center text-white/40 text-xs mt-3">
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
