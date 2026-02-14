'use client';

import { useEffect, useState } from 'react';

export function FlappyBirdGame() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);

  useEffect(() => {
    (window as any).flappyBirdBalance = balance;
    (window as any).flappyBirdSetBalance = setBalance;
  }, [balance]);

  return (
    <div className="bc-game-area">
      <div className="bc-game-field" style={{ flex: 1 }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 231, 1, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 231, 1, 0.3)'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: '#00e701',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <span style={{ color: '#00e701', fontSize: '13px', fontWeight: 600 }}>Ready to Play</span>
          </div>

          <div 
            id="flappy-canvas" 
            style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.08), rgba(15,33,46,0.8))',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center'
            }}>
              <div id="flappy-current-score" style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>0</div>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginTop: '2px' }}>Current Score</div>
            </div>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center'
            }}>
              <div id="flappy-high-score" style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24' }}>0</div>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginTop: '2px' }}>High Score</div>
            </div>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center'
            }}>
              <div id="flappy-games-played" style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>0</div>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginTop: '2px' }}>Games Played</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bc-sidebar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#e5e7eb', marginBottom: '16px' }}>Place Your Bet</h2>
          
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px' }}>Bet Amount</label>
            <input 
              type="number" 
              className="flappy_bet"
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
              min="1" 
              max="10000" 
              step="0.01"
            />
            <div className="bc-btn-row">
              <button onClick={() => setBet(10)}>10</button>
              <button onClick={() => setBet(50)}>50</button>
              <button onClick={() => setBet(100)}>100</button>
              <button onClick={() => setBet(500)}>500</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginBottom: '4px' }}>Multiplier</div>
              <div className="flappy__multiplier" style={{ fontSize: '18px', fontWeight: 700, color: '#00e701' }}>1.00x</div>
            </div>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginBottom: '4px' }}>Potential Win</div>
              <div className="flappy__potential_win" style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>0.00</div>
            </div>
          </div>

          <button className="bc-play-btn green flappy__play" style={{ marginBottom: '8px' }}>
            Start Game
          </button>
          <button className="bc-play-btn red flappy__cashout" style={{ display: 'none' }}>
            Cash Out
          </button>

          <div className="flappy__result" style={{ 
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(15,33,46,0.6)',
            border: '2px solid rgba(255,255,255,0.08)',
            color: '#b1bad3',
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
            display: 'none',
            marginTop: '8px'
          }} />

          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px',
            color: '#7a8a9a',
            lineHeight: 1.6
          }}>
            <p style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#b1bad3' }}>\ud83d\udca1 Pro Tip:</strong> Each pipe you pass increases your multiplier by 0.1x!
            </p>
            <p>
              <strong style={{ color: '#b1bad3' }}>\ud83c\udfae Controls:</strong> Click or press SPACE to flap
            </p>
          </div>

          <div style={{ 
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ 
              background: 'rgba(15,33,46,0.6)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#7a8a9a', marginBottom: '4px' }}>Your Balance</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#00e701' }}>${balance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
