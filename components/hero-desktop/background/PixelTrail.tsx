import React, { useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { shaderMaterial, useTrailTexture } from '@react-three/drei';
import * as THREE from 'three';

const DotMaterial = shaderMaterial(
  { resolution: new THREE.Vector2(), mouseTrail: null, gridSize: 100, pixelColor: new THREE.Color('#ffffff') },
  `varying vec2 vUv; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  `uniform vec2 resolution; uniform sampler2D mouseTrail; uniform float gridSize; uniform vec3 pixelColor;
   vec2 coverUv(vec2 uv) { vec2 s = resolution.xy / max(resolution.x, resolution.y); vec2 newUv = (uv - 0.5) * s + 0.5; return clamp(newUv, 0.0, 1.0); }
   void main() {
     vec2 screenUv = gl_FragCoord.xy / resolution;
     vec2 uv = coverUv(screenUv);
     vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;
     float trail = texture2D(mouseTrail, gridUvCenter).r;
     gl_FragColor = vec4(pixelColor, trail);
   }`,
);

const Scene = ({ gridSize, trailSize, maxAge, interpolate, pixelColor }: any) => {
  const size = useThree(s => s.size);
  const viewport = useThree(s => s.viewport);
  const dotMaterial = useMemo(() => new (DotMaterial as any)(), []);
  dotMaterial.uniforms.pixelColor.value = new THREE.Color(pixelColor);

  const [trail, onMove] = useTrailTexture({
    size: 256,
    radius: trailSize,
    maxAge,
    interpolate,
    ease: (x: any) => x,
  }) as any;

  if (trail) {
    trail.minFilter = THREE.NearestFilter;
    trail.magFilter = THREE.NearestFilter;
  }
  const scale = Math.max(viewport.width, viewport.height) / 2;

  return (
    <mesh scale={[scale, scale, 1]} onPointerMove={onMove}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={dotMaterial}
        gridSize={gridSize}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        mouseTrail={trail}
      />
    </mesh>
  );
};

export const PixelTrail = ({
  gridSize = 30,
  trailSize = 0.1,
  maxAge = 400,
  interpolate = 5,
  color = '#ffffff',
  className = '',
}: any) => {
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }} style={{ pointerEvents: 'auto' }}>
        <Scene gridSize={gridSize} trailSize={trailSize} maxAge={maxAge} interpolate={interpolate} pixelColor={color} />
      </Canvas>
    </div>
  );
};
