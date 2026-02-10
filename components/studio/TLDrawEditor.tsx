"use client";

import { useEffect, useRef, useState } from 'react';

interface TLDrawEditorProps {
  onExport?: () => void;
}

export default function TLDrawEditor({ onExport }: TLDrawEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tldrawReady, setTldrawReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTLDraw = async () => {
      try {
        await import('tldraw');
        if (!mounted) return;

        setTldrawReady(true);

      } catch (err) {
        console.error("Failed to load TLDraw:", err);
        setError(err instanceof Error ? err.message : "Failed to load TLDraw");
      }
    };

    loadTLDraw();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>TLDraw Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install TLDraw: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install tldraw</code>
          </p>
          <p style={{ marginTop: '16px' }}>
            Or visit <a href="https://tldraw.com" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff' }}>tldraw.com</a> for the online version.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tldraw-editor-wrapper">
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%',
          height: '800px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          background: '#ffffff'
        }} 
      >
        {tldrawReady && (
          <div style={{ width: '100%', height: '100%' }}>
            <iframe 
              src="https://tldraw.com"
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                borderRadius: '12px'
              }}
              title="TLDraw Whiteboard"
            />
          </div>
        )}
      </div>
      
      {tldrawReady && (
        <div className="tldraw-actions" style={{
          marginTop: '24px'
        }}>
          <div className="studio-info-box">
            <p><strong>✏️ TLDraw Infinite Canvas</strong></p>
            <p style={{ marginTop: '8px', opacity: 0.8 }}>
              Use the embedded TLDraw canvas above for drawing, diagramming, and whiteboarding. Features infinite canvas, collaborative editing, and shape recognition.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a 
                href="https://tldraw.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="studio-btn studio-btn-primary"
              >
                Open in New Tab
              </a>
              <a 
                href="https://github.com/tldraw/tldraw" 
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

      {!tldrawReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading TLDraw...</div>
        </div>
      )}
    </div>
  );
}
