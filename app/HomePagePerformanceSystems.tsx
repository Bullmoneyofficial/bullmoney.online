"use client";

import { useEffect, useRef } from "react";
import { useLazyUnifiedPerformance, useLazyCrashTracker } from "@/lib/lazyPerformanceHooks";

export default function HomePagePerformanceSystems({
  enabled,
  pageView,
}: {
  enabled: boolean;
  pageView: string;
}) {
  const { averageFps } = useLazyUnifiedPerformance();
  const { trackPerformanceWarning } = useLazyCrashTracker();

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Only emit warnings once content is showing.
  useEffect(() => {
    if (!enabledRef.current) return;
    if (averageFps < 25 && pageView === "content") {
      trackPerformanceWarning("page", averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, pageView, trackPerformanceWarning]);

  return null;
}
