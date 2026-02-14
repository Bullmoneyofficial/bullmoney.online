'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { showGameNotification } from './game-notifications';

function JackpotTrophySVG() {
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="28" y="66" width="24" height="6" rx="3" fill="#d97706"/>
      <rect x="32" y="62" width="16" height="6" rx="2" fill="#f59e0b"/>
      <path d="M20 16h40v24c0 12-8 22-20 22S20 52 20 40V16z" fill="url(#tGrad2)"/>
      <rect x="18" y="14" width="44" height="6" rx="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5"/>
      <path d="M20 22c-8 0-10 8-8 16s8 10 12 10" stroke="#f59e0b" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M60 22c8 0 10 8 8 16s-8 10-12 10" stroke="#f59e0b" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M24 18h12v18c0 8-4 14-12 16V18z" fill="rgba(255,255,255,.12)"/>
      <polygon points="40,24 43,32 52,32 45,37 47,46 40,41 33,46 35,37 28,32 37,32" fill="#fff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </polygon>
      <circle cx="14" cy="58" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1">
        <animate attributeName="cy" values="58;52;58" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="66" cy="55" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1">
        <animate attributeName="cy" values="55;48;55" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="10" cy="48" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" opacity="0.6">
        <animate attributeName="cy" values="48;42;48" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <defs>
        <linearGradient id="tGrad2" x1="20" y1="16" x2="60" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24"/><stop offset="40%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function JackpotGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [pool, setPool] = useState(0);
  const [players, setPlayers] = useState<{name:string;bet:number;color:string}[]>([]);
  const [timer, setTimer] = useState(20);
  const [gameState, setGameState] = useState<'betting'|'rolling'|'winner'>('betting');
  const [winner, setWinner] = useState<{name:string;amount:number}|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const botNames = ['CryptoKing','LuckyAce','DiamondHands','MoonShot','BullRider','GoldRush','StarPlayer'];
  const botColors = ['#3b82f6','#ef4444','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#10b981'];

  const addBet = useCallback(() => {
    if (gameState !== 'betting' || bet <= 0 || bet > balance) return;
    setBalance(prev => Number((prev - bet).toFixed(2)));
    setPool(prev => prev + bet);
    setPlayers(prev => [...prev, {name:'You',bet,color:'#00e701'}]);
    setTimeout(() => {
      const botBet = Math.floor(Math.random() * 50) + 5;
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      const botColor = botColors[Math.floor(Math.random() * botColors.length)];
      setPool(prev => prev + botBet);
      setPlayers(prev => [...prev, {name:botName,bet:botBet,color:botColor}]);
    }, 500 + Math.random() * 2000);
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setGameState('rolling');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [gameState, bet, balance, botNames, botColors]);

  useEffect(() => {
    if (gameState !== 'rolling') return;
    const t = setTimeout(() => {
      const totalBets = players.reduce((s, p) => s + p.bet, 0);
      let r = Math.random() * totalBets;
      let winnerP = players[0];
      for (const p of players) { r -= p.bet; if (r <= 0) { winnerP = p; break; } }
      setWinner({name:winnerP.name,amount:totalBets});
      if (winnerP.name === 'You') {
        setBalance(prev => Number((prev + totalBets).toFixed(2)));
        showGameNotification(`\ud83c\udfc6 Jackpot! Won $${totalBets.toFixed(2)}!`, 'win');
      } else {
        showGameNotification(`\ud83c\udfc6 ${winnerP.name} won the jackpot`, 'lose');
      }
      setGameState('winner');
    }, 3000);
    return () => clearTimeout(t);
  }, [gameState, players]);

  const resetGame = useCallback(() => {
    setPool(0); setPlayers([]); setTimer(20); setGameState('betting'); setWinner(null);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div className="bc-game-area">
      <div className="bc-sidebar">
        <div className="bc-balance-box" style={{background:'rgba(251,191,36,.08)'}}>
          <div className="bc-balance-label">Balance</div>
          <div className="bc-balance-value" style={{color:'#fbbf24'}}>${balance.toFixed(2)}</div>
        </div>
        <div>
          <label>Your Bet</label>
          <input type="number" className="jackpot_bet" min={1} value={bet} onChange={e => setBet(Math.max(1, Number(e.target.value)))} />
          <div className="bc-btn-row">
            <button onClick={() => setBet(1)}>Min</button>
            <button onClick={() => setBet(b => b + 5)}>+5</button>
            <button onClick={() => setBet(b => b + 25)}>+25</button>
            <button onClick={() => setBet(b => Math.min(b + 100, balance))}>+100</button>
          </div>
        </div>
        {gameState === 'betting' ? (
          <button className="bc-play-btn green" disabled={bet > balance || bet <= 0} onClick={addBet}>Add Bet</button>
        ) : gameState === 'winner' ? (
          <button className="bc-play-btn green" onClick={resetGame}>New Round</button>
        ) : (
          <button className="bc-play-btn" style={{background:'#374151',color:'#9ca3af',cursor:'default'}} disabled>Rolling...</button>
        )}
      </div>
      <div className="bc-game-field">
        <div className="jackpot-visual">
          <div className="jackpot-pot" style={{width:'180px',height:'180px'}}>
            <div className="jackpot-pot-ring r1" />
            <div className="jackpot-pot-ring r2" />
            <div className="jackpot-pot-ring r3" />
            <div className="jackpot-pot-icon" style={{width:'100px',height:'100px'}}><JackpotTrophySVG /></div>
            {pool > 0 && Array.from({length:Math.min(6,Math.floor(pool/10)+1)},(_,i) => (
              <div
                key={i}
                style={{
                  position:'absolute',
                  width:'14px',
                  height:'14px',
                  borderRadius:'50%',
                  background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                  border:'1px solid #d97706',
                  top:`${20+Math.sin(i*1.3)*25}%`,
                  left:`${20+Math.cos(i*1.7)*25}%`,
                  animation:`potPulse ${1+i*.3}s ease-in-out infinite`,
                  boxShadow:'0 0 8px rgba(251,191,36,.3)',
                  fontSize:'7px',
                  fontWeight:900,
                  color:'#92400e',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >
                $
              </div>
            ))}
          </div>
          <div className="jackpot-bank-amount" style={{fontSize:'42px'}}>${pool.toFixed(2)}</div>
          <div className="jackpot-bank-label">Jackpot Pool</div>
          <div className="jackpot-timer-box">
            <div className="jackpot-timer-digit" style={{display:'flex',alignItems:'center',gap:'4px',padding:'12px 20px',fontSize:'28px'}}>
              <span>{String(Math.floor(timer/60)).padStart(2,'0')}</span>
              <span className="jackpot-timer-sep">:</span>
              <span>{String(timer%60).padStart(2,'0')}</span>
            </div>
          </div>
          {players.length > 0 && (
            <div className="jackpot-players-area" style={{width:'100%',maxWidth:'500px'}}>
              <div className="jackpot-players-title">{players.length} Players in pot</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center'}}>
                {players.map((p,i) => {
                  const pct = pool > 0 ? ((p.bet/pool)*100).toFixed(1) : '0';
                  return (
                    <div key={i} style={{background:'rgba(15,33,46,.8)',borderRadius:'10px',padding:'8px 12px',border:`2px solid ${p.color}`,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',minWidth:'70px'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:800,color:'#fff'}}>{p.name[0]}</div>
                      <div style={{fontSize:'11px',color:'#b1bad3',fontWeight:500}}>{p.name}</div>
                      <div style={{fontSize:'13px',color:'#fbbf24',fontWeight:700}}>${p.bet.toFixed(2)}</div>
                      <div style={{fontSize:'10px',color:'#7a8a9a'}}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {gameState === 'rolling' && (
            <div style={{width:'100%',maxWidth:'400px',padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:'18px',fontWeight:700,color:'#fbbf24',animation:'jackpotGlow 1s ease-in-out infinite'}}>Picking winner...</div>
            </div>
          )}
          {winner && gameState === 'winner' && (
            <div style={{padding:'20px',background:'rgba(15,33,46,.9)',borderRadius:'14px',border:'2px solid #fbbf24',textAlign:'center',boxShadow:'0 0 40px rgba(251,191,36,.2)'}}>
              <div style={{fontSize:'14px',color:'#fbbf24',fontWeight:600,textTransform:'uppercase'}}>Winner!</div>
              <div style={{fontSize:'24px',fontWeight:800,color:'#fff',margin:'4px 0'}}>{winner.name}</div>
              <div style={{fontSize:'28px',fontWeight:800,color:'#00e701'}}>${winner.amount.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
