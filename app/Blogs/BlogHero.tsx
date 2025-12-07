"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContainerScroll } from "@/components/Mainpage/container-scroll-animation"; 
import { EncryptedText } from "@/components/Mainpage/encrypted-text"; 
import { cn } from "@/lib/utils";
import { 
  Lock, X, LogIn, Save, RefreshCw, LogOut, 
  ShieldCheck, Loader2, Youtube, Type, LayoutTemplate, CheckCircle2 
} from "lucide-react";

// --- PARTICLE IMPORTS ---
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// =========================================
// 1. CONFIGURATION TYPES
// =========================================

const DEFAULT_HERO_CONFIG = {
  videoId: "iiRASep8V9c",
  badge: "BullMoney Intelligence",
  title: "MARKET INSIGHTS",
  subtitle: "Deep dives into crypto market trends, analysis, and future predictions.",
  primaryCta: "Read Latest",
  secondaryCta: "Subscribe"
};

type HeroConfig = typeof DEFAULT_HERO_CONFIG;

// =========================================
// 2. SUB-COMPONENTS
// =========================================

// --- A. LOGIN MODAL ---
function LoginPortal({ onLogin, onClose }: { onLogin: () => void, onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side check for UI access. 
    // Actual DB writes are protected by the API Route using Service Role Key.
    if (username.trim() === "MR.BULLMONEY" && password.trim() === "9D6W5D6SD6S7DA6D5D5ADS5A6XVXASXR6723RE627EDGED") {
      onLogin();
    } else {
      setError("Access Denied. Invalid credentials.");
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-center p-4 bg-[#020617] overflow-hidden rounded-3xl">
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                 <ShieldCheck className="w-6 h-6 text-sky-500" />
                 Secure Admin
              </h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:bg-slate-900/50 outline-none transition-all"
                  placeholder="admin"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 focus:bg-slate-900/50 outline-none transition-all"
                  placeholder="admin"
                />
              </div>
              {error && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(2,132,199,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                <LogIn className="w-4 h-4" />
                Authenticate
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- B. CONTENT EDITOR DASHBOARD ---
function ContentDashboard({ 
  config, 
  onSave, 
  onLogout,
  onClose 
}: { 
  config: HeroConfig; 
  onSave: (newConfig: HeroConfig) => Promise<void>; 
  onLogout: () => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<HeroConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
        await onSave(formData);
        setSaveMessage("Changes published to Supabase!");
        setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
        setSaveMessage("Failed to save changes.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#050B14] text-white p-6 flex flex-col rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-sky-500/30 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 z-10">
        <div>
           <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
             HERO <span className="text-sky-500">MANAGER</span>
           </h1>
           <p className="text-slate-400 text-xs">Edit the landing page content.</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setFormData(config)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 transition-all active:scale-95" title="Reset Changes">
             <RefreshCw className="w-4 h-4" />
           </button>
           <button onClick={onLogout} className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors" title="Logout">
             <LogOut className="w-4 h-4" />
           </button>
           <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Close">
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-2 z-10 space-y-5">
        
        {saveMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 border rounded-xl flex items-center gap-2 text-xs ${
                saveMessage.includes("Failed") 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-green-500/10 border-green-500/30 text-green-400"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {saveMessage}
          </motion.div>
        )}

        {/* Video Section */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
           <div className="flex items-center gap-2 text-sky-400 mb-1">
             <Youtube className="w-4 h-4" />
             <h3 className="text-xs font-bold uppercase tracking-wider">Background Media</h3>
           </div>
           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">YouTube Video ID</label>
             <div className="flex gap-2">
                <input
                  name="videoId"
                  value={formData.videoId}
                  onChange={handleChange}
                  className="flex-1 bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 outline-none font-mono"
                  placeholder="e.g. iiRASep8V9c"
                />
             </div>
             <p className="text-[10px] text-slate-500 pl-1">ID only, not the full URL. Used for the 3D scroll background.</p>
           </div>
        </div>

        {/* Text Content Section */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
           <div className="flex items-center gap-2 text-purple-400 mb-1">
             <Type className="w-4 h-4" />
             <h3 className="text-xs font-bold uppercase tracking-wider">Typography</h3>
           </div>

           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Badge Text</label>
             <input
               name="badge"
               value={formData.badge}
               onChange={handleChange}
               className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
             />
           </div>

           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Main Headline</label>
             <input
               name="title"
               value={formData.title}
               onChange={handleChange}
               className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none font-bold"
             />
           </div>

           <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Subtitle</label>
             <textarea
               name="subtitle"
               rows={3}
               value={formData.subtitle}
               onChange={handleChange}
               className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none"
             />
           </div>
        </div>

        {/* Buttons Section */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
           <div className="flex items-center gap-2 text-green-400 mb-1">
             <LayoutTemplate className="w-4 h-4" />
             <h3 className="text-xs font-bold uppercase tracking-wider">Call to Actions</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Primary Button</label>
               <input
                 name="primaryCta"
                 value={formData.primaryCta}
                 onChange={handleChange}
                 className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
               />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Secondary Button</label>
               <input
                 name="secondaryCta"
                 value={formData.secondaryCta}
                 onChange={handleChange}
                 className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
               />
             </div>
           </div>
        </div>

      </form>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-800 z-10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Publish Changes
        </button>
      </div>

    </div>
  );
}

// =========================================
// 3. EXISTING SPARKLES
// =========================================
const SparklesCore = (props: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}) => {
  const {
    id = "tsparticles",
    className,
    background = "transparent",
    minSize = 0.6,
    maxSize = 1.4,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles
          id={id}
          className={cn("h-full w-full")}
          options={{
            background: { color: { value: background } },
            fullScreen: { enable: false, zIndex: 1 },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: false, mode: "repulse" },
                resize: { enable: true },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
              color: { value: particleColor },
              move: {
                enable: true,
                speed: speed,
                direction: "none",
                random: false,
                straight: false,
                outModes: { default: "out" },
              },
              number: {
                density: { enable: true, width: 1920, height: 1080 },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.1, max: 0.5 },
                animation: { enable: true, speed: speed, sync: false },
              },
              shape: { type: "circle" },
              size: {
                value: { min: minSize, max: maxSize },
              },
            },
            detectRetina: true,
          } as any}
        />
      )}
    </div>
  );
};

// =========================================
// 4. MAIN BLOG HERO COMPONENT
// =========================================

type HeroShopProps = {
  onScrollToProducts?: () => void;
};

export default function BlogHero({ onScrollToProducts }: HeroShopProps) {
  // State
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Fetch from Supabase API on Mount
  useEffect(() => {
    async function fetchHero() {
      try {
        const res = await fetch("/api/blog-hero");
        if (res.ok) {
          const data = await res.json();
          // Merge defaults in case fields are missing
          setHeroConfig(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to load blog hero config", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHero();
  }, []);

  // 2. Handler to update config via API
  const updateConfig = async (newConfig: HeroConfig) => {
    try {
        const res = await fetch("/api/blog-hero", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newConfig),
        });

        if (!res.ok) throw new Error("API Update Failed");
        
        const updated = await res.json();
        
        // Map snake_case response back if needed, or just set local state
        // Our API returns snake_case, but let's assume we just update local state 
        // with what we sent to keep UI snappy, or parse the return if needed.
        // For simplicity:
        setHeroConfig(newConfig);

    } catch (error) {
        console.error("Failed to update hero", error);
        throw error; // Re-throw for the Dashboard to catch
    }
  };

  const fallbackScroll = () => {
    window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" });
  };

  const scrollToContent = onScrollToProducts || fallbackScroll;
  const videoSrc = `https://www.youtube.com/embed/${heroConfig.videoId}?autoplay=1&mute=1&loop=1&playlist=${heroConfig.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&vq=hd1080`;

  return (
    <section className="relative w-full overflow-hidden bg-black pt-10">
      
      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesbloghero"
          background="transparent"
          minSize={1.6}
          maxSize={3.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Admin Trigger (Discreet Lock Icon) */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="absolute top-4 right-4 z-50 p-2 text-white/30 hover:text-sky-500 transition-colors"
        title="Admin Content Manager"
      >
        <Lock className="w-4 h-4" />
      </button>

      {/* ADMIN MODAL WRAPPER */}
      <AnimatePresence>
        {showAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Modal Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowAdmin(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg h-[85vh] md:h-auto md:max-h-[800px] z-10 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#020617]"
              onClick={(e) => e.stopPropagation()}
            >
              {isLoggedIn ? (
                <ContentDashboard 
                  config={heroConfig} 
                  onSave={updateConfig} 
                  onLogout={() => setIsLoggedIn(false)}
                  onClose={() => setShowAdmin(false)}
                />
              ) : (
                <LoginPortal 
                  onLogin={() => setIsLoggedIn(true)} 
                  onClose={() => setShowAdmin(false)}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Ambience (Subtle Gradients) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#171717_0%,transparent_40%)]" />
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-sky-900/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[20%] -right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 flex flex-col">
        {/* Loading State or Content */}
        {isLoading ? (
             <div className="w-full h-[600px] flex items-center justify-center">
                 <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
             </div>
        ) : (
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center mb-10">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/50 border border-neutral-800 backdrop-blur-md"
              >
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-sky-400">
                  {heroConfig.badge}
                </span>
              </motion.div>

              {/* Encrypted Headline */}
              <h1 className="text-5xl md:text-7xl font-black text-white text-center leading-none tracking-tighter mb-6">
                <EncryptedText
                  text={heroConfig.title}
                  encryptedClassName="text-neutral-600"
                  revealedClassName="text-white"
                  revealDelayMs={70}
                />
              </h1>

              {/* Subtitle */}
              <p className="text-neutral-400 text-sm md:text-lg max-w-2xl text-center mx-auto mb-8 leading-relaxed">
                {heroConfig.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={scrollToContent}
                  className="px-8 py-3 rounded-full bg-sky-600 text-white font-bold text-sm hover:bg-sky-500 hover:shadow-[0_0_20px_rgba(2,132,199,0.4)] transition-all"
                >
                  {heroConfig.primaryCta}
                </button>
                <button
                  onClick={scrollToContent}
                  className="px-8 py-3 rounded-full border border-neutral-800 bg-neutral-900/50 text-white font-bold text-sm hover:border-sky-500 hover:text-sky-400 transition-all"
                >
                  {heroConfig.secondaryCta}
                </button>
              </div>
            </div>
          }
        >
          {/* 3D Scroll Container Content: YouTube Video */}
          <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
             <iframe
               width="100%"
               height="100%"
               src={videoSrc}
               title="YouTube video player"
               frameBorder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
               className="w-full h-full object-cover rounded-2xl"
             ></iframe>
            
            {/* Optional Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 rounded-2xl" />
          </div>
        </ContainerScroll>
        )}
      </div>
    </section>
  );
}