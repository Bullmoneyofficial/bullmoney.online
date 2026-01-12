"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconChevronUp,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useAudioSettings, type MusicSource } from "@/contexts/AudioSettingsProvider";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

const sourceLabel: Record<MusicSource, string> = {
  THEME: "Theme",
  BACKGROUND: "Background",
  AMBIENT: "Ambient",
  SHOP: "Shop",
  NEWS: "News",
};

function Slider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-white/70">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

export default function AudioWidget() {
  const {
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    musicSource,
    setMusicSource,
    isMusicPlaying,
    toggleMusic,
  } = useAudioSettings();

  const [open, setOpen] = useState(false);

  const musicIcon = useMemo(() => {
    if (!musicEnabled || musicVolume <= 0.001) return IconVolumeOff;
    return IconVolume;
  }, [musicEnabled, musicVolume]);

  const MusicVolIcon = musicIcon;

  return (
    <div className="fixed left-3 bottom-3 z-[60] pointer-events-auto">
      <div
        className={cn(
          "rounded-2xl border border-blue-500/25 bg-black/35 backdrop-blur-2xl shadow-2xl",
          "text-white/90",
          open ? "w-[260px] sm:w-[290px]" : "w-auto"
        )}
        style={{ filter: "none" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-2">
          <button
            onClick={() => {
              SoundEffects.click();
              setOpen((v) => !v);
            }}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              "bg-blue-500/10 hover:bg-blue-500/15 active:bg-blue-500/20",
              "border border-blue-500/20"
            )}
            title={open ? "Collapse audio" : "Open audio"}
          >
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-blue-200"
            >
              <IconChevronUp className="h-5 w-5" />
            </motion.div>
          </button>

          <div className={cn("flex items-center gap-2", open ? "flex-1" : "")}
          >
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <IconMusic className="h-5 w-5 text-blue-200/90" />
            </div>

            {open && (
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-tight">Audio</div>
                <div className="text-[11px] text-white/60 leading-tight">
                  Music + interactions
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              SoundEffects.click();
              toggleMusic();
            }}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              "bg-white/5 hover:bg-white/10 active:bg-white/15",
              "border border-white/10"
            )}
            title={isMusicPlaying ? "Pause music" : "Play music"}
          >
            {isMusicPlaying ? (
              <IconPlayerPause className="h-5 w-5" />
            ) : (
              <IconPlayerPlay className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-white/70 shrink-0">Music</label>
                <select
                  value={musicSource}
                  onChange={(e) => {
                    SoundEffects.click();
                    setMusicSource(e.target.value as MusicSource);
                  }}
                  className={cn(
                    "flex-1 bg-black/30 border border-white/10 rounded-lg",
                    "text-[12px] px-2 py-2 outline-none"
                  )}
                >
                  {Object.keys(sourceLabel).map((key) => (
                    <option key={key} value={key}>
                      {sourceLabel[key as MusicSource]}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    SoundEffects.click();
                    setMusicEnabled(!musicEnabled);
                  }}
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    "bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10"
                  )}
                  title={musicEnabled ? "Mute music" : "Unmute music"}
                >
                  <MusicVolIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 grid gap-3">
                <Slider
                  label="Music volume"
                  value={musicVolume}
                  onChange={(v) => {
                    setMusicVolume(v);
                  }}
                />

                <Slider
                  label="Interaction volume"
                  value={sfxVolume}
                  onChange={(v) => {
                    setSfxVolume(v);
                  }}
                />

                <div className="text-[10px] text-white/50 leading-snug">
                  Interaction volume controls UI sounds (click/hover/etc).
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
