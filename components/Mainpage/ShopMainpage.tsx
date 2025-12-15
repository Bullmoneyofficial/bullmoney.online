"use client";

import React, { useState, useEffect } from "react";
import { useMotionValue, useMotionTemplate, motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Gift,
  ShoppingCart,
  Radio,
  Users,
  TrendingUp,
  Youtube,
  ExternalLink,
  X,
  Play
} from "lucide-react";

// --- IMPORTS ---
import Orb from "../Mainpage/Vorb"; 

// --- CONFIG ---
const RANDOM_STRING_LENGTH = 300; 

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- SHIMMER STYLES & CONSTANTS ---
// 1. Existing Background Shimmer
const SHIMMER_BG_CLASS = "bg-[linear-gradient(110deg,transparent,45%,rgba(59,130,246,0.3),55%,transparent)] bg-[length:250%_100%] animate-shimmer-fast";

// 2. New Border Shimmer for Tips (From Navbar)
const SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";

// ==========================================
// 1. EVERVAULT CARD
// ==========================================

const EvervaultCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    const str = generateRandomString(RANDOM_STRING_LENGTH); 
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className={cn("bg-transparent aspect-auto flex w-full h-full relative", className)}>
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-2xl w-full relative overflow-hidden flex items-center justify-center h-full border border-blue-950/30 bg-gradient-to-b from-blue-950/30 to-blue-950/00 hover:border-blue-800/30 transition-all duration-700 hover:shadow-[0_0_15px_rgba(30,64,175,0.15)]"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <div className="relative w-full h-full rounded-xl flex flex-col p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString }: { mouseX: any; mouseY: any; randomString: string }) {
  const maskImage = useMotionTemplate`radial-gradient(150px at ${mouseX}px ${mouseY}px, white, transparent)`; 
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 rounded-xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-30" />
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-500 to-blue-400 opacity-0 group-hover/card:opacity-50 transition-opacity duration-700" 
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 mix-blend-overlay group-hover/card:opacity-70"
        style={style}
      >
        <p className="absolute inset-x-0 inset-y-0 text-[10px] h-full break-words whitespace-pre-wrap text-blue-100 font-mono font-bold transition duration-700 select-none overflow-hidden p-4">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&BULLMONEY";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// ==========================================
// 2. VIDEO COMPONENT
// ==========================================

const LiveVideoPreview = ({ isLive }: { isLive: boolean }) => {
  const [playVideo, setPlayVideo] = useState(false);
  const VIDEO_ID = "jfKfPfyJRdk"; 

  if (playVideo) {
    return (
      <iframe
        className="absolute inset-0 w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
        title="Live Stream"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div 
      onClick={() => setPlayVideo(true)}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#050a18]/60 cursor-pointer group hover:bg-[#050a18]/40 transition-colors duration-500"
    >
      {isLive ? (
        <>
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mb-2 motion-safe:group-hover:scale-105 transition-transform duration-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
          <p className="text-white font-bold tracking-widest text-xs">WATCH LIVE</p>
        </>
      ) : (
        <>
           <Youtube className="w-10 h-10 mb-2 text-blue-900/50" />
           <span className="text-[10px] tracking-widest uppercase text-blue-900/50">Offline</span>
        </>
      )}
    </div>
  );
};

// ==========================================
// 3. HELPER TIP COMPONENT (NEW)
// ==========================================

const HelperTip = ({ label }: { label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="absolute -top-3 right-4 z-50 flex flex-col items-center pointer-events-none"
  >
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg shadow-blue-900/40">
        {/* Rotating Shimmer Gradient */}
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: SHIMMER_GRADIENT }}
        />
        <div className="relative z-10 px-3 py-1 bg-[#020611] rounded-full flex items-center justify-center border border-blue-500/20">
            <span className="text-blue-100 text-[10px] font-bold whitespace-nowrap">
                Click {label}
            </span>
        </div>
    </div>
    {/* Triangle Pointer */}
    <div className="w-2 h-2 bg-[#020611] rotate-45 -translate-y-[4px] relative z-10 border-b border-r border-blue-500/20" />
  </motion.div>
);

// ==========================================
// 4. DATA
// ==========================================

const directoryItems = [
  {
    name: "FREE RESOURCES",
    link: "/about",
    icon: <Gift className="w-5 h-5 text-blue-400" />,
    desc: "Start here. Guides & free tools."
  },
  {
    name: "VIP SHOP",
    link: "/shop",
    icon: <ShoppingCart className="w-5 h-5 text-blue-400" />,
    desc: "Exclusive signals & bots."
  },
  {
    name: "NEWS & LIVES",
    link: "/Blogs",
    icon: <Radio className="w-5 h-5 text-blue-400" />,
    desc: "Market analysis & updates."
  },
  {
    name: "AFFILIATE",
    link: "/recruit",
    icon: <Users className="w-5 h-5 text-blue-400" />,
    desc: "Partner with us & earn."
  },
  {
    name: "PROP FIRMS",
    link: "/Prop",
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    desc: "Get funded. Trade our capital.",
    isWide: true 
  },
];

// ==========================================
// 5. MAIN PAGE
// ==========================================

export default function RecruitPage() {
  const [open, setOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // -- Helper Tip Logic --
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    setIsLive(true);
  }, []);

  // Cycle through tips only when modal is open
  useEffect(() => {
    if (!open) return;
    
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % directoryItems.length);
    }, 3000); // Cycles every 3 seconds

    return () => clearInterval(intervalId);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        position: "relative",
        background: "radial-gradient(circle at center, #020611 0%, #000 100%)",
        overflow: "hidden",
      }}
    >
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
          onButtonClick={() => setOpen(true)}
          buttonLabel="OPEN HUB"
        />

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }} 
              className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-[#020611]/70 p-4"
              onClick={() => setOpen(false)}
            >
              {/* MODAL WRAPPER WITH SHIMMER BORDER */}
              <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.9 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }} 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden p-[1px]"
              >
                
                {/* 1. ANIMATED BORDER LAYER */}
                <div className={cn("absolute inset-0 opacity-50", SHIMMER_BG_CLASS)} />
                <div className="absolute inset-0 bg-blue-900/20" /> 
                
                {/* 2. MAIN MODAL CONTENT */}
                <div className="relative w-full h-full bg-[#050a18] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/30 bg-[#050a18]/80 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-6 bg-blue-600 rounded-full" />
                            <h2 className="text-xl font-black text-white tracking-tighter">
                            BULLMONEY <span className="text-white-800">HUB</span>
                            </h2>
                        </div>
                        <button 
                            onClick={() => setOpen(false)}
                            className="p-1.5 rounded-full bg-blue-900/20 hover:bg-blue-900/40 transition-colors duration-500 text-blue-300 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        
                        {/* --- YOUTUBE CARD --- */}
                        <div className="md:col-span-2 lg:col-span-2 h-[260px]">
                            <EvervaultCard className="h-full">
                            <div className="flex flex-col h-full w-full">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-red-500/10 border border-red-500/20 rounded-md">
                                            <Youtube className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white leading-none">LIVESTREAM</h3>
                                        </div>
                                    </div>
                                    {isLive && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" /> 
                                            <span className="text-[9px] font-bold text-red-500 tracking-wider">LIVE</span>
                                        </span>
                                    )}
                                </div>

                                <div className="relative flex-grow rounded-lg overflow-hidden border border-blue-900/30 bg-[#050a18]/50 group-hover:border-red-500/30 transition-colors duration-500">
                                    <LiveVideoPreview isLive={isLive} />
                                </div>
                                
                                <div className="mt-3">
                                    <button
                                        onClick={() => window.open("https://youtube.com/@BULLMONEY.ONLINE", "_blank")}
                                        className={cn(
                                            "w-full py-2 border border-blue-900/30 text-blue-100 hover:text-white font-bold text-xs rounded-lg transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden relative",
                                            "bg-blue-950/50 hover:bg-blue-900/50", 
                                            SHIMMER_BG_CLASS 
                                        )}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            OPEN CHANNEL <ExternalLink className="w-3 h-3" />
                                        </span>
                                    </button>
                                </div>
                            </div>
                            </EvervaultCard>
                        </div>

                        {/* --- DIRECTORY ITEMS --- */}
                        {directoryItems.map((item, idx) => {
                            const isLastItem = idx === directoryItems.length - 1;
                            
                            return (
                            <div 
                                key={idx} 
                                className={cn(
                                "h-[200px] relative", // Added relative for absolute HelperTip positioning
                                isLastItem ? "md:col-span-2 lg:col-span-3 lg:h-[140px]" : "" 
                                )}
                            >
                                {/* Helper Tip - Only shows if active index matches */}
                                <AnimatePresence>
                                    {activeTipIndex === idx && (
                                        <HelperTip label={item.name} />
                                    )}
                                </AnimatePresence>

                                <EvervaultCard>
                                    <div className={cn(
                                        "flex h-full w-full relative z-20",
                                        isLastItem ? "flex-row items-center justify-between gap-6" : "flex-col justify-between"
                                    )}>
                                        <div className={isLastItem ? "flex items-center gap-4" : ""}>
                                            <div className={cn(
                                                "rounded-xl bg-blue-950/30 border border-blue-900/30 flex items-center justify-center motion-safe:group-hover:scale-105 transition-transform duration-700",
                                                isLastItem ? "w-14 h-14" : "w-10 h-10 mb-4"
                                            )}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors duration-500">{item.name}</h3>
                                                <p className="text-blue-200/60 text-xs mt-1 leading-relaxed max-w-[200px]">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <Link 
                                            href={{ pathname: item.link, query: { src: "directory" } }} 
                                            className={cn("group/btn relative overflow-hidden", isLastItem ? "w-auto min-w-[120px]" : "w-full mt-auto")}
                                        >
                                            <div
                                                className={cn(
                                                "relative w-full rounded-lg overflow-hidden text-center",
                                                "border border-blue-900/30 bg-blue-950/40",
                                                SHIMMER_BG_CLASS, 
                                                "group-hover/btn:border-blue-500/50 group-hover/btn:bg-blue-900/30 transition-all duration-500",
                                                isLastItem ? "py-3 px-6" : "py-2"
                                                )}
                                            >
                                                <span className="relative z-10 text-blue-100 text-xs font-bold tracking-wide group-hover/btn:text-white transition-colors duration-500">
                                                    ACCESS
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                </EvervaultCard>
                            </div>
                            );
                        })}
                        </div>
                    </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(2, 6, 17, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 58, 138, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }
        
        @keyframes shimmer-fast {
          from { background-position: 0% 0%; }
          to { background-position: -250% 0%; }
        }
        .animate-shimmer-fast { animation: shimmer-fast 3s linear infinite; } 
      `}</style>
    </div>
  );
}