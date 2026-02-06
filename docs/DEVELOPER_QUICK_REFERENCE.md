# Developer Guide: Skip Pagemode & Loader

## Quick Start

Press **cmd+s** (Mac) or **ctrl+s** (Windows/Linux) anywhere on the page to instantly skip the pagemode and loader screens and go directly to the main content.

## What Happens When You Press the Shortcut

✅ Pagemode is skipped
✅ Loader is skipped  
✅ Content view is immediately displayed
✅ All V2 content is unlocked
✅ Console logs the action for debugging

## Implementation

- **Hook**: `useDevSkipShortcut` in `hooks/useDevSkipShortcut.ts`
- **State**: `devSkipPageModeAndLoader` in UIStateContext
- **Integration**: Both `app/page.tsx` and `app/desktop/page.tsx`

## Files Involved

```
hooks/useDevSkipShortcut.ts          - Keyboard listener hook
contexts/UIStateContext.tsx           - Global state management  
app/page.tsx                          - Main page integration
app/desktop/page.tsx                  - Desktop page integration
```

## Browser Support

Works on all modern browsers that support:
- KeyboardEvent API
- navigator.platform detection
- Event prevention with preventDefault()

## Console Output

When the shortcut is triggered, you'll see:
```
[DevSkipShortcut] Skipping page mode and loader
[DevSkip] Skipping pagemode and loader - going directly to content
```

## Development Tips

- The hook is automatically active in both mobile and desktop views
- The shortcut is intercepted to prevent browser default save behavior
- State persists via UIStateContext for consistency across navigation
- Safe to use during development without affecting production behavior
