"use client";

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useMemo
} from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { 
  motion, 
  AnimatePresence
} from 'framer-motion';
import {
  X,
  ChevronDown,
  Send,
  ShieldAlert,
  MessageSquare,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import { useUIState } from '@/contexts/UIStateContext';

// ==========================================
// 0. CONFIGURATION & CONSTANTS
// ==========================================

const SUPPORT_URL = "https://t.me/+dlP_A0ebMXs3NTg0";

// Theme Configuration (BullMoney Blue Style)
const THEME = {
  primary: "#ffffff", // Blue-500
  glow: "rgba(255, 255, 255, 0.6)",
  bg: "#000000",
  text: "#ffffff",
  border: "rgba(255, 255, 255, 0.2)"
};

// ==========================================
// 1. DATA: BULLMONEY CONTENT MAPPED TO MENU
// ==========================================

interface FAQItemData {
  name: string; // The Question
  answer: string | React.ReactNode; // The Answer
}

interface FAQCategoryData {
  category: string;
  items: FAQItemData[];
  notes?: string[];
}

export const FAQ_CONTENT: FAQCategoryData[] = [
  {
    category: "General Info",
    items: [
      { 
        name: "Where can I see real results?", 
        answer: "We value discretion and results over words. We encourage you to visit our social media channels to witness our community culture."
      },
      { 
        name: "Are there country restrictions?", 
        answer: "BullMoney operates globally. However, it is your responsibility to ensure compliance with your local laws regarding financial trading."
      },
    ],
  },
  {
    category: "Methodology",
    items: [
      { 
        name: "Do you provide Trade Setups?", 
        answer: "BullMoney is strictly an educational and mentorship community. We share high-probability setups and market analysis to help you make your own informed decisions, not blind copy trades."
      },
      { 
        name: "Is this financial advice?", 
        answer: "Absolutely not. All content provided by BullMoney is for educational purposes only. Trading involves high risk and you should consult a professional."
      },
    ],
  },
  {
    category: "Membership",
    items: [
      { 
        name: "Free vs VIP Access", 
        answer: (
          <div className="space-y-2">
             <p><strong>Free Access:</strong> Provides a glimpse into our world with Public Chat and occasional streams.</p>
             <p className="text-white"><strong>VIP Access:</strong> Includes Daily Live Trading, Daily Premium Setups, and a Private Mentor.</p>
          </div>
        )
      },
      { 
        name: "How do I join?", 
        answer: "Click the 'Open Support Chat' button below to get started with our onboarding process."
      },
    ],
  },
];

// ==========================================
// 2. GLOBAL CSS INJECTION
//    (Updated colors to Blue)
// ==========================================

const injectGlobalStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'bullmoney-integrated-styles';
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    /* --- 1. TRUE FOCUS STYLES (Title Animation) --- */
    .focus-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 1rem;
      position: relative;
    }
    .focus-word {
      position: relative;
      cursor: pointer;
      display: inline-block;
      padding: 0.2rem 0.5rem;
      will-change: filter;
    }
    .focus-frame {
      position: absolute;
      pointer-events: none;
      border: 1px solid var(--border-color, #ffffff);
      box-shadow: 0 0 20px var(--glow-color, rgba(255, 255, 255, 0.6));
      border-radius: 8px;
      z-index: 10;
      background: rgba(255, 255, 255, 0.05);
    }
    .corner {
      position: absolute;
      width: 10px;
      height: 10px;
      border-color: var(--border-color, #ffffff);
      border-style: solid;
    }
    .top-left { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .top-right { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .bottom-left { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    .bottom-right { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    /* --- 2. GRADUAL BLUR --- */
    .gradual-blur { pointer-events: none; transition: opacity 0.3s ease-out; }
    .gradual-blur-inner { pointer-events: none; }

    /* --- 3. MARQUEE STYLES --- */
    .menu-wrap {
      position: relative;
      overflow: hidden;
      width: 100%;
    }

    .menu__item {
      position: relative;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: transparent;
    }

    .menu__item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      padding: 1.5rem 0.5rem;
      z-index: 10;
      text-decoration: none;
      color: currentColor;
      cursor: pointer;
      background: transparent;
      width: 100%;
      overflow: hidden;
    }

    /* Marquee Container */
    .marquee {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
      background: #000; 
      transform: translate3d(0, 101%, 0);
    }

    .marquee__inner-wrap {
      width: 100%;
      height: 100%;
      transform: translate3d(0, -101%, 0);
    }

    .marquee__inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      position: relative;
      animation: marquee 15s linear infinite; 
      will-change: transform;
    }

    .marquee__content {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .marquee__text {
      font-size: 3rem;
      font-weight: 900;
      text-transform: uppercase;
      color: rgba(255,255,255,0.05);
      -webkit-text-stroke: 1px rgba(255, 255, 255, 0.3); /* Blue Stroke */
      white-space: nowrap;
      padding: 0 1rem;
      font-style: italic;
    }

    @keyframes marquee {
      from { transform: translate3d(0, 0, 0); }
      to { transform: translate3d(-50%, 0, 0); } 
    }
  `;
  document.head.appendChild(styleElement);
};

// ==========================================
// 3. UTILITY COMPONENTS
// ==========================================

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// 4. ANIMATION: TRUE FOCUS
// ==========================================
interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = THEME.primary,
  glowColor = THEME.glow,
  animationDuration = 0.5,
  pauseBetweenAnimations = 1
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex, words.length]);

  return (
    <div className="focus-container" ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={el => { if (el) wordRefs.current[index] = el; }}
            className={`focus-word ${isActive ? 'active' : ''}`}
            style={{
              filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.3,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
              color: isActive ? '#fff' : '#aaa'
            } as React.CSSProperties}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="focus-frame"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0
        }}
        transition={{ duration: animationDuration }}
        style={{ '--border-color': borderColor, '--glow-color': glowColor } as React.CSSProperties}
      >
        <span className="corner top-left"></span>
        <span className="corner top-right"></span>
        <span className="corner bottom-left"></span>
        <span className="corner bottom-right"></span>
      </motion.div>
    </div>
  );
};

// ==========================================
// 5. ANIMATION: GRADUAL BLUR
// ==========================================
const GradualBlur = ({ position = 'bottom', zIndex = 50 }: { position?: 'top' | 'bottom', zIndex?: number }) => {
    return (
        <div 
            style={{
                position: 'absolute',
                [position]: 0,
                left: 0,
                right: 0,
                height: '100px',
                zIndex: zIndex,
                pointerEvents: 'none',
                background: `linear-gradient(${position === 'top' ? 'to bottom' : 'to top'}, #000 10%, transparent)`
            }} 
        />
    );
};

// ==========================================
// 6. ANIMATION: EVERVAULT CARD
// ==========================================
const EvervaultCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const randomString = useMemo(() => {
    const chars = "XY30BULLMONEY101010101010101";
    let str = "";
    for (let i = 0; i < 1500; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`group/card relative overflow-hidden bg-transparent surface elevate-2 accent-border ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/80" />
        {/* Encrypted Text Layer */}
        <div 
          className="absolute inset-0 break-all font-mono text-[10px] font-bold text-white/5 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            maskImage: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
            WebkitMaskImage: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
          }}
        >
          {randomString}
        </div>
        {/* Glow Layer */}
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 mix-blend-overlay"
          style={{
             background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${THEME.glow}, transparent 80%)`
          }}
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 8. FAQ DETAIL COMPONENT (ADAPTED) - Static Neon Style
// ==========================================

const FAQDetailItem = ({ item }: { item: FAQItemData }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.3)' }} className="last:border-0">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex justify-between items-center py-4 cursor-pointer group transition-all duration-200 px-3 -mx-3 rounded hover:bg-white/5"
        >
          <div className="flex flex-col flex-1">
             <div className="flex items-center gap-2">
                <span className="font-medium text-sm md:text-base uppercase tracking-wider transition-colors" style={{ color: '#ffffff', textShadow: '0 0 4px rgba(255, 255, 255, 0.4)' }}>
                    {item.name}
                </span>
             </div>
          </div>
          
          <span style={{ color: '#ffffff', filter: 'drop-shadow(0 0 4px #ffffff)' }}>
             <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
          </span>
        </div>
  
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pb-6 pt-2 px-4 text-sm">
                <div className="space-y-4 p-5 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 0 8px rgba(255, 255, 255, 0.2)' }}>
                   <div className="leading-relaxed text-sm opacity-90" style={{ color: '#ffffff', textShadow: '0 0 2px rgba(255, 255, 255, 0.3)' }}>
                      {item.answer}
                   </div>
                   
                   <a 
                     href={SUPPORT_URL} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block w-full text-center mt-4 py-3 text-xs font-bold uppercase tracking-widest rounded transition-all"
                     style={{
                       border: '2px solid #ffffff',
                       color: '#ffffff',
                       textShadow: '0 0 4px #ffffff',
                       boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                     }}
                   >
                       Contact Support
                   </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
};

// ==========================================
// 9. CATEGORY ITEM (MARQUEE + EVERVAULT) - Static Neon Style
// ==========================================

function FAQCategoryItem({ data }: { data: FAQCategoryData }) {
  const [isOpen, setIsOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);

  // Marquee Logic
  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number) => {
    const topEdgeDist = (mouseX - width / 2) ** 2 + (mouseY - 0) ** 2;
    const bottomEdgeDist = (mouseX - width / 2) ** 2 + (mouseY - height) ** 2;
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const edge = findClosestEdge(x, y, rect.width, rect.height);

    gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const repeatedMarqueeContent = Array.from({ length: 6 }).map((_, idx) => (
    <div key={idx} className="marquee__content">
      <span className="marquee__text" style={{ color: '#ffffff', textShadow: '0 0 8px #ffffff' }}>{data.category}</span>
    </div>
  ));

  return (
    <div className="menu__item bg-black" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
      <EvervaultCard className="relative overflow-hidden group">
          <div 
            ref={itemRef} 
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden cursor-pointer"
          >
            <div className="menu__item-header relative z-20 px-6 py-8">
                <span className={cn(
                    "text-2xl md:text-4xl font-light tracking-tight transition-opacity duration-300 group-hover:opacity-0"
                )} style={{ color: '#ffffff', textShadow: '0 0 8px rgba(255, 255, 255, 0.5)' }}>
                  {data.category}
                </span>
                <div style={{ color: '#ffffff', filter: 'drop-shadow(0 0 4px #ffffff)' }}>
                   <ChevronDown className={cn("w-6 h-6 transition-transform duration-300", isOpen && "rotate-180")} />
                </div>
            </div>
          
            <div className="marquee" ref={marqueeRef}>
                <div className="marquee__inner-wrap" ref={marqueeInnerRef}>
                <div className="marquee__inner" aria-hidden="true">
                    {repeatedMarqueeContent}
                </div>
                </div>
            </div>
          </div>
      </EvervaultCard>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden bg-black/50"
          >
            <div className="px-6 py-6 md:px-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                <div className="grid gap-2 max-w-4xl mx-auto">
                    {data.items.map((item, i) => (
                        <FAQDetailItem key={i} item={item} />
                    ))}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FaqModalContent = ({ onClose }: { onClose: () => void }) => {
  const [faqData, setFaqData] = useState<FAQCategoryData[]>(FAQ_CONTENT);

  useEffect(() => {
    const loadFaq = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('faq_content')
          .select('content')
          .eq('id', 'main')
          .single();
        if (!error && data?.content) {
          setFaqData(data.content as FAQCategoryData[]);
        }
      } catch (err) {
        console.error('[FAQ] Failed to load FAQ content:', err);
      }
    };
    loadFaq();
  }, []);

  const FaqItemRow = ({ item }: { item: FAQItemData }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="border-b border-black/10 last:border-0">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between gap-4 py-3 text-left"
        >
          <span className="text-sm md:text-base font-medium text-black">{item.name}</span>
          <ChevronDown className={cn('w-4 h-4 text-black/60 transition-transform', expanded && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-4 text-sm text-black/70 leading-relaxed">
                {item.answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const FaqCategoryCard = ({ data }: { data: FAQCategoryData }) => {
    const [open, setOpen] = useState(false);

    return (
      <div className="rounded-2xl border border-black/10 bg-white">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 md:px-5 py-4 text-left"
        >
          <span className="text-base md:text-lg font-medium text-black">{data.category}</span>
          <ChevronDown className={cn('w-5 h-5 text-black/60 transition-transform', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-black/10 px-4 md:px-5"
            >
              <div className="py-2">
                {data.items.map((item, idx) => (
                  <FaqItemRow key={`${data.category}-${idx}`} item={item} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="space-y-6">
          <div className="p-4 md:p-5 rounded-2xl border border-black/10 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-medium text-black">Frequently Asked Questions</h3>
                <p className="text-xs md:text-sm text-black/50">Fast answers to the most common questions.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {faqData.map((cat, idx) => (
              <FaqCategoryCard key={`${cat.category}-${idx}`} data={cat} />
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 md:px-5 py-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-black/60">
              <ShieldAlert className="w-4 h-4 text-black/40" />
              <span>Trading involves risk. No financial advice.</span>
            </div>
            <a
              href={SUPPORT_URL}
              className="text-xs md:text-sm font-medium text-black hover:text-black/70 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Telegram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 p-4 md:p-6 bg-white">
        <div className="flex justify-end">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{ background: '#111111', color: '#ffffff' }}
          >
            Open Support Chat
            <MessageSquare className="w-4 h-4" />
          </a>
        </div>
      </div>
    </>
  );
}

// ==========================================
// 10. MAIN COMPONENT EXPORT - Static Neon Style
// ==========================================
export default function BullMoneyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { shouldSkipHeavyEffects } = useUIState();

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={shouldSkipHeavyEffects ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldSkipHeavyEffects ? undefined : { opacity: 0 }}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ zIndex: 2147483648, background: shouldSkipHeavyEffects ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.2)' }}
          />

          <motion.div
            initial={shouldSkipHeavyEffects ? false : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={shouldSkipHeavyEffects ? undefined : (isDesktop ? { y: '-100%' } : { x: '100%' })}
            transition={shouldSkipHeavyEffects ? { duration: 0 } : { type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh] overflow-hidden'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom overflow-hidden'
            }
            style={{ zIndex: 2147483649, color: '#1d1d1f', backgroundColor: '#ffffff', colorScheme: 'light' as const }}
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="leading-tight text-center">
                  <h2 className="text-lg md:text-xl font-light">FAQ</h2>
                  <p className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>BullMoney support</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <FaqModalContent onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
