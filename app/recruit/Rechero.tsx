"use client";
import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { Button } from "../../components/Mainpage/button";
import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";
import { ContainerScroll } from "@/components/Mainpage/container-scroll-animation";

// --- THREE.JS IMPORTS FOR GHOST CURSOR ---
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// =========================================
// GHOST CURSOR COMPONENT (Background)
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
  color = "#4aa0ff", // Default to blue
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
  const runningRef = useRef(false);

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
      float outAlpha = clamp(alphaAcc * iOpacity, 0.0, 1.0);
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
    // Follow the pointer over the parent element
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
      const rect = host.getBoundingClientRect(); // Use host for relative coords
      const x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      currentMouseRef.current.set(x, y);
      pointerActiveRef.current = true;
      lastMoveTimeRef.current = performance.now();
    };
    
    // Attach listeners to the parent
    parent.addEventListener('pointermove', onPointerMove as any); 
    
    runningRef.current = true;
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

  // Update color dynamically
  useEffect(() => {
    if (materialRef.current) {
       materialRef.current.uniforms.iBaseColor.value.set(color);
    }
  }, [color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={style} />;
};

// --- NEW COMPONENT: EncryptedText ---
// A placeholder for a complex text animation component (like the Aceternity UI version)
// Replace with your actual implementation if different.
const EncryptedText = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    // This is a minimal placeholder. A full implementation would involve character cycling.
    const interval = setTimeout(() => {
      setDisplayText(text);
    }, 100);
    return () => clearTimeout(interval);
  }, [text]);

  return (
    <h2 className={className}>
      <motion.span
        initial={{ filter: "blur(10px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {displayText}
      </motion.span>
    </h2>
  );
};
// ------------------------------------


interface HeroProps {
  imageUrl: string;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const calOptions = useCalEmbed({
    namespace: CONSTANTS.CALCOM_NAMESPACE,
    styles: {
      branding: {
        brandColor: CONSTANTS.CALCOM_BRAND_COLOR,
      },
    },
    hideEventTypeDetails: CONSTANTS.CALCOM_HIDE_EVENT_TYPE_DETAILS,
    layout: CONSTANTS.CALCOM_LAYOUT,
  });

  return (
    <div
      ref={parentRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black-50 dark:bg-neutral-1000"
    >
      {/* Ghost Cursor Background */}
      <GhostCursorBackground color="#4aa0ff" />

      {/* Background Elements remain absolute */}
      <BackgroundGrids />
      
      {/* Beams (Blue/Cyan Gradient) */}
      <CollisionMechanism
        beamOptions={{
          initialX: -400,
          translateX: 600,
          duration: 7,
          repeatDelay: 3,
          className: "bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent",
        }}
        containerRef={containerRef}
        parentRef={parentRef}
      />
      <CollisionMechanism
        beamOptions={{
          initialX: -200,
          translateX: 800,
          duration: 4,
          repeatDelay: 3,
          className: "bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent",
        }}
        containerRef={containerRef}
        parentRef={parentRef}
      />
      <CollisionMechanism
        beamOptions={{
          initialX: 200,
          translateX: 1200,
          duration: 5,
          repeatDelay: 3,
          className: "bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent",
        }}
        containerRef={containerRef}
        parentRef={parentRef}
      />
      <CollisionMechanism
        containerRef={containerRef}
        parentRef={parentRef}
        beamOptions={{
          initialX: 400,
          translateX: 1400,
          duration: 6,
          repeatDelay: 3,
          className: "bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent",
        }}
      />

      <div className="relative z-10 w-full">
        <ContainerScroll
          titleComponent={
            
            <>
              <div className="text-balance relative z-20 mx-auto mb-4 mt-4 max-w-4xl text-center text-3xl font-semibold tracking-tight text-gray-700 dark:text-neutral-300 md:text-7xl">
                <Balancer>
                  {/* Title using EncryptedText Component */}
                  <EncryptedText
                    text="Partner with Bullmoney"
                    className="text-gray-700 dark:text-neutral-300"
                  />
                </Balancer>
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
                className="relative z-20 mx-auto mt-4 max-w-lg px-4 text-center text-base/6 text-gray-600 dark:text-gray-200"
              >
                Earn commissions by referring high-value traders to learn and become profitable using our platform and tools. Our
                affiliate program offers industry-leading payouts, real-time
                analytics, and dedicated support. Monetize your audience today!
                
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.7 }}
                className="mb-10 mt-8 flex w-full flex-col items-center justify-center gap-4 px-8 sm:flex-row md:mb-20"
              >
                

    
              </motion.div>
            </>
          }
        >
          {/* This div acts as the target for collision detection */}
          <div ref={containerRef} className="h-full w-full relative">
            <Image
              src="https://images.unsplash.com/photo-1645226880663-81561dcab0ae?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzF8fHRyYWRpbmd8ZW58MHx8MHx8fDA%3D"
              alt="Trading platform revenue graph" // Updated Alt Text
              fill
              className="object-cover object-left-top rounded-[20px]"
              draggable={false}
            />
          </div>
        </ContainerScroll>
      </div>
    </div>
  );
}

// --- Background and Collision Components (Updated with Blue/Cyan Colors) ---

const BackgroundGrids = () => {
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
      <div className="relative h-full w-full bg-gradient-to-b from-transparent via-neutral-100 to-transparent dark:via-neutral-800">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLDivElement>;
    beamOptions?: {
      initialX?: number;
      translateX?: number;
      initialY?: number;
      translateY?: number;
      rotate?: number;
      className?: string; // Added to allow custom gradient
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ parentRef, containerRef, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({
    detected: false,
    coordinates: null,
  });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX =
            beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: {
              x: relativeX,
              y: relativeY,
            },
          });
          setCycleCollisionDetected(true);
          if (beamRef.current) {
            beamRef.current.style.opacity = "0";
          }
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);

    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
        // Set beam opacity to 0
        if (beamRef.current) {
          beamRef.current.style.opacity = "1";
        }
      }, 2000);

      // Reset the beam animation after a delay
      setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1);
      }, 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || "-200px",
          translateX: beamOptions.initialX || "0px",
          rotate: beamOptions.rotate || -45,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "800px",
            translateX: beamOptions.translateX || "700px",
            rotate: beamOptions.rotate || -45,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-96 top-20 m-auto h-14 w-px rounded-full",
          // Defaulting to Blue/Cyan if no className is provided
          beamOptions.className || "bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent"
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            // Pass color class to Explosion
            explosionClassName="from-blue-500 to-cyan-500"
            lightClassName="via-blue-500"
            style={{
              left: `${collision.coordinates.x + 20}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ explosionClassName, lightClassName, ...props }: React.HTMLProps<HTMLDivElement> & { explosionClassName?: string; lightClassName?: string }) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn("absolute -inset-x-10 top-0 m-auto h-[4px] w-10 rounded-full bg-gradient-to-r from-transparent to-transparent blur-sm", lightClassName || "via-blue-500")}
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className={cn("absolute h-1 w-1 rounded-full bg-gradient-to-b", explosionClassName || "from-blue-500 to-cyan-500")}
        />
      ))}
    </div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px", //-100px if you want to keep the line inside
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
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    ></div>
    
  );
};