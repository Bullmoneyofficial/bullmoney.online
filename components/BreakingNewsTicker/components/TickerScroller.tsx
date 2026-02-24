"use client";

import type { RefObject } from "react";
import type { NewsItem } from "../types";
import { NewsCard } from "./NewsCard";

interface TickerScrollerProps {
  displayItems: NewsItem[];
  isSearchActive: boolean;
  duplicateCount: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  onUserScroll: () => void;
  pauseAuto: () => void;
}

export function TickerScroller({
  displayItems,
  isSearchActive,
  duplicateCount,
  scrollRef,
  onUserScroll,
  pauseAuto,
}: TickerScrollerProps) {
  return (
    <div style={{ position: "relative", height: 154, padding: "8px 0 0" }}>
      <div
        ref={scrollRef}
        className="bnt-scroll"
        style={{ height: "100%", paddingLeft: 12, paddingRight: 12 }}
        onScroll={onUserScroll}
        onMouseDown={pauseAuto}
        onTouchStart={pauseAuto}
        onWheel={pauseAuto}
      >
        <div className="bnt-row">
          {isSearchActive
            ? displayItems.map((item, i) => (
                <NewsCard key={`${item.link}-${i}`} item={item} />
              ))
            : Array.from({ length: duplicateCount }).flatMap((_, set) =>
                displayItems.map((item, i) => (
                  <NewsCard key={`${set}-${i}-${item.link}`} item={item} />
                )),
              )}
        </div>
      </div>
      {/* Fade edges */}
      <div className="absolute top-0 left-0 bottom-0 w-10 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
