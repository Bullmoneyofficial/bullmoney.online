'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { showGameNotification } from './game-notifications';

const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: Math.PI },
  3: { x: 0, y: -Math.PI / 2 },
  4: { x: 0, y: Math.PI / 2 },
  5: { x: Math.PI / 2, y: 0 },
  6: { x: -Math.PI / 2, y: 0 },
};

function createNumberFaceTexture(text: string, bgColor: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const r = 28;
  ctx.beginPath();
  ctx.roundRect(4, 4, size - 8, size - 8, r);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 6;
  const fontSize = text.length > 5 ? 52 : text.length > 3 ? 60 : 80;
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const FACE_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

function DiceMesh({ spinKey, face, displayValue }: { spinKey: number; face: number; displayValue: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const animRef = useRef<{ start: number; duration: number; from: THREE.Vector3; to: THREE.Vector3 } | null>(null);
  const rotRef = useRef(new THREE.Vector3(0, 0, 0));
  const turnRef = useRef({ x: 0, y: 0, z: 0 });
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const prevValueRef = useRef<string>('');

  if (displayValue !== prevValueRef.current && typeof window !== 'undefined') {
    prevValueRef.current = displayValue;
    materialsRef.current.forEach(m => { m.map?.dispose(); m.dispose(); });
    materialsRef.current = FACE_COLORS.map(c =>
      new THREE.MeshStandardMaterial({ map: createNumberFaceTexture(displayValue, c) })
    );
    if (meshRef.current) {
      (meshRef.current as any).material = materialsRef.current;
    }
  }

  useEffect(() => {
    const base = FACE_ROTATIONS[face] || FACE_ROTATIONS[1];
    turnRef.current = {
      x: turnRef.current.x + 3,
      y: turnRef.current.y + 4,
      z: turnRef.current.z + 2,
    };
    const to = new THREE.Vector3(
      turnRef.current.x * Math.PI * 2 + base.x,
      turnRef.current.y * Math.PI * 2 + base.y,
      turnRef.current.z * Math.PI * 2,
    );
    animRef.current = {
      start: performance.now(),
      duration: 760,
      from: rotRef.current.clone(),
      to,
    };
  }, [spinKey, face]);

  useFrame(() => {
    const mesh = meshRef.current;
    const anim = animRef.current;
    if (!mesh || !anim) return;
    const now = performance.now();
    const t = Math.min(1, (now - anim.start) / anim.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const next = new THREE.Vector3(
      anim.from.x + (anim.to.x - anim.from.x) * eased,
      anim.from.y + (anim.to.y - anim.from.y) * eased,
      anim.from.z + (anim.to.z - anim.from.z) * eased,
    );
    rotRef.current.copy(next);
    mesh.rotation.set(next.x, next.y, next.z);
    if (t >= 1) {
      mesh.rotation.set(anim.to.x, anim.to.y, anim.to.z);
      rotRef.current.copy(anim.to);
      animRef.current = null;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow material={materialsRef.current.length ? materialsRef.current : undefined}>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
    </mesh>
  );
}

function Dice3DView({ spinKey, face, displayValue }: { spinKey: number; face: number; displayValue: string }) {
  return (
    <div className="dice-canvas-wrap">
      <Canvas camera={{ position: [0, 0, 4], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 4]} intensity={1.1} />
        <directionalLight position={[-3, -2, -2]} intensity={0.35} />
        <DiceMesh spinKey={spinKey} face={face} displayValue={displayValue} />
      </Canvas>
    </div>
  );
}

export function DiceGame() {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ type: 'win' | 'lose' | null; text: string }>({ type: null, text: 'Place your bet!' });
  const [chance, setChance] = useState(50);
  const [bet, setBet] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [lastRoll, setLastRoll] = useState(50.0);
  const [diceFace, setDiceFace] = useState(1);
  const [diceSpinKey, setDiceSpinKey] = useState(0);

  const winAmount = ((100 / chance) * bet).toFixed(2);

  const playDice = useCallback((type: 'under' | 'over') => {
    if (rolling || bet <= 0 || bet > balance) return;
    setRolling(true);

    const random = Math.floor(Math.random() * 999999);
    const edge = Math.floor((chance / 100) * 999999);
    const win = type === 'under' ? random <= edge : random >= (999999 - edge);

    const roll = Number(((random / 999999) * 100).toFixed(2));
    setLastRoll(roll);

    const nextFace = (random % 6) + 1;
    setDiceFace(nextFace);
    setDiceSpinKey(k => k + 1);

    setTimeout(() => {
      setRolling(false);
      if (win) {
        const winnings = Number(((100 / chance) * bet).toFixed(2));
        setBalance(prev => Number((prev - bet + winnings).toFixed(2)));
        setResult({ type: 'win', text: `Won $${winnings.toFixed(2)}! Roll: ${roll.toFixed(2)}` });
        showGameNotification(`\ud83c\udfb2 Won $${winnings.toFixed(2)}!`, 'win');
      } else {
        setBalance(prev => Number((prev - bet).toFixed(2)));
        setResult({ type: 'lose', text: `Lost! Roll: ${roll.toFixed(2)}` });
        showGameNotification(`\ud83c\udfb2 Lost $${bet.toFixed(2)}`, 'lose');
      }
    }, 760);
  }, [rolling, bet, balance, chance]);

  useEffect(() => {
    (window as any).animateDiceResult = (face: number, random?: number) => {
      setDiceFace(face);
      setDiceSpinKey(k => k + 1);
      if (typeof random === 'number') {
        setLastRoll(Number(((random / 999999) * 100).toFixed(2)));
      }
    };
    return () => { delete (window as any).animateDiceResult; };
  }, []);

  return (
    <div className="bc-game-area plinko-layout">
      <div className="bc-sidebar plinko-sidebar">
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
        <div>
          <label>Win Chance %</label>
          <input type="number" className="input__chance" min={1} max={95} value={chance} onChange={e => setChance(Math.min(95, Math.max(1, Number(e.target.value))))} />
          <div className="bc-btn-row">
            {[10, 25, 50, 75, 90].map(v => (
              <button key={v} onClick={() => setChance(v)}>{v}%</button>
            ))}
          </div>
        </div>
      </div>
      <div className="bc-game-field plinko-game-field">
        <div className="dice-visual">
          <Dice3DView spinKey={diceSpinKey} face={diceFace} displayValue={lastRoll.toFixed(2)} />
          <div className="dice-win-display">${winAmount}</div>
          <div className="dice-win-label">Possible win</div>
          <div style={{color:'#b1bad3',fontSize:'13px',fontWeight:500}}>
            Last Roll: <span style={{color:'#fff',fontWeight:700}}>{lastRoll}</span>
          </div>
          <div className="dice-chance-bar">
            <div className="dice-chance-fill" style={{ width: `${chance}%` }} />
          </div>
          <div className="dice-result-bar">
            <button className="under-btn" disabled={rolling || bet > balance} onClick={() => playDice('under')}>
              {rolling ? 'Rolling...' : `Roll Under ${chance}`}
            </button>
            <button className="over-btn" disabled={rolling || bet > balance} onClick={() => playDice('over')}>
              {rolling ? 'Rolling...' : `Roll Over ${100 - chance}`}
            </button>
          </div>
          <div className={`dice-result-msg ${result.type === 'win' ? 'win' : result.type === 'lose' ? 'lose' : ''}`}>
            {result.text}
          </div>
        </div>
      </div>
    </div>
  );
}
