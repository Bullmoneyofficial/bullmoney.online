'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { showGameNotification } from './game-notifications';

export function PlinkoGame() {
  const [balance, setBalance] = useState(4710);
  const [bet, setBet] = useState(10);
  const [ballsPerDrop, setBallsPerDrop] = useState(1);
  const [rows, setRows] = useState(16);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [dropping, setDropping] = useState(false);
  const [activeBalls, setActiveBalls] = useState<Array<{ id: number; path: number[]; step: number }>>([]);
  const [settledBalls, setSettledBalls] = useState<Array<{ id: number; binIndex: number }>>([]);
  const [lastBin, setLastBin] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState(0);
  const [history, setHistory] = useState<Array<{ mult: number; win: number; stake: number }>>([]);
  const [binHits, setBinHits] = useState<number[]>(Array(17).fill(0));
  const [flashingBins, setFlashingBins] = useState<Record<number, number>>({});

  useEffect(() => {
    setBinHits(Array(rows + 1).fill(0));
    setFlashingBins({});
    setLastBin(null);
    setActiveBalls([]);
    setSettledBalls([]);
    setDropping(false);
  }, [rows]);

  const multipliers = useMemo(() => {
    const center = rows / 2;
    const maxByRows = {
      low: rows >= 16 ? 8 : rows >= 12 ? 5 : 3,
      medium: rows >= 16 ? 30 : rows >= 12 ? 16 : 9,
      high: rows >= 16 ? 130 : rows >= 12 ? 60 : 26,
    };
    const minByRisk = { low: 0.5, medium: 0.3, high: 0.2 };
    const powByRisk = { low: 1.9, medium: 1.5, high: 1.2 };
    const min = minByRisk[risk];
    const max = maxByRows[risk];
    const power = powByRisk[risk];

    const roundMult = (value: number) => {
      if (value >= 100) return Math.round(value);
      if (value >= 10) return Math.round(value * 10) / 10;
      return Math.round(value * 100) / 100;
    };

    return Array.from({ length: rows + 1 }, (_, index) => {
      const dist = Math.abs(index - center) / center;
      return roundMult(min + (max - min) * Math.pow(dist, power));
    });
  }, [risk, rows]);

  const dropBall = useCallback(() => {
    const totalStake = Number((bet * ballsPerDrop).toFixed(2));
    if (dropping || bet <= 0 || totalStake > balance) return;

    setDropping(true);
    setLastBin(null);
    setLastWin(0);
    setBalance(prev => Number((prev - totalStake).toFixed(2)));

    let settled = 0;
    let totalWin = 0;

    for (let ballIndex = 0; ballIndex < ballsPerDrop; ballIndex++) {
      const ballId = Date.now() + ballIndex;
      let column = 0;
      const generatedPath: number[] = [0];
      for (let i = 0; i < rows; i++) {
        if (Math.random() < 0.5) column += 1;
        generatedPath.push(column);
      }
      const binIndex = column;
      const mult = multipliers[binIndex] || 0;
      const win = Number((bet * mult).toFixed(2));

      window.setTimeout(() => {
        setActiveBalls(prev => [...prev, { id: ballId, path: generatedPath, step: 0 }]);

        let localStep = 0;
        const timer = window.setInterval(() => {
          localStep += 1;
          setActiveBalls(prev => prev.map(ball => (ball.id === ballId ? { ...ball, step: localStep } : ball)));

          if (localStep >= rows) {
            window.clearInterval(timer);

            totalWin += win;
            settled += 1;

            setLastBin(binIndex);
            setHistory(prev => [{ mult, win, stake: bet }, ...prev].slice(0, 12));
            setBinHits(prev => {
              const next = prev.length === rows + 1 ? [...prev] : Array(rows + 1).fill(0);
              next[binIndex] = (next[binIndex] || 0) + 1;
              return next;
            });
            setFlashingBins(prev => ({ ...prev, [binIndex]: (prev[binIndex] || 0) + 1 }));
            window.setTimeout(() => {
              setFlashingBins(prev => {
                const next = { ...prev };
                if (next[binIndex]) {
                  next[binIndex] -= 1;
                  if (next[binIndex] <= 0) delete next[binIndex];
                }
                return next;
              });
            }, 450);

            setActiveBalls(prev => prev.filter(ball => ball.id !== ballId));
            setSettledBalls(prev => [...prev, { id: ballId, binIndex }]);

            window.setTimeout(() => {
              setSettledBalls(prev => prev.filter(ball => ball.id !== ballId));
            }, 2000);

            if (settled >= ballsPerDrop) {
              const payout = Number(totalWin.toFixed(2));
              const profit = Number((payout - totalStake).toFixed(2));
              setLastWin(payout);
              setBalance(prev => Number((prev + payout).toFixed(2)));
              setDropping(false);

              if (profit > 0) {
                showGameNotification(`\ud83c\udfaf ${ballsPerDrop} balls settled \u2014 +$${profit.toFixed(2)} profit`, 'win');
              } else {
                showGameNotification(`\ud83c\udfaf ${ballsPerDrop} balls settled \u2014 returned $${payout.toFixed(2)}`, 'info');
              }
            }
          }
        }, 130);
      }, ballIndex * 120);
    }
  }, [balance, ballsPerDrop, bet, dropping, multipliers, rows]);

  const boardGap = 80 / (rows + 1);
  const totalStake = Number((bet * ballsPerDrop).toFixed(2));

  return (
    <div className="bc-game-area">
      <div className="bc-sidebar">
        <div className="bc-balance-box">
          <div className="bc-balance-label">Balance</div>
          <div className="bc-balance-value">${balance.toFixed(2)}</div>
        </div>

        <div className="plinko-controls">
          <div>
            <label>Bet Amount</label>
            <input
              type="number"
              min={1}
              value={bet}
              onChange={e => setBet(Math.max(1, Number(e.target.value) || 1))}
            />
            <div className="bc-btn-row">
              <button onClick={() => setBet(1)}>Min</button>
              <button onClick={() => setBet(v => v + 10)}>+10</button>
              <button onClick={() => setBet(v => Math.min(balance, v + 100))}>+100</button>
              <button onClick={() => setBet(Math.floor(balance))}>Max</button>
            </div>
          </div>

          <div className="plinko-control-grid">
            <div className="plinko-control-item">
              <label>Risk</label>
              <div className="plinko-pill-row">
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`plinko-pill ${risk === level ? 'active' : ''}`}
                    onClick={() => setRisk(level)}
                    disabled={dropping}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="plinko-control-item">
              <label>Rows</label>
              <div className="plinko-pill-row">
                {[8, 12, 16].map(value => (
                  <button
                    key={value}
                    type="button"
                    className={`plinko-pill ${rows === value ? 'active' : ''}`}
                    onClick={() => setRows(value)}
                    disabled={dropping}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="plinko-control-item">
              <label>Balls</label>
              <div className="plinko-pill-row">
                {[1, 3, 5, 10].map(value => (
                  <button
                    key={value}
                    type="button"
                    className={`plinko-pill ${ballsPerDrop === value ? 'active' : ''}`}
                    onClick={() => setBallsPerDrop(value)}
                    disabled={dropping}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="plinko-control-item">
              <label>&nbsp;</label>
              <button className="bc-play-btn green" onClick={dropBall} disabled={dropping || totalStake > balance || bet <= 0}>
                {dropping ? 'Dropping\u2026' : 'Bet'}
              </button>
            </div>
          </div>

          <div className="plinko-stats">
            <div className="plinko-stat">
              <div className="plinko-stat-label">Last Batch Payout</div>
              <div className="plinko-stat-value">${lastWin.toFixed(2)}</div>
            </div>
            <div className="plinko-stat">
              <div className="plinko-stat-label">Recent Drop</div>
              {history[0] ? (
                <span className={`plinko-history-chip ${history[0].win >= history[0].stake ? 'win' : 'loss'}`}>
                  x{history[0].mult} \u00b7 ${history[0].win.toFixed(2)}
                </span>
              ) : (
                <div className="plinko-stat-value">\u2014</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bc-game-field">
        <div className="plinko-topbar">
          <span style={{ color: '#b1bad3', fontSize: 13, fontWeight: 600 }}>
            Stake-style Plinko \u00b7 {rows} rows \u00b7 {risk} risk \u00b7 {ballsPerDrop} balls
          </span>
          <span style={{ color: '#00e701', fontSize: 13, fontWeight: 700 }}>
            {lastBin === null ? 'Ready' : `Last: x${multipliers[lastBin]}`}
          </span>
        </div>

        <div className="plinko-visual">
          <div className="plinko-board-wrap">
            <div className="plinko-board">
              {Array.from({ length: rows }, (_, row) =>
                Array.from({ length: row + 1 }, (_, col) => {
                  const x = 50 + (col - row / 2) * boardGap;
                  const y = 12 + row * (66 / rows);
                  return <span key={`${row}-${col}`} className="plinko-peg" style={{ left: `${x}%`, top: `${y}%` }} />;
                })
              )}

              {activeBalls.map(ball => {
                const activeRow = Math.min(ball.step, rows);
                const activeCol = ball.path[activeRow] ?? 0;
                const ballLeft = 50 + (activeCol - activeRow / 2) * boardGap;
                const ballTop = 12 + activeRow * (66 / rows);
                return <span key={ball.id} className="plinko-ball" style={{ left: `${ballLeft}%`, top: `${ballTop}%` }} />;
              })}
            </div>
          </div>

          <div className="plinko-bins" style={{ gridTemplateColumns: `repeat(${rows + 1}, minmax(0, 1fr))` }}>
            {multipliers.map((mult, index) => {
              const ballsInBin = settledBalls.filter(ball => ball.binIndex === index);
              return (
                <div
                  key={`${mult}-${index}`}
                  className={`plinko-bin ${lastBin === index ? 'hit' : ''} ${binHits[index] ? 'touched' : ''} ${flashingBins[index] ? 'glow' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {mult}x
                  {ballsInBin.map((ball, i) => (
                    <span 
                      key={ball.id} 
                      className="plinko-ball" 
                      style={{ 
                        position: 'absolute', 
                        left: '50%', 
                        bottom: `${10 + i * 18}px`,
                        transform: 'translateX(-50%)',
                        transition: 'none',
                        zIndex: 10 + i
                      }} 
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
