"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconChevronUp,
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useAudioSettings, type MusicSource, STREAMING_SOURCES } from "@/contexts/AudioSettingsProvider";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { MusicEmbedModal } from "@/components/MusicEmbedModal";

const sourceLabel: Record<MusicSource, string> = {
  THEME: "Theme",
  BACKGROUND: "Background",
  AMBIENT: "Ambient",
  SHOP: "Shop",
  NEWS: "News",
  SPOTIFY: "🎵 Spotify",
  APPLE_MUSIC: "🍎 Apple Music",
  YOUTUBE: "▶️ YouTube",
};

const sourceIcons: Partial<Record<MusicSource, React.ReactNode>> = {
  SPOTIFY: <IconBrandSpotify className="w-4 h-4 text-green-400" />,
  APPLE_MUSIC: <IconBrandApple className="w-4 h-4 text-pink-400" />,
  YOUTUBE: <IconBrandYoutube className="w-4 h-4 text-red-400" />,
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

    tipsMuted,
    setTipsMuted,
    
    streamingEmbedUrl,
    isStreamingSource,
  } = useAudioSettings();

  const [open, setOpen] = useState(false);
  const [musicEmbedOpen, setMusicEmbedOpen] = useState(false);
  const [showBgPlayer, setShowBgPlayer] = useState(false);

  const musicIcon = useMemo(() => {
    if (!musicEnabled || musicVolume <= 0.001) return IconVolumeOff;
    return IconVolume;
  }, [musicEnabled, musicVolume]);

  const MusicVolIcon = musicIcon;
  
  // Get icon for current streaming source
  const currentStreamingIcon = useMemo(() => {
    if (isStreamingSource && sourceIcons[musicSource]) {
      return sourceIcons[musicSource];
    }
    return <IconMusic className="h-5 w-5 text-blue-200/90" />;
  }, [isStreamingSource, musicSource]);

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
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center border",
              isStreamingSource 
                ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20" 
                : "bg-white/5 border-white/10"
            )}>
              {currentStreamingIcon}
            </div>

            {open && (
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold leading-tight">
                  {isStreamingSource ? sourceLabel[musicSource] : "Audio"}
                </div>
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
                    const newSource = e.target.value as MusicSource;
                    setMusicSource(newSource);
                    // Auto-show background player when selecting streaming source
                    if (STREAMING_SOURCES.includes(newSource)) {
                      setShowBgPlayer(true);
                      setMusicEnabled(true);
                    }
                  }}
                  className={cn(
                    "flex-1 bg-black/30 border border-white/10 rounded-lg",
                    "text-[12px] px-2 py-2 outline-none"
                  )}
                >
                  <optgroup label="Local Audio">
                    <option value="THEME">Theme</option>
                    <option value="BACKGROUND">Background</option>
                    <option value="AMBIENT">Ambient</option>
                    <option value="SHOP">Shop</option>
                    <option value="NEWS">News</option>
                  </optgroup>
                  <optgroup label="🎧 Streaming Playlists">
                    <option value="SPOTIFY">🎵 Spotify</option>
                    <option value="APPLE_MUSIC">🍎 Apple Music</option>
                    <option value="YOUTUBE">▶️ YouTube</option>
                  </optgroup>
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

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <div className="text-[11px] text-white/70">Navbar tips</div>
                    <div className="text-[10px] text-white/45">Mute static + moving helpers</div>
                  </div>
                  <button
                    onClick={() => {
                      SoundEffects.click();
                      setTipsMuted(!tipsMuted);
                    }}
                    className={cn(
                      "h-9 px-3 rounded-lg border text-[12px]",
                      tipsMuted
                        ? "bg-blue-500/15 border-blue-500/30 text-blue-100"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    )}
                    title={tipsMuted ? "Tips muted" : "Tips audible"}
                  >
                    {tipsMuted ? "Muted" : "On"}
                  </button>
                </div>

                {/* Streaming player toggle */}
                {isStreamingSource && streamingEmbedUrl && (
                  <div className="flex items-center justify-between gap-2 pt-2 pb-1">
                    <div className="flex items-center gap-2">
                      {sourceIcons[musicSource]}
                      <span className="text-[11px] text-white/70">
                        {showBgPlayer ? "Playing in background" : "Player hidden"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        SoundEffects.click();
                        setShowBgPlayer(!showBgPlayer);
                      }}
                      className={cn(
                        "h-8 px-3 rounded-lg border text-[11px]",
                        showBgPlayer
                          ? "bg-green-500/15 border-green-500/30 text-green-300"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {showBgPlayer ? "Hide" : "Show"}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      SoundEffects.click();
                      // Avoid two music sources overlapping.
                      setMusicEnabled(false);
                      setMusicEmbedOpen(true);
                      // Collapse the audio widget when modal opens
                      setOpen(false);
                    }}
                    className={cn(
                      "h-10 flex-1 rounded-lg border border-white/10 bg-white/5",
                      "text-[12px] text-white/85 hover:bg-white/10"
                    )}
                    title="Open music embeds"
                  >
                    Open Music Modal
                  </button>
                  <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                    <IconVolume className="h-5 w-5 text-white/70" />
                  </div>
                </div>

                <div className="text-[10px] text-white/50 leading-snug">
                  {isStreamingSource 
                    ? "Streaming from your selected playlist. Click play on the embed to start."
                    : "Interaction volume controls UI sounds (click/hover/etc)."
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background streaming player - hidden but playing */}
      {isStreamingSource && streamingEmbedUrl && musicEnabled && showBgPlayer && (
        <div className="fixed bottom-20 left-3 z-[59] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "rounded-2xl border overflow-hidden shadow-2xl",
              musicSource === "SPOTIFY" && "border-green-500/30 bg-black/90",
              musicSource === "APPLE_MUSIC" && "border-pink-500/30 bg-black/90",
              musicSource === "YOUTUBE" && "border-red-500/30 bg-black/90",
            )}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/50">
              <div className="flex items-center gap-2">
                {sourceIcons[musicSource]}
                <span className="text-[11px] text-white/70 font-medium">
                  {sourceLabel[musicSource]} Player
                </span>
              </div>
              <button
                onClick={() => {
                  SoundEffects.click();
                  setShowBgPlayer(false);
                }}
                className="text-white/50 hover:text-white/80 text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                Minimize
              </button>
            </div>
            <iframe
              title={`${sourceLabel[musicSource]} background player`}
              src={streamingEmbedUrl}
              width={musicSource === "YOUTUBE" ? "320" : "300"}
              height={musicSource === "YOUTUBE" ? "180" : "152"}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; web-share"
              loading="lazy"
              className="block"
            />
          </motion.div>
        </div>
      )}

      {/* Music Modal - portaled to body for proper fullscreen overlay */}
      {typeof document !== "undefined" &&
        createPortal(
          <MusicEmbedModal
            open={musicEmbedOpen}
            onClose={() => {
              SoundEffects.click();
              setMusicEmbedOpen(false);
            }}
          />,
          document.body
        )}
    </div>
  );
}
