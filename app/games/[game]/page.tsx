'use client';

import { use, useEffect, useRef } from 'react';
import BullcasinoShell from '../components/BullcasinoShell';

const gameTitles: Record<string, string> = {
  dice: 'Dice',
  mines: 'Mines',
  wheel: 'Wheel',
  jackpot: 'Jackpot',
  crash: 'Crash',
  slots: 'Slots',
};

/**
 * Sequentially load scripts — each waits for the previous to finish.
 * This guarantees jQuery & socket.io are ready before game JS runs.
 */
function useSequentialScripts(srcs: string[]) {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    let cancelled = false;

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (cancelled) return reject('cancelled');
        // Skip if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = () => reject(`Failed to load ${src}`);
        document.body.appendChild(s);
      });
    }

    (async () => {
      for (const src of srcs) {
        if (cancelled) break;
        try {
          await loadScript(src);
        } catch (e) {
          if (e !== 'cancelled') console.warn(e);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [srcs]);
}

function DiceContent() {
  return (
    <div className="dice__container">
      <div className="games__area">
        <div className="games__sidebar">
          <div className="games__input_wrapper_bet">
            <label className="games__sidebar_label">Bet</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input input__bet" defaultValue={0} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 1); (window as any).changeBet?.(); } }}>+1</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 10); (window as any).changeBet?.(); } }}>+10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 100); (window as any).changeBet?.(); } }}>+100</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(1); (window as any).changeBet?.(); } }}>Min</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { const bal = (window as any).$?.('#balance').text(); (window as any).$?.('.input__bet').val(bal); (window as any).changeBet?.(); } }}>Max</button>
            </div>
          </div>
          <div className="games__input_wrapper_bombs">
            <label className="games__sidebar_label">Chance</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input input__chance" min={1} max={90} defaultValue={50} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__chance').val(1); (window as any).changeChance?.(); } }}>1%</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__chance').val(25); (window as any).changeChance?.(); } }}>25%</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__chance').val(50); (window as any).changeChance?.(); } }}>50%</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__chance').val(75); (window as any).changeChance?.(); } }}>75%</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__chance').val(90); (window as any).changeChance?.(); } }}>90%</button>
            </div>
          </div>
        </div>
        <div className="dice__field">
          <div className="game__dice_wrapper">
            <div className="dice__main_area">
              <div className="dice__possible_win">1.25</div>
              <div className="dice__possible_text">Possible win</div>
              <div className="dice__play_buttons">
                <div className="dice__action">
                  <button className="dice__play play__small">Under</button>
                  <span className="min__prog">100000 - 999999</span>
                </div>
                <div className="dice__action">
                  <button className="dice__play play__big">Over</button>
                  <span className="max__prog">100000 - 999999</span>
                </div>
              </div>
              <div className="dice__result">Round result</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinesContent() {
  return (
    <div className="mines__container">
      <div className="games__area">
        <div className="games__sidebar">
          <div className="games__input_wrapper_bet">
            <label className="games__sidebar_label">Bet</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input input__bet" defaultValue={0} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 1); } }}>+1</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 10); } }}>+10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 100); } }}>+100</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(1); } }}>Min</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { const bal = (window as any).$?.('#balance').text(); (window as any).$?.('.input__bet').val(bal); } }}>Max</button>
            </div>
          </div>
          <div className="games__input_wrapper_bombs">
            <label className="games__sidebar_label">Number of bombs</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input input__bombs" min={2} max={24} defaultValue={3} id="InputBombs" />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('#InputBombs').val(3); (window as any).getItems?.(); } }}>3</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('#InputBombs').val(5); (window as any).getItems?.(); } }}>5</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('#InputBombs').val(10); (window as any).getItems?.(); } }}>10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('#InputBombs').val(20); (window as any).getItems?.(); } }}>20</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('#InputBombs').val(24); (window as any).getItems?.(); } }}>24</button>
            </div>
          </div>
          <div className="games__sidebar_play_button">
            <button className="sidebar__play">Play</button>
            <button className="sidebar__take_win" style={{ display: 'none' }}>Cash out <span id="win"></span>₽</button>
          </div>
        </div>
        <div className="games__field">
          <div className="game__field_mines">
            <div className="game__mines_coefs">
              <div className="game__mines_coef"></div>
            </div>
            <div className="games__area_field">
              <div className="mines__field">
                {Array.from({ length: 25 }, (_, index) => (
                  <button key={index + 1} type="button" data-number={index + 1} disabled className="mines__cell"></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WheelContent() {
  return (
    <div className="wheel__container">
      <div className="games__area">
        <div className="games__sidebar">
          <div className="games__input_wrapper_bet">
            <label className="games__sidebar_label">Bet</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input input__bet" defaultValue={0} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 1); } }}>+1</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 10); } }}>+10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(+((window as any).$?.('.input__bet').val() || 0) + 100); } }}>+100</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.input__bet').val(1); } }}>Min</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { const bal = (window as any).$?.('#balance').text(); (window as any).$?.('.input__bet').val(bal); } }}>Max</button>
            </div>
          </div>
          <div className="wheel__colors">
            <div className="wheel__bet_color wheel__x2" onClick={() => (window as any).wheelBet?.('black')} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}>x2</div>
            <div className="wheel__bet_color wheel__x3" onClick={() => (window as any).wheelBet?.('yellow')} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}>x3</div>
            <div className="wheel__bet_color wheel__x5" onClick={() => (window as any).wheelBet?.('red')} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}>x5</div>
            <div className="wheel__bet_color wheel__x50" onClick={() => (window as any).wheelBet?.('green')} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}>x50</div>
          </div>
        </div>
        <div className="games__field">
          <div className="game__field_mines">
            <div className="game__wheel_coefs">
              <div className="game__wheel_coef"></div>
            </div>
            <div className="game__wheel">
              <div className="wheel__timer">
                <span className="time" id="wheelTime">15</span>
              </div>
              <div className="wheel__pointer"></div>
              <div className="wheel__row" style={{ transform: 'rotate(2deg)', transition: 'transform 0s linear 0s' }} id="wheelSpin">
                <img src="/assets/images/wheeld.svg" alt="Wheel" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="wheel__bet_history">
        <div className="wheel__colors_history">
          {['black', 'yellow', 'red', 'green'].map((color, index) => (
            <div className={`wheel__history_color wheel__color_x${index === 0 ? 2 : index === 1 ? 3 : index === 2 ? 5 : 50}`} key={color}>
              <div className="wheel__history_col_head" onClick={() => (window as any).wheelBet?.(color)} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}>
                <span className="bet__money" data-bank={color}>0.00</span>
                <span className="">x{index === 0 ? 2 : index === 1 ? 3 : index === 2 ? 5 : 50}</span>
              </div>
              <div className="wheel__history_bets_color">
                <div className="wheel__history_bet_color"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JackpotContent() {
  return (
    <div className="mines__container">
      <div className="games__area">
        <div className="games__sidebar">
          <div className="games__input_wrapper_bet">
            <label className="games__sidebar_label">Bet</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input jackpot_bet" defaultValue={0} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.jackpot_bet').val(+((window as any).$?.('.jackpot_bet').val() || 0) + 1); } }}>+1</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.jackpot_bet').val(+((window as any).$?.('.jackpot_bet').val() || 0) + 10); } }}>+10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.jackpot_bet').val(+((window as any).$?.('.jackpot_bet').val() || 0) + 100); } }}>+100</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.jackpot_bet').val(1); } }}>Min</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { const bal = (window as any).$?.('#balance').text(); (window as any).$?.('.jackpot_bet').val(bal); } }}>Max</button>
            </div>
          </div>
          <div className="games__sidebar_play_button">
            <button className="sidebar__play">Play</button>
            <button className="sidebar__take_win" style={{ display: 'none' }}>Cash out <span id="win"></span>₽</button>
          </div>
        </div>
        <div className="games__field">
          <div className="game__field_mines">
            <div className="game__jackpot">
              <img src="/assets/images/jackpot.png" alt="Jackpot" />
              <div className="jackpot__timer">
                <div className="timer__head">Next game in:</div>
                <div className="timer__countdown">
                  <div className="timer__block">
                    <div className="timer__count">00</div>
                    <div className="timer__label">min</div>
                  </div>
                  <div className="timer__block">
                    <div className="timer__count">00</div>
                    <div className="timer__label">sec</div>
                  </div>
                </div>
              </div>
              <div className="jackpot__bank">0.00 ₽</div>
            </div>
            <div className="jackpot__players">
              <div className="jackpot__title">Players</div>
              <div className="jackpot__list"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrashContent() {
  return (
    <div className="mines__container">
      <div className="games__area">
        <div className="games__sidebar">
          <div className="games__input_wrapper_bet">
            <label className="games__sidebar_label">Bet</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input crash_bet" defaultValue={0} />
            </div>
            <div className="games__sidebar_help_bombs">
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.crash_bet').val(+((window as any).$?.('.crash_bet').val() || 0) + 1); } }}>+1</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.crash_bet').val(+((window as any).$?.('.crash_bet').val() || 0) + 10); } }}>+10</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.crash_bet').val(+((window as any).$?.('.crash_bet').val() || 0) + 100); } }}>+100</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { (window as any).$?.('.crash_bet').val(1); } }}>Min</button>
              <button className="games__sidebar_bombs_action" onClick={() => { if (typeof window !== 'undefined') { const bal = (window as any).$?.('#balance').text(); (window as any).$?.('.crash_bet').val(bal); } }}>Max</button>
            </div>
          </div>
          <div className="games__input_wrapper_bombs">
            <label className="games__sidebar_label">Auto Cashout</label>
            <div className="games__sidebar_wrapper_input">
              <input type="number" className="games__sidebar_input crash_cashout" defaultValue={2.0} />
            </div>
          </div>
          <div className="games__sidebar_play_button">
            <button className="sidebar__play">Place bet</button>
            <button className="sidebar__take_win" style={{ display: 'none' }}>Cash out <span id="win"></span>₽</button>
          </div>
        </div>
        <div className="games__field">
          <div className="game__field_mines">
            <div className="crash__graph">
              <div className="crash__chart" id="chart"></div>
              <div className="crash__title">x1.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotsContent() {
  return (
    <div className="wheel__container">
      <div className="games__area">
        <div className="games__field" style={{ width: '100%' }}>
          <div className="slots__container" style={{ padding: 24 }}>
            <div className="slots--notFound">Slots catalog loads from the backend. If this section is empty, make sure the Render service is running and API access is enabled.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGameContent(game: string) {
  switch (game) {
    case 'dice':
      return <DiceContent />;
    case 'mines':
      return <MinesContent />;
    case 'wheel':
      return <WheelContent />;
    case 'jackpot':
      return <JackpotContent />;
    case 'crash':
      return <CrashContent />;
    case 'slots':
      return <SlotsContent />;
    default:
      return null;
  }
}

function getGameScripts(game: string) {
  const scripts: string[] = [];
  if (game === 'dice') scripts.push('/assets/js/dice.js');
  if (game === 'mines') scripts.push('/assets/js/mines.js');
  if (game === 'crash') scripts.push('/assets/js/jquery.flot.min.js', '/assets/js/chart.js', '/assets/js/crash.js');
  return scripts;
}

export default function CasinoGamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = use(params);
  const content = getGameContent(game);
  const casinoBase = (process.env.NEXT_PUBLIC_CASINO_URL || 'https://bullmoney-casino.onrender.com').replace(/\/$/, '');
  const casinoSocket = process.env.NEXT_PUBLIC_CASINO_SOCKET_URL || `${casinoBase}:8443`;

  if (!content) {
    return (
      <BullcasinoShell>
        <div className="games__container" style={{ padding: 24 }}>
          <div className="slots--notFound">Game not found. Return to <a href="/games">Games</a>.</div>
        </div>
      </BullcasinoShell>
    );
  }

  // Build the ordered list of scripts: jQuery first, then socket.io, then app utilities, then game-specific
  const allScripts: string[] = [
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js',
    '/assets/js/notifyme.min.js',
    '/assets/js/app.js',
    '/assets/js/socket.js',
    ...getGameScripts(game),
  ];

  return (
    <CasinoGameInner game={game} content={content} scripts={allScripts} casinoBase={casinoBase} casinoSocket={casinoSocket} />
  );
}

function CasinoGameInner({ game, content, scripts, casinoBase, casinoSocket }: {
  game: string;
  content: React.ReactNode;
  scripts: string[];
  casinoBase: string;
  casinoSocket: string;
}) {
  // Set globals before any scripts run
  useEffect(() => {
    (window as any).client_user = 0;
    (window as any).__BULLCASINO_BASE__ = casinoBase;
    (window as any).__BULLCASINO_SOCKET__ = casinoSocket;
    if (game === 'crash') {
      (window as any).game_active = false;
      (window as any).bet = undefined;
      (window as any).isCashout = undefined;
      (window as any).withdraw = undefined;
    }
  }, [game, casinoBase, casinoSocket]);

  // Load all scripts sequentially (jQuery -> socket.io -> app.js -> game scripts)
  useSequentialScripts(scripts);

  return (
    <BullcasinoShell>
      <link rel="stylesheet" href="/assets/css/style.css" />
      <link rel="stylesheet" href="/assets/css/notifyme.css" />
      {content}
    </BullcasinoShell>
  );
}
