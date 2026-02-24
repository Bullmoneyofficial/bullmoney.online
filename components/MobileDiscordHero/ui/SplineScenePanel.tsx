'use client';

import React from 'react';
import { SPLINE_SCENES, SPLINE_SCENE_NAMES } from '../constants';
import { isSplineCached } from '../splineCache';

interface Props {
  open: boolean;
  onClose: () => void;
  currentSplineScene: string;
  downloadingScenes: Set<string>;
  cacheVersion: number;
  onSwitchScene: (sceneUrl: string) => void;
  onDownloadScene: (sceneUrl: string) => void;
  onDownloadAll: () => void;
  onClearCache: () => void;
}

const SplineScenePanel = ({
  open,
  onClose,
  currentSplineScene,
  downloadingScenes,
  cacheVersion,
  onSwitchScene,
  onDownloadScene,
  onDownloadAll,
  onClearCache,
}: Props) => {
  if (!open) return null;

  return (
    <div className="bg-selector-panel" style={{ top: '140px', zIndex: 2147483647 }}>
      <div className="bg-selector-header">
        <div>
          <h3 className="bg-selector-title">3D Spline Scenes</h3>
          <p className="bg-selector-subtitle">Hold 3D button to open • Click to switch</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div className="bg-selector-list">
        {SPLINE_SCENES.map((sceneUrl, index) => {
          const isActive = currentSplineScene === sceneUrl;
          const isDownloading = downloadingScenes.has(sceneUrl);
          const isCached = cacheVersion >= 0 && isSplineCached(sceneUrl);
          const isDefault = index === 0;

          return (
            <div key={sceneUrl} className={`bg-selector-item ${isActive ? 'active' : ''}`}>
              <div className="bg-item-toggle enabled" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {index + 1}
              </div>

              <div className="bg-item-info" onClick={() => (isCached || isDefault ? onSwitchScene(sceneUrl) : onDownloadScene(sceneUrl))}>
                <div className="bg-item-name">
                  {SPLINE_SCENE_NAMES[sceneUrl]}
                  {isDefault && <span style={{ marginLeft: 6, fontSize: '9px', opacity: 0.5 }}>DEFAULT</span>}
                  {!isDefault && isCached && <span style={{ marginLeft: 6, fontSize: '9px', opacity: 0.5 }}>CACHED</span>}
                </div>
              </div>

              {!isDefault && (
                <button
                  className="bg-item-fav"
                  onClick={(e) => { e.stopPropagation(); onDownloadScene(sceneUrl); }}
                  disabled={isDownloading || isCached}
                  title={isCached ? 'Scene cached in app' : 'Cache this scene to app'}
                  style={{
                    opacity: isDownloading ? 0.5 : isCached ? 0.3 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDownloading ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spline-dl-spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
                    </svg>
                  ) : isCached ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8m0 0L5 7m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}

              <button className="bg-item-select" onClick={() => onSwitchScene(sceneUrl)}>
                {isActive ? 'Active' : 'Select'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-selector-footer">
        <button className="bg-footer-btn" onClick={onDownloadAll} disabled={downloadingScenes.size > 0}>
          Cache All ({SPLINE_SCENES.length})
        </button>
        <button
          className="bg-footer-btn"
          onClick={onClearCache}
          disabled={downloadingScenes.size > 0}
          style={{ color: '#ff6b6b' }}
        >
          Clear Cache
        </button>
        <button className="bg-footer-btn primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SplineScenePanel;
