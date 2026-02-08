import { useRef, useEffect, useState, useCallback } from 'react';
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture, type OGLRenderingContext } from 'ogl';

import './FlyingPosters.css';

type GL = OGLRenderingContext;
type OGLProgram = Program;
type OGLMesh = Mesh;
type OGLTransform = Transform;
type OGLPlane = Plane;

interface ScreenSize {
  width: number;
  height: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface ScrollState {
  position?: number;
  ease: number;
  current: number;
  target: number;
  last: number;
}

interface MediaParams {
  gl: GL;
  geometry: OGLPlane;
  scene: OGLTransform;
  screen: ScreenSize;
  viewport: ViewportSize;
  image: string;
  length: number;
  index: number;
  planeWidth: number;
  planeHeight: number;
  distortion: number;
}

interface CanvasParams {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  items: string[];
  planeWidth: number;
  planeHeight: number;
  distortion: number;
  scrollEase: number;
  cameraFov: number;
  cameraZ: number;
  onPositions?: (positions: PosterPosition[]) => void;
}

export interface ProductInfo {
  name: string;
  price: number;
  image: string;
}

interface PosterPosition {
  index: number;
  screenY: number;  // 0-1 normalized within container
  visible: boolean;
  rotation: number;
}

const isMobileGlobal = typeof window !== 'undefined' && window.innerWidth < 768;

const vertexShader = `
precision ${isMobileGlobal ? 'mediump' : 'highp'} float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision ${isMobileGlobal ? 'mediump' : 'highp'} float;

uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
  vec2 imageSize = uImageSize;
  vec2 planeSize = uPlaneSize;

  float imageAspect = imageSize.x / imageSize.y;
  float planeAspect = planeSize.x / planeSize.y;
  vec2 scale = vec2(1.0, 1.0);

  if (planeAspect > imageAspect) {
      scale.x = imageAspect / planeAspect;
  } else {
      scale.y = planeAspect / imageAspect;
  }

  vec2 uv = vUv * scale + (1.0 - scale) * 0.5;

  gl_FragColor = texture2D(tMap, uv);
}
`;

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

class Media {
  gl: GL;
  geometry: OGLPlane;
  scene: OGLTransform;
  screen: ScreenSize;
  viewport: ViewportSize;
  image: string;
  length: number;
  index: number;
  planeWidth: number;
  planeHeight: number;
  distortion: number;

  program!: OGLProgram;
  plane!: OGLMesh;
  extra = 0;
  padding = 0;
  height = 0;
  heightTotal = 0;
  y = 0;

  constructor({
    gl,
    geometry,
    scene,
    screen,
    viewport,
    image,
    length,
    index,
    planeWidth,
    planeHeight,
    distortion
  }: MediaParams) {
    this.gl = gl;
    this.geometry = geometry;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.image = image;
    this.length = length;
    this.index = index;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;
    this.distortion = distortion;

    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true,
      minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
      magFilter: this.gl.LINEAR
    });
    // Flag to track if this media is currently onscreen
    (this as any)._visible = true;
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      fragment: fragmentShader,
      vertex: vertexShader,
      uniforms: {
        tMap: { value: texture },
        uPlaneSize: { value: [0, 0] },
        uImageSize: { value: [0, 0] }
      },
      cullFace: false
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSize.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  setScale() {
    this.plane.scale.x = (this.viewport.width * this.planeWidth) / this.screen.width;
    this.plane.scale.y = (this.viewport.height * this.planeHeight) / this.screen.height;
    this.plane.position.x = 0;
    this.program.uniforms.uPlaneSize.value = [this.plane.scale.x, this.plane.scale.y];
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: ViewportSize } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    this.setScale();

    this.padding = 0.3;
    this.height = this.plane.scale.y + this.padding;
    this.heightTotal = this.height * this.length;
    this.y = -this.heightTotal / 2 + (this.index + 0.5) * this.height;
  }

  _smoothedVel = 0;

  update(scroll: ScrollState, velocity: number) {
    this.plane.position.y = this.y - scroll.current - this.extra;

    const planeHalfH = this.plane.scale.y * 0.5;
    const vpHalfH = this.viewport.height * 0.5;
    const topEdge = this.plane.position.y + planeHalfH;
    const bottomEdge = this.plane.position.y - planeHalfH;

    // Infinite scroll wrapping
    if (topEdge < -vpHalfH) {
      this.extra -= this.heightTotal;
    } else if (bottomEdge > vpHalfH) {
      this.extra += this.heightTotal;
    }

    // Frustum cull — hide meshes fully off-screen so GPU skips them
    const margin = planeHalfH + 0.5;
    if (this.plane.position.y > vpHalfH + margin || this.plane.position.y < -vpHalfH - margin) {
      this.plane.visible = false;
      return;
    }
    this.plane.visible = true;

    // Smooth the velocity to prevent frame-to-frame jitter in spin
    this._smoothedVel += (velocity - this._smoothedVel) * 0.3;

    // Only rotate when actually scrolling — completely flat at rest
    const v = this._smoothedVel;
    const absV = Math.abs(v);
    if (absV < 0.0002) {
      this.plane.rotation.y = 0;
      this.plane.rotation.z = 0;
    } else {
      // Flying poster spin — velocity only, no position-based tilt
      this.plane.rotation.y = v * this.distortion * 2.5;
      // Slight Z tilt proportional to speed
      this.plane.rotation.z = v * 0.3;
    }
  }

  // Expose screen-space position for HTML overlay
  getScreenPosition(viewport: ViewportSize, screen: ScreenSize): { y: number; visible: boolean; rotation: number } {
    const normalizedY = this.plane.position.y / viewport.height; // -0.5 to 0.5
    const screenY = 0.5 - normalizedY; // flip: 0 = top, 1 = bottom
    return {
      y: screenY,
      visible: this.plane.visible,
      rotation: this.plane.rotation.y
    };
  }
}

class Canvas {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  items: string[];
  planeWidth: number;
  planeHeight: number;
  distortion: number;
  scroll: ScrollState;
  cameraFov: number;
  cameraZ: number;
  onPositions?: (positions: PosterPosition[]) => void;

  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: OGLTransform;
  planeGeometry!: OGLPlane;
  medias!: Media[];
  screen!: ScreenSize;
  viewport!: ViewportSize;
  isDown = false;
  start = 0;
  loaded = 0;
  isMobile = false;
  lastPageScroll = 0;
  rafId = 0;
  isVisible = true;

  constructor({
    container,
    canvas,
    items,
    planeWidth,
    planeHeight,
    distortion,
    scrollEase,
    cameraFov,
    cameraZ,
    onPositions
  }: CanvasParams) {
    this.container = container;
    this.canvas = canvas;
    this.items = items;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;
    this.distortion = distortion;
    this.scroll = {
      ease: scrollEase,
      current: 0,
      target: 0,
      last: 0
    };
    this.cameraFov = cameraFov;
    this.cameraZ = cameraZ;
    this.onPositions = onPositions;
    this.isMobile = window.innerWidth < 768;
    this.lastPageScroll = window.scrollY;

    // Manual binds instead of expensive AutoBind (avoids Reflect overhead)
    this.update = this.update.bind(this);
    this._startLoop = this._startLoop.bind(this);
    this._stopLoop = this._stopLoop.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onTouchDown = this.onTouchDown.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchUp = this.onTouchUp.bind(this);
    this.onPageScroll = this.onPageScroll.bind(this);

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias();
    // Immediate first render so posters appear without any interaction
    this.medias?.forEach(media => media.update(this.scroll, 0));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this._startLoop();
    this.addEventListeners();
    this.createPreloader();
  }

  createRenderer() {
    this.renderer = new Renderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2)
    });
    this.gl = this.renderer.gl;
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = this.cameraFov;
    this.camera.position.z = this.cameraZ;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    // Minimal geometry — rotation is on the mesh transform, not per-vertex
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 1,
      widthSegments: 1
    });
  }

  createMedias() {
    this.medias = this.items.map(
      (image, index) =>
        new Media({
          gl: this.gl,
          geometry: this.planeGeometry,
          scene: this.scene,
          screen: this.screen,
          viewport: this.viewport,
          image,
          length: this.items.length,
          index,
          planeWidth: this.planeWidth,
          planeHeight: this.planeHeight,
          distortion: this.distortion
        })
    );
  }

  createPreloader() {
    this.loaded = 0;
    this.items.forEach(src => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
      image.onload = () => {
        if (++this.loaded === this.items.length) {
          this._imagesLoaded = true;
          // Re-render with loaded textures
          this.medias?.forEach(media => media.update(this.scroll, 0));
          this.renderer.render({ scene: this.scene, camera: this.camera });
          document.documentElement.classList.remove('loading');
          document.documentElement.classList.add('loaded');
        }
      };
    });
  }

  onResize() {
    const rect = this.container.getBoundingClientRect();
    // If container has no dimensions yet (conditional render), retry shortly
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(() => this.onResize(), 100);
      return;
    }
    this.screen = { width: rect.width, height: rect.height };
    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height
    });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };

    this.medias?.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    if (this.isMobile) return; // Mobile uses page scroll
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (this.isMobile) return; // Mobile uses page scroll
    if (!this.isDown || this.scroll.position == null) return;
    const y = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
    const distance = (this.start - y) * 0.1;
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    this.isDown = false;
  }

  onWheel(e: WheelEvent) {
    this.scroll.target += e.deltaY * 0.005;
    this._startLoop(); // Wake up render loop
  }

  onPageScroll() {
    const currentScroll = window.scrollY;
    const delta = currentScroll - this.lastPageScroll;
    this.lastPageScroll = currentScroll;
    this.scroll.target += delta * 0.05;
    this._startLoop(); // Wake up render loop
  }

  _lastFrameTime = 0;
  _isRunning = false;
  _idleFrames = 0;
  _imagesLoaded = false;

  /** Start the render loop if not already running */
  _startLoop() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._idleFrames = 0;
    this.rafId = requestAnimationFrame(this.update);
  }

  /** Stop the render loop to free the GPU */
  _stopLoop() {
    this._isRunning = false;
    cancelAnimationFrame(this.rafId);
  }

  update(timestamp?: number) {
    if (!this._isRunning) return;
    this.rafId = requestAnimationFrame(this.update);

    // Skip when off-screen
    if (!this.isVisible) return;

    // Gentle auto-drift only on desktop
    if (!this.isMobile && !this.isDown) {
      this.scroll.target += 0.003;
    }

    // Faster ease = snappier deceleration (0.25 is punchy, 0.12 was mushy)
    const ease = this.isMobile ? 0.25 : this.scroll.ease;
    const gap = Math.abs(this.scroll.target - this.scroll.current);
    if (gap < 0.002) {
      this.scroll.current = this.scroll.target;
    } else {
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, ease);
    }

    // Track idle frames — stop loop after 5 idle frames on mobile (only after images loaded)
    const velocity = Math.abs(this.scroll.current - this.scroll.last);
    if (this.isMobile && this._imagesLoaded && velocity < 0.0005) {
      this._idleFrames++;
      if (this._idleFrames > 5) {
        // Do one final render then stop the loop
        const vel = this.scroll.current - this.scroll.last;
        this.medias?.forEach(media => media.update(this.scroll, vel));
        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.scroll.last = this.scroll.current;
        this._reportPositions();
        this._stopLoop();
        return;
      }
    } else {
      this._idleFrames = 0;
    }

    const vel = this.scroll.current - this.scroll.last;
    this.medias?.forEach(media => media.update(this.scroll, vel));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;

    this._reportPositions();
  }

  _reportPositions() {
    if (this.onPositions && this.medias) {
      const positions: PosterPosition[] = this.medias.map((media, i) => {
        const sp = media.getScreenPosition(this.viewport, this.screen);
        return { index: i, screenY: sp.y, visible: sp.visible, rotation: sp.rotation };
      });
      this.onPositions(positions);
    }
  }

  addEventListeners() {
    window.addEventListener('resize', this.onResize);

    // Pause rendering when off-screen, but skip first callback so initial load always renders
    let observerReady = false;
    this._observer = new IntersectionObserver(
      ([entry]) => {
        if (!observerReady) {
          observerReady = true;
          return; // Skip first callback — always render on mount
        }
        this.isVisible = entry.isIntersecting;
        if (entry.isIntersecting) this._startLoop();
      },
      { threshold: 0.01 }
    );
    this._observer.observe(this.container);

    if (this.isMobile) {
      window.addEventListener('scroll', this.onPageScroll, { passive: true });
    } else {
      this.container.addEventListener('wheel', this.onWheel, { passive: true });
      this.container.addEventListener('mousedown', this.onTouchDown as EventListener);
      this.container.addEventListener('mousemove', this.onTouchMove as EventListener);
      this.container.addEventListener('mouseup', this.onTouchUp);
      this.container.addEventListener('mouseleave', this.onTouchUp);
    }
  }

  _observer: IntersectionObserver | null = null;

  destroy() {
    this._stopLoop();
    this._observer?.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onPageScroll);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('mousedown', this.onTouchDown as EventListener);
    this.container.removeEventListener('mousemove', this.onTouchMove as EventListener);
    this.container.removeEventListener('mouseup', this.onTouchUp);
    this.container.removeEventListener('mouseleave', this.onTouchUp);
  }
}

interface FlyingPostersProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: string[];
  products?: ProductInfo[];
  planeWidth?: number;
  planeHeight?: number;
  distortion?: number;
  scrollEase?: number;
  cameraFov?: number;
  cameraZ?: number;
}

export default function FlyingPosters({
  items = [],
  products = [],
  planeWidth = 320,
  planeHeight = 320,
  distortion = 3,
  scrollEase = 0.01,
  cameraFov = 45,
  cameraZ = 20,
  className,
  ...props
}: FlyingPostersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<Canvas | null>(null);
  const [positions, setPositions] = useState<PosterPosition[]>([]);

  const handlePositions = useCallback((pos: PosterPosition[]) => {
    setPositions(pos);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const timeoutId = setTimeout(() => {
      if (!containerRef.current || !canvasRef.current) return;
      instanceRef.current = new Canvas({
        container: containerRef.current,
        canvas: canvasRef.current,
        items,
        planeWidth,
        planeHeight,
        distortion,
        scrollEase,
        cameraFov,
        cameraZ,
        onPositions: handlePositions
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [items, planeWidth, planeHeight, distortion, scrollEase, cameraFov, cameraZ, handlePositions]);

  // Map poster positions to product data (products cycle if fewer than items)
  const containerW = containerRef.current?.clientWidth || 400;
  const containerH = containerRef.current?.clientHeight || 1;
  // Card width matches poster width on screen
  const cardWidth = Math.min(planeWidth * 0.85, containerW - 32);

  const productCards = positions.map((pos) => {
    if (!pos.visible || products.length === 0) return null;
    const product = products[pos.index % products.length];
    if (!product) return null;

    const topPx = pos.screenY * containerH;

    // Hide if off screen
    if (topPx < -60 || topPx > containerH + 60) return null;

    // Fade based on how much poster is rotated (spinning = less visible label)
    const rotationFade = Math.max(0, 1 - Math.abs(pos.rotation) * 1.5);

    return (
      <div
        key={pos.index}
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          top: `${topPx}px`,
          transform: 'translateY(calc(-100% - 6px))',
          opacity: rotationFade,
          transition: 'opacity 0.1s ease-out',
          zIndex: 10,
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-xl"
          style={{
            width: `${cardWidth}px`,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <span
            className="text-white font-semibold text-sm leading-tight tracking-tight truncate"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            {product.name}
          </span>
          <span
            className="text-white font-bold text-sm ml-3 shrink-0"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    );
  });

  return (
    <div ref={containerRef} className={`posters-container ${className ?? ''}`} {...props}>
      <canvas ref={canvasRef} className="posters-canvas" />
      {productCards}
    </div>
  );
}
