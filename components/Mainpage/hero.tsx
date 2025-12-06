"use client";
import React, { useRef, useEffect, useState } from "react";
import { 
  AnimatePresence, 
  motion, 
} from "framer-motion";
import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { getCalApi } from "@calcom/embed-react";
import { FlipWords } from "./flip-words";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Russo_One } from "next/font/google";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";

// Three.js Imports for Ghost Cursor
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Component Imports
import { ContainerScroll } from "./container-scroll-animation";
import { EncryptedText } from "./encrypted-text";
import { SparklesCore } from "./sparkles"; 

dayjs.extend(duration);
dayjs.extend(utc);

const russo = Russo_One({ weight: "400", subsets: ["latin"] });

// ===== Types =====
type Trade = {
  active: boolean;
  deadlineISO?: string | null;
  title?: string;
  reason?: string;
  imageUrls?: string[];
};

// ========== MEDIA CAROUSEL ==========
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
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval]);

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] bg-neutral-900/30"
      style={{ aspectRatio: "16 / 9", height: "100%", minHeight: 320 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#0c0c0c] to-[#1a1a1a]"
        >
          {slide.type === "image" && (
            <Image
              src={slide.src}
              alt={slide.title || "Slide image"}
              fill
              className="object-cover object-center"
              priority
            />
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
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                className="absolute inset-0 w-full h-full object-cover"
                src={`https://www.youtube-nocookie.com/embed/${
                  slide.src.includes("youtube.com") || slide.src.includes("youtu.be")
                    ? new URL(slide.src).searchParams.get("v") ||
                      slide.src.split("/").pop()?.split("?")[0]
                    : slide.src
                }?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&fs=0&disablekb=1&loop=1&iv_load_policy=3&playsinline=1&playlist=${
                  new URL(slide.src).searchParams.get("v") ||
                  slide.src.split("/").pop()?.split("?")[0]
                }`}
                title={slide.title || "YouTube video"}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <button
        onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20"
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20"
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current ? "bg-white w-4" : "bg-neutral-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// --- Roll digits (single-card 3D roll) ---
const RollDigit = ({ value }: { value: string }) => {
  const [prev, setPrev] = React.useState(value);
  const [animKey, setAnimKey] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    if (value !== prev) setAnimating(true);
  }, [value, prev]);

  return (
    <div
      className="
        relative rounded-md overflow-hidden
        bg-black text-white border border-white/10
        shadow-[0_10px_16px_rgba(0,0,0,0.35)] [perspective:900px]
      "
      style={{
        width: "var(--digit-w, 56px)",
        height: "var(--digit-h, 72px)",
      }}
    >
      {!animating && (
        <div
          className="absolute inset-0 flex items-center justify-center font-bold tabular-nums"
          style={{ fontSize: "var(--digit-f, 44px)", lineHeight: 1 }}
        >
          {prev}
        </div>
      )}

      {animating && (
        <motion.div
          key={animKey}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -180 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          className="absolute inset-0"
          onAnimationComplete={() => {
            setPrev(value);
            setAnimating(false);
            setAnimKey((k) => k + 1);
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums [backface-visibility:hidden]"
            style={{ fontSize: "var(--digit-f, 44px)", lineHeight: 1 }}
          >
            {prev}
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums [backface-visibility:hidden]"
            style={{
              fontSize: "var(--digit-f, 44px)",
              lineHeight: 1,
              transform: "rotateX(180deg) translateZ(0.01px)",
            }}
          >
            {value}
          </div>
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_45%,transparent_55%,rgba(0,0,0,0.28))]" />
    </div>
  );
};

//Helpers
const pad2 = (n: number) => n.toString().padStart(2, "0");
type Parts = { totalMs: number; d: number; h: number; m: number; s: number };

const calcParts = (deadlineISO: string): Parts => {
  const end = dayjs.utc(deadlineISO);
  const now = dayjs.utc();
  const diffMs = Math.max(0, end.diff(now));
  const total = Math.floor(diffMs / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { totalMs: diffMs, d, h, m, s };
};


// ========== NEW GHOST CURSOR COMPONENT (THREE.JS) ==========
const GhostCursor = ({
  trailLength = 50,
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  color = "#4aa0ff",
}: {
  trailLength?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  color?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // Hardcoded defaults
  const inertia = 0.5;
  const grainIntensity = 0.05;
  const bloomThreshold = 0.025;
  const brightness = 1;
  const edgeIntensity = 0;
  const fadeDelay = 1000;
  const fadeDuration = 1500;

  // Trail state
  const trailBufRef = useRef<THREE.Vector2[]>([]);
  const headRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const currentMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(new THREE.Vector2(0, 0));
  const fadeOpacityRef = useRef(1.0);
  const lastMoveTimeRef = useRef(0);
  const pointerActiveRef = useRef(false);

  // Shaders
  const baseVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    uniform float iBrightness;
    uniform float iEdgeIntensity;
    varying vec2  vUv;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }
    vec3 tint1(vec3 base){ return mix(base, vec3(1.0), 0.15); }
    vec3 tint2(vec3 base){ return mix(base, vec3(0.8, 0.9, 1.0), 0.25); }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      vec2 r = vec2(fbm(p * iScale + q * 1.5 + iTime * 0.15), fbm(p * iScale + q * 1.5 + vec2(8.3,2.8) + iTime * 0.15));
      float smoke = fbm(p * iScale + r * 0.8);
      float radius = 0.5 + 0.3 * (1.0 / iScale);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(p - mousePos));
      float alpha = pow(smoke, 2.5) * distFactor;
      vec3 c1 = tint1(iBaseColor);
      vec3 c2 = tint2(iBaseColor);
      vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);
      return vec4(color * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;
      
      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;

      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = pow(t, 2.0);
        if (t > 0.01) {
          vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
          colorAcc += bt.rgb;
          alphaAcc += bt.a;
        }
      }
      colorAcc *= iBrightness;
      
      float edgeX = min(vUv.x, 1.0 - vUv.x);
      float edgeY = min(vUv.y, 1.0 - vUv.y);
      float minEdge = min(edgeX, edgeY);
      float edgeFade = smoothstep(0.0, 0.15, minEdge);
      float finalAlpha = alphaAcc * iOpacity * edgeFade;

      float outAlpha = clamp(finalAlpha, 0.0, 1.0);
      gl_FragColor = vec4(colorAcc, outAlpha);
    }
  `;

  const FilmGrainShader = {
    uniforms: {
      tDiffuse: { value: null },
      iTime: { value: 0 },
      intensity: { value: grainIntensity }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float iTime;
      uniform float intensity;
      varying vec2 vUv;
      float hash1(float n){ return fract(sin(n)*43758.5453); }
      void main(){
        vec4 color = texture2D(tDiffuse, vUv);
        float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
        color.rgb += n * intensity * color.rgb;
        gl_FragColor = color;
      }
    `
  };

  const UnpremultiplyPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float a = max(c.a, 1e-5);
        vec3 straight = c.rgb / a;
        gl_FragColor = vec4(clamp(straight, 0.0, 1.0), c.a);
      }
    `
  });

  function calculateScale(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const base = 600;
    const current = Math.min(Math.max(1, r.width), Math.max(1, r.height));
    return Math.max(0.5, Math.min(2.0, current / base));
  }

  useEffect(() => {
    const host = containerRef.current;
    const parent = host?.parentElement || document.body; 
    
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    renderer.domElement.style.pointerEvents = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    const maxTrail = Math.max(1, Math.floor(trailLength));
    trailBufRef.current = Array.from({ length: maxTrail }, () => new THREE.Vector2(0.5, 0.5));
    headRef.current = 0;

    const material = new THREE.ShaderMaterial({
      defines: { MAX_TRAIL_LENGTH: maxTrail },
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iPrevMouse: { value: trailBufRef.current.map(v => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: 1.0 },
        iBaseColor: { value: new THREE.Color(color) },
        iBrightness: { value: brightness },
        iEdgeIntensity: { value: edgeIntensity }
      },
      vertexShader: baseVertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geom, material));

    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, bloomThreshold);
    composer.addPass(bloomPass);
    const filmPass = new ShaderPass(FilmGrainShader as any);
    composer.addPass(filmPass);
    composer.addPass(UnpremultiplyPass);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssW = rect.width;
      const cssH = rect.height;
      const wpx = Math.floor(cssW * dpr);
      const hpx = Math.floor(cssH * dpr);

      renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
      composer.setPixelRatio?.(dpr);
      composer.setSize(cssW, cssH);
      
      material.uniforms.iResolution.value.set(wpx, hpx, 1);
      material.uniforms.iScale.value = calculateScale(host);
      bloomPass.setSize(wpx, hpx);
    };

    const ro = new ResizeObserver(resize);
    resizeObsRef.current = ro;
    ro.observe(host);
    resize();

    const start = performance.now();
    const animate = () => {
      const now = performance.now();
      const t = (now - start) / 1000;

      if (pointerActiveRef.current) {
        velocityRef.current.set(
          currentMouseRef.current.x - material.uniforms.iMouse.value.x,
          currentMouseRef.current.y - material.uniforms.iMouse.value.y
        );
        material.uniforms.iMouse.value.copy(currentMouseRef.current);
        fadeOpacityRef.current = 1.0;
      } else {
        velocityRef.current.multiplyScalar(inertia);
        if (velocityRef.current.lengthSq() > 1e-6) {
          material.uniforms.iMouse.value.add(velocityRef.current);
        }
        const dt = now - lastMoveTimeRef.current;
        if (dt > fadeDelay) {
          const k = Math.min(1, (dt - fadeDelay) / fadeDuration);
          fadeOpacityRef.current = Math.max(0, 1 - k);
        }
      }

      const N = trailBufRef.current.length;
      headRef.current = (headRef.current + 1) % N;
      trailBufRef.current[headRef.current].copy(material.uniforms.iMouse.value);
      const arr = material.uniforms.iPrevMouse.value as THREE.Vector2[];
      for (let i = 0; i < N; i++) {
        const srcIdx = (headRef.current - i + N) % N;
        arr[i].copy(trailBufRef.current[srcIdx]);
      }

      material.uniforms.iOpacity.value = fadeOpacityRef.current;
      material.uniforms.iTime.value = t;
      if (filmPass.uniforms?.iTime) filmPass.uniforms.iTime.value = t;

      composer.render();
      rafRef.current = requestAnimationFrame(animate);
    };
    
    // Pointer handling
    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect(); 
      const x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      currentMouseRef.current.set(x, y);
      pointerActiveRef.current = true;
      lastMoveTimeRef.current = performance.now();
    };
    
    parent.addEventListener('pointermove', onPointerMove as any); 
    
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      parent.removeEventListener('pointermove', onPointerMove as any);
      ro.disconnect();
      scene.clear();
      renderer.dispose();
      composer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color]);

  useEffect(() => {
    if (materialRef.current) {
       materialRef.current.uniforms.iBaseColor.value.set(color);
    }
  }, [color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
};


// ========== HERO ==========
export function Hero() {
  
  const parentRef = useRef<HTMLDivElement>(null);

  const [trade, setTrade] = useState<Trade | null>(null);
  const [parts, setParts] = useState<Parts>({ totalMs: 0, d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", { theme: "dark", hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const res = await fetch(`/api/trade?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        setTrade(data);
      } catch (err) {
        console.error("Error fetching trade:", err);
      }
    };
    fetchTrade();

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<Trade>).detail;
      if (detail) setTrade(detail);
      else fetchTrade();
    };

    window.addEventListener("trade:updated", onUpdated);
    return () => window.removeEventListener("trade:updated", onUpdated);
  }, []);

  useEffect(() => {
    if (!trade?.active || !trade.deadlineISO) {
      setParts({ totalMs: 0, d: 0, h: 0, m: 0, s: 0 });
      return;
    }

    const tick = () => setParts(calcParts(trade.deadlineISO!));
    tick(); 
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trade?.active, trade?.deadlineISO]);

  return (
    <div
      ref={parentRef}
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-neutral-950 w-full"
    >
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

      {/* CONTAINER SCROLL ANIMATION with MediaCarousel & Title */}
      <div className="relative z-20 w-full -mt-20 md:-mt-10 lg:-mt-0">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-10 w-full">
              
              {/* MAIN HEADER INSIDE SCROLL CONTAINER */}
              <div className="relative w-full overflow-hidden mb-6 sm:mb-8 px-4">
                <div
                  className="grid items-center gap-3
                  grid-cols-[minmax(64px,1fr)_auto_minmax(64px,1fr)]
                  sm:grid-cols-[minmax(96px,1fr)_auto_minmax(96px,1fr)]
                  md:grid-cols-[minmax(140px,1fr)_auto_minmax(140px,1fr)]"
                >
                  {/* LEFT BARS */}
                  <motion.div
                    initial={{ x: "-110%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="justify-self-end flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none"
                  >
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
                          text="Built for those who want more than trades." 
                          interval={40}
                          className="whitespace-normal" 
                        />
                      </h2>
                    </Balancer>
                  </div>

                  {/* RIGHT BARS */}
                  <motion.div
                    initial={{ x: "110%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="justify-self-start flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none"
                  >
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
                <FlipWords words={["CHARTS", "PRICE ACTION", "ORDER FLOW", "PATTERNS"]} duration={4000} className="px-0 font-bold text-blue-500" />
                , SHARPEN YOUR{" "}
                <FlipWords words={["PSYCHOLOGY", "DISCIPLINE", "PATIENCE", "RISK CONTROL"]} duration={4000} className="px-0 font-bold text-blue-500" />
                , AND TRADE{" "}
                <FlipWords words={["CRYPTO", "GOLD", "INDICES", "FOREX"]} duration={4000} className="px-0 font-bold text-blue-500" />
                WITH CONFIDENCE.
              </motion.p>
            </div>
          }
        >
          <MediaCarousel
            slides={[
              { type: "video", src: "/newhero.mp4" },
              { type: "image", src: "/Fvfront.png" },
              { type: "youtube", src: "https://www.youtube.com/watch?v=wWB_SeA15dU" },
              { type: "youtube", src: "https://youtu.be/ZWKp63JTvgE?si=wgEIY6alRVwG-ZJl&t=38" },
              { type: "image", src: "/bullmoneyvantage.png" },
            ]}
          />
        </ContainerScroll>
      </div>

    </div>
  );
}