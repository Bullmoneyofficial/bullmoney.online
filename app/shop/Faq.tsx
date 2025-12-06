import React, { useState, useRef, useEffect, useMemo, CSSProperties, PropsWithChildren } from 'react';
import { motion } from 'framer-motion'; 
import { gsap } from 'gsap'; 
import { ChevronDown, HelpCircle, Zap, ShieldAlert, Instagram, Youtube, Send, MessageSquare } from 'lucide-react';

// ==========================================
// 1. STYLE INJECTION (Replaces CSS files)
// ==========================================
const injectGlobalStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'bullmoney-integrated-styles';
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    /* TrueFocus Styles */
    .focus-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
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
      border: 1px solid var(--border-color, #3b82f6);
      box-shadow: 0 0 20px var(--glow-color, rgba(59,130,246,0.6));
      border-radius: 8px;
      z-index: 10;
      background: rgba(59, 130, 246, 0.05);
    }
    .corner {
      position: absolute;
      width: 10px;
      height: 10px;
      border-color: var(--border-color, #3b82f6);
      border-style: solid;
    }
    .top-left { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .top-right { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .bottom-left { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    .bottom-right { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    /* GradualBlur Styles */
    .gradual-blur { pointer-events: none; transition: opacity 0.3s ease-out; }
    .gradual-blur-inner { pointer-events: none; }
  `;
  document.head.appendChild(styleElement);
};

// ==========================================
// 2. COMPONENT: TRUE FOCUS (Title)
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

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = '#3b82f6',
  glowColor = 'rgba(59, 130, 246, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);
      return () => clearInterval(interval);
    }
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

  const handleMouseEnter = (index: number) => {
    if (manualMode) {
      setLastActiveIndex(index);
      setCurrentIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (manualMode) {
      setCurrentIndex(lastActiveIndex ?? 0);
    }
  };

  return (
    <div className="focus-container" ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={el => { if (el) wordRefs.current[index] = el; }}
            className={`focus-word ${manualMode ? 'manual' : ''} ${isActive && !manualMode ? 'active' : ''}`}
            style={{
              filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.5,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
              '--border-color': borderColor,
              '--glow-color': glowColor
            } as React.CSSProperties}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
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
// 3. COMPONENT: GRADUAL BLUR (Background)
// ==========================================
const nativeMath = {
  pow: Math.pow,
  round: Math.round
};

type GradualBlurProps = {
  position?: 'top' | 'bottom' | 'left' | 'right';
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | 'scroll';
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  preset?: string;
  gpuOptimized?: boolean;
  hoverIntensity?: number;
  target?: 'parent' | 'page';
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_BLUR_CONFIG: Partial<GradualBlurProps> = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {}
};

const BLUR_PRESETS: Record<string, Partial<GradualBlurProps>> = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
};

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: p => p,
  bezier: p => p * p * (3 - 2 * p),
  'ease-in': p => p * p,
  'ease-out': p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
};

const getGradientDirection = (position: string): string => {
  const directions: Record<string, string> = {
    top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right'
  };
  return directions[position] || 'to bottom';
};

const GradualBlur: React.FC<PropsWithChildren<GradualBlurProps>> = props => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig = props.preset && BLUR_PRESETS[props.preset] ? BLUR_PRESETS[props.preset] : {};
    return { ...DEFAULT_BLUR_CONFIG, ...presetConfig, ...props } as Required<GradualBlurProps>;
  }, [props]);

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / config.divCount;
    const currentStrength = isHovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= config.divCount; i++) {
      let progress = i / config.divCount;
      progress = curveFunc(progress);
      
      let blurValue: number;
      if (config.exponential) {
        blurValue = Number(nativeMath.pow(2, progress * 4)) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * config.divCount + 1) * currentStrength;
      }

      const p1 = nativeMath.round((increment * i - increment) * 10) / 10;
      const p2 = nativeMath.round(increment * i * 10) / 10;
      const p3 = nativeMath.round((increment * i + increment) * 10) / 10;
      const p4 = nativeMath.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position);

      const divStyle: CSSProperties = {
        position: 'absolute',
        inset: '0',
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        zIndex: config.zIndex,
      };

      divs.push(<div key={i} style={divStyle} />);
    }
    return divs;
  }, [config, isHovered]);

  const containerStyle: CSSProperties = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes(config.position);
    const baseStyle: CSSProperties = {
      position: config.target === 'page' ? 'fixed' : 'absolute',
      pointerEvents: 'none',
      zIndex: config.zIndex,
      ...config.style
    };

    if (isVertical) {
      baseStyle.height = config.height;
      baseStyle.width = config.width || '100%';
      baseStyle[config.position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    }
    return baseStyle;
  }, [config]);

  return (
    <div ref={containerRef} className={`gradual-blur ${config.className}`} style={containerStyle}>
      <div className="gradual-blur-inner" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {blurDivs}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN FAQ COMPONENTS
// ==========================================

// --- Types ---
interface FaqItemData {
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItemData[] = [
  {
    question: "Where can I see real results?",
    answer: (
      <span>
        We value discretion and results over words. We encourage you to visit our social media channels to witness our community culture.
        <div className="flex gap-4 mt-6">
           <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors border border-white/10 px-3 py-1 rounded-full hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"><Instagram size={14}/> Instagram</a>
           <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors border border-white/10 px-3 py-1 rounded-full hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"><Youtube size={14}/> YouTube</a>
           <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition-colors border border-white/10 px-3 py-1 rounded-full hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(147,197,253,0.5)]"><Send size={14}/> Telegram</a>
        </div>
      </span>
    ),
  },
  {
    question: "Do you provide Trading Signals?",
    answer: "No. BullMoney is strictly an educational and mentorship community. We do not provide 'signals' for blind copying. We share high-probability setups and market analysis to help you make your own informed decisions.",
  },
  {
    question: "What is the difference between Free and VIP?",
    answer: (
      <div className="space-y-4">
        <p>Free access provides a glimpse into our world. VIP is for those ready to commit.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-black/40 rounded border border-white/10">
             <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Free Access</h4>
             <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Public Chat</li>
                <li>Occasional Streams</li>
             </ul>
          </div>
          <div className="p-4 bg-blue-900/20 rounded border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
             <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Zap size={12} className="fill-current"/> VIP Access</h4>
             <ul className="text-sm text-blue-100/90 space-y-2 list-disc list-inside">
                <li>Daily Live Trading</li>
                <li>Daily Premium Setups</li>
                <li>Private Mentor</li>
             </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    question: "Is this financial advice?",
    answer: "Absolutely not. All content provided by BullMoney is for educational purposes only. Trading involves high risk.",
  },
  {
    question: "Are there country restrictions?",
    answer: "BullMoney operates globally. However, it is your responsibility to ensure compliance with your local laws.",
  }
];

// --- EVERVAULT CARD ---
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
      className={`group/card relative overflow-hidden bg-transparent ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/80" />
        <div 
          className="absolute inset-0 break-all font-mono text-[10px] font-bold text-white/5 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            maskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
            WebkitMaskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`,
          }}
        >
          {randomString}
        </div>
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 mix-blend-overlay"
          style={{
             background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(37,99,235,0.4), transparent 80%)`
          }}
        />
      </div>
      <div 
          className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 pointer-events-none"
          style={{
             background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.15), transparent 40%)`
          }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// --- FAQ Item ---
interface FAQItemProps {
  item: FaqItemData;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ item, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(contentRef.current, { height: 'auto', duration: 0.5, ease: 'power3.out' });
      gsap.to(contentRef.current, { opacity: 1, duration: 0.4, delay: 0.1 });
    } else {
      gsap.to(contentRef.current, { height: 0, duration: 0.4, ease: 'power3.in' });
      gsap.to(contentRef.current, { opacity: 0, duration: 0.2 });
    }
  }, [isOpen]);

  return (
    <div className="border-b border-white/10 last:border-none">
      <EvervaultCard className="transition-colors duration-300">
        <button
          onClick={onToggle}
          className="relative flex justify-between items-center w-full px-8 py-8 text-left focus:outline-none z-20"
          aria-expanded={isOpen}
        >
          <span className={`font-bold text-lg uppercase tracking-wider transition-all duration-300 ${isOpen ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-gray-200'}`}>
            {item.question}
          </span>
          <div className={`ml-4 flex-shrink-0 transition-transform duration-500 ${isOpen ? 'rotate-180 text-blue-400' : 'text-gray-500'}`}>
            <ChevronDown className="w-6 h-6" />
          </div>
        </button>
        <div ref={contentRef} className="h-0 overflow-hidden">
          <div className="px-8 pb-8 pt-2 relative z-20">
             <div className={`text-base leading-relaxed max-w-4xl transition-all duration-500 ${isOpen ? 'text-blue-100 drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]' : 'text-gray-400'}`}>
               {item.answer}
             </div>
          </div>
        </div>
      </EvervaultCard>
    </div>
  );
};

// --- Main BullMoneyFAQ ---
const BullMoneyFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    // Inject styles on mount
    injectGlobalStyles();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-black px-4 py-24 overflow-hidden font-sans">
      
      {/* GLOBAL BLUR ELEMENTS (Cinematic Edges) */}
      <GradualBlur position="top" height="150px" strength={2} zIndex={5} />
      <GradualBlur position="bottom" height="150px" strength={2} zIndex={5} />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative w-full max-w-5xl mx-auto z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20 space-y-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950 to-black border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.15)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <HelpCircle className="w-8 h-8 text-blue-400 relative z-10" />
            </div>
          </div>
          
          {/* Integrated TrueFocus Component as Title */}
          <div className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase flex justify-center py-2">
            <TrueFocus 
              sentence="Frequently Asked Questions"
              manualMode={false}
              blurAmount={5}
              borderColor="#3b82f6"
              glowColor="rgba(59, 130, 246, 0.6)"
              animationDuration={0.4}
            />
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500/50"></div>
            <p className="text-sm md:text-base text-gray-400 uppercase tracking-[0.3em] font-medium">
              Built for those who want more
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500/50"></div>
          </div>
        </div>

        {/* FAQ List with Evervault Effect */}
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl relative">
          {/* Internal Blurs for the list container */}
          <GradualBlur position="top" height="20px" strength={1} opacity={0.5} zIndex={20} />
          
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              item={faq} 
              isOpen={openIndex === index} 
              onToggle={() => toggleFAQ(index)} 
            />
          ))}

          <GradualBlur position="bottom" height="20px" strength={1} opacity={0.5} zIndex={20} />
        </div>

        {/* Support Button Section - UPDATED TO LINK */}
        <div className="mt-16 flex justify-center">
            <EvervaultCard className="rounded-full overflow-hidden p-[1px]">
               <a 
                 href="https://t.me/+dlP_A0ebMXs3NTg0"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="relative px-8 py-4 bg-black rounded-full flex items-center gap-3 group transition-all duration-300 hover:bg-blue-950/30 no-underline"
               >
                  <div className="absolute inset-0 rounded-full border border-blue-500/30 opacity-50 group-hover:opacity-100 group-hover:border-blue-400 transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.0)] group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"></div>
                  <MessageSquare className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                  <span className="text-gray-300 font-bold tracking-wider uppercase text-sm group-hover:text-white transition-colors">
                     Open Support Chat
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
               </a>
            </EvervaultCard>
        </div>

        {/* FOOTER */}
        <div className="mt-20 border-t border-white/5 pt-10 text-center md:text-left relative">
           <div className="flex flex-col md:flex-row items-start gap-4 text-xs text-gray-600">
             <ShieldAlert className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />
             <div className="space-y-2">
                <h4 className="font-bold text-gray-500 uppercase tracking-widest">Risk Disclosure</h4>
                <p>BullMoney is an educational platform providing information and training on financial markets and trading, and does not offer financial advice. All content is for educational and informational purposes only, and trading or investing involves substantial risks that can lead to significant financial loss. We strongly advise you to consult a qualified financial advisor before making any investment decisions. BullMoney makes no guarantees regarding financial outcomes, and we are not responsible for any losses or damages arising from the use of our materials, services, or participation in trades or investments. By using our services, you acknowledge and accept that any financial decisions are your sole responsibility. This disclaimer applies worldwide and complies with local laws and regulations in your jurisdiction, including [insert your country], and you should seek professional legal and financial advice to ensure compliance with applicable regulations in your region.</p>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default BullMoneyFAQ;