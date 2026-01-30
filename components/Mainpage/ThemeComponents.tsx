"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SoundProfile {
  name: string;
  volume: number;
}

export interface Theme {
  id: string;
  name: string;
  filter: string;
  mobileFilter: string;
  primaryColor?: string;
  status?: string;
  category?: string;
}

export const ALL_THEMES: Theme[] = [];
export const THEME_SOUNDTRACKS: Record<string, SoundProfile> = {};

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  sound: SoundProfile;
  setSound: (sound: SoundProfile) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState("dark");
  const [sound, setSound] = useState<SoundProfile>({ name: "default", volume: 50 });
  const [muted, setMuted] = useState(false);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, sound, setSound, muted, setMuted }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export interface ThemeSelectorProps {
  initialThemeId?: string;
  onThemeChange?: (themeId: string, sound: SoundProfile, muted: boolean) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ initialThemeId, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState(initialThemeId || "dark");

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId, { name: "default", volume: 50 }, false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleThemeChange("dark")}
        className={`px-4 py-2 rounded ${
          selectedTheme === "dark" ? "bg-white" : "bg-gray-700"
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => handleThemeChange("light")}
        className={`px-4 py-2 rounded ${
          selectedTheme === "light" ? "bg-white" : "bg-gray-700"
        }`}
      >
        Light
      </button>
    </div>
  );
};

export default ThemeProvider;
