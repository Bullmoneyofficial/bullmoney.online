"use client";

import { useEffect, useRef, useState } from "react";

interface ThreeEditorProps {
  onExport?: () => void;
}

export default function ThreeEditor({ onExport }: ThreeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeReady, setThreeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const threeRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const objectsRef = useRef<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadThree = async () => {
      try {
        const THREE = await import("three");
        if (!mounted || !containerRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);

        const camera = new THREE.PerspectiveCamera(50, 1200 / 800, 0.1, 1000);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(1200, 800);
        renderer.setPixelRatio(window.devicePixelRatio || 1);

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(3, 4, 5);
        scene.add(ambient, directional);

        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.6, 1.6),
          new THREE.MeshStandardMaterial({ color: 0x007aff, metalness: 0.2, roughness: 0.4 })
        );
        cube.position.set(-2, 0, 0);

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0x34c759, metalness: 0.2, roughness: 0.4 })
        );
        sphere.position.set(2, 0, 0);

        scene.add(cube, sphere);
        objectsRef.current = [cube, sphere];

        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);
          cube.rotation.y += 0.006;
          cube.rotation.x += 0.004;
          sphere.rotation.y -= 0.004;
          renderer.render(scene, camera);
        };

        animate();

        threeRef.current = THREE;
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        setThreeReady(true);
      } catch (err) {
        console.error("Failed to load Three.js:", err);
        setError(err instanceof Error ? err.message : "Failed to load Three.js");
      }
    };

    loadThree();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  const addCube = () => {
    const THREE = threeRef.current;
    const scene = sceneRef.current;
    if (!THREE || !scene) return;

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.2,
        roughness: 0.4,
      })
    );
    cube.position.set(Math.random() * 4 - 2, Math.random() * 2 - 1, Math.random() * -2);
    scene.add(cube);
    objectsRef.current.push(cube);
  };

  const addSphere = () => {
    const THREE = threeRef.current;
    const scene = sceneRef.current;
    if (!THREE || !scene) return;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 32, 32),
      new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.2,
        roughness: 0.4,
      })
    );
    sphere.position.set(Math.random() * 4 - 2, Math.random() * 2 - 1, Math.random() * -2);
    scene.add(sphere);
    objectsRef.current.push(sphere);
  };

  const clearScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    objectsRef.current.forEach((object) => scene.remove(object));
    objectsRef.current = [];
  };

  const handleExport = () => {
    if (!rendererRef.current) return;

    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `three-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (onExport) onExport();
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: "600px" }}>
          <p><strong>Three.js Load Error</strong></p>
          <p style={{ marginTop: "8px" }}>{error}</p>
          <p style={{ marginTop: "16px", fontSize: "12px", opacity: 0.7 }}>
            Install Three.js: <code style={{ background: "rgba(0,0,0,0.1)", padding: "2px 6px", borderRadius: "4px" }}>npm install three</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="three-editor-wrapper">
      <div
        ref={containerRef}
        style={{
          maxWidth: "100%",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          background: "#ffffff",
        }}
      />

      {threeReady && (
        <div
          className="three-actions"
          style={{
            marginTop: "24px",
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="studio-btn" onClick={addCube}>
            + Cube
          </button>
          <button className="studio-btn" onClick={addSphere}>
            + Sphere
          </button>
          <button className="studio-btn" onClick={clearScene}>
            Clear
          </button>
          <button className="studio-btn studio-btn-primary" onClick={handleExport}>
            Export PNG
          </button>
          <a
            href="https://threejs.org/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            Three.js Docs
          </a>
        </div>
      )}

      {!threeReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: "200px" }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading Three.js...</div>
        </div>
      )}
    </div>
  );
}
