"use client";

/**
 * MatrixTerminalBg
 * ----------------
 * Self-contained WebGL matrix/terminal background used as a fallback while
 * Spline is loading on the welcome screens (mobile + desktop).
 *
 * Extracted from MobileDiscordHero.tsx — all required shader code and OGL
 * renderer logic is bundled here so this file has zero cross-component deps.
 *
 * Default tint: dark true-blue (#0033cc)
 */

import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { Renderer, Program, Mesh, Color as OglColor, Triangle } from "ogl";

// ---------------------------------------------------------------------------
// Platform detection (module-level, stable per session)
// ---------------------------------------------------------------------------
const IS_MOBILE =
  typeof window !== "undefined" &&
  /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent
  );

const MOBILE_DPR = IS_MOBILE
  ? Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1)
  : typeof window !== "undefined"
  ? Math.min(window.devicePixelRatio, 2)
  : 1;

const MOBILE_TARGET_FPS = IS_MOBILE ? 30 : 60;
const MOBILE_FRAME_INTERVAL = 1000 / MOBILE_TARGET_FPS;

// ---------------------------------------------------------------------------
// Shaders (verbatim from MobileDiscordHero FaultyTerminal)
// ---------------------------------------------------------------------------
const terminalVert = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const terminalFrag = `
precision mediump float;
varying vec2 vUv;
uniform float iTime;
uniform vec3 iResolution;
uniform float uScale;
uniform vec2 uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3 uTint;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;
float hash21(vec2 p){ p = fract(p * 234.56); p += dot(p, p + 34.56); return fract(p.x * p.y); }
float noise(vec2 p){ return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2; }
mat2 rotate(float angle){ float c = cos(angle); float s = sin(angle); return mat2(c, -s, s, c); }
float fbm(vec2 p){
  p *= 1.1; float f = 0.0; float amp = 0.5 * uNoiseAmp;
  mat2 modify0 = rotate(time * 0.02); f += amp * noise(p); p = modify0 * p * 2.0; amp *= 0.454545;
  mat2 modify1 = rotate(time * 0.02); f += amp * noise(p); p = modify1 * p * 2.0; amp *= 0.454545;
  mat2 modify2 = rotate(time * 0.08); f += amp * noise(p);
  return f;
}
float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0); vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time); mat2 rot1 = rotate(0.1);
  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}
float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
    }
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    p = fract(p); p *= uDigitSize;
    float px5 = p.x * 5.0; float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5); float y = fract(py5);
    float i = floor(py5) - 2.0; float j = floor(px5) - 2.0;
    float n = i * i + j * j; float f = n * 0.0625;
    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}
vec3 getColor(vec2 p){
    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;
    float y = p.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    float displacement = sin(p.y * 20.0 + iTime) * 0.0125 * (step(0.8, sin(iTime + 4.0 * cos(iTime * 2.0))) * uFlickerAmount) * (1.0 + cos(iTime * 60.0)) * window;
    p.x += displacement;
    if (uGlitchAmount != 1.0) { float extra = displacement * (uGlitchAmount - 1.0); p.x += extra; }
    float middle = digit(p);
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
    vec3 baseColor = vec3(0.0) * (1.0 - middle) + (vec3(0.9) * middle + sum * 0.1 * vec3(1.0)) * bar;
    return baseColor;
}
vec2 barrel(vec2 uv){ vec2 c = uv * 2.0 - 1.0; float r2 = dot(c, c); c *= 1.0 + uCurvature * r2; return c * 0.5 + 0.5; }
void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;
    if(uCurvature != 0.0){ uv = barrel(uv); }
    vec2 p = uv * uScale;
    vec3 col = getColor(p);
    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }
    col *= uTint; col *= uBrightness;
    if(uDither > 0.0){ float rnd = hash21(gl_FragCoord.xy); col += (rnd - 0.5) * (uDither * 0.003922); }
    gl_FragColor = vec4(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

// ---------------------------------------------------------------------------
// Core FaultyTerminal canvas component
// ---------------------------------------------------------------------------
interface FaultyTerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number;
  gridMul?: [number, number];
  digitSize?: number;
  timeScale?: number;
  pause?: boolean;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  dither?: number | boolean;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  dpr?: number;
  pageLoadAnimation?: boolean;
  brightness?: number;
  timeOffset?: number;
}

const FaultyTerminal = ({
  scale = 1,
  gridMul = [2, 1],
  digitSize = 1.5,
  timeScale = 0.3,
  pause = false,
  scanlineIntensity = 0.3,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.2,
  tint = "#0033cc",
  mouseReact = true,
  mouseStrength = 0.2,
  dpr = 1,
  pageLoadAnimation = true,
  brightness = 1,
  timeOffset,
  style,
  className,
  ...rest
}: FaultyTerminalProps) => {
  const effectiveDpr = IS_MOBILE ? Math.min(dpr, MOBILE_DPR) : dpr;
  const effectiveMouseReact = IS_MOBILE ? false : mouseReact;
  const effectiveChromaticAberration = IS_MOBILE ? 0 : chromaticAberration;
  const effectiveNoiseAmp = IS_MOBILE ? Math.min(noiseAmp, 0.4) : noiseAmp;

  const containerRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<Program | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const loadAnimationStartRef = useRef<number>(0);
  const timeOffsetRef = useRef<number>(timeOffset ?? Math.random() * 100);
  const lastFrameTimeRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(
    () => (typeof dither === "boolean" ? (dither ? 1 : 0) : dither),
    [dither]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: 1 - (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    mouseRef.current = {
      x: (e.touches[0].clientX - rect.left) / rect.width,
      y: 1 - (e.touches[0].clientY - rect.top) / rect.height,
    };
  }, []);

  // Visibility observer — pause rendering when off-screen on mobile
  useEffect(() => {
    if (!IS_MOBILE) return;
    const ctn = containerRef.current;
    if (!ctn) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(ctn);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr: effectiveDpr });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: terminalVert,
      fragment: terminalFrag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new OglColor(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uScale: { value: scale },
        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: effectiveNoiseAmp },
        uChromaticAberration: { value: effectiveChromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new OglColor(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: {
          value: new Float32Array([smoothMouseRef.current.x, smoothMouseRef.current.y]),
        },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: effectiveMouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness },
      },
    });
    programRef.current = program;

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new OglColor(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(ctn);
    resize();

    const update = (t: number) => {
      rafRef.current = requestAnimationFrame(update);

      if (IS_MOBILE) {
        if (!isVisibleRef.current) return;
        const delta = t - lastFrameTimeRef.current;
        if (delta < MOBILE_FRAME_INTERVAL) return;
        lastFrameTimeRef.current = t - (delta % MOBILE_FRAME_INTERVAL);
      }

      if (pageLoadAnimation && loadAnimationStartRef.current === 0) {
        loadAnimationStartRef.current = t;
      }

      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }

      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        const progress = Math.min(animationElapsed / animationDuration, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }

      if (effectiveMouseReact) {
        const damping = 0.08;
        smoothMouseRef.current.x +=
          (mouseRef.current.x - smoothMouseRef.current.x) * damping;
        smoothMouseRef.current.y +=
          (mouseRef.current.y - smoothMouseRef.current.y) * damping;
        const mu = program.uniforms.uMouse.value as Float32Array;
        mu[0] = smoothMouseRef.current.x;
        mu[1] = smoothMouseRef.current.y;
      }

      renderer.render({ scene: mesh });
    };

    rafRef.current = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    if (effectiveMouseReact) {
      ctn.addEventListener("mousemove", handleMouseMove);
      ctn.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (effectiveMouseReact) {
        ctn.removeEventListener("mousemove", handleMouseMove);
        ctn.removeEventListener("touchmove", handleTouchMove);
      }
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    effectiveDpr,
    pause,
    timeScale,
    scale,
    digitSize,
    scanlineIntensity,
    glitchAmount,
    flickerAmount,
    effectiveNoiseAmp,
    effectiveChromaticAberration,
    ditherValue,
    curvature,
    effectiveMouseReact,
    mouseStrength,
    pageLoadAnimation,
    brightness,
    handleMouseMove,
    handleTouchMove,
    tintVec,
    gridMul,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ...style }}
      {...rest}
    />
  );
};

// ---------------------------------------------------------------------------
// All non-Spline background effects — lazy-loaded to keep first bundle small.
// Props match exactly what MobileDiscordHero.tsx passes to each component.
// ---------------------------------------------------------------------------
import dynamic from "next/dynamic";

const LiquidEther = dynamic(() => import("@/components/LiquidEther"), { ssr: false, loading: () => null });
const DarkVeil    = dynamic(() => import("@/components/DarkVeil"),    { ssr: false, loading: () => null });
const LightPillar = dynamic(() => import("@/components/LightPillar"), { ssr: false, loading: () => null });
const GridScanComp  = dynamic(() => import("@/components/GridScan").then(m => ({ default: m.GridScan })), { ssr: false, loading: () => null });
const Galaxy      = dynamic(() => import("@/components/Galaxy"),      { ssr: false, loading: () => null });
const LetterGlitch = dynamic(() => import("@/components/LetterGlitch"), { ssr: false, loading: () => null });
const Ballpit     = dynamic(() => import("@/components/Ballpit"),     { ssr: false, loading: () => null });
const GridDistortion = dynamic(() => import("@/components/GridDistortion"), { ssr: false, loading: () => null });

// ---------------------------------------------------------------------------
// Effect types + random picker
// ---------------------------------------------------------------------------
type WelcomeEffect =
  | "terminal"
  | "liquidEther"
  | "darkVeil"
  | "lightPillar"
  | "gridScan"
  | "galaxy"
  | "letterGlitch"
  | "ballpit"
  | "gridDistortion";

const ALL_WELCOME_EFFECTS: WelcomeEffect[] = [
  "terminal",
  "liquidEther",
  "darkVeil",
  "lightPillar",
  "gridScan",
  "galaxy",
  "letterGlitch",
  "ballpit",
  "gridDistortion",
];

function pickRandomEffect(): WelcomeEffect {
  return ALL_WELCOME_EFFECTS[
    Math.floor(Math.random() * ALL_WELCOME_EFFECTS.length)
  ] as WelcomeEffect;
}

// ---------------------------------------------------------------------------
// Dark-blue SVG gradient used as the GridDistortion texture source
// ---------------------------------------------------------------------------
const DARK_BLUE_GRID_SRC: string = (() => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">' +
    "<defs>" +
    '<radialGradient id="rg" cx="50%" cy="45%" r="70%">' +
    '<stop offset="0%"   stop-color="#0044ff"/>' +
    '<stop offset="40%"  stop-color="#002080"/>' +
    '<stop offset="75%"  stop-color="#000d40"/>' +
    '<stop offset="100%" stop-color="#00041a"/>' +
    "</radialGradient>" +
    '<linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%"   stop-color="#001a66" stop-opacity="0.6"/>' +
    '<stop offset="100%" stop-color="#000824" stop-opacity="0.9"/>' +
    "</linearGradient>" +
    "</defs>" +
    '<rect width="100%" height="100%" fill="url(#rg)"/>' +
    '<rect width="100%" height="100%" fill="url(#lg)"/>' +
    "</svg>";
  if (typeof btoa !== "undefined") return "data:image/svg+xml;base64," + btoa(svg);
  return "";
})();

// ---------------------------------------------------------------------------
// Render the chosen effect
// ---------------------------------------------------------------------------
function renderWelcomeEffect(effect: WelcomeEffect) {
  // Thermal/mobile quality factors (simple version — no thermal hook needed here)
  const q = IS_MOBILE ? 0.6 : 1.0;

  switch (effect) {
    case "terminal":
      return (
        <FaultyTerminal
          tint="#0033cc"
          brightness={0.85}
          scanlineIntensity={0.35 * q}
          curvature={0.15}
          glitchAmount={1 * q}
          flickerAmount={0.6 * q}
          noiseAmp={0.7 * q}
          gridMul={IS_MOBILE ? [1, 0.75] : [2, 1]}
          digitSize={IS_MOBILE ? 0.9 : 1.4}
          timeScale={0.28 * q}
          pageLoadAnimation
          mouseReact={!IS_MOBILE}
          style={{ width: "100%", height: "100%" }}
        />
      );

    case "liquidEther":
      return (
        <LiquidEther
          colors={["#ffffff", "#e8e8e8", "#d0d0d0"]}
          mouseForce={IS_MOBILE ? 5 : 10}
          cursorSize={IS_MOBILE ? 30 : 60}
          isViscous={false}
          viscous={(IS_MOBILE ? 8 : 15) * q}
          iterationsViscous={Math.max(2, Math.round((IS_MOBILE ? 4 : 8) * q))}
          iterationsPoisson={Math.max(2, Math.round((IS_MOBILE ? 4 : 8) * q))}
          resolution={Math.max(0.08, (IS_MOBILE ? 0.15 : 0.25) * q)}
          isBounce={false}
          autoDemo
          autoSpeed={(IS_MOBILE ? 0.15 : 0.3) * q}
          autoIntensity={(IS_MOBILE ? 0.6 : 1.2) * q}
          takeoverDuration={0.3}
          autoResumeDelay={3000}
          autoRampDuration={0.5}
        />
      );

    case "darkVeil":
      return (
        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <DarkVeil
            hueShift={0}
            noiseIntensity={(IS_MOBILE ? 0.005 : 0.01) * q}
            scanlineIntensity={0}
            speed={(IS_MOBILE ? 0.15 : 0.3) * q}
            scanlineFrequency={0}
            warpAmount={(IS_MOBILE ? 0.02 : 0.05) * q}
            resolutionScale={Math.max(0.3, (IS_MOBILE ? 0.5 : 1) * q)}
          />
        </div>
      );

    case "lightPillar":
      return (
        <LightPillar
          topColor="#ffffff"
          bottomColor="#cccccc"
          intensity={(IS_MOBILE ? 0.4 : 0.6) * q}
          rotationSpeed={(IS_MOBILE ? 0.08 : 0.15) * q}
          glowAmount={(IS_MOBILE ? 0.001 : 0.002) * q}
          pillarWidth={IS_MOBILE ? 1.5 : 2}
          pillarHeight={0.3}
          noiseIntensity={(IS_MOBILE ? 0.1 : 0.2) * q}
          pillarRotation={15}
          interactive={false}
          mixBlendMode="screen"
          quality={q < 0.6 ? "minimal" : "low"}
        />
      );

    case "gridScan":
      return (
        <GridScanComp
          sensitivity={(IS_MOBILE ? 0.2 : 0.4) * q}
          lineThickness={1}
          linesColor="#444444"
          gridScale={Math.max(0.05, (IS_MOBILE ? 0.1 : 0.15) * q)}
          scanColor="#ffffff"
          scanOpacity={(IS_MOBILE ? 0.2 : 0.3) * q}
          enablePost={false}
          bloomIntensity={0}
          chromaticAberration={0}
          noiseIntensity={(IS_MOBILE ? 0.002 : 0.005) * q}
          scanDuration={IS_MOBILE ? 6 : 4}
          scanDelay={IS_MOBILE ? 3 : 2}
        />
      );

    case "galaxy":
      return (
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={Math.max(0.2, (IS_MOBILE ? 0.4 : 0.8) * q)}
          glowIntensity={(IS_MOBILE ? 0.2 : 0.4) * q}
          saturation={0}
          hueShift={0}
          twinkleIntensity={(IS_MOBILE ? 0.02 : 0.05) * q}
          rotationSpeed={(IS_MOBILE ? 0.008 : 0.015) * q}
          repulsionStrength={1}
          autoCenterRepulsion={0}
          starSpeed={(IS_MOBILE ? 0.08 : 0.15) * q}
          speed={(IS_MOBILE ? 0.1 : 0.2) * q}
          transparent={false}
          disableAnimation={false}
        />
      );

    case "letterGlitch":
      return (
        <LetterGlitch
          glitchColors={["#ffffff", "#dddddd", "#bbbbbb"]}
          glitchSpeed={IS_MOBILE ? 120 : 80}
          centerVignette
          outerVignette
          smooth={false}
          characters="BULLMONEY"
        />
      );

    case "ballpit":
      return (
        <Ballpit
          count={Math.max(10, Math.round((IS_MOBILE ? 20 : 40) * q))}
          gravity={0.005 * q}
          friction={0.99}
          wallBounce={0.85}
          followCursor={false}
        />
      );

    case "gridDistortion":
      return (
        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", backgroundColor: "#00041a" }}>
          <GridDistortion
            imageSrc={DARK_BLUE_GRID_SRC}
            grid={Math.max(6, Math.round((IS_MOBILE ? 10 : 16) * q))}
            mouse={(IS_MOBILE ? 0.12 : 0.2) * q}
            strength={(IS_MOBILE ? 0.15 : 0.28) * q}
            relaxation={0.91}
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// MatrixTerminalBg — randomly picks one of all 9 non-Spline background effects
// on each mount. Fades in immediately; callers fade it out once Spline loads.
// Exported as MatrixTerminalBg to keep existing import paths working.
// ---------------------------------------------------------------------------
export const MatrixTerminalBg = memo(function MatrixTerminalBg({
  visible = true,
}: {
  visible?: boolean;
}) {
  // Stable random pick for this component mount — never changes during session
  const effect = useRef<WelcomeEffect>(pickRandomEffect()).current;

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 700ms ease-out",
        // Deep dark-navy base — visible immediately before the effect's WebGL inits
        backgroundColor: effect === "terminal" ? "#00081a" : "#000",
        pointerEvents: "none",
      }}
    >
      {renderWelcomeEffect(effect)}
    </div>
  );
});

export default MatrixTerminalBg;
