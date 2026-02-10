// Z-Index Constants - Centralized for consistency
// Max safe CSS z-index is 2147483647 (32-bit signed int)
// Hierarchy: Base < Controls < HUD < Effects < Hints < Helpers < Tutorial < Tooltips < Chat < Modal
export const Z_INDEX = {
  PULL_TAB: 2147483600,        // Minimized pull tab - high priority
  PLAYER_BASE: 2147483610,     // Main iPhone container
  PLAYER_CONTROLS: 2147483620, // Volume, power buttons
  VOLUME_SLIDER: 2147483625,   // Volume overlay
  LOCK_SCREEN: 2147483630,     // Lock screen overlay
  GAME_HUD: 2147483632,        // Game score HUD
  EFFECTS: 2147483634,         // Sparkles, confetti
  SWIPE_HINT: 2147483636,      // "Swipe to minimize" hint
  HELPERS: 2147483638,         // First time help tips
  TUTORIAL: 2147483640,        // Game tutorial - MUST be above iPhone
  TOOLTIPS: 2147483642,        // Button tooltips
  OPEN_CHAT: 2147483644,       // Open chat button/overlay
  CAMERA_MODAL: 2147483647,    // Camera modal - max safe 32-bit integer
} as const;
