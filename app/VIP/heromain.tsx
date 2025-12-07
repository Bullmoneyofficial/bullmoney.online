"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Balancer from "react-wrap-balancer";
import { 
  ChevronLeft, ChevronRight, Lock, X, LogIn, 
  Save, RefreshCw, LogOut, ShieldCheck, Loader2, 
  Youtube, Type, Image as ImageIcon, Plus, Trash2, 
  LayoutList, CheckCircle2 
} from "lucide-react";
import { Russo_One } from "next/font/google";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

// Particle Imports
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

dayjs.extend(duration);
dayjs.extend(utc);

const russo = Russo_One({ weight: "400", subsets: ["latin"] });

// =========================================
// SUPABASE CLIENT INITIALIZATION
// =========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================
// UTILITIES / MOCKUPS
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
    const safeText = text || "";
    const [displayedText, setDisplayedText] = useState(safeText.replace(/./g, '█'));
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        setDisplayedText(safeText.replace(/./g, '█'));
        setIsRevealed(false);
        
        // Prevent animation if text is empty
        if (!safeText) return;

        let index = 0;
        let animationFrameId: number;

        const decrypt = () => {
            const now = Date.now();
            let elapsed = now - startTime;

            if (elapsed < revealDelayMs) {
                 animationFrameId = requestAnimationFrame(decrypt);
                 return;
            }
            
            elapsed -= revealDelayMs;

            const targetLength = Math.min(safeText.length, Math.floor(elapsed / interval));

            if (index < safeText.length) {
                const newText = safeText.substring(0, targetLength) + safeText.substring(targetLength).replace(/./g, '█');
                setDisplayedText(newText);
                index = targetLength;
                
                if (index < safeText.length) {
                    animationFrameId = requestAnimationFrame(decrypt);
                } else {
                    setIsRevealed(true);
                }
            }
        };

        const startTime = Date.now();
        animationFrameId = requestAnimationFrame(decrypt);

        return () => cancelAnimationFrame(animationFrameId);
    }, [safeText, interval, revealDelayMs]);

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
        const percent = Math.min(100, Math.max(0, (scrollAmount / scrollRange) * 100));
        setPercentScrolled(percent);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const rotate = (p: number) => (p / 100) * -20; 
    const scale = (p: number) => 0.8 + (p / 100) * 0.2; 
    const translateY = (p: number) => (p / 100) * 50; 

    return (
        <div ref={containerRef} className="relative flex flex-col items-center justify-center pt-[50vh] pb-[10vh]">
            <motion.div style={{ rotateX: 0, perspective: '1000px' }}>
                {titleComponent}
            </motion.div>
            
            <motion.div
                className="w-full relative h-[400px] md:h-[600px] lg:h-[700px] max-w-7xl mx-auto"
                style={{
                    scale: scale(percentScrolled),
                    rotateX: rotate(percentScrolled),
                    translateY: translateY(percentScrolled)
                }}
                transition={{ type: 'tween', stiffness: 200, damping: 20 }}
            >
                <div className="absolute inset-0 [transform:translateZ(0)]">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};

// --- FlipWords ---
const FlipWords = ({ words, duration = 3000, className }: { words: string[]; duration?: number; className?: string; }) => {
  const safeWords = words && words.length > 0 ? words : ["Loading..."];
  const [currentWord, setCurrentWord] = useState(safeWords[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const startAnimation = useCallback(() => {
    const currentIndex = safeWords.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % safeWords.length;
    const word = safeWords[nextIndex];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, safeWords]);

  useEffect(() => {
    if (!isAnimating && safeWords.length > 0) {
      const timeoutId = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  }, [isAnimating, duration, startAnimation, safeWords.length]);

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40, x: 40, filter: "blur(8px)", scale: 2, position: "absolute" }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        key={currentWord}
        className={cn("z-10 inline-block relative text-left px-2", className)}
      >
        {currentWord.split(" ").map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: wordIndex * 0.1, duration: 0.3 }}
            className="inline-block whitespace-nowrap"
          >
            {word.split("").map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: wordIndex * 0.1 + letterIndex * 0.05, duration: 0.2 }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

// --- MediaCarousel ---
interface Slide {
  type: "image" | "video" | "youtube";
  src: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface MediaCarouselProps {
  slides: Slide[];
  height?: number;
  autoSlideInterval?: number;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({ slides = [], height = 540, autoSlideInterval = 8000 }) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides, autoSlideInterval]);

  if (!slides || slides.length === 0) {
    return (
      <div className="w-full h-full bg-neutral-900/30 flex items-center justify-center text-neutral-500 border border-neutral-800 rounded-[32px]">
        <div className="text-center">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No media configured</p>
        </div>
      </div>
    );
  }

  const slide = slides[current] || slides[0];

  const getYoutubeId = (src: string): string => {
    if (src.includes("youtube.com") || src.includes("youtu.be")) {
      try {
        const url = new URL(src.includes("http") ? src : `https://www.youtube.com/watch?v=${src}`);
        return url.searchParams.get("v") || src.split("/").pop()?.split("?")[0] || src;
      } catch {
        return src;
      }
    }
    return src;
  };
  
  const videoId = getYoutubeId(slide.src);
  const videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}&vq=hd1080`;

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] bg-neutral-900/30 border border-neutral-800 shadow-2xl" style={{ aspectRatio: "16 / 9", height: "100%", minHeight: 320 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center bg-black"
        >
          {slide.type === "image" && (
            <div className="relative w-full h-full">
              <img src={slide.src} alt={slide.title || "Slide"} className="absolute inset-0 w-full h-full object-cover object-center" draggable={false} />
            </div>
          )}
          {slide.type === "video" && (
            <video className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline>
              <source src={slide.src} type="video/mp4" />
            </video>
          )}
          {slide.type === "youtube" && (
            <div className="absolute inset-0 w-full h-full">
               <iframe className="w-full h-full object-cover" src={videoSrc} title={slide.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      <button onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20 border border-white/10 backdrop-blur-sm transition-all active:scale-95">
        <ChevronLeft className="text-white w-6 h-6" />
      </button>
      <button onClick={() => setCurrent((p) => (p + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20 border border-white/10 backdrop-blur-sm transition-all active:scale-95">
        <ChevronRight className="text-white w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {slides.map((_, index) => (
          <button key={index} onClick={() => setCurrent(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === current ? "bg-white w-6" : "bg-neutral-500/50 w-2 hover:bg-neutral-400"}`} />
        ))}
      </div>
    </div>
  );
};

// --- Sparkles ---
const SparklesCore = (props: { id?: string; className?: string; background?: string; minSize?: number; maxSize?: number; speed?: number; particleColor?: string; particleDensity?: number; }) => {
  const { id = "tsparticles", className, background = "transparent", minSize = 0.6, maxSize = 1.4, speed = 1, particleColor = "#ffffff", particleDensity = 100 } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => { await loadSlim(engine); }).then(() => { setInit(true); });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles id={id} className={cn("h-full w-full")} options={{ background: { color: { value: background } }, fullScreen: { enable: false, zIndex: 1 }, fpsLimit: 120, particles: { color: { value: particleColor }, move: { enable: true, speed: speed }, number: { density: { enable: true, width: 1920, height: 1080 }, value: particleDensity }, opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed } }, size: { value: { min: minSize, max: maxSize } } } } as any} />
      )}
    </div>
  );
};

// =========================================
// 5. ADMIN CONFIG & TYPES
// =========================================

// Frontend Config Type (CamelCase for React)
type HeroConfig = {
  title: string;
  flipList1: string;
  flipList2: string;
  flipList3: string;
  slides: Slide[];
};

const DEFAULT_CONFIG: HeroConfig = {
  title: "Built for those who want more than trades.",
  flipList1: "CHARTS, PRICE ACTION, ORDER FLOW, PATTERNS",
  flipList2: "PSYCHOLOGY, DISCIPLINE, PATIENCE, RISK CONTROL",
  flipList3: "CRYPTO, GOLD, INDICES, FOREX",
  slides: [
    { type: "video", src: "/newhero.mp4", title: "Hero Video" },
    { type: "image", src: "https://placehold.co/1600x900/1e293b/FFFFFF?text=Fvfront.png", title: "Dashboard" },
  ]
};

// --- LOGIN PORTAL ---
function LoginPortal({ onLogin, onClose }: { onLogin: () => void, onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "MR.BULLMONEY" && password.trim() === "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED") {
      onLogin();
    } else {
      setError("Access Denied. Invalid credentials.");
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-center p-4 bg-[#020617] overflow-hidden rounded-3xl">
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
               <ShieldCheck className="w-6 h-6 text-sky-500" />
               Secure Admin
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none" placeholder="admin" autoFocus />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none" placeholder="admin" />
            </div>
            {error && <div className="text-xs text-red-400 bg-red-950/30 p-3 rounded-lg">{error}</div>}
            <button type="submit" className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> Authenticate
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- CONTENT DASHBOARD ---
function ContentDashboard({ config, onSave, onLogout, onClose }: { config: HeroConfig; onSave: (newConfig: HeroConfig) => Promise<void>; onLogout: () => void; onClose: () => void; }) {
  const [formData, setFormData] = useState<HeroConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => { setFormData(config); }, [config]);

  const [newSlideType, setNewSlideType] = useState<"image" | "video" | "youtube">("image");
  const [newSlideSrc, setNewSlideSrc] = useState("");
  const [newSlideTitle, setNewSlideTitle] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addSlide = () => {
    if (!newSlideSrc) return;
    const newSlide: Slide = { type: newSlideType, src: newSlideSrc, title: newSlideTitle };
    setFormData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setNewSlideSrc("");
    setNewSlideTitle("");
  };

  const removeSlide = (index: number) => {
    setFormData(prev => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
        await onSave(formData);
        setSaveMessage("Saved to Supabase successfully!");
    } catch (err) {
        console.error(err);
        setSaveMessage("Error saving data.");
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="w-full h-full bg-[#050B14] text-white p-6 flex flex-col rounded-3xl relative">
      <div className="flex justify-between items-center mb-6 z-10">
        <h1 className="text-xl font-black">HERO <span className="text-sky-500">MANAGER</span></h1>
        <div className="flex gap-2">
           <button onClick={() => setFormData(config)} className="p-2 bg-slate-800 rounded-lg hover:text-white text-slate-400"><RefreshCw className="w-4 h-4" /></button>
           <button onClick={onLogout} className="p-2 bg-red-900/20 text-red-400 rounded-lg"><LogOut className="w-4 h-4" /></button>
           <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg hover:text-white text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-2 z-10 space-y-5">
        {saveMessage && <div className={cn("p-3 text-xs rounded-xl flex gap-2", saveMessage.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400")}><CheckCircle2 className="w-4 h-4" />{saveMessage}</div>}
        
        {/* TEXT EDITOR */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
           <div className="flex items-center gap-2 text-purple-400 mb-1"><Type className="w-4 h-4" /><h3 className="text-xs font-bold uppercase">Text Content</h3></div>
           <div><label className="text-[10px] uppercase font-bold text-slate-500">Main Headline</label><input name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none font-bold" /></div>
           
           <div><label className="text-[10px] uppercase font-bold text-slate-500">Flip Words 1 (Comma separated)</label><input name="flipList1" value={formData.flipList1} onChange={handleChange} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none" /></div>
           <div><label className="text-[10px] uppercase font-bold text-slate-500">Flip Words 2 (Comma separated)</label><input name="flipList2" value={formData.flipList2} onChange={handleChange} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none" /></div>
           <div><label className="text-[10px] uppercase font-bold text-slate-500">Flip Words 3 (Comma separated)</label><input name="flipList3" value={formData.flipList3} onChange={handleChange} className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none" /></div>
        </div>

        {/* SLIDES EDITOR */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
           <div className="flex items-center gap-2 text-sky-400 mb-1"><LayoutList className="w-4 h-4" /><h3 className="text-xs font-bold uppercase">Carousel Slides</h3></div>
           
           <div className="flex flex-col gap-2 p-3 bg-black/30 rounded-xl border border-dashed border-slate-700">
              <div className="flex gap-2">
                 <select value={newSlideType} onChange={(e) => setNewSlideType(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="youtube">YouTube</option>
                 </select>
                 <input value={newSlideSrc} onChange={(e) => setNewSlideSrc(e.target.value)} placeholder={newSlideType === "youtube" ? "Video ID or URL" : "URL / Path"} className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white outline-none" />
              </div>
              <div className="flex gap-2">
                 <input value={newSlideTitle} onChange={(e) => setNewSlideTitle(e.target.value)} placeholder="Title (Optional)" className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white outline-none" />
                 <button type="button" onClick={addSlide} className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500"><Plus className="w-3 h-3" /></button>
              </div>
           </div>

           <div className="space-y-2 mt-2">
              {formData.slides.map((slide, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700 group">
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-xs font-bold text-slate-500">
                        {slide.type === "image" && <ImageIcon className="w-4 h-4" />}
                        {slide.type === "video" && <Type className="w-4 h-4" />}
                        {slide.type === "youtube" && <Youtube className="w-4 h-4" />}
                      </div>
                      <div className="truncate text-xs">
                        <div className="text-white font-bold">{slide.title || "Untitled"}</div>
                        <div className="text-slate-500 truncate max-w-[150px]">{slide.src}</div>
                      </div>
                   </div>
                   <button type="button" onClick={() => removeSlide(idx)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
           </div>
        </div>
      </form>
      <div className="pt-4 border-t border-slate-800 z-10">
        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex justify-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish Changes</button>
      </div>
    </div>
  );
}

// =========================================
// 6. MAIN HERO COMPONENT
// =========================================
export default function Hero() {
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // FETCH FROM SUPABASE ON MOUNT
  useEffect(() => {
    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            // Updated to fetch from 'main_hero' per your SQL
            const { data, error } = await supabase
                .from('main_hero')
                .select('*')
                .single(); 
            
            if (error) {
                console.warn("Supabase fetch error, using default:", error.message);
            } else if (data) {
                // Manually map Snake_Case DB columns to CamelCase React State
                setHeroConfig({
                  title: data.title,
                  flipList1: data.flip_list_1, // Map flip_list_1 -> flipList1
                  flipList2: data.flip_list_2, // Map flip_list_2 -> flipList2
                  flipList3: data.flip_list_3, // Map flip_list_3 -> flipList3
                  slides: data.slides || []
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchConfig();
  }, []);

  // SAVE TO SUPABASE
  const updateConfig = async (newConfig: HeroConfig) => {
    // Optimistic UI update
    setHeroConfig(newConfig);

    // Map CamelCase React State back to Snake_Case DB columns
    const dbPayload = {
      id: true, // SQL: id BOOLEAN PRIMARY KEY DEFAULT TRUE
      title: newConfig.title,
      flip_list_1: newConfig.flipList1,
      flip_list_2: newConfig.flipList2,
      flip_list_3: newConfig.flipList3,
      slides: newConfig.slides
    };

    const { error } = await supabase
        .from('main_hero')
        .upsert(dbPayload);

    if (error) {
        throw new Error(error.message);
    }
  };

  const flipList1 = heroConfig?.flipList1 ? heroConfig.flipList1.split(',').map(s => s.trim()) : [];
  const flipList2 = heroConfig?.flipList2 ? heroConfig.flipList2.split(',').map(s => s.trim()) : [];
  const flipList3 = heroConfig?.flipList3 ? heroConfig.flipList3.split(',').map(s => s.trim()) : [];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-neutral-950 w-full">
      
      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={2.0} 
          maxSize={.5}
          particleDensity={70}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Admin Button */}
      <button onClick={() => setShowAdmin(true)} className="absolute top-4 right-4 z-50 p-2 text-white/20 hover:text-sky-500 transition-colors z-[60]"><Lock className="w-4 h-4" /></button>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAdmin(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg h-[85vh] md:h-auto md:max-h-[800px] z-10 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#020617]" onClick={(e) => e.stopPropagation()}>
              {isLoggedIn ? <ContentDashboard config={heroConfig} onSave={updateConfig} onLogout={() => setIsLoggedIn(false)} onClose={() => setShowAdmin(false)} /> : <LoginPortal onLogin={() => setIsLoggedIn(true)} onClose={() => setShowAdmin(false)} />}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONTAINER SCROLL ANIMATION with MediaCarousel & Title */}
      <div className="relative z-20 w-full -mt-20 md:-mt-10 lg:-mt-0">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-10 w-full">
              
              {/* MAIN HEADER INSIDE SCROLL CONTAINER */}
              <div className="relative w-full overflow-hidden mb-6 sm:mb-8 px-4">
                <div className="grid items-center gap-3 grid-cols-[minmax(64px,1fr)_auto_minmax(64px,1fr)] sm:grid-cols-[minmax(96px,1fr)_auto_minmax(96px,1fr)] md:grid-cols-[minmax(140px,1fr)_auto_minmax(140px,1fr)]">
                  {/* LEFT BARS */}
                  <motion.div initial={{ x: "-110%" }} animate={{ x: 0 }} transition={{ duration: 1.1, ease: "easeOut" }} className="justify-self-end flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none">
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[-25deg]" />
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[-25deg]" />
                  </motion.div>

                  {/* TITLE WITH ENCRYPTED TEXT */}
                  <div className="text-center max-w-[90vw] sm:max-w-4xl text-xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                    <Balancer>
                      <h2
                        className={`${russo.className} uppercase leading-none text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.08em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.12)]`}
                      >
                         {/* Pass loading state or empty string to prevent hydration mismatch before data loads */}
                        <EncryptedText 
                          text={heroConfig?.title || "LOADING..."}
                          interval={40}
                          className="whitespace-normal" 
                        />
                      </h2>
                    </Balancer>
                  </div>

                  {/* RIGHT BARS */}
                  <motion.div initial={{ x: "110%" }} animate={{ x: 0 }} transition={{ duration: 1.1, ease: "easeOut" }} className="justify-self-start flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none">
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[25deg]" />
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[25deg]" />
                  </motion.div>
                </div>
              </div>

              {/* SUBTITLE */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
                className="relative z-20 mx-auto mt-0 max-w-2xl px-4 text-center text-xs sm:text-base/6 text-gray-200 uppercase"
              >
                MASTER{" "}
                <FlipWords words={flipList1} duration={4000} className="px-0 font-bold text-blue-500" />
                , SHARPEN YOUR{" "}
                <FlipWords words={flipList2} duration={4000} className="px-0 font-bold text-blue-500" />
                , AND TRADE{" "}
                <FlipWords words={flipList3} duration={4000} className="px-0 font-bold text-blue-500" />
                WITH CONFIDENCE.
              </motion.p>
            </div>
          }
        >
          <MediaCarousel slides={heroConfig?.slides || []} />
        </ContainerScroll>
      </div>
    </div>
  );
}