# 🔵 Enhanced Shimmer Animation Patterns - Quick Reference

## Pattern 1: Opacity Fade-In/Out (Most Common)

Used for all left-to-right shimmer animations to create smooth entry/exit effect.

```css
@keyframes enhanced-shimmer-ltr {
  0% { 
    transform: translateX(-100%);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  50% { 
    transform: translateX(50%);
    opacity: 1;
  }
  80% {
    opacity: 0.5;
  }
  100% { 
    transform: translateX(200%);
    opacity: 0;
  }
}

.shimmer-enhanced {
  animation: enhanced-shimmer-ltr 3.5s linear infinite;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}
```

**Used In:**
- ShopHero.tsx (shimmer animation)
- MultiStepLoader.tsx (text-shimmer)
- MultiStepLoaderVip.tsx
- MultiStepLoaderAffiliate.tsx
- ShopScrollFunnel.tsx (shimmer)

---

## Pattern 2: Pulse with Glow (Interactive Elements)

Used for pulsing animations that need to draw attention.

```css
@keyframes enhanced-pulse {
  0%, 100% {
    opacity: 0.3;
    filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3));
  }
  50% {
    opacity: 0.8;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
  }
}

.pulse-element {
  animation: enhanced-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Used In:**
- FpsCandlestickChart.tsx (pulse animation)
- LiveMarketTickerOptimized.tsx (pulse-gpu)
- ShopScrollFunnel.tsx (pulse animation)

---

## Pattern 3: Gradient Background Shimmer

Used for large area shimmers with color gradients.

```css
@keyframes shimmer-with-gradient {
  0% {
    background-position: 200% center;
  }
  50% {
    background-position: 0% center;
  }
  100% {
    background-position: -200% center;
  }
}

.shimmer-gradient {
  background: linear-gradient(
    110deg,
    #475569 20%,      /* Slate start */
    #ffffff 48%,      /* White peak */
    #3b82f6 52%,      /* Blue peak */
    #475569 80%       /* Slate end */
  );
  background-size: 200% auto;
  animation: shimmer-with-gradient 3.5s linear infinite;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}
```

**Used In:**
- MultiStepLoader.tsx (text background)
- gpu-animations.css (skeleton shimmer)

---

## Pattern 4: Box-Shadow Glow Pulse

Used for elements that need expanding glow effects.

```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    opacity: 0.6;
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
    opacity: 1;
  }
}

.glow-element {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

**Used In:**
- UnifiedShimmer.tsx (shimmer-glow class)
- ShopScrollFunnel.tsx (particle fade)

---

## Pattern 5: Particle Trail Fade with Glow

Used for particle effects that fade out while maintaining glow.

```css
@keyframes particle-fade-glow {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.8));
  }
  50% {
    opacity: 0.6;
    filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
  }
  100% {
    opacity: 0;
    transform: translate(0, -20px) scale(0.5);
    filter: drop-shadow(0 0 0px rgba(59, 130, 246, 0));
  }
}
```

**Used In:**
- ShopScrollFunnel.tsx (particleFade)
- game-animations.css (shimmer)

---

## Pattern 6: Performance-Aware Animation Duration

Adjust animation speed based on device capability.

```css
/* High-end devices: Fast, smooth animations */
.fps-high .shimmer-element {
  animation-duration: 10s;
  opacity: 0.95;
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
}

/* Mid-range devices: Moderate animations */
.fps-medium .shimmer-element {
  animation-duration: 12-14s;
  opacity: 0.85;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}

/* Low-end devices: Slow animations to preserve battery */
.fps-low .shimmer-element {
  animation-duration: 22-28s;
  opacity: 0.7;
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
}

/* Very old devices: Ultra-slow animations */
.fps-minimal .shimmer-element {
  animation-duration: 30-40s;
  opacity: 0.6;
  filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.2));
}
```

**Applied In:**
- UnifiedShimmer.tsx (fps-minimal, fps-low, fps-medium, fps-high, fps-ultra classes)

---

## Pattern 7: Mobile-Optimized Shimmer

Used for mobile devices to balance aesthetics with battery life.

```css
@media (max-width: 768px) {
  .shimmer-line { 
    animation-duration: 14s;
    opacity: 0.85;
    filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4));
  }
  
  .shimmer-glow { 
    animation-duration: 14s;
    opacity: 0.8;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  }
}
```

**Applied In:**
- UnifiedShimmer.tsx (mobile media query)
- All component files with shimmer animations

---

## Pattern 8: Component-Inactive State

Used when component is offscreen or inactive to reduce GPU load.

```css
html.component-inactive-navbar .navbar-shimmer .shimmer-line,
html.component-inactive-footer .footer-shimmer .shimmer-line {
  animation-duration: 28s !important;
  opacity: 0.7;
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5)) !important;
}
```

**Applied In:**
- UnifiedShimmer.tsx (component-inactive CSS)

---

## Pattern 9: iOS/Safari Specific Optimization

Used for Safari-specific performance tuning.

```css
@supports (-webkit-appearance: none) {
  .shimmer-line {
    animation-duration: 16s;
    opacity: 0.8;
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
    -webkit-transform: translateZ(0);
  }
}
```

**Applied In:**
- UnifiedShimmer.tsx (iOS/Safari CSS)

---

## Pattern 10: Quality-Tier Animation Degradation

Used to maintain aesthetic while respecting device capabilities.

```css
/* Normal quality */
.shimmer-quality-medium {
  animation-duration: 14s;
  opacity: 0.9;
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
}

/* Low quality - still aesthetic but slower */
.shimmer-quality-low {
  animation-duration: 20-22s;
  opacity: 0.8;
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5));
}

/* Disabled quality - minimal but visible */
.shimmer-quality-disabled {
  animation-duration: 30-35s;
  opacity: 0.5;
  filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3));
}
```

**Applied In:**
- UnifiedShimmer.tsx (quality-tier CSS)

---

## Blue Glow Color Specifications

All glow effects use the same blue color with varying opacity:

```css
/* Base Blue Color */
#3B82F6 (RGB: 59, 130, 246)

/* Drop-shadow Glows */
drop-shadow(0 0 2px rgba(59, 130, 246, 0.2))   /* Minimal */
drop-shadow(0 0 3px rgba(59, 130, 246, 0.3))   /* Low */
drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))   /* Normal */
drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))   /* High */
drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))   /* Maximum */

/* Box-shadow Glows */
box-shadow: 0 0 10px rgba(59, 130, 246, 0.3)
box-shadow: 0 0 20px rgba(59, 130, 246, 0.5)
box-shadow: 0 0 30px rgba(59, 130, 246, 0.8)
```

---

## Theme-Specific Gradient Colors

```css
/* Primary (Blue) */
Slate: #475569
White: #ffffff
Blue:  #3B82F6

/* VIP (Purple & Gold) */
Purple: #581c87
White:  #ffffff
Gold:   #fcd34d

/* Affiliate (Indigo & Cyan) */
Indigo: #4338ca
White:  #ffffff
Cyan:   #06b6d4
```

---

## Animation Duration Reference

| Context | Duration | Use Case |
|---------|----------|----------|
| fps-ultra | 8-10s | Latest devices, smooth 60fps |
| fps-high | 10s | Modern smartphones |
| fps-medium | 12-14s | Mid-range phones |
| fps-low | 22-28s | Low-end phones |
| fps-minimal | 30-40s | Very old phones, battery preservation |
| mobile (@media 768px) | 12-16s | Tablet, battery preservation |
| component-inactive | 28s | Offscreen components |
| quality-medium | 14s | Normal rendering |
| quality-low | 20-22s | Reduced GPU |
| quality-disabled | 30-35s | Minimal rendering |

---

## Implementation Checklist

When adding new shimmer animations:

- [ ] Use opacity fade pattern (0% → 20% → 50% → 100%)
- [ ] Add blue drop-shadow glow effect
- [ ] Set base duration to 3.5s for text, 2s for pulse
- [ ] Add FPS tier overrides (minimal, low, medium, high, ultra)
- [ ] Add mobile media query (@media 768px)
- [ ] Add quality tier fallbacks (medium, low, disabled)
- [ ] Add iOS/Safari specific rules if needed
- [ ] Test on iPhone 6s (fps-minimal)
- [ ] Test on latest iPhone (fps-ultra)
- [ ] Verify no animation jank at any tier
- [ ] Clear .next cache before testing

---

## Troubleshooting

**Animation doesn't show glow effect:**
- Check that filter property is not being overridden
- Verify rgba color values are correct
- Ensure @keyframes use opacity changes

**Animation too fast/slow:**
- Check animation-duration in FPS tier CSS
- Verify @media queries are applying on mobile
- Check for conflicting animation-duration rules

**Animation doesn't fade smoothly:**
- Verify opacity keyframes: 0% → 20% → 50% → 100%
- Check that no conflicting opacity rules exist
- Ensure animation-timing-function is linear or ease-in-out

**Glow effect too subtle:**
- Increase drop-shadow blur radius (second value)
- Increase drop-shadow opacity (rgba fourth value)
- Use box-shadow instead of drop-shadow for stronger effect

---

**Last Updated:** 2024
**Version:** 1.0 (Complete Shimmer Enhancement)
