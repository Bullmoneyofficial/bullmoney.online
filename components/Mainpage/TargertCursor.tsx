import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import '@/components/Mainpage/TargertCursor.css';

// --- Interface ---
export interface TargetCursorProps {
  targetSelector?: string;
  autoMoveSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  idleTimeout?: number;
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = '.cursor-target',
  autoMoveSelector = 'button, a, input, .cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  idleTimeout = 3
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<HTMLDivElement[]>([]);
  const spinTl = useRef<gsap.core.Timeline | null>(null);

  // --- Mutable Physics State ---
  const state = useRef({
    // Cursor Physics
    x: 0, y: 0,           // Current Position
    tx: 0, ty: 0,         // Target Position (Mouse)
    
    // Corner Physics (Independent Lerp)
    cx: 0, cy: 0,         // Current corner expansion tracking
    
    // Logic
    isIdle: false,
    isHovering: false,
    lastInputTime: Date.now(),
    
    // References
    hoverEl: null as Element | null,  // Track ELEMENT, not Rect (fixes scroll drift)
    ghostRect: null as DOMRect | null // Ghost mode target
  });

  // --- Configuration ---
  const CONFIG = useMemo(() => ({
    lerp: 0.15,           // Cursor movement smoothness
    cornerLerp: 0.15,     // Corner animation speed (replaced GSAP tween)
    idleSpeed: 0.05,      // Ghost mode speed
    stickiness: 0.07,     // Magnetic strength
    cornerPadding: 8,     // Padding when locked
    cornerBaseSize: 12    // Size when idle
  }), []);

  useLayoutEffect(() => {
    if (!cursorRef.current) return;
    
    // Initialize Refs
    const cursor = cursorRef.current;
    const corners = Array.from(cursor.querySelectorAll('.target-cursor-corner')) as HTMLDivElement[];
    cornersRef.current = corners;

    // --- OPTIMIZATION 1: GSAP QuickSetters ---
    // Skips string parsing overhead in the render loop (huge perf boost)
    const setCursorX = gsap.quickSetter(cursor, "x", "px");
    const setCursorY = gsap.quickSetter(cursor, "y", "px");
    const setRotation = gsap.quickSetter(cursor, "rotation", "deg");
    
    // Corner setters
    const setCorner1 = { x: gsap.quickSetter(corners[0], "x", "px"), y: gsap.quickSetter(corners[0], "y", "px") };
    const setCorner2 = { x: gsap.quickSetter(corners[1], "x", "px"), y: gsap.quickSetter(corners[1], "y", "px") };
    const setCorner3 = { x: gsap.quickSetter(corners[2], "x", "px"), y: gsap.quickSetter(corners[2], "y", "px") };
    const setCorner4 = { x: gsap.quickSetter(corners[3], "x", "px"), y: gsap.quickSetter(corners[3], "y", "px") };

    // Initial Setup
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    state.current.x = startX; state.current.tx = startX;
    state.current.y = startY; state.current.ty = startY;

    if (hideDefaultCursor) {
      document.documentElement.style.cursor = 'none';
      document.body.style.cursor = 'none';
    }

    gsap.set(cursor, { xPercent: -50, yPercent: -50, force3D: true });

    // Spin Animation
    spinTl.current = gsap.timeline({ repeat: -1, paused: false })
      .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

    // --- 2. OPTIMIZED RENDER LOOP ---
    const renderLoop = () => {
      const s = state.current;
      const dt = 1.0 - Math.pow(1.0 - CONFIG.lerp, gsap.ticker.deltaRatio());

      // 1. Determine Target
      let destX = s.tx;
      let destY = s.ty;
      let currentLerp = dt;
      let activeRect: DOMRect | null = null;

      // Get fresh rect if hovering (Fixes scroll drift)
      if (s.isHovering && s.hoverEl) {
        activeRect = s.hoverEl.getBoundingClientRect();
      } else if (s.isIdle && s.ghostRect) {
        activeRect = s.ghostRect;
        currentLerp = CONFIG.idleSpeed;
      }

      // 2. Physics: Magnetic Lock
      let targetRotation = null;
      
      if (activeRect) {
        const centerX = activeRect.left + activeRect.width / 2;
        const centerY = activeRect.top + activeRect.height / 2;
        
        // Stickiness Math
        destX = centerX + (s.tx - centerX) * CONFIG.stickiness;
        destY = centerY + (s.ty - centerY) * CONFIG.stickiness;
        currentLerp = 0.25; // Snap faster
        targetRotation = 0; // Stop spinning
      }

      // 3. Physics: Cursor Movement
      s.x += (destX - s.x) * currentLerp;
      s.y += (destY - s.y) * currentLerp;

      // Clamp to screen
      s.x = Math.min(Math.max(s.x, 0), window.innerWidth);
      s.y = Math.min(Math.max(s.y, 0), window.innerHeight);

      // Apply Cursor Transform
      setCursorX(s.x);
      setCursorY(s.y);

      // Rotation Logic
      if (targetRotation !== null) {
        spinTl.current?.pause();
        setRotation(targetRotation);
      } else if (spinTl.current?.paused()) {
        spinTl.current.play();
      }

      // --- 3. OPTIMIZED CORNER ANIMATION (No Tweens) ---
      // We calculate where the corners SHOULD be, and lerp them there.
      
      let tLeft=0, tTop=0, tRight=0, tBottom=0;

      if (activeRect) {
        // Target: Expanded to fit button
        const pad = CONFIG.cornerPadding;
        tLeft = (activeRect.left - pad) - s.x;
        tTop = (activeRect.top - pad) - s.y;
        tRight = (activeRect.right + pad) - s.x - 12; // -12 accounts for corner width
        tBottom = (activeRect.bottom + pad) - s.y - 12;
      } else {
        // Target: Default small square
        const size = CONFIG.cornerBaseSize;
        tLeft = -size * 1.5;
        tTop = -size * 1.5;
        tRight = size * 0.5;
        tBottom = size * 0.5;
      }

      // We only need to Lerp one corner set, others follow symmetrically or relatively
      // Actually, let's just lerp the 4 specific positions for accuracy
      // To save CPU, we assume previous frame corner positions are close.
      // We can't store previous corner pos in `state` easily without 8 variables.
      // Simpler approach: Use GSAP quickSetter but calculated manually.
      
      // Note: For true 'lerp' on corners, we'd need to store their current X/Y. 
      // Instead, we will use a small hack: We calculate the DELTA and apply it.
      // But purely setting it is fast enough? 
      // If we just set it, it snaps instantly. We want smooth expansion.
      // Let's store current corner expansion in `s.cx, s.cy` (repurposed for 'current Top/Left' etc)
      
      // Simple Corner Lerp (Smooth expansion)
      // We'll just Lerp "Target Left" and "Target Top" etc.
      
      // ...Actually, re-implementing full lerp for 8 vars is verbose. 
      // Let's use a simpler heuristic: Lerp a single "Expansion Factor" if it was uniform, 
      // but it's not uniform (rects can be rectangular).
      
      // Optimization: We use `gsap.utils.interpolate` on the values directly inside the loop.
      // We need to read the CURRENT values to lerp from.
      // Reading from DOM (`_gsap.x`) is slow. 
      // We will fallback to a simplified logic: 
      // We won't lerp the corners frame-by-frame perfectly, we will just use quickSetter to the target.
      // To get the "animation" effect back without `gsap.to`, we use a persistent tracker.
      
      // Tracker for current expansion rect (relative to cursor)
      if (!s.cx) { s.cx = tLeft; s.cy = tTop; } // Initialize
      
      // Lerp the Tracker
      const cDt = CONFIG.cornerLerp; // Corner speed
      s.cx += (tLeft - s.cx) * cDt;
      s.cy += (tTop - s.cy) * cDt;
      // We need trackers for width/height essentially.
      // Let's just track the 4 bound values:
      if (!('l' in s)) { Object.assign(s, { l: tLeft, r: tRight, t: tTop, b: tBottom }); }
      const d = s as any;
      
      d.l += (tLeft - d.l) * cDt;
      d.r += (tRight - d.r) * cDt;
      d.t += (tTop - d.t) * cDt;
      d.b += (tBottom - d.b) * cDt;

      // Apply
      setCorner1.x(d.l); setCorner1.y(d.t); // TL
      setCorner2.x(d.r); setCorner2.y(d.t); // TR
      setCorner3.x(d.r); setCorner3.y(d.b); // BR
      setCorner4.x(d.l); setCorner4.y(d.b); // BL
    };

    gsap.ticker.add(renderLoop);

    // --- 4. INPUTS ---
    const updateInput = (x: number, y: number) => {
        state.current.lastInputTime = Date.now();
        state.current.tx = x;
        state.current.ty = y;
        
        if (state.current.isIdle) {
            state.current.isIdle = false;
            state.current.ghostRect = null;
            state.current.x = x; 
            state.current.y = y;
        }
    };

    const onMove = (e: MouseEvent) => updateInput(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => e.touches.length && updateInput(e.touches[0].clientX, e.touches[0].clientY);
    
    // --- 5. OPTIMIZED HOVER ---
    const onHover = (e: MouseEvent) => {
        const target = (e.target as Element).closest(targetSelector);
        if (target) {
            state.current.isHovering = true;
            state.current.hoverEl = target; // Store Element, not Rect
        } else {
            state.current.isHovering = false;
            state.current.hoverEl = null;
        }
    };

    // --- 6. OPTIMIZED GHOST MODE ---
    const visitNextButton = () => {
        if (!state.current.isIdle) return;

        // Optimization: Do NOT querySelectorAll and getBoundingClientRect on EVERYTHING.
        // Instead, pick random candidates and validate them.
        const allElements = document.querySelectorAll(autoMoveSelector);
        let found = false;
        let attempts = 0;
        
        while (!found && attempts < 5) { // Try 5 times to find a visible element
            const el = allElements[Math.floor(Math.random() * allElements.length)];
            if (el) {
                const r = el.getBoundingClientRect();
                // Check visibility
                if (r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight) {
                    state.current.ghostRect = r;
                    found = true;
                }
            }
            attempts++;
        }

        if (!found) state.current.ghostRect = null; // Float to center/mouse pos if nothing found
        setTimeout(() => { if(state.current.isIdle) visitNextButton(); }, 2500);
    };

    const idleTimer = setInterval(() => {
        if (Date.now() - state.current.lastInputTime > idleTimeout * 1000 && !state.current.isIdle) {
            state.current.isIdle = true;
            visitNextButton();
        }
    }, 1000);

    // Bindings
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseover', onHover, true); // Capture phase often better for delegation

    return () => {
      gsap.ticker.remove(renderLoop);
      clearInterval(idleTimer);
      spinTl.current?.kill();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseover', onHover, true);
      document.documentElement.style.cursor = '';
      document.body.style.cursor = '';
    };
  }, [hideDefaultCursor, spinDuration, targetSelector, autoMoveSelector, idleTimeout, CONFIG]);

  return (
    <div ref={cursorRef} className="target-cursor-wrapper" style={{ pointerEvents: 'none' }}>
      <div className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>
  );
};

export default TargetCursor;