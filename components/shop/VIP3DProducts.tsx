"use client";

 
import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Preload } from "@react-three/drei";
import * as THREE from "three";

// Blue color palette
const BLUE_COLORS = {
  primary: "#0066FF",
  secondary: "#00AAFF", 
  accent: "#00D4FF",
  light: "#66D9FF",
  dark: "#0044AA",
  glow: "#0088FF",
};

// Crypto coin data with blue theme
const CRYPTO_COINS = [
  { name: "BTC", color: "#0066FF", size: 0.5, orbitRadius: 3.5, orbitSpeed: 2.5, rotationSpeed: 0.02 },
  { name: "ETH", color: "#00AAFF", size: 0.45, orbitRadius: 5, orbitSpeed: 1.8, rotationSpeed: 0.025 },
  { name: "SOL", color: "#00D4FF", size: 0.35, orbitRadius: 6.5, orbitSpeed: 1.5, rotationSpeed: 0.03 },
  { name: "XRP", color: "#3399FF", size: 0.3, orbitRadius: 8, orbitSpeed: 1.2, rotationSpeed: 0.022 },
  { name: "BNB", color: "#0055DD", size: 0.4, orbitRadius: 10, orbitSpeed: 0.9, rotationSpeed: 0.028 },
  { name: "ADA", color: "#0077EE", size: 0.35, orbitRadius: 12, orbitSpeed: 0.7, rotationSpeed: 0.02, hasRings: true },
  { name: "DOGE", color: "#66B2FF", size: 0.32, orbitRadius: 14.5, orbitSpeed: 0.5, rotationSpeed: 0.035 },
  { name: "USDT", color: "#0099CC", size: 0.28, orbitRadius: 17, orbitSpeed: 0.35, rotationSpeed: 0.018 },
];

// BULLMONEY Sun component - blue theme with simple geometry
function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.003;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group>
      {/* Sun core - blue */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshBasicMaterial color={BLUE_COLORS.primary} />
      </mesh>
      {/* Inner glow */}
      <mesh scale={1.15}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color={BLUE_COLORS.secondary} transparent opacity={0.4} />
      </mesh>
      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.35}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color={BLUE_COLORS.accent} transparent opacity={0.2} />
      </mesh>
      {/* Decorative ring around sun */}
      <mesh ref={ringRef} rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.5, 0.05, 16, 64]} />
        <meshBasicMaterial color={BLUE_COLORS.light} transparent opacity={0.6} />
      </mesh>
      {/* Second ring */}
      <mesh rotation-x={Math.PI / 3}>
        <torusGeometry args={[2.8, 0.03, 16, 64]} />
        <meshBasicMaterial color={BLUE_COLORS.accent} transparent opacity={0.4} />
      </mesh>
      {/* BULLMONEY label - HTML overlay */}
      <Html center position={[0, 0, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ 
          fontSize: "18px", 
          fontWeight: "bold",
          color: "#ffffff",
          textShadow: "0 0 20px #0066FF, 0 0 40px #00AAFF",
          letterSpacing: "2px"
        }}>
          BULL
          <br />
          <span style={{ color: BLUE_COLORS.accent }}>MONEY</span>
        </div>
      </Html>
      {/* Point lights */}
      <pointLight color={BLUE_COLORS.primary} intensity={3} distance={60} decay={0.5} />
      <pointLight color="#ffffff" intensity={1.5} distance={100} decay={0.2} />
    </group>
  );
}

// Orbit path visualization
function OrbitPath({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color: BLUE_COLORS.accent, transparent: true, opacity: 0.2 });
  }, []);

  return <primitive object={new THREE.Line(geometry, material)} />;
}

// Individual crypto coin component
function CryptoCoin({
  name,
  color,
  size,
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  hasRings = false,
  timeScale = 1,
}: {
  name: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  hasRings?: boolean;
  timeScale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Mesh>(null);
  const orbitAngle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    orbitAngle.current += delta * orbitSpeed * 0.3 * timeScale;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(orbitAngle.current) * orbitRadius;
      groupRef.current.position.z = Math.sin(orbitAngle.current) * orbitRadius;
    }
    if (coinRef.current) {
      coinRef.current.rotation.y += rotationSpeed * timeScale;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Coin body - sphere */}
      <mesh ref={coinRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Coin glow */}
      <mesh scale={1.2}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      {hasRings && <CoinRings color={color} size={size} />}
      {/* Coin label */}
      <Html
        position={[0, size + 0.3, 0]}
        center
        style={{
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
          textShadow: `0 0 10px ${color}`,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          background: "rgba(0,20,40,0.7)",
          padding: "3px 8px",
          borderRadius: "6px",
          border: `1px solid ${color}`,
        }}
      >
        {name}
      </Html>
    </group>
  );
}

// Coin rings
function CoinRings({ color, size }: { color: string; size: number }) {
  return (
    <mesh rotation-x={Math.PI / 2.5}>
      <ringGeometry args={[size * 1.3, size * 1.8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Particle belt - blue themed
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

// Camera controller
function CameraController() {
  const { camera } = useThree();

  useFrame((state) => {
    camera.position.y = 8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
  });

  return null;
}

// Main scene component
function SolarSystemScene({ timeScale = 1 }: { timeScale?: number }) {
  return (
    <>
      {/* Stronger ambient light for visibility */}
      <ambientLight intensity={0.5} />
      {/* Additional directional light */}
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#0066FF" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sun />
      {CRYPTO_COINS.map((coin) => (
        <OrbitPath key={`orbit-${coin.name}`} radius={coin.orbitRadius} />
      ))}
      {CRYPTO_COINS.map((coin) => (
        <CryptoCoin key={coin.name} {...coin} timeScale={timeScale} />
      ))}
      <ParticleBelt />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 6}
      />
      <CameraController />
      <Preload all />
    </>
  );
}

// Loading fallback - no emojis
function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-400 text-lg font-bold">Loading BULLMONEY Universe...</p>
      </div>
    </div>
  );
}

// Main export component
export default function SolarSystem3D() {
  return (
    <section 
      className="relative w-full overflow-hidden flex items-center justify-center" 
      style={{ 
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "#000000",
      }}
    >
      {/* iPad-sized container for desktop, full screen on mobile */}
      <div 
        className="relative w-full max-w-[1024px] mx-auto rounded-none md:rounded-3xl overflow-hidden"
        style={{
          height: "100%",
          minHeight: "100vh",
          backgroundColor: "#000000",
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 text-center pt-6 md:pt-8 px-4">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-2xl">
          The{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">BULLMONEY</span>
          {" "}Crypto Universe
        </h2>
        <p className="text-xs md:text-sm text-blue-200 max-w-xl mx-auto">
          Explore our crypto galaxy. Drag to orbit, scroll to zoom.
        </p>
      </div>

      {/* 3D Canvas */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 12, 20], fov: 50 }}
          frameloop="always"
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
          }}
          dpr={[1, 1.5]}
          style={{ background: "#000000", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <SolarSystemScene timeScale={1} />
        </Canvas>
      </Suspense>

      {/* Bottom info panel - blue theme */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          <div className="backdrop-blur-xl bg-black/70 border border-blue-500/30 rounded-2xl p-3 md:p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xl md:text-2xl font-bold text-blue-400">8</div>
                <div className="text-[10px] md:text-xs text-blue-300/70">Crypto Coins</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-cyan-400">
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.75L6 16V8l6-3.5z"/>
                  </svg>
                </div>
                <div className="text-[10px] md:text-xs text-blue-300/70">BULLMONEY</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-blue-300">120+</div>
                <div className="text-[10px] md:text-xs text-blue-300/70">Opportunities</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-cyan-300">
                  <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="text-[10px] md:text-xs text-blue-300/70">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:block">
        <div className="backdrop-blur-md bg-black/50 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-300/70">
          Drag to orbit | Scroll to zoom
        </div>
      </div>
      </div>
    </section>
  );
}