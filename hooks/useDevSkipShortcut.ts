import { useEffect } from 'react';

/**
 * Custom hook to listen for cmd+s (Mac) or ctrl+s (Windows/Linux) keyboard shortcut
 * This allows developers to skip page mode and loader during development
 * 
 * Usage:
 * useDevSkipShortcut(() => {
 *   console.log('User pressed cmd+s to skip!');
 *   setCurrentView('content');
 * });
 */
export function useDevSkipShortcut(onSkip: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for cmd+s (Mac) or ctrl+s (Windows/Linux)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isSkipShortcut = isMac ? e.metaKey && e.key === 's' : e.ctrlKey && e.key === 's';

      if (isSkipShortcut) {
        e.preventDefault();
        console.log('[DevSkipShortcut] Skipping page mode and loader');
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);
}
