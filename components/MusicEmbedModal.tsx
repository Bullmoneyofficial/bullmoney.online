"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconX,
  IconMusic,
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

export type MusicProvider = "SPOTIFY" | "APPLE_MUSIC" | "YOUTUBE";

const providerIcons: Record<MusicProvider, React.ReactNode> = {
  SPOTIFY: <IconBrandSpotify className="w-5 h-5 sm:w-6 sm:h-6" />,
  APPLE_MUSIC: <IconBrandApple className="w-5 h-5 sm:w-6 sm:h-6" />,
  YOUTUBE: <IconBrandYoutube className="w-5 h-5 sm:w-6 sm:h-6" />,
};

const providerLabels: Record<MusicProvider, string> = {
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE: "YouTube",
};

function ProviderTab({
  provider,
  active,
  onClick,
}: {
  provider: MusicProvider;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => {
        SoundEffects.click();
        onClick();
      }}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 sm:gap-3 h-12 sm:h-14 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-medium transition-all",
        active
          ? "bg-white/15 text-white shadow-lg border border-white/25"
          : "bg-transparent text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent"
      )}
      type="button"
    >
      {providerIcons[provider]}
      <span>{providerLabels[provider]}</span>
    </button>
  );
}

function Hint({ title, example }: { title: string; example: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-8 text-center">
      <IconMusic className="w-16 h-16 sm:w-20 sm:h-20 text-white/20 mb-6" />
      <div className="text-sm sm:text-base text-white/70 leading-relaxed max-w-md">
        {title}
      </div>
      <div className="mt-4 text-xs sm:text-sm text-white/40 break-all font-mono bg-white/5 px-4 py-3 rounded-xl">
        {example}
      </div>
    </div>
  );
}

export function MusicEmbedModal({
  open,
  onClose,
  initialProvider = "SPOTIFY",
}: {
  open: boolean;
  onClose: () => void;
  initialProvider?: MusicProvider;
}) {
  const [provider, setProvider] = useState<MusicProvider>(initialProvider);
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(null);
  const [spotifyExpiresAt, setSpotifyExpiresAt] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const spotifyEmbedUrl = process.env.NEXT_PUBLIC_SPOTIFY_EMBED_URL;
  const appleMusicEmbedUrl = process.env.NEXT_PUBLIC_APPLE_MUSIC_EMBED_URL;
  const youtubeEmbedUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_MUSIC_EMBED_URL ||
    process.env.NEXT_PUBLIC_YOUTUBE_EMBED_URL;

  useEffect(() => {
    if (!open) return;
    setProvider(initialProvider);
  }, [open, initialProvider]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        SoundEffects.click();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (provider !== "SPOTIFY") return;

    let cancelled = false;
    (async () => {
      try {
        setSpotifyConnected(null);
        const res = await fetch("/api/spotify/status", { cache: "no-store" });
        if (!res.ok) throw new Error("status fetch failed");
        const json = (await res.json()) as { connected: boolean; expiresAt?: number | null };
        if (cancelled) return;
        setSpotifyConnected(Boolean(json.connected));
        setSpotifyExpiresAt(typeof json.expiresAt === "number" ? json.expiresAt : null);
      } catch {
        if (cancelled) return;
        setSpotifyConnected(false);
        setSpotifyExpiresAt(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, provider]);

  const spotifyStatusText = useMemo(() => {
    if (spotifyConnected === null) return "Checking…";
    if (!spotifyConnected) return "Not connected";
    if (!spotifyExpiresAt) return "Connected";
    const mins = Math.max(0, Math.round((spotifyExpiresAt - Date.now()) / 60000));
    return mins > 0 ? `Connected (~${mins}m)` : "Connected";
  }, [spotifyConnected, spotifyExpiresAt]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8"
        >
          {/* Click backdrop to close */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Modal card - similar to AffiliateModal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full max-w-6xl",
              "bg-black/95 rounded-2xl sm:rounded-3xl",
              "border border-white/20 shadow-2xl shadow-black/50",
              "overflow-hidden flex flex-col",
              "max-h-[92vh]"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bm-music-modal-title"
          >
            {/* Close button - top right like AffiliateModal */}
            <button 
              ref={closeButtonRef}
              onClick={() => {
                SoundEffects.click();
                onClose();
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-[9999999] p-2.5 sm:p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 group"
              aria-label="Close modal"
              type="button"
            >
              <IconX className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Header */}
            <div className="relative flex items-center px-5 sm:px-8 py-5 sm:py-6 border-b border-white/10 shrink-0">
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 left-1/3 h-24 w-24 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -top-10 right-1/3 h-20 w-20 rounded-full bg-purple-500/15 blur-3xl" />
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <IconMusic className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" />
                </div>
                <div className="min-w-0">
                  <div id="bm-music-modal-title" className="text-lg sm:text-xl font-semibold text-white">
                    Music Player
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">Stream via official embeds</div>
                </div>
              </div>
            </div>

            {/* Provider tabs */}
            <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-2xl bg-white/5 border border-white/10">
                <ProviderTab provider="SPOTIFY" active={provider === "SPOTIFY"} onClick={() => setProvider("SPOTIFY")} />
                <ProviderTab provider="APPLE_MUSIC" active={provider === "APPLE_MUSIC"} onClick={() => setProvider("APPLE_MUSIC")} />
                <ProviderTab provider="YOUTUBE" active={provider === "YOUTUBE"} onClick={() => setProvider("YOUTUBE")} />
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
              {/* Spotify */}
              {provider === "SPOTIFY" && (
                <div className="grid gap-6">
                  {/* Connect status */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        spotifyConnected ? "bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]" : "bg-white/20"
                      )} />
                      <span className="text-sm sm:text-base text-white/70">
                        {spotifyStatusText}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          SoundEffects.click();
                          window.location.href = "/api/spotify/login";
                        }}
                        className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-green-500/20 border border-green-500/30 text-sm font-medium text-green-300 hover:bg-green-500/30 transition-colors"
                        type="button"
                      >
                        Connect Spotify
                      </button>
                      <button
                        onClick={async () => {
                          SoundEffects.click();
                          await fetch("/api/spotify/logout", { method: "POST" });
                          setSpotifyConnected(false);
                          setSpotifyExpiresAt(null);
                        }}
                        className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
                        type="button"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Player */}
                  {!spotifyEmbedUrl ? (
                    <Hint
                      title="Set NEXT_PUBLIC_SPOTIFY_EMBED_URL to a Spotify embed URL"
                      example="https://open.spotify.com/embed/playlist/<id>"
                    />
                  ) : (
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                      <iframe
                        title="Spotify player"
                        src={spotifyEmbedUrl}
                        width="100%"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full h-[420px] sm:h-[500px] lg:h-[550px]"
                      />
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-white/40 leading-relaxed">
                    Playback via Spotify&apos;s official embed. Premium may be required for full playback.
                  </p>
                </div>
              )}

              {/* Apple Music */}
              {provider === "APPLE_MUSIC" && (
                <div className="grid gap-6">
                  {!appleMusicEmbedUrl ? (
                    <Hint
                      title="Set NEXT_PUBLIC_APPLE_MUSIC_EMBED_URL to an Apple Music embed URL"
                      example="https://embed.music.apple.com/us/playlist/<id>"
                    />
                  ) : (
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                      <iframe
                        title="Apple Music player"
                        src={appleMusicEmbedUrl}
                        width="100%"
                        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                        loading="lazy"
                        className="w-full h-[450px] sm:h-[520px] lg:h-[580px]"
                      />
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-white/40 leading-relaxed">
                    Playback via Apple Music&apos;s official embed. Subscription may be required.
                  </p>
                </div>
              )}

              {/* YouTube */}
              {provider === "YOUTUBE" && (
                <div className="grid gap-6">
                  {!youtubeEmbedUrl ? (
                    <Hint
                      title="Set NEXT_PUBLIC_YOUTUBE_MUSIC_EMBED_URL to a YouTube embed URL"
                      example="https://www.youtube.com/embed/<videoId>"
                    />
                  ) : (
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                      <div className="w-full aspect-video min-h-[300px] sm:min-h-[400px] lg:min-h-[480px]">
                        <iframe
                          title="YouTube player"
                          src={youtubeEmbedUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          loading="lazy"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-white/40 leading-relaxed">
                    Playback via YouTube&apos;s official embed. Governed by YouTube/Google terms.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {providerIcons[provider]}
                  <span className="text-sm sm:text-base text-white/60">Now playing on {providerLabels[provider]}</span>
                </div>
                <div className="text-xs sm:text-sm text-white/40">
                  Provider terms apply
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
