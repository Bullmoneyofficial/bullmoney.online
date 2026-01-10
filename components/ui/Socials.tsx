'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

// --- IMPORTS ---
import ProfileCard from "@/components/ProfileCard";
// Make sure this path matches where you saved the Context file from your second code block
import { useStudio } from "@/context/StudioContext"; 

// ==========================================
// 1. SMART IMAGE & SCROLL STACK (Gallery)
// ==========================================

const SmartImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) return;
    let finalSrc = src;
    // Keep existing fix for postimg.cc if you are still using it for some legacy data
    if (src.includes('postimg.cc') && !src.includes('i.postimg.cc')) {
       const id = src.split('/').pop();
       finalSrc = `https://i.postimg.cc/${id}/image.jpg`; 
    }
    setImgSrc(finalSrc);
    setHasError(false);
    setLoading(true);
  }, [src]);

  const handleError = () => {
    // Fallback logic
    if (imgSrc && imgSrc.includes('i.postimg.cc') && imgSrc.endsWith('.jpg')) {
        setImgSrc(imgSrc.replace('.jpg', '.png'));
    } else {
        setHasError(true);
        setLoading(false);
    }
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 p-4 text-center ${className}`}>
        <SparklesIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${className}`}>
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"/>
            </div>
        )}
        <img
            src={imgSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={handleError}
        />
    </div>
  );
};

const ScrollStackItem = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div 
    className={`scroll-stack-card sticky top-0 w-full aspect-[3/4] md:aspect-square bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden mb-[var(--item-distance)] ${className}`.trim()}
    style={{ transformOrigin: 'top center', willChange: 'transform, filter' }}
  >
      {children}
  </div>
);

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 40,
  itemScale = 0.05,
  itemStackDistance = 20,
  stackPosition = '15%',
  baseScale = 1,
  blurAmount = 0,
}: any) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  const parseValue = (value: string | number, totalHeight: number) => {
      if (typeof value === 'string' && value.includes('%')) {
          return (parseFloat(value) / 100) * totalHeight;
      }
      return typeof value === 'number' ? value : 0;
  };

  const updateCards = useCallback(() => {
      if (!scrollerRef.current || !cardsRef.current.length) return;

      const scroller = scrollerRef.current;
      const scrollTop = scroller.scrollTop;
      const containerHeight = scroller.clientHeight;
      const stackPosPx = parseValue(stackPosition, containerHeight);

      cardsRef.current.forEach((card, i) => {
          if (!card) return;
          const cardTop = card.offsetTop;
          const triggerStart = cardTop - stackPosPx - (itemStackDistance * i);
          
          let progress = 0;
          if (scrollTop > triggerStart) {
              progress = Math.min(1, (scrollTop - triggerStart) / 300);
          }

          const targetScale = baseScale - (i * itemScale); 
          const currentScale = 1 - (progress * (1 - targetScale));
          let translateY = 0;
          if (scrollTop > triggerStart) {
             translateY = scrollTop - triggerStart;
          }

          card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${currentScale})`;
          if (blurAmount > 0) card.style.filter = `blur(${progress * blurAmount}px)`;
          card.style.zIndex = `${i + 1}`;
      });
  }, [baseScale, blurAmount, itemScale, itemStackDistance, stackPosition]);

  useLayoutEffect(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const lenis = new Lenis({
          wrapper: scroller,
          content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          gestureOrientation: 'vertical',
          smoothWheel: true,
          touchMultiplier: 2,
      });
      lenisRef.current = lenis;

      const onRaf = (time: number) => {
          lenis.raf(time);
          updateCards();
          rafRef.current = requestAnimationFrame(onRaf);
      };
      rafRef.current = requestAnimationFrame(onRaf);

      // Re-query cards on content change
      cardsRef.current = Array.from(scroller.querySelectorAll('.scroll-stack-card'));
      cardsRef.current.forEach((card, i) => {
          if (i < cardsRef.current.length - 1) card.style.marginBottom = `${itemDistance}px`;
      });

      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          lenis.destroy();
      };
  }, [itemDistance, updateCards, children]); // Added children to dependency to re-calc on data load

  return (
      <div ref={scrollerRef} className={`h-full w-full overflow-y-auto relative no-scrollbar ${className}`}>
          <div className="scroll-stack-inner p-6 md:p-10 pb-40">
              {children}
              <div className="h-24 w-full" />
          </div>
      </div>
  );
};

// ==========================================
// 2. UTILS & ICONS
// ==========================================

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

// ==========================================
// 3. ANIMATED MODAL SYSTEM
// ==========================================

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'auto';
  }, [open]);

  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export function Modal({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
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

export const SimpleModalTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { setOpen } = useModal();
  return (
    <button onClick={() => setOpen(true)} className={className}>
      {children}
    </button>
  );
};

export const ModalBody = ({ children, className }: { children: React.ReactNode; className?: string }) => {
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
              'relative w-[95%] md:w-[500px] h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col',
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

export const ModalContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('flex-1 h-full w-full relative', className)}>{children}</div>;
};

// --- COMPONENT: Button that triggers the Profile Card Modal ---
const ProfileCardModalAction = () => {
  const { state } = useStudio();
  // Use About Image as avatar if available, otherwise fallback
  const avatar = state.about.image_url || "https://i.postimg.cc/R0xgx8jW/IMG-9246.jpg";

  return (
    <Modal>
      <SimpleModalTrigger className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition-colors text-sm px-5 py-2.5 rounded-full font-medium shadow-sm border border-zinc-200 dark:border-zinc-700">
        <SparklesIcon className="w-4 h-4" />
        <ProfileCard avatarUrl={avatar} />
        <span className="sm:hidden">Card</span>
      </SimpleModalTrigger>
    </Modal>
  );
};

const SocialFooter = () => {
    const { state } = useStudio();
    
    // Find Instagram link from DB or fallback
    const instaLink = state.socials.find(
        s => s.platform.toLowerCase().includes('instagram') && s.active
    )?.url || "https://www.instagram.com/bullmoney.online/";

    const instaHandle = "@alexa__.studio"; // You could also store this in DB if you wanted

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium truncate">Follow Us</span>
                    <span className="text-sm font-bold text-black dark:text-white truncate">{instaHandle}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <ProfileCardModalAction />

                    <a 
                        href={instaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors text-sm px-5 py-2.5 rounded-full font-medium shadow-lg"
                    >
                        <InstagramIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver Perfil</span>
                        <span className="sm:hidden">IG</span>
                    </a>
                </div>
            </div>
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
      className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
    >
      <CloseIcon className="w-4 h-4 text-black dark:text-white" />
    </button>
  );
};

// ==========================================
// 4. EXPORTABLE COMPONENTS
// ==========================================

export function SocialsModal() {
  const { state } = useStudio();
  const { gallery } = state;

  // Optional: Fallback images if DB is empty
  const hasImages = gallery && gallery.length > 0;
  
  return (
      <Modal>
        <ModalTrigger>
            <span className="flex items-center gap-2">
                Socials <SparklesIcon className="w-4 h-4" />
            </span>
        </ModalTrigger>

        <ModalBody className="dark:bg-black bg-white">
          <ModalContent>
            <ScrollStack 
                itemDistance={50} 
                itemScale={0.05}
                stackPosition="15%"
            >
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">Galeria</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Destaques do nosso trabalho</p>
                </div>

                {hasImages ? (
                    gallery.map((item, index) => (
                        <ScrollStackItem key={item.id || index}>
                            <SmartImage 
                                src={item.media_url} 
                                alt={item.caption || `Gallery ${index}`} 
                                className="w-full h-full"
                            />
                        </ScrollStackItem>
                    ))
                ) : (
                    // Empty state or loading
                    <div className="flex items-center justify-center h-40 text-zinc-500">
                        <p>No images loaded yet.</p>
                    </div>
                )}
                
            </ScrollStack>
            <SocialFooter />
          </ModalContent>
        </ModalBody>
      </Modal>
  );
}

// Deprecated: "SeeMeModal" is now handled via the internal "ProfileCardModalAction" button
// but kept if you need it as a standalone trigger
export function SeeMeModal() {
  const { state } = useStudio();
  const avatar = state.about.image_url || "https://i.postimg.cc/R0xgx8jW/IMG-9246.jpg";

  return (
      <Modal>
        <ModalTrigger>
            <span className="flex items-center gap-2">
                See Me <SparklesIcon className="w-4 h-4" />
            </span>
        </ModalTrigger>
        <ModalBody className="dark:bg-black bg-zinc-50 overflow-hidden">
          <ModalContent className="flex items-center justify-center h-full w-full p-4">
            <div className="transform scale-90 md:scale-100">
              <ProfileCard avatarUrl={avatar} />
            </div>
          </ModalContent>
        </ModalBody>
      </Modal>
  );
}

export default SocialsModal;