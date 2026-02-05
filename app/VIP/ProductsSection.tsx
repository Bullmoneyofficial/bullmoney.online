"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop, Product } from "../VIP/ShopContext";
import AdminLoginModal from "./AdminLoginModal";
import AdminPanel from "./AdminPanel";
import { gsap } from "gsap";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  ChevronDown, 
  Search, 
  ArrowUpNarrowWide, 
  ArrowDownWideNarrow, 
  Lock, 
  User, 
  X, 
  ShoppingCart,
  Edit,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";

// Define the Sort Direction type for clarity
type SortDirection = 'asc' | 'desc';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =========================================
// 0. PRICE FORMATTING UTILITY
// =========================================
const formatPriceDisplay = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return "0.00";
  const num = Number(price);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

// =========================================
// 1. UI COMPONENTS (SHIMMER & SPARKLES)
// =========================================

// --- SHIMMER BORDER COMPONENT ---
const ShimmerBorder = ({ 
  children, 
  className, 
  rounded = "rounded-xl",
  background = "bg-[#060010]",
  onClick
}: { 
  children: React.ReactNode, 
  className?: string,
  rounded?: string,
  background?: string,
  onClick?: () => void
}) => {
  return (
    <div onClick={onClick} className={cn("relative p-[1px] overflow-hidden group/shimmer cursor-pointer", rounded, className)}>
      {/* The Moving Gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,45%,#ffffff,55%,transparent)] bg-[length:250%_100%] animate-shimmer opacity-100" />
      {/* The Content Container */}
      <div className={cn("relative h-full w-full overflow-hidden", background, rounded)}>
        {children}
      </div>
    </div>
  );
};

// --- SPARKLES CORE ---
/* interface SparklesCoreProps {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
  children?: React.ReactNode;
}

const SparklesCore = ({
  id,
  className = "",
  background,
  children,
}: SparklesCoreProps) => {
  return (
    <div
      id={id}
      className={className}
      style={{ background: background || "transparent" }}
    >
      {/* Simplified for this implementation to avoid heavy external deps if not needed,
          but retaining structure for visual compatibility * /}
      {children}
      <div className="absolute inset-0 pointer-events-none">
          {/* Static fallbacks or actual tsparticles integration here * /}
      </div>
    </div>
  );
}; */

// =========================================
// 2. INTERACTIVE CARD WRAPPER
// =========================================

type InteractiveCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enableTilt?: boolean;
  layoutId?: string;
  onClick?: () => void;
  disableAnimations?: boolean;
};

const InteractiveCardWrapper: React.FC<InteractiveCardProps> = ({
  children,
  className = "",
  style,
  enableTilt = true,
  layoutId,
  onClick,
  disableAnimations
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disableAnimations || !enableTilt || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5; // Subtle tilt
      const rotateY = ((x - centerX) / centerX) * 5;

      gsap.to(element, {
        rotateX,
        rotateY,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 1000,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.4, ease: "power2.out" });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [disableAnimations, enableTilt]);

  return (
    <motion.div 
      layoutId={layoutId} 
      className={className}
      style={{ position: "relative", zIndex: 1, ...style }}
      onClick={onClick}
    >
      <div ref={cardRef} style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
        {children}
      </div>
    </motion.div>
  );
};

// =========================================
// 3. PRODUCT BENTO CARD
// =========================================
type ProductBentoCardProps = {
  product: Product & { id: string };
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  disableAnimations: boolean;
  onClick: () => void;
};

function ProductBentoCard({
  product,
  isAdmin,
  onEdit,
  onDelete,
  onToggleVisibility,
  disableAnimations,
  onClick,
}: ProductBentoCardProps) {
  
  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Coming soon - checkout disabled temporarily
    alert("Coming Soon!");
    return;
  };

  return (
    <InteractiveCardWrapper
      layoutId={`card-container-${product.id}`}
      className="relative h-full"
      disableAnimations={disableAnimations}
      onClick={onClick}
    >
      <ShimmerBorder rounded="rounded-2xl" className="h-full hover:shadow-[0_0_20px_rgba(255, 255, 255,0.3)] transition-shadow duration-500">
        <div className="p-4 md:p-5 w-full h-full relative flex flex-col justify-between bg-[#060010]"> 
          
          {/* HEADER */}
          <div className="relative z-10 flex justify-between items-start mb-3">
            <motion.div 
              layoutId={`card-category-${product.id}`}
              className="px-2.5 py-1 rounded-full bg-indigo-950/50 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20"
            >
              {product.category}
            </motion.div>
            {isAdmin && !product.visible && (
              <span className="text-[9px] px-2 py-0.5 rounded-md border border-yellow-500/30 text-yellow-500 bg-yellow-500/10 font-bold uppercase tracking-wider">
                HIDDEN
              </span>
            )}
          </div>

          {/* IMAGE */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-4 z-10 group">
            <motion.img
              layoutId={`card-image-${product.id}`}
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060010] via-transparent to-transparent opacity-60" />
          </div>

          {/* CONTENT */}
          <div className="relative z-10 flex flex-col flex-grow">
            <motion.h2 
              layoutId={`card-title-${product.id}`}
              className="text-lg font-bold text-white mb-2 leading-tight line-clamp-1"
            >
              {product.name}
            </motion.h2>
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4 flex-grow">
              {product.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-indigo-900/20 mt-auto">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">
                ${formatPriceDisplay(product.price)} 
              </span>
              
              {/* COMING_SOON_BUTTON: To re-enable, add onClick={handleBuyNow}, change bg to bg-indigo-600 hover:bg-indigo-500, remove disabled, and text to "Get Access" */}
              <button
                // onClick={handleBuyNow} // COMING_SOON: Uncomment to re-enable
                disabled={true}
                className="px-4 py-1.5 rounded-lg bg-gray-600 text-white/60 text-xs font-bold uppercase tracking-wider shadow-lg shadow-gray-900/20 cursor-not-allowed opacity-60"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* ADMIN CONTROLS */}
          {isAdmin && (
            <div 
              className="mt-3 pt-2 border-t border-dashed border-indigo-900/30 flex justify-end gap-2 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-indigo-900/30 text-indigo-400 hover:text-white transition-colors">
                <Edit size={14} />
              </button>
              <button onClick={onToggleVisibility} className="p-1.5 rounded-md hover:bg-indigo-900/30 text-indigo-400 hover:text-white transition-colors">
                {product.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-red-900/30 text-red-400 hover:text-white transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </ShimmerBorder>
    </InteractiveCardWrapper>
  );
}

// =========================================
// 4. MAIN PRODUCT SECTION
// =========================================

type Filters = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
};

export default function ProductsSection() {
  const {
    state: { products, isAdmin, categories },
    toggleVisibility,
    deleteProduct,
  } = useShop();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Use a simple ref for spotlight effect instead of complex external component for cleaner code here
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [expandedId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
        if(containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            });
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    const filtered = products.filter((p) => {
      // Exclude specific categories if needed based on original code logic
      if (['VIDEO', 'BLOGVIDEO', 'LIVESTREAMS', 'BLOGS'].includes(p.category)) return false;
      if (!p.visible && !isAdmin) return false;

      const searchMatch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      const categoryMatch = filters.category === "all" || p.category === filters.category;
      
      const min = filters.minPrice ? Number(filters.minPrice) : 0;
      const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      const priceStr = String(p.price).replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr) || 0;
      
      return searchMatch && categoryMatch && price >= min && price <= max;
    });

    return filtered.sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
      return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [products, filters, isAdmin, sortDirection]);

  return (
    <section ref={containerRef} className="relative w-full min-h-screen bg-black overflow-hidden py-20">
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: -250% 0%; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Background Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.15), transparent 40%)`
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
            <div className="relative mb-6">
                <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tighter">
                   BULLMONEY <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">VIP</span>
                </h1>
                {/* Decorative Line */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-[1px]" />
            </div>
            
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
                Filter by category, price or name. Admins can edit everything in real time.
            </p>
        </div>

        {/* CONTROLS BAR */}
        <div className="sticky top-4 z-40 mb-10">
            <ShimmerBorder rounded="rounded-2xl">
                <div className="bg-neutral-900/80 backdrop-blur-xl p-3 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    
                    {/* LEFT: Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                         {/* Search */}
                        <div className="relative group w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 w-4 h-4 transition-colors" />
                            <input
                                value={filters.search}
                                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                                placeholder="Search products..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="relative w-full sm:w-48">
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                                className="w-full appearance-none bg-black/50 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-colors"
                            >
                                <option value="all">All Categories</option>
                                {categories?.map((c: { _id?: string; id?: string; name: string }) => (
                                    <option key={c._id || c.id} value={c.name}>{c.name}</option>
                                )) || []}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                        
                        {/* Sort Toggle */}
                        <button
                            onClick={toggleSortDirection}
                            className="px-3 py-2 rounded-lg bg-black/50 border border-white/10 hover:border-indigo-500/30 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors"
                        >
                            {sortDirection === 'asc' ? <ArrowUpNarrowWide size={14} /> : <ArrowDownWideNarrow size={14} />}
                            {sortDirection === 'asc' ? "Price: Low to High" : "Price: High to Low"}
                        </button>

                        {/* Admin Toggle */}
                        <button
                            onClick={() => setLoginOpen(true)}
                            className={cn(
                                "px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all",
                                isAdmin 
                                    ? "bg-indigo-900/20 border-indigo-500/50 text-indigo-300" 
                                    : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                            )}
                        >
                            {isAdmin ? <Lock size={14} /> : <User size={14} />}
                            {isAdmin ? "Admin Mode" : "Login"}
                        </button>
                    </div>
                </div>
            </ShimmerBorder>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
            {filteredAndSortedProducts.map((p) => { 
                const pid = p._id || p.id!;
                return (
                    <ProductBentoCard
                        key={pid}
                        product={{ ...p, id: pid }}
                        isAdmin={isAdmin || false}
                        onEdit={() => setEditing({ ...p, id: pid })}
                        onDelete={() => deleteProduct(pid)}
                        onToggleVisibility={() => toggleVisibility(pid)}
                        disableAnimations={false}
                        onClick={() => setExpandedId(pid)}
                    />
                );
            })}

            {filteredAndSortedProducts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500">No products found matching your filters.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- EXPANDED OVERLAY --- */}
      <AnimatePresence>
        {expandedId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedId(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* The Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] z-10 pointer-events-none">
                 {products.filter((p: Product) => (p._id || p.id!) === expandedId).map((p: Product) => {
                    const pid = p._id || p.id!;
                    return (
                        <div key={pid} className="pointer-events-auto h-full">
                        <ShimmerBorder rounded="rounded-3xl" className="h-full shadow-2xl shadow-indigo-900/40">
                            <motion.div
                                layoutId={`card-container-${pid}`}
                                className="w-full h-full flex flex-col md:flex-row bg-[#060010] overflow-hidden"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10 group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>

                                {/* Image Side */}
                                <div className="relative w-full md:w-1/2 h-64 md:h-auto shrink-0">
                                    <motion.img
                                        layoutId={`card-image-${pid}`}
                                        src={p.imageUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#060010] via-transparent to-transparent opacity-80 md:hidden" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#060010] via-transparent to-transparent opacity-80 hidden md:block" style={{ transform: 'rotate(180deg)' }} />
                                    
                                    <motion.div 
                                        layoutId={`card-category-${pid}`}
                                        className="absolute top-6 left-6 z-20"
                                    >
                                        <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-indigo-500/30 text-xs font-bold uppercase tracking-wider text-indigo-300 shadow-xl">
                                            {p.category}
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Content Side */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex flex-col">
                                    <motion.h2 
                                        layoutId={`card-title-${pid}`}
                                        className="text-3xl md:text-4xl font-black text-white mb-2"
                                    >
                                        {p.name}
                                    </motion.h2>
                                    
                                    <div className="flex items-center gap-4 mb-8">
                                        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">
                                            ${formatPriceDisplay(p.price)}
                                        </span>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="prose prose-invert prose-sm max-w-none text-slate-300 mb-8 flex-grow"
                                    >
                                        <p className="whitespace-pre-line leading-relaxed text-base">
                                            {p.description}
                                        </p>
                                    </motion.div>

                                    {/* Action Footer */}
                                    <div className="mt-auto pt-8 border-t border-indigo-900/20">
                                        <ShimmerBorder rounded="rounded-xl">
                                            <button
                                                onClick={() => {
                                                    const url = p.buyUrl?.trim();
                                                    if (url) window.open(url, "_blank");
                                                    else alert("No buy link available");
                                                }}
                                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                                            >
                                                <ShoppingCart size={18} /> Buy Now
                                            </button>
                                        </ShimmerBorder>
                                        <p className="text-center text-slate-500 text-xs mt-4">
                                            Instant digital delivery via email.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </ShimmerBorder>
                        </div>
                    );
                 })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 mt-10 relative z-20 pb-20">
          <ShimmerBorder rounded="rounded-2xl">
              <div className="bg-[#060010] p-4 rounded-2xl">
                <AdminPanel
                    editing={editing}
                    clearEditing={() => setEditing(null)}
                />
              </div>
          </ShimmerBorder>
        </div>
      )}

      {/* Admin Login Modal */}
      <div className="fixed z-[10000]">
        <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>

    </section>
  );
}