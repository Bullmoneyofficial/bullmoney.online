# Discord Modal UI Integration - Changes Summary

## Overview
Updated the UI state management to handle the Discord Stage modal with specific behaviors:
1. **Ultimate Control Panel hides** when the Discord modal is open
2. **Audio Widget remains visible** when the Discord modal is open (so users can control Discord volume)

## Files Modified

### 1. `/contexts/UIStateContext.tsx`
**Changes**: Lines 220-235
- Added `shouldNotMinimizeForThisModal` derived state that returns `true` when Discord modal is open
- Modified `shouldMinimizeAudioWidget` logic to exclude Discord modal:
  ```tsx
  const shouldMinimizeAudioWidget = isMobileMenuOpen || isUltimatePanelOpen || 
    (isAnyModalOpen && !shouldNotMinimizeForThisModal);
  ```
- Updated `hasOverlayingUI` to also exclude Discord modal

**Impact**: Audio widget now stays visible during Discord modal so users can always access volume controls

### 2. `/components/UltimateControlPanel.tsx`
**Changes**: Lines 640-662 and line 1303
- Added `isDiscordModalOpen` state check from UIStateContext:
  ```tsx
  const isDiscordModalOpen = useMemo(() => {
    if (!uiStateContext) return false;
    return uiStateContext.isDiscordStageModalOpen;
  }, [uiStateContext?.isDiscordStageModalOpen]);
  ```
- Added `shouldHidePanel` derived state:
  ```tsx
  const shouldHidePanel = isDiscordModalOpen;
  ```
- Updated the panel render condition from `{isOpen && (` to `{isOpen && !shouldHidePanel && (`:
  ```tsx
  {isOpen && !shouldHidePanel && (
    <React.Fragment key="panel-wrapper">
      {/* Panel content */}
    </React.Fragment>
  )}
  ```

**Impact**: Ultimate control panel is hidden when Discord modal is open, preventing overlap

## User Experience Changes

### Before
- Ultimate Control Panel would remain visible when Discord modal opened
- Audio Widget might minimize when Discord modal opened, preventing volume control

### After
- ✅ Discord modal appears cleanly without the control panel overlapping
- ✅ Audio widget remains visible at all times during Discord modal
- ✅ Users can always control Discord volume through the audio widget
- ✅ FPS metrics still visible in minimized state if needed

## Technical Details

### Discord Modal Detection
The system uses `isDiscordStageModalOpen` from UIStateContext which is:
- Set to `true` when Discord Stage modal opens
- Automatically closed by mutual exclusion when other modals open
- Tracked in the `activeComponent` state for analytics

### Audio Widget Behavior
- **During Discord Modal**: Widget stays open with full functionality
- **Pull-to-Minimize Tab**: Still available on the left side for users who want to minimize
- **Volume Controls**: Always accessible for Discord audio management

### Control Panel Behavior
- **During Discord Modal**: Completely hidden (AnimatePresence condition fails)
- **After Discord Modal Closes**: Returns to previous state automatically
- **Responsive**: Works on both mobile and desktop screens

## Testing Checklist
- [x] Build completes without errors
- [x] UIStateContext properly exposes Discord modal state
- [x] Audio widget visible during Discord modal
- [x] Control panel hidden during Discord modal
- [x] Other modals still close correctly via mutual exclusion
- [x] No memory leaks in state management

## Backwards Compatibility
✅ All changes are backwards compatible:
- Existing modal behavior unchanged (except Discord modal)
- Audio widget functionality preserved
- Control panel features intact
- No breaking API changes
