"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import { ShopProvider } from "../VIP/ShopContext"; 
import HeroShop from "@/app/shop/Hero"; 
import ShopHero from "@/app/shop/ShopHero"; 
import ProductsSection from "@/app/VIP/ProductsSection"; 
import RecruitPage from "@/app/register/pageVip";
import Socials from "@/components/Mainpage/Socialsfooter";
import Socialsfooter from "@/components/Mainpage/Socials";
import Faq from "@/app/shop/Faq";
// --- THREE.JS IMPORTS FOR GHOST CURSOR ---
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import Shopmain from "@/components/Mainpage/ShopMainpage";
// =========================================
// 1. GHOST CURSOR BACKGROUND (Three.js)
// =========================================

type GhostCursorProps = {
  style?: React.CSSProperties;
  trailLength?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  color?: string; 
};

const GhostCursorBackground: React.FC<GhostCursorProps> = ({
  style,
  trailLength = 50,
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  color = "#4aa0ff", // 🔵 Electric Blue
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = containerRef.current;
    if (!host) return;

    // Config
    const inertia = 0.5;
    const grainIntensity = 0.05;
    const bloomThreshold = 0.025;
    const brightness = 1;
    const edgeIntensity = 0;
    const fadeDelay = 1000;
    const fadeDuration = 1500;

    // State
    const trailBuf = Array.from({ length: Math.max(1, trailLength) }, () => new THREE.Vector2(0.5, 0.5));
    let head = 0;
    let rafId: number | null = null;
    const currentMouse = new THREE.Vector2(0.5, 0.5);
    const velocity = new THREE.Vector2(0, 0);
    let fadeOpacity = 1.0;
    let lastMoveTime = performance.now();
    let pointerActive = false;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      depth: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    // Shaders
    const material = new THREE.ShaderMaterial({
      defines: { MAX_TRAIL_LENGTH: trailLength },
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(1, 1, 1) },
        iMouse: { value: new THREE.Vector2(0.5, 0.5) },
        iPrevMouse: { value: trailBuf.map(v => v.clone()) },
        iOpacity: { value: 1.0 },
        iScale: { value: 1.0 },
        iBaseColor: { value: new THREE.Color(color) },
        iBrightness: { value: brightness },
        iEdgeIntensity: { value: edgeIntensity }
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime; uniform vec3 iResolution; uniform vec2 iMouse;
        uniform vec2 iPrevMouse[MAX_TRAIL_LENGTH]; uniform float iOpacity;
        uniform float iScale; uniform vec3 iBaseColor; uniform float iBrightness;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p); f *= f * (3. - 2. * f);
          return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                     mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
        }
        float fbm(vec2 p){
          float v = 0.0; float a = 0.5;
          mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for(int i=0;i<5;i++){ v += a * noise(p); p = m * p * 2.0; a *= 0.5; }
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
          vec3 c1 = tint1(iBaseColor); vec3 c2 = tint2(iBaseColor);
          vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);
          return vec4(color * alpha * intensity, alpha * intensity);
        }
        void main() {
          vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
          vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
          vec3 colorAcc = vec3(0.0); float alphaAcc = 0.0;
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
          colorAcc *= iBrightness;
          gl_FragColor = vec4(colorAcc, clamp(alphaAcc * iOpacity, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(geom, material));

    // Post Processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, bloomThreshold));
    composer.addPass(new ShaderPass({
      uniforms: { tDiffuse: { value: null }, iTime: { value: 0 }, intensity: { value: grainIntensity } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform float iTime; uniform float intensity; varying vec2 vUv;
        float hash1(float n){ return fract(sin(n)*43758.5453); }
        void main(){
          vec4 color = texture2D(tDiffuse, vUv);
          float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
          color.rgb += n * intensity * color.rgb;
          gl_FragColor = color;
        }
      `
    } as any));
    composer.addPass(new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float a = max(c.a, 1e-5); gl_FragColor = vec4(clamp(c.rgb / a, 0.0, 1.0), c.a); }`
    }));

    // Resize
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h);
      composer.setSize(w, h);
      material.uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
      material.uniforms.iScale.value = Math.max(0.5, Math.min(2.0, Math.min(w, h) / 600));
    };
    window.addEventListener('resize', resize);
    resize();

    // Animate
    const start = performance.now();
    const animate = () => {
      const now = performance.now();
      const t = (now - start) / 1000;
      if (pointerActive) {
        velocity.set(currentMouse.x - material.uniforms.iMouse.value.x, currentMouse.y - material.uniforms.iMouse.value.y);
        material.uniforms.iMouse.value.copy(currentMouse);
        fadeOpacity = 1.0;
      } else {
        velocity.multiplyScalar(inertia);
        if (velocity.lengthSq() > 0.000001) material.uniforms.iMouse.value.add(velocity);
        const dt = now - lastMoveTime;
        if (dt > fadeDelay) fadeOpacity = Math.max(0, 1 - (dt - fadeDelay) / fadeDuration);
      }
      head = (head + 1) % trailLength;
      trailBuf[head].copy(material.uniforms.iMouse.value);
      const arr = material.uniforms.iPrevMouse.value;
      for (let i = 0; i < trailLength; i++) {
        arr[i].copy(trailBuf[(head - i + trailLength) % trailLength]);
      }
      material.uniforms.iOpacity.value = fadeOpacity;
      material.uniforms.iTime.value = t;
      composer.render();
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    const onPointerMove = (e: MouseEvent) => {
      currentMouse.set(e.clientX / window.innerWidth, 1 - (e.clientY / window.innerHeight));
      pointerActive = true;
      lastMoveTime = performance.now();
    };
    window.addEventListener('mousemove', onPointerMove);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
      scene.clear();
      renderer.dispose();
      composer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color]);

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" style={style} />;
};

// =========================================
// 2. TARGET CURSOR (GSAP Foreground)
// =========================================

const CursorStyles = () => (
  <style jsx global>{`
    .target-cursor-wrapper {
      position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; mix-blend-mode: difference;
    }
    .target-cursor-dot {
      width: 8px; height: 8px; background-color: white; border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%);
    }
    .target-cursor-corner {
      position: absolute; width: 12px; height: 12px; border: 2px solid white;
    }
    .corner-tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
    .corner-tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -6px; right: -6px; border-left: none; border-top: none; }
    .corner-bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }
  `}</style>
);

interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = 'button, a, .cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  const spinTl = useRef<gsap.core.Timeline | null>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const isActiveRef = useRef(false);
  const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null);
  const tickerFnRef = useRef<(() => void) | null>(null);
  const activeStrengthRef = useRef({ current: 0 });

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  }, []);

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), []);

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return;
    gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' });
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.style.cursor = 'none';
    }

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner');

    let activeTarget: Element | null = null;
    let currentLeaveHandler: (() => void) | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const createSpinTimeline = () => {
      if (spinTl.current) {
        spinTl.current.kill();
      }
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    };

    createSpinTimeline();

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) {
        return;
      }
      const strength = activeStrengthRef.current.current;
      if (strength === 0) return;
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number;
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number;
      const corners = Array.from(cornersRef.current);
      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x') as number;
        const currentY = gsap.getProperty(corner, 'y') as number;
        const targetX = targetCornerPositionsRef.current![i].x - cursorX;
        const targetY = targetCornerPositionsRef.current![i].y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };

    tickerFnRef.current = tickerFn;

    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
    window.addEventListener('mousemove', moveHandler);

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;
      const mouseX = gsap.getProperty(cursorRef.current, 'x') as number;
      const mouseY = gsap.getProperty(cursorRef.current, 'y') as number;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
      if (!isStillOverTarget) {
        currentLeaveHandler?.();
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
    };

    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    const enterHandler = (e: MouseEvent) => {
      const directTarget = e.target as Element;
      const allTargets: Element[] = [];
      let current: Element | null = directTarget;
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (!target || !cursorRef.current || !cornersRef.current) return;
      if (activeTarget === target) return;
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      const corners = Array.from(cornersRef.current);
      corners.forEach(corner => gsap.killTweensOf(corner));
      gsap.killTweensOf(cursorRef.current, 'rotation');
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = constants;
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number;
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number;

      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
      ];

      isActiveRef.current = true;
      gsap.ticker.add(tickerFnRef.current!);

      gsap.to(activeStrengthRef.current, { current: 1, duration: hoverDuration, ease: 'power2.out' });

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositionsRef.current![i].x - cursorX,
          y: targetCornerPositionsRef.current![i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!);
        isActiveRef.current = false;
        targetCornerPositionsRef.current = null;
        gsap.set(activeStrengthRef.current, { current: 0, overwrite: true });
        activeTarget = null;
        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current);
          gsap.killTweensOf(corners);
          const { cornerSize } = constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
          });
        }
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = gsap.getProperty(cursorRef.current, 'rotation') as number;
            const normalizedRotation = currentRotation % 360;
            spinTl.current.kill();
            spinTl.current = gsap
              .timeline({ repeat: -1 })
              .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
           gsap.to(cursorRef.current, {
                         rotation: normalizedRotation + 360,
                         duration: spinDuration * (1 - normalizedRotation / 360),
                          ease: 'none',
                        onComplete: () => {
                        spinTl.current?.restart();
                                }
            });
          }
      
        }, 50);
        cleanupTarget(target);
      };
      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    };

    window.addEventListener('mouseover', enterHandler as EventListener);

    return () => {
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
      }
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseover', enterHandler as EventListener);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      spinTl.current?.kill();
      document.body.style.cursor = originalCursor;
      isActiveRef.current = false;
      targetCornerPositionsRef.current = null;
      activeStrengthRef.current.current = 0;
    };
  }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile, hoverDuration, parallaxOn]);

  useEffect(() => {
    if (isMobile || !cursorRef.current || !spinTl.current) return;
    if (spinTl.current.isActive()) {
      spinTl.current.kill();
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    }
  }, [spinDuration, isMobile]);

  if (isMobile) {
    return null;
  }

  return (
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ShopPage() {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleScrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // If the website is NOT unlocked, show the Register Page
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <RecruitPage onUnlock={() => setIsUnlocked(true)} />
      </main>
    );
  }

  // Once unlocked, show the Shop content
  return (
    <ShopProvider>
      <div className="relative min-h-screen bg-slate-950 text-white animate-in fade-in duration-1000">
        
        {/* 1. BACKGROUND: Ghost Cursor (Z-0) */}
        <GhostCursorBackground color="#4aa0ff" />
        
        {/* 2. FOREGROUND: Target Cursor (Fixed Z-9999) */}
        <CursorStyles />
        <TargetCursor 
          hideDefaultCursor={true}
          spinDuration={2}
          parallaxOn={true}
        />
        
        {/* 3. CONTENT (Z-10) */}
        {/* Ensure containers are relative so they stack above the ghost cursor */}
        <div className="relative z-10">
          <Socials />
          
          <HeroShop onScrollToProducts={handleScrollToProducts} />

          <div ref={productsRef}>
            <ProductsSection />
             <Shopmain />
            <Faq />
               <Socialsfooter />
          </div>
        </div>
        
      </div>
    </ShopProvider>
  );
}