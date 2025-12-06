"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { getCalApi } from "@calcom/embed-react";
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

// Three.js Imports
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Particle Imports
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

// REMOVED CONFLICTING RELATIVE IMPORTS: 
// import { ContainerScroll } from "./container-scroll-animation";
// import { EncryptedText } from "./encrypted-text";

dayjs.extend(duration);
dayjs.extend(utc);

const russo = Russo_One({ weight: "400", subsets: ["latin"] });

// =========================================
// INLINED UTILITIES / MOCKUPS
// =========================================

// --- Mock EncryptedText (Inlined logic) ---
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
    const [displayedText, setDisplayedText] = useState(text.replace(/./g, '█'));
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
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

            const targetLength = Math.min(text.length, Math.floor(elapsed / interval));

            if (index < text.length) {
                const newText = text.substring(0, targetLength) + text.substring(targetLength).replace(/./g, '█');
                setDisplayedText(newText);
                index = targetLength;
                
                if (index < text.length) {
                    animationFrameId = requestAnimationFrame(decrypt);
                } else {
                    setIsRevealed(true);
                }
            }
        };

        const startTime = Date.now();
        animationFrameId = requestAnimationFrame(decrypt);

        return () => cancelAnimationFrame(animationFrameId);
    }, [text, interval, revealDelayMs]);

    return (
        <span className={cn(className, isRevealed ? revealedClassName : encryptedClassName)}>
            {displayedText}
        </span>
    );
};

// --- Mock ContainerScroll (Inlined logic) ---
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

    // Rotation from 0 to -20 degrees as scroll goes from 0% to 100%
    const rotate = (p: number) => (p / 100) * -20; 
    // Perspective scale from 0.8 to 1.0
    const scale = (p: number) => 0.8 + (p / 100) * 0.2; 
    
    // Y-translation to lift the item slightly at full scroll
    const translateY = (p: number) => (p / 100) * 50; 

    return (
        <div ref={containerRef} className="relative flex flex-col items-center justify-center pt-[50vh] pb-[10vh]">
            <motion.div 
                style={{ 
                    rotateX: 0, // This is controlled by the outer scroll animation
                    perspective: '1000px',
                }}
            >
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

// =========================================
// 1. FLIP WORDS (Inlined)
// =========================================
const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const startAnimation = useCallback(() => {
    // Safety check for empty words list
    if (words.length === 0) return;
    
    const currentIndex = words.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % words.length;
    const word = words[nextIndex];

    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating && words.length > 0) {
      const timeoutId = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timeoutId);
    }
  }, [isAnimating, duration, startAnimation, words.length]);

  if (words.length === 0) return <span className={cn("text-neutral-500", className)}>...</span>;

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
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

// =========================================
// 2. MEDIA CAROUSEL
// =========================================
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

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  slides,
  height = 540,
  autoSlideInterval = 8000,
}) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval]);

  if (slides.length === 0) {
    return (
      <div className="w-full h-full bg-neutral-900/30 flex items-center justify-center text-neutral-500 border border-neutral-800 rounded-[32px]">
        <div className="text-center">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No media configured</p>
        </div>
      </div>
    );
  }

  const slide = slides[current];

  // Helper function to extract YouTube ID
  const getYoutubeId = (src: string): string => {
    if (src.includes("youtube.com") || src.includes("youtu.be")) {
      try {
        const url = new URL(src.includes("http") ? src : `https://www.youtube.com/watch?v=${src}`);
        return url.searchParams.get("v") || src.split("/").pop()?.split("?")[0] || src;
      } catch {
        return src; // Fallback to raw string if URL parsing fails
      }
    }
    return src;
  };
  
  const videoId = getYoutubeId(slide.src);
  const videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}&vq=hd1080`;


  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] bg-neutral-900/30 border border-neutral-800 shadow-2xl"
      style={{ aspectRatio: "16 / 9", height: "100%", minHeight: 320 }}
    >
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
              {/* FIX: Using standard img tag to bypass Next/Image external host configuration requirement */}
              <img
                src={slide.src}
                alt={slide.title || "Slide image"}
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
              />
            </div>
          )}
          {slide.type === "video" && (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={slide.src} type="video/mp4" />
            </video>
          )}
          {slide.type === "youtube" && (
            <div className="absolute inset-0 w-full h-full">
               <iframe
                className="w-full h-full object-cover"
                src={videoSrc}
                title={slide.title || "YouTube video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <button
        onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20 border border-white/10 backdrop-blur-sm transition-all active:scale-95"
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20 border border-white/10 backdrop-blur-sm transition-all active:scale-95"
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current ? "bg-white w-6" : "bg-neutral-500/50 w-2 hover:bg-neutral-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// =========================================
// 3. SPARKLES COMPONENT (Inlined)
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
            particles: {
              color: { value: particleColor },
              move: { enable: true, speed: speed },
              number: { density: { enable: true, width: 1920, height: 1080 }, value: particleDensity },
              opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed } },
              size: { value: { min: minSize, max: maxSize } },
            },
          } as any}
        />
      )}
    </div>
  );
};

// =========================================
// 4. GHOST CURSOR (Inlined with Edge Fading Fix)
// =========================================
const GhostCursor = ({
  trailLength = 50,
  bloomStrength = 0.4,
  bloomRadius = 0.5,
  color = "#4aa0ff",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Logic Refs
  const trailBufRef = useRef<THREE.Vector2[]>([]);
  const headRef = useRef(0);
  const currentMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const pointerActiveRef = useRef(false);

  // Shader Code
  const baseVertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;

  const fragmentShader = `
    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    varying vec2  vUv; // vUv represents UV coordinates (0 to 1 across the plane)

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0; float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){ v += a * noise(p); p = m * p * 2.0; a *= 0.5; }
      return v;
    }
    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      float smoke = fbm(p * iScale + q * 1.5);
      float distFactor = 1.0 - smoothstep(0.0, 0.5 + 0.3/iScale, length(p - mousePos));
      float alpha = pow(smoke, 2.5) * distFactor;
      return vec4(iBaseColor * alpha * intensity, alpha * intensity);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;
      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb; alphaAcc += b.a;
      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = pow(t, 2.0);
        if (t > 0.01) {
          vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
          colorAcc += bt.rgb; alphaAcc += bt.a;
        }
      }
      
      // --- EDGE FADING LOGIC ---
      float fadeAmount = 0.1; // Distance from edge (0.0 to 0.5) where fade starts
      float edgeX = smoothstep(0.0, fadeAmount, vUv.x) * smoothstep(0.0, fadeAmount, 1.0 - vUv.x);
      float edgeY = smoothstep(0.0, fadeAmount, vUv.y) * smoothstep(0.0, fadeAmount, 1.0 - vUv.y);
      float edgeFade = min(edgeX, edgeY); // Fade based on the closest edge
      
      gl_FragColor = vec4(colorAcc, alphaAcc * iOpacity * edgeFade); // Apply fading to final alpha
    }
  `;

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, depth: false });
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    renderer.domElement.style.pointerEvents = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    const maxTrail = Math.floor(trailLength);
    trailBufRef.current = Array.from({ length: maxTrail }, () => new THREE.Vector2(0.5, 0.5));

    const material = new THREE.ShaderMaterial({
      defines: { MAX_TRAIL_LENGTH: maxTrail },
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iPrevMouse: { value: trailBufRef.current.map(v => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: 1.0 },
        iBaseColor: { value: new THREE.Color(color) }
      },
      vertexShader: baseVertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false
    });
    scene.add(new THREE.Mesh(geom, material));

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, 0);
    composer.addPass(bloomPass);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      composer.setSize(rect.width, rect.height);
      material.uniforms.iResolution.value.set(rect.width * dpr, rect.height * dpr, 1);
      material.uniforms.iScale.value = Math.max(0.5, Math.min(2.0, Math.min(rect.width, rect.height) / 600));
      bloomPass.setSize(rect.width * dpr, rect.height * dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const start = performance.now();
    let rafId: number;

    const animate = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      
      const N = trailBufRef.current.length;
      headRef.current = (headRef.current + 1) % N;
      trailBufRef.current[headRef.current].copy(currentMouseRef.current);
      
      const arr = material.uniforms.iPrevMouse.value as THREE.Vector2[];
      for (let i = 0; i < N; i++) {
        arr[i].copy(trailBufRef.current[(headRef.current - i + N) % N]);
      }

      material.uniforms.iOpacity.value = 1.0;
      material.uniforms.iTime.value = t;

      composer.render();
      rafId = requestAnimationFrame(animate);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      currentMouseRef.current.set(x, y);
      pointerActiveRef.current = true;
    };

    window.addEventListener('pointermove', onPointerMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

// =========================================
// 5. ADMIN CONFIG & TYPES
// =========================================

// Config Type
type HeroConfig = {
  title: string;
  // Flip Words Lists
  flipList1: string;
  flipList2: string;
  flipList3: string;
  // Slides
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
    { type: "youtube", src: "wWB_SeA15dU", title: "Demo 1" },
    { type: "youtube", src: "ZWKp63JTvgE", title: "Demo 2" },
    { type: "image", src: "https://placehold.co/1600x900/1e293b/FFFFFF?text=bullmoneyvantage.png", title: "Analytics" },
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
      <GhostCursor />
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
function ContentDashboard({ config, onSave, onLogout, onClose }: { config: HeroConfig; onSave: (newConfig: HeroConfig) => void; onLogout: () => void; onClose: () => void; }) {
  const [formData, setFormData] = useState<HeroConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Slide Editor State
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
    await new Promise(r => setTimeout(r, 600));
    onSave(formData);
    setSaveMessage("Published successfully!");
    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
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
        {saveMessage && <div className="p-3 bg-green-500/10 text-green-400 text-xs rounded-xl flex gap-2"><CheckCircle2 className="w-4 h-4" />{saveMessage}</div>}
        
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
           
           {/* Add New Slide */}
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

           {/* List Slides */}
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

  useEffect(() => {
    (async () => {
      // NOTE: getCalApi dependency removed, but we keep the mock initialization structure
      // const cal = await getCalApi({ namespace: "15min" });
      // cal("ui", { theme: "dark", hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("new_hero_config");
    if (saved) try { setHeroConfig(JSON.parse(saved)); } catch (e) { console.error(e); }
  }, []);

  const updateConfig = (newConfig: HeroConfig) => {
    setHeroConfig(newConfig);
    localStorage.setItem("new_hero_config", JSON.stringify(newConfig));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-neutral-950 w-full">
      {/* UPDATED GHOST CURSOR */}
      <GhostCursor />

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
                        <EncryptedText 
                          text={heroConfig.title}
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
                <FlipWords words={heroConfig.flipList1.split(',').map(s => s.trim())} duration={4000} className="px-0 font-bold text-blue-500" />
                , SHARPEN YOUR{" "}
                <FlipWords words={heroConfig.flipList2.split(',').map(s => s.trim())} duration={4000} className="px-0 font-bold text-blue-500" />
                , AND TRADE{" "}
                <FlipWords words={heroConfig.flipList3.split(',').map(s => s.trim())} duration={4000} className="px-0 font-bold text-blue-500" />
                WITH CONFIDENCE.
              </motion.p>
            </div>
          }
        >
          <MediaCarousel slides={heroConfig.slides} />
        </ContainerScroll>
      </div>

    </div>
  );
}