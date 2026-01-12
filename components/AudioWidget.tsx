"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE: "YouTube",
};

// Only show streaming options in the dropdown
const streamingOptions: { value: MusicSource; label: string; icon: React.ReactNode }[] = [
  { value: "SPOTIFY", label: "Spotify", icon: <IconBrandSpotify className="w-4 h-4" /> },
  { value: "APPLE_MUSIC", label: "Apple Music", icon: <IconBrandApple className="w-4 h-4" /> },
  { value: "YOUTUBE", label: "YouTube", icon: <IconBrandYoutube className="w-4 h-4" /> },
];

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
  const [streamingActive, setStreamingActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Force iframe reload for autoplay
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // When user selects a streaming source, activate it (the click is the user interaction!)
  const handleStreamingSelect = (newSource: MusicSource) => {
    setMusicSource(newSource);
    if (STREAMING_SOURCES.includes(newSource)) {
      // This click IS the user interaction that enables autoplay
      setStreamingActive(true);
      setMusicEnabled(true);
      // Force iframe reload with fresh autoplay
      setIframeKey((k) => k + 1);
    } else {
      setStreamingActive(false);
    }
  };

  // Also activate when musicEnabled is toggled on for streaming source
  useEffect(() => {
    if (isStreamingSource && musicEnabled) {
      setStreamingActive(true);
      setIframeKey((k) => k + 1);
    } else if (!musicEnabled) {
      setStreamingActive(false);
    }
  }, [isStreamingSource, musicEnabled]);

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
              {/* Streaming playlist section */}
              <div className="mb-3">
                <div className="text-[11px] text-white/50 mb-2">🎧 Background Music</div>
                <div className="flex gap-1.5">
                  {streamingOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        SoundEffects.click();
                        handleStreamingSelect(opt.value);
                      }}
                      className={cn(
                        "flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all",
                        musicSource === opt.value && streamingActive
                          ? opt.value === "SPOTIFY" 
                            ? "bg-green-500/25 border-green-500/50 text-green-300 border shadow-lg shadow-green-500/10"
                            : opt.value === "APPLE_MUSIC"
                            ? "bg-pink-500/25 border-pink-500/50 text-pink-300 border shadow-lg shadow-pink-500/10"
                            : "bg-red-500/25 border-red-500/50 text-red-300 border shadow-lg shadow-red-500/10"
                          : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                      title={`Play ${opt.label} playlist`}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
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

                {/* Streaming status indicator - player is hidden but playing */}
                {isStreamingSource && streamingEmbedUrl && streamingActive && (
                  <div className="flex items-center justify-between gap-2 pt-2 pb-1 px-2 rounded-lg bg-gradient-to-r from-white/5 to-transparent border border-white/10">
                    <div className="flex items-center gap-2">
                      {sourceIcons[musicSource]}
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[11px] text-white/70">
                          Now Playing
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        SoundEffects.click();
                        setStreamingActive(false);
                        setMusicEnabled(false);
                      }}
                      className="h-7 px-2 rounded-lg border border-white/10 bg-white/5 text-[10px] text-white/60 hover:bg-white/10"
                    >
                      Stop
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
                  {isStreamingSource && streamingActive
                    ? "🎵 Music playing in background • Select a different source to change"
                    : isStreamingSource
                    ? "Select a streaming playlist to auto-play in background"
                    : "Interaction volume controls UI sounds (click/hover/etc)."
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HIDDEN Background streaming player - plays audio without being visible */}
      {isStreamingSource && streamingEmbedUrl && streamingActive && (
        <div 
          className="fixed pointer-events-none"
          style={{
            // Position off-screen but still in DOM so audio plays
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0,
          }}
          aria-hidden="true"
        >
          {/* The iframe is hidden but audio still plays! */}
          <iframe
            ref={iframeRef}
            key={`streaming-hidden-${musicSource}-${iframeKey}`}
            title={`${sourceLabel[musicSource]} background audio`}
            src={streamingEmbedUrl}
            width="300"
            height="152"
            allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; clipboard-write"
            loading="eager"
            style={{ border: 0 }}
          />
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
