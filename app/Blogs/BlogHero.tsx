"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef, ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
  useInView,
  useWillChange
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Loader2, Edit2, Save, X, Trash2,
  Lock, Zap, ShieldCheck, Users, Star, BarChart3,
  Youtube, PlayCircle, ExternalLink, Plus, Copy, Check,
  ChevronLeft
} from "lucide-react";

import { useShop, type Product } from "@/app/VIP/ShopContext";
import AdminLoginModal from "@/app/VIP/AdminLoginModal";
import AdminPanel from "@/app/VIP/AdminPanel";
import Faq from "@/app/shop/Faq";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        setIsMobile(mediaQuery.matches);
        const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        } else {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);
    return isMobile;
};

const getYoutubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2]?.length === 11) ? match[2] : null;
};

// ==========================================
// NEW: SHIMMER BORDER COMPONENT
// ==========================================

// Blue/Sky gradient
const shimmerGradient = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ffffff 50%, #00000000 100%)";

interface ShimmerBorderProps {
    children: ReactNode;
    className?: string;
    borderRadius?: string;
    borderWidth?: string;
    speed?: number;
    colorOverride?: string;
}

const ShimmerBorder = ({ 
    children, 
    className, 
    borderRadius = 'rounded-xl', 
    borderWidth = 'inset-[1.5px]', 
    speed = 3, 
    colorOverride 
}: ShimmerBorderProps) => {
    const finalGradient = colorOverride || shimmerGradient;
    
    return (
        <div className={cn("relative overflow-hidden group/shimmer", borderRadius, className)}>
            <motion.div
                className="absolute inset-[-100%]" 
                animate={{ rotate: 360 }}
                transition={{ 
                    duration: speed, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                style={{ background: finalGradient }}
            />
            {/* Inner Mask (The actual content background) */}
            <div className={cn("absolute bg-neutral-900/90 flex items-center justify-center z-10", borderRadius, borderWidth)}>
                {/* Mask Layer */}
            </div>
            {/* Content Layer */}
            <div className="relative z-20 h-full w-full">
                {children}
            </div>
        </div>
    );
};

// --- SPARKLES COMPONENT ---
const SparklesCore = React.memo((props: { id?: string; className?: string; background?: string; minSize?: number; maxSize?: number; speed?: number; particleColor?: string; particleDensity?: number; isMobile?: boolean }) => {
  const { id = "tsparticles", className, background = "transparent", minSize = 0.6, maxSize = 1.4, speed = 1, particleColor = "#ffffff", particleDensity = 100, isMobile = false } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => { await loadSlim(engine); }).then(() => { setInit(true); });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000 pointer-events-none", init && "opacity-100", className)}>
      {init && (
        <Particles 
            id={id} 
            className={cn("h-full w-full")} 
            options={{ 
                background: { color: { value: background } }, 
                fullScreen: { enable: false, zIndex: 1 }, 
                fpsLimit: isMobile ? 30 : 60, 
                interactivity: { 
                    events: { 
                        onClick: { enable: !isMobile, mode: "push" }, 
                        onHover: { enable: !isMobile, mode: "repulse" }, 
                        resize: { enable: true } 
                    }, 
                    modes: { push: { quantity: 2 }, repulse: { distance: 100, duration: 0.4 } } 
                }, 
                particles: { 
                    bounce: { horizontal: { value: 1 }, vertical: { value: 1 } }, 
                    color: { value: particleColor }, 
                    move: { enable: true, speed: speed, direction: "none", random: false, straight: false, outModes: { default: "out" } }, 
                    number: { density: { enable: true, width: 1920, height: 1080 }, value: isMobile ? particleDensity / 2 : particleDensity }, 
                    opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed, sync: false } }, 
                    shape: { type: "circle" }, 
                    size: { value: { min: minSize, max: maxSize } } 
                }, 
                detectRetina: !isMobile 
            } as any} 
        />
      )}
    </div>
  );
});
SparklesCore.displayName = "SparklesCore";

// --- VIDEO CARD COMPONENT ---
const VideoCard = React.memo(({
  product,
  uniqueLayoutId,
  translate,
  setActive,
  isMobile,
}: {
  product: Product;
  uniqueLayoutId: string;
  translate: MotionValue<number>;
  setActive: (product: Product, layoutId: string) => void;
  isMobile: boolean;
}) => {
  
  const videoId = getYoutubeId(product.buyUrl);
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "200px 0px 200px 0px", once: false });
  const willChange = useWillChange();
  const qualityParam = isMobile ? "medium" : "hd1080";

  return (
    <motion.div
      ref={ref}
      style={{ x: translate, willChange }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActive(product, uniqueLayoutId)}
      className="group/product h-[14rem] w-[18rem] md:h-[22rem] md:w-[32rem] relative flex-shrink-0 cursor-pointer backface-hidden transform-gpu"
    >
      <div className="block h-full w-full md:group-hover/product:shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all duration-500 rounded-[20px] md:rounded-[24px] safari-fix-layer">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-[20px] md:rounded-[24px] overflow-hidden bg-neutral-900 border border-neutral-800 md:group-hover/product:border-red-600/50 transition-colors safari-mask-fix"
        >
            {videoId ? (
                <div className="absolute inset-0 w-full h-full bg-black pointer-events-none">
                     {isInView ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&vq=${qualityParam}`}
                            className="w-[300%] h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] object-cover pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={product.name}
                            loading="lazy"
                        />
                     ) : (
                        <Image
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            fill
                            sizes="(max-width: 768px) 300px, 500px"
                            className="object-cover opacity-50 blur-sm scale-110"
                            alt="Loading"
                        />
                     )}
                </div>
            ) : (
                <Image
                    src={product.imageUrl || "https://via.placeholder.com/500"}
                    fill
                    sizes="(max-width: 768px) 300px, 500px"
                    className="object-cover opacity-60 group-hover/product:opacity-100 transition-opacity duration-500"
                    alt={product.name}
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 pointer-events-none"></div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-full opacity-100 md:opacity-0 md:group-hover/product:opacity-100 transition-opacity duration-300 scale-100 md:scale-75 md:group-hover/product:scale-100 border border-white/20">
                    <PlayCircle className="text-white w-6 h-6 md:w-8 md:h-8 fill-red-600/20" />
                 </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 translate-y-0 md:translate-y-2 md:group-hover/product:translate-y-0 transition-transform duration-500 pointer-events-none">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 md:py-1 rounded bg-black/80 md:bg-black/60 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-wider md:backdrop-blur-md flex items-center gap-1 border border-white/10">
                    <Youtube size={10} className="text-red-500" />
                    {product.category || "VIDEO"}
                    </span>
                </div>
                <h2 className="text-white font-sans font-bold text-base md:text-xl leading-tight truncate w-full shadow-black drop-shadow-lg">
                    {product.name}
                </h2>
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
VideoCard.displayName = "VideoCard";

// --- MAIN HERO PARALLAX ---
const HeroParallax = () => {
  const { state, updateProduct, deleteProduct, createProduct } = useShop() as any; 
  const { products = [], hero, isAdmin, loading, categories = [] } = state || {};
  const isMobile = useIsMobile();
  const willChange = useWillChange();

  const videoProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Product) => p.category === "SUBSCRIPTIONS");
  }, [products]);

  const displayProducts = useMemo(() => {
    if (videoProducts.length === 0) return [];
    let filledProducts = [...videoProducts];
    const limit = isMobile ? 6 : 15; 
    while (filledProducts.length < limit) {
      filledProducts = [...filledProducts, ...videoProducts];
    }
    return filledProducts.slice(0, limit);
  }, [videoProducts, isMobile]);

  const itemsPerRow = Math.ceil(displayProducts.length / 3);
  const firstRow = displayProducts.slice(0, itemsPerRow);
  const secondRow = displayProducts.slice(itemsPerRow, itemsPerRow * 2);
  const thirdRow = displayProducts.slice(itemsPerRow * 2, displayProducts.length);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? 50 : 600]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? -50 : -600]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 15, 0]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 20, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? -100 : -700, isMobile ? 0 : 200]), springConfig);

  // --- STATE ---
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [adminEditing, setAdminEditing] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);

  // --- RELATED VIDEOS ---
  const relatedProducts = useMemo(() => {
    if (!products || !activeProduct) return [];
    return products
      .filter((p: Product) => (p._id || p.id) !== (activeProduct._id || activeProduct.id))
      .slice(0, 3); 
  }, [products, activeProduct]);

  const handleOpen = useCallback((product: Product, layoutId: string) => {
    setActiveProduct(product);
    setActiveLayoutId(layoutId); 
    setEditForm({ ...product });
    setIsEditing(false);
  }, []);

  const handleClose = useCallback(() => {
    setActiveProduct(null);
    setActiveLayoutId(null);
    setIsEditing(false);
  }, []);

  const handleCreateNewVideo = async () => {
      if(!createProduct) return;
      setIsSaving(true);
      try {
          const newVideo: Partial<Product> = {
              name: "New Video Content",
              description: "Enter video description here...",
              price: 0,
              category: "VIDEO", 
              buyUrl: "https://www.youtube.com/watch?v=placeholder", 
              imageUrl: "https://via.placeholder.com/500",
          };
          await createProduct(newVideo);
      } catch (e) {
          console.error(e);
          alert("Error creating video.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if(!activeProduct) return;
    const pid = activeProduct._id || activeProduct.id;
    if(!pid) return;

    setIsSaving(true);
    try {
      let payload = { ...editForm };
      const ytId = getYoutubeId(payload.buyUrl);
      if (ytId) {
          payload.imageUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      }
      // @ts-ignore
      delete payload._id; 
      // @ts-ignore
      delete payload.id;
      await updateProduct(pid, payload as Product);
      setActiveProduct((prev: Product | null) => prev ? { ...prev, ...payload } as Product : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!activeProduct) return;
    const pid = activeProduct._id || activeProduct.id;
    if(!pid) return;
    if(window.confirm("Delete this video permanently?")) {
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
    if (activeProduct) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }
    return () => { 
        document.body.style.overflow = "auto"; 
    }
  }, [activeProduct]);

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-black text-sky-500">
              <Loader2 className="animate-spin w-10 h-10" />
          </div>
      )
  }

  return (
    <div className="bg-black relative selection:bg-red-500/30 overflow-hidden w-full">
        
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      @keyframes text-shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: -200% 50%; }
      }

      .animate-shimmer {
        animation: shimmer 3s linear infinite;
      }

      /* GLOBAL SKY/INDIGO SHIMMER */
      .animate-text-shimmer {
        background: linear-gradient(
          110deg, 
          #ffffff 20%,   /* Sky 400 */
          #ffffff 48%,   /* White Peak */
          #ffffff 52%,   /* Indigo 400 */
          #ffffff 80%    /* Sky 400 */
        );
        background-size: 200% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        animation: text-shimmer 3s linear infinite;
      }

      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #171717; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #525252; }
      
      .backface-hidden { 
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden; 
      }
      .transform-gpu { 
          transform: translate3d(0,0,0);
          -webkit-transform: translate3d(0,0,0);
      }
      .safari-mask-fix {
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
          isolation: isolate;
      }
      .safari-fix-layer {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
      }
    `}</style>
        
    {/* --- ADMIN LOGIN MODAL --- */}
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[99999]">
        <div className="pointer-events-auto">
             <AdminLoginModal 
                open={isAdminLoginOpen} 
                onClose={() => setIsAdminLoginOpen(false)} 
            />
        </div>
    </div>

    {/* --- ADMIN CONTROLS (Floating) --- */}
    {isAdmin && (
        <div className="fixed bottom-8 right-8 z-[9990] flex flex-col gap-2">
            <ShimmerBorder borderRadius="rounded-full" borderWidth="inset-[1.5px]" speed={4} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ffffff 50%, #00000000 100%)">
                <button 
                    onClick={handleCreateNewVideo}
                    className="bg-neutral-900/90 text-white p-3 md:p-4 rounded-full transition-all hover:bg-neutral-800 flex items-center justify-center w-full h-full"
                    title="Add New Video Card"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                </button>
            </ShimmerBorder>
        </div>
    )}

    {/* --- VIDEO PLAYER MODAL --- */}
    <AnimatePresence>
        {activeProduct && activeLayoutId && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] grid place-items-center bg-black/95 md:backdrop-blur-xl p-0 md:p-4 will-change-opacity"
                onClick={handleClose}
            >
                <ShimmerBorder borderRadius="rounded-none md:rounded-3xl" borderWidth="inset-[2px]" speed={5}>
                    <motion.div
                        layoutId={activeLayoutId} 
                        className="relative w-full max-w-7xl bg-neutral-900 border border-transparent rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[100dvh] md:h-[85vh] md:max-h-[800px] safari-fix-layer"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        {/* FIXED: BACK BUTTON MOVED DOWN (top-24) to clear Navbar */}
                        <button
                            onClick={handleClose}
                            className="absolute top-24 md:top-4 left-4 z-50 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-neutral-800 transition-colors border border-white/10 group flex items-center justify-center shadow-lg"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        {/* FIXED: CLOSE BUTTON MOVED DOWN (top-24) to clear Navbar */}
                        <button
                            onClick={handleClose}
                            className="absolute top-24 md:top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-red-600 transition-colors border border-white/10 group shadow-lg"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>

                        {isAdmin && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="absolute top-24 md:top-4 right-16 z-50 p-2 bg-sky-600 rounded-full text-white hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(255, 255, 255,0.5)] flex gap-2 items-center px-4 font-bold text-xs uppercase"
                        >
                            <Edit2 size={14} /> Edit
                        </button>
                        )}

                        {/* LEFT: MEDIA SECTION */}
                        <div className="w-full md:w-3/4 bg-black flex flex-col relative group h-[35vh] sm:h-[45vh] md:h-full shrink-0">
                            {/* ... video player / editing preview ... */}
                            {!isEditing ? (
                                <div className="relative w-full h-full">
                                    {(() => {
                                        const videoId = getYoutubeId(activeProduct.buyUrl);
                                        if (videoId) {
                                            return (
                                                <iframe 
                                                    className="w-full h-full absolute inset-0"
                                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`} 
                                                    title={activeProduct.name}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowFullScreen 
                                                />
                                            );
                                        } else {
                                            return (
                                                <div className="w-full h-full grid place-items-center text-neutral-500">
                                                    <div className="text-center">
                                                        <Youtube size={48} className="mx-auto mb-2 opacity-50" />
                                                        <p>Invalid YouTube Link</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            ) : (
                                <div className="relative w-full h-full bg-neutral-950 flex flex-col items-center justify-center border-r border-neutral-800">
                                    <Youtube size={64} className="text-red-600 mb-4 opacity-50" />
                                    <p className="text-neutral-400 text-sm">Preview disabled while editing</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: CONTENT SIDEBAR */}
                        <div className="w-full md:w-1/4 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
                            {isEditing ? (
                            <div className="space-y-6 animate-in fade-in duration-300 pb-12" onClick={(e) => e.stopPropagation()}>
                                {/* EDIT FORM */}
                                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-4">
                                    <label className="text-[10px] uppercase text-sky-500 font-bold mb-2 flex items-center gap-2">Category</label>
                                    <select
                                    value={editForm.category || "VIDEO"}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full bg-neutral-900 p-3 rounded-lg text-sm outline-none border border-neutral-700 focus:border-sky-500 text-white cursor-pointer"
                                    >
                                        {categories.map((c: any) => (<option key={c._id || c.id} value={c.name}>{c.name}</option>))}
                                        {editForm.category && !categories.find((c: any) => c.name === editForm.category) && (<option value={editForm.category}>{editForm.category}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">YouTube URL</label><input value={editForm.buyUrl || ""} onChange={(e) => setEditForm({...editForm, buyUrl: e.target.value})} placeholder="Paste YouTube Link..." className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white font-mono" /></div>
                                <div><label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">Title</label><input value={editForm.name || ""} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white" /></div>
                                <div><label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">Description</label><textarea rows={8} value={editForm.description || ""} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white resize-none" /></div>
                            </div>
                            ) : (
                            // VIEW MODE
                            <div className="flex flex-col h-full pb-10">
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex gap-2 mb-4">
                                    <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold font-mono uppercase tracking-widest flex items-center gap-1">
                                    <Youtube size={12} className="fill-white" /> {activeProduct.category}
                                    </span>
                                </motion.div>
                                <motion.h3 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl md:text-2xl font-sans font-bold text-white mb-4 leading-tight animate-text-shimmer"
                                >
                                    {activeProduct.name}
                                </motion.h3>
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-neutral-400 text-xs md:text-sm leading-relaxed whitespace-pre-line"
                                >
                                    {activeProduct.description || "No description provided."}
                                </motion.div>

                                {/* --- FILLER CONTENT: UP NEXT --- */}
                                <div className="mt-8 pt-8 border-t border-neutral-800/50">
                                    <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <PlayCircle size={12} /> Up Next
                                    </h4>
                                    <div className="flex flex-col gap-3">
                                        {relatedProducts.length > 0 ? relatedProducts.map((rp: Product, i: number) => {
                                            const thumbId = getYoutubeId(rp.buyUrl);
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setActiveProduct(rp)}
                                                    className="flex gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer group/related transition-colors"
                                                >
                                                    <div className="relative w-24 h-14 bg-neutral-800 rounded overflow-hidden shrink-0">
                                                        {thumbId ? (
                                                            <Image 
                                                                src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`} 
                                                                fill 
                                                                className="object-cover opacity-60 group-hover/related:opacity-100 transition-opacity" 
                                                                alt={rp.name} 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                                                <Youtube size={16} className="text-neutral-600"/>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col justify-center min-w-0">
                                                        <h5 className="text-xs font-bold text-neutral-300 group-hover/related:text-white truncate transition-colors leading-tight mb-1">
                                                            {rp.name}
                                                        </h5>
                                                        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                                                            {rp.category || "Video"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        }) : (
                                            <div className="text-neutral-600 text-xs italic p-2">No other videos available.</div>
                                        )}
                                    </div>
                                </div>

                            </div>
                            )}
                            </div>

                            <div className="p-4 md:p-6 border-t border-neutral-800 bg-neutral-900 shrink-0">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        {/* SAVE BUTTON */}
                                        <ShimmerBorder borderRadius="rounded-lg" borderWidth="inset-px" speed={2} className="flex-1" colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ffffff 50%, #00000000 100%)">
                                            <button 
                                            onClick={handleSaveEdit} 
                                            disabled={isSaving}
                                            className="bg-neutral-900/90 text-white font-bold py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-50 w-full"
                                            >
                                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save</>}
                                            </button>
                                        </ShimmerBorder>

                                        {/* DELETE BUTTON */}
                                        <ShimmerBorder borderRadius="rounded-lg" borderWidth="inset-px" speed={1.5} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #ef4444 50%, #00000000 100%)">
                                            <button 
                                            onClick={handleDelete}
                                            disabled={isSaving}
                                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-3 transition-colors"
                                            >
                                            <Trash2 size={18} />
                                            </button>
                                        </ShimmerBorder>
                                        
                                        <button 
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditForm({ ...activeProduct }); }}
                                        className="text-neutral-500 hover:text-white text-xs px-2"
                                        >
                                        Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {/* SHIMMER BORDER on MAIN ACTION BUTTON */}
                                        <ShimmerBorder borderRadius="rounded-xl" borderWidth="inset-[1.5px]" speed={4} className="w-full">
                                            <motion.a
                                                href={activeProduct.buyUrl || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                className="w-full py-3 md:py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
                                            >
                                                Open on Whop <ExternalLink size={16} />
                                            </motion.a>
                                        </ShimmerBorder>

                                        <motion.button
                                            onClick={() => {
                                                if(activeProduct.buyUrl) {
                                                    navigator.clipboard.writeText(activeProduct.buyUrl);
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                }
                                            }}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="w-full py-2 bg-neutral-800 text-neutral-400 text-xs rounded-xl font-mono uppercase tracking-widest hover:bg-neutral-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {copied ? <Check size={12} className="text-white"/> : <Copy size={12}/>} 
                                            {copied ? "Link Copied" : "Copy Link"}
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </ShimmerBorder>
            </motion.div>
        )}
    </AnimatePresence>

    {/* --- HERO SCROLL SECTION --- */}
    <div
        ref={ref}
        className="h-[180vh] md:h-[240vh] pt-10 pb-0 overflow-hidden bg-black antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
        {/* HEADER SECTION */}
        <div className="max-w-7xl relative mx-auto py-12 md:py-32 px-4 w-full z-20 mb-10 md:mb-32">
             <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
                <SparklesCore
                    id="parallax-sparkles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={isMobile ? 10 : 50} 
                    isMobile={isMobile}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                />
            </div>
            
            <div className="relative z-20 flex flex-col items-start gap-4 pointer-events-none">
                 {!!hero?.badge && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] md:text-xs font-mono tracking-wider uppercase md:backdrop-blur-md"
                        >
                        <Zap size={10} className="fill-sky-400" /> {hero.badge}
                    </motion.div>
                 )}

                {/* ANIMATED TEXT SHIMMER FOR TITLE */}
                <h1 className="text-5xl md:text-8xl font-sans font-black leading-[0.9] tracking-tighter animate-text-shimmer">
                {hero?.title || "Welcome VIP"}
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-2xl text-base md:text-xl mt-4 md:mt-6 text-neutral-400 font-normal leading-relaxed"
                    >
                    {hero?.subtitle || "Premium video content for exclusive members."}
                </motion.p>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-30"
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
                        <div className="text-white font-bold flex items-center gap-1">2.5k+ Members <ShieldCheck size={10} className="text-sky-500" /></div>
                        <div className="text-neutral-500 flex items-center gap-1">
                            <Star size={10} className="fill-yellow-500 text-yellow-500" /> 4.9/5 Rating
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
        
     {/* PARALLAX GRID */}
    <motion.div
        style={{ 
            rotateX, 
            rotateZ, 
            translateY, 
            opacity,
            willChange // Hint to browser
        }}
        className="relative z-10 will-change-transform backface-hidden transform-gpu safari-fix-layer"
    >
        <div className={cn("flex flex-col", isMobile ? "gap-2 px-0" : "")}>
            {videoProducts.length > 0 ? (
                <>
                {/* ROW 1 */}
                <motion.div className={cn("flex flex-row-reverse space-x-reverse", isMobile ? "space-x-4 mb-2" : "space-x-20 mb-20")}>
                {firstRow.map((product, idx) => (
                    <VideoCard 
                        key={`row1-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row1-${idx}`} 
                        translate={translateX} 
                        setActive={handleOpen} 
                        isMobile={isMobile}
                    />
                ))}
                </motion.div>

                {/* ROW 2 */}
                <motion.div className={cn("flex flex-row", isMobile ? "space-x-4 mb-2" : "space-x-20 mb-20")}>
                {secondRow.map((product, idx) => (
                    <VideoCard 
                        key={`row2-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row2-${idx}`} 
                        translate={translateXReverse} 
                        setActive={handleOpen} 
                        isMobile={isMobile}
                    />
                ))}
                </motion.div>

                {/* ROW 3 */}
                <motion.div className={cn("flex flex-row-reverse space-x-reverse", isMobile ? "space-x-4" : "space-x-20")}>
                {thirdRow.map((product, idx) => (
                    <VideoCard 
                        key={`row3-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row3-${idx}`} 
                        translate={translateX} 
                        setActive={handleOpen} 
                        isMobile={isMobile}
                    />
                ))}
                </motion.div>
                </>
            ) : (
                <div className="text-center py-20 opacity-50">
                    <p className="text-white text-xl">No Video Content Found.</p>
                </div>
            )}
        </div>
    </motion.div>
    </div>

    {/* --- ADMIN PANEL --- */}
    {isAdmin && (
      <div className="max-w-7xl mx-auto px-4 mt-10 relative z-20 mb-20">
        <AdminPanel
          editing={adminEditing}
          clearEditing={() => setAdminEditing(null)}
        />
      </div>
    )}

    {/* --- FOOTER / ADMIN ACCESS --- */}
    <div className="relative z-30 bg-black text-neutral-500 py-12 md:py-16 px-8 text-center border-t border-neutral-900 mt-1">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mb-12 text-xs uppercase tracking-widest text-neutral-400">
            <div className="flex flex-col items-center gap-3">
                <Youtube className="text-red-500 mb-1" />
                <span>Exclusive Content</span>
            </div>
            <div className="flex flex-col items-center gap-3">
                <BarChart3 className="text-sky-500 mb-1" />
                <span>Market Analysis</span>
            </div>
            <div className="flex flex-col items-center gap-3">
                <ShieldCheck className="text-sky-500 mb-1" />
                <span>Verified Data</span>
            </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] opacity-50">&copy; {new Date().getFullYear()} BULLMONEY VIP. All rights reserved.</p>
            
            {!isAdmin && (
                <button 
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="flex items-center gap-2 text-[10px] opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest hover:text-sky-500 py-4"
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