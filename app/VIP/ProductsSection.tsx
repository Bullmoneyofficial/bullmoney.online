"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop, Product } from "../VIP/ShopContext"; // Ensure this path is correct
import AdminLoginModal from "./AdminLoginModal";
import AdminPanel from "./AdminPanel";
import { gsap } from "gsap";

// =========================================
// 1. CONSTANTS AND UTILS
// =========================================
const DEFAULT_GLOW_COLOR = "132, 0, 255";
const MOBILE_BREAKPOINT = 768;

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
  layoutId?: string; // Added for Framer Motion shared layout
  onClick?: () => void; // Added click handler
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
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
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

      // Create ripple effect
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y)); // Simplified hypot check

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
      
      // Trigger external onClick if provided
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
    <motion.article
      layoutId={layoutId} // Pass layoutId here
      ref={cardRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", cursor: "pointer", ...style }}
    >
      {children}
    </motion.article>
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
  onClick: () => void; // Parent controls expansion
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
    e.stopPropagation(); // Prevent card expansion
    const url = product.buyUrl?.trim();
    if (!url) {
      alert("This product does not have a Buy now link set yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const baseClassName = `magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow`;
  const cardStyle = {
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
      <div className="magic-bento-card__header">
        <motion.div 
          layoutId={`card-category-${product.id}`}
          className="magic-bento-card__label"
        >
          {product.category}
        </motion.div>
        {isAdmin && !product.visible && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 text-yellow-500 bg-yellow-500/10 z-20">
            Hidden
          </span>
        )}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-3">
        <motion.img
          layoutId={`card-image-${product.id}`}
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="magic-bento-card__content">
        <motion.h2 
          layoutId={`card-title-${product.id}`}
          className="magic-bento-card__title"
        >
          {product.name}
        </motion.h2>
        <p className="magic-bento-card__description line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-white">${product.price}</span>
          <button
            onClick={handleBuyNow}
            className="px-4 py-1.5 rounded-full bg-sky-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(2,132,199,0.4)] hover:bg-sky-500 transition-colors z-20"
          >
            Buy now
          </button>
        </div>
      </div>

      {isAdmin && (
        <div 
          className="mt-4 flex flex-wrap gap-2 text-xs pt-3 border-t border-neutral-800 z-20"
          onClick={(e) => e.stopPropagation()} // Prevent expand on admin click
        >
          <button
            onClick={onEdit}
            className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-slate-200"
          >
            Edit
          </button>
          <button
            onClick={onToggleVisibility}
            className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-slate-200"
          >
            {product.visible ? "Hide" : "Show"}
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 rounded-full bg-red-900/50 border border-red-900 hover:bg-red-900/80 text-red-200"
          >
            Delete
          </button>
        </div>
      )}
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
        z-index: 200;
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
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
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
// 5. MAIN PRODUCT SECTION
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

  const [loginOpen, setLoginOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isMobile = useMobileDetection();
  const disableAnimations = isMobile;

  // Handle Escape Key to close expanded card
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.visible && !isAdmin) return false;

      const searchMatch = p.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      const categoryMatch =
        filters.category === "all" || p.category === filters.category;

      const min = filters.minPrice ? Number(filters.minPrice) : 0;
      const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      const priceMatch = p.price >= min && p.price <= max;

      return searchMatch && categoryMatch && priceMatch;
    });
  }, [products, filters, isAdmin]);

  useEffect(() => {
    if (!isAdmin) setEditing(null);
  }, [isAdmin]);

  return (
    <section className="bento-section relative inset-0 w-full h-full pointer-events-auto">
      <GlobalSpotlightComponent
        gridRef={productGridRef}
        disableAnimations={disableAnimations}
        glowColor={DEFAULT_GLOW_COLOR}
      />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,#1e293b_0%,transparent_55%,transparent_100%)] opacity-30 z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              BULLMONEY VIP
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Filter by category, price or name. Admins can edit everything in
              real time.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-slate-400">
              {isAdmin ? "Admin mode" : "Customer view"}
            </span>
            <button
              onClick={() => setLoginOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-sky-500/70 hover:text-sky-200 transition-colors backdrop-blur-md"
            >
              {isAdmin ? "Switch admin / logout" : "Admin login"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-[2fr,1fr,1fr,1fr] mb-8">
          <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 backdrop-blur-sm">
            <span className="text-xs text-slate-400">Search</span>
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              placeholder="Type product name..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600 text-white"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            className="rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 text-sm outline-none text-slate-300 backdrop-blur-sm"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c._id || c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minPrice: e.target.value }))
            }
            className="rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 text-sm outline-none text-white backdrop-blur-sm placeholder:text-slate-600"
          />
          <input
            type="number"
            min={0}
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters((f) => ({ ...f, maxPrice: e.target.value }))
            }
            className="rounded-2xl bg-neutral-900/50 border border-neutral-800 px-3 py-2.5 text-sm outline-none text-white backdrop-blur-sm placeholder:text-slate-600"
          />
        </div>

        {/* Products Grid */}
        <div
            ref={productGridRef}
            className="card-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
            {filteredProducts.map((p) => {
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

            {filteredProducts.length === 0 && (
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
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
              />
              
              {/* Expanded Card Container */}
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                 {/* We find the active product. 
                   We use the same layoutIds to morph the grid item into this view.
                 */}
                 {products.filter(p => (p._id || p.id!) === expandedId).map(p => {
                    const pid = p._id || p.id!;
                    return (
                        <motion.div
                            layoutId={`card-container-${pid}`}
                            key={pid}
                            className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#060010] border border-neutral-700 rounded-3xl overflow-hidden shadow-2xl relative"
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
                                <div className="absolute inset-0 bg-gradient-to-t from-[#060010] to-transparent opacity-80" />
                                
                                <motion.div 
                                    layoutId={`card-category-${pid}`}
                                    className="absolute top-4 left-4 z-20"
                                >
                                    <span className="px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md border border-sky-500/30 text-xs font-bold uppercase tracking-wider text-sky-400 shadow-xl">
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
                                     <span className="text-2xl font-bold text-sky-400">${p.price}</span>
                                     <button
                                        onClick={() => {
                                            const url = p.buyUrl?.trim();
                                            if (url) window.open(url, "_blank");
                                            else alert("No buy link available");
                                        }}
                                        className="px-6 py-2 rounded-full bg-sky-600 text-white font-bold shadow-lg hover:bg-sky-500 transition-colors"
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
                                    
                                    {/* Placeholder for extra details */}
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