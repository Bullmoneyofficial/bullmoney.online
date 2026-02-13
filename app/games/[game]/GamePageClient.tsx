'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import BullcasinoShell from '../components/BullcasinoShell';
import { phpGameApi, PHP_BACKEND_URL } from '@/lib/php-backend-api';

/* ───────────────────────────────────────────
   Inline game-specific CSS (animations, etc.)
   ─────────────────────────────────────────── */
const GAME_STYLES = `
/* ─── Shared game area ─── */
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

/* ─── Dice ─── */
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

/* ─── Crash ─── */
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

/* ─── Wheel (Roulette) ─── */
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

/* ─── Jackpot ─── */
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

/* ─── Mines ─── (already good – just refine grid) */
.mines-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:clamp(4px,1vw,8px);padding:clamp(8px,2vw,16px);width:100%;max-width:min(380px,100%);margin:0 auto;box-sizing:border-box}
.mines-cell{aspect-ratio:1;border-radius:10px;background:#213743;border:2px solid #2f4553;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:clamp(16px,3vw,24px);transition:all .15s;position:relative;overflow:hidden}
.mines-cell:hover:not(.revealed){transform:scale(1.08);border-color:#00e701;box-shadow:0 0 12px rgba(0,231,1,.25)}
.mines-cell.gem{background:#00e701;border-color:#00e701}.mines-cell.gem::after{content:'💎';font-size:22px}
.mines-cell.bomb{background:#ed4245;border-color:#ed4245}.mines-cell.bomb::after{content:'💣';font-size:22px}
.mines-coefs-bar{display:flex;gap:4px;padding:10px 14px;background:rgba(33,55,67,.6);overflow-x:auto;flex-shrink:0}
.mines-coef-chip{padding:5px 14px;border:2px solid rgba(255,255,255,.12);border-radius:10px;font-size:12px;font-weight:600;color:#b1bad3;white-space:nowrap;flex-shrink:0;transition:all .2s}
.mines-coef-chip.active{border-color:#00e701;color:#fff}

/* ─── Slots ─── */
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

/* ─── Plinko ─── */
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

/* ─── Mobile responsive ─── */
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
/* ─── Enhanced visuals ─── */
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
/* ─── Notifications ─── */
.game-notification-container{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.game-toast{padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;color:#fff;animation:toastSlide 0.3s ease-out;pointer-events:auto;box-shadow:0 4px 20px rgba(0,0,0,.4);white-space:nowrap}
.game-toast.win{background:linear-gradient(135deg,#059669,#10b981);border:1px solid #34d399}
.game-toast.lose{background:linear-gradient(135deg,#dc2626,#ef4444);border:1px solid #f87171}
.game-toast.info{background:linear-gradient(135deg,#2563eb,#3b82f6);border:1px solid #60a5fa}
@keyframes toastSlide{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

/* ───────────────────────────────────────────
   Shared helpers
   ─────────────────────────────────────────── */
function jq(selector: string) {
  return typeof window !== 'undefined' ? (window as any).$?.(selector) : null;
}

function BetSidebar({ inputClass, children }: { inputClass: string; children?: React.ReactNode }) {
  const setVal = (delta: number | 'min' | 'max') => {
    const el = jq(`.${inputClass}`);
    if (!el) return;
    if (delta === 'min') el.val(1);
    else if (delta === 'max') el.val(jq('#balance')?.text() || 0);
    else el.val(+(el.val() || 0) + delta);
  };
  return (
    <div className="bc-sidebar">
      <div>
        <label>Bet</label>
        <input type="number" className={`${inputClass}`} defaultValue={1} min={1} />
        <div className="bc-btn-row">
          <button onClick={() => setVal(1)}>+1</button>
          <button onClick={() => setVal(10)}>+10</button>
          <button onClick={() => setVal(100)}>+100</button>
          <button onClick={() => setVal('min')}>Min</button>
          <button onClick={() => setVal('max')}>Max</button>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────
   Sequential Script Loader
   ─────────────────────────────────────────── */
function useSequentialScripts(srcs: string[]) {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    let cancelled = false;
    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (cancelled) return reject('cancelled');
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
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
        try { await loadScript(src); } catch (e) { if (e !== 'cancelled') console.warn(e); }
      }
    })();
    return () => { cancelled = true; };
  }, [srcs]);
}

/* ───────────────────────────────────────────
   Notification helper — top center toasts
   ─────────────────────────────────────────── */
function showGameNotification(text: string, type: 'win' | 'lose' | 'info') {
  if (typeof window === 'undefined') return;
  let container = document.getElementById('game-notifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-notifications';
    container.className = 'game-notification-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `game-toast ${type}`;
  toast.textContent = text;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* Face rotation map for 3D dice —
   Materials order [3,4,5,6,1,2] maps to box faces [+X,-X,+Y,-Y,+Z,-Z].
   Camera at [0,0,4] sees the +Z face as "front".
   Each entry rotates so the face with that number's texture faces the camera. */
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },              // texture "1" on +Z — already front
  2: { x: 0, y: Math.PI },        // texture "2" on -Z — rotate 180° Y
  3: { x: 0, y: -Math.PI / 2 },   // texture "3" on +X — rotate -90° Y brings +X to front
  4: { x: 0, y: Math.PI / 2 },    // texture "4" on -X — rotate +90° Y brings -X to front
  5: { x: Math.PI / 2, y: 0 },    // texture "5" on +Y — rotate +90° X brings +Y to front
  6: { x: -Math.PI / 2, y: 0 },   // texture "6" on -Y — rotate -90° X brings -Y to front
};

/* Render a number (the roll value) on a colored dice face */
function createNumberFaceTexture(text: string, bgColor: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Rounded background
  const r = 28;
  ctx.beginPath();
  ctx.roundRect(4, 4, size - 8, size - 8, r);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Number text
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

  // Rebuild face textures when the displayed roll value changes
  if (displayValue !== prevValueRef.current && typeof window !== 'undefined') {
    prevValueRef.current = displayValue;
    // Dispose old
    materialsRef.current.forEach(m => { m.map?.dispose(); m.dispose(); });
    // All 6 faces show the same roll number with different accent colors
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

const CRASH_STARS = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 37) % 100) / 10 - 5,
  y: ((i * 53) % 80) / 10 - 3.5,
  z: -((i * 29) % 30) / 10,
}));

function Crash3DView({ multiplier, gameState, cashedOut }: { multiplier: number; gameState: 'waiting' | 'running' | 'crashed'; cashedOut: boolean }) {
  return (
    <div className="game-canvas-wrap">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 2]}>
        <Crash3DScene stars={CRASH_STARS} multiplier={multiplier} gameState={gameState} cashedOut={cashedOut} />
      </Canvas>
    </div>
  );
}

function Crash3DScene({
  stars,
  multiplier,
  gameState,
  cashedOut,
}: {
  stars: { x: number; y: number; z: number }[];
  multiplier: number;
  gameState: 'waiting' | 'running' | 'crashed';
  cashedOut: boolean;
}) {
  const running = gameState === 'running';
  const progress = Math.min(1, Math.max(0, (multiplier - 1) / 5));
  const rocketX = -2.4 + progress * 4.5;
  const rocketY = -1.4 + progress * 2.4;
  const rocketRot = running ? -0.6 : -0.15;
  const trailScale = running ? 0.7 + progress * 0.8 : 0.35;
  const trailOpacity = running ? 0.55 : 0.25;

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <pointLight position={[-2, -1, 2]} intensity={0.5} color={gameState === 'crashed' && !cashedOut ? '#ef4444' : '#00e701'} />
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#dbeafe" />
        </mesh>
      ))}
      <mesh position={[-1.2, -1.05, -0.4]} scale={[trailScale, 1, 1]}>
        <cylinderGeometry args={[0.08, 0.3, 2.8, 16]} />
        <meshBasicMaterial color={gameState === 'crashed' && !cashedOut ? '#ef4444' : '#22c55e'} transparent opacity={trailOpacity} />
      </mesh>
      <group position={[rocketX, rocketY, 0]} rotation={[0, 0, rocketRot]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.9, 20]} />
          <meshStandardMaterial color={gameState === 'crashed' && !cashedOut ? '#ef4444' : '#e2e8f0'} metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.45, 16]} />
          <meshStandardMaterial color={gameState === 'crashed' && !cashedOut ? '#f97316' : '#facc15'} emissive={gameState === 'running' ? '#f97316' : '#000000'} emissiveIntensity={0.7} />
        </mesh>
      </group>
    </>
  );
}

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

function Wheel3DScene({
  rotationDeg,
  segments,
}: {
  rotationDeg: number;
  segments: readonly ('black'|'yellow'|'red'|'green')[];
}) {
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

function Jackpot3DView({ pool, rolling }: { pool: number; rolling: boolean }) {
  return (
    <div className="game-canvas-wrap sm">
      <Canvas camera={{ position: [0, 0.2, 6], fov: 45 }} dpr={[1, 2]}>
        <Jackpot3DScene pool={pool} rolling={rolling} />
      </Canvas>
    </div>
  );
}

function Jackpot3DScene({ pool, rolling }: { pool: number; rolling: boolean }) {
  const cupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!cupRef.current) return;
    cupRef.current.rotation.y = state.clock.elapsedTime * (rolling ? 1.8 : 0.7);
    cupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2.5, 4, 4]} intensity={1.1} />
      <pointLight position={[0, 0.5, 1]} intensity={0.7} color="#fbbf24" />
      <group ref={cupRef}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.85, 1.25, 1.5, 28]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.65} roughness={0.22} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <torusGeometry args={[1.08, 0.12, 20, 50]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.95, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 0.5, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
      {Array.from({ length: Math.min(12, Math.max(3, Math.floor(pool / 20))) }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.7) * 1.6, -1.35 + (i % 3) * 0.12, Math.sin(i * 0.7) * 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 20]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
    </>
  );
}

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

/* ═══════════════════════════════════════════
   DICE — 3D rotating dice + result UI
   ═══════════════════════════════════════════ */
function DiceDots({ n }: { n: number }) {
  return (
    <div className={`dice-dots d${n}`}>
      {Array.from({ length: n }, (_, i) => <div key={i} className="dice-dot" />)}
    </div>
  );
}

function DiceContent() {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ type: 'win' | 'lose' | null; text: string }>({ type: null, text: 'Place your bet!' });
  const [chance, setChance] = useState(50);
  const [bet, setBet] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [lastRoll, setLastRoll] = useState(50.00);
  const [diceFace, setDiceFace] = useState(1);
  const [diceSpinKey, setDiceSpinKey] = useState(0);

  const winAmount = ((100 / chance) * bet).toFixed(2);

  const playDice = useCallback(async (type: 'under' | 'over') => {
    if (rolling || bet <= 0 || bet > balance) return;
    setRolling(true);
    
    try {
      //  Call PHP backend API
      const apiType = type === 'under' ? 'min' : 'max';
      const data = await phpGameApi.dice.bet(bet, chance, apiType);
      
      if (data.type === 'success' && data.out) {
        const random = data.random || 0;
        const roll = Number(((random / 999999) * 100).toFixed(2));
        setLastRoll(roll);
        
        // Update dice face animation
        const nextFace = (random % 6) + 1;
        setDiceFace(nextFace);
        setDiceSpinKey(k => k + 1);
        
        setTimeout(() => {
          setRolling(false);
          const isWin = data.out === 'win';
          const winnings = data.cash || 0;
          
          if (isWin) {
            setBalance(data.balance);
            setResult({ type: 'win', text: `Won $${winnings.toFixed(2)}! Roll: ${roll.toFixed(2)}` });
            showGameNotification(`🎲 Won $${winnings.toFixed(2)}!`, 'win');
          } else {
            setBalance(data.balance);
            setResult({ type: 'lose', text: `Lost! Roll: ${roll.toFixed(2)}` });
            showGameNotification(`🎲 Lost $${bet.toFixed(2)}`, 'lose');
          }
        }, 760);
      } else {
        setRolling(false);
        showGameNotification(data.msg || 'Bet failed', 'lose');
      }
    } catch (error: any) {
      setRolling(false);
      console.error('Dice bet error:', error);
      showGameNotification(error.message || 'Failed to place bet', 'lose');
    }
  }, [rolling, bet, balance, chance]);

  // Expose animateDiceResult for legacy dice.js (PHP API path)
  useEffect(() => {
    (window as any).animateDiceResult = (face: number, random?: number) => {
      setDiceFace(face);
      setDiceSpinKey(k => k + 1);
      // If PHP sends the raw random (0-999999), convert to 0-100 for display
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
          {/* 3D Dice — shows actual roll value on all faces */}
          <Dice3DView spinKey={diceSpinKey} face={diceFace} displayValue={lastRoll.toFixed(2)} />
          {/* Win Amount */}
          <div className="dice-win-display">${winAmount}</div>
          <div className="dice-win-label">Possible win</div>
          <div style={{color:'#b1bad3',fontSize:'13px',fontWeight:500}}>
            Last Roll: <span style={{color:'#fff',fontWeight:700}}>{lastRoll}</span>
          </div>
          {/* Chance bar */}
          <div className="dice-chance-bar">
            <div className="dice-chance-fill" style={{ width: `${chance}%` }} />
          </div>
          {/* Under / Over buttons */}
          <div className="dice-result-bar">
            <button className="under-btn" disabled={rolling || bet > balance} onClick={() => playDice('under')}>
              {rolling ? 'Rolling...' : `Roll Under ${chance}`}
            </button>
            <button className="over-btn" disabled={rolling || bet > balance} onClick={() => playDice('over')}>
              {rolling ? 'Rolling...' : `Roll Over ${100 - chance}`}
            </button>
          </div>
          {/* Result */}
          <div className={`dice-result-msg ${result.type === 'win' ? 'win' : result.type === 'lose' ? 'lose' : ''}`}>
            {result.text}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CRASH — Rocket + multiplier graph
   ═══════════════════════════════════════════ */
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

function CrashContent() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(1);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [multiplier, setMultiplier] = useState(1.00);
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
    setMultiplier(1.00);
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
        showGameNotification(`🚀 Crashed at ${crashRef.current.toFixed(2)}x`, 'lose');
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
    showGameNotification(`🚀 Cashed out $${winnings.toFixed(2)} at ${multiplier.toFixed(2)}x!`, 'win');
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
                 cashedOut ? `Cashed out at ${cashoutAt.toFixed(2)}x — Won $${(bet * cashoutAt).toFixed(2)}!` :
                 `Crashed at ${crashRef.current.toFixed(2)}x`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   WHEEL — Proper roulette wheel with segments
   ═══════════════════════════════════════════ */
function RouletteWheelSVG() {
  const segments = [
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','yellow','black','red',
    'black','yellow','black','red','black','green',
  ];
  const colors: Record<string, string> = { black: '#1a1a2e', yellow: '#f59e0b', red: '#ef4444', green: '#22c55e' };
  const mults: Record<string, string> = { black: '2x', yellow: '3x', red: '5x', green: '50x' };
  const segAngle = 360 / segments.length;
  const cx = 150, cy = 150, r = 140, ir = 55;

  return (
    <svg viewBox="0 0 300 300" width="100%" height="100%">
      <defs>
        <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24"/><stop offset="50%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
        <radialGradient id="wheelShine" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id="wheelGlow"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#fbbf24" floodOpacity="0.3"/></filter>
      </defs>
      <circle cx={cx} cy={cy} r="149" fill="none" stroke="url(#goldRing)" strokeWidth="8" filter="url(#wheelGlow)"/>
      <circle cx={cx} cy={cy} r="145" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="1"/>
      {segments.map((seg, i) => {
        const a1 = (i * segAngle - 90) * Math.PI / 180;
        const a2 = ((i + 1) * segAngle - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        const ix1 = cx + ir * Math.cos(a1), iy1 = cy + ir * Math.sin(a1);
        const ix2 = cx + ir * Math.cos(a2), iy2 = cy + ir * Math.sin(a2);
        return (
          <path key={i} d={`M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 0,0 ${ix1},${iy1} Z`}
            fill={colors[seg]} stroke="rgba(0,0,0,.3)" strokeWidth="0.5"/>
        );
      })}
      {segments.map((seg, i) => {
        const mid = ((i + 0.5) * segAngle - 90) * Math.PI / 180;
        const tr = (r + ir) / 2;
        return (
          <text key={`t${i}`} x={cx + tr * Math.cos(mid)} y={cy + tr * Math.sin(mid)}
            fill="#fff" fontSize="8" fontWeight="700" textAnchor="middle" dominantBaseline="central"
            transform={`rotate(${(i + 0.5) * segAngle}, ${cx + tr * Math.cos(mid)}, ${cy + tr * Math.sin(mid)})`}>
            {mults[seg]}
          </text>
        );
      })}
      {segments.map((_, i) => {
        const a = (i * segAngle - 90) * Math.PI / 180;
        return <circle key={`s${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="3" fill="#fbbf24" stroke="#000" strokeWidth="0.5"/>;
      })}
      <circle cx={cx} cy={cy} r={r} fill="url(#wheelShine)"/>
      <circle cx={cx} cy={cy} r={ir} fill="#0f172a" stroke="#fbbf24" strokeWidth="3"/>
      <circle cx={cx} cy={cy} r={ir - 6} fill="#0a0f1e" stroke="rgba(255,255,255,.1)" strokeWidth="1"/>
    </svg>
  );
}

function WheelContent() {
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
        showGameNotification(`🎡 Won $${winnings.toFixed(2)}!`, 'win');
      } else {
        setResult({type:'lose',text:`${winColor.toUpperCase()} \u2014 you picked ${selectedColor}`});
        showGameNotification(`🎡 Lost $${bet.toFixed(2)}`, 'lose');
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

/* ═══════════════════════════════════════════
   JACKPOT — Trophy/pot with rings, timer, players
   ═══════════════════════════════════════════ */
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

function JackpotContent() {
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
  }, [gameState, bet, balance]);

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
        showGameNotification(`🏆 Jackpot! Won $${totalBets.toFixed(2)}!`, 'win');
      } else {
        showGameNotification(`🏆 ${winnerP.name} won the jackpot`, 'lose');
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

/* ═══════════════════════════════════════════
   MINES — Improved grid with visual cells
   ═══════════════════════════════════════════ */
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

function MinesContent() {
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

  const startGame = useCallback(async () => {
    if (bet <= 0 || bet > balance) return;
    
    try {
      // Call PHP backend to create mines game
      const data = await phpGameApi.mines.create(numBombs, bet);
      
      if (data.msg) {
        // Success - PHP created the game session
        setBombs(new Set()); // Will be revealed when cells are opened
        setBoard(Array(25).fill('hidden'));
        setRevealed(0);
        setCurrentMult(1);
        setGameState('playing');
        setBalance(data.balance); // Update balance from server
      } else {
        showGameNotification(data.msg || 'Failed to start game', 'lose');
      }
    } catch (error: any) {
      console.error('Mines create error:', error);
      showGameNotification(error.message || 'Failed to start game', 'lose');
    }
  }, [bet, balance, numBombs]);

  const revealCell = useCallback(async (idx: number) => {
    if (gameState !== 'playing' || board[idx] !== 'hidden') return;
    
    try {
      // Call PHP backend to open cell (+1 because PHP uses 1-25, not 0-24)
      const data = await phpGameApi.mines.open(idx + 1);
      
      const newBoard = [...board];
      
      if (data.error || data.status === 'lose') {
        // Hit a bomb
        newBoard[idx] = 'bomb';
        if (data.bombs) {
          // Show all bombs from server response
          data.bombs.forEach((bombCell: number) => {
            newBoard[bombCell - 1] = 'bomb'; // Convert from 1-based to 0-based
          });
        }
        for (let i = 0; i < 25; i++) {
          if (newBoard[i] === 'hidden') newBoard[i] = 'gem';
        }
        setBoard(newBoard);
        setGameState('lost');
        showGameNotification(`💣 Hit a mine! Lost $${bet.toFixed(2)}`, 'lose');
      } else {
        // Found a gem
        newBoard[idx] = 'gem';
        const newRev = revealed + 1;
        const newM = data.multiplier || getMult(newRev, numBombs);
        setBoard(newBoard);
        setRevealed(newRev);
        setCurrentMult(newM);
        
        if (data.balance) {
          setBalance(data.balance);
        }
        
        if (newRev >= 25 - numBombs) {
          const winnings = data.win || bet * newM;
          setGameState('won');
          showGameNotification(`💎 All gems found! Won $${winnings.toFixed(2)}!`, 'win');
        }
      }
    } catch (error: any) {
      console.error('Mines open cell error:', error);
      showGameNotification(error.message || 'Failed to open cell', 'lose');
    }
  }, [gameState, board, bombs, revealed, numBombs, bet, getMult]);

  const cashOut = useCallback(async () => {
    if (gameState !== 'playing' || revealed === 0) return;
    
    try {
      // Call PHP backend to cash out
      const data = await phpGameApi.mines.take();
      
      if (data.error) {
        showGameNotification(data.msg || 'Failed to cash out', 'lose');
      } else {
        const winnings = data.win || Number((bet * currentMult).toFixed(2));
        setBalance(data.balance);
        
        const newBoard = [...board];
        if (data.bombs) {
          //Show all bombs from server
          data.bombs.forEach((bombCell: number) => {
            newBoard[bombCell - 1] = 'bomb';
          });
        }
        for (let i = 0; i < 25; i++) {
          if (newBoard[i] === 'hidden' && !data.bombs?.includes(i + 1)) {
            newBoard[i] = 'gem';
          }
        }
        setBoard(newBoard);
        setGameState('won');
        showGameNotification(`💎 Cashed out $${winnings.toFixed(2)} at x${currentMult.toFixed(2)}!`, 'win');
      }
    } catch (error: any) {
      console.error('Mines cash out error:', error);
      showGameNotification(error.message || 'Failed to cash out', 'lose');
    }
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

/* ═══════════════════════════════════════════
   SLOTS — Grid placeholder
   ═══════════════════════════════════════════ */
function SlotsContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    rtp: number;
    volatility: 'Low' | 'Medium' | 'High';
    minBet: number;
    maxBet: number;
    thumbnail: string;
    demoUrl: string;
    tags: string[];
  }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/casino/slots', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setGames(Array.isArray(data?.games) ? data.games : []);
      } catch {
        if (!cancelled) setError('Slots service unavailable right now');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bc-game-area" style={{ flexDirection: 'column' }}>
      <div className="bc-game-field" style={{ width: '100%' }}>
        <div className="slots-header">
          <div>
            <div className="slots-title">Slots Vault</div>
            <div className="slots-subtitle">Free demo backend enabled</div>
          </div>
          <div className="slots-subtitle">{loading ? 'Loading...' : `${games.length} games`}</div>
        </div>
        {error ? (
          <div className="slots-placeholder">{error}</div>
        ) : loading ? (
          <div className="slots-placeholder">Loading free slots catalog...</div>
        ) : (
          <div className="slots-grid">
            {games.map((game) => (
              <div key={game.id} className="slots-card">
                <div className="slots-card-top">
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackStep) {
                        img.dataset.fallbackStep = '1';
                        img.src = '/v2/slots/kingofslots.jpg';
                        return;
                      }
                      if (img.dataset.fallbackStep === '1') img.src = '/v2/slots/kingofslots.jpg';
                    }}
                  />
                </div>
                <div className="slots-card-body">
                  <div className="slots-name">{game.name}</div>
                  <div className="slots-meta">{game.provider} • RTP {game.rtp}% • {game.volatility}</div>
                  <div className="slots-meta">${game.minBet.toFixed(2)} - ${game.maxBet.toFixed(2)}</div>
                  <div className="slots-tags">
                    {game.tags.slice(0, 3).map(tag => <span key={tag} className="slots-tag">{tag}</span>)}
                  </div>
                  <button type="button" className="slots-play-btn disabled">
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PLINKO — Stake-inspired demo board
   ═══════════════════════════════════════════ */
function PlinkoContent() {
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

  const dropBall = useCallback(async () => {
    const totalStake = Number((bet * ballsPerDrop).toFixed(2));
    if (dropping || bet <= 0 || totalStake > balance) return;

    setDropping(true);
    setLastBin(null);
    setLastWin(0);

    let settled = 0;
    let totalWin = 0;

    for (let ballIndex = 0; ballIndex < ballsPerDrop; ballIndex++) {
      (async () => {
        try {
          // Call PHP backend for each ball drop
          const data = await phpGameApi.plinko.play(bet, rows, risk);
          
          if (data.error) {
            showGameNotification(data.msg || 'Failed to drop ball', 'lose');
            settled += 1;
            if (settled >= ballsPerDrop) {
              setDropping(false);
            }
            return;
          }

          const ballId = Date.now() + ballIndex;
          // Generate visual path to match server's position result
          // Server returns position 0-(rows), we animate a path to reach that position
          const binIndex = data.position || 0;
          const generatedPath: number[] = [0];
          let column = 0;
          for (let i = 0; i < rows; i++) {
            // Bias the random selection to end up at binIndex
            const targetRatio = binIndex /rows;
            const currentRatio = column / (i + 1);
            const shouldGoRight = Math.random() < (i < rows - 1 ? 0.5 : (binIndex > column ? 0.9 : 0.1));
            if (shouldGoRight && column < rows) column += 1;
            generatedPath.push(column);
          }
          // Force final position to match server result
          generatedPath[generatedPath.length - 1] = binIndex;

          window.setTimeout(() => {
            setActiveBalls(prev => [...prev, { id: ballId, path: generatedPath, step: 0 }]);

            let localStep = 0;
            const timer = window.setInterval(() => {
              localStep += 1;
              setActiveBalls(prev => prev.map(ball => (ball.id === ballId ? { ...ball, step: localStep } : ball)));

              if (localStep >= rows) {
                window.clearInterval(timer);

                const mult = data.multiplier || multipliers[binIndex] || 0;
                const win = data.win || Number((bet * mult).toFixed(2));
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

                // Remove from active balls and add to settled balls
                setActiveBalls(prev => prev.filter(ball => ball.id !== ballId));
                setSettledBalls(prev => [...prev, { id: ballId, binIndex }]);
                
                // Remove settled ball after 2 seconds
                window.setTimeout(() => {
                  setSettledBalls(prev => prev.filter(ball => ball.id !== ballId));
                }, 2000);

                if (settled >= ballsPerDrop) {
                  const payout = Number(totalWin.toFixed(2));
                  const profit = Number((payout - totalStake).toFixed(2));
                  setLastWin(payout);
                  // Update balance from last server response
                  if (data.balance) {
                    setBalance(data.balance);
                  } else {
                    setBalance(prev => Number((prev + payout).toFixed(2)));
                  }
                  setDropping(false);

                  if (profit > 0) {
                    showGameNotification(`🎯 ${ballsPerDrop} balls settled — +$${profit.toFixed(2)} profit`, 'win');
                  } else {
                    showGameNotification(`🎯 ${ballsPerDrop} balls settled — returned $${payout.toFixed(2)}`, 'info');
                  }
                }
              }
            }, 130);
          }, ballIndex * 120);
        } catch (error: any) {
          console.error('Plinko drop error:', error);
          showGameNotification(error.message || 'Failed to drop ball', 'lose');
          settled += 1;
          if (settled >= ballsPerDrop) {
            setDropping(false);
          }
        }
      })();
    }
  }, [balance, ballsPerDrop, bet, dropping, multipliers, rows, risk]);

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
                {dropping ? 'Dropping…' : 'Bet'}
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
                  x{history[0].mult} · ${history[0].win.toFixed(2)}
                </span>
              ) : (
                <div className="plinko-stat-value">—</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bc-game-field">
        <div className="plinko-topbar">
          <span style={{ color: '#b1bad3', fontSize: 13, fontWeight: 600 }}>
            Stake-style Plinko · {rows} rows · {risk} risk · {ballsPerDrop} balls
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

/* ═══════════════════════════════════════════
   FLAPPY BIRD — React Component
   ═══════════════════════════════════════════ */
function FlappyBirdContent() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);

  useEffect(() => {
    // Expose balance to FlappyBird.js
    (window as any).flappyBirdBalance = balance;
    (window as any).flappyBirdSetBalance = setBalance;
  }, [balance]);

  return (
    <div className="bc-game-area">
      <div className="bc-game-field" style={{ flex: 1 }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
          {/* Game Status */}
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

          {/* SVG Canvas Container */}
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

          {/* Footer Stats */}
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

          {/* Stats Display */}
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

          {/* Action Buttons */}
          <button className="bc-play-btn green flappy__play" style={{ marginBottom: '8px' }}>
            Start Game
          </button>
          <button className="bc-play-btn red flappy__cashout" style={{ display: 'none' }}>
            Cash Out
          </button>

          {/* Result Display */}
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

          {/* Info Section */}
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '12px',
            color: '#7a8a9a',
            lineHeight: 1.6
          }}>
            <p style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#b1bad3' }}>💡 Pro Tip:</strong> Each pipe you pass increases your multiplier by 0.1x!
            </p>
            <p>
              <strong style={{ color: '#b1bad3' }}>🎮 Controls:</strong> Click or press SPACE to flap
            </p>
          </div>

          {/* Balance Display */}
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

/* ═══════════════════════════════════════════
   Router + Page Shell
   ═══════════════════════════════════════════ */
function getGameContent(game: string) {
  switch (game) {
    case 'dice': return <DiceContent />;
    case 'mines': return <MinesContent />;
    case 'plinko': return <PlinkoContent />;
    case 'wheel': return <WheelContent />;
    case 'jackpot': return <JackpotContent />;
    case 'crash': return <CrashContent />;
    case 'slots': return <SlotsContent />;
    case 'flappybird': return <FlappyBirdContent />;
    default: return null;
  }
}

function getGameScripts(game: string) {
  const scripts: string[] = [];
  if (game === 'dice') scripts.push('/assets/js/dice.js');
  if (game === 'mines') scripts.push('/assets/js/mines.js');
  if (game === 'crash') scripts.push('/assets/js/jquery.flot.min.js', '/assets/js/chart.js', '/assets/js/crash.js');
  if (game === 'flappybird') {
    scripts.push('https://code.jquery.com/jquery-3.6.0.min.js');
    scripts.push('/games/bullcasino/js/flappybird.js');
  }
  return scripts;
}

export default function CasinoGamePage({ game }: { game: string }) {
  const content = getGameContent(game);
  const casinoBase = (process.env.NEXT_PUBLIC_CASINO_URL || 'https://bullmoney-casino.onrender.com').replace(/\/$/, '');
  const casinoSocket = process.env.NEXT_PUBLIC_CASINO_SOCKET_URL || `${casinoBase}:8443`;

  if (!content) {
    return (
      <BullcasinoShell>
        <div style={{ padding: 24, textAlign: 'center', color: '#7a8a9a' }}>
          Game not found. <a href="/games" style={{ color: '#00e701' }}>Return to Games</a>
        </div>
      </BullcasinoShell>
    );
  }

  const allScripts: string[] = getGameScripts(game);

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

  useSequentialScripts(scripts);

  return (
    <BullcasinoShell>
      {/* Game detail CSS — loaded here instead of head.tsx (not supported in App Router) */}
      <link rel="stylesheet" href="/assets/css/style.css" />
      <link rel="stylesheet" href="/assets/css/notifyme.css" />
      {game === 'flappybird' && (
        <link rel="stylesheet" href="/games/bullcasino/css/flappybird.css" />
      )}
      <style dangerouslySetInnerHTML={{ __html: GAME_STYLES }} />
      {content}
    </BullcasinoShell>
  );
}
