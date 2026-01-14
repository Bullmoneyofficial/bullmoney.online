# Shimmer Unification & FPS Optimizer

## Overview
All shimmer animations across the website now use a single, unified system from `UnifiedShimmer.tsx`. This reduces duplicate CSS keyframes, GPU memory usage, and improves FPS by having centralized animation control.

## What Changed

### 1. UnifiedShimmer.tsx Enhanced
- Added global FPS-aware quality control classes
- Added `shimmer-ping` animation (replaces `animate-ping`)
- Added shimmer quality context for components
- Added comprehensive CSS classes for scroll-aware pausing

**Available CSS Classes:**
- `.shimmer-line` - Left-to-right sweep animation
- `.shimmer-spin` - Rotation animation
- `.shimmer-pulse` - Opacity pulse
- `.shimmer-glow` - Box-shadow pulse
- `.shimmer-float` - Y-axis float
- `.shimmer-dot-pulse` - Scale + opacity pulse
- `.shimmer-ping` - Expanding ping effect
- `.shimmer-gpu` - GPU acceleration hint

### 2. PerformanceProvider.tsx Enhanced
- Advanced FPS optimizer now sets shimmer quality classes:
  - `shimmer-quality-high` (55+ FPS) - Full animations
  - `shimmer-quality-medium` (45-55 FPS) - Slower animations
  - `shimmer-quality-low` (30-45 FPS) - Minimal animations
  - `shimmer-quality-disabled` (<20 FPS) - Static only

### 3. Components Updated to Use Unified Shimmer

#### Navbar Components:
- **Dock.tsx** - Tooltip shimmer changed from motion.div to CSS class
- **MobileDropdownMenu.tsx** - Menu shimmer changed to CSS class
- **DockIcon.tsx** - `animate-ping` → `shimmer-ping`
- **MovingTradingTip.tsx** - `animate-ping` → `shimmer-ping`
- **MobileStaticHelper.tsx** - `animate-ping` → `shimmer-ping`

#### Panels:
- **UltimateControlPanel.tsx**:
  - Removed inline `@keyframes shimmer` definition
  - Background shimmer changed to CSS `.shimmer-spin`
  - Refresh icon changed to `shimmer-spin`

#### Other:
- **AudioWidget.tsx** - `animate-pulse` → `shimmer-pulse`
- **Mainpage/footer.tsx**:
  - Removed inline `@keyframes footer-*` definitions
  - `footer-shimmer-ltr` → `shimmer-line shimmer-gpu`
  - `footer-spin` → `shimmer-spin shimmer-gpu`
  - `footer-pulse-glow` → `shimmer-pulse`
  - `footer-dot-pulse` → `shimmer-dot-pulse`

### 4. globals.css Enhanced
Added global FPS quality control styles:
- Backdrop blur reduction on low FPS
- Shadow simplification on low FPS
- Canvas dimming when FPS is critical

## Performance Benefits

1. **Single Animation Source** - All keyframes defined once in UnifiedShimmer.tsx
2. **Dynamic Quality Control** - FPS monitoring adjusts animation complexity in real-time
3. **Scroll-Aware** - Animations pause during scroll for smoother performance
4. **GPU Optimized** - `shimmer-gpu` class adds transform hints
5. **Reduced Repaints** - Synchronized animations reduce style recalculations

## Usage

### Using CSS Classes Directly (Recommended for Performance)
```tsx
// Best performance - pure CSS
<div className="shimmer-line shimmer-gpu" style={{ background: '...' }} />
```

### Using React Components
```tsx
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';

<ShimmerLine color="blue" intensity="medium" speed="normal" />
<ShimmerBorder color="red" />
```

## FPS Quality Thresholds

| FPS Range | Quality | Effect |
|-----------|---------|--------|
| 55+ | HIGH | Full animations |
| 45-54 | MEDIUM | Slower animations, reduced blur |
| 30-44 | LOW | Minimal animations, reduced shadows |
| <20 | DISABLED | Static only, no effects |

## Files Modified

- `/components/ui/UnifiedShimmer.tsx`
- `/components/PerformanceProvider.tsx`
- `/components/navbar/Dock.tsx`
- `/components/navbar/MobileDropdownMenu.tsx`
- `/components/navbar/DockIcon.tsx`
- `/components/navbar/MovingTradingTip.tsx`
- `/components/navbar/MobileStaticHelper.tsx`
- `/components/UltimateControlPanel.tsx`
- `/components/AudioWidget.tsx`
- `/components/Mainpage/footer.tsx`
- `/app/globals.css`
