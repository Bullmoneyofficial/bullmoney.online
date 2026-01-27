"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bullmoney_hero_video_visit_count";
const MAX_FULL_VOLUME_VISITS = 2; // First load + one revisit
const FULL_VOLUME = 100;
const QUIET_VOLUME = 1;

let visitRecordedThisSession = false;

export type HeroVideoVolumeProfile = {
  visitCount: number;
  isLoudPhase: boolean;
  volume: number;
  ready: boolean;
};

const defaultProfile: HeroVideoVolumeProfile = {
  visitCount: 0,
  isLoudPhase: false,
  volume: 0,
  ready: false,
};

const readVisitCount = (): number => {
  if (typeof window === "undefined") return 0;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed = rawValue ? parseInt(rawValue, 10) : 0;
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return 0;
  } catch (error) {
    console.warn("[HeroVideoVolume] Unable to read visit count", error);
    return 0;
  }
};

const persistVisitCount = (nextCount: number) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(nextCount));
  } catch (error) {
    console.warn("[HeroVideoVolume] Unable to persist visit count", error);
  }
};

const buildProfile = (visitCount: number): HeroVideoVolumeProfile => {
  const isLoudPhase = visitCount < MAX_FULL_VOLUME_VISITS;
  return {
    visitCount,
    isLoudPhase,
    volume: isLoudPhase ? FULL_VOLUME : QUIET_VOLUME,
    ready: true,
  };
};

export const useHeroVideoVolume = () => {
  const [profile, setProfile] = useState<HeroVideoVolumeProfile>(defaultProfile);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const visitCount = readVisitCount();
    setProfile(buildProfile(visitCount));

    if (!visitRecordedThisSession) {
      visitRecordedThisSession = true;
      persistVisitCount(visitCount + 1);
    }
  }, []);

  const resolveVolume = useCallback(
    (isMuted: boolean) => {
      if (!profile.ready) return 0;
      return isMuted ? 0 : profile.volume;
    },
    [profile.ready, profile.volume],
  );

  return { ...profile, resolveVolume };
};
