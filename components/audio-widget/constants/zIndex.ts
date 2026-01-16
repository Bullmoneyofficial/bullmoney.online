// Z-Index Constants - Centralized for consistency
// Using very high values to ensure ALL elements render ABOVE everything else
// Hierarchy: Base < Controls < HUD < Effects < Hints < Helpers < Tutorial < Tooltips < Modal
export const Z_INDEX = {
  PULL_TAB: 2147483600,        // Minimized pull tab - high priority
  PLAYER_BASE: 2147483610,     // Main iPhone container
  PLAYER_CONTROLS: 2147483620, // Volume, power buttons
  VOLUME_SLIDER: 2147483630,   // Volume overlay
  LOCK_SCREEN: 2147483640,     // Lock screen overlay
  GAME_HUD: 2147483650,        // Game score HUD
  EFFECTS: 2147483660,         // Sparkles, confetti
  SWIPE_HINT: 2147483670,      // "Swipe to minimize" hint
  HELPERS: 2147483680,         // First time help tips
  TUTORIAL: 2147483690,        // Game tutorial - MUST be above iPhone
  TOOLTIPS: 2147483695,        // Button tooltips - highest UI element
  CAMERA_MODAL: 2147483647,    // Camera modal - max safe integer
} as const;
