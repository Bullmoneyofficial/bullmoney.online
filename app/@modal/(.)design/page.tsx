"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DesignModalRoute() {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };
  }, []);

  const openStandalone = (hash: string) => {
    if (typeof window === "undefined") return;
    window.location.assign(`/design${hash}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Design"
      className="fixed inset-0 z-[99999] flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={() => router.back()}
      />

      <div className="relative w-[min(92vw,560px)] rounded-2xl bg-white p-5 shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.back()}
          className="absolute right-3 top-3 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-sm font-semibold text-black"
        >
          ✕
        </button>

        <div className="pr-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/50">
            Design
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-black">
            Choose what to open
          </h2>
          <p className="mt-1 text-sm text-black/70">
            Opens the full standalone design page, jumped to your selected section.
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => openStandalone("#design-studio")}
            className="w-full rounded-xl border border-black/15 bg-black px-4 py-3 text-left text-sm font-semibold text-white"
          >
            Design Studio
            <span className="block text-xs font-medium text-white/70">Canvas + editor workspace</span>
          </button>

          <button
            type="button"
            onClick={() => openStandalone("#design-sections")}
            className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-left text-sm font-semibold text-black"
          >
            Design Sections
            <span className="block text-xs font-medium text-black/60">Template library + layouts</span>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-black/15 bg-black/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
