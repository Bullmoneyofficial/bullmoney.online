"use client";
import React, { useEffect, useRef, useState } from "react";
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

const GhostCursorBackground: React.FC<GhostCursorProps> = ({
  style,
  trailLength = 20, // Reduced from 50 for performance
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  color = "#4aa0ff", 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Settings
  const inertia = 0.5;
  const fadeDelay = 1000;
  const fadeDuration = 1500;

  // Refs for logic
  const trailBufRef = useRef<THREE.Vector2[]>([]);
  const headRef = useRef(0);
  const currentMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(new THREE.Vector2(0, 0));
  const fadeOpacityRef = useRef(1.0);
  const lastMoveTimeRef = useRef(0);
  const pointerActiveRef = useRef(false);

  // --- OPTIMIZED SHADER ---
  // Moved noise CALCULATION outside the loop. 
  // We calculate noise once, then just apply it to the trail points.
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

    // Fast Hash
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    
    // Simple Noise
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    
    // Reduced Octaves FBM (3 instead of 5)
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<3;i++){
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      
      // Calculate background noise field ONCE per pixel
      float noiseField = fbm(uv * iScale * 2.0 + iTime * 0.2);
      
      float combinedAlpha = 0.0;
      
      // Check Mouse
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      float dist = length(uv - mouse);
      // Combine distance with pre-calculated noise
      float mouseBlob = smoothstep(0.4 * iScale, 0.0, dist) * noiseField;
      combinedAlpha += mouseBlob;

      // Check Trail
      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        
        if (t > 0.01) {
            float d = length(uv - pm);
            // Cheaper calculation inside loop
            combinedAlpha += smoothstep(0.2 * iScale * t, 0.0, d) * noiseField * t;
        }
      }

      // Color Tinting
      vec3 col = mix(iBaseColor, vec3(1.0), combinedAlpha * 0.5);
      
      // Edges
      float edgeX = min(vUv.x, 1.0 - vUv.x);
      float edgeY = min(vUv.y, 1.0 - vUv.y);
      float edgeFade = smoothstep(0.0, 0.15, min(edgeX, edgeY));

      gl_FragColor = vec4(col * iBrightness, clamp(combinedAlpha * iOpacity * edgeFade, 0.0, 1.0));
    }
  `;

  // Standard Vertex Shader
  const baseVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    // Use a reduced pixel ratio for performance on high-DPI screens
    const dpr = Math.min(window.devicePixelRatio, 1.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Turn off antialias for performance (Bloom hides aliasing)
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(dpr);
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
        iBrightness: { value: 1.0 }
      },
      vertexShader: baseVertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    scene.add(new THREE.Mesh(geom, material));

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    
    // Bloom Pass
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, 0);
    // Render bloom at half resolution for performance
    bloomPass.resolution.set(window.innerWidth * dpr * 0.5, window.innerHeight * dpr * 0.5);
    composer.addPass(bloomPass);

    const resize = () => {
      if(!host) return;
      const rect = host.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      
      material.uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
      material.uniforms.iScale.value = Math.max(0.5, Math.min(2.0, Math.min(w, h) / 600));
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const start = performance.now();
    const animate = () => {
      const now = performance.now();
      const t = (now - start) / 1000;

      // Physics Logic
      if (pointerActiveRef.current) {
        velocityRef.current.set(
          currentMouseRef.current.x - material.uniforms.iMouse.value.x,
          currentMouseRef.current.y - material.uniforms.iMouse.value.y
        );
        material.uniforms.iMouse.value.copy(currentMouseRef.current);
        fadeOpacityRef.current = 1.0;
      } else {
        velocityRef.current.multiplyScalar(inertia);
        if (velocityRef.current.lengthSq() > 0.00001) {
          material.uniforms.iMouse.value.add(velocityRef.current);
        }
        
        const dt = now - lastMoveTimeRef.current;
        if (dt > fadeDelay) {
          fadeOpacityRef.current = Math.max(0, 1 - (dt - fadeDelay) / fadeDuration);
        }
      }

      // Trail Update
      const N = trailBufRef.current.length;
      headRef.current = (headRef.current + 1) % N;
      trailBufRef.current[headRef.current].copy(material.uniforms.iMouse.value);
      
      // Update Uniforms
      const arr = material.uniforms.iPrevMouse.value as THREE.Vector2[];
      for (let i = 0; i < N; i++) {
        const srcIdx = (headRef.current - i + N) % N;
        arr[i].copy(trailBufRef.current[srcIdx]);
      }
      
      material.uniforms.iOpacity.value = fadeOpacityRef.current;
      material.uniforms.iTime.value = t;

      // Only render if visible
      if (fadeOpacityRef.current > 0.01) {
        composer.render();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // Use Host element for coordinates to avoid offset issues
    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      currentMouseRef.current.set(x, y);
      pointerActiveRef.current = true;
      lastMoveTimeRef.current = performance.now();
    };

    window.addEventListener('pointermove', onPointerMove); 
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      ro.disconnect();
      renderer.dispose();
      composer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [trailLength, bloomStrength, bloomRadius, color]);

  useEffect(() => {
      // Dynamic color updates handled here if ref exists
  }, [color]);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" style={style} />;
};


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

  // --- ORB SHADER (Simplified Precision) ---
  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;
    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    varying vec2 vUv;

    // Helper functions maintained but compacted
    vec3 rgb2yiq(vec3 c) { return vec3(dot(c, vec3(0.299, 0.587, 0.114)), dot(c, vec3(0.596, -0.274, -0.322)), dot(c, vec3(0.211, -0.523, 0.312))); }
    vec3 yiq2rgb(vec3 c) { return vec3(c.x + 0.956 * c.y + 0.621 * c.z, c.x - 0.272 * c.y - 0.647 * c.z, c.x - 1.106 * c.y + 1.703 * c.z); }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      return yiq2rgb(vec3(yiq.x, yiq.y * cosA - yiq.z * sinA, yiq.y * sinA + yiq.z * cosA));
    }

    // Noise functions
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

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(0.203, 0.611, 0.996);
    const vec3 baseColor2 = vec3(0.027, 0.360, 0.741);
    const vec3 baseColor3 = vec3(0.000, 0.141, 0.388);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); }
    float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); }

    void main() {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (vUv * iResolution.xy - center) / size * 2.0;

      // Rotation and Hover
      float angle = rot;
      float s = sin(angle), c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      uv += vec2(hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime), 
                 hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime));

      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      float len = length(uv);
      // Optimization: Early discard if pixel is far outside orb radius
      if (len > 1.8) discard;

      float ang = atan(uv.y, uv.x);
      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 / len) * uv);
      float v0 = light1(1.0, 10.0, d0) * smoothstep(r0 * 1.05, r0, len);
      
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d) * light1(1.0, 50.0, d0);
      
      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 col = mix(color1, color2, cl);
      col = mix(color3, col, v0);
      col = (col + v1) * v2 * v3;
      
      vec4 final = extractAlpha(clamp(col, 0.0, 1.0));
      gl_FragColor = vec4(final.rgb * final.a, final.a);
    }
  `;

  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    // Throttle DPR for OGL as well
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: dpr });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.position = "absolute"; 
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.zIndex = "10"; 
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize(): void {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let targetHover = 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3;

    // Use Pointer events instead of Mouse events for better compatibility
    const handlePointerMove = (e: PointerEvent): void => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Simple distance check from center (assuming orb is centered)
      const dist = Math.sqrt(Math.pow(x - rect.width/2, 2) + Math.pow(y - rect.height/2, 2));
      const size = Math.min(rect.width, rect.height);
      // Normalized radius check
      targetHover = (dist / (size/2)) < 0.8 ? 1 : 0;
    };

    const handlePointerLeave = (): void => {
      targetHover = 0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    let rafId: number;
    const update = (t: number): void => {
      rafId = requestAnimationFrame(update);
      const dt = (t - lastTime) * 0.001;
      lastTime = t;
      program.uniforms.iTime.value = t * 0.001;
      program.uniforms.hue.value = hue;
      program.uniforms.hoverIntensity.value = hoverIntensity;

      const effectiveHover = forceHoverState ? 1 : targetHover;
      program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;

      if (rotateOnHover && effectiveHover > 0.01) {
        currentRot += dt * rotationSpeed;
      }
      program.uniforms.rot.value = currentRot;

      renderer.render({ scene: mesh });
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState]);

  return (
    <div ref={ctnDom} className="relative w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
      {/* 1. GHOST CURSOR BACKGROUND */}
      <GhostCursorBackground color="#4aa0ff" />
      {/* 2. BUTTON */}
      <button
        onClick={onButtonClick}
        className="relative z-20 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-500 to-sky-400
          shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:shadow-[0_0_45px_rgba(56,189,248,0.7)]
          transition-all duration-300"
      >
        {buttonLabel}
      </button>
    </div>
  );
}