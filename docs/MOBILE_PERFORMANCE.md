# Mobile Performance Optimization Guide

This document explains how to use the mobile performance optimization system implemented in BullMoney.

## Overview

The mobile performance system provides:
- **Device detection** - Detects mobile/tablet/desktop and performance capabilities
- **Animation variants** - Pre-built optimized animations for different device tiers
- **CSS utilities** - Performance-focused CSS classes
- **React components** - Helper components for conditional rendering

## Quick Start

### 1. Use the Performance Hook

```tsx
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

function MyComponent() {
  const { 
    isMobile,
    animations,
    shouldSkipHeavyEffects,
    performanceTier 
  } = useMobilePerformance();

  return (
    <motion.div
      initial={animations.fadeIn.initial}
      animate={animations.fadeIn.animate}
      transition={animations.fadeIn.transition}
    >
      {!shouldSkipHeavyEffects && <ExpensiveEffect />}
    </motion.div>
  );
}
```

### 2. Use Pre-built Animation Variants

The system provides optimized animations for different scenarios:

```tsx
const { animations } = useMobilePerformance();

// Modal backdrop
animations.modalBackdrop.initial   // { opacity: 0 }
animations.modalBackdrop.animate   // { opacity: 1 }
animations.modalBackdrop.exit      // { opacity: 0 }
animations.modalBackdrop.transition // { duration: 0.15 } on mobile

// Modal content
animations.modalContent // Similar pattern with y-transforms

// Other variants
animations.fadeIn
animations.scaleIn
animations.slideUp
animations.listItem
```

### 3. Use Conditional Rendering Components

```tsx
import { 
  DesktopOnly, 
  MobileOnly, 
  SkipOnLowEnd 
} from '@/components/MobilePerformanceUtils';

// Only show on desktop
<DesktopOnly>
  <Spline3DScene />
</DesktopOnly>

// Only show on mobile
<MobileOnly>
  <MobileNavigation />
</MobileOnly>

// Skip on low-end devices
<SkipOnLowEnd fallback={<StaticImage />}>
  <AnimatedParticles />
</SkipOnLowEnd>
```

### 4. Use CSS Utility Classes

Add these classes to elements:

```css
/* Force GPU acceleration */
.gpu-accelerated

/* Skip animation on mobile */
.mobile-no-animate

/* Fade only (no transform) on mobile */
.mobile-fade-only

/* Disable backdrop-blur on mobile */
.mobile-no-blur

/* Simple background on mobile */
.mobile-simple-bg

/* Isolate repaints */
.perf-container
```

## Performance Tiers

The system classifies devices into tiers:

| Tier | Description | Animation Behavior |
|------|-------------|-------------------|
| `ultra` | High-end desktop/Apple Silicon | Full animations |
| `high` | Good desktop | Full animations |
| `medium` | Mobile/tablet with good specs | Simplified animations |
| `low` | Budget mobile/slow connection | Minimal animations |
| `minimal` | Prefers reduced motion | No animations |

Access the tier:
```tsx
const { performanceTier } = useMobilePerformance();
// Returns: 'ultra' | 'high' | 'medium' | 'low' | 'minimal'
```

## Best Practices

### 1. Avoid backdrop-blur on Mobile

```tsx
const { shouldDisableBackdropBlur } = useMobilePerformance();

<div className={shouldDisableBackdropBlur ? 'bg-black/80' : 'backdrop-blur-md bg-black/60'}>
```

### 2. Skip Complex Shadows on Mobile

```tsx
const { isMobile } = useMobilePerformance();

<div className={isMobile ? '' : 'shadow-[0_0_50px_rgba(59,130,246,0.3)]'}>
```

### 3. Use Simpler Transitions

```tsx
// Instead of spring animations
transition={{ type: 'spring', stiffness: 200, damping: 25 }}

// Use the optimized variants
const { animations } = useMobilePerformance();
transition={animations.modalContent.transition}
// On mobile: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
```

### 4. Skip Decorative Animations

```tsx
const { shouldSkipHeavyEffects } = useMobilePerformance();

{!shouldSkipHeavyEffects && (
  <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity }}>
    Decorative pulsing element
  </motion.div>
)}
```

### 5. Use MobileOptimizedModal for Modals

```tsx
import { MobileOptimizedModal } from '@/components/MobileOptimizedModal';

<MobileOptimizedModal
  isOpen={isOpen}
  onClose={onClose}
  size="lg"
  position="center"
>
  <ModalContent />
</MobileOptimizedModal>
```

## CSS Variables

The system sets CSS variables on `:root`:

```css
--animation-duration-fast: 0.15s;   /* 0.1s on mobile */
--animation-duration-normal: 0.3s;  /* 0.15s on mobile */
--animation-duration-slow: 0.5s;    /* 0.25s on mobile */
--animation-scale: 0.95;            /* 1 on mobile (no scale) */
--backdrop-blur: blur(20px);        /* blur(8px) on mobile */
--shadow-intensity: 1;              /* 0.5 on mobile */
```

## HTML Classes

The system adds classes to `<html>`:

- `.is-mobile` - Mobile device
- `.is-tablet` - Tablet device
- `.is-desktop` - Desktop device
- `.is-low-end` - Low-end device
- `.is-ios` - iOS device
- `.is-in-app-browser` - In-app browser (Instagram, TikTok, etc.)
- `data-performance-tier="..."` - Current tier

## Files Reference

| File | Purpose |
|------|---------|
| `hooks/useMobilePerformance.ts` | Main hook with device detection and animations |
| `contexts/MobilePerformanceProvider.tsx` | React context provider |
| `components/MobileOptimizedModal.tsx` | Pre-built optimized modal |
| `components/MobilePerformanceUtils.tsx` | Conditional rendering components |
| `app/styles/70-mobile-performance.css` | CSS optimizations |

## Migration Guide

To optimize an existing modal:

1. Import the hook:
   ```tsx
   import { useMobilePerformance } from '@/hooks/useMobilePerformance';
   ```

2. Get animation variants:
   ```tsx
   const { animations, shouldDisableBackdropBlur, isMobile } = useMobilePerformance();
   ```

3. Replace hardcoded animations:
   ```tsx
   // Before
   initial={{ opacity: 0, scale: 0.95, y: 20 }}
   animate={{ opacity: 1, scale: 1, y: 0 }}
   transition={{ type: 'spring', duration: 0.4 }}

   // After
   initial={animations.modalContent.initial}
   animate={animations.modalContent.animate}
   transition={animations.modalContent.transition}
   ```

4. Add conditional backdrop:
   ```tsx
   className={shouldDisableBackdropBlur ? 'bg-black/80' : 'backdrop-blur-md bg-black/60'}
   ```

5. Add mobile CSS utilities:
   ```tsx
   className="... mobile-no-blur gpu-accelerated"
   ```
