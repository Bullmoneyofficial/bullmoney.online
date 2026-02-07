# Trading Sounds Integration

## Overview

This project now features a comprehensive MetaTrader 5-style trading sound system with modern tech UI sounds throughout the product/store sections. All sounds are sourced from the Mixkit free audio library via CDN for optimal performance.

## Sound Library

### Button & UI Interactions
- **buttonClick**: Modern click sound for all button interactions
- **buttonHover**: Subtle hover sound (quieter volume: 0.2)

### Trading Actions (MetaTrader 5 Style)
- **orderOpen**: Buy/Open position sound
- **orderClose**: Close position sound

### Alerts & Notifications
- **success**: Success notification tone
- **error**: Error alert sound
- **warning**: Warning beep
- **notification**: General notification sound

### Admin & Special Actions
- **adminAction**: Admin mode toggle/actions
- **delete**: Delete action sound

### Modal & Navigation
- **modalOpen**: Modal/panel open sound
- **modalClose**: Modal/panel close sound

### Product Actions
- **addToCart**: Add to cart sound
- **purchase**: Purchase complete sound

### Filter & Sort
- **filterApply**: Filter applied (quieter volume: 0.3)
- **sortChange**: Sort changed (quieter volume: 0.3)

## Implementation

### Hook Usage

```typescript
import { useTradingSounds } from '@/hooks/useTradingSounds';

// Initialize in your component
const { sounds } = useTradingSounds({ 
  enabled: true, 
  volume: 0.4, 
  preload: true 
});

// Play sounds on user interactions
sounds.buttonClick();
sounds.purchase();
sounds.error();
```

### Integration Points

#### ProductsSection Component
- **Card hover**: Subtle hover sound
- **Card click**: Modal open sound
- **Search typing**: Click sound on input
- **Category filter**: Filter apply sound
- **Sort toggle**: Sort change sound
- **Admin actions**: Admin action sounds
- **Delete product**: Delete sound
- **Modal close**: Close sound
- **Purchase button**: Purchase/error sound based on availability

#### Store Page
- **Featured view toggle**: Button click sound
- **Filter button**: Filter apply sound
- **Grid layout toggle**: Button click sound
- **View mode change**: Button click sound

## Configuration Options

### Volume Levels
Different sounds use different volume levels for better UX:
- **Default**: 0.4 (ProductsSection)
- **Store page**: 0.3 (less intrusive)
- **Hover sounds**: 0.2 (subtle feedback)
- **Filter/Sort**: 0.3 (background actions)

### Customization
You can customize the sound system by passing options to the hook:

```typescript
const { sounds, setVolume, stopAll } = useTradingSounds({
  enabled: true,        // Enable/disable sounds
  volume: 0.5,          // Master volume (0-1)
  preload: true,        // Preload sounds for instant playback
});

// Adjust volume dynamically
setVolume(0.7);

// Stop all playing sounds
stopAll();
```

## Browser Support

The sound system uses Howler.js with HTML5 Audio for maximum compatibility:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari (desktop & mobile)
- ✅ Mobile browsers (iOS/Android)

## Performance

- **Lazy loading**: Sounds not preloaded are loaded on-demand
- **CDN delivery**: Fast loading from Mixkit CDN
- **Singleton pattern**: Prevents multiple audio instances
- **Memory efficient**: Sounds are unloaded on component unmount

## Audio Sources

All sounds are from [Mixkit](https://mixkit.co/) - a free library of high-quality assets. No attribution required for commercial use.

## Future Enhancements

Potential additions:
- User preference to enable/disable sounds
- Custom sound themes
- Volume slider in settings
- Additional trading-specific sounds (stop-loss hit, profit target, etc.)
- Spatial audio for immersive trading experience
