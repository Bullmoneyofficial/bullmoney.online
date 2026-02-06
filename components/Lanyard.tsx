'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

// Extend Three.js with meshline
extend({ MeshLineGeometry, MeshLineMaterial });

// Asset paths (served from public folder)
const cardModel = '/card.glb';
const lanyardTexture = '/images/lanyard.png';
const bullmoneyLogoTexture = '/images/logos/bullmoney-logo.png';

// Types
interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
}

interface CardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
}

// Verlet physics point
class Point {
  position: THREE.Vector3;
  oldPosition: THREE.Vector3;
  pinned: boolean;
  mass: number;

  constructor(x: number, y: number, z: number, pinned = false, mass = 1) {
    this.position = new THREE.Vector3(x, y, z);
    this.oldPosition = new THREE.Vector3(x, y, z);
    this.pinned = pinned;
    this.mass = mass;
  }

  update(gravity: THREE.Vector3, damping: number) {
    if (this.pinned) return;
    
    const velocity = this.position.clone().sub(this.oldPosition);
    velocity.multiplyScalar(damping);
    
    this.oldPosition.copy(this.position);
    this.position.add(velocity);
    this.position.add(gravity.clone().multiplyScalar(1 / this.mass));
  }
}

// Verlet physics constraint
class Constraint {
  p1: Point;
  p2: Point;
  length: number;

  constructor(p1: Point, p2: Point) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = p1.position.distanceTo(p2.position);
  }

  satisfy() {
    const diff = this.p2.position.clone().sub(this.p1.position);
    const distance = diff.length();
    const difference = (this.length - distance) / distance;
    const offset = diff.multiplyScalar(0.5 * difference);

    if (!this.p1.pinned) this.p1.position.sub(offset);
    if (!this.p2.pinned) this.p2.position.add(offset);
  }
}

// Physics rope simulation
class Rope {
  points: Point[];
  constraints: Constraint[];
  gravity: THREE.Vector3;
  damping: number;

  constructor(
    start: THREE.Vector3,
    end: THREE.Vector3,
    segments: number,
    gravity: THREE.Vector3,
    damping = 0.97
  ) {
    this.points = [];
    this.constraints = [];
    this.gravity = gravity;
    this.damping = damping;

    // Create points along the rope
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      const z = start.z + (end.z - start.z) * t;
      const pinned = i === 0; // Only pin the first point
      this.points.push(new Point(x, y, z, pinned));
    }

    // Create constraints between adjacent points
    for (let i = 0; i < this.points.length - 1; i++) {
      this.constraints.push(new Constraint(this.points[i], this.points[i + 1]));
    }
  }

  update(iterations = 3) {
    // Update points with physics
    for (const point of this.points) {
      point.update(this.gravity, this.damping);
    }

    // Satisfy constraints multiple times for stability
    for (let i = 0; i < iterations; i++) {
      for (const constraint of this.constraints) {
        constraint.satisfy();
      }
    }
  }

  getPositions(): THREE.Vector3[] {
    return this.points.map((p) => p.position.clone());
  }

  setEndPosition(position: THREE.Vector3) {
    const lastPoint = this.points[this.points.length - 1];
    lastPoint.position.copy(position);
  }

  setGravity(gravity: THREE.Vector3) {
    this.gravity = gravity;
  }
}

// Band component - the rope/lanyard
function Band({ maxSpeed = 50, minSpeed = 10 }: BandProps) {
  const bandRef = useRef<THREE.Mesh>(null);
  const ropeRef = useRef<Rope | null>(null);
  const { viewport, size } = useThree();
  const mousePos = useRef({ x: 0, y: 0 });
  
  const isMobile = size.width < 768;
  const lanyardTex = useTexture(lanyardTexture);
  
  // Configure texture to repeat along the lanyard
  useEffect(() => {
    if (lanyardTex) {
      lanyardTex.wrapS = THREE.RepeatWrapping;
      lanyardTex.wrapT = THREE.RepeatWrapping;
      lanyardTex.repeat.set(4, 1);
      lanyardTex.needsUpdate = true;
    }
  }, [lanyardTex]);
  
  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / size.width) * 2 - 1,
        y: -(e.clientY / size.height) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size]);
  
  // Initialize rope physics
  useEffect(() => {
    const start = new THREE.Vector3(0, 6, 0);
    const end = new THREE.Vector3(0, -4, 0);
    const gravity = new THREE.Vector3(0, -0.008, 0);
    ropeRef.current = new Rope(start, end, 32, gravity, 0.96);
  }, []);

  // Update rope physics and geometry each frame
  useFrame((state, delta) => {
    if (!ropeRef.current || !bandRef.current) return;

    // Add mouse influence to the rope
    const mouseInfluence = new THREE.Vector3(
      mousePos.current.x * 0.02,
      mousePos.current.y * 0.01,
      0
    );
    
    // Add wind/sway effect
    const time = state.clock.elapsedTime;
    const windX = Math.sin(time * 0.5) * 0.015 + Math.sin(time * 1.3) * 0.008;
    const windY = Math.cos(time * 0.7) * 0.005;
    
    // Update gravity with mouse + wind
    ropeRef.current.setGravity(
      new THREE.Vector3(
        windX + mouseInfluence.x,
        -0.008 + windY + mouseInfluence.y,
        0
      )
    );

    // Update rope physics
    ropeRef.current.update(8);

    // Get positions from rope
    const positions = ropeRef.current.getPositions();
    
    // Update meshline geometry
    const curve = new THREE.CatmullRomCurve3(positions);
    const curvePoints = curve.getPoints(80);
    const geometry = bandRef.current.geometry as any;
    
    if (geometry.setPoints) {
      geometry.setPoints(curvePoints.flatMap((p) => [p.x, p.y, p.z]));
    }
  });

  return (
    <mesh ref={bandRef}>
      <meshLineGeometry />
      <meshLineMaterial
        transparent
        depthTest={false}
        lineWidth={isMobile ? 0.15 : 0.35}
        useMap={1}
        map={lanyardTex}
        color="#ffffff"
        opacity={1}
      />
    </mesh>
  );
}

// Card component - the 3D badge/card
function Card({ position = [0, 0, 20], gravity = [0, -40, 0] }: CardProps) {
  const cardRef = useRef<THREE.Group>(null);
  const ropeRef = useRef<Rope | null>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  
  const { viewport, size } = useThree();
  const { scene: cardScene } = useGLTF(cardModel);
  const bullmoneyLogo = useTexture(bullmoneyLogoTexture);
  const isMobile = size.width < 768;
  const cardScale = isMobile ? 2 : 4;

  // Clone the model and apply bullmoney logo texture
  const clonedScene = useMemo(() => {
    const clone = cardScene.clone();
    
    // Apply bullmoney logo to card meshes
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: bullmoneyLogo,
          metalness: 0.3,
          roughness: 0.4,
        });
      }
    });
    
    return clone;
  }, [cardScene, bullmoneyLogo]);

  // Track mouse for reactive movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / size.width) * 2 - 1,
        y: -(e.clientY / size.height) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size]);

  // Initialize rope physics for the card's lanyard
  useEffect(() => {
    const verticalScale = isMobile ? 0.6 : 1;
    const start = new THREE.Vector3(0, 10 * verticalScale, position[2]);
    const end = new THREE.Vector3(position[0], (position[1] - 2) * verticalScale, position[2]);
    const grav = new THREE.Vector3(
      gravity[0] * 0.00015,
      gravity[1] * 0.00015,
      gravity[2] * 0.00015
    );
    ropeRef.current = new Rope(start, end, 20, grav, 0.94);
  }, [position, gravity, isMobile]);

  // Handle mouse/touch interactions
  const handlePointerDown = useCallback((e: THREE.Event & { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    isDragging.current = true;
    const event = e as any;
    dragStart.current = { x: event.clientX || 0, y: event.clientY || 0 };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    targetRotation.current = { x: 0, y: 0 };
  }, []);

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!isDragging.current) return;
    const event = e as any;
    const deltaX = (event.clientX || 0) - dragStart.current.x;
    const deltaY = (event.clientY || 0) - dragStart.current.y;
    targetRotation.current = {
      x: deltaY * 0.01,
      y: deltaX * 0.01,
    };
  }, []);

  // Add global pointer listeners for dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !ropeRef.current) return;
      
      // Convert mouse position to 3D world coordinates
      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      
      const vector = new THREE.Vector3(x * viewport.width / 2, y * viewport.height / 2, position[2]);
      ropeRef.current.setEndPosition(vector);
    };

    const handleGlobalPointerUp = () => {
      isDragging.current = false;
      targetRotation.current = { x: 0, y: 0 };
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [size, viewport, position]);

  // Update physics and animations each frame
  useFrame((state, delta) => {
    if (!cardRef.current || !ropeRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Add mouse-reactive gravity
    const mouseInfluence = new THREE.Vector3(
      mousePos.current.x * 0.0003,
      mousePos.current.y * 0.0001,
      0
    );
    
    // Dynamic wind effect
    const windX = Math.sin(time * 0.4) * 0.0002 + Math.sin(time * 1.1) * 0.0001;
    const windY = Math.cos(time * 0.6) * 0.00005;
    
    ropeRef.current.setGravity(
      new THREE.Vector3(
        windX + mouseInfluence.x,
        -0.0006 + windY + mouseInfluence.y,
        0
      )
    );

    // Update rope physics
    ropeRef.current.update(8);

    // Get the last point position (where the card hangs)
    const positions = ropeRef.current.getPositions();
    const lastPos = positions[positions.length - 1];
    const secondLastPos = positions[positions.length - 2];

    // Calculate card orientation based on rope direction
    const direction = lastPos.clone().sub(secondLastPos).normalize();
    const angle = Math.atan2(direction.x, direction.y);

    // Smooth rotation with mouse influence
    const mouseRotX = mousePos.current.y * 0.15;
    const mouseRotY = mousePos.current.x * 0.2;
    
    currentRotation.current.x += (targetRotation.current.x + mouseRotX - currentRotation.current.x) * 0.08;
    currentRotation.current.y += (targetRotation.current.y + mouseRotY - currentRotation.current.y) * 0.08;

    // Apply position and rotation to card
    cardRef.current.position.copy(lastPos);
    cardRef.current.rotation.z = -angle * 0.4;
    cardRef.current.rotation.x = currentRotation.current.x + Math.sin(time * 0.6) * 0.04;
    cardRef.current.rotation.y = currentRotation.current.y + Math.cos(time * 0.4) * 0.04 + Math.PI;

    // More dramatic swaying when not dragging
    if (!isDragging.current) {
      const swayX = Math.sin(time * 0.6) * 0.5 + Math.sin(time * 1.2) * 0.2;
      const swayY = Math.cos(time * 0.5) * 0.15;
      
      const endPoint = ropeRef.current.points[ropeRef.current.points.length - 1];
      if (!endPoint.pinned) {
        endPoint.position.x += swayX * delta;
        endPoint.position.y += swayY * delta;
      }
    }
  });

  return (
    <group
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <primitive 
        object={clonedScene} 
        scale={[cardScale, cardScale, cardScale]}
      />
    </group>
  );
}

// Scene with lanyard band and card
function LanyardScene({ position = [0, 0, 20], gravity = [0, -40, 0] }: LanyardProps) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <directionalLight position={[0, 5, 10]} intensity={0.8} />
      
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
      
      <Band />
      <Card position={position} gravity={gravity} />
    </>
  );
}

// Main Lanyard component
export default function Lanyard({ position = [0, 0, 20], gravity = [0, -40, 0] }: LanyardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="animate-pulse text-white/30 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 25 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
      }}
    >
      <LanyardScene position={position} gravity={gravity} />
    </Canvas>
  );
}

// Preload the GLB model and textures
useGLTF.preload(cardModel);
useTexture.preload(bullmoneyLogoTexture);
useTexture.preload(lanyardTexture);
