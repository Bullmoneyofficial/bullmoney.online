"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  Lock, Zap, ShieldCheck, Users, Star, BarChart3,
  Youtube, PlayCircle, ExternalLink, Plus, AlertCircle, Copy, Check
} from "lucide-react";

import { useShop, type Product } from "@/app/VIP/ShopContext";
import AdminLoginModal from "@/app/VIP/AdminLoginModal";
import AdminPanel from "./AdminPanel";
import Faq from "@/app/shop/Faq";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hook to detect mobile screen for layout adjustments
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

// Robust YouTube ID Extractor
const getYoutubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- SPARKLES COMPONENT ---
const SparklesCore = React.memo((props: { id?: string; className?: string; background?: string; minSize?: number; maxSize?: number; speed?: number; particleColor?: string; particleDensity?: number; }) => {
  const { id = "tsparticles", className, background = "transparent", minSize = 0.6, maxSize = 1.4, speed = 1, particleColor = "#ffffff", particleDensity = 100 } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => { await loadSlim(engine); }).then(() => { setInit(true); });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles id={id} className={cn("h-full w-full")} options={{ background: { color: { value: background } }, fullScreen: { enable: false, zIndex: 1 }, fpsLimit: 60, interactivity: { events: { onClick: { enable: true, mode: "push" }, onHover: { enable: false, mode: "repulse" }, resize: { enable: true } }, modes: { push: { quantity: 4 }, repulse: { distance: 200, duration: 0.4 } } }, particles: { bounce: { horizontal: { value: 1 }, vertical: { value: 1 } }, color: { value: particleColor }, move: { enable: true, speed: speed, direction: "none", random: false, straight: false, outModes: { default: "out" } }, number: { density: { enable: true, width: 1920, height: 1080 }, value: particleDensity }, opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed, sync: false } }, shape: { type: "circle" }, size: { value: { min: minSize, max: maxSize } } }, detectRetina: true } as any} />
      )}
    </div>
  );
});
SparklesCore.displayName = "SparklesCore";

// --- VIDEO CARD COMPONENT (UPDATED FOR MOBILE AUTOPLAY) ---
const VideoCard = React.memo(({
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
  
  const videoId = getYoutubeId(product.buyUrl);

  return (
    <motion.div
      style={{ x: translate }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActive(product, uniqueLayoutId)}
      className="group/product h-[16rem] w-[20rem] md:h-[22rem] md:w-[32rem] relative flex-shrink-0 cursor-pointer"
    >
      <div className="block h-full w-full group-hover/product:shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all duration-500 rounded-[24px]">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-[24px] overflow-hidden bg-neutral-900 border border-neutral-800 group-hover/product:border-red-600/50 transition-colors"
        >
            {/* --- LIVE VIDEO LAYER --- */}
            {/* pointer-events-none is CRITICAL: it allows the user to click "through" the video to open the modal */}
            {videoId ? (
                <div className="absolute inset-0 w-full h-full bg-black pointer-events-none">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                        className="w-[300%] h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] object-cover pointer-events-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={product.name}
                        // Loading lazy helps mobile performance slightly
                        loading="lazy"
                    />
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
            
            {/* Only show play button on hover if video is playing, to keep view clean */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full opacity-0 group-hover/product:opacity-100 transition-opacity duration-300 scale-75 group-hover/product:scale-100 border border-white/20">
                    <PlayCircle className="text-white w-8 h-8 fill-red-600/20" />
                 </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover/product:translate-y-0 transition-transform duration-500 pointer-events-none">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 border border-white/10">
                    <Youtube size={12} className="text-red-500" />
                    {product.category || "VIDEO"}
                    </span>
                </div>
                <h2 className="text-white font-sans font-bold text-lg md:text-xl leading-tight truncate w-full shadow-black drop-shadow-lg">
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
  // FIX: Cast useShop() to 'any' to avoid type errors with missing context methods
  const { state, updateProduct, deleteProduct, createProduct } = useShop() as any; 
  const { products = [], hero, isAdmin, loading, categories = [] } = state || {};
  const isMobile = useIsMobile();

  // --- FILTERING LOGIC ---
  const videoProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Product) => p.category === "VIDEO");
  }, [products]);

  // --- PARALLAX DATA PREP ---
  const displayProducts = useMemo(() => {
    if (videoProducts.length === 0) return [];
    // Ensure we have enough items for the grid by duplicating if necessary
    let filledProducts = [...videoProducts];
    while (filledProducts.length < 15) {
      filledProducts = [...filledProducts, ...videoProducts];
    }
    return filledProducts.slice(0, 15);
  }, [videoProducts]);

  const firstRow = displayProducts.slice(0, 5);
  const secondRow = displayProducts.slice(5, 10);
  const thirdRow = displayProducts.slice(10, 15);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  
  // Mobile adjustments: Reduce travel distance and disable 3D rotation
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? 200 : 600]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? -200 : -600]), springConfig);
  
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 15, 0]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 20, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 200]), springConfig);

  // --- STATE ---
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [adminEditing, setAdminEditing] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);

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
      
      // Remove ID fields safely before sending
      // @ts-ignore
      delete payload._id; 
      // @ts-ignore
      delete payload.id;

      await updateProduct(pid, payload as Product);
      setActiveProduct(prev => prev ? { ...prev, ...payload } as Product : null);
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
        document.body.style.touchAction = "none";
    } else {
        document.body.style.overflow = "auto";
        document.body.style.touchAction = "auto";
    }
    return () => { 
        document.body.style.overflow = "auto"; 
        document.body.style.touchAction = "auto";
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
    <div className="bg-black relative selection:bg-red-500/30">
        
    {/* --- INJECTED STYLES FOR SHIMMER ANIMATION --- */}
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .animate-shimmer {
        animation: shimmer 3s linear infinite;
      }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #171717; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #404040; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #525252; }
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

    {/* --- ADMIN CONTROLS --- */}
    {isAdmin && (
        <div className="fixed bottom-8 right-8 z-[9990] flex flex-col gap-2">
            <button 
                onClick={handleCreateNewVideo}
                className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-900/50 transition-all hover:scale-110 flex items-center justify-center"
                title="Add New Video Card"
            >
                {isSaving ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
            </button>
        </div>
    )}

    {/* --- VIDEO PLAYER MODAL --- */}
    <AnimatePresence>
        {activeProduct && activeLayoutId && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] grid place-items-center bg-black/95 backdrop-blur-xl p-0 md:p-4"
                onClick={handleClose}
            >
                <motion.div
                    layoutId={activeLayoutId} 
                    className="relative w-full max-w-7xl bg-neutral-900 border border-neutral-800 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[100dvh] md:h-[85vh] md:max-h-[800px]"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-red-600 transition-colors border border-white/10 group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    {isAdmin && !isEditing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="absolute top-4 right-16 z-50 p-2 bg-sky-600 rounded-full text-white hover:bg-sky-500 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.5)] flex gap-2 items-center px-4 font-bold text-xs uppercase"
                      >
                          <Edit2 size={14} /> Edit
                      </button>
                    )}

                    {/* LEFT: MEDIA SECTION */}
                    <div className="w-full md:w-3/4 bg-black flex flex-col relative group h-[40vh] md:h-full shrink-0">
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
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        {isEditing ? (
                          <div className="space-y-6 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                             
                             {/* --- CATEGORY DROPDOWN --- */}
                             <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-4">
                                <label className="text-[10px] uppercase text-sky-500 font-bold mb-2 flex items-center gap-2">
                                  Category <span className="text-neutral-500 font-normal normal-case">(Select from existing)</span>
                                </label>
                                <select
                                  value={editForm.category || "VIDEO"}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                  className="w-full bg-neutral-900 p-3 rounded-lg text-sm outline-none border border-neutral-700 focus:border-sky-500 text-white cursor-pointer"
                                >
                                    {categories.map((c: any) => (
                                        <option key={c._id || c.id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                    {editForm.category && !categories.find((c: any) => c.name === editForm.category) && (
                                        <option value={editForm.category}>{editForm.category}</option>
                                    )}
                                </select>
                                {editForm.category !== "VIDEO" && (
                                  <div className="flex gap-2 items-start mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                                     <AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                                     <p className="text-[10px] text-yellow-200 leading-tight">
                                        Warning: Changing category to something other than "VIDEO" will remove this item from the Hero Grid.
                                     </p>
                                  </div>
                                )}
                             </div>

                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">YouTube URL</label>
                                <input 
                                  value={editForm.buyUrl || ""} 
                                  onChange={(e) => setEditForm({...editForm, buyUrl: e.target.value})}
                                  placeholder="Paste YouTube Link..."
                                  className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white font-mono"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">Title</label>
                                <input 
                                  value={editForm.name || ""} 
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white"
                                />
                             </div>
                             <div>
                                <label className="text-[10px] uppercase text-neutral-500 font-bold mb-1 block">Description</label>
                                <textarea 
                                  rows={8}
                                  value={editForm.description || ""} 
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="w-full bg-neutral-950 p-3 rounded-lg text-sm outline-none border border-neutral-800 focus:border-sky-500 text-white resize-none"
                                />
                             </div>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex gap-2 mb-4"
                            >
                                <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold font-mono uppercase tracking-widest flex items-center gap-1">
                                   <Youtube size={12} className="fill-white" /> {activeProduct.category}
                                </span>
                            </motion.div>
                            <motion.h3 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-sans font-bold text-white mb-6 leading-tight"
                            >
                                {activeProduct.name}
                            </motion.h3>
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line"
                            >
                                {activeProduct.description || "No description provided."}
                            </motion.div>
                          </div>
                        )}
                        </div>

                        <div className="p-6 border-t border-neutral-800 bg-neutral-900 shrink-0">
                             {isEditing ? (
                                <div className="flex gap-2">
                                    <button 
                                    onClick={handleSaveEdit} 
                                    disabled={isSaving}
                                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save</>}
                                    </button>
                                    <button 
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                    className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-3 rounded-lg transition-colors"
                                    title="Delete Video"
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
                             ) : (
                                <div className="flex flex-col gap-3">
                                    <motion.a
                                        href={activeProduct.buyUrl || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        Open on YouTube <ExternalLink size={16} />
                                    </motion.a>
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
                                        {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>} 
                                        {copied ? "Link Copied" : "Copy Link"}
                                    </motion.button>
                                </div>
                             )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>

    {/* --- HERO SCROLL SECTION --- */}
    <div
        ref={ref}
        className="h-[240vh] pt-10 pb-0 overflow-hidden bg-black antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
        {/* HEADER SECTION */}
        <div className="max-w-7xl relative mx-auto py-20 md:py-32 px-4 w-full z-20 mb-10 md:mb-32">
             <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
                <SparklesCore
                    id="parallax-sparkles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={isMobile ? 30 : 50}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                />
            </div>
            
            <div className="relative z-20 flex flex-col items-start gap-4 pointer-events-none">
                 {!!hero?.badge && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-mono tracking-wider uppercase backdrop-blur-md"
                        >
                        <Zap size={12} className="fill-sky-400" /> {hero.badge}
                    </motion.div>
                 )}

                {/* --- SHIMMER TITLE UPDATE --- */}
                <h1 className="text-5xl md:text-8xl font-sans font-black text-white leading-[0.9] tracking-tighter">
                {(hero?.title || "Welcome VIP").split(" ").map((word, i) => (
                    <span 
                        key={i} 
                        className="inline-block mr-3 text-transparent bg-clip-text bg-[linear-gradient(110deg,#FFFFFF,45%,#38BDF8,55%,#FFFFFF)] bg-[length:250%_100%] animate-shimmer"
                    >
                      {word}
                    </span>
                ))}
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-2xl text-lg md:text-xl mt-6 text-neutral-400 font-normal leading-relaxed"
                    >
                    {hero?.subtitle || "Premium video content for exclusive members."}
                </motion.p>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row gap-6 items-center relative z-30"
            >
                <Faq />
                <div className="flex items-center gap-4 pl-4 border-l border-neutral-800">
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
            opacity 
        }}
        className="relative z-10"
    >
        <div className={cn("flex flex-col", isMobile ? "gap-6 px-4" : "")}>
            {videoProducts.length > 0 ? (
                <>
                {/* ROW 1 */}
                <motion.div className={cn("flex flex-row-reverse space-x-reverse", isMobile ? "space-x-6 mb-2" : "space-x-20 mb-20")}>
                {firstRow.map((product, idx) => (
                    <VideoCard 
                        key={`row1-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row1-${idx}`} 
                        translate={translateX} 
                        setActive={handleOpen} 
                    />
                ))}
                </motion.div>

                {/* ROW 2 */}
                <motion.div className={cn("flex flex-row", isMobile ? "space-x-6 mb-2" : "space-x-20 mb-20")}>
                {secondRow.map((product, idx) => (
                    <VideoCard 
                        key={`row2-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row2-${idx}`} 
                        translate={translateXReverse} 
                        setActive={handleOpen} 
                    />
                ))}
                </motion.div>

                {/* ROW 3 */}
                <motion.div className={cn("flex flex-row-reverse space-x-reverse", isMobile ? "space-x-6" : "space-x-20")}>
                {thirdRow.map((product, idx) => (
                    <VideoCard 
                        key={`row3-${product._id || product.id}-${idx}`}
                        product={product} 
                        uniqueLayoutId={`video-${product._id || product.id}-row3-${idx}`} 
                        translate={translateX} 
                        setActive={handleOpen} 
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
    {/* Added mt-20 to ensure footer is pushed down correctly */}
    <div className="relative z-30 bg-black text-neutral-500 py-16 px-8 text-center border-t border-neutral-900 mt-1">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-xs uppercase tracking-widest text-neutral-400">
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