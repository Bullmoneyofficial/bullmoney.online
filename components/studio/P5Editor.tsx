"use client";

import { useEffect, useRef, useState } from 'react';

interface P5EditorProps {
  onExport?: () => void;
}

export default function P5Editor({ onExport }: P5EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [p5Ready, setP5Ready] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const p5InstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadP5 = async () => {
      try {
        const p5Module = await import('p5');
        const p5 = p5Module.default;
        if (!mounted || !containerRef.current) return;

        const sketch = (p: any) => {
          p.setup = () => {
            p.createCanvas(1200, 800);
            p.background(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(58);
            p.textStyle(p.BOLD);
            p.fill(29, 29, 31);
            p.text('P5.js Creative Editor', 600, 350);
            
            p.textSize(24);
            p.fill(29, 29, 31, 150);
            p.text('Creative Coding Library', 600, 420);

            // Draw sample shapes
            p.fill(0, 122, 255, 200);
            p.circle(400, 550, 100);
            
            p.fill(52, 199, 89, 200);
            p.rect(500, 500, 100, 100, 10);
            
            p.fill(255, 149, 0, 200);
            p.push();
            p.translate(700, 550);
            p.rotate(p.PI / 5);
            p.beginShape();
            for (let i = 0; i < 5; i++) {
              const angle = p.TWO_PI * i / 5 - p.PI / 2;
              const x = 50 * p.cos(angle);
              const y = 50 * p.sin(angle);
              p.vertex(x, y);
              const angle2 = p.TWO_PI * (i + 0.5) / 5 - p.PI / 2;
              const x2 = 30 * p.cos(angle2);
              const y2 = 30 * p.sin(angle2);
              p.vertex(x2, y2);
            }
            p.endShape(p.CLOSE);
            p.pop();
          };

          p.draw = () => {
            // Optional: Add interactive drawing
          };

          p.mouseDragged = () => {
            if (p.mouseButton === p.LEFT) {
              p.fill(0, 122, 255, 150);
              p.noStroke();
              p.circle(p.mouseX, p.mouseY, 20);
            }
          };
        };

        const instance = new p5(sketch, containerRef.current);
        p5InstanceRef.current = instance;
        setP5Ready(true);

      } catch (err) {
        console.error("Failed to load P5.js:", err);
        setError(err instanceof Error ? err.message : "Failed to load P5.js");
      }
    };

    loadP5();

    return () => {
      mounted = false;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, []);

  const clearCanvas = () => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.background(255);
    }
  };

  const handleExport = () => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.saveCanvas(`p5-design-${Date.now()}`, 'png');
      if (onExport) onExport();
    }
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>P5.js Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install P5.js: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install p5</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p5-editor-wrapper">
      <div 
        ref={containerRef} 
        style={{ 
          maxWidth: '100%', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }} 
      />
      
      {p5Ready && (
        <div className="p5-actions" style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button className="studio-btn" onClick={clearCanvas}>
            Clear Canvas
          </button>
          <button className="studio-btn studio-btn-primary" onClick={handleExport}>
            Export PNG
          </button>
          <a 
            href="https://p5js.org/reference/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            P5.js Reference
          </a>
        </div>
      )}

      {!p5Ready && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading P5.js...</div>
        </div>
      )}

      <div className="studio-info-box" style={{ marginTop: '24px' }}>
        <p><strong>💡 Interactive Drawing</strong></p>
        <p style={{ marginTop: '8px', opacity: 0.8 }}>
          Click and drag to draw on the canvas. P5.js is perfect for creative coding, generative art, and interactive visualizations.
        </p>
      </div>
    </div>
  );
}
