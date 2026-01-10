"use client";
import React, { useEffect, useRef } from "react";
import { Flip } from "@pqina/flip";
import "@pqina/flip/dist/flip.min.css";

interface FlipCountdownProps {
  deadlineISO: string;
}

export default function FlipCountdown({ deadlineISO }: FlipCountdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipInstance = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Flip
    flipInstance.current = Flip.create(containerRef.current, {
      theme: "dark", // black matte style
      delimiter: {
        days: { label: "DAYS" },
        hours: { label: "HOURS" },
        minutes: { label: "MINUTES" },
        seconds: { label: "SECONDS" },
      },
    });

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(deadlineISO);
      const diff = Math.max(0, target.getTime() - now.getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      flipInstance.current.setValue({
        days: days.toString().padStart(2, "0"),
        hours: hours.toString().padStart(2, "0"),
        minutes: minutes.toString().padStart(2, "0"),
        seconds: seconds.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      flipInstance.current?.destroy();
    };
  }, [deadlineISO]);

  return <div ref={containerRef} className="flex justify-center mt-4" />;
}
