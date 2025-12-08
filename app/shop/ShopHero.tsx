"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Balancer from "react-wrap-balancer";
import { 
  ChevronRight, Lock, X, Save, Loader2, 
  ShoppingBag, Plus, Trash2, ShieldCheck, 
  RefreshCw, LogOut, CheckCircle2, Youtube, 
  Image as ImageIcon, Type
} from "lucide-react";
import { Russo_One } from "next/font/google";
import { cn } from "@/lib/utils"; 

// Import the LaserFlow Component (Ensure this file exists in your project)
import LaserFlow from "@/components/Mainpage/LaserFlow";

const russo = Russo_One({ weight: "400", subsets: ["latin"] });

// =========================================
// 1. UTILITY COMPONENTS
// =========================================

// --- EncryptedText ---
const EncryptedText = ({
    text,
    interval = 50,
    className,
    revealedClassName,
    encryptedClassName,
    revealDelayMs = 0,
}: {
    text: string;
    interval?: number;
    className?: string;
    revealedClassName?: string;
    encryptedClassName?: string;
    revealDelayMs?: number;
}) => {
    const [displayedText, setDisplayedText] = useState(text);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        // Reset state when text changes
        setIsRevealed(false);
        setDisplayedText(text.replace(/./g, '█'));

        let animationFrameId: number;
        const startTime = Date.now();

        const decrypt = () => {
            const now = Date.now();
            let elapsed = now - startTime;

            if (elapsed < revealDelayMs) {
                 animationFrameId = requestAnimationFrame(decrypt);
                 return;
            }
            
            elapsed -= revealDelayMs;
            const targetLength = Math.min(text.length, Math.floor(elapsed / interval));

            if (targetLength < text.length) {
                const newText = text.substring(0, targetLength) + text.substring(targetLength).replace(/./g, '█');
                setDisplayedText(newText);
                animationFrameId = requestAnimationFrame(decrypt);
            } else {
                setDisplayedText(text);
                setIsRevealed(true);
            }
        };

        animationFrameId = requestAnimationFrame(decrypt);
        return () => cancelAnimationFrame(animationFrameId);
    }, [text, interval, revealDelayMs]);

    return (
        <span className={cn(className, isRevealed ? revealedClassName : encryptedClassName)}>
            {displayedText}
        </span>
    );
};

// --- ContainerScroll ---
const ContainerScroll = ({ titleComponent, children }: { titleComponent: React.ReactNode, children: React.ReactNode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [percentScrolled, setPercentScrolled] = useState(0);

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const start = rect.top + window.scrollY;
        const end = rect.bottom + window.scrollY - window.innerHeight;
        const scrollAmount = window.scrollY - start;
        const scrollRange = end - start;
        const percent = Math.min(100, Math.max(0, (scrollAmount / (scrollRange * 0.8)) * 100));
        setPercentScrolled(percent);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const rotate = (p: number) => (p / 100) * 20; 
    const scale = (p: number) => 1.05 - (p / 100) * 0.15; 
    const translateY = (p: number) => (p / 100) * -50; 

    return (
        <div ref={containerRef} className="relative flex flex-col items-center justify-center pt-20 pb-[20vh]">
            <div className="relative z-10 w-full">
                {titleComponent}
            </div>
            
            <motion.div
                className="w-full relative h-[300px] sm:h-[400px] md:h-[600px] max-w-6xl mx-auto mt-10"
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
            >
                <motion.div
                    className="w-full h-full rounded-[30px] border-4 border-[#0055FF]/30 bg-[#000510]/80 backdrop-blur-sm shadow-[0_0_50px_-10px_rgba(0,85,255,0.3)]"
                    style={{
                        rotateX: rotate(percentScrolled),
                        scale: scale(percentScrolled),
                        translateY: translateY(percentScrolled),
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                   {children}
                </motion.div>
            </motion.div>
        </div>
    );
};

// --- FlipWords ---
const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Handle word array changes dynamically
  useEffect(() => {
    if (!words.includes(currentWord)) {
        setCurrentWord(words[0]);
    }
  }, [words, currentWord]);

  const startAnimation = useCallback(() => {
    if (words.length <= 1) return;
    const currentIndex = words.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % words.length;
    setCurrentWord(words[nextIndex]);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating && words.length > 1) {
      const timeoutId = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  }, [isAnimating, duration, startAnimation, words.length]);

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        key={currentWord}
        className={cn("z-10 inline-block relative text-left px-2 text-[#0055FF]", className)}
      >
        {currentWord}
      </motion.div>
    </AnimatePresence>
  );
};

// --- Media Carousel ---
interface Slide {
  type: "image" | "video" | "youtube";
  src: string;
  title?: string;
}

const MediaCarousel = ({ slides, autoSlideInterval = 8000 }: { slides: Slide[]; autoSlideInterval?: number }) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    if (slides.length === 0) return;
    // Reset index if out of bounds (e.g. after deleting a slide)
    if (current >= slides.length) setCurrent(0);
    
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval, current]);

  if (slides.length === 0) return <div className="w-full h-full flex items-center justify-center text-white/20">No Media Configured</div>;

  const slide = slides[current] || slides[0];
  
  const getYoutubeId = (src: string) => {
    if (src.includes("youtube.com") || src.includes("youtu.be")) {
        try {
            const url = new URL(src.includes("http") ? src : `https://www.youtube.com/watch?v=${src}`);
            return url.searchParams.get("v") || src.split("/").pop()?.split("?")[0] || src;
        } catch { return src; }
    }
    return src;
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[26px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-black"
        >
          {slide.type === "image" && (
            <img src={slide.src} alt={slide.title} className="w-full h-full object-cover" draggable={false} />
          )}
          {slide.type === "video" && (
            <video className="w-full h-full object-cover" autoPlay loop muted playsInline src={slide.src} />
          )}
          {slide.type === "youtube" && (
             <iframe
                className="w-full h-full object-cover pointer-events-none"
                src={`https://www.youtube.com/embed/${getYoutubeId(slide.src)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYoutubeId(slide.src)}`}
                allow="autoplay; encrypted-media"
                title={slide.title}
              />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 z-20">
             <h3 className="text-2xl font-bold text-white mb-2">{slide.title}</h3>
             <button className="flex items-center gap-2 px-4 py-2 bg-[#0055FF] text-white rounded-lg text-sm font-bold hover:bg-[#0044cc] transition-colors">
                <ShoppingBag className="w-4 h-4" /> View Product
             </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex space-x-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "bg-[#0055FF] w-6" : "bg-white/30 w-2 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
};


// =========================================
// 2. ADMIN & CONFIG
// =========================================

type HeroConfig = {
  title: string;
  flipList1: string;
  flipList2: string;
  flipList3: string;
  slides: Slide[];
};

const DEFAULT_CONFIG: HeroConfig = {
  title: "Unlock VIP Access",
  flipList1: "Access insider knowledge, trade smarter, and stay ahead of the curve.",
  flipList2: "Join the Elite BullMoney VIP Community",
  flipList3: "Access insider knowledge, trade smarter, and stay ahead of the curve.",
  slides: [
    { type: "image", src: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=1600&auto=format&fit=crop", title: "Trading Station Pro" },
    { type: "image", src: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1600&auto=format&fit=crop", title: "Bullmoney Hoodie Vol.1" },
  ]
};

// --- Login Portal ---
function LoginPortal({ onLogin, onClose }: { onLogin: () => void, onClose: () => void }) {
    const [p, setP] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (p === "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED") onLogin();
        else setError("Invalid credentials");
    }

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 bg-[#020617] p-8 text-center relative z-50">
            <ShieldCheck className="w-16 h-16 text-[#0055FF] mb-2" />
            <div>
                <h2 className="text-2xl font-bold text-white">Admin Access</h2>
                <p className="text-slate-400 text-sm">Enter password to edit shop content.</p>
            </div>
            
            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={p} 
                    onChange={e => {setP(e.target.value); setError("")}} 
                    className="w-full bg-black/50 border border-slate-700 p-3 rounded-lg text-white text-center focus:border-[#0055FF] outline-none" 
                />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full bg-[#0055FF] hover:bg-[#0044cc] py-3 rounded-lg font-bold text-white transition-all">Unlock</button>
            </form>
            <button onClick={onClose} className="text-xs text-slate-500 hover:text-white">Cancel</button>
        </div>
    );
}

// --- Content Dashboard ---
function ContentDashboard({ config, onSave, onLogout, onClose }: { 
    config: HeroConfig, 
    onSave: (c: HeroConfig) => void, 
    onLogout: () => void, 
    onClose: () => void 
}) {
  const [formData, setFormData] = useState<HeroConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlideType, setNewSlideType] = useState<"image" | "youtube">("image");
  const [newSlideSrc, setNewSlideSrc] = useState("");
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [msg, setMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  
  const addSlide = () => {
    if (!newSlideSrc) return;
    setFormData(p => ({ 
        ...p, 
        slides: [...p.slides, { type: newSlideType, src: newSlideSrc, title: newSlideTitle || "New Product" }] 
    }));
    setNewSlideSrc(""); 
    setNewSlideTitle("");
  };

  const removeSlide = (idx: number) => {
    setFormData(p => ({ ...p, slides: p.slides.filter((_, i) => i !== idx) }));
  }

  const save = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Fake loading
    onSave(formData);
    setMsg("Saved Successfully!");
    setIsSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="w-full h-full bg-[#020617] text-white p-6 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <h1 className="text-xl font-black tracking-widest flex items-center gap-2">
            SHOP<span className="text-[#0055FF]">ADMIN</span>
        </h1>
        <div className="flex gap-2">
             <button onClick={() => setFormData(config)} title="Reset" className="p-2 hover:bg-slate-800 rounded"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
             <button onClick={onLogout} title="Logout" className="p-2 hover:bg-slate-800 rounded"><LogOut className="w-4 h-4 text-red-400" /></button>
             <button onClick={onClose} title="Close" className="p-2 hover:bg-slate-800 rounded"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        {/* Texts */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0055FF] mb-2">
                <Type className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Typography</h3>
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Main Headline</label>
                <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/50 border border-slate-800 p-3 rounded-lg text-sm text-white focus:border-[#0055FF] outline-none font-bold" />
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Flip Words (Comma Separated)</label>
                <div className="grid grid-cols-1 gap-3">
                    <input name="flipList1" value={formData.flipList1} onChange={handleChange} className="w-full bg-black/50 border border-slate-800 p-2 rounded-lg text-xs" placeholder="List 1..." />
                    <input name="flipList2" value={formData.flipList2} onChange={handleChange} className="w-full bg-black/50 border border-slate-800 p-2 rounded-lg text-xs" placeholder="List 2..." />
                    <input name="flipList3" value={formData.flipList3} onChange={handleChange} className="w-full bg-black/50 border border-slate-800 p-2 rounded-lg text-xs" placeholder="List 3..." />
                </div>
            </div>
        </div>

        {/* Carousel */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[#0055FF] mb-2">
                <ImageIcon className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Product Carousel</h3>
           </div>
           
           {/* Add New */}
           <div className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
             <label className="text-[10px] text-slate-500 uppercase font-bold">Add Slide</label>
             <div className="flex gap-2">
                <select value={newSlideType} onChange={(e: any) => setNewSlideType(e.target.value)} className="bg-black border border-slate-700 rounded p-2 text-xs outline-none">
                    <option value="image">Image</option>
                    <option value="youtube">YouTube</option>
                </select>
                <input placeholder={newSlideType === 'image' ? "Image URL" : "Video ID"} value={newSlideSrc} onChange={(e) => setNewSlideSrc(e.target.value)} className="flex-1 bg-black border border-slate-700 rounded p-2 text-xs outline-none focus:border-[#0055FF]" />
             </div>
             <div className="flex gap-2">
                <input placeholder="Product Title" value={newSlideTitle} onChange={(e) => setNewSlideTitle(e.target.value)} className="flex-1 bg-black border border-slate-700 rounded p-2 text-xs outline-none focus:border-[#0055FF]" />
                <button onClick={addSlide} className="bg-[#0055FF] px-4 rounded text-white hover:bg-[#0044cc]"><Plus className="w-4 h-4" /></button>
             </div>
           </div>
           
           {/* List */}
           <div className="space-y-2">
              {formData.slides.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-800 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">
                            {s.type === 'youtube' ? <Youtube className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold truncate text-slate-200">{s.title}</span>
                            <span className="text-[10px] truncate text-slate-500 max-w-[150px]">{s.src}</span>
                        </div>
                    </div>
                    <button onClick={() => removeSlide(i)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      {/* Save Bar */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        {msg && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-2 flex items-center gap-2 text-green-500 text-xs justify-center">
                <CheckCircle2 className="w-3 h-3" /> {msg}
             </motion.div>
        )}
        <button onClick={save} disabled={isSaving} className="w-full py-3 bg-[#0055FF] hover:bg-[#0044cc] rounded-lg font-bold flex justify-center items-center gap-2 text-white shadow-lg shadow-blue-900/20">
            {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />} 
            Save Changes
        </button>
      </div>
    </div>
  );
}

// =========================================
// 3. MAIN COMPONENT
// =========================================
export default function ShopHero() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("bm_shop_hero_v1");
    if (s) try { setConfig(JSON.parse(s)); } catch (e) { console.error("Config load error", e); }
  }, []);

  const saveConfig = (c: HeroConfig) => {
    setConfig(c);
    localStorage.setItem("bm_shop_hero_v1", JSON.stringify(c));
  };

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col">
      
      {/* --- BACKGROUND LAYER: LASER FLOW (KEPT AS REQUESTED) --- */}
      <div className="absolute inset-0 z-0">
        <LaserFlow 
          color="#0055FF" 
          flowSpeed={0.25} 
          wispDensity={1.5} 
          horizontalSizing={1.5}
          fogIntensity={0.6}
          mouseTiltStrength={0.02}
        />
      </div>

      {/* --- LAYER 1: CONTENT --- */}
      <div className="relative z-20 flex-1">
        
        {/* Navbar */}
        <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5 backdrop-blur-sm">
            
            <div className="flex gap-4">
                
            </div>
        </nav>

        {/* 3D Scroll Container */}
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center mb-10 w-full px-4">
              
              {/* Decorative Lines */}
              <div className="flex items-center gap-4 mb-6 opacity-70">
                 <div className="w-20 h-[2px] bg-gradient-to-r from-transparent to-[#0055FF]" />
                 <div className="text-[#0055FF] text-s font-bold tracking-[0.2em] uppercase">Official Shop</div>
                 <div className="w-20 h-[2px] bg-gradient-to-l from-transparent to-[#0055FF]" />
              </div>

              {/* Main Encrypted Title */}
              <Balancer>
                <h1 className={`${russo.className} text-center text-5xl md:text-7xl lg:text-8xl text-white tracking-tight uppercase drop-shadow-2xl`}>
                  <EncryptedText 
                    text={config.title} 
                    interval={50}
                    revealDelayMs={500}
                    className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
                  />
                </h1>
              </Balancer>

              {/* Subtitle with FlipWords */}
              <div className="mt-6 text-center text-sm md:text-lg text-slate-400 max-w-2xl font-light tracking-wide">
                <span>WE EQUIP YOU WITH </span>
                <FlipWords words={config.flipList1.split(',').map(s=>s.trim())} className="font-bold text-[#0055FF]" />
                <span>, </span>
                <FlipWords words={config.flipList2.split(',').map(s=>s.trim())} className="font-bold text-[#0055FF]" />
                <span>, AND </span>
                <FlipWords words={config.flipList3.split(',').map(s=>s.trim())} className="font-bold text-[#0055FF]" />
                <span>.</span>
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex gap-4">
                 <button className="px-8 py-3 bg-[#0055FF] hover:bg-[#0044cc] text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(0,85,255,0.4)] hover:shadow-[0_0_40px_rgba(0,85,255,0.6)] flex items-center gap-2">
                    Start Shopping <ChevronRight className="w-4 h-4" />
                 </button>
                 <button className="px-8 py-3 border border-white/20 hover:bg-white/5 text-white font-bold rounded-full transition-all">
                    View Collections
                 </button>
              </div>

            </div>
          }
        >
          {/* The Actual Shop "Screen" */}
          <MediaCarousel slides={config.slides} />
        </ContainerScroll>
      </div>

      {/* Admin Toggle (Bottom Right) */}
      <button 
        onClick={() => setShowAdmin(true)} 
        className="fixed bottom-6 right-6 z-[90] p-3 rounded-full bg-white/5 hover:bg-[#0055FF] text-white/30 hover:text-white transition-all backdrop-blur-md"
      >
        <Lock className="w-4 h-4" />
      </button>

      {/* Admin Modal Overlay */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowAdmin(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
             />
             
             {/* Modal */}
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-lg bg-[#020617] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl h-[650px]"
             >
                {isAuth ? 
                   <ContentDashboard config={config} onSave={saveConfig} onLogout={() => setIsAuth(false)} onClose={() => setShowAdmin(false)} /> : 
                   <LoginPortal onLogin={() => setIsAuth(true)} onClose={() => setShowAdmin(false)} />
                }
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}