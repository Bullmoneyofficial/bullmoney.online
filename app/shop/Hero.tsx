"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Loader2, Edit2, Save, X, Trash2, 
  Lock, TrendingUp, Zap, Globe, 
  ShieldCheck, Users, Star, BarChart3, ArrowDown 
} from "lucide-react";

// --- IMPORTS ---
import { useShop, type Product } from "@/app/VIP/ShopContext"; 
import AdminLoginModal from "@/app/VIP/AdminLoginModal";
import AdminPanel from "@/app/VIP/AdminPanel"; 

// --- EXTERNAL IMPORTS ---
import Faq from "./Faq"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- HOOK: DETECT MOBILE ---
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
};

// --- SPARKLES COMPONENT ---
const SparklesCore = (props: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}) => {
  const {
    id = "tsparticles",
    className,
    background = "transparent",
    minSize = 0.6,
    maxSize = 1.4,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles
          id={id}
          className={cn("h-full w-full")}
          options={{
            background: { color: { value: background } },
            fullScreen: { enable: false, zIndex: 1 },
            fpsLimit: 60, // OPTIMIZATION: Reduced FPS limit for mobile battery
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: false, mode: "repulse" },
                resize: { enable: true },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
              color: { value: particleColor },
              move: {
                enable: true,
                speed: speed,
                direction: "none",
                random: false,
                straight: false,
                outModes: { default: "out" },
              },
              number: {
                density: { enable: true, width: 1920, height: 1080 },
                value: particleDensity, // Suggest lowering this on mobile via props if needed
              },
              opacity: {
                value: { min: 0.1, max: 0.5 },
                animation: { enable: true, speed: speed, sync: false },
              },
              shape: { type: "circle" },
              size: {
                value: { min: minSize, max: maxSize },
              },
            },
            detectRetina: true,
          } as any}
        />
      )}
    </div>
  );
};

// --- PRODUCT CARD COMPONENT ---
const ProductCard = React.memo(({
  product,
  uniqueLayoutId, 
  translate,
  setActive,
}: {
  product: Product;
  uniqueLayoutId: string;
  translate: MotionValue<number>;
  setActive: (product: Product, layoutId: string) => void; 
}) => {
  return (
    <motion.div
      style={{ x: translate }}
      whileHover={{ y: -10 }}
      onClick={() => setActive(product, uniqueLayoutId)} 
      className="group/product h-[16rem] w-[12rem] xs:h-[20rem] xs:w-[16rem] md:h-[26rem] md:w-[22rem] relative flex-shrink-0 cursor-pointer"
    >
      <div className="block group-hover/product:shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all duration-500 rounded-[20px] h-full w-full">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-[20px] overflow-hidden bg-neutral-900 border border-neutral-800 group-hover/product:border-sky-500/50 transition-colors"
        >
            <Image
                src={product.imageUrl}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={false}
                className="object-cover object-center absolute h-full w-full inset-0 opacity-80 group-hover/product:opacity-100 group-hover/product:scale-105 transition-all duration-700"
                alt={product.name}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-3 md:p-5 translate-y-2 group-hover/product:translate-y-0 transition-transform duration-500">
                <div className="flex justify-between items-end">
                    <div className="max-w-[85%]">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider border border-sky-500/20 backdrop-blur-sm">
                                {product.category || "Vip"}
                             </span>
                        </div>
                        <h2 className="text-white font-sans font-bold text-sm md:text-lg leading-tight mb-1 truncate">
                            {product.name}
                        </h2>
                        {product.price > 0 && <p className="text-sky-400 font-mono text-xs md:text-sm font-bold">${product.price}</p>}
                    </div>
                    {/* Hide icon on very small screens to save space */}
                    <div className="hidden md:flex h-8 w-8 rounded-full bg-sky-600 text-white items-center justify-center opacity-0 group-hover/product:opacity-100 transition-all scale-75 group-hover/product:scale-100 shadow-lg shadow-sky-500/30">
                        <TrendingUp size={16} />
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

interface HeroProps {
  onScrollToProducts: () => void;
}

// --- MAIN HERO PARALLAX ---
const HeroParallax = ({ onScrollToProducts }: HeroProps) => {
  const { state, updateProduct, deleteProduct } = useShop() as any;
  const { products, hero, isAdmin, loading } = state;
  const isMobile = useIsMobile();

  // --- PARALLAX DATA PREP ---
  const displayProducts = useMemo(() => {
    const shopProducts = products.filter((p: Product) => {
        const cat = p.category?.toUpperCase() || "";
        return cat !== "VIDEO" && cat !== "CONTENT";
    });

    if (shopProducts.length === 0) return [];

    let filledProducts = [...shopProducts];
    while (filledProducts.length < 15) {
      filledProducts = [...filledProducts, ...shopProducts];
    }
    return filledProducts;
  }, [products]);

  const firstRow = displayProducts.slice(0, 5);
  const secondRow = displayProducts.slice(5, 10);
  const thirdRow = displayProducts.slice(10, 15);

  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // OPTIMIZATION: Reduce translation distance on mobile to prevent elements flying off-screen
  const maxTranslate = isMobile ? 200 : 800;
  const maxRotate = isMobile ? 5 : 15;
  const maxTranslateY = isMobile ? [-200, 50] : [-700, 200];

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, maxTranslate]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -maxTranslate]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [maxRotate, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.1], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], maxTranslateY), springConfig);

  // --- STATE ---
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [adminEditing, setAdminEditing] = useState<Product | null>(null);

  const handleOpen = (product: Product, layoutId: string) => {
    setActiveProduct(product);
    setActiveLayoutId(layoutId); 
    setEditForm({ ...product });
    setIsEditing(false);
  };

  const handleClose = useCallback(() => {
    setActiveProduct(null);
    setActiveLayoutId(null);
    setIsEditing(false);
  }, []);

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if(!activeProduct) return;
    const pid = activeProduct._id || activeProduct.id;
    if(!pid) return;

    setIsSaving(true);
    try {
      // @ts-ignore
      const { _id, id, ...payload } = editForm; 
      await updateProduct(pid, payload);
      setActiveProduct(prev => prev ? { ...prev, ...editForm } as Product : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!activeProduct) return;
    const pid = activeProduct._id || activeProduct.id;
    if(!pid) return;

    if(window.confirm("Are you sure? This cannot be undone.")) {
      setIsSaving(true);
      try {
        await deleteProduct(pid);
        handleClose();
      } catch (error) {
        alert("Failed to delete.");
      } finally {
        setIsSaving(false);
      }
    }
  }

  useEffect(() => {
    document.body.style.overflow = activeProduct ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; }
  }, [activeProduct]);

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-black text-sky-500">
              <Loader2 className="animate-spin w-10 h-10" />
          </div>
      )
  }

  return (
    <div className="bg-black relative selection:bg-sky-500/30">
        
    {/* --- ADMIN LOGIN MODAL --- */}
    <AdminLoginModal 
        open={isAdminLoginOpen} 
        onClose={() => setIsAdminLoginOpen(false)} 
    />

    {/* --- PRODUCT OVERLAY (MODAL) --- */}
    <AnimatePresence>
        {activeProduct && activeLayoutId && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] grid place-items-center bg-black/90 backdrop-blur-xl p-2 md:p-4"
                onClick={handleClose}
            >
                <motion.div
                    layoutId={activeLayoutId} 
                    className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-50 p-2 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
                    >
                        <X size={20} />
                    </button>

                    {/* EDIT TRIGGER (Only if Admin) */}
                    {isAdmin && !isEditing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="absolute top-3 right-14 z-50 p-2 bg-sky-600 rounded-full text-white hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.5)] flex gap-2 items-center px-4 font-bold text-xs uppercase"
                      >
                          <Edit2 size={14} /> Edit
                      </button>
                    )}

                    {/* LEFT: IMAGE SECTION */}
                    <div className="w-full md:w-1/2 h-48 sm:h-64 md:h-auto relative bg-neutral-800 shrink-0">
                         <Image
                            src={isEditing ? (editForm.imageUrl || "") : activeProduct.imageUrl}
                            fill
                            priority={true}
                            className="object-cover"
                            alt={activeProduct.name}
                        />
                         {isEditing && (
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                              <p className="text-white text-xs font-mono bg-black/50 p-2 rounded">Preview Mode</p>
                           </div>
                        )}
                    </div>

                    {/* RIGHT: CONTENT SECTION */}
                    {/* OPTIMIZATION: Reduced padding for mobile, added proper overflow handling */}
                    <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-12 flex flex-col justify-start md:justify-center overflow-y-auto bg-neutral-900 text-neutral-100">
                        {isEditing ? (
                          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-300 pb-10" onClick={(e) => e.stopPropagation()}>
                             {/* EDIT FORM */}
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Product Name</label>
                                <input 
                                  value={editForm.name || ""} 
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white placeholder-neutral-500"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Image URL</label>
                                <input 
                                  value={editForm.imageUrl || ""} 
                                  onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})}
                                  className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white placeholder-neutral-500 font-mono"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Description</label>
                                <textarea 
                                  rows={4}
                                  value={editForm.description || ""} 
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white resize-none"
                                />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Price ($)</label>
                                  <input 
                                    type="number"
                                    value={editForm.price || 0} 
                                    onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                    className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase text-neutral-500 font-bold">Category</label>
                                  <input 
                                    value={editForm.category || ""} 
                                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                    className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white"
                                  />
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold">Link / Buy URL</label>
                                <input 
                                  value={editForm.buyUrl || ""} 
                                  onChange={(e) => setEditForm({...editForm, buyUrl: e.target.value})}
                                  className="w-full bg-neutral-800 p-2 rounded text-sm outline-none border border-transparent focus:border-sky-500 text-white font-mono"
                                />
                             </div>

                             <div className="flex gap-2 pt-4 border-t border-neutral-800 mt-4">
                                <button 
                                  onClick={handleSaveEdit} 
                                  disabled={isSaving}
                                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                  {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save</>}
                                </button>
                                <button 
                                  onClick={handleDelete}
                                  disabled={isSaving}
                                  className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditForm({ ...activeProduct }); }}
                                  className="text-neutral-500 hover:text-white text-xs px-2"
                                >
                                  Cancel
                                </button>
                             </div>
                          </div>
                        ) : (
                          // --- VIEW MODE ---
                          <div className="pb-10 md:pb-0">
                            <motion.h3 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl md:text-3xl font-sans font-bold text-white mb-2"
                            >
                                {activeProduct.name}
                            </motion.h3>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex gap-2 mb-4 md:mb-6"
                            >
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-mono">
                                   {activeProduct.visible ? "Available" : "Hidden"}
                                </span>
                                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded border border-neutral-700 font-mono">
                                   {activeProduct.category}
                                </span>
                            </motion.div>
                            
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-neutral-400 mb-6 md:mb-8 text-sm leading-relaxed border-l-2 border-sky-500 pl-4"
                            >
                                {activeProduct.description || "Unlock superior market analysis with this exclusive tool."}
                            </motion.p>
                            
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-4 mb-8 md:mb-10"
                            >
                                <div className="flex justify-between items-center bg-black/50 p-3 rounded border border-sky-500/20">
                                    <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Price</span>
                                    <span className="text-xl text-white font-bold font-mono">${activeProduct.price}</span>
                                </div>
                            </motion.div>

                            <motion.a
                                href={activeProduct.buyUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="w-full py-3 md:py-4 bg-gradient-to-r from-sky-600 to-blue-500 text-white rounded-lg font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                            >
                                Get Access <Zap size={16} className="fill-white" />
                            </motion.a>
                          </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>

    {/* --- HERO SCROLL SECTION --- */}
    <div
        ref={ref}
        // Adjusted height for mobile to be less scroll-heavy
        className="h-[180vh] md:h-[220vh] pt-10 pb-0 overflow-hidden bg-black antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
        {/* HEADER SECTION WITH SPARKLES */}
        <div className="max-w-7xl relative mx-auto py-12 md:py-32 px-4 w-full z-20 mb-20 md:mb-32">
             <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
                <SparklesCore
                    id="parallax-sparkles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={isMobile ? 30 : 50} // Less particles on mobile
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                />
            </div>
            
            {/* Header Content from DB */}
            <div className="relative z-20 flex flex-col items-start gap-3 md:gap-4">
                 {!!hero.badge && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-700/30 bg-sky-900/10 text-sky-900 text-[10px] md:text-xs font-mono tracking-wider uppercase"
                        >
                        <Zap size={10} className="fill-sky-400" /> {hero.badge}
                    </motion.div>
                 )}

                {/* Responsive Text Size */}
                <h1 className="text-4xl sm:text-5xl md:text-8xl font-sans font-black text-white leading-none tracking-tighter">
                {hero.title.split(" ").map((word: string, i: number) => (
                    <span key={i} className="inline-block mr-2 md:mr-3 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-sky-900">
                      {word}
                    </span>
                ))}
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-2xl text-base md:text-xl mt-4 md:mt-6 text-neutral-400 font-normal leading-relaxed"
                    >
                    {hero.subtitle}
                </motion.p>
                
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    onClick={onScrollToProducts}
                    className="mt-6 px-6 py-2.5 md:px-8 md:py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center gap-2 text-xs md:text-sm"
                >
                    Start Shopping <ArrowDown size={14} />
                </motion.button>

                {/* SOCIAL PROOF */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center"
                >
                    <Faq />
                    
                    <div className="flex items-center gap-4 pl-0 sm:pl-4 border-l-0 sm:border-l border-neutral-800">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center text-[10px] text-neutral-500">
                                <Users size={12} />
                                </div>
                            ))}
                        </div>
                        <div className="text-xs">
                            <div className="text-white font-bold flex items-center gap-1">2.5k+ Traders <ShieldCheck size={10} className="text-sky-500" /></div>
                            <div className="text-neutral-500 flex items-center gap-1">
                                <Star size={10} className="fill-yellow-500 text-yellow-500" /> 4.9/5 Rating
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
        
        {/* PARALLAX GRID */}
        <motion.div
            style={{ rotateX, rotateZ, translateY, opacity }}
            className="relative z-10 will-change-transform"
        >
            {/* OPTIMIZATION: Reduced Space-X gap on mobile */}
            <motion.div className="flex flex-row-reverse space-x-reverse space-x-4 md:space-x-20 mb-4 md:mb-20">
            {firstRow.map((product, idx) => (
                <ProductCard 
                    key={`row1-${product._id || product.id}-${idx}`}
                    product={product} 
                    uniqueLayoutId={`image-${product._id || product.id}-row1-${idx}`} 
                    translate={translateX} 
                    setActive={handleOpen} 
                />
            ))}
            </motion.div>
            <motion.div className="flex flex-row mb-4 md:mb-20 space-x-4 md:space-x-20">
            {secondRow.map((product, idx) => (
                <ProductCard 
                    key={`row2-${product._id || product.id}-${idx}`}
                    product={product} 
                    uniqueLayoutId={`image-${product._id || product.id}-row2-${idx}`} 
                    translate={translateXReverse} 
                    setActive={handleOpen} 
                />
            ))}
            </motion.div>
            <motion.div className="flex flex-row-reverse space-x-reverse space-x-4 md:space-x-20">
            {thirdRow.map((product, idx) => (
                <ProductCard 
                    key={`row3-${product._id || product.id}-${idx}`}
                    product={product} 
                    uniqueLayoutId={`image-${product._id || product.id}-row3-${idx}`} 
                    translate={translateX} 
                    setActive={handleOpen} 
                />
            ))}
            </motion.div>
        </motion.div>
    </div>

    {/* --- ADMIN PANEL (RESTORED) --- */}
    {isAdmin && (
      <div className="max-w-7xl mx-auto px-4 mt-10 relative z-20 mb-20">
        <AdminPanel
          editing={adminEditing}
          clearEditing={() => setAdminEditing(null)}
        />
      </div>
    )}

    {/* --- FOOTER / ADMIN ACCESS --- */}
    <div className="relative z-20 bg-black text-neutral-500 py-16 px-8 text-center border-t border-neutral-900">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-xs uppercase tracking-widest text-neutral-400">
            <div className="flex flex-col items-center gap-3">
                <Globe className="text-sky-500 mb-1" />
                <span>Free Worldwide Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-3">
                <BarChart3 className="text-sky-500 mb-1" />
                <span>Cutting-edge Tools</span>
            </div>
            <div className="flex flex-col items-center gap-3">
                <ShieldCheck className="text-sky-500 mb-1" />
                <span>Secure Checkout</span>
            </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] opacity-50">&copy; {new Date().getFullYear()} BULLMONEY VIP. All rights reserved.</p>
            
            {/* ADMIN LOGIN TRIGGER */}
            {!isAdmin && (
                <button 
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="flex items-center gap-2 text-[10px] opacity-20 hover:opacity-100 transition-opacity uppercase tracking-widest hover:text-sky-500"
                >
                  <Lock size={10} /> Admin Access
                </button>
            )}
        </div>
    </div>
    </div>
  );
};

export default HeroParallax;