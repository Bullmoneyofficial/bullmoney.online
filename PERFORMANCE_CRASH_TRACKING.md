# Performance & Crash Tracking Optimization Summary

## Overview
This update unifies and optimizes the performance system across all major components while adding comprehensive crash tracking and analytics via Supabase.

---

## 🚀 Performance Improvements

### 1. Unified Performance System (`lib/UnifiedPerformanceSystem.tsx`)
- **Single FPS Monitor**: One RAF loop for the entire app instead of multiple individual monitors
- **Shared Observer Pool**: Consolidates 27+ individual IntersectionObserver instances into a shared pool
- **Smart Component Caching**: Tracks usage patterns to intelligently preload/unload components
- **Dynamic Quality Adjustment**: Automatically adjusts shimmer/animation quality based on FPS

### 2. Components Optimized with Unified System
All these components now use `useComponentLifecycle` for:
- Automatic registration/unregistration
- FPS-aware shimmer control
- Smart render decisions

**Updated Components:**
- `components/navbar.tsx` - Priority 10 (highest)
- `components/AudioWidget.tsx` - Priority 7
- `components/hero.tsx` - Priority 9
- `components/features.tsx` - Priority 5
- `components/Chartnews.tsx` - Priority 6
- `components/UltimateControlPanel.tsx` - Priority 6
- `components/navbar/MobileStaticHelper.tsx` - Priority 3
- `components/navbar/MovingTradingTip.tsx` - Priority 3

### 3. Smart Storage System
The `SmartCache` class in UnifiedPerformanceSystem now:
- Tracks component mount times, visibility, and interactions
- Predicts which components to preload based on user patterns
- Suggests unloading dormant components when FPS drops
- Persists usage history for returning users

### 4. FPS-Based Quality Tiers
| FPS Range | Quality Level | Actions |
|-----------|---------------|---------|
| 55+ | High | Full shimmers, all animations |
| 50-54 | Medium | Reduced animation speed |
| 35-49 | Low | Minimal shimmers, simpler effects |
| 25-34 | Very Low | Shimmers disabled |
| <25 | Critical | All animations paused |

---

## 📊 Crash Tracking System (`lib/CrashTracker.tsx`)

### Features
1. **Event Tracking**
   - Button clicks with component context
   - Modal opens/closes
   - Component mount/unmount lifecycle
   - Performance warnings (FPS drops)
   - Custom events

2. **Error Tracking**
   - JavaScript errors caught globally
   - Unhandled promise rejections
   - Component-specific errors
   - Stack traces preserved

3. **Session Analytics**
   - Device info (tier, browser, OS, screen)
   - Page views
   - Event counts
   - Error counts
   - Session duration

4. **Smart Batching**
   - Events queued and batched (20 at a time)
   - Auto-flush every 30 seconds
   - Immediate flush on crashes
   - SendBeacon for page unload

5. **Offline Support**
   - Failed events stored in localStorage
   - Auto-retry on next session
   - Up to 200 events cached offline

### Tracking Hooks Available
```tsx
// Full component tracking
const { trackClick, trackError, trackCustom } = useComponentTracking('navbar');

// Modal tracking
const { onOpen, onClose } = useTrackModal('themeSelectorModal');

// Simple lifecycle tracking
useTrackComponent('features');
```

---

## 🗄️ Supabase Database Schema

Run `supabase/migrations/001_crash_tracking.sql` to create:

### Tables
- `crash_logs` - All tracking events
- `user_sessions` - Session-level data
- `performance_metrics` - Aggregated performance data

### Views
- `error_summary` - Errors grouped by component
- `session_health` - Session health status
- `component_usage` - Component interaction stats

---

## 🔧 API Endpoints

### POST `/api/crash-log`
Receives batched events from the CrashTracker.
Used by `navigator.sendBeacon()` on page unload for reliable delivery.

---

## 📁 Files Created/Modified

### Created
- `lib/CrashTracker.tsx` - Crash tracking system
- `app/api/crash-log/route.ts` - API endpoint
- `supabase/migrations/001_crash_tracking.sql` - Database schema

### Modified
- `lib/UnifiedPerformanceSystem.tsx` - Added more tracked components
- `app/layout.tsx` - Added CrashTrackerProvider
- `app/page.tsx` - Added performance tracking
- `components/navbar.tsx` - Added crash tracking
- `components/AudioWidget.tsx` - Added crash tracking
- `components/hero.tsx` - Added imports
- `components/features.tsx` - Added imports
- `components/Chartnews.tsx` - Added imports
- `components/UltimateControlPanel.tsx` - Added imports
- `components/navbar/MobileStaticHelper.tsx` - Added imports
- `components/navbar/MovingTradingTip.tsx` - Added imports

---

## 🎯 Usage Examples

### Track Button Click
```tsx
const { trackClick } = useComponentTracking('navbar');

<button onClick={() => {
  trackClick('menu_button', { isOpen: !open });
  setOpen(!open);
}}>
  Menu
</button>
```

### Track Modal
```tsx
const { onOpen, onClose } = useTrackModal('affiliateModal');

useEffect(() => {
  if (isOpen) onOpen({ source: 'navbar' });
  else onClose();
}, [isOpen]);
```

### Track Performance Issue
```tsx
const { trackPerformanceWarning } = useCrashTracker();

useEffect(() => {
  if (averageFps < 25) {
    trackPerformanceWarning('spline', averageFps, 'FPS critical during 3D render');
  }
}, [averageFps]);
```

---

## ⚡ CSS Performance Classes

The existing `styles/performance-optimizations.css` includes:

- `shimmer-quality-disabled` - All shimmers off
- `shimmer-quality-low` - Slow shimmers
- `shimmer-quality-medium` - Moderate shimmers
- `is-scrolling` - Pause animations during scroll
- `reduce-animations` - Minimal transitions
- `reduce-blur` - Lower blur quality
- `reduce-shadows` - Disable shadows
- `component-inactive-{name}` - Per-component animation control

---

## 🔄 Provider Order (layout.tsx)

```
CacheManagerProvider
└── ThemeProvider
    └── GlobalThemeProvider
        └── AudioSettingsProvider
            └── StudioProvider
                └── ShopProvider
                    └── UnifiedPerformanceProvider ← Single FPS monitor
                        └── CrashTrackerProvider  ← Error/event logging
                            └── FpsOptimizerProvider
                                └── PerformanceProvider
                                    └── App Content
```

---

## ✅ Setup Checklist

1. [ ] Run Supabase migration: `supabase/migrations/001_crash_tracking.sql`
2. [ ] Verify `.env.local` has Supabase keys
3. [ ] Test crash tracking in dev: Check browser console for `[CrashTracker]` logs
4. [ ] Monitor Supabase dashboard for incoming events
5. [ ] Use `error_summary` view to find crash patterns
