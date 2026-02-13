/**
 * Example: How to use PHP Backend API in Game Components
 * 
 * This shows how to call PHP Laravel backend from Next.js frontend
 */

import { useState } from 'react';
import { phpGameApi } from '@/lib/php-backend-api';

// ═══════════════════════════════════════════════════════════════
// DICE GAME EXAMPLE
// ═══════════════════════════════════════════════════════════════

export function DiceGameExample() {
  const [bet, setBet] = useState(100);
  const [chance, setChance] = useState(50);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleBet = async (type: 'min' | 'max') => {
    setLoading(true);
    try {
      // Call PHP backend API
      const data = await phpGameApi.dice.bet(bet, chance, type);
      
      if (data.type === 'success') {
        setResult({
          win: data.out === 'win',
          amount: data.cash || 0,
          balance: data.balance,
          rolled: data.random,
        });
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.error('Dice bet error:', error);
      alert('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dice-game">
      <h2>Dice Game</h2>
      
      <div>
        <label>Bet Amount:</label>
        <input 
          type="number" 
          value={bet} 
          onChange={(e) => setBet(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Win Chance (%):</label>
        <input 
          type="number" 
          value={chance} 
          onChange={(e) => setChance(Number(e.target.value))}
          min="1"
          max="90"
        />
      </div>

      <div>
        <button onClick={() => handleBet('min')} disabled={loading}>
          Roll Under
        </button>
        <button onClick={() => handleBet('max')} disabled={loading}>
          Roll Over
        </button>
      </div>

      {result && (
        <div className={result.win ? 'win' : 'lose'}>
          {result.win ? '🎉 WIN!' : '😢 LOSE'}
          <p>Rolled: {result.rolled}</p>
          {result.win && <p>Won: ${result.amount}</p>}
          <p>Balance: ${result.balance}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MINES GAME EXAMPLE
// ═══════════════════════════════════════════════════════════════

export function MinesGameExample() {
  const [gameActive, setGameActive] = useState(false);
  const [bet, setBet] = useState(100);
  const [bombs, setBombs] = useState(3);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [balance, setBalance] = useState(0);

  const startGame = async () => {
    try {
      // Call PHP to create new game
      const data = await phpGameApi.mines.create(bombs, bet);
      
      if (data.msg) {
        setGameActive(true);
        setRevealed([]);
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const openCell = async (cellNumber: number) => {
    if (!gameActive || revealed.includes(cellNumber)) return;

    try {
      // Call PHP to open cell
      const data = await phpGameApi.mines.open(cellNumber);
      
      if (data.error) {
        alert(data.msg);
        return;
      }

      if (data.status === 'lose') {
        alert('💣 BOOM! You hit a mine!');
        setGameActive(false);
      } else {
        setRevealed([...revealed, cellNumber]);
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to open cell:', error);
    }
  };

  const cashOut = async () => {
    try {
      // Call PHP to cash out
      const data = await phpGameApi.mines.take();
      
      if (data.error) {
        alert(data.msg);
      } else {
        alert(`💰 Cashed out: $${data.win}`);
        setBalance(data.balance);
        setGameActive(false);
      }
    } catch (error) {
      console.error('Failed to cash out:', error);
    }
  };

  return (
    <div className="mines-game">
      <h2>Mines Game</h2>

      {!gameActive ? (
        <div>
          <input 
            type="number" 
            value={bet} 
            onChange={(e) => setBet(Number(e.target.value))}
            placeholder="Bet amount"
          />
          <input 
            type="number" 
            value={bombs} 
            onChange={(e) => setBombs(Number(e.target.value))}
            min="2"
            max="24"
            placeholder="Number of bombs"
          />
          <button onClick={startGame}>Start Game</button>
        </div>
      ) : (
        <div>
          <div className="mines-grid">
            {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => openCell(num)}
                disabled={revealed.includes(num)}
                className={revealed.includes(num) ? 'revealed' : ''}
              >
                {revealed.includes(num) ? '💎' : '?'}
              </button>
            ))}
          </div>
          <button onClick={cashOut}>Cash Out</button>
          <p>Balance: ${balance}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLINKO GAME EXAMPLE
// ═══════════════════════════════════════════════════════════════

export function PlinkoGameExample() {
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(16);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [result, setResult] = useState<any>(null);

  const dropBall = async () => {
    try {
      // Call PHP to drop ball
      const data = await phpGameApi.plinko.play(bet, lines, risk);
      
      if (data.error) {
        alert(data.msg);
      } else {
        setResult({
          position: data.position,
          multiplier: data.multiplier,
          win: data.win,
          balance: data.balance,
        });
      }
    } catch (error) {
      console.error('Plinko drop failed:', error);
    }
  };

  return (
    <div className="plinko-game">
      <h2>Plinko</h2>

      <input 
        type="number" 
        value={bet} 
        onChange={(e) => setBet(Number(e.target.value))}
      />

      <select value={lines} onChange={(e) => setLines(Number(e.target.value))}>
        <option value={8}>8 Lines</option>
        <option value={12}>12 Lines</option>
        <option value={16}>16 Lines</option>
      </select>

      <select value={risk} onChange={(e) => setRisk(e.target.value as any)}>
        <option value="low">Low Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="high">High Risk</option>
      </select>

      <button onClick={dropBall}>Drop Ball</button>

      {result && (
        <div>
          <p>Landed in position: {result.position}</p>
          <p>Multiplier: {result.multiplier}x</p>
          <p>Won: ${result.win}</p>
          <p>Balance: ${result.balance}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// USAGE IN GamePageClient.tsx
// ═══════════════════════════════════════════════════════════════

/*
Replace your game-specific fetch() calls with phpGameApi calls:

OLD (TypeScript API routes):
  const response = await fetch('/api/casino/dice/bet', {
    method: 'POST',
    body: JSON.stringify({ bet, percent, type })
  });

NEW (PHP Laravel backend):
  const data = await phpGameApi.dice.bet(bet, percent, type);

That's it! The PHP API client handles:
- ✅ Correct backend URL (localhost, IP, production)
- ✅ CORS headers
- ✅ CSRF tokens
- ✅ Credentials/cookies
- ✅ Error handling
*/
