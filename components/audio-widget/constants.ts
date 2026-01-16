"use client";

import React from "react";
import {
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
} from "@tabler/icons-react";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

export const sourceLabel: Record<MusicSource, string> = {
  THEME: "Theme",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE: "YouTube",
};

export const streamingOptions: { 
  value: MusicSource; 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  recommended?: boolean 
}[] = [
  { value: "SPOTIFY", label: "Spotify", icon: React.createElement(IconBrandSpotify, { className: "w-5 h-5" }), color: "blue" },
  { value: "APPLE_MUSIC", label: "Apple", icon: React.createElement(IconBrandApple, { className: "w-5 h-5" }), color: "blue" },
  { value: "YOUTUBE", label: "YouTube", icon: React.createElement(IconBrandYoutube, { className: "w-5 h-5" }), color: "blue", recommended: true },
];

export const sourceIcons: Partial<Record<MusicSource, React.ComponentType<{ className?: string }>>> = {
  SPOTIFY: IconBrandSpotify,
  APPLE_MUSIC: IconBrandApple,
  YOUTUBE: IconBrandYoutube,
};

export const tutorialSteps = [
  {
    title: "🎧 Choose Your Music Service",
    description: "Tap Spotify, Apple Music, or YouTube to select where your music comes from. A player will appear so you can start playing.",
  },
  {
    title: "▶️ Start Playing Music",
    description: "After selecting a service, close this menu to see the player. Then tap the play button inside the player to start your music!",
  },
  {
    title: "◀️ Hide the Player",
    description: "Want to hide the player? Just tap the arrow on its edge. Your music keeps playing! Tap again to show it.",
  },
  {
    title: "🔊 Adjust Your Experience",
    description: "Use the sliders to control music volume and interaction sounds. Toggle navbar tips on/off as needed.",
  },
];
