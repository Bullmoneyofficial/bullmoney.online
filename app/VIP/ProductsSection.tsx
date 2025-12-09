"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop, Product } from "../VIP/ShopContext";
import AdminLoginModal from "./AdminLoginModal";
import AdminPanel from "./AdminPanel";
import { gsap } from "gsap";

// Define the Sort Direction type for clarity
type SortDirection = 'asc' | 'desc';

// =========================================
// 0. PRICE FORMATTING UTILITY (NEW)
// =========================================

/**
 * Ensures the price is displayed with exactly two decimal places.
 * Handles potential non-numeric input gracefully.
 * @param price The price value from the product object.
 * @returns Formatted price string (e.g., "2.50" or "10.00").
 */
const formatPriceDisplay = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return "0.00";
  const num = Number(price);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};


// =========================================
// 0. CSS STYLES FOR ANIMATIONS
// =========================================
const GlobalStyles = () => (
  <style jsx global>{`
    /* FIX 1: Ensure body has full coverage and black background */
    html, body {
      background-color: #000000;
      margin: 0;
      padding: 0;
      min-height: 100vh; 
      height: auto; 
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .shimmer-animation {
      animation: shimmer 2.5s infinite linear;
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .custom-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
  `}</style>
);

// =========================================
// INTEGRATED UI COMPONENTS
// =========================================

// 1. SparklesCore Definition
interface SparklesCoreProps {
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
  minSize,
  maxSize,
  particleDensity,
  particleColor,
  children,
}: SparklesCoreProps) => {
  return (
    <div 
      id={id}
      className={className}
      style={{ background: background || "transparent" }}
    >
      {children}
    </div>
  );
};

// 2. CometCard Definition
interface CometCardProps {
  className?: string;
  children: React.ReactNode;
}

const CometCard: React.FC<CometCardProps> = ({ children, className = "" }) => (
  <div className={`comet-card-wrapper ${className}`}>
    {children}
  </div>
);

// =========================================
// 1. CONSTANTS AND UTILS
// =========================================
const DEFAULT_GLOW_COLOR = "132, 0, 255"; // Indigo/Purple
const MOBILE_BREAKPOINT = 768;

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const handleResize = () => setIsMobile(checkMobile());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

// =========================================
// 2. INTERACTIVE CARD WRAPPER
// =========================================

type InteractiveCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  disableAnimations?: boolean;
  layoutId?: string;
  onClick?: () => void;
};

const InteractiveCardWrapper: React.FC<InteractiveCardProps> = ({
  children,
  className = "",
  style,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = true,
  enableMagnetism = true,
  disableAnimations = false,
  layoutId,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
    };

    const handleMouseLeave = () => {
      if (enableTilt) {
        gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.3, ease: "power2.out" });
      }
      if (enableMagnetism) {
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y));

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => ripple.remove() });
      
      if (onClick) onClick();
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      magnetismAnimationRef.current?.kill();
    };
  }, [disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor, onClick]);

  return (
    <motion.div 
      layoutId={layoutId} 
      className={`${className} shadow-xl hover:shadow-2xl transition-shadow duration-300`}
      style={{ position: "relative", zIndex: 1, ...style }} 
    >
      <div 
        ref={cardRef} 
        style={{ width: '100%', height: '100%', cursor: 'pointer', overflow: 'hidden' }}
      >
        {children}
      </div>
    </motion.div>
  );
};

// =========================================
// 3. PRODUCT BENTO CARD - ENHANCED & FIXED
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
    const url = product.buyUrl?.trim();
    if (!url) {
      alert("This product does not have a Buy now link set yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const baseClassName = `magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow 
                         border border-neutral-800 hover:border-indigo-500/50 transition-colors duration-300`;
                         
  const cardStyle = {
    // Background color of the card content
    backgroundColor: "#060010", 
    "--glow-color": DEFAULT_GLOW_COLOR,
  } as React.CSSProperties;

  return (
    <InteractiveCardWrapper
      layoutId={`card-container-${product.id}`}
      className={baseClassName}
      style={cardStyle}
      disableAnimations={disableAnimations}
      enableTilt={true}
      enableMagnetism={true}
      onClick={onClick}
    >
      <CometCard> 
        {/* Card Background Overlay with deeper glow/shimmer effect */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(132,0,255,0.08)_0%,transparent_70%)] pointer-events-none rounded-[1.4rem]" />

        <div className="p-4 md:p-6 w-full h-full relative flex flex-col justify-between"> 
          
          {/* HEADER: Category and Admin Status */}
          <div className="magic-bento-card__header relative z-10 flex justify-between items-center mb-3">
            <motion.div 
              layoutId={`card-category-${product.id}`}
              className="px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-300 text-xs font-semibold uppercase tracking-widest border border-indigo-500/30 shadow-md"
            >
              {product.category}
            </motion.div>
            {isAdmin && !product.visible && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-500 bg-yellow-500/10 z-20 font-medium">
                HIDDEN
              </span>
            )}
          </div>

          {/* IMAGE CONTAINER: Aspect ratio maintained, added Shimmer/Glow */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl my-3 z-10 group">
            {/* Shimmer Effect Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden">
                <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer-animation" />
            </div>
            
            <motion.img
              layoutId={`card-image-${product.id}`}
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover saturate-105 shadow-xl transition-all duration-500 group-hover:scale-[1.05] group-hover:ring-2 ring-indigo-500/50"
            />
          </div>

          {/* CONTENT AND ACTIONS */}
          <div className="magic-bento-card__content relative z-10 flex flex-col flex-grow">
            <motion.h2 
              layoutId={`card-title-${product.id}`}
              className="text-xl font-extrabold text-white mb-2 leading-tight"
            >
              {product.name}
            </motion.h2>
            <p className="magic-bento-card__description line-clamp-2 text-slate-400 text-sm flex-grow">
              {product.description}
            </p>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-neutral-800">
              <span 
                className="text-3xl font-bold inline-block"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #FFFFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {/* 🎯 FIX APPLIED HERE: Format the price for display */}
                ${formatPriceDisplay(product.price)} 
              </span>
              
              <button
                onClick={handleBuyNow}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-md font-semibold shadow-[0_0_15px_rgba(124,58,237,0.6)] hover:bg-indigo-500 transition-all duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,1)] z-20 transform hover:scale-[1.05]"
              >
                Get Access
              </button>
            </div>
          </div>

          {/* ADMIN BUTTON BLOCK */}
          {isAdmin && (
            <div 
              className="mt-4 pt-4 border-t border-neutral-700/70 flex justify-end gap-3 text-sm z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={onEdit} className="px-4 py-1 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700/80 hover:text-white transition-colors shadow-sm hover:shadow-md">Edit</button>
              <button 
                onClick={onToggleVisibility} 
                className={`
                  px-4 py-1 rounded-lg font-medium shadow-sm hover:shadow-md transition-colors
                  ${product.visible
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-600 hover:bg-amber-600/40'
                    : 'bg-green-600/20 text-green-300 border border-green-600 hover:bg-green-600/40'
                  }`}
              >
                {product.visible ? "Hide" : "Show"}
              </button>
              <button onClick={onDelete} className="px-4 py-1 rounded-lg font-medium bg-red-700/40 border border-red-700 text-red-300 hover:bg-red-700/80 hover:text-white transition-colors shadow-sm hover:shadow-md">Delete</button>
            </div>
          )}
        </div>
      </CometCard> 
    </InteractiveCardWrapper>
  );
}

// =========================================
// 4. GLOBAL SPOTLIGHT COMPONENT
// =========================================
const GlobalSpotlightComponent: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}> = ({
  gridRef,
  disableAnimations,
  spotlightRadius = 300,
  glowColor = DEFAULT_GLOW_COLOR,
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disableAnimations || !gridRef.current) return;

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight-effect";
    spotlight.style.cssText = `
        position: fixed;
        width: ${spotlightRadius * 2}px;
        height: ${spotlightRadius * 2}px;
        border-radius: 50%;
        pointer-events: none;
        background: radial-gradient(circle,
            rgba(${glowColor}, 0.15) 0%,
            rgba(${glowColor}, 0.08) 15%,
            rgba(${glowColor}, 0.04) 25%,
            rgba(${glowColor}, 0.02) 40%,
            rgba(${glowColor}, 0.01) 65%,
            transparent 70%
        );
        z-index: 10; 
        opacity: 0;
        transform: translate(-50%, -50%);
        mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return;
      const section = gridRef.current?.closest(".bento-section");
      const rect = section?.getBoundingClientRect();

      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: "power2.out",
        opacity: mouseInside ? 0.8 : 0,
      });
    };

    const handleMouseLeave = () => {
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [disableAnimations, spotlightRadius, glowColor, gridRef]);

  return null;
};

// =========================================
// 5. MAIN PRODUCT SECTION - FIXED SORTING
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

  // NEW STATE: To control the active sort direction
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc'); // 'asc' = Cheapest First

  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isMobile = useMobileDetection();
  const disableAnimations = isMobile;

  // Handler to toggle the sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Handle Body Scroll Lock
  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [expandedId]);

  // Handle Escape Key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // --- FILTER AND SORT LOGIC: NOW DEPENDS ON sortDirection STATE ---
  const filteredAndSortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    // 1. FILTERING
    const filtered = products.filter((p) => {
      if (p.category === 'VIDEO' || p.category === 'CONTENT') return false;
      if (!p.visible && !isAdmin) return false;

      const searchMatch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      const categoryMatch = filters.category === "all" || p.category === filters.category;
      
      const min = filters.minPrice ? Number(filters.minPrice) : 0;
      const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      
      // Parse Price for filtering (removing symbols)
      const priceStr = String(p.price).replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr) || 0;
      
      const priceMatch = price >= min && price <= max;
      
      return searchMatch && categoryMatch && priceMatch;
    });

    // 2. SORTING (Robust Parsing)
    return filtered.sort((a, b) => {
      // Robustly parse prices: turn "$1,200" -> 1200
      const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;

      if (sortDirection === 'asc') {
        return priceA - priceB; // Cheapest first
      } else {
        return priceB - priceA; // Expensive first
      }
    });

  }, [products, filters, isAdmin, sortDirection]); // Dependency array includes sortDirection!

  // Clear editing state if admin mode is disabled
  useEffect(() => {
    if (!isAdmin) setEditing(null);
  }, [isAdmin]);

  const inputBaseClasses = "rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 text-sm outline-none backdrop-blur-sm placeholder:text-slate-600 transition-colors focus:border-indigo-500";

  // Dynamic content for the sort button
  const sortButtonText = sortDirection === 'asc' ? 'Cheapest First' : 'Expensive First';
  const sortButtonIcon = sortDirection === 'asc' 
    ? ( // Ascending Icon (Up Arrow)
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
        </svg>
      )
    : ( // Descending Icon (Down Arrow)
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4"/>
        </svg>
      );


  return (
    <section className="bento-section relative inset-0 w-full min-h-screen bg-black pointer-events-auto">
      <GlobalStyles />
      <GlobalSpotlightComponent
        gridRef={productGridRef}
        disableAnimations={disableAnimations}
        glowColor={DEFAULT_GLOW_COLOR}
      />

      <div className="absolute inset-0 pointer-events-none bg-black z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-8">
          
          {/* ✨ SPARKLES TITLE - FIX: Removed h-[10rem] from outer div */}
          <div className="w-full flex flex-col items-center justify-center overflow-hidden rounded-md"> 
            <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold text-center text-white relative z-20">
              BULLMONEY VIP
            </h1>
            <p className="mt-1 text-sm text-slate-400 relative z-20">
             Filter by category, price or name. Admins can edit everything in real time.
            </p>
            
            {/* FIX: Removed h-40 and w-[40rem] from container, used w-full */}
            <div className="w-full relative py-8"> 
              <div className="absolute inset-x-0 bottom-4 flex justify-center w-full"> 
                {/* Indigo Line Blur (Top) */}
                <div className="absolute top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
                {/* Indigo Line (Top) */}
                <div className="absolute top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                
                {/* Purple Line Blur (Top) */}
                <div className="absolute top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-[5px] w-1/4 blur-sm" style={{ left: '60%' }} />
                {/* Purple Line (Top) */}
                <div className="absolute top-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px w-1/4" style={{ left: '60%' }} />
              </div>

              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={1200}
                className="w-full h-full min-h-[100px]" // Min height for sparkle area
                particleColor="#FFFFFF"
              />

              {/* Keep this mask image for the sparkle effect fade */}
              <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row items-center justify-end self-end sm:self-auto">
            
            {/* INTERACTIVE SORT CONTROL BUTTON */}
            <button
              onClick={toggleSortDirection}
              className="text-xs px-3 py-1.5 rounded-full border border-indigo-700 bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70 transition-colors backdrop-blur-md flex items-center gap-1 font-medium"
            >
              {sortButtonIcon}
              {sortButtonText}
            </button>

            {/* ADMIN LOGIN BUTTON */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {isAdmin ? "Admin mode" : "Customer view"}
              </span>
              <button
                onClick={() => setLoginOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-indigo-500/70 hover:text-indigo-200 transition-colors backdrop-blur-md"
              >
                {isAdmin ? "Switch admin / logout" : "Admin login"}
              </button>
            </div>
          </div>
        </div>

        {/* Filters - UPDATED STYLING */}
        <div className="grid gap-3 sm:grid-cols-[2fr,1fr,1fr,1fr] mb-8">
          <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 backdrop-blur-sm transition-colors focus-within:border-indigo-500">
            <span className="text-xs text-slate-400">Search</span>
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Type product name..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600 text-white"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className={`${inputBaseClasses} text-slate-300 appearance-none pr-8 cursor-pointer`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="all" className="bg-neutral-900">All categories</option>
            {categories.map((c) => (
              <option key={c._id || c.id} value={c.name} className="bg-neutral-900">{c.name}</option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            className={`${inputBaseClasses} text-white`}
          />
          <input
            type="number"
            min={0}
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className={`${inputBaseClasses} text-white`}
          />
        </div>

        {/* Products Grid */}
        <div
            ref={productGridRef}
            className="card-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
            {filteredAndSortedProducts.map((p) => { 
            const pid = p._id || p.id!;
            return (
              <ProductBentoCard
                key={pid}
                product={{ ...p, id: pid }}
                isAdmin={isAdmin}
                onEdit={() => setEditing({ ...p, id: pid })}
                onDelete={() => deleteProduct(pid)}
                onToggleVisibility={() => toggleVisibility(pid)}
                disableAnimations={disableAnimations}
                onClick={() => setExpandedId(pid)}
              />
            );
            })}

            {filteredAndSortedProducts.length === 0 && (
            <div className="col-span-full text-center text-sm text-slate-400 py-10">
                No products match those filters yet.
            </div>
            )}
        </div>

        {/* --- EXPANDED OVERLAY --- */}
        <AnimatePresence>
          {expandedId && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedId(null)}
                className="fixed inset-0 z-[9999] bg-[#000000]/90 backdrop-blur-lg bg-[radial-gradient(circle_at_center,rgba(132,0,255,0.1)_0%,transparent_70%)]"
              />
              
              {/* Expanded Card Container */}
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                 {products.filter(p => (p._id || p.id!) === expandedId).map(p => {
                    const pid = p._id || p.id!;
                    return (
                        <motion.div
                            layoutId={`card-container-${pid}`}
                            key={pid}
                            className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#060010] border border-indigo-700/50 rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(null);
                                }}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Image Header */}
                            <div className="relative h-64 sm:h-80 w-full shrink-0">
                                <motion.img
                                    layoutId={`card-image-${pid}`}
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#060010] via-transparent to-transparent opacity-90" />
                                
                                <motion.div 
                                    layoutId={`card-category-${pid}`}
                                    className="absolute top-4 left-4 z-20"
                                >
                                    <span className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md border border-indigo-500/30 text-xs font-bold uppercase tracking-wider text-indigo-400 shadow-xl">
                                        {p.category}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Content Body */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                                <motion.h2 
                                    layoutId={`card-title-${pid}`}
                                    className="text-3xl font-bold text-white mb-4"
                                >
                                    {p.name}
                                </motion.h2>

                                <div className="flex items-center gap-4 mb-6">
                                    <span 
                                      className="text-2xl font-bold"
                                      style={{
                                        background: 'linear-gradient(90deg, #8B5CF6 0%, #FFFFFF 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                      }}
                                    >
                                      {/* 🎯 FIX APPLIED HERE: Format the price for display */}
                                      ${formatPriceDisplay(p.price)}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const url = p.buyUrl?.trim();
                                            if (url) window.open(url, "_blank");
                                            else alert("No buy link available");
                                        }}
                                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold text-md shadow-[0_0_15px_rgba(124,58,237,0.6)] hover:bg-indigo-500 transition-all duration-300 hover:shadow-[0_0_25px_rgba(124,58,237,1)] transform hover:scale-[1.05]"
                                    >
                                        Buy Now
                                    </button>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300"
                                >
                                    <p className="whitespace-pre-line leading-relaxed">
                                        {p.description}
                                    </p>
                                    
                                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Availability</h4>
                                            <p className="text-slate-400">In Stock</p>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">Delivery</h4>
                                            <p className="text-slate-400">Instant Digital / Shipping</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                 })}
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="mt-10 relative z-20">
            <AdminPanel
              editing={editing}
              clearEditing={() => setEditing(null)}
            />
          </div>
        )}

        {/* Admin Login Modal */}
        <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    </section>
  );
}