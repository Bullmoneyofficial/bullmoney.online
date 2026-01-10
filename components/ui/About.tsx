'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  createElement,
  useContext,
  createContext,
} from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useMotionTemplate, 
  useTransform 
} from 'framer-motion';

// IMPORT YOUR CONTEXT HERE
// Adjust the path to where you saved the 'StudioContext.tsx' file
import { useStudio } from '@/context/StudioContext'; 

// ==========================================
// 0. UTILS & ICONS
// ==========================================

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

// ==========================================
// 1. ANIMATED MODAL SYSTEM
// ==========================================

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [open]);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export function Modal({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        'relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-50 group',
        className
      )}
      onClick={() => setOpen(true)}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#a1a1aa_50%,#000000_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#ffffff_50%,#000000_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-black px-8 py-1 text-sm font-medium text-black dark:text-white backdrop-blur-3xl transition-colors">
        {children}
      </span>
    </button>
  );
};

export const ModalBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center h-full w-full bg-zinc-100/10 dark:bg-black/40"
        >
          <Overlay />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={cn(
              'relative w-[90%] md:w-[80%] max-w-4xl max-h-[90%] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col',
              className
            )}
          >
            <CloseButton />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ModalContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex-1 overflow-y-auto p-6 md:p-10', className)}>
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex justify-end gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      {children}
    </div>
  );
};

const Overlay = ({ className }: { className?: string }) => {
  const { setOpen } = useModal();
  return (
    <div
      className={cn('absolute inset-0 z-[-1] bg-transparent', className)}
      onClick={() => setOpen(false)}
    />
  );
};

const CloseButton = () => {
  const { setOpen } = useModal();
  return (
    <button
      onClick={() => setOpen(false)}
      className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
    >
      <CloseIcon className="w-4 h-4 text-black dark:text-white" />
    </button>
  );
};

// ==========================================
// 2. TEXT TYPE COMPONENT
// ==========================================

const TextType = React.memo(function TextType({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: any) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return;
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;
    let timeout: NodeJS.Timeout;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode
      ? currentText.split('').reverse().join('')
      : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          if (onSentenceComplete)
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText((prev) => prev + processedText[currentCharIndex]);
              setCurrentCharIndex((prev) => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }
    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
    getRandomSpeed,
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `${className}`,
      ...props,
    },
    <span style={{ color: getCurrentTextColor() || 'inherit' }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`${cursorClassName} inline-block ml-1 font-normal`}
        style={{ opacity: shouldHideCursor ? 0 : 1 }}
      >
        {cursorCharacter}
      </span>
    )
  );
});

// ==========================================
// 3. MAGIC BENTO COMPONENT
// ==========================================

interface MagicBentoProps {
  children: React.ReactNode;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
  className?: string;
  borderColorClass?: string;
}

const MagicBento: React.FC<MagicBentoProps> = ({
  children,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  spotlightRadius = 300,
  particleCount = 12,
  glowColor = '255, 255, 255',
  className = '',
  borderColorClass = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isHoveredVal = useMotionValue(0); 

  const [stars, setStars] = useState<
    Array<{ top: number; left: number; delay: number }>
  >([]);

  useEffect(() => {
    if (enableStars) {
      const newStars = Array.from({ length: particleCount }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 5,
      }));
      setStars(newStars);
    }
  }, [enableStars, particleCount]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseEnter = () => isHoveredVal.set(1);
  const handleMouseLeave = () => {
    isHoveredVal.set(0);
    mouseX.set(0);
    mouseY.set(0);
  };

  const rotateX = useTransform(mouseY, (value) => {
    if (!containerRef.current || !enableTilt) return 0;
    const height = containerRef.current.getBoundingClientRect().height;
    const centerY = height / 2;
    return ((value - centerY) / centerY) * -5;
  });

  const rotateY = useTransform(mouseX, (value) => {
    if (!containerRef.current || !enableTilt) return 0;
    const width = containerRef.current.getBoundingClientRect().width;
    const centerX = width / 2;
    return ((value - centerX) / centerX) * 5;
  });

  const spotlightBackground = useMotionTemplate`radial-gradient(${spotlightRadius}px circle at ${mouseX}px ${mouseY}px, rgba(${glowColor}, 0.15), transparent 80%)`;
  const spotlightMask = useMotionTemplate`radial-gradient(${spotlightRadius}px circle at ${mouseX}px ${mouseY}px, black, transparent)`;
  const borderOpacity = useTransform(isHoveredVal, [0, 1], [0, 0.6]);
  const spotlightOpacity = useTransform(isHoveredVal, [0, 1], [0, 1]);

  const boxShadow = useTransform(isHoveredVal, [0, 1], 
     enableBorderGlow 
      ? [`0 10px 15px -3px rgba(0, 0, 0, 0.1)`, `0 0 30px -5px rgba(${glowColor}, 0.5)`]
      : [`0 10px 15px -3px rgba(0, 0, 0, 0.1)`, `0 10px 15px -3px rgba(0, 0, 0, 0.1)`]
  );

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl transition-all duration-200 ease-out border ${borderColorClass} ${className}`}
      style={{
        perspective: enableTilt ? "1000px" : "none",
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        boxShadow: boxShadow
      }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          background: enableSpotlight ? spotlightBackground : 'transparent',
          opacity: spotlightOpacity,
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 border-2 rounded-2xl transition-opacity duration-300"
        style={{
          borderColor: `rgba(${glowColor}, 1)`, 
          opacity: borderOpacity,
          maskImage: enableSpotlight ? spotlightMask : 'none',
          WebkitMaskImage: enableSpotlight ? spotlightMask : 'none',
        }}
      />
      {enableStars &&
        stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-black/50 dark:bg-white opacity-80 animate-pulse pointer-events-none z-0"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.delay % 2 === 0 ? '2px' : '3px',
              height: star.delay % 2 === 0 ? '2px' : '3px',
              animationDuration: `${3 + star.delay}s`,
              boxShadow: `0 0 4px rgba(${glowColor}, 0.8)`,
            }}
          />
        ))}
      <div
        className={`relative z-10 h-full w-full opacity-100 transition-opacity duration-300`}
      >
        {children}
      </div>
    </motion.div>
  );
};

// ==========================================
// 4. MAIN IMPLEMENTATION (Alexa Studio Modal - Integrated)
// ==========================================

export default function AlexaStudioModal() {
  // 1. CONSUME THE CONTEXT
  const { state } = useStudio();
  const { about, hero, serviceCategories } = state;

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      
      const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);
  
  const monoHighlightClass = "text-black dark:text-white dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]";
  const subTextClass = "text-zinc-600 dark:text-zinc-400";
  const monoGlowRGB = isDarkMode ? "255, 255, 255" : "0, 0, 0"; 

  // Create a dynamic array for the typing animation based on database values
  const typingTexts = useMemo(() => {
    const list = [];
    if (about.subtitle) list.push(about.subtitle);
    if (hero.beam_text_1) list.push(hero.beam_text_1);
    if (hero.beam_text_2) list.push(hero.beam_text_2);
    if (hero.beam_text_3) list.push(hero.beam_text_3);
    
    // Fallback if DB is empty
    return list.length > 0 ? list : ["Realça a tua melhor versão.", "Precisão e conforto."];
  }, [about.subtitle, hero.beam_text_1, hero.beam_text_2, hero.beam_text_3]);

  return (
      <Modal>
        {/* === SHIMMER TRIGGER BUTTON === */}
        <ModalTrigger>
            <span className="flex items-center gap-2">
                Sobre Nós <SparklesIcon className="w-4 h-4" />
            </span>
        </ModalTrigger>

        {/* === MODAL BODY === */}
        <ModalBody className="dark:bg-black bg-white">
          <ModalContent>
            
            <div className="w-full flex flex-col items-center">
                {/* Header Section */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 uppercase text-black dark:text-white">
                    {about.title}
                    </h1>
                    
                    {/* Header Typing Animation - Now using Supabase data */}
                    <div className={`text-sm md:text-lg font-light tracking-wide uppercase min-h-[30px] ${subTextClass}`}>
                    <TextType 
                        text={typingTexts}
                        typingSpeed={50}
                        deletingSpeed={30}
                        pauseDuration={2000}
                        cursorCharacter="|"
                        cursorClassName={monoHighlightClass}
                    />
                    </div>
                </div>

                {/* Magic Bento Content */}
                <MagicBento 
                    textAutoHide={false} 
                    enableStars={true}
                    enableSpotlight={true}
                    enableBorderGlow={true}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    spotlightRadius={350}
                    particleCount={25}
                    glowColor={monoGlowRGB} 
                    borderColorClass="border-zinc-300 dark:border-zinc-800"
                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-6 md:p-8 w-full shadow-inner"
                >
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="flex flex-col items-center md:items-start">
                                <h2 className="text-lg uppercase tracking-[0.2em] font-bold mb-1 text-black dark:text-white">
                                Sobre Nós
                                </h2>
                                <div className="h-0.5 w-12 bg-black dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                            </div>
                            
                            {/* Paragraph 1 from Supabase (description_1) */}
                            <div className={`leading-relaxed text-sm md:text-base font-light ${subTextClass}`}>
                                <TextType
                                    text={about.description_1}
                                    loop={false}
                                    typingSpeed={15}
                                    showCursor={false}
                                    startOnVisible={true}
                                />
                            </div>

                            {/* Paragraph 2 from Supabase (description_2) */}
                            <div className={`leading-relaxed text-sm md:text-base font-light ${subTextClass}`}>
                                <TextType
                                    text={about.description_2}
                                    loop={false}
                                    typingSpeed={15}
                                    initialDelay={1500}
                                    showCursor={false}
                                    startOnVisible={true}
                                />
                            </div>
                        </div>

                        <div>
                            <p className={`text-xs uppercase tracking-widest mb-3 text-center md:text-left ${subTextClass}`}>Os nossos serviços</p>
                            
                            {/* Service Grid - Dynamic from Supabase */}
                            <div className="grid grid-cols-2 gap-3">
                                {serviceCategories.length > 0 ? (
                                    serviceCategories.map((service) => (
                                        <div 
                                        key={service.id} 
                                        className="text-center py-2 px-3 rounded text-xs md:text-sm uppercase tracking-wider font-medium border transition-transform hover:-translate-y-1 bg-white border-zinc-200 text-zinc-800 shadow-sm dark:bg-black dark:border-zinc-800 dark:text-zinc-200 hover:border-black dark:hover:border-white"
                                        >
                                        {service.name}
                                        </div>
                                    ))
                                ) : (
                                    // Fallback UI while loading or if empty
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className="animate-pulse bg-zinc-200 dark:bg-zinc-800 h-8 rounded w-full"></div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </MagicBento>
            </div>

          </ModalContent>
          
          <ModalFooter className="gap-4">
            <button className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors text-sm px-4 py-2 rounded-md font-medium shadow-lg shadow-black/20 dark:shadow-white/10 w-full">
              {hero.button_text}
            </button>
          </ModalFooter>
        </ModalBody>
      </Modal>
  );
}