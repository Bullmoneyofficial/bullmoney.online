# Navbar Implementation Guide

## Quick Start

### Using the New Navbar Structure

```tsx
// Simple import - everything is available
import { Navbar } from '@/components/navbar';

// Or import individual components if needed
import { 
  Dock, 
  DockIcon, 
  DockLabel 
} from '@/components/navbar';
```

## Component Reference

### 1. Main Navbar Component
**File**: `components/navbar.tsx`

```tsx
export const Navbar = () => {
  // Manages all state and orchestrates sub-components
  return (
    // Desktop + Mobile layouts
    // All modals and helpers
  );
};
```

**Props**: None (uses context)
**Exports**: `Navbar`

### 2. DesktopNavbar
**File**: `components/navbar/DesktopNavbar.tsx`

Desktop-specific navigation layout with logo and dock.

```tsx
interface DesktopNavbarProps {
  isXMUser: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasReward: boolean;
  dockRef: React.RefObject<HTMLDivElement>;
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange: (isHovered: boolean) => void;
  // ... callbacks
}
```

**Features**:
- Responsive logo display
- Dock with magnification effects
- Conditional admin button

### 3. Dock Component
**File**: `components/navbar/Dock.tsx`

Main container with mouse-tracking magnification effects.

```tsx
interface DockProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
    tips?: string[];
    onClick?: () => void;
    href?: string;
    triggerComponent?: React.ReactNode;
    showShine?: boolean;
    isXMHighlight?: boolean;
  }>;
  className?: string;
  baseItemSize?: number;
  magnification?: number;
  spring?: any;
  distance?: number;
}
```

**Features**:
- RAF-throttled mouse tracking (120Hz)
- Spring physics animations
- Smooth magnification on hover
- Performance optimized

### 4. DockIcon Component
**File**: `components/navbar/DockIcon.tsx`

Renders the icon with optional shine effects.

```tsx
interface DockIconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  showShine?: boolean;
  isXMUser?: boolean;
}
```

**Features**:
- Animated shine background
- Notification dot
- XM user highlighting (red)
- Hover glow effect

### 5. DockLabel Component
**File**: `components/navbar/DockLabel.tsx`

Tooltip with rotating tip text.

```tsx
interface DockLabelProps {
  children: React.ReactNode;
  tips?: string[];
  className?: string;
  isHovered?: any;
  isXMUser?: boolean;
}
```

**Features**:
- Smart positioning with resize handling
- Rotating tip text display
- Arrow pointing to parent
- Pulse indicator animation

### 6. DockItem Component
**File**: `components/navbar/DockItem.tsx`

Individual dock item wrapper.

```tsx
interface DockItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  itemRef?: (el: HTMLDivElement | null) => void;
}
```

**Features**:
- Ref management (internal + external)
- Mouse distance calculation
- Size animation
- Sound effects on interaction

### 7. MovingTradingTip
**File**: `components/navbar/MovingTradingTip.tsx`

Floating tip that follows dock buttons.

```tsx
interface MovingTradingTipProps {
  tip: { target: string; text: string; buttonIndex: number };
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  dockRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}
```

**Features**:
- Follows button positions
- Responsive to resize
- Spring animations
- Desktop only (hidden on mobile)

### 8. MobileStaticHelper
**File**: `components/navbar/MobileStaticHelper.tsx`

Rotating helper tips for mobile.

```tsx
export const MobileStaticHelper = () => {
  // Auto-rotating tips every 4.5 seconds
};
```

**Features**:
- Auto-cycle through tips
- Fade transition animations
- Mobile only (hidden on desktop)
- Lightweight

### 9. MobileDropdownMenu
**File**: `components/navbar/MobileDropdownMenu.tsx`

Full menu dropdown for mobile.

```tsx
interface MobileDropdownMenuProps {
  open: boolean;
  onClose: () => void;
  isXMUser: boolean;
  hasReward: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  // ... callbacks
}
```

**Features**:
- All navigation items
- Conditional admin item
- Animated menu items
- Divider separators

### 10. ThemeSelectorModal
**File**: `components/navbar/ThemeSelectorModal.tsx`

Theme selection modal.

```tsx
interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Full theme selector integration
- Global theme state management
- Local storage persistence
- Modal with header

### 11. Utilities
**File**: `components/navbar/navbar.utils.ts`

```tsx
// Exported:
export const NAVBAR_THEME_FILTER_MAP: Record<string, string>
export const NAVBAR_TRADING_TIPS: Array<TradingTip>
export const MOBILE_HELPER_TIPS: string[]
export function useRotatingIndex(length: number, interval?: number): number
```

## Usage Examples

### Adding a New Nav Item

```tsx
// In DesktopNavbar or appropriate component
const newItem = {
  icon: <MyIcon />,
  label: "New Item",
  tips: ["Tip 1", "Tip 2", "Tip 3"],
  onClick: () => handleNewItemClick(),
  showShine: false,
  isXMHighlight: false
};

// Add to items array
items.push(newItem);
```

### Creating a Custom Hook for Tips

```tsx
// In navbar.utils.ts
export function useCustomTips(itemId: string) {
  const [tips, setTips] = useState<string[]>([]);
  
  useEffect(() => {
    // Fetch or compute tips based on itemId
  }, [itemId]);
  
  return tips;
}
```

### Extending DockIcon with Custom Features

```tsx
const CustomDockIcon = ({ ...props }) => (
  <DockIcon {...props}>
    {/* Add custom children */}
    <YourIcon />
  </DockIcon>
);
```

## Animation Configuration

### Spring Physics
Default spring settings in Dock:
```tsx
spring = { mass: 0.1, stiffness: 150, damping: 12 }
```

For faster response:
```tsx
{ mass: 0.1, stiffness: 300, damping: 25 }
```

### Magnification Values
- `baseItemSize`: 70px (default)
- `magnification`: 100px (default)
- `distance`: 150px (default)

Adjust in `<Dock>` props.

## Performance Tips

1. **Minimize Re-renders**
   - Use `React.memo()` for DockIcon/DockLabel
   - Memoize callbacks with `useCallback()`

2. **Optimize Animations**
   - RAF throttling already implemented
   - Consider reducing animation complexity on mobile

3. **Bundle Optimization**
   - Use named imports to enable tree-shaking
   - Lazy load modals with `React.lazy()`

4. **Memory Usage**
   - Clean up event listeners in useEffect cleanup
   - RAF cleanup on unmount (already done in Dock)

## Common Issues & Solutions

### Issue: Tips not showing
**Solution**: Ensure `tips` array is passed to dock items and array length > 0

### Issue: Dock magnification not smooth
**Solution**: Check RAF throttling, reduce distance value, or increase damping

### Issue: Mobile menu items not clickable
**Solution**: Ensure `pointerEvents: 'auto'` is set on menu container

### Issue: Theme filter not applying
**Solution**: Check `NAVBAR_THEME_FILTER_MAP` for theme ID, verify in `activeThemeId`

## Testing Components

### Unit Testing (Jest + RTL)
```tsx
describe('DockIcon', () => {
  it('renders with label', () => {
    render(<DockIcon label="Test">Icon</DockIcon>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Storybook Stories
```tsx
export const DockIconStory = {
  render: (args) => <DockIcon {...args}>Icon</DockIcon>,
  args: { label: 'Home', showShine: false }
};
```

## Browser Compatibility

- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- `framer-motion` - Animations
- `@tabler/icons-react` - Icons
- `react` - Core
- `next` - Framework
- `tailwindcss` - Styling

## File Tree Reference

```
components/
├── navbar.tsx (312 lines)
├── navbar.css
└── navbar/
    ├── index.ts (11 components exported)
    ├── navbar.utils.ts (utilities & hooks)
    ├── Dock.tsx (dock container)
    ├── DockItem.tsx (item wrapper)
    ├── DockIcon.tsx (icon display)
    ├── DockLabel.tsx (tooltip)
    ├── DesktopNavbar.tsx (desktop layout)
    ├── MobileStaticHelper.tsx (mobile tips)
    ├── MobileDropdownMenu.tsx (mobile menu)
    ├── MovingTradingTip.tsx (floating tip)
    └── ThemeSelectorModal.tsx (theme modal)
```

## Version History

- **v2.0** (Current) - Refactored to modular components
  - 78% reduction in main file size
  - 10+ modular components
  - Improved performance & maintainability

- **v1.0** - Original monolithic implementation
  - Single 1,443-line file
  - All functionality combined

## Contributing

When adding features:
1. Create new component files for reusable parts
2. Export from `index.ts` barrel file
3. Add type definitions to interfaces
4. Update this documentation
5. Test in both desktop and mobile views

## Support

For questions about the navbar refactoring:
1. Check this guide and architecture docs
2. Review component source code
3. Check existing patterns in similar components
4. Create an issue with specific question
