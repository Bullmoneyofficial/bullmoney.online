"use client";

import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
  ReactElement
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
// Added BsInstagram and BsWhatsapp to imports
import { 
  BsStarFill, 
  BsArrowRight, 
  BsX, 
  BsTag, 
  BsClock, 
  BsLayers, 
  BsInstagram, 
  BsTelegram
} from "react-icons/bs";
import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";
import { cn } from "@/lib/utils"; 

// --- IMPORT YOUR CONTEXT ---
import { useStudio } from "@/context/StudioContext"; 

// -------------------------------------------------------------
// PART 1: DEFAULT ASSETS & TYPES
// -------------------------------------------------------------

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
];

const BRANDS = ["BINANCE", "BYBIT", "KRAKEN", "COINBASE", "VANTAGE", "XM", "OANDA", "FXPRO"];

interface CardData {
  id: string | number;
  title: string;
  price?: string | null;
  duration?: string | null; 
  image: string;
  description?: string | null;
  technique?: string | null; 
}

// -------------------------------------------------------------
// PART 2: HELPER COMPONENTS (Marquee, CardSwap & ContactModal)
// -------------------------------------------------------------

const LogoMarquee = ({ items }: { items: string[] }) => {
  return (
    <div className="relative flex overflow-hidden w-full select-none [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
      <motion.div
        className="flex flex-shrink-0 items-center gap-12 whitespace-nowrap pr-12"
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
      >
        {[...items, ...items].map((brand, i) => (
          <span key={`${brand}-${i}`} className="text-xl md:text-2xl font-serif font-bold text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 transition-colors cursor-default">
            {brand}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// --- NEW CONTACT MODAL ---
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
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    // Don't render during SSR or before mount
    if (!mounted || typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div 
                    key="contact-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" 
                    onClick={onClose}
                >
                    <motion.div 
                        key="contact-modal-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-950 border border-blue-500/30 p-8 pt-12 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden"
                    >
                        {/* Background Effects */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                        <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-blue-500/10 to-transparent"></div>

                        <button 
                            onClick={onClose} 
                            className="absolute top-3 right-3 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:border-blue-500 hover:bg-neutral-800 transition-all shadow-lg"
                        >
                            <BsX size={20} />
                        </button>
                        
                        <h3 className="text-2xl font-serif font-bold text-center mb-2 text-blue-500 z-10 relative">Choose Platform</h3>
                        <p className="text-center text-neutral-400 text-sm mb-6 z-10 relative">How would you like to connect?</p>

                        <div className="space-y-4 z-10 relative">
                            {/* Instagram Option */}
                            <a 
                                href={instagramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#bfdbfe_50%,#3b82f6_100%)]" />
                                <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-neutral-900">
                                    <div className="bg-blue-500/20 p-2 rounded-full mr-4">
                                        <BsInstagram size={20} className="text-blue-500" />
                                    </div>
                                    <span className="font-bold tracking-wide text-lg text-blue-400">Instagram</span>
                                </span>
                            </a>

                            {/* Telegram Option */}
                            <a 
                                href={telegramLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block w-full overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#bfdbfe_50%,#3b82f6_100%)]" />
                                <span className="flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white backdrop-blur-3xl transition-colors group-hover:bg-neutral-900">
                                    <div className="bg-blue-500/20 p-2 rounded-full mr-4">
                                        <BsTelegram size={20} className="text-blue-500" />
                                    </div>
                                    <span className="font-bold tracking-wide text-lg text-blue-400">Telegram</span>
                                </span>
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};


interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  skewAmount?: number;
  children: ReactNode;
  isPaused?: boolean;
}

const CardSwap: React.FC<CardSwapProps> = ({
  width = 340, 
  height = 480, 
  cardDistance = 40,
  verticalDistance = 40,
  delay = 3500,
  skewAmount = 4,
  children,
  isPaused = false,
}) => {
  const childArr = useMemo(() => Children.toArray(children) as ReactElement<any>[], [children]);
  const refs = useMemo(() => childArr.map(() => React.createRef<HTMLDivElement>()), [childArr.length]);
  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => {
      if (!r.current) return;
      gsap.set(r.current, {
        x: i * cardDistance,
        y: -i * verticalDistance,
        z: -i * cardDistance * 1.5,
        xPercent: -50,
        yPercent: -50,
        skewY: skewAmount,
        zIndex: total - i,
        scale: 1 - (i * 0.05),
      });
    });

    const swap = () => {
      if (isPaused) return; 
      if (order.current.length < 2) return;
      
      const [front, ...rest] = order.current;
      const elFront = refs[front].current!;
      const total = refs.length;
      const tl = gsap.timeline();

      tl.to(elFront, { y: "+=550", rotation: Math.random() * 10 - 5, duration: 0.8, ease: "power2.in" });
      tl.addLabel("promote", "-=0.4");
      
      rest.forEach((idx, i) => {
        const el = refs[idx].current!;
        tl.set(el, { zIndex: total - i }, "promote");
        tl.to(el, {
          x: i * cardDistance,
          y: -i * verticalDistance,
          z: -i * cardDistance * 1.5,
          scale: 1 - (i * 0.05),
          duration: 0.8,
          ease: "power2.out",
        }, "promote+=0.1");
      });

      const lastIdx = total - 1;
      tl.addLabel("return", "+=0.1");
      tl.call(() => { gsap.set(elFront, { zIndex: 1 }); }, undefined, "return");
      tl.fromTo(elFront, 
        { x: lastIdx * cardDistance, y: -lastIdx * verticalDistance - 100, scale: 0.8, opacity: 0 },
        { x: lastIdx * cardDistance, y: -lastIdx * verticalDistance, z: -lastIdx * cardDistance * 1.5, scale: 1 - (lastIdx * 0.05), opacity: 1, duration: 0.8, ease: "power2.out" }, 
        "return"
      );

      tl.call(() => { order.current = [...rest, front]; });
    };

    const interval = setInterval(swap, delay);
    return () => clearInterval(interval);
  }, [cardDistance, verticalDistance, delay, skewAmount, refs, isPaused, childArr]);

  return (
    <div ref={container} className="relative perspective-container" style={{ width, height }}>
      {childArr.map((child, i) =>
        cloneElement(child, {
          key: i,
          ref: refs[i],
          className: "absolute top-1/2 left-1/2 w-full h-full backface-hidden will-change-transform shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl border-[8px] border-white dark:border-neutral-800 bg-neutral-900 overflow-hidden cursor-pointer"
        })
      )}
      <style jsx>{`
        .perspective-container { perspective: 1200px; transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

// -------------------------------------------------------------
// PART 3: MAIN COMPONENT
// -------------------------------------------------------------

export function CTA() {
  const { state } = useStudio();
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  
  // New state for Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Logic: Review Avatars (Pull 3 images from gallery)
  const reviewImages = useMemo(() => {
    if (state.gallery && state.gallery.length > 0) {
      return state.gallery
        .filter((item: any) => item.media_type === 'image')
        .slice(0, 3) 
        .map((item: any) => item.media_url);
    }
    return []; 
  }, [state.gallery]);

  // Logic: Display Cards (PRIORITY: Projects -> Services -> Gallery -> Default)
  const displayCards: CardData[] = useMemo(() => {
    
    // 1. PRIORITY: PROJECTS (Best option, as projects have explicit images)
    if (state.projects && state.projects.length > 0) {
      return state.projects.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,            
        duration: p.duration,      
        image: p.thumbnail || DEFAULT_IMAGES[0],
        description: p.description,
        technique: p.technique    
      })).slice(0, 6); 
    }

    // 2. Fallback: Services (FIXED: NOW CYCLES IMAGES)
    if (state.serviceItems && state.serviceItems.length > 0) {
        return state.serviceItems.map((s, i) => {
            // Determine image source:
            // 1. Try to get a unique image from Gallery based on index
            // 2. Fallback to Default images based on index
            let imgUrl = DEFAULT_IMAGES[i % DEFAULT_IMAGES.length];
            
            if (state.gallery && state.gallery.length > 0) {
                // Filter only images first to avoid videos
                const imagesOnly = state.gallery.filter(g => g.media_type === 'image');
                if (imagesOnly.length > 0) {
                    imgUrl = imagesOnly[i % imagesOnly.length].media_url;
                }
            }

            return {
                id: `srv-${s.id}`,
                title: s.name,
                price: s.price,
                duration: s.detail_time,
                image: imgUrl,
                description: s.detail_includes || "Premium trading setup package with live market analysis, entry/exit strategies, and 24/7 trade support."
            };
        }).slice(0, 6);
    }

    // 3. Fallback: Gallery Only
    if (state.gallery && state.gallery.length > 0) {
       return state.gallery
        .filter(g => g.media_type === 'image')
        .map((g, i) => ({
            id: `gal-${g.id}`,
            title: "Trading Gallery",
            price: null,
            duration: null,
            image: g.media_url,
            description: g.caption || "Check out our trading results."
        })).slice(0, 6);
    }

    // 4. Ultimate Fallback (Defaults)
    return DEFAULT_IMAGES.map((img, i) => ({
        id: `def-${i}`,
        title: "Premium Trading Setups",
        price: "$99",
        duration: "Monthly",
        image: img,
        description: "Transform your trading with our expert setups, live analysis, and exclusive community access for consistent profits."
    }));
  }, [state.projects, state.serviceItems, state.gallery]);

  const calOptions = useCalEmbed({
    namespace: CONSTANTS.CALCOM_NAMESPACE,
    styles: { branding: { brandColor: CONSTANTS.CALCOM_BRAND_COLOR } },
    hideEventTypeDetails: CONSTANTS.CALCOM_HIDE_EVENT_TYPE_DETAILS,
    layout: CONSTANTS.CALCOM_LAYOUT,
  });

  return (
    <>
      <section id="contact" className="relative w-full bg-neutral-50 dark:bg-neutral-950 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* LEFT: Text Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-20">
              
              {/* Social Proof Pill */}
              <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex -space-x-3">
                   {reviewImages.length > 0 ? (
                      reviewImages.map((src, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden">
                          <img src={src} alt={`Client ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))
                   ) : (
                      [1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900" />
                      ))
                   )}
                </div>
                <div className="flex items-center gap-1 pl-3 border-l border-neutral-200 dark:border-neutral-800">
                  <BsStarFill className="w-3.5 h-3.5 text-#3b82f6" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      4.9/5 based on 100+ reviews
                  </span>
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-neutral-900 dark:text-white mb-6"
              >
                Real traders. <br/>
                <span className="text-neutral-400 italic">Real profits.</span>
              </motion.h2>

              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10 max-w-lg leading-relaxed">
                 Join 500+ profitable traders using BullMoney&apos;s premium trading setups for Crypto, Forex & Stocks. Daily market analysis, expert entry/exit strategies, and proven risk management.
              </p>

              {/* UPDATED: Main Booking Button to open Contact Modal */}
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-medium text-lg transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
              >
                Get Premium Trading Setups
                <BsArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-20 w-full max-w-md lg:max-w-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-#60a5fa dark:text-#3b82f6 mb-6 text-center lg:text-left">
                  Trusted Platforms
                </p>
                <LogoMarquee items={BRANDS} />
              </div>
            </div>

            {/* RIGHT: Card Swap Visual */}
            <div className="relative h-[650px] w-full flex items-center justify-center lg:justify-end perspective-1000">
               <div className="absolute top-1/2 left-1/2 lg:left-[60%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40 rounded-full blur-[100px] opacity-60 pointer-events-none" />
               
               <div className="mr-0 lg:mr-20"> 
                  <CardSwap 
                    width={340} 
                    height={480} 
                    cardDistance={40} 
                    verticalDistance={45}
                    isPaused={!!activeCard} 
                  >
                    {displayCards.map((card, i) => (
                      <div 
                        key={i} 
                        className="relative group w-full h-full"
                        onClick={() => setActiveCard(card)}
                      >
                        <img
                          src={card.image}
                          alt={card.title || "Trading setup"}
                          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                        />
                        {/* Overlay on Card (Pre-Expand) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                           <span className="text-white font-serif text-2xl font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{card.title}</span>
                           <div className="flex items-center gap-3 mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                             {card.price && <span className="text-white/90 text-sm font-semibold">{card.price.includes('€') ? card.price : `€${card.price}`}</span>}
                             <BsArrowRight className="text-white w-4 h-4" />
                           </div>
                        </div>
                      </div>
                    ))}
                  </CardSwap>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* EXPANDED MODAL OVERLAY */}
      <AnimatePresence>
        {activeCard && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCard(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Card Content */}
            <motion.div
              layoutId={`card-${activeCard.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]"
            >
                {/* Close Button */}
                <button 
                  onClick={() => setActiveCard(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                   <img src={activeCard.image} alt={activeCard.title || "Trading setup detail"} className="w-full h-full object-cover" />
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col">
                   <h3 className="text-3xl font-serif font-bold text-neutral-900 dark:text-white mb-4">
                     {activeCard.title}
                   </h3>

                   {/* METADATA TAGS: Price, Duration, Technique */}
                   <div className="flex flex-wrap gap-2 mb-6">
                      {activeCard.price && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                          <BsTag className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {activeCard.price.includes('€') ? activeCard.price : `€${activeCard.price}`}
                          </span>
                        </div>
                      )}
                      
                      {activeCard.duration && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                          <BsClock className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {activeCard.duration}
                          </span>
                        </div>
                      )}

                      {activeCard.technique && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                          <BsLayers className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {activeCard.technique}
                          </span>
                        </div>
                      )}
                   </div>

                   <div className="overflow-y-auto pr-2 max-h-[200px] mb-8 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
                     <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm md:text-base">
                        {activeCard.description || "Contact us to learn more about this exclusive trading setup package. Includes complete market analysis, precise entry/exit points, risk management strategies, and ongoing trade support."}
                     </p>
                   </div>

                   <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      {/* UPDATED: Modal Internal Button to open Contact Modal */}
                      <button
                        onClick={() => {
                            setActiveCard(null); // Close the expanded card modal
                            setIsContactModalOpen(true); // Open the contact selection modal
                        }}
                        className="w-full py-3.5 px-6 font-medium rounded-xl hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 btn-primary"
                      >
                        Get This Trading Setup
                        <BsArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONTACT SELECTION MODAL --- */}
      <ContactSelectionModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          instagramLink={"https://www.instagram.com/bullmoney.online/"}
          telegramLink={"https://t.me/addlist/gg09afc4lp45YjQ0"}
      />
    </>
  );
}