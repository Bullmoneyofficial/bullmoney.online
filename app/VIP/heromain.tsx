"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Loader2, Edit2, Save, X, Trash2,
  Lock, Zap, ShieldCheck, Users, Star, BarChart3,
  Youtube, PlayCircle, ExternalLink, Plus, Copy, Check,
  ChevronLeft, HelpCircle, Terminal, Code2, Binary
} from "lucide-react";

import { useShop, type Product } from "@/app/VIP/ShopContext";
import AdminLoginModal from "@/app/VIP/AdminLoginModal";
import AdminPanel from "./AdminPanel";
import Faq from "@/app/shop/Faq";
import LogoImage from "@/public/bullmoney-logo.png"; 
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
        const checkMobile = () => {
             setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
};

const getYoutubeId = (url: string | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";

// Simple Typewriter helper for the overlay
const Typewriter = ({ text, speed }: { text: string, speed: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
        setDisplayed(text.substring(0, i));
        i++;
        if (i > text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <span>{displayed}</span>;
};

// --- SYSTEM OVERRIDE OVERLAY (FULL SCREEN EASTER EGG) ---
const SystemOverrideOverlay = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequence of animations
    const t1 = setTimeout(() => setStep(1), 800); // Decrypting
    const t2 = setTimeout(() => setStep(2), 2000); // Access Granted
    const t3 = setTimeout(() => {
        setStep(3); // Exit
        setTimeout(onClose, 800);
    }, 3500);

    return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
    };
  }, [onClose]);

  return (
    <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.5, ease: "circInOut" }}
        className="fixed inset-0 z-[100000] bg-black flex flex-col items-center justify-center font-mono text-blue-500 overflow-hidden"
    >
        {/* Matrix Rain Background (Simplified) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
             {Array.from({ length: 20 }).map((_, i) => (
                 <motion.div
                    key={i}
                    initial={{ y: -100, x: Math.random() * 100 + "%" }}
                    animate={{ y: "120vh" }}
                    transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, ease: "linear", delay: Math.random() }}
                    className="absolute text-xs"
                 >
                    {Math.random() > 0.5 ? "101010" : "010101"}
                 </motion.div>
             ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
            
            {/* STAGE 0: LOCK ICON */}
            {step === 0 && (
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="p-6 rounded-full border-2 border-blue-500/50 bg-blue-500/10"
                >
                    <Lock size={48} className="animate-pulse" />
                </motion.div>
            )}

            {/* STAGE 1: DECRYPTING */}
            {step === 1 && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="flex items-center gap-2 text-2xl font-bold mb-2">
                        <Terminal size={24} /> 
                        <Typewriter text="BYPASSING SECURITY..." speed={50} />
                    </div>
                    <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden mt-4">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: "100%" }} 
                            transition={{ duration: 1 }} 
                            className="h-full bg-blue-500" 
                        />
                    </div>
                </motion.div>
            )}

            {/* STAGE 2: ACCESS GRANTED */}
            {step >= 2 && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1.2, opacity: 1 }}
                    className="text-center"
                >
                    <div className="relative w-48 h-16 mx-auto mb-6">
                        <Image src={LogoImage} alt="Bull Money" fill className="object-contain" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                        System Override
                    </h2>
                    <div className="inline-block px-4 py-1 bg-blue-600 text-black font-bold text-sm rounded">
                        ACCESS GRANTED
                    </div>
                </motion.div>
            )}
        </div>
    </motion.div>
  );
};


// --- MATRIX DECODER TOOLTIP COMPONENT ---
const MatrixLogoDecoder = ({ trigger }: { trigger: boolean }) => {
  const [decoded, setDecoded] = useState(false);
  const [text, setText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

  useEffect(() => {
    if (trigger) {
      setDecoded(false);
      let iterations = 0;
      const interval = setInterval(() => {
        setText(Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join(""));
        iterations++;
        if (iterations > 10) { 
          clearInterval(interval);
          setDecoded(true);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [trigger]);

  return (
    <div className="relative w-[100px] h-[30px] flex items-center justify-center overflow-hidden">
      {!decoded ? (
        <span className="font-mono text-xs text-blue-500 font-bold animate-pulse tracking-widest">
          {text}
        </span>
      ) : (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            className="relative w-full h-full"
        >
            <Image src={LogoImage} alt="Bull Money Logo" fill className="object-contain" />
            <motion.div 
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
                className="absolute top-0 bottom-0 w-[20px] bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 z-10"
            />
        </motion.div>
      )}
    </div>
  );
};

// --- HELPER TIP COMPONENT ---
const HelperTip = ({ 
    text, 
    children, 
    position = "top", 
    delay = 0,
    animateClick = false 
}: { 
    text?: string, 
    children?: React.ReactNode, 
    position?: "top" | "bottom",
    delay?: number,
    animateClick?: boolean 
}) => {
  const isTop = position === "top";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.8 }}
      // Apply the bounce animation if animateClick is true
      animate={animateClick 
        ? { opacity: 1, y: isTop ? 5 : -5, scale: 1.1 } 
        : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: animateClick ? 10 : 20, 
        delay 
      }}
      className={cn(
          "absolute left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center pointer-events-none min-w-max",
          isTop ? "bottom-full mb-5" : "top-full mt-5" 
      )}
    >
      {/* Pointer (Triangle) */}
      <div 
        className={cn(
            "w-2 h-2 bg-neutral-900 rotate-45 relative z-10",
            isTop ? "-translate-y-[4px] border-b border-r border-white/10" : "translate-y-[4px] border-t border-l border-white/10"
        )}
      />

      {/* Tip Container (The bubble) */}
      <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg">
          <motion.div 
              className="absolute inset-[-100%]"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ background: SHIMMER_GRADIENT }}
          />
          <div className="relative z-10 px-3 py-1 bg-neutral-900 rounded-full flex items-center justify-center border border-white/10 min-h-[30px] min-w-[80px]">
              {text ? (
                <span className="text-white text-[10px] font-bold whitespace-nowrap">
                    {text}
                </span>
              ) : children}
          </div>
      </div>
    </motion.div>
  );
};

// --- WRAPPER FOR HOVER/AUTO TIPS ---
const TipWrapper = ({ 
  children, 
  isActive, 
  tipText,
  tipChildren,
  onClick,
  className,
  position = "top"
}: { 
  children: React.ReactNode, 
  isActive: boolean, 
  tipText?: string,
  tipChildren?: React.ReactNode,
  onClick?: (e: React.MouseEvent) => void, // Allow onClick to be passed
  className?: string,
  position?: "top" | "bottom"
}) => {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Custom click handler to trigger the helper bounce animation
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
        // 1. Trigger bounce animation
        setClicked(true);
        setTimeout(() => setClicked(false), 500); // Bounce duration

        // 2. Execute original onClick function after a slight delay
        setTimeout(() => onClick(e), 100); 
    } else {
        // If no custom onClick, let the click pass through to children (like Link)
    }
  };

  return (
    <div 
      className={cn("relative flex flex-col items-center group cursor-pointer", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Use handleClick for the custom animation, if onClick is provided
      {...(onClick && { onClick: handleClick })}
      // Otherwise, rely on children's native click events (e.g., Link)
    >
        {children}
        <AnimatePresence>
            {(isActive || hovered) && (
                <HelperTip 
                    text={tipText} 
                    position={position}
                    // Apply bounce animation if this wrapper has an onClick handler and was just clicked
                    animateClick={clicked && !!onClick} 
                >
                    {tipChildren}
                </HelperTip>
            )}
        </AnimatePresence>
    </div>
  );
};

// --- SHIMMER BORDER COMPONENT ---
const ShimmerBorder = ({ 
  children, 
  className, 
  rounded = "rounded-xl",
  background = "bg-neutral-900"
}: { 
  children: React.ReactNode, 
  className?: string,
  rounded?: string,
  background?: string
}) => {
  return (
    <div className={cn("relative p-[1px] overflow-hidden group/shimmer", rounded, className)}>
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,45%,#3b82f6,55%,transparent)] bg-[length:250%_100%] animate-shimmer opacity-100" />
      <div className={cn("relative h-full w-full overflow-hidden", background, rounded)}>
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

  if (!init) return null;

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000 pointer-events-none", init && "opacity-100", className)}>
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
                    number: { density: { enable: true, width: 1920, height: 1080 }, value: isMobile ? 15 : particleDensity }, 
                    opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed, sync: false } }, 
                    shape: { type: "circle" }, 
                    size: { value: { min: minSize, max: maxSize } } 
                }, 
                detectRetina: !isMobile 
            } as any} 
        />
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
  const posterSrc = product.imageUrl || LogoImage;
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "200px 0px 200px 0px", once: false });
  const [showTip, setShowTip] = useState(false);
  
  const willChange = useWillChange();
  const shouldLoadPreview = !isMobile && isInView;

  useEffect(() => {
    if (isInView) {
        const t = setTimeout(() => {
            setShowTip(true);
            const t2 = setTimeout(() => setShowTip(false), 3000);
            return () => clearTimeout(t2);
        }, 500);
        return () => clearTimeout(t);
    } else {
        setShowTip(false);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      style={{ x: translate, willChange }}
      whileHover={isMobile ? undefined : { y: -10 }} 
      whileTap={{ scale: 0.98 }}
      onClick={() => setActive(product, uniqueLayoutId)}
      className="group/product h-[14rem] w-[18rem] md:h-[22rem] md:w-[32rem] relative flex-shrink-0 cursor-pointer backface-hidden transform-gpu"
    >
      <div className="relative block h-full w-full md:group-hover/product:shadow-[0_0_40px_rgba(59,130,246,0.2)] transition-all duration-500 rounded-[20px] md:rounded-[24px] safari-fix-layer">
        <AnimatePresence>
            {showTip && (
                <HelperTip text="Check me out" position="top" />
            )}
        </AnimatePresence>

        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-[20px] md:rounded-[24px] overflow-hidden bg-neutral-900 border border-blue-900/30 md:group-hover/product:border-blue-500/50 transition-colors safari-mask-fix"
        >
            {videoId ? (
                <div className="absolute inset-0 w-full h-full bg-black pointer-events-none">
                    <Image
                        src={posterSrc}
                        fill
                        sizes="(max-width: 768px) 320px, 640px"
                        className="object-cover opacity-70"
                        alt={product.name}
                        priority={false}
                    />
                    {shouldLoadPreview && (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&vq=hd1080`}
                            className="w-[300%] h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] object-cover pointer-events-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={product.name}
                            loading="lazy"
                        />
                    )}
                </div>
            ) : (
                <Image
                    src={posterSrc}
                    fill
                    sizes="(max-width: 768px) 320px, 640px"
                    className="object-cover opacity-70 group-hover/product:opacity-100 transition-opacity duration-500"
                    alt={product.name}
                    priority={false}
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 pointer-events-none"></div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-blue-500/10 backdrop-blur-sm p-3 md:p-4 rounded-full opacity-100 md:opacity-0 md:group-hover/product:opacity-100 transition-opacity duration-300 scale-100 md:scale-75 md:group-hover/product:scale-100 border border-blue-500/30">
                    <PlayCircle className="text-white w-6 h-6 md:w-8 md:h-8 fill-blue-600/20" />
                 </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 translate-y-0 md:translate-y-2 md:group-hover/product:translate-y-0 transition-transform duration-500 pointer-events-none">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 md:py-1 rounded bg-blue-950/80 md:bg-black/60 text-blue-200 text-[8px] md:text-[10px] font-bold uppercase tracking-wider md:backdrop-blur-md flex items-center gap-1 border border-blue-500/20">
                    <Youtube size={10} className="text-blue-500" />
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

  const [activeFooterIndex, setActiveFooterIndex] = useState(0);
  const TOTAL_FOOTER_ITEMS = 4;

  const [logoTrigger, setLogoTrigger] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false); // State for full-screen overlay

  useEffect(() => {
    // Initial trigger when component mounts to show decode effect
    setLogoTrigger(true);
    
    // Cycle footer helpers
    const interval = setInterval(() => {
        setActiveFooterIndex(prev => (prev + 1) % TOTAL_FOOTER_ITEMS);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fallbackVideo: Product = useMemo(() => ({
    id: "fallback-video",
    name: "BullMoney Vault Trailer",
    description: "Preview while your uploads sync. Replace with your own video to remove this placeholder.",
    price: 0,
    category: "VIDEO",
    imageUrl: "/bullmoney-logo.png",
    buyUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    visible: true
  }), []);

  // Handle Logo Click (Triggers animation and full screen takeover)
  const handleLogoClick = (e: React.MouseEvent) => {
    // 1. Re-trigger the decoder animation in the tooltip
    setLogoTrigger(false);
    setTimeout(() => setLogoTrigger(true), 10);
    
    // 2. Trigger the full-screen Easter Egg overlay
    setShowEasterEgg(true); 
  };

  const videoProducts = useMemo(() => {
    if (!products || products.length === 0) return [fallbackVideo];
    const vids = products.filter((p: Product) => p.category === "VIDEO");
    return vids.length ? vids : [fallbackVideo];
  }, [fallbackVideo, products]);

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
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? 20 : 600]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? -20 : -600]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 15, 0]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 20, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? -50 : -700, isMobile ? 0 : 200]), springConfig);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [adminEditing, setAdminEditing] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);

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
    <div className="bg-black relative selection:bg-blue-500/30 overflow-hidden w-full">
        
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 0% 0%; }
        100% { background-position: -250% 0%; }
      }
      .animate-shimmer {
        animation: shimmer 3s linear infinite;
      }
      @keyframes text-shimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: -200% 50%; }
      }
      .animate-text-shimmer {
        background: linear-gradient(110deg, #64748b 20%, #ffffff 48%, #a5b4fc 52%, #64748b 80%);
        background-size: 200% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        animation: text-shimmer 3s linear infinite;
        display: inline-block;
      }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #171717; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #60a5fa; }
      .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
      .transform-gpu { transform: translate3d(0,0,0); -webkit-transform: translate3d(0,0,0); }
      .safari-mask-fix { -webkit-mask-image: -webkit-radial-gradient(white, black); mask-image: radial-gradient(white, black); isolation: isolate; }
      .safari-fix-layer { transform: translateZ(0); -webkit-transform: translateZ(0); }
    `}</style>
        
    {/* --- FULL SCREEN EASTER EGG OVERLAY --- */}
    <AnimatePresence>
        {showEasterEgg && (
            <SystemOverrideOverlay onClose={() => setShowEasterEgg(false)} />
        )}
    </AnimatePresence>
        
    {/* --- ADMIN LOGIN MODAL --- */}
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[99999]">
        <div className="pointer-events-auto">
             <AdminLoginModal 
                open={isAdminLoginOpen} 
                onClose={() => setIsAdminLoginOpen(false)} 
            />
        </div>
    </div>

    {/* --- ADMIN CONTROLS (FLOATING) --- */}
    {isAdmin && (
        <div className="fixed bottom-8 right-8 z-[9990] flex flex-col gap-2">
            <ShimmerBorder rounded="rounded-full">
                <button 
                    onClick={handleCreateNewVideo}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white p-3 md:p-4 rounded-full flex items-center justify-center transition-colors"
                    title="Add New Video Card"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Plus size={20} className="text-blue-500" />}
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
                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-7xl h-[100dvh] md:h-[85vh] md:max-h-[800px]">
                <ShimmerBorder rounded="rounded-none md:rounded-3xl" className="h-full w-full">
                <motion.div
                    layoutId={activeLayoutId} 
                    className="relative w-full h-full bg-neutral-900 flex flex-col md:flex-row safari-fix-layer"
                >
                    <div className="absolute top-24 md:top-4 left-4 z-50">
                        <ShimmerBorder rounded="rounded-full">
                            <button onClick={handleClose} className="p-2 bg-black/80 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center group"><ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform text-blue-400" /></button>
                        </ShimmerBorder>
                    </div>
                    <div className="absolute top-24 md:top-4 right-4 z-50">
                        <ShimmerBorder rounded="rounded-full">
                            <button onClick={handleClose} className="p-2 bg-black/80 text-white hover:bg-neutral-800 transition-colors group"><X size={20} className="group-hover:rotate-90 transition-transform text-blue-400" /></button>
                        </ShimmerBorder>
                    </div>
                    
                    <div className="w-full md:w-3/4 bg-black flex flex-col relative group h-[35vh] sm:h-[45vh] md:h-full shrink-0 border-r border-blue-900/20">
                         <div className="relative w-full h-full">
                            {getYoutubeId(activeProduct.buyUrl) ? (
                                <iframe className="w-full h-full absolute inset-0" src={`https://www.youtube.com/embed/${getYoutubeId(activeProduct.buyUrl)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} title={activeProduct.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            ) : (
                                <div className="w-full h-full grid place-items-center text-neutral-500"><Youtube size={48} className="mx-auto mb-2 opacity-50 text-blue-500" /><p>Invalid YouTube Link</p></div>
                            )}
                         </div>
                    </div>
                    <div className="w-full md:w-1/4 flex flex-col bg-neutral-900 h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
                           <h3 className="text-xl md:text-2xl font-sans font-bold text-white mb-4 leading-tight">{activeProduct.name}</h3>
                           <div className="text-neutral-400 text-xs md:text-sm leading-relaxed whitespace-pre-line">{activeProduct.description || "No description provided."}</div>
                        </div>
                         <div className="p-4 md:p-6 border-t border-blue-900/20 bg-neutral-900 shrink-0">
                                <ShimmerBorder rounded="rounded-xl">
                                    <motion.a href={activeProduct.buyUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full py-3 md:py-4 bg-neutral-800/50 text-white font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-xs md:text-sm">Open on YouTube <ExternalLink size={16} className="text-blue-500" /></motion.a>
                                </ShimmerBorder>
                         </div>
                    </div>
                </motion.div>
                </ShimmerBorder>
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    {/* --- HERO SCROLL SECTION --- */}
    <div
        ref={ref}
        className="min-h-screen h-auto md:h-[240vh] pt-10 pb-20 md:pb-0 overflow-visible md:overflow-hidden bg-black antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
        {/* HEADER SECTION */}
        <div className="max-w-7xl relative mx-auto py-12 md:py-32 px-4 w-full z-20 mb-10 md:mb-32">
             <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60">
                <SparklesCore
                    id="parallax-sparkles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={isMobile ? 15 : 50} 
                    isMobile={isMobile}
                    className="w-full h-full"
                    particleColor="#3b82f6"
                />
            </div>
            
            <div className="relative z-20 flex flex-col items-start gap-4 pointer-events-none">
                 {!!hero?.badge && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-mono tracking-wider uppercase md:backdrop-blur-md"
                        >
                        <Zap size={10} className="fill-blue-400" /> {hero.badge}
                    </motion.div>
                 )}

                {/* MAIN TITLE WITH LOGO HELPER - EASTER EGG */}
                <TipWrapper 
                    isActive={true} 
                    position="top" 
                    className="pointer-events-auto"
                    onClick={handleLogoClick}
                    tipText="TAP/CLICK TITLE FOR ENCRYPTION"
                >
                    <h1 className="text-5xl md:text-8xl font-sans font-black text-white leading-[0.9] tracking-tighter cursor-default">
                    {(hero?.title || "Welcome VIP").split(" ").map((word: string, i: number) => (
                        <span 
                            key={i} 
                            className="inline-block mr-3 text-transparent bg-clip-text bg-[linear-gradient(110deg,#FFFFFF,45%,#3b82f6,55%,#FFFFFF)] bg-[length:250%_100%] animate-shimmer"
                        >
                        {word}
                        </span>
                    ))}
                    </h1>
                </TipWrapper>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                {/* FAQ HELPER */}
                <TipWrapper 
                    isActive={false} // Only on hover
                    tipText="Common Questions" 
                    position="top"
                    className="pointer-events-auto"
                >
                    <ShimmerBorder rounded="rounded-xl">
                        <div className="bg-neutral-900/50 p-1 rounded-xl">
                            <Faq />
                        </div>
                    </ShimmerBorder>
                </TipWrapper>

                <div className="flex items-center gap-4 pl-0 sm:pl-4 border-l-0 sm:border-l border-neutral-800">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center text-[10px] text-neutral-500">
                            <Users size={12} />
                            </div>
                        ))}
                    </div>
                    <div className="text-xs">
                        <div className="text-white font-bold flex items-center gap-1">2.5k+ Members <ShieldCheck size={10} className="text-blue-500" /></div>
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
            willChange 
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
        <ShimmerBorder rounded="rounded-xl">
            <div className="bg-neutral-900/50 rounded-xl p-1">
                <AdminPanel
                editing={adminEditing}
                clearEditing={() => setAdminEditing(null)}
                />
            </div>
        </ShimmerBorder>
      </div>
    )}

    {/* --- FOOTER / ADMIN ACCESS --- */}
    <div className="relative z-30 bg-black text-neutral-500 py-16 md:py-20 px-8 text-center border-t border-neutral-900 mt-1">
        {/* Footer Grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mb-12 text-xs uppercase tracking-widest text-neutral-400">
            {/* Item 1: YouTube -> /Blogs */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-col items-center gap-3"
            >
                <TipWrapper 
                    isActive={activeFooterIndex === 0} 
                    tipText="Watch Videos"
                    position="top"
                >
                    <Link href="/Blogs" className="relative p-[1.5px] rounded-full overflow-hidden block">
                        <motion.div 
                            className="absolute inset-[-100%]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            style={{ background: SHIMMER_GRADIENT }}
                        />
                        <div className="relative z-10 bg-neutral-900 rounded-full p-2 border border-white/5 hover:bg-neutral-800 transition-colors">
                            <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                    </Link>
                </TipWrapper>
                <span>Exclusive Content</span>
            </motion.div>

            {/* Item 2: Market Analysis -> /Prop */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col items-center gap-3"
            >
                <TipWrapper 
                    isActive={activeFooterIndex === 1} 
                    tipText="View Charts"
                    position="top"
                >
                    <Link href="/Prop" className="relative p-[1.5px] rounded-full overflow-hidden block">
                        <motion.div 
                            className="absolute inset-[-100%]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            style={{ background: SHIMMER_GRADIENT }}
                        />
                        <div className="relative z-10 bg-neutral-900 rounded-full p-2 border border-white/5 hover:bg-neutral-800 transition-colors">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                        </div>
                    </Link>
                </TipWrapper>
                <span>Market Analysis</span>
            </motion.div>

            {/* Item 3: Verified Data */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center gap-3"
            >
                <TipWrapper 
                    isActive={activeFooterIndex === 2} 
                    tipText="Check Stats"
                    position="top"
                >
                    <div className="relative p-[1.5px] rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute inset-[-100%]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            style={{ background: SHIMMER_GRADIENT }}
                        />
                        <div className="relative z-10 bg-neutral-900 rounded-full p-2 border border-white/5">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </TipWrapper>
                <span>Verified Data</span>
            </motion.div>
        </div>
        
        {/* Bottom Section */}
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col items-center gap-4"
        >
            <p className="text-[10px] opacity-50">&copy; {new Date().getFullYear()} BULLMONEY VIP. All rights reserved.</p>
            
            {!isAdmin && (
                <TipWrapper 
                    isActive={activeFooterIndex === 3} 
                    tipText="Admin Only"
                    position="top"
                    className="mt-4"
                    onClick={() => setIsAdminLoginOpen(true)}
                >
                    <div className="relative p-[1.5px] rounded-full overflow-hidden group cursor-pointer">
                         <motion.div 
                            className="absolute inset-[-100%]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            style={{ background: SHIMMER_GRADIENT }}
                        />
                        <div className="relative z-10 bg-neutral-900 rounded-full px-3 py-1 border border-white/5 flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                             <Lock size={12} className="text-neutral-400 group-hover:text-white transition-colors" />
                             <span className="text-[10px] uppercase tracking-widest text-neutral-400 group-hover:text-white transition-colors">Admin Access</span>
                        </div>
                    </div>
                </TipWrapper>
            )}
        </motion.div>
    </div>
    </div>
  );
};

export default HeroParallax;
