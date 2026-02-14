'use client';

import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { showGameNotification } from './game-notifications';

function Mines3DView({ board }: { board: ('hidden'|'gem'|'bomb')[] }) {
  return (
    <div className="game-canvas-wrap" style={{ maxWidth: '460px', height: '220px', margin: '0 auto 10px' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 48 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        {board.map((cell, i) => {
          const x = (i % 5) * 1.25 - 2.5;
          const y = (Math.floor(i / 5) * -1.05) + 2.1;
          const color = cell === 'hidden' ? '#213743' : cell === 'gem' ? '#22c55e' : '#ef4444';
          return (
            <mesh key={i} position={[x, y, 0]}>
              <boxGeometry args={[0.95, 0.95, 0.3]} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.45} emissive={cell === 'hidden' ? '#000000' : color} emissiveIntensity={cell === 'hidden' ? 0 : 0.12} />
            </mesh>
          );
        })}
      </Canvas>
    </div>
  );
}

function GemSVG() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26">
      <defs><linearGradient id="gemG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="50%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#2563eb"/></linearGradient></defs>
      <polygon points="16,2 28,12 22,30 10,30 4,12" fill="url(#gemG)" stroke="#93c5fd" strokeWidth="1"/>
      <polygon points="16,2 20,12 16,28 12,12" fill="rgba(255,255,255,.2)"/>
      <polygon points="4,12 16,2 16,12" fill="rgba(255,255,255,.15)"/>
      <line x1="4" y1="12" x2="28" y2="12" stroke="rgba(255,255,255,.3)" strokeWidth="0.5"/>
      <circle cx="12" cy="8" r="1.5" fill="#fff" opacity="0.8"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/></circle>
    </svg>
  );
}

function BombSVG() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26">
      <defs><linearGradient id="bombG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#374151"/><stop offset="100%" stopColor="#1f2937"/></linearGradient></defs>
      <circle cx="16" cy="18" r="10" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
      <circle cx="16" cy="18" r="8" fill="url(#bombG)"/>
      <ellipse cx="13" cy="15" rx="3" ry="2" fill="rgba(255,255,255,.15)" transform="rotate(-20,13,15)"/>
      <path d="M16,8 Q18,4 22,3" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="22" cy="3" r="2" fill="#f59e0b"><animate attributeName="r" values="1.5;3;1.5" dur="0.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.5;1" dur="0.3s" repeatCount="indefinite"/></circle>
      <circle cx="22" cy="3" r="1" fill="#fbbf24"/>
    </svg>
  );
}

export function MinesGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [numBombs, setNumBombs] = useState(3);
  const [gameState, setGameState] = useState<'idle'|'playing'|'won'|'lost'>('idle');
  const [board, setBoard] = useState<('hidden'|'gem'|'bomb')[]>(Array(25).fill('hidden'));
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(0);
  const [currentMult, setCurrentMult] = useState(1);

  const getMult = useCallback((rev: number, bCount: number) => {
    if (rev === 0) return 1;
    let m = 1;
    for (let i = 0; i < rev; i++) m *= (25 - i) / (25 - bCount - i);
    return Number(Math.max(1, m * 0.97).toFixed(2));
  }, []);

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > balance) return;

    const bombPositions = new Set<number>();
    while (bombPositions.size < numBombs) {
      bombPositions.add(Math.floor(Math.random() * 25));
    }

    setBombs(bombPositions);
    setBoard(Array(25).fill('hidden'));
    setRevealed(0);
    setCurrentMult(1);
    setGameState('playing');
    setBalance(prev => Number((prev - bet).toFixed(2)));
  }, [bet, balance, numBombs]);

  const revealCell = useCallback((idx: number) => {
    if (gameState !== 'playing' || board[idx] !== 'hidden') return;

    const newBoard = [...board];

    if (bombs.has(idx)) {
      newBoard[idx] = 'bomb';
      bombs.forEach(b => { newBoard[b] = 'bomb'; });
      for (let i = 0; i < 25; i++) {
        if (newBoard[i] === 'hidden') newBoard[i] = 'gem';
      }
      setBoard(newBoard);
      setGameState('lost');
      showGameNotification(`\ud83d\udca3 Hit a mine! Lost $${bet.toFixed(2)}`, 'lose');
    } else {
      newBoard[idx] = 'gem';
      const newRev = revealed + 1;
      const newM = getMult(newRev, numBombs);
      setBoard(newBoard);
      setRevealed(newRev);
      setCurrentMult(newM);

      if (newRev >= 25 - numBombs) {
        const winnings = Number((bet * newM).toFixed(2));
        setBalance(prev => Number((prev + winnings).toFixed(2)));
        setGameState('won');
        showGameNotification(`\ud83d\udc8e All gems found! Won $${winnings.toFixed(2)}!`, 'win');
      }
    }
  }, [gameState, board, bombs, revealed, numBombs, bet, getMult]);

  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || revealed === 0) return;

    const winnings = Number((bet * currentMult).toFixed(2));
    setBalance(prev => Number((prev + winnings).toFixed(2)));

    const newBoard = [...board];
    bombs.forEach(b => { newBoard[b] = 'bomb'; });
    for (let i = 0; i < 25; i++) {
      if (newBoard[i] === 'hidden') newBoard[i] = 'gem';
    }
    setBoard(newBoard);
    setGameState('won');
    showGameNotification(`\ud83d\udc8e Cashed out $${winnings.toFixed(2)} at x${currentMult.toFixed(2)}!`, 'win');
  }, [gameState, revealed, bet, currentMult, board, bombs]);

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
        <div>
          <label>Difficulty</label>
          <div className="bc-btn-row" style={{marginBottom:'8px'}}>
            {[{l:'Easy',b:3},{l:'Medium',b:5},{l:'Hard',b:10},{l:'Expert',b:15},{l:'Insane',b:20}].map(mode => (
              <button key={mode.l} onClick={() => setNumBombs(mode.b)} disabled={gameState === 'playing'}
                style={numBombs === mode.b ? {background:'rgba(0,231,1,.15)',color:'#00e701',border:'1px solid #00e701'} : {}}>
                {mode.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Mines ({numBombs})</label>
          <input type="number" className="input__bombs" min={1} max={24} value={numBombs} onChange={e => setNumBombs(Math.min(24, Math.max(1, Number(e.target.value))))} disabled={gameState === 'playing'} />
          <div className="bc-btn-row">
            {[1, 3, 5, 10, 24].map(v => (
              <button key={v} disabled={gameState === 'playing'} onClick={() => setNumBombs(v)}>{v}</button>
            ))}
          </div>
        </div>
        {gameState === 'idle' || gameState === 'won' || gameState === 'lost' ? (
          <button className="bc-play-btn green" disabled={bet > balance || bet <= 0} onClick={startGame}>
            {gameState === 'idle' ? 'Start Game' : 'Play Again'}
          </button>
        ) : (
          <button className="bc-play-btn green" onClick={cashOut} disabled={revealed === 0}>
            Cash Out ${(bet * currentMult).toFixed(2)}
          </button>
        )}
        {gameState === 'playing' && revealed > 0 && (
          <div style={{textAlign:'center',padding:'8px',background:'rgba(0,231,1,.06)',borderRadius:'8px'}}>
            <div style={{fontSize:'11px',color:'#7a8a9a'}}>Current Multiplier</div>
            <div style={{fontSize:'20px',fontWeight:800,color:'#00e701'}}>x{currentMult.toFixed(2)}</div>
          </div>
        )}
      </div>
      <div className="bc-game-field">
        <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
          <div style={{padding:'10px 16px',background:'rgba(33,55,67,.6)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color: gameState === 'lost' ? '#ed4245' : gameState === 'won' ? '#00e701' : '#b1bad3', fontSize:'13px',fontWeight:600}}>
              {gameState === 'lost' ? '\ud83d\udca3 You hit a mine!' : gameState === 'won' ? `\ud83d\udc8e Won $${(bet*currentMult).toFixed(2)}!` : gameState === 'playing' ? `${revealed} gems \u2014 x${currentMult.toFixed(2)}` : 'Click Start to play'}
            </span>
            <span style={{color:'#7a8a9a',fontSize:'12px'}}>{numBombs} mines</span>
          </div>
          <div style={{padding:'10px 12px 0'}}>
            <Mines3DView board={board} />
          </div>
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
            <div className="mines-grid">
              {board.map((cell, i) => (
                <button key={i} type="button"
                  className={`mines-cell ${cell !== 'hidden' ? 'revealed' : ''} ${cell === 'gem' ? 'gem' : ''} ${cell === 'bomb' ? 'bomb' : ''}`}
                  onClick={() => revealCell(i)}
                  disabled={gameState !== 'playing' || cell !== 'hidden'}
                  style={{transition:'all 0.3s ease',transform:cell !== 'hidden' ? 'scale(0.95)' : 'scale(1)'}}>
                  {cell === 'gem' && <GemSVG />}
                  {cell === 'bomb' && <BombSVG />}
                  {cell === 'hidden' && gameState === 'playing' && (
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'rgba(255,255,255,.1)'}} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
