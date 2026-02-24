"use client";

import type { NewsItem } from "../types";

interface TopStoriesPanelProps {
  topStories: NewsItem[];
}

export function TopStoriesPanel({ topStories }: TopStoriesPanelProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Top stories</p>
        <span className="text-[9px] text-zinc-600">
          Updated{" "}
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {topStories.map((item, index) => (
          <a
            key={`${item.link}-${index}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-zinc-900 bg-black/40 px-3 py-2 hover:bg-zinc-900/60"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500 truncate">{item.source}</span>
              <span className="text-[9px] text-zinc-600">{item.age}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-white/90 line-clamp-2">
              {item.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
