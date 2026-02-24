import React from 'react';

export const ColorPickerPanel = ({
  isOpen,
  onClose,
  colorMode,
  customColor,
  onColorModeChange,
  onCustomColorChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  colorMode: 'color' | 'grayscale' | 'custom';
  customColor: { h: number; s: number; l: number; a: number };
  onColorModeChange: (mode: 'color' | 'grayscale' | 'custom') => void;
  onCustomColorChange: (color: { h: number; s: number; l: number; a: number }) => void;
}) => {
  if (!isOpen) return null;

  // Preset colors for quick selection
  const presetColors = [
    { name: 'Blue', h: 210, s: 80, l: 50 },
    { name: 'Purple', h: 270, s: 80, l: 50 },
    { name: 'Pink', h: 330, s: 80, l: 60 },
    { name: 'Red', h: 0, s: 80, l: 50 },
    { name: 'Orange', h: 30, s: 80, l: 50 },
    { name: 'Yellow', h: 60, s: 80, l: 50 },
    { name: 'Green', h: 120, s: 80, l: 40 },
    { name: 'Cyan', h: 180, s: 80, l: 50 },
  ];

  const handlePresetClick = (preset: { h: number; s: number; l: number }) => {
    onCustomColorChange({ ...preset, a: customColor.a });
    onColorModeChange('custom');
  };

  return (
    <div className="bg-selector-panel" style={{ top: '140px', maxWidth: '400px' }}>
      <div className="bg-selector-header">
        <div>
          <h3 className="bg-selector-title">Color Overlay</h3>
          <p className="bg-selector-subtitle">Apply custom colors to all backgrounds</p>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {/* Mode Selection */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => onColorModeChange('color')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: colorMode === 'color' ? '2px solid #1956B4' : '1px solid rgba(255,255,255,0.2)',
              background: colorMode === 'color' ? 'rgba(25, 86, 180, 0.3)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: colorMode === 'color' ? 'bold' : 'normal',
            }}
          >
            Full Color
          </button>
          <button
            onClick={() => onColorModeChange('grayscale')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: colorMode === 'grayscale' ? '2px solid #1956B4' : '1px solid rgba(255,255,255,0.2)',
              background: colorMode === 'grayscale' ? 'rgba(25, 86, 180, 0.3)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: colorMode === 'grayscale' ? 'bold' : 'normal',
            }}
          >
            B&W
          </button>
          <button
            onClick={() => onColorModeChange('custom')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: colorMode === 'custom' ? '2px solid #1956B4' : '1px solid rgba(255,255,255,0.2)',
              background: colorMode === 'custom' ? 'rgba(25, 86, 180, 0.3)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: colorMode === 'custom' ? 'bold' : 'normal',
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Preset Colors */}
      {colorMode === 'custom' && (
        <>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Quick Presets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {presetColors.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    background: `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  title={preset.name}
                >
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '9px',
                      color: preset.l > 50 ? '#000' : '#fff',
                      fontWeight: 'bold',
                      textShadow: preset.l > 50 ? '0 0 2px white' : '0 0 2px black',
                    }}
                  >
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Sliders */}
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Hue: {Math.round(customColor.h)}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={customColor.h}
                onChange={e => onCustomColorChange({ ...customColor, h: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Saturation: {Math.round(customColor.s)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customColor.s}
                onChange={e => onCustomColorChange({ ...customColor, s: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Lightness: {Math.round(customColor.l)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customColor.l}
                onChange={e => onCustomColorChange({ ...customColor, l: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Opacity: {Math.round(customColor.a * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customColor.a * 100}
                onChange={e => onCustomColorChange({ ...customColor, a: parseInt(e.target.value) / 100 })}
                style={{ width: '100%' }}
              />
            </div>

            {/* Color Preview */}
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                borderRadius: '8px',
                background: `hsla(${customColor.h}, ${customColor.s}%, ${customColor.l}%, ${customColor.a})`,
                border: '2px solid rgba(255,255,255,0.2)',
                textAlign: 'center',
                color: customColor.l > 50 ? '#000' : '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Preview
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="bg-selector-footer">
        <button className="bg-footer-btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};
