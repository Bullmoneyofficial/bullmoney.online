"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type HintProps = {
  label: string;
  children: React.ReactElement;
  longPressMs?: number;
  autoHideMs?: number;
};

function composeHandlers<E>(
  theirs: ((e: E) => void) | undefined,
  ours: (e: E) => void
) {
  return (e: E) => {
    theirs?.(e);
    ours(e);
  };
}

export function Hint({
  label,
  children,
  longPressMs = 420,
  autoHideMs = 1200,
}: HintProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => setMounted(true), []);

  const clearTimers = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    if (autoHideTimerRef.current) window.clearTimeout(autoHideTimerRef.current);
    longPressTimerRef.current = null;
    autoHideTimerRef.current = null;
  };

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  const hide = () => {
    clearTimers();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => hide();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true } as any);
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true } as any);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const child = useMemo(() => {
    const props: any = {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        const originalRef = (children as any).ref;
        if (typeof originalRef === "function") originalRef(node);
        else if (originalRef && typeof originalRef === "object") originalRef.current = node;
      },
      onMouseEnter: composeHandlers(children.props.onMouseEnter, () => show()),
      onMouseLeave: composeHandlers(children.props.onMouseLeave, () => hide()),
      onFocus: composeHandlers(children.props.onFocus, () => show()),
      onBlur: composeHandlers(children.props.onBlur, () => hide()),
      onPointerDown: composeHandlers(children.props.onPointerDown, (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        clearTimers();
        longPressTimerRef.current = window.setTimeout(() => {
          show();
          autoHideTimerRef.current = window.setTimeout(() => hide(), autoHideMs);
        }, longPressMs);
      }),
      onPointerUp: composeHandlers(children.props.onPointerUp, () => clearTimers()),
      onPointerCancel: composeHandlers(children.props.onPointerCancel, () => clearTimers()),
      title: children.props.title ?? label,
      "aria-label": children.props["aria-label"] ?? label,
    };
    return React.cloneElement(children, props);
  }, [autoHideMs, children, label, longPressMs]);

  if (!mounted) return child;

  return (
    <>
      {child}
      {open &&
        createPortal(
          <div
            className="pointer-events-none fixed left-0 top-0 z-[99999] select-none"
            style={{
              transform: `translate(${pos.x}px, ${Math.max(8, pos.y - 10)}px) translate(-50%, -100%)`,
            }}
          >
            <div className="bm-hint rounded-full bg-black/75 backdrop-blur-xl border border-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              {label}
            </div>
          </div>,
          document.body
        )}
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .bm-hint {
            animation: bmHintIn 140ms ease-out both;
          }
        }
        @keyframes bmHintIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

