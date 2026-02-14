'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { showGameNotification } from './game-notifications';

function CrashRocketSVG({ crashed }: { crashed: boolean }) {
  return (
    <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
      <path d="M40 8 C36 8 30 18 30 32 L30 50 L50 50 L50 32 C50 18 44 8 40 8Z"
        fill={crashed ? '#ed4245' : 'url(#rocketBody)'} stroke={crashed ? '#dc2626' : '#4ade80'} strokeWidth="1"/>
      <path d="M40 4 C38 4 34 10 34 16 L46 16 C46 10 42 4 40 4Z" fill={crashed ? '#ff6b6b' : '#4ade80'}/>
      <circle cx="40" cy="26" r="5" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5"/>
      <circle cx="40" cy="26" r="3" fill="#1e3a5f" opacity="0.8"/>
      <ellipse cx="39" cy="25" rx="1.5" ry="1" fill="rgba(255,255,255,0.4)"/>
      <path d="M30 42 L22 54 L30 50Z" fill={crashed ? '#dc2626' : '#059669'}/>
      <path d="M50 42 L58 54 L50 50Z" fill={crashed ? '#dc2626' : '#059669'}/>
      <rect x="38" y="50" width="4" height="6" rx="1" fill={crashed ? '#b91c1c' : '#047857'}/>
      <path d="M34 50 L33 56 L47 56 L46 50Z" fill="#334155"/>
      {crashed ? (
        <>
          <circle cx="40" cy="60" r="14" fill="#ed4245" opacity="0.5">
            <animate attributeName="r" values="10;18;10" dur="0.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="40" cy="60" r="8" fill="#f59e0b" opacity="0.7">
            <animate attributeName="r" values="6;12;6" dur="0.4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="40" cy="58" r="4" fill="#fbbf24"/>
        </>
      ) : (
        <>
          <ellipse cx="40" cy="62" rx="7" ry="12" fill="#f59e0b" opacity="0.9">
            <animate attributeName="ry" values="10;14;10" dur="0.15s" repeatCount="indefinite"/>
            <animate attributeName="rx" values="6;8;6" dur="0.2s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="40" cy="64" rx="4" ry="9" fill="#fbbf24">
            <animate attributeName="ry" values="7;11;7" dur="0.12s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="40" cy="65" rx="2.5" ry="6" fill="#fff" opacity="0.7">
            <animate attributeName="ry" values="5;8;5" dur="0.1s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="36" cy="72" r="2" fill="#94a3b8" opacity="0.3">
            <animate attributeName="cy" values="72;80" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0" dur="0.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="44" cy="74" r="1.5" fill="#94a3b8" opacity="0.2">
            <animate attributeName="cy" values="74;82" dur="0.6s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0" dur="0.6s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
      <defs>
        <linearGradient id="rocketBody" x1="30" y1="8" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e2e8f0"/>
          <stop offset="0.5" stopColor="#cbd5e1"/>
          <stop offset="1" stopColor="#94a3b8"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CrashGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'waiting' | 'running' | 'crashed'>('waiting');
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(0);
  const [history, setHistory] = useState<number[]>([2.43, 1.51, 3.72, 1.02, 5.21, 1.88, 2.15, 12.43]);
  const animRef = useRef<number>(0);
  const startRef = useRef(0);
  const crashRef = useRef(0);

  const startGame = useCallback(() => {
    if (gameState === 'running' || bet <= 0 || bet > balance) return;
    const r = Math.random();
    const crash = Math.max(1.01, Number((1 / (1 - r) * 0.97).toFixed(2)));
    crashRef.current = crash;
    setBalance(prev => Number((prev - bet).toFixed(2)));
    setMultiplier(1.0);
    setGameState('running');
    setCashedOut(false);
    setCashoutAt(0);
    startRef.current = performance.now();
    const animate = (time: number) => {
      const elapsed = (time - startRef.current) / 1000;
      const m = Number(Math.max(1, Math.pow(Math.E, elapsed * 0.3)).toFixed(2));
      if (m >= crashRef.current) {
        setMultiplier(crashRef.current);
        setGameState('crashed');
        setHistory(prev => [crashRef.current, ...prev.slice(0, 15)]);
        showGameNotification(`\ud83d\ude80 Crashed at ${crashRef.current.toFixed(2)}x`, 'lose');
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [gameState, bet, balance]);

  const cashout = useCallback(() => {
    if (gameState !== 'running' || cashedOut) return;
    cancelAnimationFrame(animRef.current);
    const winnings = Number((bet * multiplier).toFixed(2));
    setBalance(prev => Number((prev + winnings).toFixed(2)));
    setCashedOut(true);
    setCashoutAt(multiplier);
    setGameState('crashed');
    setHistory(prev => [Number(multiplier.toFixed(2)), ...prev.slice(0, 15)]);
    showGameNotification(`\ud83d\ude80 Cashed out $${winnings.toFixed(2)} at ${multiplier.toFixed(2)}x!`, 'win');
  }, [gameState, cashedOut, bet, multiplier]);

  useEffect(() => {
    if (gameState === 'running' && multiplier >= autoCashout && !cashedOut) cashout();
  }, [multiplier, autoCashout, gameState, cashedOut, cashout]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const rocketY = gameState === 'running' ? Math.min(60, (multiplier - 1) * 15) : (gameState === 'crashed' && !cashedOut ? -10 : 0);
  const rocketX = gameState === 'running' ? Math.min(35, (multiplier - 1) * 10) : 0;

  return (
    <div className="bc-game-area">
      <div className="bc-sidebar">
        <div className="bc-balance-box">
          <div className="bc-balance-label">Balance</div>
          <div className="bc-balance-value">${balance.toFixed(2)}</div>
        </div>
        <div>
          <label>Bet Amount</label>
          <input type="number" className="crash_bet" min={1} value={bet} onChange={e => setBet(Math.max(1, Number(e.target.value)))} />
          <div className="bc-btn-row">
            <button onClick={() => setBet(1)}>Min</button>
            <button onClick={() => setBet(b => b + 10)}>+10</button>
            <button onClick={() => setBet(b => Math.min(b + 100, balance))}>+100</button>
            <button onClick={() => setBet(Math.floor(balance))}>Max</button>
          </div>
        </div>
        <div>
          <label>Auto Cashout</label>
          <input type="number" className="crash_auto" min={1.1} step={0.1} value={autoCashout} onChange={e => setAutoCashout(Math.max(1.1, Number(e.target.value)))} />
          <div className="bc-btn-row">
            {[1.5, 2, 3, 5, 10].map(v => (
              <button key={v} onClick={() => setAutoCashout(v)}>{v}x</button>
            ))}
          </div>
        </div>
        {gameState !== 'running' ? (
          <button className="bc-play-btn green" disabled={bet > balance || bet <= 0} onClick={startGame}>
            {gameState === 'crashed' ? 'Play Again' : 'Place Bet'}
          </button>
        ) : (
          <button className="bc-play-btn red" onClick={cashout}>Cash Out ${(bet * multiplier).toFixed(2)}</button>
        )}
      </div>
      <div className="bc-game-field">
        <div className="crash-visual">
          <div className="crash-coefs-bar">
            {history.map((h, i) => (
              <div key={i} className="crash-coef-chip" style={{ borderColor: h < 2 ? '#ed4245' : '#00e701', color: h < 2 ? '#ed4245' : '#00e701' }}>{h.toFixed(2)}x</div>
            ))}
          </div>
          <div className="crash-graph-area" style={{background: gameState === 'crashed' && !cashedOut ? 'radial-gradient(ellipse at bottom,rgba(237,66,69,.08),transparent 70%)' : 'radial-gradient(ellipse at bottom,rgba(0,231,1,.04),transparent 70%)'}}>
            <div className="crash-stars">
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="crash-star" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${(i * 0.7) % 3}s`, opacity: 0.3 + ((i * 0.04) % 0.7) }} />
              ))}
            </div>
            {gameState === 'running' && (
              <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0}} viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs><linearGradient id="trailG" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#00e701" stopOpacity="0.5"/></linearGradient></defs>
                <path d={`M 10 85 Q ${10+rocketX/2} ${85-rocketY/2} ${10+rocketX} ${85-rocketY}`} fill="none" stroke="url(#trailG)" strokeWidth="0.8"/>
              </svg>
            )}
            <div style={{ position:'absolute', bottom:`${15+rocketY}%`, left:`${10+rocketX}%`, transform:`rotate(-${Math.min(45,rocketY)}deg)`, transition: gameState === 'running' ? 'all 0.1s linear' : 'all 0.5s ease', zIndex:1 }}>
              <CrashRocketSVG crashed={gameState === 'crashed' && !cashedOut} />
            </div>
            <div style={{zIndex:2,textAlign:'center'}}>
              <div className={`crash-multiplier ${gameState === 'crashed' && !cashedOut ? 'crashed' : ''}`}>{multiplier.toFixed(2)}x</div>
              <div className="crash-status">
                {gameState === 'waiting' ? 'Place a bet to launch' :
                 gameState === 'running' ? 'Cash out before crash!' :
                 cashedOut ? `Cashed out at ${cashoutAt.toFixed(2)}x \u2014 Won $${(bet * cashoutAt).toFixed(2)}!` :
                 `Crashed at ${crashRef.current.toFixed(2)}x`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
