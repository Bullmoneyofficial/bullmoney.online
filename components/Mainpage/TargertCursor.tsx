"use client";
import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import '@/components/Mainpage/TargertCursor.css';

export interface TargetCursorProps {
  targetSelector?: string; // e.g. 'a, button'
  autoMoveSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  idleTimeout?: number;
  // Sound URLs
  clickSoundUrl?: string;
  lockSoundUrl?: string;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = 'a, button, input, .cursor-target, .interactive-object',
  autoMoveSelector = 'button, a, input, .cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  idleTimeout = 3,
  // 🎯 GOOGLE / CDN AIM SOUNDS
  clickSoundUrl = 'https://assets.codepen.io/127738/click_mech.mp3',
  lockSoundUrl = 'https://assets.codepen.io/127738/ui_hover.mp3' // High pitch "Lock-on" blip
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLDivElement[]>([]);
  
  // Audio Refs
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const lockAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const spinTl = useRef<gsap.core.Timeline | null>(null);

  // --- Mutable Physics State ---
  const state = useRef({
    x: 0, y: 0, tx: 0, ty: 0,         
    isIdle: false,
    isHovering: false,
    lastInputTime: Date.now(),
    hoverEl: null as Element | null,
    ghostRect: null as DOMRect | null 
  });

  // --- Configuration ---
  const CONFIG = useMemo(() => ({
    lerp: 0.15, cornerLerp: 0.15, idleSpeed: 0.05,      
    stickiness: 0.07, cornerPadding: 8, cornerBaseSize: 12    
  }), []);

  useLayoutEffect(() => {
    if (!cursorRef.current) return;
    
    // --- SETUP ---
    const cursor = cursorRef.current;
    const corners = Array.from(cursor.querySelectorAll('.target-cursor-corner')) as HTMLDivElement[];
    cornersRef.current = corners;

    const setCursorX = gsap.quickSetter(cursor, "x", "px");
    const setCursorY = gsap.quickSetter(cursor, "y", "px");
    const setRotation = gsap.quickSetter(cursor, "rotation", "deg");
    
    // Corner Setters
    const setCorner1 = { x: gsap.quickSetter(corners[0], "x", "px"), y: gsap.quickSetter(corners[0], "y", "px") };
    const setCorner2 = { x: gsap.quickSetter(corners[1], "x", "px"), y: gsap.quickSetter(corners[1], "y", "px") };
    const setCorner3 = { x: gsap.quickSetter(corners[2], "x", "px"), y: gsap.quickSetter(corners[2], "y", "px") };
    const setCorner4 = { x: gsap.quickSetter(corners[3], "x", "px"), y: gsap.quickSetter(corners[3], "y", "px") };

    // Init Logic
    if (hideDefaultCursor) {
      document.documentElement.style.cursor = 'none';
      document.body.style.cursor = 'none';
    }
    gsap.set(cursor, { xPercent: 0, yPercent: 0, force3D: true }); 

    spinTl.current = gsap.timeline({ repeat: -1, paused: false })
      .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

    // --- RENDER LOOP ---
    const renderLoop = () => {
      const s = state.current;
      const dt = 1.0 - Math.pow(1.0 - CONFIG.lerp, gsap.ticker.deltaRatio());

      // 1. Target Calcs
      let destX = s.tx;
      let destY = s.ty;
      let currentLerp = dt;
      let activeRect: DOMRect | null = null;

      if (s.isHovering && s.hoverEl) activeRect = s.hoverEl.getBoundingClientRect();
      else if (s.isIdle && s.ghostRect) { activeRect = s.ghostRect; currentLerp = CONFIG.idleSpeed; }

      let targetRotation = null;
      if (activeRect) {
        const centerX = activeRect.left + activeRect.width / 2;
        const centerY = activeRect.top + activeRect.height / 2;
        destX = centerX + (s.tx - centerX) * CONFIG.stickiness;
        destY = centerY + (s.ty - centerY) * CONFIG.stickiness;
        currentLerp = 0.25; targetRotation = 0;
      }

      s.x += (destX - s.x) * currentLerp;
      s.y += (destY - s.y) * currentLerp;
      setCursorX(s.x); setCursorY(s.y);

      if (targetRotation !== null) { spinTl.current?.pause(); setRotation(targetRotation); }
      else if (spinTl.current?.paused()) spinTl.current.play();

      // 2. Corner Logic (Manual Lerp for performance)
      let tLeft=0, tTop=0, tRight=0, tBottom=0;
      if (activeRect) {
        const pad = CONFIG.cornerPadding;
        tLeft = (activeRect.left - pad) - s.x; tTop = (activeRect.top - pad) - s.y;
        tRight = (activeRect.right + pad) - s.x - 12; tBottom = (activeRect.bottom + pad) - s.y - 12;
      } else {
        const size = CONFIG.cornerBaseSize;
        tLeft = -size * 1.5; tTop = -size * 1.5;
        tRight = size * 0.5; tBottom = size * 0.5;
      }

      const cDt = CONFIG.cornerLerp;
      if (!('l' in s)) { Object.assign(s, { l: tLeft, r: tRight, t: tTop, b: tBottom }); }
      const d = s as any;
      d.l += (tLeft - d.l) * cDt; d.r += (tRight - d.r) * cDt;
      d.t += (tTop - d.t) * cDt; d.b += (tBottom - d.b) * cDt;

      setCorner1.x(d.l); setCorner1.y(d.t); setCorner2.x(d.r); setCorner2.y(d.t);
      setCorner3.x(d.r); setCorner3.y(d.b); setCorner4.x(d.l); setCorner4.y(d.b);
    };
    gsap.ticker.add(renderLoop);

    // --- INPUTS ---
    const updateInput = (x: number, y: number) => {
        state.current.lastInputTime = Date.now();
        state.current.tx = x; state.current.ty = y;
        if (state.current.isIdle) {
            state.current.isIdle = false; state.current.ghostRect = null;
            state.current.x = x; state.current.y = y;
        }
    };

    const onMove = (e: MouseEvent) => updateInput(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => e.touches.length && updateInput(e.touches[0].clientX, e.touches[0].clientY);
    
    // --- CLICK (FIRE) ---
    const onClick = () => {
        if (clickAudioRef.current) {
            clickAudioRef.current.currentTime = 0;
            clickAudioRef.current.volume = 0.5;
            clickAudioRef.current.play().catch(() => {});
        }
        // Visual Recoil
        const dot = cursor.querySelector('.target-cursor-dot');
        if (dot) gsap.fromTo(dot, { scale: 2, backgroundColor: "red" }, { scale: 1, backgroundColor: "white", duration: 0.3 });
    };

    // --- HOVER (LOCK-ON) ---
    const onHover = (e: MouseEvent) => {
        const target = (e.target as Element).closest(targetSelector);
        
        // Play lock sound ONLY on new entry to avoid spam
        if (target && !state.current.isHovering) {
             if (lockAudioRef.current) {
                lockAudioRef.current.currentTime = 0;
                lockAudioRef.current.volume = 0.2; // Keep it subtle
                lockAudioRef.current.play().catch(() => {});
             }
        }
        state.current.isHovering = !!target;
        state.current.hoverEl = target || null;
    };

    // --- GHOST MODE (Idle Animation) ---
    const visitNextButton = () => {
        if (!state.current.isIdle) return;
        const allElements = document.querySelectorAll(autoMoveSelector);
        let found = false, attempts = 0;
        while (!found && attempts < 8) { 
            const el = allElements[Math.floor(Math.random() * allElements.length)];
            if (el) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                    state.current.ghostRect = r; found = true;
                }
            }
            attempts++;
        }
        if (!found) state.current.ghostRect = null; 
        setTimeout(() => { if(state.current.isIdle) visitNextButton(); }, 2000 + Math.random() * 1000);
    };

    const idleTimer = setInterval(() => {
        if (Date.now() - state.current.lastInputTime > idleTimeout * 1000 && !state.current.isIdle) {
            state.current.isIdle = true; visitNextButton();
        }
    }, 1000);

    // Bindings
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseover', onHover, true); 

    return () => {
      gsap.ticker.remove(renderLoop); clearInterval(idleTimer); spinTl.current?.kill();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseover', onHover, true);
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [hideDefaultCursor, spinDuration, targetSelector, autoMoveSelector, idleTimeout, CONFIG]);

  return (
    <>
      <div ref={cursorRef} className="target-cursor-wrapper" style={{ pointerEvents: 'none' }}>
        <div className="target-cursor-dot" />
        <div className="target-cursor-corner corner-tl" />
        <div className="target-cursor-corner corner-tr" />
        <div className="target-cursor-corner corner-br" />
        <div className="target-cursor-corner corner-bl" />
      </div>
      {/* Remote Audio Files - Zero setup required */}
      <audio ref={clickAudioRef} src={clickSoundUrl} crossOrigin="anonymous" preload="auto" />
      <audio ref={lockAudioRef} src={lockSoundUrl} crossOrigin="anonymous" preload="auto" />
    </>
  );
};

export default TargetCursor;