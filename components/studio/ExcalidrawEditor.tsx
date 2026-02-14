"use client";

import { useEffect, useRef, useState } from 'react';

interface ExcalidrawEditorProps {
  onExport?: () => void;
}

export default function ExcalidrawEditor({ onExport }: ExcalidrawEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [excalidrawReady, setExcalidrawReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadExcalidraw = async () => {
      try {
        await import('@excalidraw/excalidraw');
        if (!mounted) return;

        setExcalidrawReady(true);

      } catch (err) {
        console.error("Failed to load Excalidraw:", err);
        setError(err instanceof Error ? err.message : "Failed to load Excalidraw");
      }
    };

    loadExcalidraw();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>Excalidraw Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install Excalidraw: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install @excalidraw/excalidraw</code>
          </p>
          <p style={{ marginTop: '16px' }}>
            Or visit <a href="https://excalidraw.com" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff' }}>excalidraw.com</a> for the online version.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="excalidraw-editor-wrapper">
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%',
          // On mobile, let the canvas stretch to (almost) full viewport height.
          // On larger screens, keep a comfortable fixed height.
          height: 'min(100dvh, 800px)',
          maxHeight: '100dvh',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          background: '#ffffff'
        }} 
      >
        {excalidrawReady && (
          <div style={{ width: '100%', height: '100%' }}>
            <iframe 
              src="https://excalidraw.com"
              className="excalidraw-embed"
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                borderRadius: '12px'
              }}
              title="Excalidraw Whiteboard"
            />
          </div>
        )}
      </div>
      
      {excalidrawReady && (
        <div className="excalidraw-actions" style={{
          marginTop: '24px'
        }}>
          <div className="studio-info-box">
            <p><strong>🎨 Excalidraw Collaborative Whiteboard</strong></p>
            <p style={{ marginTop: '8px', opacity: 0.8 }}>
              Use the embedded Excalidraw canvas above for sketching, diagramming, and collaborative whiteboarding. All features are free and open source.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a 
                href="https://excalidraw.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="studio-btn studio-btn-primary"
              >
                Open in New Tab
              </a>
              <a 
                href="https://github.com/excalidraw/excalidraw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="studio-btn studio-btn-ghost"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}

      {!excalidrawReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading Excalidraw...</div>
        </div>
      )}
    </div>
  );
}
