export const GAME_STYLES = `
/* --- Shared game area --- */
.bc-game-area{display:flex;gap:12px;padding:clamp(8px,2vw,16px);width:100%;max-width:100%;margin:0 auto;box-sizing:border-box;align-items:stretch;min-height:calc(100dvh - 110px)}
.bc-sidebar{min-width:220px;max-width:320px;width:100%;background:rgba(15,23,42,.95);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:clamp(10px,2vw,16px);display:flex;flex-direction:column;gap:14px;box-sizing:border-box;flex-shrink:0;max-height:calc(100dvh - 130px);overflow:auto}
.bc-sidebar label{color:#b1bad3;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.bc-sidebar input[type=number]{width:100%;background:#0f212e;border:2px solid #2f4553;border-radius:8px;color:#fff;font-size:15px;font-weight:600;height:42px;padding:0 12px;outline:none;transition:border-color .2s;box-sizing:border-box}
.bc-sidebar input[type=number]:focus{border-color:#00e701}
.bc-btn-row{display:flex;gap:4px;margin-top:4px}
.bc-btn-row button{flex:1;background:#0f212e;border:none;color:#b1bad3;font-size:12px;font-weight:600;padding:6px 0;border-radius:6px;cursor:pointer;transition:all .15s}
.bc-btn-row button:hover{color:#00e701;background:rgba(0,231,1,.08)}
.bc-play-btn{width:100%;padding:12px;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;transition:all .2s}
.bc-play-btn.green{background:#00e701;color:#000}.bc-play-btn.green:hover{opacity:.88;transform:scale(1.02)}
.bc-play-btn.red{background:#ed4245;color:#fff}.bc-play-btn.red:hover{opacity:.88}
.bc-game-field{flex:1;min-height:clamp(320px,58dvh,760px);max-height:calc(100dvh - 130px);width:100%;background:rgba(15,23,42,.95);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;position:relative;box-sizing:border-box}

/* --- Dice --- */
.dice-visual{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px;gap:16px}
.dice-3d-wrapper{perspective:600px;width:100px;height:100px}
.dice-cube{width:100px;height:100px;position:relative;transform-style:preserve-3d;transition:transform .75s cubic-bezier(.17,.67,.22,1.05)}
.dice-cube.rolling{transition:transform .75s cubic-bezier(.17,.67,.22,1.05)}
.dice-canvas-wrap{width:140px;height:140px;border-radius:16px;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.08),rgba(15,33,46,.6));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 0 20px rgba(0,0,0,.25)}
.game-canvas-wrap{width:min(100%,640px);height:clamp(220px,38dvh,420px);margin:0 auto;border-radius:16px;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.06),rgba(15,33,46,.75));box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 0 24px rgba(0,0,0,.3);overflow:hidden}
.game-canvas-wrap.sm{width:min(100%,560px);height:clamp(200px,32dvh,340px)}
.wheel3d-stage{position:relative;width:min(100%,760px);height:clamp(260px,54dvh,560px);margin:0 auto;border-radius:16px;overflow:hidden;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.08),rgba(15,33,46,.8))}
.wheel3d-pointer{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:24px solid #00e701;z-index:4;filter:drop-shadow(0 0 10px rgba(0,231,1,.7))}
.wheel3d-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:90px;height:90px;border-radius:50%;border:3px solid rgba(251,191,36,.9);background:radial-gradient(circle at 35% 35%,#1f2937,#0f172a);display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 0 24px rgba(251,191,36,.25)}
@media(max-width:768px){.wheel3d-stage{height:320px;max-width:520px}.wheel3d-center{width:72px;height:72px}.wheel3d-pointer{top:8px;border-left-width:12px;border-right-width:12px;border-bottom-width:20px}}
.dice-face{position:absolute;width:100px;height:100px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;backface-visibility:hidden}
.dice-face.f1{background:linear-gradient(135deg,#f59e0b,#d97706);transform:translateZ(50px)}
.dice-face.f2{background:linear-gradient(135deg,#ef4444,#dc2626);transform:rotateY(180deg)translateZ(50px)}
.dice-face.f3{background:linear-gradient(135deg,#3b82f6,#2563eb);transform:rotateY(90deg)translateZ(50px)}
.dice-face.f4{background:linear-gradient(135deg,#8b5cf6,#7c3aed);transform:rotateY(-90deg)translateZ(50px)}
.dice-face.f5{background:linear-gradient(135deg,#10b981,#059669);transform:rotateX(90deg)translateZ(50px)}
.dice-face.f6{background:linear-gradient(135deg,#ec4899,#db2777);transform:rotateX(-90deg)translateZ(50px)}
.dice-dot{width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.dice-dots{display:grid;gap:6px;padding:16px}
.dice-dots.d1{grid-template:1fr/1fr;place-items:center}
.dice-dots.d2{grid-template:1fr 1fr/1fr;place-items:center}
.dice-dots.d3{grid-template:1fr 1fr 1fr/1fr;place-items:center}
.dice-dots.d4{grid-template:1fr 1fr/1fr 1fr;place-items:center}
.dice-dots.d5{grid-template:1fr 1fr 1fr/1fr 1fr;place-items:center}.dice-dots.d5 .dice-dot:nth-child(3){grid-column:1/-1}
.dice-dots.d6{grid-template:1fr 1fr 1fr/1fr 1fr;place-items:center}
.dice-win-display{font-size:52px;font-weight:800;color:#00e701;text-shadow:0 0 30px rgba(0,231,1,.4);letter-spacing:-.04em}
.dice-win-label{font-size:14px;color:#7a8a9a;font-weight:500}
.dice-result-bar{display:flex;gap:8px;width:100%;max-width:340px}
.dice-result-bar button{flex:1;padding:10px;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;transition:all .18s;text-transform:uppercase}
.dice-result-bar .under-btn{background:#3b82f6;color:#fff}.dice-result-bar .under-btn:hover{opacity:.85}
.dice-result-bar .over-btn{background:#f59e0b;color:#000}.dice-result-bar .over-btn:hover{opacity:.85}
.dice-result-msg{width:100%;max-width:340px;text-align:center;padding:8px;border-radius:8px;font-weight:600;font-size:14px;min-height:36px;background:#0f212e;border:2px solid #2f4553;color:#b1bad3;transition:all .3s}
.dice-result-msg.win{border-color:#00e701;color:#00e701;box-shadow:0 0 15px rgba(0,231,1,.25)}
.dice-result-msg.lose{border-color:#ed4245;color:#ed4245;box-shadow:0 0 15px rgba(237,66,69,.25)}
.dice-chance-bar{width:100%;max-width:340px;height:6px;border-radius:3px;background:#2f4553;overflow:hidden;position:relative}
.dice-chance-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#3b82f6,#00e701);transition:width .3s}

/* --- Crash --- */
.crash-visual{display:flex;flex-direction:column;flex:1;position:relative;overflow:hidden}
.crash-coefs-bar{display:flex;gap:4px;padding:12px 16px;background:rgba(33,55,67,.6);overflow-x:auto;flex-shrink:0}
.crash-coef-chip{padding:4px 10px;border:2px solid #00e701;border-radius:10px;font-size:12px;font-weight:600;color:#00e701;white-space:nowrap;flex-shrink:0}
.crash-graph-area{flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-height:0;background:radial-gradient(ellipse at bottom,rgba(0,231,1,.04),transparent 70%)}
.crash-multiplier{font-size:64px;font-weight:800;color:#00e701;text-shadow:0 0 40px rgba(0,231,1,.5);letter-spacing:-.04em;z-index:2}
.crash-multiplier.crashed{color:#ed4245;text-shadow:0 0 40px rgba(237,66,69,.5)}
.crash-status{font-size:13px;color:#7a8a9a;font-weight:500;margin-top:4px;z-index:2}
.crash-rocket{position:absolute;z-index:1;transition:all .05s linear}
.crash-rocket svg{filter:drop-shadow(0 0 12px rgba(0,231,1,.5))}
.crash-rocket.crashed svg{filter:drop-shadow(0 0 15px rgba(237,66,69,.6))}
.crash-trail{position:absolute;bottom:20%;left:10%;width:40%;height:3px;background:linear-gradient(90deg,transparent,#00e701);border-radius:2px;opacity:.5;z-index:0}
.crash-stars{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.crash-star{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;animation:twinkle 3s ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.crash-bets-area{padding:12px 16px;background:rgba(33,55,67,.4);max-height:180px;overflow-y:auto}
.crash-bet-row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;background:rgba(15,33,46,.6);margin-bottom:4px}
.crash-bet-avatar{width:32px;height:32px;border-radius:50%;background:#2f4553}
.crash-bet-name{color:#b1bad3;font-size:13px;font-weight:500;flex:1}
.crash-bet-amount{color:#00e701;font-weight:600;font-size:13px}

/* --- Wheel (Roulette) --- */
.wheel-visual{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px;gap:16px}
.wheel-history-bar{display:flex;gap:3px;padding:12px 16px;background:rgba(33,55,67,.6);overflow-x:auto;flex-shrink:0}
.wheel-history-dot{width:5px;height:20px;border-radius:3px;flex-shrink:0}
.wheel-wrapper{position:relative;width:280px;height:280px}
.roulette-wheel{width:280px;height:280px;border-radius:50%;position:relative;transition:transform 8s cubic-bezier(.17,.67,.12,.99);will-change:transform}
.roulette-wheel-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;position:relative;box-shadow:0 0 0 6px rgba(255,255,255,.1),0 0 30px rgba(0,231,1,.15),inset 0 0 20px rgba(0,0,0,.4)}
.roulette-segment{position:absolute;width:50%;height:50%;transform-origin:100% 100%;clip-path:polygon(0 0,100% 0,100% 100%)}
.roulette-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:rgba(15,33,46,.95);border:3px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;z-index:2}
.roulette-timer{font-size:28px;font-weight:800;color:#00e701;text-shadow:0 0 15px rgba(0,231,1,.4)}
.roulette-pointer{position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid #00e701;z-index:3;filter:drop-shadow(0 0 6px rgba(0,231,1,.5))}
.wheel-bet-colors{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.wheel-color-btn{padding:10px 8px;border-radius:8px;font-weight:700;font-size:13px;color:#fff;cursor:pointer;border:2px solid transparent;text-align:center;transition:all .2s}
.wheel-color-btn:hover{transform:scale(1.05);filter:brightness(1.15)}
.wheel-color-btn.c-black{background:#535353}.wheel-color-btn.c-yellow{background:#f59e0b}.wheel-color-btn.c-red{background:#ef4444}.wheel-color-btn.c-green{background:#22c55e}
.wheel-bets-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%;max-width:600px}
.wheel-bets-col{background:rgba(15,33,46,.6);border-radius:10px;overflow:hidden}
.wheel-bets-col-head{display:flex;justify-content:space-between;padding:10px 14px;color:#fff;font-weight:600;font-size:13px}
.wheel-bets-col-body{padding:8px;min-height:40px}

/* --- Jackpot --- */
.jackpot-visual{display:flex;flex-direction:column;align-items:center;flex:1;padding:20px;gap:16px}

.crash-visual,.wheel-visual,.jackpot-visual{width:100%;height:100%;box-sizing:border-box}
.jackpot-pot{position:relative;width:160px;height:160px;display:flex;align-items:center;justify-content:center}
.jackpot-pot-ring{position:absolute;inset:0;border-radius:50%;border:4px solid;animation:potPulse 2s ease-in-out infinite}
.jackpot-pot-ring.r1{border-color:rgba(251,191,36,.4);animation-delay:0s}
.jackpot-pot-ring.r2{inset:10px;border-color:rgba(251,191,36,.25);animation-delay:.4s}
.jackpot-pot-ring.r3{inset:20px;border-color:rgba(251,191,36,.15);animation-delay:.8s}
@keyframes potPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.7}}
.jackpot-pot-icon{width:80px;height:80px;z-index:1}
.jackpot-pot-icon svg{width:100%;height:100%}
.jackpot-bank-amount{font-size:36px;font-weight:800;color:#fbbf24;text-shadow:0 0 25px rgba(251,191,36,.4);letter-spacing:-.03em}
.jackpot-bank-label{font-size:13px;color:#7a8a9a;font-weight:500}
.jackpot-timer-box{display:flex;gap:6px;align-items:center}
.jackpot-timer-digit{background:#0f212e;border:2px solid #2f4553;border-radius:8px;padding:8px 12px;font-size:24px;font-weight:800;color:#fff;min-width:48px;text-align:center}
.jackpot-timer-sep{font-size:24px;font-weight:800;color:#7a8a9a}
.jackpot-players-area{width:100%;max-width:600px}
.jackpot-players-title{color:#b1bad3;font-size:13px;font-weight:600;text-transform:uppercase;margin-bottom:8px}
.jackpot-players-row{display:flex;gap:8px;overflow-x:auto;padding:4px 0}
.jackpot-player-card{flex-shrink:0;width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(15,33,46,.6);border-radius:10px;padding:8px 4px}
.jackpot-player-avatar{width:36px;height:36px;border-radius:50%;background:#2f4553;border:2px solid #fbbf24}
.jackpot-player-bet{font-size:12px;font-weight:700;color:#fbbf24}
.jackpot-player-tickets{font-size:10px;color:#7a8a9a}
.jackpot-roll-area{width:100%;max-width:600px;height:80px;background:#0f212e;border-radius:10px;overflow:hidden;position:relative;display:none}
.jackpot-roll-area::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:3px;background:#00e701;border-radius:2px;z-index:2;transform:translateX(-50%)}
.jackpot-winner-overlay{position:absolute;inset:0;background:rgba(15,33,46,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px;z-index:5;display:none}
.jackpot-winner-title{color:#fbbf24;font-size:24px;font-weight:800}
.jackpot-winner-name{color:#fff;font-size:18px;font-weight:600;margin-top:4px}
.jackpot-winner-amount{color:#00e701;font-size:22px;font-weight:800;margin-top:4px}

/* --- Mines --- */
.mines-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:clamp(4px,1vw,8px);padding:clamp(8px,2vw,16px);width:100%;max-width:min(380px,100%);margin:0 auto;box-sizing:border-box}
.mines-cell{aspect-ratio:1;border-radius:10px;background:#213743;border:2px solid #2f4553;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:clamp(16px,3vw,24px);transition:all .15s;position:relative;overflow:hidden}
.mines-cell:hover:not(.revealed){transform:scale(1.08);border-color:#00e701;box-shadow:0 0 12px rgba(0,231,1,.25)}
.mines-cell.gem{background:#00e701;border-color:#00e701}.mines-cell.gem::after{content:'💎';font-size:22px}
.mines-cell.bomb{background:#ed4245;border-color:#ed4245}.mines-cell.bomb::after{content:'💣';font-size:22px}
.mines-coefs-bar{display:flex;gap:4px;padding:10px 14px;background:rgba(33,55,67,.6);overflow-x:auto;flex-shrink:0}
.mines-coef-chip{padding:5px 14px;border:2px solid rgba(255,255,255,.12);border-radius:10px;font-size:12px;font-weight:600;color:#b1bad3;white-space:nowrap;flex-shrink:0;transition:all .2s}
.mines-coef-chip.active{border-color:#00e701;color:#fff}

/* --- Slots --- */
.slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(130px,45%),1fr));gap:clamp(6px,1.5vw,12px);padding:clamp(8px,2vw,16px);width:100%;box-sizing:border-box}
.slots-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;color:#7a8a9a;font-size:14px;text-align:center}
.slots-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(33,55,67,.6);border-bottom:1px solid rgba(255,255,255,.06)}
.slots-title{font-size:15px;font-weight:700;color:#e5e7eb}
.slots-subtitle{font-size:12px;color:#94a3b8}
.slots-card{background:rgba(15,33,46,.8);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:210px}
.slots-card-top{height:112px;background:linear-gradient(135deg,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;border-bottom:1px solid rgba(255,255,255,.06)}
.slots-card-top img{width:56px;height:56px;opacity:.85;object-fit:contain}
.slots-card-body{padding:10px;display:flex;flex-direction:column;gap:6px;flex:1}
.slots-name{font-size:13px;font-weight:700;color:#e5e7eb;line-height:1.2}
.slots-meta{font-size:11px;color:#94a3b8}
.slots-tags{display:flex;gap:4px;flex-wrap:wrap}
.slots-tag{font-size:10px;color:#93c5fd;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.35);border-radius:999px;padding:2px 6px}
.slots-play-btn{margin-top:auto;width:100%;padding:8px;border:none;border-radius:8px;background:#00e701;color:#02120a;font-size:12px;font-weight:800;cursor:pointer;transition:opacity .2s}
.slots-play-btn:hover{opacity:.86}
.slots-play-btn.disabled{background:#374151;color:#9ca3af;cursor:not-allowed;pointer-events:none}

/* --- Plinko --- */
.plinko-visual{display:flex;flex-direction:column;flex:1;padding:12px;gap:10px}
.plinko-topbar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;background:rgba(33,55,67,.55);border-bottom:1px solid rgba(255,255,255,.08)}
.plinko-board-wrap{position:relative;flex:1;min-height:280px;border-radius:12px;background:radial-gradient(circle at 50% 10%,rgba(255,255,255,.08),rgba(15,33,46,.92));border:1px solid rgba(255,255,255,.08);overflow:hidden}
.plinko-board{position:absolute;inset:0}
.plinko-peg{position:absolute;width:8px;height:8px;border-radius:50%;background:#dbeafe;transform:translate(-50%,-50%);opacity:.9;box-shadow:0 0 8px rgba(219,234,254,.25)}
.plinko-ball{position:absolute;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#f59e0b 65%,#d97706);transform:translate(-50%,-50%);box-shadow:0 0 16px rgba(245,158,11,.45);transition:left .16s ease,top .16s ease;z-index:3}
.plinko-bins{display:grid;gap:4px;padding:6px 0 0;align-items:end}
.plinko-bin{padding:7px 2px;border-radius:8px;text-align:center;font-size:clamp(8px,1.7vw,11px);line-height:1.05;font-weight:800;color:#fff;background:#1f2937;border:1px solid rgba(255,255,255,.12);white-space:nowrap;overflow:visible;text-overflow:ellipsis;min-height:32px;position:relative}
.plinko-bin.hit{outline:2px solid #00e701;background:rgba(0,231,1,.16);color:#d1fae5}
.plinko-bin.touched{background:rgba(59,130,246,.12);border-color:rgba(96,165,250,.45)}
.plinko-bin.glow{background:rgba(0,231,1,.25);border-color:rgba(34,197,94,.85);box-shadow:0 0 14px rgba(0,231,1,.45)}
.plinko-controls{display:flex;flex-direction:column;gap:10px}
.plinko-pill-row{display:flex;gap:6px;flex-wrap:wrap}
.plinko-pill{padding:7px 10px;border-radius:999px;border:1px solid #2f4553;background:#0f212e;color:#b1bad3;font-size:12px;font-weight:700;cursor:pointer}
.plinko-pill.active{border-color:#00e701;background:rgba(0,231,1,.15);color:#00e701}
.plinko-control-grid{display:contents}
.plinko-control-item{display:flex;flex-direction:column;gap:6px}
.plinko-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.plinko-stat{padding:8px;border-radius:8px;background:rgba(15,33,46,.75);border:1px solid rgba(255,255,255,.06)}
.plinko-stat-label{font-size:11px;color:#7a8a9a;text-transform:uppercase}
.plinko-stat-value{font-size:16px;font-weight:800;color:#e2e8f0}
.plinko-history{display:flex;gap:6px;flex-wrap:wrap}
.plinko-history-chip{padding:4px 8px;border-radius:8px;background:#0f212e;border:1px solid #2f4553;color:#cbd5e1;font-size:11px;font-weight:700}
.plinko-history-chip.win{color:#22c55e;border-color:rgba(34,197,94,.45)}
.plinko-history-chip.loss{color:#ef4444;border-color:rgba(239,68,68,.45)}
.plinko-game-field{min-height:auto;height:auto}
.plinko-layout{gap:clamp(4px,1vw,10px);max-width:100%;width:100%;height:calc(100dvh - 170px);min-height:280px}
.plinko-sidebar{padding:clamp(6px,1vw,12px);gap:clamp(6px,1vw,10px)}
.plinko-sidebar .bc-balance-box{padding:6px;margin-bottom:4px}
.plinko-sidebar .bc-balance-label{font-size:10px}
.plinko-sidebar .bc-balance-value{font-size:clamp(14px,1.8vw,18px);line-height:1.1}
.plinko-sidebar label{font-size:10px;letter-spacing:.02em}
.plinko-sidebar input[type=number]{height:36px;font-size:13px;padding:0 10px}
.plinko-sidebar .bc-btn-row{gap:3px}
.plinko-sidebar .bc-btn-row button{padding:4px 0;font-size:10px}

/* --- Mobile responsive --- */
@media(max-width:768px){
  .bc-game-area{flex-direction:column;padding:clamp(6px,1.5vw,10px);gap:8px;width:100%;min-height:auto}
  .bc-sidebar{max-width:100%;min-width:0;width:100%}
  .bc-sidebar{max-height:none;overflow:visible}
  .bc-game-field{width:100%;min-height:clamp(280px,52dvh,560px);max-height:none}
  .dice-3d-wrapper,.dice-cube{width:70px;height:70px}
  .dice-face{width:70px;height:70px;border-radius:10px;font-size:24px}
  .dice-face .dice-dot{width:10px;height:10px}
  .dice-face .dice-dots{padding:10px;gap:4px}
  .dice-face.f1{transform:translateZ(35px)}.dice-face.f2{transform:rotateY(180deg)translateZ(35px)}.dice-face.f3{transform:rotateY(90deg)translateZ(35px)}.dice-face.f4{transform:rotateY(-90deg)translateZ(35px)}.dice-face.f5{transform:rotateX(90deg)translateZ(35px)}.dice-face.f6{transform:rotateX(-90deg)translateZ(35px)}
  .dice-win-display{font-size:36px}
  .crash-multiplier{font-size:42px}
  .crash-graph-area{min-height:0}
  .wheel-wrapper{width:min(200px,60vw);height:min(200px,60vw)}
  .roulette-wheel{width:min(200px,60vw);height:min(200px,60vw)}
  .roulette-center{width:56px;height:56px}.roulette-timer{font-size:20px}
  .wheel-bets-grid{grid-template-columns:1fr 1fr}
  .jackpot-pot{width:120px;height:120px}
  .jackpot-bank-amount{font-size:28px}
  .mines-grid{gap:4px;padding:10px;max-width:100%}
  .slots-grid{grid-template-columns:repeat(auto-fill,minmax(min(100px,42%),1fr));gap:6px;padding:10px}
  .plinko-layout{height:calc(100dvh - 166px);min-height:0;gap:6px;padding:0!important}
  .plinko-visual{padding:6px;gap:6px}
  .plinko-topbar{padding:8px 10px}
  .bc-game-field.plinko-game-field{min-height:auto!important;height:auto!important}
  .plinko-game-field{order:1}
  .plinko-sidebar{order:2;padding:6px!important;gap:6px!important;min-width:0;max-height:none;overflow:visible}
  .plinko-controls{gap:5px}
  .plinko-sidebar .bc-balance-box{margin-bottom:3px;padding:5px}
  .plinko-sidebar .bc-balance-label{font-size:9px}
  .plinko-sidebar .bc-balance-value{font-size:13px}
  .plinko-sidebar label{font-size:9px}
  .plinko-sidebar input[type=number]{height:30px;font-size:11px}
  .plinko-sidebar .bc-btn-row button{padding:3px 0;font-size:9px}
  .plinko-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .plinko-control-item .plinko-pill-row{gap:4px}
  .plinko-control-item .plinko-pill{padding:4px 7px;font-size:10px;line-height:1}
  .plinko-control-item .bc-play-btn{height:100%;min-height:32px;padding:6px;font-size:12px}
  .plinko-stats{gap:4px}
  .plinko-stat{padding:5px}
  .plinko-stat-label{font-size:9px}
  .plinko-stat-value{font-size:12px}
  .plinko-board-wrap{min-height:clamp(120px,28dvh,200px)}
  .plinko-bins{gap:2px;padding-top:4px}
  .plinko-bin{padding:4px 0;font-size:8px;border-radius:5px}
}
@media(max-width:480px){
  .bc-game-area{padding:4px;gap:6px}
  .bc-sidebar{padding:10px;gap:10px;min-width:0;max-width:100%;border-radius:10px}
  .bc-sidebar label{font-size:11px}
  .bc-sidebar input[type=number]{height:36px;font-size:13px}
  .bc-play-btn{padding:10px;font-size:13px}
  .bc-btn-row button{font-size:11px;padding:5px 0}
  .bc-game-field{border-radius:10px;min-height:clamp(240px,48dvh,520px)}
  .dice-3d-wrapper,.dice-cube{width:56px;height:56px}
  .dice-face{width:56px;height:56px;font-size:20px}
  .dice-face.f1{transform:translateZ(28px)}.dice-face.f2{transform:rotateY(180deg)translateZ(28px)}.dice-face.f3{transform:rotateY(90deg)translateZ(28px)}.dice-face.f4{transform:rotateY(-90deg)translateZ(28px)}.dice-face.f5{transform:rotateX(90deg)translateZ(28px)}.dice-face.f6{transform:rotateX(-90deg)translateZ(28px)}
  .dice-win-display{font-size:28px}
  .crash-multiplier{font-size:32px}
  .crash-graph-area{min-height:0}
  .wheel-wrapper{width:min(160px,55vw);height:min(160px,55vw)}
  .roulette-wheel{width:min(160px,55vw);height:min(160px,55vw)}
  .roulette-center{width:44px;height:44px}.roulette-timer{font-size:16px}
  .jackpot-pot{width:90px;height:90px}
  .jackpot-bank-amount{font-size:22px}
  .mines-grid{max-width:100%;gap:3px;padding:8px}
  .mines-cell{border-radius:6px}
  .wheel-bet-colors{grid-template-columns:repeat(2,1fr)}
  .plinko-layout{height:calc(100dvh - 158px);gap:4px}
  .plinko-visual{padding:4px;gap:4px}
  .plinko-topbar{padding:6px 8px}
  .plinko-topbar span{font-size:10px!important}
  .bc-game-field.plinko-game-field{min-height:auto!important;height:auto!important}
  .plinko-game-field{order:1}
  .plinko-sidebar{order:2;padding:5px!important;gap:5px!important}
  .plinko-sidebar .bc-balance-box{padding:4px}
  .plinko-sidebar .bc-balance-label{font-size:8px}
  .plinko-sidebar .bc-balance-value{font-size:12px}
  .plinko-sidebar input[type=number]{height:28px;font-size:10px;padding:0 8px}
  .plinko-sidebar .bc-btn-row button{padding:2px 0;font-size:8px}
  .plinko-control-grid{gap:4px}
  .plinko-control-item .plinko-pill{padding:4px 6px;font-size:9px}
  .plinko-control-item .bc-play-btn{min-height:28px;padding:5px;font-size:11px}
  .plinko-stat{padding:4px}
  .plinko-stat-label{font-size:8px}
  .plinko-stat-value{font-size:11px}
  .plinko-board-wrap{min-height:clamp(96px,23dvh,150px)}
  .plinko-bin{padding:3px 0;font-size:7px}
  .plinko-pill{padding:4px 6px;font-size:9px}
}
@media(max-width:360px){
  .plinko-layout{height:calc(100dvh - 152px)}
  .plinko-topbar span{font-size:9px!important}
  .plinko-sidebar .bc-balance-value{font-size:11px}
  .plinko-sidebar input[type=number]{height:26px;font-size:9px}
  .plinko-control-item .bc-play-btn{min-height:26px;font-size:10px}
  .plinko-board-wrap{min-height:clamp(84px,20dvh,124px)}
  .plinko-bin{font-size:6px}
}
@media(max-height:740px){
  .plinko-layout{height:calc(100dvh - 148px)}
  .plinko-board-wrap{min-height:clamp(84px,20dvh,136px)}
}
@media(max-height:640px){
  .plinko-layout{height:calc(100dvh - 140px)}
  .plinko-topbar{padding:5px 8px}
  .plinko-board-wrap{min-height:clamp(72px,17dvh,110px)}
}
/* --- Enhanced visuals --- */
.dice-cube{filter:drop-shadow(0 4px 15px rgba(0,0,0,.4))}
.dice-cube.rolling{filter:drop-shadow(0 0 20px rgba(0,231,1,.4))}
.mines-cell.gem::after,.mines-cell.bomb::after{content:none!important}
.mines-cell.gem{background:linear-gradient(135deg,#0f4a0f,#1a5c1a)!important;border-color:#22c55e!important;box-shadow:0 0 12px rgba(34,197,94,.3)}
.mines-cell.bomb{background:linear-gradient(135deg,#4a0f0f,#5c1a1a)!important;border-color:#ef4444!important;box-shadow:0 0 12px rgba(239,68,68,.3)}
.mines-cell.revealed{cursor:default!important}
.jackpot-bank-amount{animation:jackpotGlow 2s ease-in-out infinite}
@keyframes jackpotGlow{0%,100%{text-shadow:0 0 25px rgba(251,191,36,.4)}50%{text-shadow:0 0 40px rgba(251,191,36,.6),0 0 80px rgba(251,191,36,.2)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}
.roulette-wheel{box-shadow:0 0 40px rgba(251,191,36,.15),inset 0 0 30px rgba(0,0,0,.3)}
.roulette-pointer{filter:drop-shadow(0 0 8px rgba(0,231,1,.6))}
.dice-result-msg.win{animation:winPulse .5s ease}
.dice-result-msg.lose{animation:losePulse .5s ease}
@keyframes winPulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes losePulse{0%{transform:scale(1)}50%{transform:scale(0.98)}100%{transform:scale(1)}}
.bc-balance-box{text-align:center;padding:8px;background:rgba(0,231,1,.08);border-radius:8px;margin-bottom:8px}
.bc-balance-label{font-size:11px;color:#7a8a9a;text-transform:uppercase;font-weight:600}
.bc-balance-value{font-size:18px;font-weight:800;color:#00e701}
/* --- Notifications --- */
.game-notification-container{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.game-toast{padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;color:#fff;animation:toastSlide 0.3s ease-out;pointer-events:auto;box-shadow:0 4px 20px rgba(0,0,0,.4);white-space:nowrap}
.game-toast.win{background:linear-gradient(135deg,#059669,#10b981);border:1px solid #34d399}
.game-toast.lose{background:linear-gradient(135deg,#dc2626,#ef4444);border:1px solid #f87171}
.game-toast.info{background:linear-gradient(135deg,#2563eb,#3b82f6);border:1px solid #60a5fa}
@keyframes toastSlide{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
`;
