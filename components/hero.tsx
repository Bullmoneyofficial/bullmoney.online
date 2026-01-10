"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@/lib/spline-wrapper'), { ssr: false });
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
  useWillChange,
  PanInfo,
  useAnimation
} from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2, Edit2, Save, X, Trash2, Upload, ChevronDown, Lock, Info, Instagram, Send, Sparkles, Cpu, Fingerprint, DollarSign } from "lucide-react";

// --- CONTEXT INTEGRATION ---
import { useStudio, type Project } from "@/context/StudioContext";

// --- EXTERNAL COMPONENTS ---
import About from "@/components/ui/About";
import ServicesModal from "@/components/ui/SeviceModal";
import AdminModal from "@/components/AdminModal";
import ReflectiveCard from '@/components/ReflectiveCard';



const DynamicUltimateControlPanel = dynamic(() => import('./UltimateControlPanel').then(mod => mod.UltimateControlPanel), {
  ssr: false,
  loading: () => <div>Loading Control Panel...</div>,
});

// --- TYPE EXTENSION FOR GRID ---
type GridItem = Project & {
    _source: 'project' | 'service' | 'hero_placeholder';
    uniqueKey: string;
};

type ProjectFormData = {
  title: string;
  thumbnail: string;
  description: string;
  price: string;
  duration: string;
  technique: string;
  link: string;
};

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

// --- 0. CONTACT MODAL COMPONENT ---
const ContactSelectionModal = ({ 
    isOpen, 
    onClose, 
    instagramLink, 
    telegramLink 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    instagramLink: string; 
    telegramLink: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-950 border border-#3b82f6/30 p-8 pt-12 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden"
            >
                <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('/noise.png')]"></div>
                 <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-#3b82f6/10 to-transparent"></div>

                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-#3b82f6 hover:bg-neutral-800 transition-all shadow-lg"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-2xl font-serif font-bold text-center mb-2 text-#3b82f6 z-10 relative">Choose Platform</h3>
                <p className="text-center text-neutral-400 text-sm mb-6 z-10 relative">How would you like to connect?</p>

                <div className="space-y-4 z-10 relative">
                    <a 
                        href={instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-#60a5fa focus:ring-offset-2 focus:ring-offset-slate-50"
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#bfdbfe_50%,#3b82f6_100%)]" />
                        <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-neutral-900">
                             <div className="bg-#3b82f6/20 p-2 rounded-full mr-4">
                                <Instagram size={24} className="text-#3b82f6" />
                            </div>
                            <span className="font-bold tracking-wide text-lg text-#60a5fa">Instagram</span>
                        </span>
                    </a>

                    <a 
                        href={telegramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-#60a5fa focus:ring-offset-2 focus:ring-offset-slate-50"
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#bfdbfe_50%,#3b82f6_100%)]" />
                        <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-neutral-900">
                            <div className="bg-#3b82f6/20 p-2 rounded-full mr-4">
                                <Send size={24} className="text-#3b82f6" />
                            </div>
                            <span className="font-bold tracking-wide text-lg text-#60a5fa">Telegram</span>
                        </span>
                    </a>
                </div>
            </motion.div>
        </div>
    );
};

// --- 1. VISUAL COMPONENTS ---

const GridLineVertical = React.memo(({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.3)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-10", 
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    ></div>
  );
});
GridLineVertical.displayName = "GridLineVertical";

const BackgroundGrids = React.memo(() => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 md:grid-cols-4">
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full bg-gradient-to-b from-transparent via-neutral-100 to-transparent dark:via-neutral-900">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
});
BackgroundGrids.displayName = "BackgroundGrids";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const [spans, setSpans] = useState<{ id: number; initialX: number; initialY: number; directionX: number; directionY: number; }[]>([]);

  useEffect(() => {
    const newSpans = Array.from({ length: 20 }, (_, index) => ({
      id: index,
      initialX: 0,
      initialY: 0,
      directionX: Math.floor(Math.random() * 80 - 40),
      directionY: Math.floor(Math.random() * -50 - 10),
    }));
    setSpans(newSpans);
  }, []);

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-[4px] w-10 rounded-full bg-gradient-to-r from-transparent via-#60a5fa to-transparent blur-sm"
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{ x: span.directionX, y: span.directionY, opacity: 0 }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-#60a5fa to-#93c5fd"
        />
      ))}
    </div>
  );
};

const CollisionMechanism = React.memo(React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLDivElement>;
    beamOptions?: { initialX?: number; translateX?: number; initialY?: number; translateY?: number; rotate?: number; className?: string; duration?: number; delay?: number; repeatDelay?: number; };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{ detected: boolean; coordinates: { x: number; y: number } | null; }>({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (beamRef.current && containerRef.current && parentRef.current && !cycleCollisionDetected) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;
          setCollision({ detected: true, coordinates: { x: relativeX, y: relativeY } });
          setCycleCollisionDetected(true);
          if (beamRef.current) beamRef.current.style.opacity = "0";
        }
      }
    };
    const animationInterval = setInterval(checkCollision, 50);
    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
        if (beamRef.current) beamRef.current.style.opacity = "1";
      }, 2000);
      setTimeout(() => setBeamKey((prevKey) => prevKey + 1), 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{ translateY: beamOptions.initialY || "-200px", translateX: beamOptions.initialX || "0px", rotate: beamOptions.rotate || -45 }}
        variants={{ animate: { translateY: beamOptions.translateY || "800px", translateX: beamOptions.translateX || "700px", rotate: beamOptions.rotate || -45 } }}
        transition={{ duration: beamOptions.duration || 8, repeat: Infinity, repeatType: "loop", ease: "linear", delay: beamOptions.delay || 0, repeatDelay: beamOptions.repeatDelay || 0 }}
        className={cn("absolute left-96 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-#3b82f6 via-#60a5fa to-transparent", beamOptions.className)}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{ left: `${collision.coordinates.x + 20}px`, top: `${collision.coordinates.y}px`, transform: "translate(-50%, -50%)" }}
          />
        )}
      </AnimatePresence>
    </>
  );
}));
CollisionMechanism.displayName = "CollisionMechanism";

// --- 2. PRODUCT CARD ---
const ProductCard = React.memo(({
  project,
  uniqueLayoutId, 
  translate,
  setActive,
  isMobile
}: {
  project: GridItem;
  uniqueLayoutId: string;
  translate: MotionValue<number>;
  setActive: (project: GridItem, layoutId: string) => void; 
  isMobile: boolean;
}) => {
  const willChange = useWillChange();
  return (
    <motion.div
      style={{ x: translate, willChange }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActive(project, uniqueLayoutId)} 
      className="group/product h-[20rem] w-[18rem] md:h-[30rem] md:w-[28rem] relative flex-shrink-0 cursor-pointer backface-hidden transform-gpu"
    >
      <div className="block h-full w-full group-hover/product:shadow-2xl transition-all duration-500 rounded-xl safari-fix-layer">
        <motion.div 
            layoutId={uniqueLayoutId}
            className="relative h-full w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 safari-mask-fix"
        >
            <Image
                src={project.thumbnail}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center absolute h-full w-full inset-0 transition-transform duration-700 group-hover/product:scale-110 opacity-80 group-hover/product:opacity-100"
                alt={project.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/product:opacity-90 transition-opacity duration-500" />
            <div className="absolute bottom-6 left-6 translate-y-2 group-hover/product:translate-y-0 transition-transform duration-500 w-[90%]">
                <h2 className="text-white font-serif tracking-wide text-xl md:text-2xl drop-shadow-md truncate">
                   {project.title}
                </h2>
                {project.price && (
                    <p className="text-#60a5fa font-bold text-sm mt-1 flex items-center gap-2">
                        {project.price} 
                        {project.duration && (
                            <>
                                <span className="w-1 h-1 bg-white rounded-full"></span> 
                                {project.duration}
                            </>
                        )}
                    </p>
                )}
                {project._source === 'service' && (
                    <span className="absolute -top-10 right-0 bg-white/10 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">Serviço</span>
                )}
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = "ProductCard";

const ShimmerButton = ({ onClick, children, className = '', gradient = 'from_90deg_at_50%_50%,#3b82f6_0%,#bfdbfe_50%,#3b82f6_100%' }: { onClick: () => void; children: React.ReactNode; className?: string, gradient?: string }) => (
    <button
        onClick={onClick}
        className={cn("w-full relative inline-flex h-14 items-center justify-center rounded-xl p-[2px] overflow-hidden", className)}
    >
        <span className={`absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(${gradient})]`} />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] bg-neutral-950 px-3 text-base font-medium text-white backdrop-blur-3xl">
            {children}
        </span>
    </button>
);

const SwipableButtons = ({
  buttonText,
  contactButtonText,
  isAdmin,
  isAuthenticated,
  setIsContactModalOpen,
  setIsAdminOpen,
  onUcpOpen,
  onReflectiveCardOpen,
  onServicesOpen,
}: {
  buttonText: string;
  contactButtonText: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setIsContactModalOpen: (isOpen: boolean) => void;
  setIsAdminOpen: (isOpen: boolean) => void;
  onUcpOpen: () => void;
  onReflectiveCardOpen: () => void;
  onServicesOpen: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useAnimation();

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleServicesClick = () => {
    onServicesOpen();
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      controls.start({ x: 0 });
    } else {
      controls.start({ x: -320 });
    }
  }, [isOpen, controls]);

  const onDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      setIsOpen(true);
    } else if (info.offset.x < -swipeThreshold) {
      setIsOpen(false);
    } else {
      // Snap back to original position if not dragged far enough
      if(isOpen) controls.start({ x: 0 });
      else controls.start({ x: -320 });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onTap={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>
      <motion.div
        drag="x"
        onDragEnd={onDragEnd}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.1 }}
        animate={controls}
        initial={{ x: -320 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-50 flex items-center cursor-grab active:cursor-grabbing"
      >
        <div className="relative w-[320px] bg-neutral-950/80 backdrop-blur-xl border-r border-neutral-800 p-4 flex flex-col gap-4">
          <ShimmerButton onClick={handleServicesClick}>
            <Sparkles size={18} />
            <span>{buttonText}</span>
          </ShimmerButton>

          <ShimmerButton
            onClick={() => {
              setIsContactModalOpen(true);
              setIsOpen(false);
            }}
          >
            <Send size={18} />
            <span>{contactButtonText}</span>
            <span className="ml-1">✨</span>
          </ShimmerButton>
          
          <ShimmerButton
            onClick={() => {
              onUcpOpen();
              setIsOpen(false);
            }}
          >
            <Cpu size={18} />
            <span>Device Center</span>
          </ShimmerButton>
          
          {isAdmin ? (
              <ShimmerButton
                  onClick={() => {
                    setIsAdminOpen(true);
                    setIsOpen(false);
                  }}
                  gradient="from_90deg_at_50%_50%,#10b981_0%,#6ee7b7_50%,#10b981_100%"
              >
                  <Edit2 size={18} />
                  <span>Admin Panel</span>
              </ShimmerButton>
          ) : isAuthenticated ? (
             <div className="w-full relative inline-flex h-14 items-center justify-center rounded-xl p-[2px] overflow-hidden">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#facc15_0%,#fef08a_50%,#facc15_100%)]" />
                <span className="inline-flex h-full w-full items-center justify-center gap-3 rounded-[10px] bg-neutral-950 px-3 text-base font-medium text-white backdrop-blur-3xl">
                    <Sparkles size={18} className="text-yellow-400" />
                    <span className="font-bold tracking-wide text-yellow-400">VIP Member</span>
                </span>
            </div>
          ) : (
             <ShimmerButton onClick={() => {
                onReflectiveCardOpen();
                setIsOpen(false);
              }}>
                <Fingerprint size={18} /> 
                <span>Identity</span>
             </ShimmerButton>
          )}
        </div>
        <motion.div
          onTap={toggleOpen}
          className="relative -ml-1 w-8 h-24 bg-neutral-800/80 rounded-r-lg flex items-center justify-center cursor-pointer group"
          whileHover={{ scale: 1.1 }}
        >
          <div className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_2px_#3b82f6] animate-pulse"></div>
          <div className="absolute left-full ml-2 w-max px-3 py-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isOpen ? "Close" : "Actions"}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

// --- 3. MAIN HERO PARALLAX ---
const HeroParallax = () => {
  const { 
    state, 
    updateProject, deleteProject, 
    updateServiceItem, deleteServiceItem, 
    uploadFile 
  } = useStudio();
  
  const { projects, serviceItems, hero, loading, isAuthenticated, isAdmin } = state;
  
  const isMobile = useIsMobile();
  const willChange = useWillChange();

  const headline = hero?.headline || "BullMoney";
  const subheadline = hero?.subheadline || "Elite Trading Community & Premium Trading Setups";
  const buttonText = hero?.button_text || "View Trading Setups";
  const contactButtonText = (hero as any)?.contact_button_text || "Start Trading";

  const [isUcpOpen, setIsUcpOpen] = useState(false);
  const [isReflectiveCardOpen, setIsReflectiveCardOpen] = useState(false);
  const servicesModalRef = useRef<HTMLDivElement>(null);

  const handleServicesOpen = () => {
    const triggerButton = servicesModalRef.current?.querySelector('button');
    if (triggerButton) {
      triggerButton.click();
    }
  };

  const parallaxItems = useMemo(() => {
    const formattedProjects: GridItem[] = projects.map(p => ({
        ...p,
        _source: 'project' as const,
        uniqueKey: `proj-${p.id}`
    }));

    const heroImages = hero?.hero_images || [];
    const formattedServices: GridItem[] = serviceItems.map((s, index) => {
        const serviceData = s as any;
        const specificImage = serviceData.image_url || serviceData.thumbnail;
        const hasSpecificImage = specificImage && typeof specificImage === 'string' && specificImage.trim() !== "";
        const displayImg = hasSpecificImage
            ? specificImage
            : (heroImages.length > 0
                ? heroImages[index % heroImages.length]
                : "https://via.placeholder.com/800x1000/000000/10b981?text=BullMoney");

        return {
            id: s.id, 
            title: s.name,
            thumbnail: displayImg,
            description: s.detail_includes || "Professional Trading Service",
            price: s.price,
            duration: s.detail_time,
            technique: s.detail_type || "Service",
            link: null,
            _source: 'service' as const,
            uniqueKey: `serv-${s.id}`
        };
    });

    const formattedHeroImages: GridItem[] = heroImages.map((img, i) => ({
        id: -1 * (i + 1),
        title: `Trading Setup ${i + 1}`,
        thumbnail: img,
        description: "Exclusive BullMoney trading setup with entry, exit, and risk management.",
        price: null,
        duration: null,
        technique: null,
        link: null,
        _source: 'hero_placeholder' as const,
        uniqueKey: `hero-${i}`
    }));

    let combinedItems = [...formattedProjects, ...formattedServices];
    if (combinedItems.length < 6) {
        combinedItems = [...combinedItems, ...formattedHeroImages];
    }
    if (combinedItems.length === 0) return [];

    let filledProjects = [...combinedItems];
    const limit = isMobile ? 6 : 15;
    while (filledProjects.length < limit) {
      filledProjects = [...filledProjects, ...combinedItems];
    }
    
    return filledProjects.slice(0, limit).map((p, i) => ({
      ...p,
      uniqueKey: `${p.uniqueKey}-copy-${i}`,
    }));
  }, [projects, serviceItems, hero, isMobile]);

  const itemsPerRow = Math.ceil(parallaxItems.length / 3);
  const firstRow = parallaxItems.slice(0, itemsPerRow);
  const secondRow = parallaxItems.slice(itemsPerRow, itemsPerRow * 2);
  const thirdRow = parallaxItems.slice(itemsPerRow * 2, parallaxItems.length);

  const ref = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? 100 : 600]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, isMobile ? -100 : -600]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 15, 0]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? 0 : 20, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [isMobile ? -100 : -700, isMobile ? 0 : 200]), springConfig);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<GridItem | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const quickEditFileInputRef = useRef<HTMLInputElement>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [editForm, setEditForm] = useState<ProjectFormData>({
    title: "",
    thumbnail: "",
    description: "",
    price: "",
    duration: "",
    technique: "",
    link: ""
  });

  const handleOpen = useCallback((project: GridItem, layoutId: string) => {
    setActiveProject(project);
    setActiveLayoutId(layoutId); 
    setEditForm({
      title: project.title,
      thumbnail: project.thumbnail,
      description: project.description || "",
      price: project.price || "",
      duration: project.duration || "",
      technique: project.technique || "",
      link: project.link || ""
    });
    setIsEditing(false);
  }, []);

  const handleClose = useCallback(() => {
    setActiveProject(null);
    setActiveLayoutId(null);
    setIsEditing(false);
  }, []);

  const sanitizeData = (form: ProjectFormData) => {
      return {
          ...form,
          description: form.description === "" ? null : form.description,
          price: form.price === "" ? null : form.price,
          duration: form.duration === "" ? null : form.duration,
          technique: form.technique === "" ? null : form.technique,
          link: form.link === "" ? null : form.link,
      };
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if(!activeProject) return;

    if(activeProject._source === 'hero_placeholder') {
        alert("This is a placeholder image. Manage it in the Hero Settings.");
        return;
    }

    setIsSaving(true);
    try {
      const sanitizedForm = sanitizeData(editForm);

      if (activeProject._source === 'project') {
         await updateProject(activeProject.id, sanitizedForm);
      } else if (activeProject._source === 'service') {
         await updateServiceItem(activeProject.id, {
            name: sanitizedForm.title || "", 
            price: sanitizedForm.price || "", 
            detail_time: sanitizedForm.duration,      
            detail_type: sanitizedForm.technique,     
            detail_includes: sanitizedForm.description, 
            image_url: sanitizedForm.thumbnail 
         } as any);
      }

      setActiveProject(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!activeProject) return;
    
    if(activeProject._source === 'hero_placeholder') {
        alert("Delete this image in the Hero Settings.");
        return;
    }

    if(window.confirm("Are you sure? This cannot be undone.")) {
      setIsSaving(true);
      try {
        if (activeProject._source === 'project') {
            await deleteProject(activeProject.id);
        } else if (activeProject._source === 'service') {
            await deleteServiceItem(activeProject.id);
        }
        handleClose();
      } catch (error: any) {
         console.error("Error deleting:", error);
         alert(`Failed to delete: ${error.message}`);
      } finally {
        setIsSaving(false);
      }
    }
  }

  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploadingImage(true);
    const file = e.target.files[0];

    try {
      const { url, error } = await uploadFile(file);
      if (error) {
        alert("Upload failed: " + error);
      } else if (url) {
        setEditForm(prev => ({ ...prev, thumbnail: url }));
      }
    } catch (err) {
      alert("Unexpected error during upload.");
    } finally {
      setIsUploadingImage(false);
      if (quickEditFileInputRef.current) quickEditFileInputRef.current.value = ""; 
    }
  };

  useEffect(() => {
    if (activeProject || isAdminOpen || isContactModalOpen) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; }
  }, [activeProject, isAdminOpen, isContactModalOpen]);

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-neutral-950 text-#3b82f6">
              <Loader2 className="animate-spin w-10 h-10" />
          </div>
      )
  }

  const canEdit = isAdmin && activeProject?._source !== 'hero_placeholder';

  return (
    <>
    <style jsx global>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .animate-shimmer { animation: shimmer 3s linear infinite; }
      .backface-hidden { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
      .transform-gpu { transform: translate3d(0,0,0); -webkit-transform: translate3d(0,0,0); }
      .safari-mask-fix { -webkit-mask-image: -webkit-radial-gradient(white, black); mask-image: radial-gradient(white, black); isolation: isolate; }
      .safari-fix-layer { transform: translateZ(0); -webkit-transform: translateZ(0); }
    `}</style>

    {isAdmin && <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}

    <ContactSelectionModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        instagramLink="https://www.instagram.com/bullmoney.online/"
        telegramLink="https://t.me/addlist/gg09afc4lp45YjQ0"
    />

    <div ref={servicesModalRef} style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'auto' }}>
        <ServicesModal btnText={buttonText} />
    </div>

    <DynamicUltimateControlPanel isOpen={isUcpOpen} onOpenChange={setIsUcpOpen} />
    
    <AnimatePresence>
        {isReflectiveCardOpen && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[999] grid place-items-center bg-black/80"
                onClick={() => setIsReflectiveCardOpen(false)}
            >
                <div onClick={(e) => e.stopPropagation()}>
                    <ReflectiveCard onVerificationComplete={() => {
                        setTimeout(() => setIsReflectiveCardOpen(false), 2000);
                    }} />
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    <AnimatePresence>
      {activeProject && activeLayoutId && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] grid place-items-center bg-black/90 md:backdrop-blur-xl p-0 md:p-4 will-change-opacity"
            onClick={handleClose}
        >
          <motion.div
            layoutId={activeLayoutId} 
            className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[100dvh] md:h-[85vh] md:max-h-[800px] safari-fix-layer"
            onClick={(e) => e.stopPropagation()} 
          >
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur border border-white/10 rounded-full text-white hover:bg-white hover:text-black transition-colors"
            >
                <X size={20} />
            </button>

            {canEdit && !isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="absolute top-4 left-4 md:left-auto md:right-16 z-50 p-2 bg-#3b82f6 rounded-full text-black hover:bg-#60a5fa transition-colors shadow-lg flex gap-2 items-center px-4 font-bold text-xs"
              >
                  <Edit2 size={14} /> Edit {activeProject._source === 'service' ? 'Service' : 'Look'}
              </button>
            )}

            <div className="w-full md:w-3/5 h-[40vh] md:h-full relative bg-neutral-200 dark:bg-neutral-800 group/image">
                 <Image
                    src={isEditing ? editForm.thumbnail : activeProject.thumbnail}
                    fill
                    priority={true}
                    className="object-cover"
                    alt={activeProject.title}
                />
                 {isEditing && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); !isUploadingImage && quickEditFileInputRef.current?.click(); }}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-black/70 transition-colors z-20"
                  >
                    {isUploadingImage ? (
                        <Loader2 className="animate-spin text-#3b82f6 w-8 h-8" />
                      ) : (
                        <>
                          <Upload className="text-#3b82f6 w-8 h-8 mb-2" />
                          <p className="text-white text-xs font-bold uppercase tracking-widest">Click to Change Image</p>
                        </>
                      )}
                  </div>
                )}
                <input type="file" ref={quickEditFileInputRef} className="hidden" accept="image/*" onChange={handleQuickImageUpload} />
                
                {!isEditing && activeProject._source === 'service' && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-[10px] uppercase font-bold tracking-widest border border-white/20">
                        Service Info
                    </div>
                )}
                
                {!isEditing && <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-80 md:hidden" />}
                {!isEditing && (
                    <div className="absolute bottom-4 left-4 md:hidden">
                         <h3 className="text-3xl font-serif font-bold text-white">{activeProject.title}</h3>
                    </div>
                )}
            </div>

            <div className="w-full md:w-2/5 p-6 md:p-12 flex flex-col overflow-y-auto bg-white dark:bg-neutral-900 custom-scrollbar relative">
                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in duration-300 pb-20" onClick={(e) => e.stopPropagation()}>
                      
                      <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl">
                          <div>
                             <label className="text-[10px] uppercase text-neutral-500 font-bold">Title / Name</label>
                             <input 
                              value={editForm.title} 
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              className="w-full bg-transparent p-2 border-b border-neutral-300 dark:border-neutral-700 outline-none focus:border-#3b82f6 text-neutral-900 dark:text-white text-base md:text-sm"
                            />
                          </div>
                          <div className="mt-4">
                             <label className="text-[10px] uppercase text-neutral-500 font-bold">Description / Includes</label>
                             <textarea 
                              rows={5}
                              value={editForm.description || ""} 
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              className="w-full bg-transparent p-2 border-b border-neutral-300 dark:border-neutral-700 outline-none focus:border-#3b82f6 text-neutral-900 dark:text-white resize-none text-base md:text-sm"
                            />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase text-neutral-500 font-bold">Price</label>
                          <input 
                            value={editForm.price || ""} 
                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent focus:border-#3b82f6 text-base md:text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-neutral-500 font-bold">Duration</label>
                          <input 
                            value={editForm.duration || ""} 
                            onChange={(e) => setEditForm({...editForm, duration: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent focus:border-#3b82f6 text-base md:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] uppercase text-neutral-500 font-bold">Technique / Type</label>
                        <input 
                            value={editForm.technique || ""} 
                            onChange={(e) => setEditForm({...editForm, technique: e.target.value})}
                            className="w-full bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg outline-none border border-transparent focus:border-#3b82f6 text-base md:text-sm"
                        />
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4 md:relative fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-900 p-4 md:p-0 z-50 md:z-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
                        <button 
                          onClick={handleSaveEdit} 
                          disabled={isSaving || isUploadingImage}
                          className="flex-1 bg-#3b82f6 hover:bg-#60a5fa text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} /> Save</>}
                        </button>
                        <button 
                          onClick={handleDelete}
                          disabled={isSaving}
                          className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-3 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                          className="text-neutral-500 hover:text-black dark:hover:text-white text-xs px-2"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="h-20 md:hidden"></div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:block"
                    >
                         <h3 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 dark:text-white mb-2 leading-tight">
                            {activeProject.title}
                        </h3>
                         <div className="h-1 w-20 bg-#3b82f6 mb-6" />
                    </motion.div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm md:text-base leading-relaxed whitespace-pre-line flex-grow"
                    >
                        {activeProject.description || "Professional trading setup with detailed entry points, stop loss, take profit levels, and risk management strategy tailored for maximum profitability."}
                    </motion.div>
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4 mb-10 bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-100 dark:border-neutral-800"
                    >
                        {activeProject.duration && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Duration</span>
                                <span className="text-sm dark:text-neutral-200 font-mono">{activeProject.duration}</span>
                            </div>
                        )}
                        {activeProject.technique && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Technique</span>
                                <span className="text-sm dark:text-neutral-200 font-mono">{activeProject.technique}</span>
                            </div>
                        )}
                        {activeProject.price && (
                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-3 last:border-b-0">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Investment</span>
                                <span className="text-xl text-blue-500 font-bold">{activeProject.price}</span>
                            </div>
                        )}
                    </motion.div>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        Get This Trading Setup
                    </motion.button>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div
        ref={ref}
        className="h-screen pt-10 pb-0 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
        <div className="absolute inset-0 w-full h-full z-0 bg-black/5 pointer-events-none md:pointer-events-auto">
          <Spline scene="/scene1.splinecode" onLoad={() => {}} onError={() => {}} />
        </div>
        <div className="max-w-7xl relative mx-auto pt-32 pb-12 md:py-32 px-4 w-full z-20 mb-10 md:mb-32">
            <div className="relative z-20 flex flex-col items-start gap-4 pointer-events-none">
            </div>
            
            <SwipableButtons
              buttonText={buttonText}
              contactButtonText={contactButtonText}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              setIsContactModalOpen={setIsContactModalOpen}
              setIsAdminOpen={setIsAdminOpen}
              onUcpOpen={() => setIsUcpOpen(true)}
              onReflectiveCardOpen={() => setIsReflectiveCardOpen(true)}
              onServicesOpen={handleServicesOpen}
            />
            
        </div>
    </div>

    <div ref={containerRef} className="absolute bottom-0 w-full h-px" />
    </>
  );
};

export default HeroParallax;