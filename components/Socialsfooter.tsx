"use client";
import React, { useState, useEffect, useRef, useMemo, JSX, useCallback, createContext, useContext, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Copy, Check, Sparkles, Scissors, QrCode, X, Users, Timer } from "lucide-react";

// --- GLOBAL STYLES & UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GLOBAL_STYLES = `
  @keyframes text-shimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: -200% 50%; }
  }

  /* CYBER TEXT SHIMMER (Green/White/Blue for this section) */
  .animate-text-shimmer {
    background: linear-gradient(
      110deg, 
      #4ade80 20%,   /* Green 400 */
      #ffffff 48%,   /* White Peak */
      #38bdf8 52%,   /* Sky 400 */
      #4ade80 80%    /* Green 400 */
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: text-shimmer 3s linear infinite;
  }
  
  .animate-text-shimmer-blue {
    background: linear-gradient(
      110deg, 
      #60a5fa 20%,   /* Blue 400 */
      #ffffff 48%,   /* White Peak */
      #a78bfa 52%,   /* Violet 400 */
      #60a5fa 80%    /* Blue 400 */
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    animation: text-shimmer 3s linear infinite;
  }
`;

const MAX_FPS = 30;

const usePerformanceMode = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < 768; 
      setIsPerformanceMode(isMobile || reducedMotion);
    };
    
    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, []);

  return isPerformanceMode;
};

// ==========================================
// SHIMMER BORDER COMPONENT
// ==========================================

const shimmerGradient = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #4ade80 50%, #00000000 100%)"; // Default Green for Shop

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
            <div className={cn("absolute bg-neutral-900/90 flex items-center justify-center z-10", borderRadius, borderWidth)}>
                {children}
            </div>
            <div className="relative z-20">
                {children}
            </div>
        </div>
    );
};

// ==========================================
// 2. MODAL SYSTEM
// ==========================================

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export function Modal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [open]);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export const ModalTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { setOpen } = useModal();
  return (
    <button onClick={() => setOpen(true)} className={cn("cursor-pointer focus:outline-none", className)}>
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }: { children: ReactNode; className?: string }) => {
  const { open, setOpen } = useModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => { if (open) window.removeEventListener('keydown', handleKeyDown); };
  }, [open, setOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-16 sm:pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }} 
            className={cn(
              "relative w-full max-w-2xl z-10 pointer-events-none overflow-y-auto max-h-[90vh] sm:max-h-auto", 
              className
            )}
          >
            <ShimmerBorder borderRadius="rounded-2xl" borderWidth="inset-[1.5px]" className="w-full" speed={4}>
                <div className="pointer-events-auto relative w-full p-4 sm:p-6 bg-neutral-900 rounded-2xl">
                    <button 
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 z-50 p-2 bg-neutral-800/50 text-white hover:bg-neutral-700 rounded-full transition-colors border border-white/10"
                    >
                    <X size={16} strokeWidth={2} />
                    </button>
                    <div className="pt-4 sm:pt-0">
                       {children}
                    </div>
                </div>
            </ShimmerBorder>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ==========================================
// 3. PIXEL CARD LOGIC
// ==========================================

class Pixel {
  width: number; height: number; ctx: CanvasRenderingContext2D; x: number; y: number; color: string; speed: number; size: number; sizeStep: number; minSize: number; maxSizeInteger: number; maxSize: number; delay: number; counter: number; counterStep: number; isIdle: boolean; isReverse: boolean; isShimmer: boolean;
  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number, color: string, speed: number, delay: number) {
    this.width = canvas.width; this.height = canvas.height; this.ctx = context; this.speed = this.getRandomValue(0.05, 0.4) * speed * 0.5; this.x = x; this.y = y; this.color = color; this.size = 0; this.sizeStep = Math.random() * 0.2; this.minSize = 0.5; this.maxSizeInteger = 2; this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger); this.delay = delay; this.counter = 0; this.counterStep = Math.random() * 2 + (this.width + this.height) * 0.005; this.isIdle = false; this.isReverse = false; this.isShimmer = false;
  }
  getRandomValue(min: number, max: number) { return Math.random() * (max - min) + min; }
  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }
  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
    this.draw();
  }
  disappear() {
    this.isShimmer = false; this.counter = 0;
    if (this.size <= 0) { this.isIdle = true; return; } else this.size -= 0.05;
    this.draw();
  }
  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true; else if (this.size <= this.minSize) this.isReverse = false;
    if (this.isReverse) this.size -= this.speed * 0.5; else this.size += this.speed * 0.5;
  }
}

const VARIANTS = {
  default: { activeColor: null, gap: 5, speed: 15, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false }, 
  blue: { activeColor: '#e0f2fe', gap: 10, speed: 10, colors: '#60a5fa,#3b82f6,#2563eb', noFocus: false }, 
  green: { activeColor: '#dcfce7', gap: 6, speed: 8, colors: '#4ade80,#22c55e,#86efac', noFocus: true } 
};

interface PixelCardProps {
  variant?: 'default' | 'blue' | 'green'; gap?: number; speed?: number; colors?: string; noFocus?: boolean; className?: string; children: React.ReactNode;
}

const PixelCard = ({ variant = 'default', gap, speed, colors, noFocus, className = '', children }: PixelCardProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const isPerformanceMode = usePerformanceMode();
  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap; const finalSpeed = speed ?? variantCfg.speed; const finalColors = colors ?? variantCfg.colors; const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || isPerformanceMode) return; 
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.floor(rect.width); const height = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = width; canvasRef.current.height = height; canvasRef.current.style.width = `${width}px`; canvasRef.current.style.height = `${height}px`;
    const colorsArray = finalColors.split(',');
    const pxs = []; const effGap = parseInt(finalGap.toString(), 10); 
    for (let x = 0; x < width; x += effGap) {
      for (let y = 0; y < height; y += effGap) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] || '#3b82f6';
        const dx = x - width / 2; const dy = y - height / 2; const distance = Math.sqrt(dx * dx + dy * dy);
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, finalSpeed * 0.0005, distance)); 
      }
    }
    pixelsRef.current = pxs;
  }, [finalColors, finalGap, finalSpeed, isPerformanceMode]);

  const doAnimate = (fnName: keyof Pixel) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    const timeNow = performance.now(); const timeInterval = 1000 / MAX_FPS; const timePassed = timeNow - timePreviousRef.current;
    if (timePassed < timeInterval) return;
    timePreviousRef.current = timeNow - (timePassed % timeInterval); 
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) { if(animationRef.current) cancelAnimationFrame(animationRef.current); return; }
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    let allIdle = true;
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i];
      if (!pixel) continue;
      // @ts-ignore
      pixel[fnName]();
      if (!pixel.isIdle) allIdle = false;
    }
    if (allIdle && animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleAnimation = (name: keyof Pixel) => {
    if (isPerformanceMode) return;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    timePreviousRef.current = performance.now(); 
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver(() => { clearTimeout(timeoutId); timeoutId = setTimeout(() => initPixels(), 200); });
    if (containerRef.current) { observer.observe(containerRef.current); initPixels(); }
    return () => { observer.disconnect(); clearTimeout(timeoutId); if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); };
  }, [initPixels]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-neutral-900/40 backdrop-blur-sm border border-white/5", className)}
      onMouseEnter={() => handleAnimation('appear')}
      onMouseLeave={() => handleAnimation('disappear')}
      onFocus={finalNoFocus ? undefined : (e) => !e.currentTarget.contains(e.relatedTarget) && handleAnimation('appear')}
      onBlur={finalNoFocus ? undefined : (e) => !e.currentTarget.contains(e.relatedTarget) && handleAnimation('disappear')}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      {!isPerformanceMode && <canvas className="absolute inset-0 z-0 h-full w-full pointer-events-none" ref={canvasRef} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ==========================================
// 4. BULL REWARDS CARD (Tear Logic)
// ==========================================

const TEAR_AMPLITUDE = 5;
const CENTER_X = 50;
const generateJaggedPath = (side: 'left' | 'right') => {
  let path = side === 'left' ? 'polygon(0% 0%, ' : 'polygon(100% 0%, ';
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    const xOffset = i % 2 === 0 ? 0 : (side === 'left' ? TEAR_AMPLITUDE : -TEAR_AMPLITUDE);
    const x = CENTER_X + xOffset;
    path += `${x}% ${y}%, `;
  }
  path += side === 'left' ? '0% 100%)' : '100% 100%)';
  return path;
};
const LEFT_CLIP = generateJaggedPath('left');
const RIGHT_CLIP = generateJaggedPath('right');

const CardDesign = () => (
  <div className="absolute inset-0 flex flex-col justify-between p-8 bg-zinc-950 border border-zinc-800 overflow-hidden">
    <div className="absolute inset-0 opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-2xl pointer-events-none" /> 
    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-900/20 rounded-full blur-2xl pointer-events-none" />
    <div className="flex justify-between items-start z-10">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white text-lg tracking-wide uppercase animate-text-shimmer-blue">BullMoney</span>
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Loyalty Program</span>
      </div>
      <div className="px-3 py-1 bg-blue-600/20 text-blue-200 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">VIP</div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-9xl font-black text-zinc-800/30 tracking-tighter transform -rotate-12">BULL</span>
    </div>
    <div className="z-10 mt-auto">
      <div className="flex justify-between items-end mb-3">
        <div className="text-zinc-500 text-[10px] uppercase tracking-widest">Points Balance</div>
        <div className="text-3xl font-light text-white tracking-tight">5,000</div>
      </div>
      <div className="w-full h-[1px] bg-zinc-800 mt-2 relative">
        <div className="absolute top-0 left-0 h-full w-[80%] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" /> 
      </div>
      <div className="flex justify-between mt-2">
         <span className="text-[9px] text-zinc-600 font-mono">ID: 8829-22</span>
         <span className="text-[9px] text-blue-400/80 font-mono">TIER: PLATINUM</span>
      </div>
    </div>
  </div>
);

const BullRewardsCard = () => {
  const [isTorn, setIsTorn] = useState(false);
  useEffect(() => { setIsTorn(false); }, []);
  const handleInteraction = () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50); setIsTorn(true); };

  return (
    <div className="relative w-full aspect-[1.58/1] perspective-1000 group select-none">
        <div className={cn("absolute inset-0 bg-white rounded-xl flex flex-col items-center justify-center text-center p-6 transition-opacity duration-700", isTorn ? "opacity-100 delay-500 z-0" : "opacity-0 -z-10" )}>
          <div className="bg-zinc-950 p-3 mb-4 shadow-lg border border-zinc-200 rounded-lg"><QrCode className="w-16 h-16 text-white" strokeWidth={1} /></div>
          <h3 className="text-zinc-950 font-bold text-2xl mb-1">CODE: BULL</h3>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Use on Whop Checkout</p>
        </div>
        <AnimatePresence>
          {!isTorn && (
            <motion.div className="absolute inset-0 z-20 cursor-pointer" whileHover={{ scale: 1.01, rotate: 0.5 }} whileTap={{ scale: 0.98, rotate: -0.5 }} onClick={handleInteraction} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
               <div className="w-full h-full overflow-hidden shadow-xl shadow-black/40 relative bg-zinc-950 rounded-xl">
                  <CardDesign />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-zinc-950/70 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center text-white">
                      <Scissors className="w-6 h-6 mb-3 motion-safe:animate-pulse text-blue-400" strokeWidth={1.5} />
                      <span className="font-medium text-lg tracking-wide uppercase">Click to Tear</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isTorn && (
          <>
            <motion.div className="absolute inset-0 z-30 pointer-events-none drop-shadow-lg rounded-xl" initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: -40, y: 80, rotate: -15, opacity: 0 }} transition={{ type: "spring", stiffness: 80, damping: 10, opacity: { duration: 1.2, delay: 0.4 } }} style={{ clipPath: LEFT_CLIP }}>
              <div className="w-full h-full overflow-hidden rounded-xl"><CardDesign /><div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_5px_white]" style={{ left: '50%' }} /></div>
            </motion.div>
            <motion.div className="absolute inset-0 z-30 pointer-events-none drop-shadow-lg rounded-xl" initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: 40, y: 100, rotate: 15, opacity: 0 }} transition={{ type: "spring", stiffness: 80, damping: 10, opacity: { duration: 1.2, delay: 0.4 } }} style={{ clipPath: RIGHT_CLIP }}>
              <div className="w-full h-full overflow-hidden rounded-xl"><CardDesign /><div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_5px_white]" style={{ left: '50%' }} /></div>
            </motion.div>
          </>
        )}
    </div>
  );
};

// ==========================================
// 5. MAIN COMPONENT (INTEGRATED)
// ==========================================

const ShopMarketingSection = () => {
  return (
    <div className="relative flex min-h-0 w-full flex-col overflow-hidden bg-black text-white selection:bg-blue-500/30 selection:text-blue-200 sm:min-h-[500px]">
      <style>{GLOBAL_STYLES}</style>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black" />
      <BackgroundGrids />
      
      <ShimmerBorder borderRadius="rounded-none" borderWidth="inset-0" speed={6} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)">
        <PromoBanner />
      </ShimmerBorder>
      
      <div className="relative z-10 flex w-full flex-col items-center justify-start pt-8 pb-12 sm:justify-center sm:pt-24 sm:pb-24 px-4">
        <div className="w-full max-w-2xl">
           <LiveViewersDashboard /> 
        </div>
      </div>
    </div>
  );
};

export default ShopMarketingSection;

// ==========================================
// 6. SUB-COMPONENTS
// ==========================================

export const LiveViewersDashboard = () => {
  const [viewers, setViewers] = useState<number | null>(42);
  const [timeLeft, setTimeLeft] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => { if (!prev) return 42; const change = Math.floor(Math.random() * 5) - 2; return Math.max(35, Math.min(150, prev + change)); });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date(); const target = new Date(); target.setHours(24, 0, 0, 0); const diff = target.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";
      const h = Math.floor((diff / 3600000) % 24); const m = Math.floor((diff / 60000) % 60); const s = Math.floor((diff / 1000) % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    setTimeLeft(calculateTime()); const interval = setInterval(() => setTimeLeft(calculateTime()), 1000); return () => clearInterval(interval);
  }, []);

  return (
    <motion.div animate={{ y: [0, -1.5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        {/* Shimmer Border around the main dashboard */}
        <ShimmerBorder borderRadius="rounded-2xl" borderWidth="inset-[1.5px]" speed={5}>
          <PixelCard variant="green" gap={6} speed={10} className="group relative rounded-2xl shadow-none transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.2)] bg-neutral-900/90 border-none" noFocus={true}>
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6 md:gap-8">
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex flex-col items-center justify-center">
                        <MiniTradingChart width={80} height={35} />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div> 
                        <div className="flex flex-col leading-none items-end">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-safe:animate-ping"></span> 
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                                </span>
                                {/* Text Shimmer on Live Count */}
                                <span className="text-2xl font-black tabular-nums animate-text-shimmer">{viewers}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Live Traders</span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block w-[1px] h-12 bg-white/5" />
                <div className="md:hidden w-full h-[1px] bg-white/5" />

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    
                    {/* Reward Button with Blue/Green Shimmer */}
                    <Modal>
                        <ModalTrigger className="w-full md:w-auto">
                           <ShimmerBorder borderRadius="rounded-lg" borderWidth="inset-px" speed={1.5} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #34d399 50%, #00000000 100%)">
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center justify-between md:justify-center gap-3 bg-blue-500/10 border border-transparent hover:bg-blue-500/20 px-4 py-2 rounded-lg transition-colors group/btn w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-blue-400 motion-safe:animate-pulse" />
                                    <span className="font-mono text-sm font-bold text-blue-100 tabular-nums">{timeLeft}</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider md:hidden">Claim</span> 
                              </motion.div>
                           </ShimmerBorder>
                        </ModalTrigger>
                        <ModalBody>
                            <BullRewardsCard />
                        </ModalBody>
                    </Modal>

                    {/* Socials Button with Blue Shimmer */}
                    <Modal>
                        <ModalTrigger className="w-full md:w-auto">
                            <ShimmerBorder borderRadius="rounded-lg" borderWidth="inset-px" speed={1.5} colorOverride="conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)">
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-transparent p-2.5 rounded-lg transition-colors w-full md:w-auto">
                                     <Users className="w-4 h-4 text-zinc-300" />
                                </motion.div>
                            </ShimmerBorder>
                        </ModalTrigger>
                        <ModalBody className="max-w-4xl p-0">
                             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6">
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-400" />
                                        <span className="animate-text-shimmer-blue">Community</span>
                                    </h3>
                                    <p className="text-neutral-400 text-sm">Follow for signals & rewards.</p>
                                </div>
                                <div className="w-full md:w-auto overflow-hidden">
                                    <SocialsRow />
                                </div>
                             </div>
                        </ModalBody>
                    </Modal>

                </div>
            </div>
          </PixelCard>
        </ShimmerBorder>
    </motion.div>
  );
};

export const PromoBanner = ({ children }: { children?: ReactNode }) => {
  return (
    <PixelCard variant="blue" gap={6} speed={10} noFocus={true} className="group relative z-50 w-full border-none bg-blue-950/20 py-3 backdrop-blur-md transition-colors hover:bg-blue-900/30 rounded-none">
      <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 shadow-[0_0_5px_rgba(59,130,246,0.5)]" /> 
      <div className="relative flex w-full items-center overflow-hidden">
        <div className="pointer-events-none absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-black via-transparent to-transparent" />
        <motion.div initial={{ x: "0%" }} animate={{ x: "-50%" }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="flex whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <PromoItem code="BULLMONEY" label="Vantage" />
              <Separator />
              <PromoItem code="X3R7P" label="XM Markets" />
              <Separator />
            </div>
          ))}
        </motion.div>
      </div>
      {children}
    </PixelCard>
  );
};

const PromoItem = ({ code, label }: { code: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { if (typeof navigator !== 'undefined' && navigator.clipboard) { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  return (
    <div onClick={handleCopy} className="mx-6 flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 transition-all hover:border-blue-500/30 hover:bg-blue-500/10 active:scale-95">
      <span className="text-xs font-medium uppercase tracking-widest text-blue-200/80 sm:text-sm">Use Code</span>
      <div className="relative flex items-center gap-2 rounded bg-white/10 px-2 py-0.5 font-mono text-sm font-bold text-white shadow-sm backdrop-blur-sm">
        {code}
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-blue-300" />}
      </div>
      <span className="text-xs font-bold text-blue-100 sm:text-sm">for {label}</span>
    </div>
  );
};

const Separator = () => (<div className="h-1 w-1 rounded-full bg-blue-500/50 shadow-[0_0_2px_#3b82f6]" />); 

// ==========================================
// NEW: Evervault Social Components
// ==========================================

const BrandIcons = {
  Youtube: (props: any) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>),
  Instagram: (props: any) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>),
  Discord: (props: any) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>),
  Telegram: (props: any) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.46-1.901-.903-1.056-.692-1.653-1.123-2.678-1.8-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.251.012.352z"/></svg>)
};

export const SocialsRow = () => {
  const marqueeSocials = useMemo(() => {
    const socials = [
      { href: "https://youtube.com/@bullmoney.online", Icon: BrandIcons.Youtube, color: "text-red-500", label: "YouTube" },
      { href: "https://www.instagram.com/bullmoney.online/", Icon: BrandIcons.Instagram, color: "text-pink-500", label: "Instagram" },
      { href: "https://discord.com/invite/9vVB44ZrNA", Icon: BrandIcons.Discord, color: "text-indigo-500", label: "Discord" },
      { href: "https://t.me/bullmoneyfx", Icon: BrandIcons.Telegram, color: "text-blue-400", label: "Telegram" },
    ];
    return [...socials, ...socials, ...socials, ...socials, ...socials, ...socials];
  }, []); 

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-0">
      <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
        <motion.div initial={{ x: 0 }} animate={{ x: "-16.666%" }} transition={{ duration: 45, ease: "linear", repeat: Infinity }} className="flex min-w-full items-center gap-6 px-4 sm:gap-10 will-change-transform">
          {marqueeSocials.map((s, i) => (<LightweightEvervaultCard key={`${s.label}-${i}`} {...s} />))}
        </motion.div>
      </div>
    </div>
  );
};

const LightweightEvervaultCard = ({ href, Icon, color, label }: { href: string; Icon: any; color: string; label: string }) => {
  let mouseX = useMotionValue(0); let mouseY = useMotionValue(0);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) { let { left, top } = currentTarget.getBoundingClientRect(); mouseX.set(clientX - left); mouseY.set(clientY - top); }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block h-28 w-28 shrink-0 sm:h-32 sm:w-32" onMouseMove={onMouseMove}>
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-950 border border-white/10">
        <div className="absolute inset-0 block sm:hidden">
            <div className="absolute inset-0 motion-safe:animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(59,130,246,0.2)_360deg)] opacity-50" /> 
        </div>
        <motion.div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-500 group-hover:opacity-100 hidden sm:block" style={{ background: useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.1), transparent 80%)` }} />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2">
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-500" /> 
                <Icon className={cn("h-8 w-8 transition-all duration-500 group-hover:scale-105", color)} /> 
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors group-hover:text-white">{label}</span>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" /> 
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]" /> 
      </div>
    </a>
  );
};

// ==========================================
// 7. OTHER CHARTS & TIMERS
// ==========================================

const MiniTradingChart = ({ width = 60, height = 24 }: { width?: number; height?: number }) => {
  const [path, setPath] = useState(""); const [areaPath, setAreaPath] = useState("");
  const dataPointsRef = useRef([20, 30, 25, 35, 30, 45, 40, 50, 45, 60]);
  const generatePaths = useCallback((data: number[]) => {
    const max = 70; const points = data.map((val, i) => { const x = (i / (data.length - 1)) * width; const y = height - (val / max) * height; return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
    return { line: `M${points}`, area: `M0,${height} L${points} L${width},${height} Z` };
  }, [width, height]);
  useEffect(() => {
    const initialPaths = generatePaths(dataPointsRef.current); setPath(initialPaths.line); setAreaPath(initialPaths.area);
    const updateChart = () => {
      const currentData = dataPointsRef.current; const last = currentData[currentData.length - 1] ?? 30; const change = (Math.random() - 0.45) * 8; let newValue = Math.max(10, Math.min(65, last + change));
      const newData = [...currentData.slice(1), newValue]; dataPointsRef.current = newData; const paths = generatePaths(newData); setPath(paths.line); setAreaPath(paths.area);
    };
    const interval = setInterval(updateChart, 1000); return () => clearInterval(interval);
  }, [generatePaths]);
  if (!path) return <div style={{ width, height }} className="animate-pulse bg-green-500/10 rounded" />;
  return (
    <div style={{ width, height }} className="relative overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" /><stop offset="100%" stopColor="#4ade80" stopOpacity="0" /></linearGradient>
        </defs>
        <motion.path d={areaPath} fill="url(#chartFill)" stroke="none" animate={{ d: areaPath }} transition={{ duration: 1.5, ease: "linear" }} /> 
        <motion.path d={path} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ d: path }} transition={{ duration: 1.5, ease: "linear" }} style={{ filter: "drop-shadow(0 0 1px rgba(74, 222, 128, 0.5))" }} /> 
      </svg>
    </div>
  );
}

const BackgroundGrids = React.memo(() => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-15"> 
      <div className="absolute left-1/2 top-0 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[80px]" /> 
      <div className="absolute bottom-0 h-full w-full bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    </div>
  );
});
BackgroundGrids.displayName = "BackgroundGrids";