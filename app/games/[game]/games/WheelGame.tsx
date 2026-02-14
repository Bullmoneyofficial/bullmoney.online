'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { showGameNotification } from './game-notifications';

function Wheel3DView({ rotationDeg, spinning, resultType }: { rotationDeg: number; spinning: boolean; resultType: 'win'|'lose'|null }) {
  const segments = useMemo(() => [
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','green',
  ] as const, []);
  return (
    <div className="wheel3d-stage">
      <div className="wheel3d-pointer" />
      <div className="wheel3d-center">
        <div className="roulette-timer" style={{fontSize:'14px',color: resultType === 'win' ? '#00e701' : resultType === 'lose' ? '#ed4245' : '#fbbf24'}}>
          {spinning ? '...' : resultType ? (resultType === 'win' ? 'WIN!' : 'MISS') : 'SPIN'}
        </div>
      </div>
      <Canvas camera={{ position: [0, 0, 9.5], fov: 34 }} dpr={[1, 2]}>
        <Wheel3DScene rotationDeg={rotationDeg} segments={segments} />
      </Canvas>
    </div>
  );
}

function createRouletteWheelTexture(segments: readonly ('black'|'yellow'|'red'|'green')[]) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.47;
  const inner = size * 0.19;
  const segAngle = (Math.PI * 2) / segments.length;
  const colorHex: Record<string, string> = { black: '#1a1a2e', yellow: '#f59e0b', red: '#ef4444', green: '#22c55e' };

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, outer + 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();

  segments.forEach((seg, i) => {
    const a0 = -Math.PI / 2 + i * segAngle;
    const a1 = a0 + segAngle;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * inner, cy + Math.sin(a0) * inner);
    ctx.arc(cx, cy, outer, a0, a1);
    ctx.lineTo(cx + Math.cos(a1) * inner, cy + Math.sin(a1) * inner);
    ctx.arc(cx, cy, inner, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = colorHex[seg];
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, inner - 8, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, outer + 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 6;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function Wheel3DScene({ rotationDeg, segments }: { rotationDeg: number; segments: readonly ('black'|'yellow'|'red'|'green')[] }) {
  const wheelTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createRouletteWheelTexture(segments);
  }, [segments]);

  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[4, 5, 6]} intensity={1.05} />
      <pointLight position={[0, 0, 3]} intensity={0.45} color="#fbbf24" />
      <group rotation={[0, 0, THREE.MathUtils.degToRad(rotationDeg)]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]}>
          <cylinderGeometry args={[3.05, 3.05, 0.52, 96]} />
          <meshStandardMaterial map={wheelTexture ?? undefined} color="#ffffff" metalness={0.18} roughness={0.54} />
        </mesh>
        <mesh>
          <torusGeometry args={[3.18, 0.16, 18, 80]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.78} roughness={0.2} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.35, 0.08, 18, 80]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.62} roughness={0.28} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[1.0, 1.0, 0.6, 40]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, 3.55, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.22, 0.5, 16]} />
        <meshStandardMaterial color="#00e701" emissive="#00e701" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
}

export function WheelGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [selectedColor, setSelectedColor] = useState('black');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{type:'win'|'lose'|null,text:string}>({type:null,text:'Pick a color and spin!'});
  const [history, setHistory] = useState<string[]>(['black','red','black','yellow','black','green','red','black']);
  const [wheelRotation, setWheelRotation] = useState(0);
  const rotRef = useRef(0);
  const wheelAnimRef = useRef<number | null>(null);

  const segments = [
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','green',
  ];
  const mults: Record<string,number> = {black:2,yellow:3,red:5,green:50};
  const colorHex: Record<string,string> = {black:'#1a1a2e',yellow:'#f59e0b',red:'#ef4444',green:'#22c55e'};

  const spin = useCallback(() => {
    if (spinning || bet <= 0 || bet > balance) return;
    setSpinning(true);
    setBalance(prev => Number((prev - bet).toFixed(2)));
    setResult({type:null,text:'Spinning...'});
    const winIdx = Math.floor(Math.random() * segments.length);
    const winColor = segments[winIdx];
    const segAngle = 360 / segments.length;
    const targetAngle = 360 * (5 + Math.floor(Math.random() * 3)) + (360 - winIdx * segAngle - segAngle / 2);
    const finalRotation = rotRef.current + targetAngle;
    const startRotation = rotRef.current;
    rotRef.current = finalRotation;

    if (wheelAnimRef.current) cancelAnimationFrame(wheelAnimRef.current);
    const startTime = performance.now();
    const duration = 6000;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const animateWheel = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      setWheelRotation(startRotation + (finalRotation - startRotation) * eased);
      if (t < 1) {
        wheelAnimRef.current = requestAnimationFrame(animateWheel);
      } else {
        setWheelRotation(finalRotation);
        wheelAnimRef.current = null;
      }
    };
    wheelAnimRef.current = requestAnimationFrame(animateWheel);
    setTimeout(() => {
      setSpinning(false);
      setHistory(prev => [winColor, ...prev.slice(0, 15)]);
      if (winColor === selectedColor) {
        const winnings = bet * mults[winColor];
        setBalance(prev => Number((prev + winnings).toFixed(2)));
        setResult({type:'win',text:`${winColor.toUpperCase()} wins! +$${winnings.toFixed(2)}`});
        showGameNotification(`\ud83c\udfa1 Won $${winnings.toFixed(2)}!`, 'win');
      } else {
        setResult({type:'lose',text:`${winColor.toUpperCase()} \u2014 you picked ${selectedColor}`});
        showGameNotification(`\ud83c\udfa1 Lost $${bet.toFixed(2)}`, 'lose');
      }
    }, 6200);
  }, [spinning, bet, balance, selectedColor]);

  useEffect(() => {
    return () => {
      if (wheelAnimRef.current) cancelAnimationFrame(wheelAnimRef.current);
    };
  }, []);

  return (
    <div className="bc-game-area">
      <div className="bc-sidebar">
        <div className="bc-balance-box">
          <div className="bc-balance-label">Balance</div>
          <div className="bc-balance-value">${balance.toFixed(2)}</div>
        </div>
        <div>
          <label>Bet Amount</label>
          <input type="number" className="input__bet" min={1} value={bet} onChange={e => setBet(Math.max(1, Number(e.target.value)))} />
          <div className="bc-btn-row">
            <button onClick={() => setBet(1)}>Min</button>
            <button onClick={() => setBet(b => b + 10)}>+10</button>
            <button onClick={() => setBet(b => Math.min(b + 100, balance))}>+100</button>
            <button onClick={() => setBet(Math.floor(balance))}>Max</button>
          </div>
        </div>
        <div className="wheel-bet-colors">
          {(['black','yellow','red','green'] as const).map(color => (
            <div key={color} className={`wheel-color-btn c-${color}`}
              style={{border: selectedColor === color ? '2px solid #fff' : '2px solid transparent'}}
              onClick={() => !spinning && setSelectedColor(color)}>x{mults[color]}</div>
          ))}
        </div>
        <button className="bc-play-btn green" disabled={spinning || bet > balance} onClick={spin}>
          {spinning ? 'Spinning...' : 'Spin Wheel'}
        </button>
      </div>
      <div className="bc-game-field">
        <div className="wheel-visual">
          <div className="wheel-history-bar">
            {history.map((h, i) => (
              <div key={i} className="wheel-history-dot" style={{background:colorHex[h]}} />
            ))}
          </div>
          <Wheel3DView rotationDeg={wheelRotation} spinning={spinning} resultType={result.type} />
          <div className={`dice-result-msg ${result.type === 'win' ? 'win' : result.type === 'lose' ? 'lose' : ''}`} style={{maxWidth:'400px',margin:'12px auto 0'}}>
            {result.text}
          </div>
        </div>
      </div>
    </div>
  );
}
