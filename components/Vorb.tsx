"use client";
import React, { useEffect, useRef } from "react";
// OGL imports for the Orb
import { Renderer, Program, Mesh, Triangle, Vec3 } from "ogl";
// Three.js imports for the Ghost Cursor
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// =========================================
// 1. GHOST CURSOR COMPONENT (Background)
// =========================================

type GhostCursorProps = {
  style?: React.CSSProperties;
  trailLength?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  color?: string;
};

const GhostCursorBackground = React.memo(({
  style,
  trailLength = 20, // Reduced for performance, visually compensated in shader
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  color = "#4aa0ff",
}: GhostCursorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const isVisibleRef = useRef(true);

  // Performance Tuning
  const RENDER_SCALE = 0.8; // Render background at 80% res (blurry anyway)
  const MAX_DPR = 1.5;      // Cap DPR to prevent lag on 4k/Retina screens

  // Shader Params
  const inertia = 0.5;
  const brightness = 1;
  const fadeDelay = 1000;
  const fadeDuration = 1500;

  // State refs
  const trailBufRef = useRef<THREE.Vector2[]>([]);
  const headRef = useRef(0);
  const currentMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(new THREE.Vector2(0, 0));
  const fadeOpacityRef = useRef(1.0);
  const lastMoveTimeRef = useRef(0);
  const pointerActiveRef = useRef(false);

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

    // Optimized Noise (Simpler Hash)
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    
    // Reduced Octaves for FBM (Faster)
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<3;i++){ // Reduced from 5 to 3
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      // Simplified Blob calculation
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1));
      float smoke = fbm(p * iScale + q * 1.5);
      float radius = 0.5 + 0.3 * (1.0 / iScale);
      float dist = length(p - mousePos);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, dist);
      
      // Optimization: Early exit if far away
      if (distFactor <= 0.001) return vec4(0.0);

      float alpha = pow(smoke, 2.5) * distFactor;
      vec3 color = mix(iBaseColor, vec3(1.0), 0.15 * sin(iTime * 0.5));
      return vec4(color * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;
      
      // Main blob
      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;

      // Trail
      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        // Optimization: Skip every other trail point for performance if needed, 
        // currently using lower MAX_TRAIL_LENGTH instead.
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
      
      // Edge fade
      float edgeX = min(vUv.x, 1.0 - vUv.x);
      float edgeY = min(vUv.y, 1.0 - vUv.y);
      float edgeFade = smoothstep(0.0, 0.15, min(edgeX, edgeY));
      
      gl_FragColor = vec4(colorAcc, clamp(alphaAcc * iOpacity * edgeFade, 0.0, 1.0));
    }
  `;

  // Simplified Grain Shader (Removed time-based hash jitter for performance)
  const FilmGrainShader = {
    uniforms: {
      tDiffuse: { value: null },
      intensity: { value: 0.05 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      varying vec2 vUv;
      float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec4 color = texture2D(tDiffuse, vUv);
        float n = rand(vUv) * 2.0 - 1.0;
        color.rgb += n * intensity * color.rgb;
        gl_FragColor = color;
      }
    `
  };

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const parent = host.parentElement || document.body;

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Turn off antialias for fluid background (saves GPU)
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
        iBrightness: { value: brightness }
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
    composer.addPass(new RenderPass(scene, camera));
    
    // Bloom - Lower resolution for speed
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloomStrength, bloomRadius, 0.02);
    composer.addPass(bloomPass);
    composer.addPass(new ShaderPass(FilmGrainShader as any));
    
    // Custom Unpremultiply pass
    const unpremultiplyPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: baseVertexShader,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main(){
          vec4 c = texture2D(tDiffuse, vUv);
          float a = max(c.a, 0.001);
          gl_FragColor = vec4(c.rgb / a, c.a);
        }
      `
    });
    composer.addPass(unpremultiplyPass);

    const resize = () => {
      if(!host) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      
      const width = rect.width;
      const height = rect.height;
      const wPx = Math.floor(width * dpr * RENDER_SCALE);
      const hPx = Math.floor(height * dpr * RENDER_SCALE);

      renderer.setSize(width, height, false);
      renderer.setPixelRatio(dpr * RENDER_SCALE); // Lower pixel ratio for fluids
      composer.setSize(width, height);
      composer.setPixelRatio(dpr * RENDER_SCALE);
      
      material.uniforms.iResolution?.value?.set(wPx, hPx, 1);
      if (material.uniforms.iScale) {
        material.uniforms.iScale.value = Math.max(0.5, Math.min(2.0, Math.min(width, height) / 600));
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Intersection Observer to stop rendering when not visible
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        isVisibleRef.current = entry.isIntersecting;
      }
    });
    observer.observe(host);

    const start = performance.now();
    
    const animate = () => {
      // Pause if not visible
      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      const t = (now - start) / 1000;

      // Logic: Mouse Inertia
      if (pointerActiveRef.current && material.uniforms.iMouse?.value) {
        velocityRef.current.set(
          currentMouseRef.current.x - material.uniforms.iMouse.value.x,
          currentMouseRef.current.y - material.uniforms.iMouse.value.y
        );
        material.uniforms.iMouse.value.copy(currentMouseRef.current);
        fadeOpacityRef.current = 1.0;
      } else if (material.uniforms.iMouse?.value) {
        velocityRef.current.multiplyScalar(inertia);
        material.uniforms.iMouse.value.add(velocityRef.current);
        const dt = now - lastMoveTimeRef.current;
        if (dt > fadeDelay) {
          fadeOpacityRef.current = Math.max(0, 1 - (dt - fadeDelay) / fadeDuration);
        }
      }

      // Logic: Trail
      if (material.uniforms.iMouse?.value && material.uniforms.iPrevMouse?.value) {
        const N = trailBufRef.current.length;
        headRef.current = (headRef.current + 1) % N;
        const trailItem = trailBufRef.current[headRef.current];
        if (trailItem) {
          trailItem.copy(material.uniforms.iMouse.value);
        }
        const arr = material.uniforms.iPrevMouse.value as THREE.Vector2[];

        // Update Uniforms
        for (let i = 0; i < N; i++) {
          const arrItem = arr[i];
          const trailIdx = (headRef.current - i + N) % N;
          const trailItem2 = trailBufRef.current[trailIdx];
          if (arrItem && trailItem2) {
            arrItem.copy(trailItem2);
          }
        }
      }
      if (material.uniforms.iOpacity) {
        material.uniforms.iOpacity.value = fadeOpacityRef.current;
      }
      if (material.uniforms.iTime) {
        material.uniforms.iTime.value = t;
      }

      composer.render();
      rafRef.current = requestAnimationFrame(animate);
    };

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
      observer.disconnect();
      scene.clear();
      renderer.dispose();
      composer.dispose();
      if(host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color, baseVertexShader, fragmentShader]);

  // Color update
  useEffect(() => {
    if (materialRef.current?.uniforms.iBaseColor?.value) {
      materialRef.current.uniforms.iBaseColor.value.set(color);
    }
  }, [color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={style} />;
});
GhostCursorBackground.displayName = "GhostCursorBackground";

// =========================================
// 2. MAIN ORB COMPONENT
// =========================================

interface OrbProps {
  hue?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  onButtonClick?: () => void;
  buttonLabel?: string;
}

export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false,
  onButtonClick,
  buttonLabel = "Click Me",
}: OrbProps) {
  const ctnDom = useRef<HTMLDivElement | null>(null);
  const isVisibleRef = useRef(true);

  // OGL Vertex Shader
  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
  `;

  // OGL Fragment Shader (Same aesthetic, slightly cleaned)
  const frag = /* glsl */ `
    precision highp float;
    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    varying vec2 vUv;

    // YIQ/RGB conversions (Standard)
    vec3 rgb2yiq(vec3 c) { return vec3(dot(c, vec3(0.299, 0.587, 0.114)), dot(c, vec3(0.596, -0.274, -0.322)), dot(c, vec3(0.211, -0.523, 0.312))); }
    vec3 yiq2rgb(vec3 c) { return vec3(c.x + 0.956 * c.y + 0.621 * c.z, c.x - 0.272 * c.y - 0.647 * c.z, c.x - 1.106 * c.y + 1.703 * c.z); }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float h = hueRad + atan(yiq.z, yiq.y);
      float c = sqrt(yiq.y * yiq.y + yiq.z * yiq.z);
      return yiq2rgb(vec3(yiq.x, c * cos(h), c * sin(h)));
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
      vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
      return dot(vec4(31.316), n);
    }

    const vec3 baseColor1 = vec3(0.203, 0.611, 0.996);
    const vec3 baseColor2 = vec3(0.027, 0.360, 0.741);
    const vec3 baseColor3 = vec3(0.000, 0.141, 0.388);
    
    vec4 draw(vec2 uv) {
      vec3 c1 = adjustHue(baseColor1, hue);
      vec3 c2 = adjustHue(baseColor2, hue);
      vec3 c3 = adjustHue(baseColor3, hue);
      
      float noiseVal = snoise3(vec3(uv * 0.65, iTime * 0.5)) * 0.5 + 0.5;
      float len = length(uv);
      
      // Optimization: discard if too far out (reduces fill rate issues slightly)
      if (len > 1.3) discard;

      float r0 = mix(mix(0.6, 1.0, 0.4), mix(0.6, 1.0, 0.6), noiseVal);
      float d0 = distance(uv, (r0 / max(len, 1e-5)) * uv);
      
      float v0 = 1.0 / (1.0 + d0 * 10.0);
      v0 *= smoothstep(r0 * 1.05, r0, len);
      
      float cl = cos(atan(uv.y, uv.x) + iTime * 2.0) * 0.5 + 0.5;
      
      // Orbit light
      vec2 pos = vec2(cos(-iTime), sin(-iTime)) * r0;
      float d = distance(uv, pos);
      float v1 = (1.5 / (1.0 + d * d * 5.0)) * (1.0 / (1.0 + d0 * 50.0));
      
      float v2 = smoothstep(1.0, mix(0.6, 1.0, noiseVal * 0.5), len);
      float v3 = smoothstep(0.6, mix(0.6, 1.0, 0.5), len);
      
      vec3 col = mix(c1, c2, cl);
      col = mix(c3, col, v0);
      col = (col + v1) * v2 * v3;
      
      // Manual alpha extraction
      float a = max(max(col.r, col.g), col.b);
      return vec4(col / (a + 1e-5), a);
    }

    void main() {
      vec2 center = iResolution.xy * 0.5;
      vec2 uv = (vUv * iResolution.xy - center) / min(iResolution.x, iResolution.y) * 2.0;
      
      // Rotation
      float s = sin(rot), c = cos(rot);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      
      // Hover Distortion
      if (hover > 0.0) {
        uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
        uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
      }
      
      vec4 col = draw(uv);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.position = "absolute";
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.zIndex = "10";
    container.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(0,0,0) },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
      },
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // Optimization: Cap DPR at 1.5 for the orb too
    const resize = () => {
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); 
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;
      program.uniforms.iResolution.value.set(width * dpr, height * dpr, (width * dpr) / (height * dpr));
    };

    window.addEventListener("resize", resize);
    resize();

    // Intersection Observer
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        isVisibleRef.current = entry.isIntersecting;
      }
    });
    observer.observe(container);

    let targetHover = 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.min(rect.width, rect.height);
      const uvX = ((x - rect.width / 2) / size) * 2.0;
      const uvY = ((y - rect.height / 2) / size) * 2.0;
      targetHover = Math.sqrt(uvX * uvX + uvY * uvY) < 0.8 ? 1 : 0;
    };
    const handleMouseLeave = () => { targetHover = 0; };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let rafId: number;
    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      if(!isVisibleRef.current) return; // Skip rendering if hidden

      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;

      const effectiveHover = forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;

      if (rotateOnHover && effectiveHover > 0.5) currentRot += dt * rotationSpeed;
      program.uniforms.rot.value = currentRot;

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
      if(container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState, vert, frag]);

  return (
    <div ref={ctnDom} className="relative w-full h-full flex items-center justify-center bg-transparent">
      <GhostCursorBackground color="#4aa0ff" />
      <button
        onClick={onButtonClick}
        className="relative z-20 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-white to-sky-400
          shadow-[0_0_25px_rgba(255, 255, 255,0.4)] hover:shadow-[0_0_45px_rgba(255, 255, 255,0.7)]
          transition-all duration-300"
      >
        {buttonLabel}
      </button>
    </div>
  );
}