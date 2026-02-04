"use client";

 
import { useRef, useMemo, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Preload, Trail, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

// ============================================
// 🎮 INTERACTIVE CRYPTO SOLAR SYSTEM GAME
// Touch, Drag, Explode, Burn Planets with Sun!
// ============================================

const BLUE_COLORS = {
  primary: "#0066FF",
  secondary: "#00AAFF", 
  accent: "#00D4FF",
  light: "#66D9FF",
  dark: "#0044AA",
  glow: "#0088FF",
  fire: "#FF6600",
  explosion: "#FF4444",
  burning: "#FF8800",
};

const INTERACTION_CODE = {
  code: "X3R7P",
  label: "BULLMONEY",
  cta: "Go to XM or Vantage",
} as const;

type InteractionType = "explode" | "burn" | "drag" | "bonus" | "collect";

// Game states for each planet
interface CoinState {
  isDragging: boolean;
  isHovered: boolean;
  isExploding: boolean;
  isBurning: boolean;
  isHeld: boolean;
  holdProgress: number;
  velocity: THREE.Vector3;
  position: THREE.Vector3;
  scale: number;
  health: number;
  explosionParticles: ExplosionParticle[];
}

interface ExplosionParticle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  color: string;
  size: number;
}

// Crypto coin data with interactive properties
const CRYPTO_COINS = [
  { name: "BTC", color: "#0066FF", size: 0.5, orbitRadius: 3.5, orbitSpeed: 2.5, rotationSpeed: 0.02, orbitInclination: 0.04, orbitEccentricity: 0.04, axialTilt: 0.15, value: 100 },
  { name: "ETH", color: "#00AAFF", size: 0.45, orbitRadius: 5, orbitSpeed: 1.8, rotationSpeed: 0.025, orbitInclination: 0.08, orbitEccentricity: 0.06, axialTilt: 0.35, value: 80 },
  { name: "SOL", color: "#00D4FF", size: 0.35, orbitRadius: 6.5, orbitSpeed: 1.5, rotationSpeed: 0.03, orbitInclination: 0.12, orbitEccentricity: 0.05, axialTilt: 0.25, value: 60 },
  { name: "XRP", color: "#3399FF", size: 0.3, orbitRadius: 8, orbitSpeed: 1.2, rotationSpeed: 0.022, orbitInclination: 0.06, orbitEccentricity: 0.07, axialTilt: 0.18, value: 40 },
  { name: "BNB", color: "#0055DD", size: 0.4, orbitRadius: 10, orbitSpeed: 0.9, rotationSpeed: 0.028, orbitInclination: 0.1, orbitEccentricity: 0.03, axialTilt: 0.28, value: 70 },
  { name: "ADA", color: "#0077EE", size: 0.35, orbitRadius: 12, orbitSpeed: 0.7, rotationSpeed: 0.02, orbitInclination: 0.14, orbitEccentricity: 0.06, axialTilt: 0.42, hasRings: true, value: 50 },
  { name: "DOGE", color: "#66B2FF", size: 0.32, orbitRadius: 14.5, orbitSpeed: 0.5, rotationSpeed: 0.035, orbitInclination: 0.18, orbitEccentricity: 0.05, axialTilt: 0.3, value: 30 },
  { name: "USDT", color: "#0099CC", size: 0.28, orbitRadius: 17, orbitSpeed: 0.35, rotationSpeed: 0.018, orbitInclination: 0.2, orbitEccentricity: 0.04, axialTilt: 0.2, value: 25 },
];

const ACHIEVEMENTS = [
  { id: "first-pop", label: "First Pop", check: (state: GameState) => state.explosions >= 1 },
  { id: "sun-burn", label: "Sun Burner", check: (state: GameState) => state.burnedCoins.length >= 1 },
  { id: "drag-master", label: "Orbit Drifter", check: (state: GameState) => state.draggedCoins.length >= 4 },
  { id: "combo-5", label: "Combo x5", check: (state: GameState) => state.bestCombo >= 5 },
  { id: "score-500", label: "Score 500", check: (state: GameState) => state.score >= 500 },
  { id: "shard-collector", label: "Shard Collector", check: (state: GameState) => state.gemsCollected >= 3 },
  { id: "bounty-hunter", label: "Bounty Hunter", check: (state: GameState) => state.bountiesHit >= 2 },
  { id: "space-hauler", label: "Space Hauler", check: (state: GameState) => state.shipCollected >= 3 },
];

const LEVEL_THRESHOLDS = [0, 120, 260, 420, 600, 820, 1080, 1380, 1720, 2100, 2520, 3000, 999999];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;

const getLevelFromScore = (score: number) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (score >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  return level;
};

// Store for game state
interface GameState {
  score: number;
  explosions: number;
  burnedCoins: string[];
  draggedCoins: string[];
  achievements: string[];
  lastAchievement: string | null;
  combo: number;
  bestCombo: number;
  lastInteractionAt: number | null;
  targetCoin: string | null;
  gemsCollected: number;
  bountiesHit: number;
  shipCollected: number;
  level: number;
  vipUnlocked: boolean;
}

interface SpaceGemState {
  id: number;
  seed: number;
  active: boolean;
}

// ============================================
// INTERACTIVE SUN - Burns planets that touch it!
// ============================================
function InteractiveSun({ 
  onBurnPlanet,
  interactionNotice,
}: { 
  onBurnPlanet: (planetName: string) => void;
  interactionNotice: { id: number; type: InteractionType } | null;
}) {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const [isActive, setIsActive] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [isNoticeActive, setIsNoticeActive] = useState(false);

  useEffect(() => {
    if (!interactionNotice) return;
    setIsNoticeActive(true);
    setPulseIntensity(2.2);
    const t = window.setTimeout(() => setIsNoticeActive(false), 2200);
    return () => window.clearTimeout(t);
  }, [interactionNotice?.id]);

  useEffect(() => {
    if (!isNoticeActive && !isActive) {
      setPulseIntensity(1);
    }
  }, [isNoticeActive, isActive]);

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.003;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05 * pulseIntensity;
      glowRef.current.scale.setScalar(scale);
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z += 0.01;
      const coronaScale = 1.4 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      coronaRef.current.scale.setScalar(coronaScale);
    }
  });

  return (
    <group>
      {/* Sun core */}
      <mesh 
        ref={sunRef}
        onPointerEnter={() => { setIsActive(true); setPulseIntensity(2); }}
        onPointerLeave={() => { setIsActive(false); setPulseIntensity(1); }}
      >
        <sphereGeometry args={[1.8, 64, 64]} />
        <MeshDistortMaterial 
          color={isActive ? BLUE_COLORS.fire : BLUE_COLORS.primary} 
          distort={isActive ? 0.4 : 0.2}
          speed={2}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh scale={1.15}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial 
          color={isActive ? BLUE_COLORS.burning : BLUE_COLORS.secondary} 
          transparent 
          opacity={0.4} 
        />
      </mesh>
      
      {/* Corona effect when active */}
      <mesh ref={coronaRef} scale={1.5}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial 
          color={isActive ? "#FF4400" : BLUE_COLORS.accent} 
          transparent 
          opacity={isActive ? 0.3 : 0.15} 
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.35}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color={BLUE_COLORS.accent} transparent opacity={0.2} />
      </mesh>
      
      {/* Decorative ring */}
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.5, 0.05, 16, 64]} />
        <meshBasicMaterial color={BLUE_COLORS.light} transparent opacity={0.6} />
      </mesh>
      
      {/* Solar flares - sparkles */}
      <Sparkles count={50} scale={4} size={3} speed={0.5} color={isActive ? "#FF6600" : BLUE_COLORS.accent} />
      
      {/* BULLMONEY label */}
      <Html center position={[0, 0, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ 
          fontSize: "18px", 
          fontWeight: "bold",
          color: "#ffffff",
          textShadow: `0 0 20px ${isActive ? '#FF6600' : '#0066FF'}, 0 0 40px ${isActive ? '#FF4400' : '#00AAFF'}`,
          letterSpacing: "2px"
        }}>
          BULL
          <br />
          <span style={{ color: isActive ? BLUE_COLORS.fire : BLUE_COLORS.accent }}>MONEY</span>
        </div>
      </Html>

      {/* Interaction code + CTA */}
      {isNoticeActive && (
        <Html center position={[0, 2.6, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 900,
            letterSpacing: "1px",
            textTransform: "uppercase",
            textShadow: "0 0 18px rgba(0, 180, 255, 0.8)",
            background: "rgba(0, 20, 40, 0.8)",
            border: "1px solid rgba(0, 180, 255, 0.6)",
            padding: "6px 10px",
            borderRadius: "10px",
            backdropFilter: "blur(6px)",
          }}>
            <div style={{ fontSize: "13px" }}>{INTERACTION_CODE.code} • {INTERACTION_CODE.label}</div>
            <div style={{ fontSize: "9px", color: "#8fe0ff", marginTop: "2px" }}>
              {INTERACTION_CODE.cta}
            </div>
          </div>
        </Html>
      )}
      
      {/* Point lights */}
      <pointLight color={isActive || isNoticeActive ? BLUE_COLORS.fire : BLUE_COLORS.primary} intensity={isActive || isNoticeActive ? 5 : 3} distance={60} decay={0.5} />
      <pointLight color="#ffffff" intensity={1.5} distance={100} decay={0.2} />
    </group>
  );
}

// ============================================
// EXPLOSION EFFECT COMPONENT
// ============================================
function ExplosionEffect({ 
  position, 
  color, 
  onComplete 
}: { 
  position: THREE.Vector3; 
  color: string;
  onComplete: () => void;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles] = useState(() => {
    const positions = new Float32Array(100 * 3);
    const velocities: THREE.Vector3[] = [];
    
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ));
    }
    return { positions, velocities };
  });
  
  const [life, setLife] = useState(1);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3));
    return geo;
  }, [particles.positions]);

  useFrame((frameState, delta) => {
    if (particlesRef.current && life > 0) {
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < 100; i++) {
        positions.array[i * 3] += particles.velocities[i].x * delta * 2;
        positions.array[i * 3 + 1] += particles.velocities[i].y * delta * 2;
        positions.array[i * 3 + 2] += particles.velocities[i].z * delta * 2;
        particles.velocities[i].multiplyScalar(0.98);
      }
      positions.needsUpdate = true;
      
      const newLife = life - delta * 0.8;
      setLife(newLife);
      
      if (newLife <= 0) {
        onComplete();
      }
    }
  });

  if (life <= 0) return null;

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial 
        color={color} 
        size={0.15} 
        transparent 
        opacity={life} 
        sizeAttenuation 
      />
    </points>
  );
}

// ============================================
// FIRE/BURN EFFECT COMPONENT
// ============================================
function BurnEffect({ position, intensity }: { position: THREE.Vector3; intensity: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const initialPositions = useMemo(() => {
    const count = 50;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = position.y + Math.random() * 0.5;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    }
    return positions;
  }, [position]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    return geo;
  }, [initialPositions]);

  useFrame((frameState, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < 50; i++) {
        positions.array[i * 3 + 1] += delta * 2;
        if (positions.array[i * 3 + 1] > position.y + 1.5) {
          positions.array[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
          positions.array[i * 3 + 1] = position.y;
          positions.array[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
        }
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial 
        color={BLUE_COLORS.fire} 
        size={0.1 * intensity} 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
      />
    </points>
  );
}

// ============================================
// HOVER RING EFFECT
// ============================================
function HoverRing({ size, color, active }: { size: number; color: string; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(1);

  useFrame((state, delta) => {
    if (ringRef.current && active) {
      ringRef.current.rotation.z += delta * 2;
      const newScale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      setScale(newScale);
    }
  });

  if (!active) return null;

  return (
    <mesh ref={ringRef} scale={scale}>
      <torusGeometry args={[size * 1.5, 0.05, 16, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// ============================================
// DRAG TRAIL EFFECT
// ============================================
function DragTrail({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  
  return (
    <Sparkles 
      count={20} 
      scale={2} 
      size={2} 
      speed={2} 
      color={color}
      opacity={0.8}
    />
  );
}

// ============================================
// BONUS SHARD COLLECTIBLE
// ============================================
function BonusShard({
  id,
  position,
  color,
  label,
  onCollect,
}: {
  id: string;
  position: [number, number, number];
  color: string;
  label: string;
  onCollect: (id: string) => void;
}) {
  const shardRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (shardRef.current) {
      shardRef.current.rotation.y += delta * 1.5;
      shardRef.current.rotation.x += delta * 0.8;
      shardRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={shardRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          onCollect(id);
        }}
      >
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.6} roughness={0.2} />
      </mesh>
      <Sparkles count={6} scale={1} size={3} speed={1.5} color={color} />
      <Html center position={[0, 0.5, 0]} style={{ pointerEvents: "none" }}>
        <div style={{
          fontSize: "9px",
          fontWeight: 800,
          color: "#ffffff",
          textShadow: `0 0 10px ${color}`,
          background: "rgba(0, 0, 0, 0.6)",
          padding: "2px 6px",
          borderRadius: "6px",
          border: `1px solid ${color}`,
          whiteSpace: "nowrap",
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ============================================
// DRAGGABLE SPACE SHIP
// ============================================
function SpaceShip({
  onMove,
  isTouchDevice,
}: {
  onMove: (pos: THREE.Vector3) => void;
  isTouchDevice: boolean;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const velocity = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!shipRef.current) return;
    shipRef.current.position.x += velocity.current.x * delta;
    shipRef.current.position.z += velocity.current.z * delta;
    velocity.current.multiplyScalar(0.92);
    shipRef.current.position.x = THREE.MathUtils.clamp(shipRef.current.position.x, -14, 14);
    shipRef.current.position.z = THREE.MathUtils.clamp(shipRef.current.position.z, -14, 14);
    shipRef.current.rotation.z = -velocity.current.x * 0.4;
    shipRef.current.rotation.x = velocity.current.z * 0.3;
    onMove(shipRef.current.position.clone());
  });

  return (
    <group
      ref={shipRef}
      position={[0, 0.5, 10]}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setIsDragging(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        setIsDragging(false);
      }}
      onPointerLeave={() => setIsDragging(false)}
      onPointerMove={(e) => {
        if (!isDragging) return;
        e.stopPropagation();
        const targetX = THREE.MathUtils.clamp(e.point.x, -14, 14);
        const targetZ = THREE.MathUtils.clamp(e.point.z, -14, 14);
        velocity.current.set((targetX - (shipRef.current?.position.x ?? 0)) * 6, 0, (targetZ - (shipRef.current?.position.z ?? 0)) * 6);
      }}
    >
      <mesh>
        <coneGeometry args={[0.35, 0.9, 16]} />
        <meshStandardMaterial color="#d7ecff" metalness={0.7} roughness={0.2} emissive="#5bb6ff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 0.4, 12]} />
        <meshStandardMaterial color="#2b5cff" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.7, 0.05]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color="#7CFF6B" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -0.9, 0.05]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color="#00A3FF" transparent opacity={0.12} />
      </mesh>
      <Html position={[0, 0.8, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          fontSize: "8px",
          color: "#cfe9ff",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(120,200,255,0.6)",
          padding: "2px 6px",
          borderRadius: "6px",
          whiteSpace: "nowrap",
        }}>
          {isTouchDevice ? "Drag ship" : "Drag ship"}
        </div>
      </Html>
    </group>
  );
}

// ============================================
// ORBITING SPACE GEM COLLECTIBLE
// ============================================
function SpaceGem({
  id,
  seed,
  onCollect,
  onPosition,
}: {
  id: number;
  seed: number;
  onCollect: (id: number) => void;
  onPosition?: (id: number, position: THREE.Vector3) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { radius, speed, phase, tilt, color } = useMemo(() => {
    const palette = ["#7CFF6B", "#00FFD5", "#FF6AD5", "#FFD66B"];
    return {
      radius: 6 + Math.random() * 8,
      speed: 0.25 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 0.6,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  }, [seed]);
  const angleRef = useRef(phase);

  useEffect(() => {
    angleRef.current = phase;
  }, [phase]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    angleRef.current += delta * speed;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    const y = Math.sin(angleRef.current * 0.7 + tilt) * 0.6 + 0.6;
    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y += delta * 1.4;
    groupRef.current.rotation.x += delta * 0.6;
    onPosition?.(id, groupRef.current.position.clone());
  });

  return (
    <group ref={groupRef}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          onCollect(id);
        }}
      >
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <Sparkles count={4} scale={0.8} size={2} speed={1} color={color} />
    </group>
  );
}

// ============================================
// HOLD PROGRESS INDICATOR
// ============================================
function HoldProgress({ progress, size }: { progress: number; size: number }) {
  if (progress <= 0) return null;

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={size + 0.5}>
      <ringGeometry args={[size * 0.8, size * 0.8 + 0.1, 32, 1, 0, Math.PI * 2 * progress]} />
      <meshBasicMaterial color={BLUE_COLORS.explosion} transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ============================================
// INTERACTIVE CRYPTO COIN COMPONENT
// ============================================
function InteractiveCoin({
  name,
  color,
  size,
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  orbitInclination = 0,
  orbitEccentricity = 0,
  axialTilt = 0,
  hasRings = false,
  value,
  isTarget = false,
  onPosition,
  onExplode,
  onBurn,
  onDrag,
  onScoreUpdate,
  sunPosition,
}: {
  name: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  orbitInclination?: number;
  orbitEccentricity?: number;
  axialTilt?: number;
  hasRings?: boolean;
  value: number;
  isTarget?: boolean;
  onPosition?: (name: string, position: THREE.Vector3) => void;
  onExplode: (name: string, position: THREE.Vector3) => void;
  onBurn: (name: string) => void;
  onDrag: (name: string) => void;
  onScoreUpdate: (points: number) => void;
  sunPosition: THREE.Vector3;
}) {
  const orbitGroupRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  
  const [coinState, setCoinState] = useState<CoinState>({
    isDragging: false,
    isHovered: false,
    isExploding: false,
    isBurning: false,
    isHeld: false,
    holdProgress: 0,
    velocity: new THREE.Vector3(),
    position: new THREE.Vector3(orbitRadius, 0, 0),
    scale: 1,
    health: 100,
    explosionParticles: [],
  });

  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const holdStartTime = useRef<number | null>(null);
  const dragStartPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastDragPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const wobblePhase = useMemo(() => Math.random() * Math.PI * 2, []);

  // Handle orbital motion and physics
  useFrame((frameState, delta) => {
    if (!groupRef.current || coinState.isExploding) return;

    // Normal orbital motion when not dragging
    if (!coinState.isDragging) {
      orbitAngle.current += delta * orbitSpeed * 0.3;
      const e = orbitEccentricity;
      const radius = orbitRadius * (1 - e * e) / (1 + e * Math.cos(orbitAngle.current));
      groupRef.current.position.x = Math.cos(orbitAngle.current) * radius;
      groupRef.current.position.z = Math.sin(orbitAngle.current) * radius;
      groupRef.current.position.y = Math.sin(orbitAngle.current * 0.7 + wobblePhase) * orbitRadius * 0.03;
    }

    // Coin rotation
    if (coinRef.current) {
      coinRef.current.rotation.z = axialTilt;
      coinRef.current.rotation.y += rotationSpeed * (coinState.isHovered ? 2 : 1);
    }

    // Handle hold mechanic for explosion
    if (coinState.isHeld && holdStartTime.current) {
      const holdDuration = (Date.now() - holdStartTime.current) / 1000;
      const progress = Math.min(holdDuration / 2, 1); // 2 seconds to explode
      
      setCoinState(prev => ({ ...prev, holdProgress: progress }));

      // Shake effect while holding
      if (groupRef.current) {
        groupRef.current.position.x += (Math.random() - 0.5) * 0.05 * progress;
        groupRef.current.position.z += (Math.random() - 0.5) * 0.05 * progress;
      }

      if (progress >= 1) {
        // EXPLOSION!
        const pos = groupRef.current.position.clone();
        setCoinState(prev => ({ ...prev, isExploding: true, isHeld: false, holdProgress: 0 }));
        onExplode(name, pos);
        onScoreUpdate(value);
        holdStartTime.current = null;
      }
    }

    // Check distance to sun for burning
    if (groupRef.current) {
      const distToSun = groupRef.current.position.distanceTo(sunPosition);
      if (distToSun < 3) {
        const burnIntensity = 1 - (distToSun / 3);
        setCoinState(prev => ({ 
          ...prev, 
          isBurning: true,
          health: Math.max(0, prev.health - burnIntensity * delta * 50)
        }));

        if (coinState.health <= 0) {
          onBurn(name);
          onScoreUpdate(value * 2); // Bonus for burning!
          setCoinState(prev => ({ ...prev, isExploding: true }));
        }
      } else {
        setCoinState(prev => ({ ...prev, isBurning: false }));
      }
    }

    if (groupRef.current) {
      onPosition?.(name, groupRef.current.position.clone());
    }

    // Hover scale animation
    const targetScale = coinState.isHovered ? 1.3 : (coinState.isDragging ? 1.2 : 1);
    setCoinState(prev => ({ 
      ...prev, 
      scale: THREE.MathUtils.lerp(prev.scale, targetScale, 0.1) 
    }));
  });

  // Pointer handlers for interaction
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    // Start hold timer
    holdStartTime.current = Date.now();
    setCoinState(prev => ({ ...prev, isHeld: true, isDragging: true }));
    
    if (groupRef.current) {
      dragStartPos.current = groupRef.current.position.clone();
      lastDragPos.current = groupRef.current.position.clone();
    }
    
    onDrag(name);
    (gl.domElement as HTMLElement).style.cursor = 'grabbing';
  }, [name, onDrag, gl]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    
    holdStartTime.current = null;
    setCoinState(prev => ({ ...prev, isHeld: false, isDragging: false, holdProgress: 0 }));
    (gl.domElement as HTMLElement).style.cursor = 'pointer';
  }, [gl]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!coinState.isDragging || !groupRef.current) return;
    e.stopPropagation();

    // Cancel hold if dragging significantly
    const moveDist = e.point.distanceTo(dragStartPos.current);
    if (moveDist > 0.5) {
      holdStartTime.current = null;
      setCoinState(prev => ({ ...prev, isHeld: false, holdProgress: 0 }));
    }

    // Update position based on drag
    groupRef.current.position.x = e.point.x;
    groupRef.current.position.z = e.point.z;
  }, [coinState.isDragging]);

  const handlePointerEnter = useCallback(() => {
    setCoinState(prev => ({ ...prev, isHovered: true }));
    (gl.domElement as HTMLElement).style.cursor = 'pointer';
  }, [gl]);

  const handlePointerLeave = useCallback(() => {
    setCoinState(prev => ({ ...prev, isHovered: false }));
    if (!coinState.isDragging) {
      (gl.domElement as HTMLElement).style.cursor = 'auto';
    }
  }, [coinState.isDragging, gl]);

  // Double tap/click to explode instantly
  const handleDoubleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (groupRef.current) {
      const pos = groupRef.current.position.clone();
      setCoinState(prev => ({ ...prev, isExploding: true }));
      onExplode(name, pos);
      onScoreUpdate(value);
    }
  }, [name, value, onExplode, onScoreUpdate]);

  if (coinState.isExploding) return null;

  return (
    <group ref={orbitGroupRef} rotation={[orbitInclination, 0, orbitInclination * 0.35]}>
      <group ref={groupRef}>
      {/* Drag trail effect */}
      <DragTrail active={coinState.isDragging} color={color} />
      
      {/* Hold progress indicator */}
      <HoldProgress progress={coinState.holdProgress} size={size} />
      
      {/* Hover ring effect */}
      <HoverRing size={size} color={color} active={coinState.isHovered} />

      {/* Target bounty ring */}
      {isTarget && (
        <mesh rotation-x={Math.PI / 2} scale={1.9}>
          <ringGeometry args={[size * 1.6, size * 1.9, 64]} />
          <meshBasicMaterial color="#FFD66B" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Burn effect */}
      {coinState.isBurning && groupRef.current && (
        <BurnEffect 
          position={groupRef.current.position} 
          intensity={1 - coinState.health / 100} 
        />
      )}

      {/* Main coin mesh - Realistic 3D Crypto Coin */}
      <Trail
        width={coinState.isDragging ? 2 : 0}
        length={6}
        color={color}
        attenuation={(t) => t * t}
      >
        <group 
          ref={coinRef}
          scale={coinState.scale}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onDoubleClick={handleDoubleClick}
        >
          {/* Main coin body - cylinder */}
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[size, size, size * 0.15, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? BLUE_COLORS.burning : color}
              roughness={0.2} 
              metalness={0.9}
              emissive={coinState.isHovered || coinState.isDragging ? color : (coinState.isBurning ? BLUE_COLORS.fire : color)}
              emissiveIntensity={coinState.isHovered ? 0.45 : (coinState.isBurning ? 0.8 : 0.15)}
                envMapIntensity={0.3}
            />
          </mesh>
          
          {/* Coin rim - ridged edge effect */}
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[size, size * 0.08, 8, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? "#FFD700" : "#C0C0C0"}
              roughness={0.2}
              metalness={0.9}
                envMapIntensity={0.35}
            />
          </mesh>
          
          {/* Front face embossed effect - inner circle */}
          <mesh position={[0, 0, size * 0.076]}>
            <circleGeometry args={[size * 0.75, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? BLUE_COLORS.fire : "#1a1a2e"}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          
          {/* Front face outer ring decoration */}
          <mesh position={[0, 0, size * 0.077]}>
            <ringGeometry args={[size * 0.7, size * 0.85, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? "#FFD700" : color}
              roughness={0.1}
              metalness={0.95}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Coin symbol embossed on front face */}
          <Html position={[0, 0, size * 0.09]} center style={{ pointerEvents: "none" }}>
            <div style={{
              fontSize: `${Math.max(12, size * 24)}px`,
              fontWeight: 900,
              color: color,
              textShadow: `0 0 ${size * 10}px ${color}, 0 0 ${size * 5}px rgba(255,255,255,0.3)`,
              letterSpacing: "-1px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {name.charAt(0)}
            </div>
          </Html>
          
          {/* Back face embossed effect */}
          <mesh position={[0, 0, -size * 0.076]} rotation-y={Math.PI}>
            <circleGeometry args={[size * 0.75, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? BLUE_COLORS.fire : "#1a1a2e"}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          
          {/* Back face outer ring decoration */}
          <mesh position={[0, 0, -size * 0.077]} rotation-y={Math.PI}>
            <ringGeometry args={[size * 0.7, size * 0.85, 64]} />
            <meshStandardMaterial 
              color={coinState.isBurning ? "#FFD700" : color}
              roughness={0.1}
              metalness={0.95}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Shine/specular highlight on front */}
          <mesh position={[size * 0.2, size * 0.2, size * 0.08]}>
            <circleGeometry args={[size * 0.15, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={coinState.isHovered ? 0.4 : 0.2} />
          </mesh>

          {/* Subtle atmosphere glow */}
          <mesh>
            <sphereGeometry args={[size * 1.03, 32, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={coinState.isHovered ? 0.12 : 0.06}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      </Trail>

      {/* Coin glow - intensifies on hover */}
      <mesh rotation-x={Math.PI / 2} scale={coinState.isHovered ? 1.4 : 1.2}>
        <cylinderGeometry args={[size, size, size * 0.05, 32]} />
        <meshBasicMaterial 
          color={coinState.isBurning ? BLUE_COLORS.fire : color} 
          transparent 
          opacity={coinState.isHovered ? 0.4 : 0.2} 
        />
      </mesh>

      {/* Rings for specific coins */}
      {hasRings && (
        <mesh rotation-x={Math.PI / 2.5}>
          <ringGeometry args={[size * 1.3, size * 1.8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Health bar when burning */}
      {coinState.isBurning && (
        <Html position={[0, size + 0.8, 0]} center>
          <div style={{
            width: '50px',
            height: '6px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${coinState.health}%`,
              height: '100%',
              background: coinState.health > 50 ? '#00FF00' : (coinState.health > 25 ? '#FFFF00' : '#FF0000'),
              transition: 'width 0.1s',
            }} />
          </div>
        </Html>
      )}

      {/* Coin label - above the coin */}
      <Html
        position={[0, size * 1.2 + (coinState.isBurning ? 1.2 : 0.4), 0]}
        center
        style={{
          color: "#ffffff",
          fontSize: coinState.isHovered ? "14px" : "11px",
          fontWeight: "bold",
          textShadow: `0 0 10px ${color}`,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          background: coinState.isHovered ? "rgba(0,40,80,0.9)" : "rgba(0,20,40,0.7)",
          padding: coinState.isHovered ? "5px 12px" : "3px 8px",
          borderRadius: "6px",
          border: `1px solid ${coinState.isHovered ? '#ffffff' : color}`,
          transform: coinState.isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease',
        }}
      >
        {name}
        {coinState.isHovered && (
          <div style={{ fontSize: '9px', color: BLUE_COLORS.accent, marginTop: '2px' }}>
            +{value} pts | Hold to Explode
          </div>
        )}
      </Html>
      </group>
    </group>
  );
}

// ============================================
// ORBIT PATH VISUALIZATION
// ============================================
function OrbitPath({ radius, inclination = 0, isHighlighted = false }: { radius: number; inclination?: number; isHighlighted?: boolean }) {
  const geometry = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ 
      color: isHighlighted ? BLUE_COLORS.accent : BLUE_COLORS.dark, 
      transparent: true, 
      opacity: isHighlighted ? 0.5 : 0.2 
    });
  }, [isHighlighted]);

  return <primitive object={new THREE.Line(geometry, material)} rotation={[inclination, 0, inclination * 0.35]} />;
}

// ============================================
// PARTICLE BELT
// ============================================
function ParticleBelt() {
  const particles = useMemo(() => {
    const items = [];
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 9 + Math.random() * 2;
      const y = (Math.random() - 0.5) * 0.5;
      items.push({
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
        size: 0.02 + Math.random() * 0.03,
      });
    }
    return items;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <octahedronGeometry args={[particle.size, 0]} />
          <meshBasicMaterial color={i % 2 === 0 ? BLUE_COLORS.accent : BLUE_COLORS.light} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// SUBTLE SPACE DUST + NEBULA HAZE
// ============================================
function SpaceDust() {
  return (
    <Sparkles
      count={80}
      scale={60}
      size={1}
      speed={0.2}
      color="#9cc7ff"
      opacity={0.35}
    />
  );
}

function NebulaHaze() {
  const hazeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (hazeRef.current) {
      hazeRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      hazeRef.current.rotation.z = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <mesh ref={hazeRef} scale={1}>
      <sphereGeometry args={[70, 32, 32]} />
      <meshBasicMaterial
        color="#061326"
        transparent
        opacity={0.18}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ============================================
// CAMERA CONTROLLER
// ============================================
function CameraController() {
  const { camera } = useThree();

  useFrame((state) => {
    camera.position.y = 8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
  });

  return null;
}

// ============================================
// GAME SCENE COMPONENT
// ============================================
function GameScene({ 
  onScoreUpdate, 
  onExplosion,
  onBurn,
  onDrag,
  onBonusCollect,
  onTargetComplete,
  onTargetChange,
  onShipCollect,
  interactionNotice,
  isTouchDevice,
}: { 
  onScoreUpdate: (points: number) => void;
  onExplosion: (name: string, position: THREE.Vector3) => void;
  onBurn: (name: string) => void;
  onDrag: (name: string) => void;
  onBonusCollect: (points: number) => void;
  onTargetComplete: (name: string, bonus: number) => void;
  onTargetChange: (name: string | null) => void;
  onShipCollect: (name: string, points: number) => void;
  interactionNotice: { id: number; type: InteractionType } | null;
  isTouchDevice: boolean;
}) {
  const [explosions, setExplosions] = useState<{ id: number; position: THREE.Vector3; color: string }[]>([]);
  const [activePlanets, setActivePlanets] = useState<string[]>(CRYPTO_COINS.map(c => c.name));
  const [activeBonuses, setActiveBonuses] = useState<string[]>([]);
  const [targetCoin, setTargetCoin] = useState<string | null>(null);
  const [spaceGems, setSpaceGems] = useState<SpaceGemState[]>(() => (
    Array.from({ length: 3 }, (_, i) => ({ id: i, seed: 0, active: true }))
  ));
  const explosionId = useRef(0);
  const sunPosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const shipPositionRef = useRef(new THREE.Vector3(0, 0.5, 10));
  const coinPositionsRef = useRef(new Map<string, THREE.Vector3>());
  const gemPositionsRef = useRef(new Map<number, THREE.Vector3>());
  const lastCollectCheckRef = useRef(0);

  const bonusItems = useMemo(() => (
    [
      { id: "nova-1", position: [4, 1.4, -2] as [number, number, number], color: "#00FFD5", label: "Nova Shard", points: 35 },
      { id: "nova-2", position: [-6, 1.1, 4] as [number, number, number], color: "#7CFF6B", label: "Ion Shard", points: 30 },
      { id: "nova-3", position: [8, 0.9, 6] as [number, number, number], color: "#FF6AD5", label: "Flux Shard", points: 45 },
      { id: "nova-4", position: [-9, 1.3, -6] as [number, number, number], color: "#7CB6FF", label: "Orbit Shard", points: 40 },
      { id: "nova-5", position: [0, 1.6, -10] as [number, number, number], color: "#FFD66B", label: "Solar Shard", points: 50 },
    ]
  ), []);

  useEffect(() => {
    setActiveBonuses(bonusItems.map(item => item.id));
  }, [bonusItems]);

  const pickTargetFrom = useCallback((planets: string[]) => {
    if (planets.length === 0) {
      setTargetCoin(null);
      onTargetChange(null);
      return;
    }
    const next = planets[Math.floor(Math.random() * planets.length)];
    setTargetCoin(next);
    onTargetChange(next);
  }, [onTargetChange]);

  useEffect(() => {
    if (!targetCoin || !activePlanets.includes(targetCoin)) {
      pickTargetFrom(activePlanets);
    }
  }, [activePlanets, pickTargetFrom, targetCoin]);

  useEffect(() => {
    const t = window.setInterval(() => {
      pickTargetFrom(activePlanets);
    }, 12000);
    return () => window.clearInterval(t);
  }, [activePlanets, pickTargetFrom]);

  const handleExplode = useCallback((name: string, position: THREE.Vector3) => {
    const coin = CRYPTO_COINS.find(c => c.name === name);
    const id = explosionId.current++;

    setExplosions(prev => [...prev, { id, position, color: coin?.color || BLUE_COLORS.explosion }]);
    setActivePlanets(prev => {
      const next = prev.filter(p => p !== name);
      if (name === targetCoin) {
        onTargetComplete(name, 80);
        window.setTimeout(() => pickTargetFrom(next), 0);
      }
      return next;
    });
    onExplosion(name, position);
  }, [onExplosion, onTargetComplete, pickTargetFrom, targetCoin]);

  const handleExplosionComplete = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleBurn = useCallback((name: string) => {
    setActivePlanets(prev => {
      const next = prev.filter(p => p !== name);
      if (name === targetCoin) {
        onTargetComplete(name, 100);
        window.setTimeout(() => pickTargetFrom(next), 0);
      }
      return next;
    });
    onBurn(name);
  }, [onBurn, onTargetComplete, pickTargetFrom, targetCoin]);

  const handleShipCollectCoin = useCallback((name: string) => {
    const coin = CRYPTO_COINS.find(c => c.name === name);
    if (!coin) return;
    setActivePlanets(prev => {
      const next = prev.filter(p => p !== name);
      if (name === targetCoin) {
        onTargetComplete(name, 60);
        window.setTimeout(() => pickTargetFrom(next), 0);
      }
      return next;
    });
    onShipCollect(name, Math.round(coin.value * 0.6));
  }, [onShipCollect, onTargetComplete, pickTargetFrom, targetCoin]);

  const handleBonusCollect = useCallback((id: string) => {
    const item = bonusItems.find(b => b.id === id);
    if (!item) return;
    setActiveBonuses(prev => prev.filter(b => b !== id));
    onBonusCollect(item.points);
    window.setTimeout(() => {
      setActiveBonuses(prev => (prev.includes(id) ? prev : [...prev, id]));
    }, 6500);
  }, [bonusItems, onBonusCollect]);

  const handleGemCollect = useCallback((id: number) => {
    setSpaceGems(prev => prev.map(gem => (gem.id === id ? { ...gem, active: false } : gem)));
    onBonusCollect(25);
    window.setTimeout(() => {
      setSpaceGems(prev => prev.map(gem => (
        gem.id === id ? { ...gem, seed: gem.seed + 1, active: true } : gem
      )));
    }, 5200);
  }, [onBonusCollect]);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastCollectCheckRef.current < 0.08) return;
    lastCollectCheckRef.current = state.clock.elapsedTime;
    const shipPos = shipPositionRef.current;

    for (const name of activePlanets) {
      const pos = coinPositionsRef.current.get(name);
      if (!pos) continue;
      if (pos.distanceTo(shipPos) < 0.75) {
        handleShipCollectCoin(name);
        break;
      }
    }

    for (const gem of spaceGems) {
      if (!gem.active) continue;
      const pos = gemPositionsRef.current.get(gem.id);
      if (!pos) continue;
      if (pos.distanceTo(shipPos) < 0.6) {
        handleGemCollect(gem.id);
        break;
      }
    }

    for (const item of bonusItems) {
      if (!activeBonuses.includes(item.id)) continue;
      const pos = new THREE.Vector3(item.position[0], item.position[1], item.position[2]);
      if (pos.distanceTo(shipPos) < 0.7) {
        handleBonusCollect(item.id);
        break;
      }
    }
  });

  return (
    <>
      {/* Strong lighting for visibility */}
      <hemisphereLight intensity={0.35} color="#9cc7ff" groundColor="#02040b" />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[12, 12, 6]}
        intensity={1.1}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={4}
        shadow-camera-far={40}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight position={[-10, -8, -6]} intensity={0.25} color="#2f6bff" />
      <Stars radius={120} depth={60} count={4200} factor={4} saturation={0} fade speed={1} />
      <NebulaHaze />
      <SpaceDust />
      <fog attach="fog" args={["#020407", 22, 70]} />

      {/* Soft shadow catcher (very lightweight) */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.8} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
      
      <InteractiveSun onBurnPlanet={handleBurn} interactionNotice={interactionNotice} />
      
      {CRYPTO_COINS.map((coin) => (
        <OrbitPath 
          key={`orbit-${coin.name}`} 
          radius={coin.orbitRadius} 
          inclination={coin.orbitInclination}
          isHighlighted={activePlanets.includes(coin.name)}
        />
      ))}
      
      {CRYPTO_COINS.filter(coin => activePlanets.includes(coin.name)).map((coin) => (
        <InteractiveCoin 
          key={coin.name} 
          {...coin} 
          isTarget={coin.name === targetCoin}
          onPosition={(name, position) => {
            coinPositionsRef.current.set(name, position);
          }}
          onExplode={handleExplode}
          onBurn={handleBurn}
          onDrag={onDrag}
          onScoreUpdate={onScoreUpdate}
          sunPosition={sunPosition}
        />
      ))}
      
      {/* Render explosion effects */}
      {explosions.map(exp => (
        <ExplosionEffect 
          key={exp.id} 
          position={exp.position} 
          color={exp.color}
          onComplete={() => handleExplosionComplete(exp.id)}
        />
      ))}

      {/* Bonus collectibles */}
      {bonusItems.filter(item => activeBonuses.includes(item.id)).map(item => (
        <BonusShard
          key={item.id}
          id={item.id}
          position={item.position}
          color={item.color}
          label={item.label}
          onCollect={handleBonusCollect}
        />
      ))}

      {/* Orbiting space gems */}
      {spaceGems.filter(gem => gem.active).map(gem => (
        <SpaceGem
          key={`${gem.id}-${gem.seed}`}
          id={gem.id}
          seed={gem.seed}
          onCollect={handleGemCollect}
          onPosition={(id, position) => {
            gemPositionsRef.current.set(id, position);
          }}
        />
      ))}

      <SpaceShip
        onMove={(pos) => {
          shipPositionRef.current.copy(pos);
        }}
        isTouchDevice={isTouchDevice}
      />
      
      <ParticleBelt />
      
      <OrbitControls
        enablePan={!isTouchDevice}
        enableZoom={true}
        enableRotate={!isTouchDevice}
        minDistance={5}
        maxDistance={40}
        autoRotate={false}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 6}
      />
      
      <CameraController />
      <Preload all />
    </>
  );
}

// ============================================
// LOADING FALLBACK
// ============================================
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-400 text-lg font-bold">Loading Crypto Game...</p>
      </div>
    </div>
  );
}

// ============================================
// GAME UI OVERLAY
// ============================================
function GameUI({ 
  score, 
  explosions, 
  burnedCoins, 
  combo,
  bestCombo,
  targetCoin,
  gemsCollected,
  bountiesHit,
  shipCollected,
  level,
  vipUnlocked,
  missions,
  achievements,
  lastAchievement,
  onReset,
}: { 
  score: number; 
  explosions: number;
  burnedCoins: string[];
  combo: number;
  bestCombo: number;
  targetCoin: string | null;
  gemsCollected: number;
  bountiesHit: number;
  shipCollected: number;
  level: number;
  vipUnlocked: boolean;
  missions: { id: string; label: string; progress: number; target: number }[];
  achievements: string[];
  lastAchievement: string | null;
  onReset: () => void;
}) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        padding: "60px 16px 96px",
        zIndex: 99999999999,
        overflow: "hidden",
      }}
    >
      {/* Score display - top left */}
      <div 
        className="absolute top-0 left-0 pointer-events-auto"
        style={{ maxWidth: "45%", zIndex: 99999999999 }}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-blue-500/50 rounded-lg p-1.5">
          <div className="text-[7px] text-blue-300 mb-0.5 uppercase tracking-wider">Score</div>
          <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {score}
          </div>
          <div className="flex gap-1.5 mt-0.5 text-[7px]">
            <div>
              <span className="text-orange-400">💥</span> {explosions}
            </div>
            <div>
              <span className="text-red-400">🔥</span> {burnedCoins.length}
            </div>
            <div>
              <span className="text-cyan-300">⚡</span> x{combo}
            </div>
            <div>
              <span className="text-emerald-300">🚀</span> {shipCollected}
            </div>
          </div>
          <div className="text-[7px] text-blue-200/80 mt-0.5">Best Combo: x{bestCombo}</div>
          <div className="text-[7px] text-yellow-200/80 mt-0.5">Level {level} / {MAX_LEVEL}</div>
        </div>
      </div>

      {/* Instructions - top right */}
      <div 
        className="absolute top-0 right-0 pointer-events-auto"
        style={{ maxWidth: "45%", zIndex: 99999999999 }}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-blue-500/30 rounded-lg p-1.5 text-[7px]">
          <div className="text-blue-400 font-bold mb-0.5 text-[8px]">How to Play</div>
          <ul className="text-blue-200/80 space-y-0 leading-tight">
            <li>✋ Hold - Explode</li>
            <li>👆 2x Tap - Pop</li>
            <li>☀️ To Sun - Burn</li>
            <li>💎 Tap Shards - Bonus</li>
            <li>🎯 Bounty Target - Big Bonus</li>
            <li>🚀 Drag Ship - Collect</li>
          </ul>
        </div>
      </div>

      {/* Bounty target - top center */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ zIndex: 99999999999, top: "58px" }}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-yellow-400/40 rounded-lg px-2 py-1 text-[7px] text-yellow-200">
          <div className="text-[7px] uppercase tracking-wider text-yellow-300">Bounty</div>
          <div className="text-[9px] font-bold">{targetCoin ? `${targetCoin} Target` : "Awaiting"}</div>
          <div className="text-[7px] text-yellow-200/80">Hits: {bountiesHit}</div>
        </div>
      </div>

      {/* Missions - right center */}
      <div
        className="absolute right-0 pointer-events-auto"
        style={{ maxWidth: "45%", zIndex: 99999999999, top: "70px" }}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-blue-500/30 rounded-lg p-1.5 text-[7px]">
          <div className="text-cyan-300 font-bold mb-0.5 text-[8px]">Missions</div>
          <div className="space-y-0.5 text-blue-200/80">
            {missions.map((mission) => (
              <div key={mission.id} className="flex items-center justify-between gap-1">
                <span className="truncate">{mission.label}</span>
                <span className="text-cyan-200">{mission.progress}/{mission.target}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset button - bottom right */}
      <div className="absolute right-0 pointer-events-auto" style={{ zIndex: 99999999999, bottom: "12px" }}>
        <button
          onClick={onReset}
          className="backdrop-blur-xl bg-blue-600/80 hover:bg-blue-500/90 border border-blue-400/50 rounded-lg px-2 py-1 text-white font-bold text-[9px] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          🔄 Reset
        </button>
      </div>

      {/* Achievement toast area - bottom center */}
      {(burnedCoins.length > 0 || lastAchievement) && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
          style={{ maxWidth: "90%", zIndex: 99999999999, bottom: "32px" }}
        >
          <div className="backdrop-blur-xl bg-gradient-to-r from-orange-600/80 to-red-600/80 border border-orange-400/50 rounded-lg px-2 py-1 text-white font-bold text-[9px] animate-pulse whitespace-nowrap">
            {lastAchievement ? `🏆 ${lastAchievement}` : `🔥 ${burnedCoins[burnedCoins.length - 1]} burned!`}
          </div>
        </div>
      )}

      {/* Achievements summary - bottom left */}
      <div className="absolute left-0 pointer-events-auto" style={{ zIndex: 99999999999, bottom: "12px" }}>
        <div className="backdrop-blur-xl bg-black/80 border border-blue-500/30 rounded-lg px-2 py-1 text-[7px] text-blue-200/80">
          🏆 {achievements.length} Achievements • 💎 {gemsCollected} Shards
        </div>
      </div>

      {vipUnlocked && (
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto" style={{ zIndex: 99999999999, bottom: "58px" }}>
          <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-500/80 to-amber-500/80 border border-yellow-300/60 rounded-lg px-3 py-1 text-white font-black text-[9px] animate-pulse whitespace-nowrap">
            👑 VIP FREE FOR LIFEE UNLOCKED
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN EXPORT - SOLAR SYSTEM GAME
// ============================================
export default function SolarSystemGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    explosions: 0,
    burnedCoins: [],
    draggedCoins: [],
    achievements: [],
    lastAchievement: null,
    combo: 1,
    bestCombo: 1,
    lastInteractionAt: null,
    targetCoin: null,
    gemsCollected: 0,
    bountiesHit: 0,
    shipCollected: 0,
    level: 1,
    vipUnlocked: false,
  });

  const [interactionNotice, setInteractionNotice] = useState<{ id: number; type: InteractionType } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deviceDpr, setDeviceDpr] = useState(1);
  const interactionId = useRef(0);
  const lastInteractionRef = useRef(0);
  const comboRef = useRef(1);

  useEffect(() => {
    const updateDevice = () => {
      const dpr = typeof window !== "undefined" ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
      const pointerFine = typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;
      const touch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0) && !pointerFine;
      setDeviceDpr(dpr);
      setIsTouchDevice(touch);
    };
    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  useEffect(() => {
    if (!interactionNotice) return;
    const t = window.setTimeout(() => setInteractionNotice(null), 2400);
    return () => window.clearTimeout(t);
  }, [interactionNotice?.id]);

  useEffect(() => {
    if (!gameState.lastAchievement) return;
    const t = window.setTimeout(() => {
      setGameState(prev => ({ ...prev, lastAchievement: null }));
    }, 2200);
    return () => window.clearTimeout(t);
  }, [gameState.lastAchievement]);

  useEffect(() => {
    const newlyUnlocked = ACHIEVEMENTS.filter(a => !gameState.achievements.includes(a.id) && a.check(gameState));
    if (newlyUnlocked.length === 0) return;
    setGameState(prev => ({
      ...prev,
      achievements: [...prev.achievements, ...newlyUnlocked.map(a => a.id)],
      lastAchievement: newlyUnlocked[0].label,
    }));
  }, [
    gameState.achievements,
    gameState.explosions,
    gameState.burnedCoins.length,
    gameState.draggedCoins.length,
    gameState.bestCombo,
    gameState.score,
    gameState.gemsCollected,
    gameState.bountiesHit,
    gameState.shipCollected,
  ]);

  useEffect(() => {
    const nextLevel = getLevelFromScore(gameState.score);
    if (nextLevel !== gameState.level || (nextLevel >= MAX_LEVEL && !gameState.vipUnlocked)) {
      setGameState(prev => ({
        ...prev,
        level: nextLevel,
        vipUnlocked: prev.vipUnlocked || nextLevel >= MAX_LEVEL,
      }));
    }
  }, [gameState.score, gameState.level, gameState.vipUnlocked]);

  const missions = useMemo(() => (
    [
      { id: "explode-3", label: "Explode 3", progress: Math.min(3, gameState.explosions), target: 3 },
      { id: "burn-2", label: "Burn 2", progress: Math.min(2, gameState.burnedCoins.length), target: 2 },
      { id: "drag-5", label: "Drag 5", progress: Math.min(5, gameState.draggedCoins.length), target: 5 },
      { id: "collect-3", label: "Collect 3 Shards", progress: Math.min(3, gameState.gemsCollected), target: 3 },
      { id: "bounty-2", label: "Bounty Hits 2", progress: Math.min(2, gameState.bountiesHit), target: 2 },
      { id: "ship-3", label: "Ship Collect 3", progress: Math.min(3, gameState.shipCollected), target: 3 },
    ]
  ), [
    gameState.explosions,
    gameState.burnedCoins.length,
    gameState.draggedCoins.length,
    gameState.gemsCollected,
    gameState.bountiesHit,
    gameState.shipCollected,
  ]);

  const registerInteraction = useCallback((type: InteractionType) => {
    const now = Date.now();
    const delta = now - lastInteractionRef.current;
    const nextCombo = delta < 1600 ? Math.min(comboRef.current + 1, 10) : 1;
    comboRef.current = nextCombo;
    lastInteractionRef.current = now;

    setGameState(prev => ({
      ...prev,
      combo: nextCombo,
      bestCombo: Math.max(prev.bestCombo, nextCombo),
      lastInteractionAt: now,
    }));

    setInteractionNotice({ id: ++interactionId.current, type });
  }, []);

  const handleScoreUpdate = useCallback((points: number) => {
    const multiplier = comboRef.current || 1;
    const bonus = Math.round(points * multiplier);
    setGameState(prev => ({ ...prev, score: prev.score + bonus }));
  }, []);

  const handleExplosion = useCallback((name: string, position: THREE.Vector3) => {
    registerInteraction("explode");
    setGameState(prev => ({ 
      ...prev, 
      explosions: prev.explosions + 1,
    }));
  }, [registerInteraction]);

  const handleBurn = useCallback((name: string) => {
    registerInteraction("burn");
    setGameState(prev => ({ 
      ...prev, 
      burnedCoins: [...prev.burnedCoins, name],
    }));
  }, [registerInteraction]);

  const handleDrag = useCallback((name: string) => {
    registerInteraction("drag");
    setGameState(prev => {
      if (prev.draggedCoins.includes(name)) return prev;
      return { ...prev, draggedCoins: [...prev.draggedCoins, name] };
    });
  }, [registerInteraction]);

  const handleBonusCollect = useCallback((points: number) => {
    registerInteraction("bonus");
    handleScoreUpdate(points);
    setGameState(prev => ({ ...prev, gemsCollected: prev.gemsCollected + 1 }));
  }, [handleScoreUpdate, registerInteraction]);

  const handleShipCollect = useCallback((name: string, points: number) => {
    registerInteraction("collect");
    handleScoreUpdate(points);
    setGameState(prev => ({
      ...prev,
      shipCollected: prev.shipCollected + 1,
    }));
  }, [handleScoreUpdate, registerInteraction]);

  const handleTargetComplete = useCallback((name: string, bonus: number) => {
    registerInteraction("bonus");
    handleScoreUpdate(bonus);
    setGameState(prev => ({
      ...prev,
      bountiesHit: prev.bountiesHit + 1,
    }));
  }, [handleScoreUpdate, registerInteraction]);

  const handleTargetChange = useCallback((name: string | null) => {
    setGameState(prev => ({ ...prev, targetCoin: name }));
  }, []);

  const handleReset = useCallback(() => {
    setGameState({
      score: 0,
      explosions: 0,
      burnedCoins: [],
      draggedCoins: [],
      achievements: [],
      lastAchievement: null,
      combo: 1,
      bestCombo: 1,
      lastInteractionAt: null,
      targetCoin: null,
      gemsCollected: 0,
      bountiesHit: 0,
      shipCollected: 0,
      level: 1,
      vipUnlocked: false,
    });
    // Force remount of scene
    window.location.reload();
  }, []);

  return (
    <section 
      className="relative w-full bg-black overflow-hidden flex items-start md:items-center justify-center py-8 md:py-16" 
      style={{ 
        minHeight: "100vh",
        backgroundColor: "#000000",
      }}
    >
      {/* iPhone-sized container for desktop, full width on mobile */}
      <div 
        className="relative mx-auto bg-black touch-none"
        style={{
          /* iPhone 15 Pro Max dimensions: 430 x 932 */
          width: "min(90vw, 430px)",
          aspectRatio: "430 / 932",
          height: "auto",
          maxHeight: "85vh",
          maxWidth: "430px",
          backgroundColor: "#000000",
          borderRadius: "55px",
          border: "12px solid #2a2a2a",
          boxShadow: `
            0 0 60px rgba(0, 102, 255, 0.3), 
            0 25px 50px -12px rgba(0, 0, 0, 0.8), 
            inset 0 0 0 3px #4a4a4a,
            inset 0 0 0 4px #1a1a1a,
            0 0 0 1px #555
          `,
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* Stainless Steel Frame Highlight */}
        <div 
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            borderRadius: "43px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
          }}
        />

        {/* Left Side Buttons - Volume Up */}
        <div 
          className="absolute hidden md:block"
          style={{
            left: "-14px",
            top: "180px",
            width: "4px",
            height: "35px",
            backgroundColor: "#3a3a3a",
            borderRadius: "2px 0 0 2px",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1), -1px 0 2px rgba(0,0,0,0.5)",
            background: "linear-gradient(to right, #2a2a2a, #4a4a4a, #3a3a3a)",
            pointerEvents: "none",
          }}
        />
        
        {/* Left Side Buttons - Volume Down */}
        <div 
          className="absolute hidden md:block"
          style={{
            left: "-14px",
            top: "230px",
            width: "4px",
            height: "35px",
            backgroundColor: "#3a3a3a",
            borderRadius: "2px 0 0 2px",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1), -1px 0 2px rgba(0,0,0,0.5)",
            background: "linear-gradient(to right, #2a2a2a, #4a4a4a, #3a3a3a)",
            pointerEvents: "none",
          }}
        />

        {/* Left Side - Mute/Action Button */}
        <div 
          className="absolute hidden md:block"
          style={{
            left: "-14px",
            top: "130px",
            width: "4px",
            height: "22px",
            backgroundColor: "#3a3a3a",
            borderRadius: "2px 0 0 2px",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1), -1px 0 2px rgba(0,0,0,0.5)",
            background: "linear-gradient(to right, #2a2a2a, #4a4a4a, #3a3a3a)",
            pointerEvents: "none",
          }}
        />

        {/* Right Side - Power Button */}
        <div 
          className="absolute hidden md:block"
          style={{
            right: "-14px",
            top: "200px",
            width: "4px",
            height: "65px",
            backgroundColor: "#3a3a3a",
            borderRadius: "0 2px 2px 0",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.1), 1px 0 2px rgba(0,0,0,0.5)",
            background: "linear-gradient(to left, #2a2a2a, #4a4a4a, #3a3a3a)",
            pointerEvents: "none",
          }}
        />

        {/* Dynamic Island with Camera & Sensors */}
        <div 
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 hidden md:flex items-center justify-center gap-2"
          style={{
            width: "126px",
            height: "37px",
            backgroundColor: "#000",
            borderRadius: "20px",
            border: "1px solid #1a1a1a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        >
          {/* Front Camera */}
          <div 
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#0a0a0a",
              border: "2px solid #1a1a1a",
              boxShadow: "inset 0 0 4px rgba(0,102,255,0.3), 0 0 2px rgba(0,0,0,0.8)",
              position: "relative",
            }}
          >
            {/* Camera lens reflection */}
            <div style={{
              position: "absolute",
              top: "2px",
              left: "2px",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              backgroundColor: "rgba(0,150,255,0.4)",
            }} />
          </div>
          
          {/* Face ID Sensors (IR camera, dot projector) */}
          <div className="flex items-center gap-1.5">
            {/* IR Camera */}
            <div 
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#1a1a1a",
                boxShadow: "inset 0 0 2px rgba(100,0,150,0.3)",
              }}
            />
            {/* Proximity sensor */}
            <div 
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#0f0f0f",
              }}
            />
            {/* Flood illuminator */}
            <div 
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#1a1a1a",
                boxShadow: "inset 0 0 2px rgba(100,0,150,0.3)",
              }}
            />
          </div>
        </div>
        
      {/* Header - positioned below dynamic island */}
      <div 
        className="absolute text-center"
        style={{
          top: "8px",
          left: "12px",
          right: "12px",
          paddingTop: "36px",
          zIndex: 99999999999,
        }}
      >
        <h2 className="text-lg font-black text-white mb-0.5 drop-shadow-2xl">
          🎮{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">CRYPTO</span>
          {" "}Chaos
        </h2>
      </div>

      {/* Game UI */}
      <GameUI 
        score={gameState.score}
        explosions={gameState.explosions}
        burnedCoins={gameState.burnedCoins}
        combo={gameState.combo}
        bestCombo={gameState.bestCombo}
        targetCoin={gameState.targetCoin}
        gemsCollected={gameState.gemsCollected}
        bountiesHit={gameState.bountiesHit}
        shipCollected={gameState.shipCollected}
        level={gameState.level}
        vipUnlocked={gameState.vipUnlocked}
        missions={missions}
        achievements={gameState.achievements}
        lastAchievement={gameState.lastAchievement}
        onReset={handleReset}
      />

      {/* 3D Canvas */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 15, 25], fov: 45 }}
          frameloop="always"
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
          }}
          shadows
          dpr={deviceDpr}
          style={{ 
            background: "#000000", 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%",
            touchAction: "none",
            borderRadius: "43px",
          }}
        >
          <color attach="background" args={["#000000"]} />
          <GameScene 
            onScoreUpdate={handleScoreUpdate}
            onExplosion={handleExplosion}
            onBurn={handleBurn}
            onDrag={handleDrag}
            onBonusCollect={handleBonusCollect}
            onTargetComplete={handleTargetComplete}
            onTargetChange={handleTargetChange}
            onShipCollect={handleShipCollect}
            interactionNotice={interactionNotice}
            isTouchDevice={isTouchDevice}
          />
        </Canvas>
      </Suspense>

      {/* Bottom stats panel - fits iPhone home indicator area */}
      <div 
        className="absolute"
        style={{
          bottom: "12px",
          left: "12px",
          right: "12px",
          zIndex: 99999999999,
        }}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-blue-500/30 rounded-xl p-1.5">
          <div className="grid grid-cols-4 gap-1 text-center">
            <div>
              <div className="text-xs font-bold text-blue-400">{CRYPTO_COINS.length - gameState.explosions - gameState.burnedCoins.length}</div>
              <div className="text-[6px] text-blue-300/70">Left</div>
            </div>
            <div>
              <div className="text-xs font-bold text-orange-400">{gameState.explosions}</div>
              <div className="text-[6px] text-blue-300/70">Exploded</div>
            </div>
            <div>
              <div className="text-xs font-bold text-red-400">{gameState.burnedCoins.length}</div>
              <div className="text-[6px] text-blue-300/70">Burned</div>
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-400">{gameState.gemsCollected}</div>
              <div className="text-[6px] text-blue-300/70">Shards</div>
            </div>
          </div>
        </div>
        {/* iPhone home indicator */}
        <div className="mt-2 mx-auto w-20 h-1 bg-white/30 rounded-full" />
      </div>
      </div>
      
      {/* Desktop instruction below phone */}
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="text-center text-blue-300/50 text-xs">
          ↑ Interactive 3D Game • Scroll down to continue ↓
        </div>
      </div>
    </section>
  );
}
