"use client";

import { memo } from "react";
import type { NewsItem } from "../types";
import { ICONS, DEFAULT_ICON } from "../constants";

/** Memoized news card — never re-renders during scroll */
export const NewsCard = memo(function NewsCard({ item }: { item: NewsItem }) {
  const icon = ICONS[item.category] || DEFAULT_ICON;
  const isCrit = item.urgency === "critical";
  const isUrg = item.urgency === "high";
  const badge = isCrit
    ? "BREAKING"
    : isUrg
      ? "URGENT"
      : item.urgency === "medium"
        ? "NEW"
        : "";
  const borderStyle = isCrit || isUrg ? "border-red-500/30" : "";

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`bnt-card ${borderStyle}`}
    >
      {/* Image or icon */}
      {item.image ? (
        <div className="bnt-img">
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(item.image)}`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute bottom-0 inset-x-0 bg-black/70 text-center py-px">
            <span className="text-[8px] text-zinc-400">
              {icon} {item.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="bnt-ico">
          <span className="text-lg">{icon}</span>
          <span className="text-[7px] text-zinc-500 uppercase">
            {item.category}
          </span>
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col justify-between min-w-0 flex-1 py-px">
        <div className="flex items-center gap-1.5">
          {badge && (
            <span
              className={`px-1.5 py-px text-[8px] font-black uppercase text-white rounded-sm ${
                isCrit
                  ? "bg-red-600 animate-pulse"
                  : isUrg
                    ? "bg-red-500"
                    : "bg-yellow-600"
              }`}
            >
              {badge}
            </span>
          )}
          <span className="text-[9px] text-zinc-500 truncate">{item.source}</span>
          <span className="text-[9px] text-zinc-600">·</span>
          <span
            className={`text-[9px] ${isCrit || isUrg ? "text-red-400" : "text-zinc-500"}`}
          >
            {item.age}
          </span>
        </div>
        <h4 className="text-[12px] leading-4 font-semibold text-white/90 line-clamp-2 mt-1">
          {item.title}
        </h4>
        <p className="text-[10px] leading-[13px] text-zinc-500 line-clamp-1 mt-0.5">
          {item.subtitle}
        </p>
        <div className="flex justify-between mt-auto pt-0.5">
          <span className="text-[8px] text-zinc-600">
            {new Date(item.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-[8px] text-zinc-600">Read →</span>
        </div>
      </div>
    </a>
  );
});
