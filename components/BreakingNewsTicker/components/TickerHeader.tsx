"use client";

import type { RefObject } from "react";

interface TickerHeaderProps {
  isSearchActive: boolean;
  searching: boolean;
  count: number;
  searchQuery: string;
  crit: number;
  urgent: number;
  totalStories: number;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchInput: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  clearSearch: () => void;
}

export function TickerHeader({
  isSearchActive,
  searching,
  count,
  searchQuery,
  crit,
  urgent,
  totalStories,
  searchOpen,
  setSearchOpen,
  searchInputRef,
  onSearchInput,
  onSearchSubmit,
  clearSearch,
}: TickerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 h-9 border-b border-zinc-800/50">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-75" />
          <span className="relative rounded-full h-2 w-2 bg-red-600" />
        </span>
        <span className="text-[11px] font-bold text-red-400 tracking-wider">LIVE</span>
        <span className="h-3 w-px bg-zinc-700" />
        {isSearchActive ? (
          <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
            {searching ? "Searching..." : `${count} results for "${searchQuery}"`}
          </span>
        ) : (
          <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
            Breaking Market News
          </span>
        )}
        {!isSearchActive && crit > 0 && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-600 text-white rounded animate-pulse">
            {crit} BREAKING
          </span>
        )}
        {!isSearchActive && urgent > 0 && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded">
            {urgent} URGENT
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <form onSubmit={onSearchSubmit} className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              if (searchOpen && searchQuery) {
                onSearchSubmit(new Event("submit") as unknown as React.FormEvent);
              } else {
                setSearchOpen(!searchOpen);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className="text-zinc-500 hover:text-white transition-colors p-1 z-10"
            title="Search news"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => {
              if (!searchQuery) setSearchOpen(false);
            }}
            placeholder="Search news, markets, topics..."
            className={`bnt-search ${searchOpen || searchQuery ? "open" : ""}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="ml-1 text-zinc-500 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </form>
        {!isSearchActive && (
          <span className="text-[10px] text-zinc-600">{totalStories} stories</span>
        )}
      </div>
    </div>
  );
}
