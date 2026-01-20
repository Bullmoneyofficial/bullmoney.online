# Dev Skip Pagemode & Loader Feature

## Summary
Added a keyboard shortcut feature that allows developers to skip the page mode and loader screens and go directly to the main content by pressing **cmd+s** (Mac) or **ctrl+s** (Windows/Linux).

## Implementation Details

### Files Created

1. **[hooks/useDevSkipShortcut.ts](hooks/useDevSkipShortcut.ts)** - New custom hook
   - Listens for cmd+s (Mac) or ctrl+s (Windows/Linux) keyboard shortcut
   - Calls a callback function when the shortcut is pressed
   - Automatically detects the OS and uses the appropriate modifier key

### Files Modified

2. **[contexts/UIStateContext.tsx](contexts/UIStateContext.tsx)**
   - Added `devSkipPageModeAndLoader` boolean state to track skip status
   - Added `setDevSkipPageModeAndLoader` setter function
   - Added both to the context interface and provider value

3. **[app/page.tsx](app/page.tsx)**
   - Imported `useDevSkipShortcut` hook
   - Added hook call in HomeContent that:
     - Sets `devSkipPageModeAndLoader` to true
     - Changes `currentView` to 'content'
     - Unlocks V2 content with `setV2Unlocked(true)`

4. **[app/desktop/page.tsx](app/desktop/page.tsx)**
   - Imported `useDevSkipShortcut` hook
   - Applied the same implementation to DesktopHomeContent function

## How to Use

1. **On Mac**: Press `cmd + s` anywhere on the page while in pagemode or loader
2. **On Windows/Linux**: Press `ctrl + s` anywhere on the page while in pagemode or loader

When triggered:
- The keyboard shortcut will be intercepted (preventDefault called)
- A console log message will appear: `[DevSkip] Skipping pagemode and loader - going directly to content`
- The page will immediately jump to the main content view
- All content will be unlocked as if the user completed the registration flow

## Technical Details

- The hook uses `navigator.platform` to detect the OS
- The shortcut is preventDefault'd to avoid browser default behavior (save page)
- Console logging provides development feedback
- The feature works across both mobile and desktop pages
- UIStateContext manages the global state for consistency

## Files Summary

```
Created:
- hooks/useDevSkipShortcut.ts

Modified:
- contexts/UIStateContext.tsx (added state management)
- app/page.tsx (added hook integration)
- app/desktop/page.tsx (added hook integration)
```
