import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import './LaserFlow.css';

type Props = {
  className?: string;
  style?: React.CSSProperties;
  wispDensity?: number;
  dpr?: number;
  mouseSmoothTime?: number;
  mouseTiltStrength?: number;
  horizontalBeamOffset?: number;
  verticalBeamOffset?: number;
  flowSpeed?: number;
  verticalSizing?: number; // Maps to scaling factor
  horizontalSizing?: number;
  fogIntensity?: number;
  fogScale?: number;
  wispSpeed?: number;
  wispIntensity?: number;
  flowStrength?: number;
  decay?: number;
  falloffStart?: number;
  fogFallSpeed?: number;
  color?: string; // Hex color
};

const VERT = `
precision highp float;
attribute vec3 position;
void main(){
  gl_Position = vec4(position, 1.0);
}
`;

// Completed and fixed Fragment Shader based on the provided snippet
const FRAG = `
#ifdef GL_ES
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
precision mediump int;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;

// Uniforms mapped from props
uniform float uWispDensity;
uniform float uTiltScale;
uniform float uFlowTime;
uniform float uFogTime;
uniform float uBeamXFrac;
uniform float uBeamYFrac;
uniform float uFlowSpeed; // Unused in frag directly, used in time calc
uniform float uVLenFactor; // Unused in this specific logic but good for scaling
uniform float uHLenFactor;
uniform float uFogIntensity;
uniform float uFogScale;
uniform float uWSpeed;
uniform float uWIntensity;
uniform float uFlowStrength;
uniform float uDecay;
uniform float uFalloffStart;
uniform float uFogFallSpeed;
uniform vec3 uColor;
uniform float uFade; // Global fade in/out

// --- Configuration Constants ---
#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPS 1e-6
#define DT_LOCAL 0.0038
#define EDGE_SOFT (DT_LOCAL*4.0)
#define R_V 150.0
#define FLARE_HEIGHT 16.0
#define FLARE_AMOUNT 8.0
#define FLARE_EXP 2.0
#define TOP_FADE_START 0.1

// Wisps
#define W_BASE_X 1.5
#define W_LAYER_GAP 0.25
#define W_LANES 10
#define W_SIDE_DECAY 0.5
#define W_HALF 0.01
#define W_AA 0.15
#define W_CELL 20.0
#define W_SEG_MIN 0.01
#define W_SEG_MAX 0.55
#define W_CURVE_AMOUNT 15.0
#define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)
#define W_BOTTOM_EXP 10.0

// Fog
#define FOG_OCTAVES 5

// --- Helpers ---
float h21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 34.123);
    return fract(p.x * p.y);
}

float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = h21(i);
    float b = h21(i + vec2(1, 0));
    float c = h21(i + vec2(0, 1));
    float d = h21(i + vec2(1, 1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p){
    float v = 0.0;
    float amp = 0.6;
    mat2 m = mat2(0.86, 0.5, -0.5, 0.86);
    for(int i = 0; i < FOG_OCTAVES; ++i){
        v += amp * vnoise(p);
        p = m * p * 2.03 + 17.1;
        amp *= 0.52;
    }
    return v;
}

float rGate(float x, float l){
    float a = smoothstep(0.0, W_AA, x);
    float b = 1.0 - smoothstep(l, l + W_AA, x);
    return max(0.0, a * b);
}

float flareY(float y){
    float t = clamp(1.0 - (clamp(y, 0.0, FLARE_HEIGHT) / max(FLARE_HEIGHT, EPS)), 0.0, 1.0);
    return pow(t, FLARE_EXP);
}

// --- Wisp Logic ---
float vWisps(vec2 uv, float topF){
    float y = uv.y;
    // Animate texture coordinate
    float yf = (y + uFlowTime * uWSpeed * 50.0) / W_CELL;
    
    float dRaw = clamp(uWispDensity, 0.0, 2.0);
    float d = dRaw <= 0.0 ? 1.0 : dRaw;
    
    // Calculate lanes
    float lanesF = floor(float(W_LANES) * min(d, 1.0) + 0.5);
    int lanes = int(max(1.0, lanesF));
    
    float sp = min(d, 1.0);
    float ep = max(d - 1.0, 0.0);
    
    // Curve modulation
    float fm = flareY(max(y, 0.0));
    float rm = clamp(1.0 - (y / max(W_CURVE_RANGE, EPS)), 0.0, 1.0);
    float cm = fm * rm;
    float xS = 1.0 + (FLARE_AMOUNT * W_CURVE_AMOUNT * 0.05) * cm;
    
    float sPix = clamp(y / R_V, 0.0, 1.0);
    float bGain = pow(1.0 - sPix, W_BOTTOM_EXP);
    
    float sum = 0.0;
    
    // Iterate sides (left/right)
    for(int s = 0; s < 2; ++s){
        float sgn = s == 0 ? -1.0 : 1.0;
        for(int i = 0; i < W_LANES; ++i){
            if(i >= lanes) break;
            
            float off = W_BASE_X + float(i) * W_LAYER_GAP;
            float xc = sgn * (off * xS);
            float dx = abs(uv.x - xc);
            
            float lat = 1.0 - smoothstep(W_HALF, W_HALF + W_AA, dx);
            float amp = exp(-off * W_SIDE_DECAY);
            
            float seed = h21(vec2(off, sgn * 17.0));
            float yf2 = yf + seed * 7.0;
            float ci = floor(yf2);
            float fy = fract(yf2);
            
            float seg = mix(W_SEG_MIN, W_SEG_MAX, h21(vec2(ci, off * 2.3)));
            float spR = h21(vec2(ci, off + sgn * 31.0));
            
            float seg1 = rGate(fy, seg) * step(spR, sp);
            
            if(ep > 0.0){
                float spR2 = h21(vec2(ci * 3.1 + 7.0, off * 5.3 + sgn * 13.0));
                float f2 = fract(fy + 0.5);
                seg1 += rGate(f2, seg * 0.9) * step(spR2, ep);
            }
            
            sum += amp * lat * seg1;
        }
    }
    
    float span = smoothstep(-3.0, 0.0, y) * (1.0 - smoothstep(R_V - 20.0, R_V, y));
    return uWIntensity * sum * topF * bGain * span;
}

// --- Main Image Construction ---
void mainImage(out vec4 fc, in vec2 frag){
    vec2 C = iResolution.xy * 0.5;
    float sc = 512.0 / iResolution.x * 0.4; // Scale factor
    
    // Calculate center offset based on props
    // We assume beam starts near bottom if beamYFrac is low
    vec2 off = vec2(uBeamXFrac * iResolution.x * sc, (uBeamYFrac * iResolution.y * sc) - (R_V * 0.5));
    
    vec2 uv = (frag - C) * sc;
    vec2 p = uv - off;
    
    // --- Mouse Tilt Logic ---
    // Normalized mouse x from -0.5 to 0.5
    float mx = (iMouse.x / iResolution.x) - 0.5;
    float tilt = mx * uTiltScale * 5.0; // strength multiplier
    p.x -= p.y * tilt * 0.1; // Shear the beam based on height
    
    // --- Rendering ---
    
    // 1. Top Fade
    float topF = smoothstep(TOP_FADE_START, 1.0, 1.0 - abs(p.y / R_V));
    
    // 2. Wisps
    float wVal = vWisps(p, topF);
    
    // 3. Volumetric Fog
    // Animate fog flowing down/up
    vec2 fogUV = p * uFogScale * 0.1;
    fogUV.y -= uFogTime * uFogFallSpeed; 
    float fNoise = fbm2(fogUV + vec2(0.0, uFogTime * 0.2));
    
    // Mask fog to the center beam area
    float beamMask = max(0.0, 1.0 - abs(p.x) * 0.15);
    beamMask = pow(beamMask, 2.0);
    float fogVal = fNoise * uFogIntensity * beamMask * topF;
    
    // 4. Core Glow (Main beam)
    // Simple gaussian-like falloff for the core
    float coreWidth = 1.0 / max(uFlowStrength, 0.1);
    float core = exp(-abs(p.x) * coreWidth);
    core *= smoothstep(-5.0, 0.0, p.y) * (1.0 - smoothstep(R_V - 10.0, R_V, p.y));
    
    // Combine
    vec3 col = uColor * (core + wVal + fogVal);
    
    // Alpha calc - mostly additive
    float alpha = (core + wVal + fogVal * 0.5);
    alpha = clamp(alpha, 0.0, 1.0) * uFade;
    
    fc = vec4(col, alpha);
}

void main(){
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const LaserFlow: React.FC<Props> = ({
  className,
  style,
  wispDensity = 1.2,
  dpr = 1,
  mouseSmoothTime = 0.1,
  mouseTiltStrength = 0.5,
  horizontalBeamOffset = 0.0,
  verticalBeamOffset = -0.2, // Start slightly below center
  flowSpeed = 1.0,
  verticalSizing = 1.0,
  horizontalSizing = 1.0,
  fogIntensity = 0.5,
  fogScale = 1.0,
  wispSpeed = 1.0,
  wispIntensity = 1.0,
  flowStrength = 2.0, // Beam tightness
  decay = 0.95, // Unused in this specific shader implementation but kept for prop compatibility
  falloffStart = 0.5, // Unused
  fogFallSpeed = 1.0,
  color = '#4488ff',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Setup Three.js ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    
    renderer.setPixelRatio(window.devicePixelRatio * (dpr || 1));
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Material ---
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(width, height, 1) },
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
      
      uWispDensity: { value: wispDensity },
      uTiltScale: { value: mouseTiltStrength },
      uFlowTime: { value: 0 },
      uFogTime: { value: 0 },
      uBeamXFrac: { value: horizontalBeamOffset },
      uBeamYFrac: { value: verticalBeamOffset },
      uFlowSpeed: { value: flowSpeed },
      uVLenFactor: { value: verticalSizing }, // In shader logic, used to scale coordinates
      uHLenFactor: { value: horizontalSizing },
      uFogIntensity: { value: fogIntensity },
      uFogScale: { value: fogScale },
      uWSpeed: { value: wispSpeed },
      uWIntensity: { value: wispIntensity },
      uFlowStrength: { value: flowStrength },
      uDecay: { value: decay },
      uFalloffStart: { value: falloffStart },
      uFogFallSpeed: { value: fogFallSpeed },
      uColor: { value: new THREE.Color(color) },
      uFade: { value: 1.0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending, // Laser usually looks best with Additive
    });
    
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Mouse Handling ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = mountRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top; // Standard UI coords
      targetMouseRef.current.set(x, height - y); // Invert Y for shader
    };
    
    const handleResize = () => {
        if(!mountRef.current || !rendererRef.current || !materialRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        rendererRef.current.setSize(w, h);
        materialRef.current.uniforms.iResolution.value.set(w, h, 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    const animate = (time: number) => {
      timeRef.current = time * 0.001; // Seconds

      if (materialRef.current) {
        // Update Time
        materialRef.current.uniforms.iTime.value = timeRef.current;
        materialRef.current.uniforms.uFlowTime.value += 0.01 * flowSpeed;
        materialRef.current.uniforms.uFogTime.value += 0.01;

        // Smooth Mouse
        const lerpFactor = 1.0 - Math.pow(0.1, mouseSmoothTime); // Simple damping
        mouseRef.current.lerp(targetMouseRef.current, 0.1); 
        
        // iMouse in Shadertoy is xy = current pos, zw = click pos. We just use xy here.
        materialRef.current.uniforms.iMouse.value.set(
            mouseRef.current.x,
            mouseRef.current.y,
            0, 
            0
        );
      }

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [dpr]); // Re-init if dpr changes

  // --- Prop Updates ---
  // We use a separate useEffect to update uniforms without destroying the WebGL context
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    
    u.uWispDensity.value = wispDensity;
    u.uTiltScale.value = mouseTiltStrength;
    u.uBeamXFrac.value = horizontalBeamOffset;
    u.uBeamYFrac.value = verticalBeamOffset;
    u.uFlowSpeed.value = flowSpeed;
    u.uVLenFactor.value = verticalSizing;
    u.uHLenFactor.value = horizontalSizing;
    u.uFogIntensity.value = fogIntensity;
    u.uFogScale.value = fogScale;
    u.uWSpeed.value = wispSpeed;
    u.uWIntensity.value = wispIntensity;
    u.uFlowStrength.value = flowStrength;
    u.uDecay.value = decay;
    u.uFalloffStart.value = falloffStart;
    u.uFogFallSpeed.value = fogFallSpeed;
    u.uColor.value.set(color);
    
  }, [
    wispDensity, mouseTiltStrength, horizontalBeamOffset, verticalBeamOffset,
    flowSpeed, verticalSizing, horizontalSizing, fogIntensity, fogScale,
    wispSpeed, wispIntensity, flowStrength, decay, falloffStart, fogFallSpeed,
    color
  ]);

  return <div ref={mountRef} className={className} style={style} />;
};

export default LaserFlow;