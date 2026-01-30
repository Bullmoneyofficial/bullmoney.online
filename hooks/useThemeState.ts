import { useState, useRef, useMemo, useCallback } from 'react';
import { ALL_THEMES, Theme, SoundProfile } from '@/components/Mainpage/ThemeComponents';
import { getThemeColor, FALLBACK_THEME } from '@/lib/pageConfig';
import { userStorage } from '@/lib/smartStorage';
import { playClick } from '@/lib/interactionUtils';

/**
 * Manages theme selection and configuration
 */
export function useThemeState() {
  const [activeThemeId, setActiveThemeId] = useState<string>('t01');
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [musicKey, setMusicKey] = useState(0);

  const themeChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);

  const accentColor = useMemo(() => getThemeColor(activeThemeId) || '#ffffff', [activeThemeId]);

  const handleThemeChange = useCallback((themeId: string, _sound: SoundProfile, muted: boolean, safePlay: () => void) => {
    console.log('[Theme] Changing theme to:', themeId, 'muted:', muted);

    if (themeChangeTimerRef.current) {
      clearTimeout(themeChangeTimerRef.current);
    }

    setActiveThemeId(themeId);
    userStorage.set('user_theme_id', themeId);
    setParticleTrigger(prev => prev + 1);

    themeChangeTimerRef.current = setTimeout(() => {
      setMusicKey(prev => prev + 1);
      if (!muted) {
        setTimeout(() => safePlay(), 100);
      }
      themeChangeTimerRef.current = null;
    }, 200);
  }, []);

  const handleQuickThemeChange = useCallback((themeId: string, isMuted: boolean, safePlay: () => void) => {
    console.log('[Theme] Quick changing theme to:', themeId);

    if (themeChangeTimerRef.current) {
      clearTimeout(themeChangeTimerRef.current);
    }

    setActiveThemeId(themeId);
    userStorage.set('user_theme_id', themeId);
    setParticleTrigger(prev => prev + 1);

    themeChangeTimerRef.current = setTimeout(() => {
      setMusicKey(prev => prev + 1);
      if (!isMuted) {
        setTimeout(() => safePlay(), 100);
      }
      themeChangeTimerRef.current = null;
    }, 200);

    playClick();
  }, []);

  return {
    activeThemeId,
    setActiveThemeId,
    activeTheme,
    accentColor,
    particleTrigger,
    setParticleTrigger,
    musicKey,
    setMusicKey,
    handleThemeChange,
    handleQuickThemeChange,
    themeChangeTimerRef,
  };
}
