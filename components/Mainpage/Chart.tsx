"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Orb from "../Mainpage/Vorb"; // Adjust path if needed
import { SparklesCore } from "./sparkles"; // Adjust path if needed

// --- THREE.JS IMPORTS FOR GHOST CURSOR ---
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// =========================================
// 1. GHOST CURSOR COMPONENT
// =========================================

const GhostCursorBackground = ({
  trailLength = 50,
  bloomStrength = 0.5,
  bloomRadius = 0.5,
  color = "#4aa0ff",
}) => {
  // FIXED: Added <any> to refs to prevent TS errors on .current properties
  const containerRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const materialRef = useRef<any>(null);

  // Configuration
  const inertia = 0.4;
  const grainIntensity = 0.04;
  const bloomThreshold = 0.05;
  const brightness = 1.2;
  const fadeDelay = 500;
  const fadeDuration = 1000;

  // State
  // FIXED: Typed as any[] so you can push objects into it later
  const trailBufRef = useRef<any[]>([]);
  const headRef = useRef(0);
  const rafRef = useRef<any>(null);
  const resizeObsRef = useRef<any>(null);
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

      gl_FragColor = vec4(colorAcc, clamp(finalAlpha, 0.0, 1.0));
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
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){vec4 c=texture2D(tDiffuse,vUv); float a=max(c.a,1e-5); gl_FragColor=vec4(clamp(c.rgb/a,0.0,1.0),c.a);}`
  });

  // FIXED: Explicitly typed 'el' as HTMLElement
  function calculateScale(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const base = 800;
    const current = Math.min(Math.max(1, r.width), Math.max(1, r.height));
    return Math.max(0.5, Math.min(2.5, current / base));
  }

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const parent = host.parentElement || document.body;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false
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
        iPrevMouse: { value: trailBufRef.current.map((v: any) => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: 1.0 },
        iBaseColor: { value: new THREE.Color(color) },
        iBrightness: { value: brightness },
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = rect.width;
      const cssH = rect.height;
      const wpx = Math.floor(cssW * dpr);
      const hpx = Math.floor(cssH * dpr);

      renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
      composer.setPixelRatio(dpr);
      composer.setSize(cssW, cssH);
      
      material.uniforms.iResolution?.value.set(wpx, hpx, 1);
      if (material.uniforms.iScale) {
        material.uniforms.iScale.value = calculateScale(host);
      }
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

      if (pointerActiveRef.current && material.uniforms.iMouse) {
        velocityRef.current.set(
          currentMouseRef.current.x - material.uniforms.iMouse.value.x,
          currentMouseRef.current.y - material.uniforms.iMouse.value.y
        );
        material.uniforms.iMouse.value.copy(currentMouseRef.current);
        fadeOpacityRef.current = 1.0;
      } else if (material.uniforms.iMouse) {
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

      if (material.uniforms.iMouse && material.uniforms.iPrevMouse) {
        const N = trailBufRef.current.length;
        headRef.current = (headRef.current + 1) % N;
        trailBufRef.current[headRef.current].copy(material.uniforms.iMouse.value);
        const arr = material.uniforms.iPrevMouse.value;
        for (let i = 0; i < N; i++) {
          const srcIdx = (headRef.current - i + N) % N;
          arr[i].copy(trailBufRef.current[srcIdx]);
        }
      }

      if (material.uniforms.iOpacity) material.uniforms.iOpacity.value = fadeOpacityRef.current;
      if (material.uniforms.iTime) material.uniforms.iTime.value = t;
      if (filmPass.uniforms?.iTime) filmPass.uniforms.iTime.value = t;

      composer.render();
      rafRef.current = requestAnimationFrame(animate);
    };

    // FIXED: Explicitly typed 'e' as any to avoid implicit any error
    const onPointerMove = (e: any) => {
      const rect = host.getBoundingClientRect(); 
      const x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      currentMouseRef.current.set(x, y);
      pointerActiveRef.current = true;
      lastMoveTimeRef.current = performance.now();
    };

    // Attach listener to parent container
    parent.addEventListener('pointermove', onPointerMove);
    
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      parent.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      scene.clear();
      renderer.dispose();
      composer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color]);

  useEffect(() => {
    if (materialRef.current) {
       materialRef.current.uniforms.iBaseColor.value.set(color);
    }
  }, [color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
};


// =========================================
// 2. MAIN RECRUIT PAGE
// =========================================

export default function RecruitPage() {
  const [open, setOpen] = useState(false);
  const [isLive, setIsLive] = useState(false); 
  const router = useRouter(); 

  const handleVIPAccessClick = () => {
    router.push("/shop");
  };

  const handleLiveStreamClick = () => {
    window.open("https://youtube.com/bullmoney.online", "_blank");
  };

  const handleMentorshipClick = () => {
    router.push("/about");
  };

  useEffect(() => {
    const checkLiveStatus = async () => {
      setIsLive(true); 
    };
    checkLiveStatus();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        position: "relative",
        background: "radial-gradient(circle at center, #030712 0%, #000 100%)",
        overflow: "hidden",
      }}
    >
      {/* 1. GHOST CURSOR (Layer 0 - Bottom) */}
      <GhostCursorBackground 
        trailLength={60} 
        color="#ffffff" // Sky blue match
        bloomStrength={0.6}
        bloomRadius={0.7}
      />

      {/* 2. SPARKLES (Layer 1 - Middle) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none mix-blend-screen">
        <SparklesCore
          id="tsparticlesrecruit"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* 3. MAIN CONTENT (Layer 2 - Top) */}
      <div className="relative z-10 w-full h-full">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
          onButtonClick={() => setOpen(true)}
          buttonLabel="BULLMONEY VIP"
        />

        {/* === ⚡ Slide-Up Modal === */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(8,10,20,0.9), rgba(0,0,0,0.85))",
              }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                key="modal"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 25,
                }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full sm:w-[92%] sm:max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden p-[2px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255, 255, 255,0.6), rgba(255, 255, 255,0.4))",
                  boxShadow:
                    "0 0 50px rgba(255, 255, 255,0.3), inset 0 0 40px rgba(255, 255, 255,0.2)",
                  maxHeight: "90vh",
                }}
              >
                <div
                  className="relative z-10 rounded-t-3xl sm:rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,12,25,0.95) 0%, rgba(3,6,15,0.9) 100%)",
                    maxHeight: "88vh",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>

                  <div className="p-6 sm:p-10">
                    <motion.div
                      className="absolute -top-32 -left-20 w-[300px] h-[300px] rounded-full bg-sky-500/20 blur-[120px]"
                      animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 6 }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-[280px] h-[280px] rounded-full bg-indigo-600/20 blur-[100px]"
                      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 7 }}
                    />

                    <div className="relative z-10 text-center mb-8">
                      <h2 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-sky-400 via-white to-indigo-400 bg-clip-text text-transparent">
                        BULLMONEY VIP
                      </h2>
                      <p className="mt-3 text-neutral-400 text-sm sm:text-base">
                        Join us for exclusive trading tips, live analysis, and real-time market updates. Don&apos;t miss out!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      
                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-gradient-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          VIP Access
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Get access to real-time trading analysis, exclusive tips, and more.
                        </p>
                        <button
                          onClick={handleVIPAccessClick}
                          className="mt-4 px-6 py-2 bg-gradient-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Access Now
                        </button>
                      </div>

                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-gradient-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          Live Streams
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Join live streams for expert market analysis and trade insights.
                        </p>

                        <div className="mt-4 relative w-full h-48 bg-black rounded-lg overflow-hidden">
                          {isLive ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src="https://www.youtube.com/embed/LIVE_STREAM_ID?autoplay=1"
                              title="YouTube live stream"
                              frameBorder="0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          ) : (
                            <iframe
                              width="100%"
                              height="100%"
                              src="https://www.youtube.com/embed/FALLBACK_VIDEO_ID"
                              title="YouTube video"
                              frameBorder="0"
                              allow="encrypted-media"
                              allowFullScreen
                            />
                          )}
                        </div>

                        <button
                          onClick={handleLiveStreamClick}
                          className="mt-4 px-6 py-2 bg-gradient-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Watch Now
                        </button>
                      </div>

                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-gradient-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          Mentorship
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Get one-on-one mentorship from seasoned traders and learn the ropes.
                        </p>
                        <button
                          onClick={handleMentorshipClick}
                          className="mt-4 px-6 py-2 bg-gradient-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Join Now
                        </button>
                      </div>

                    </div>

                    <button
                      onClick={() => setOpen(false)}
                      className="absolute top-3 right-5 text-sky-300/80 hover:text-sky-400 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}