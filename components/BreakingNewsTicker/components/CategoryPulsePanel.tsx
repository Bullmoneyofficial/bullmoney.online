"use client";

import type { NewsItem } from "../types";
import { ICONS, DEFAULT_ICON } from "../constants";

interface CategoryPulsePanelProps {
  displayItems: NewsItem[];
  crit: number;
  urgent: number;
  count: number;
}

export function CategoryPulsePanel({
  displayItems,
  crit,
  urgent,
  count,
}: CategoryPulsePanelProps) {
  const categoryCounts = displayItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">Category pulse</p>
      <div className="mt-3 grid gap-2">
        {topCategories.map(([category, value]) => (
          <div
            key={category}
            className="flex items-center justify-between rounded-md border border-zinc-900 bg-black/40 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{ICONS[category] || DEFAULT_ICON}</span>
              <span className="text-[11px] text-zinc-300 capitalize">{category}</span>
            </div>
            <span className="text-[11px] font-semibold text-white/80">{value}</span>
          </div>
        ))}
        {topCategories.length === 0 && (
          <div className="rounded-md border border-zinc-900 bg-black/40 px-3 py-2 text-[11px] text-zinc-500">
            No categories yet.
          </div>
        )}
      </div>
      <div className="mt-3 rounded-md border border-zinc-900 bg-black/40 px-3 py-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Pulse summary</p>
        <p className="mt-1 text-[11px] text-zinc-300">
          {crit} breaking, {urgent} urgent, {count} total stories.
        </p>
      </div>
    </div>
  );
}
