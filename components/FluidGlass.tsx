import * as THREE from 'three';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, useFBO } from '@react-three/drei';
import { easing } from 'maath';

interface FluidGlassProps {
  scale?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  distortion?: number;
}

// Global mouse position store
const mouseStore = { x: 0, y: 0 };

export default function FluidGlass({
  scale = 0.12,
  ior = 2.0,
  thickness = 0.5,
  chromaticAberration = 0.5,
  distortion = 0.5,
}: FluidGlassProps) {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 range
      mouseStore.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseStore.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 15 }}
      gl={{ alpha: true }}
      style={{ 
        background: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Scene
        scale={scale}
        ior={ior}
        thickness={thickness}
        chromaticAberration={chromaticAberration}
        distortion={distortion}
      />
    </Canvas>
  );
}

interface SceneProps {
  scale: number;
  ior: number;
  thickness: number;
  chromaticAberration: number;
  distortion: number;
}

function Scene({ scale, ior, thickness, chromaticAberration, distortion }: SceneProps) {
  const { viewport, gl, camera } = useThree();
  
  // Create an off-screen scene with background content to refract
  const [backgroundScene] = useState(() => new THREE.Scene());
  const backgroundFBO = useFBO(1024, 1024);
  
  // Create background content for refraction (colorful grid/pattern)
  const backgroundMesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50);
    
    // Create a procedural gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create colorful gradient pattern
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.25, '#16213e');
    gradient.addColorStop(0.5, '#0f3460');
    gradient.addColorStop(0.75, '#1a1a2e');
    gradient.addColorStop(1, '#0d0d0d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some visual elements
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    // Add some glowing spots
    const spots = [
      { x: 128, y: 128, r: 60, color: 'rgba(82, 39, 255, 0.3)' },
      { x: 384, y: 128, r: 50, color: 'rgba(0, 255, 255, 0.2)' },
      { x: 256, y: 384, r: 70, color: 'rgba(255, 0, 255, 0.2)' },
      { x: 400, y: 350, r: 40, color: 'rgba(255, 255, 255, 0.15)' },
    ];
    spots.forEach(spot => {
      const radGrad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
      radGrad.addColorStop(0, spot.color);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    
    const mat = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.8,
    });
    
    return new THREE.Mesh(geo, mat);
  }, []);
  
  useEffect(() => {
    backgroundMesh.position.z = -5;
    backgroundScene.add(backgroundMesh);
    return () => {
      backgroundScene.remove(backgroundMesh);
    };
  }, [backgroundScene, backgroundMesh]);
  
  // Animate background
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    backgroundMesh.rotation.z = time * 0.02;
    
    // Render background to FBO
    gl.setRenderTarget(backgroundFBO);
    gl.render(backgroundScene, camera);
    gl.setRenderTarget(null);
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#5227ff" />
      <pointLight position={[10, -10, 5]} intensity={0.5} color="#ff00ff" />
      <spotLight position={[0, 10, 10]} angle={0.3} penumbra={1} intensity={0.8} color="#ffffff" />
      <Environment preset="night" background={false} />
      
      <Bubble
        scale={scale}
        ior={ior}
        thickness={thickness}
        chromaticAberration={chromaticAberration}
        distortion={distortion}
        backgroundTexture={backgroundFBO.texture}
      />
    </>
  );
}

const bubbleGeometry = new THREE.SphereGeometry(1, 64, 64);

interface BubbleProps {
  scale: number;
  ior: number;
  thickness: number;
  chromaticAberration: number;
  distortion: number;
  backgroundTexture: THREE.Texture;
}

function Bubble({ scale, ior, thickness, chromaticAberration, distortion, backgroundTexture }: BubbleProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<any>(null!);
  const { viewport } = useThree();

  useFrame((state, delta) => {
    const { camera, clock } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    const time = clock.getElapsedTime();

    // Use global mouse store instead of Canvas pointer
    const destX = (mouseStore.x * v.width) / 2;
    const destY = (mouseStore.y * v.height) / 2;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);
    
    // Subtle wobble/breathing animation
    ref.current.scale.setScalar(scale * (1 + Math.sin(time * 2) * 0.03));
    
    // Rotate slightly for dynamic light refraction
    ref.current.rotation.x = Math.sin(time * 0.5) * 0.1;
    ref.current.rotation.y = Math.cos(time * 0.3) * 0.1;
    
    // Animate distortion for shimmering effect
    if (materialRef.current) {
      materialRef.current.distortion = distortion + Math.sin(time * 3) * 0.1;
      materialRef.current.chromaticAberration = chromaticAberration + Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <mesh ref={ref} scale={scale} geometry={bubbleGeometry}>
      <MeshTransmissionMaterial
        ref={materialRef}
        buffer={backgroundTexture}
        ior={1.3}
        thickness={0.15}
        chromaticAberration={0.2}
        transmission={1}
        roughness={0}
        color="#0057ff"
        distortion={0.15}
        distortionScale={0.3}
        temporalDistortion={0.15}
        anisotropy={0.1}
        backside
        backsideThickness={0.1}
        samples={12}
        resolution={512}
        clearcoat={0.8}
        clearcoatRoughness={0}
        attenuationDistance={2}
        attenuationColor="#0a3dff"
        envMapIntensity={1.5}
        reflectivity={0.6}
        metalness={0}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}
