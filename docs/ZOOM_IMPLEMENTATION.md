# Zoom Implementation Documentation

## Overview

The Aura Video Studio UI zoom system allows users to scale the entire interface from 80% to 180%. This document describes how the zoom system works and how it was fixed.

## The Problem

Previously, the zoom implementation had a critical bug:

1. **Storage**: Zoom was stored as a percentage number (e.g., "140") in localStorage
2. **Application**: `applyZoom()` set `--aura-base-font-size` to a percentage string (e.g., `"140%"`)
3. **CSS Expectation**: `global.css` defined `--aura-base-font-size` as a `clamp()` expression with pixel values
4. **Result**: Browser ignored the percentage string, causing no visible zoom changes

### Code Example (Before Fix)

```typescript
// ❌ BROKEN - Sets percentage string that browser ignores
export function applyZoom(zoom: number): void {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  document.documentElement.style.setProperty('--aura-base-font-size', `${clamped}%`);
  localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
}
```

```css
/* global.css - Expects pixel-based clamp, not percentage */
:root {
  --aura-base-font-size: clamp(18px, calc(0.45vw + 15px), 22px);
}

html {
  font-size: var(--aura-base-font-size); /* Gets percentage string, ignores it */
}
```

## The Solution

Convert the zoom percentage to a pixel-based `clamp()` expression that scales proportionally:

### Formula

For zoom percentage `Z`, the CSS value is:

```
clamp(18*m px, calc(0.45*m vw + 15*m px), 22*m px)
```

Where `m = Z / 100` (the zoom multiplier)

### Implementation

```typescript
// ✅ FIXED - Converts to pixel-based clamp expression
export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function zoomToClamp(zoom: number): string {
  const multiplier = zoom / 100;
  const minPx = roundTo(18 * multiplier);
  const maxPx = roundTo(22 * multiplier);
  const vwCoeff = roundTo(0.45 * multiplier, 2);
  const vwBase = roundTo(15 * multiplier);
  return `clamp(${minPx}px, calc(${vwCoeff}vw + ${vwBase}px), ${maxPx}px)`;
}

export function applyZoom(zoom: number): void {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  const clampValue = zoomToClamp(clamped);
  
  document.documentElement.style.setProperty('--aura-base-font-size', clampValue);
  localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
  
  if (import.meta.env.DEV) {
    console.log(`[Zoom] Applied ${clamped}% (multiplier: ${(clamped/100).toFixed(2)}), CSS: ${clampValue}`);
  }
  
  window.dispatchEvent(new Event('zoom-changed'));
}
```

### Examples

| Zoom % | Multiplier | Resulting CSS Value |
|--------|-----------|-------------------|
| 80%    | 0.8       | `clamp(14.4px, calc(0.36vw + 12px), 17.6px)` |
| 100%   | 1.0       | `clamp(18px, calc(0.45vw + 15px), 22px)` |
| 120%   | 1.2       | `clamp(21.6px, calc(0.54vw + 18px), 26.4px)` |
| 140%   | 1.4       | `clamp(25.2px, calc(0.63vw + 21px), 30.8px)` |
| 180%   | 1.8       | `clamp(32.4px, calc(0.81vw + 27px), 39.6px)` |

## Architecture

### Storage Layer

- **Key**: `aura-ui-zoom` in localStorage
- **Format**: String representation of number (e.g., `"140"`)
- **Range**: 80-180 (enforced by min/max clamping)
- **Default**: 140 (optimal for desktop displays)

### Application Layer

1. **Early Initialization** (`main.tsx`):
   - Runs before React app loads
   - Reads from localStorage or sets default
   - Applies zoom to avoid flash of unstyled content (FOUC)

2. **Runtime Updates** (`zoom.ts`):
   - `zoomIn()` - Increases by 10%, max 180%
   - `zoomOut()` - Decreases by 10%, min 80%
   - `resetZoom()` - Returns to 100%
   - `setOptimalZoom()` - Sets to 140% (default)

### Integration Points

#### Electron Menu Events

Menu items in `View > Zoom In/Out/Reset` trigger IPC events:

1. **Main Process** (`menu-builder.js`): Defines menu items with accelerators
2. **Preload** (`menu-command-handler.js`): Exposes validated menu API
3. **Renderer** (`useElectronMenuEvents.ts`): Subscribes to menu events and calls zoom functions

```typescript
// useElectronMenuEvents.ts
if (menu.onZoomIn) {
  const unsub = menu.onZoomIn(() => {
    const newZoom = zoomIn();
    loggingService.info('Menu action: Zoom In', { newZoom });
  });
  unsubscribers.push(unsub);
}
```

#### Keyboard Shortcuts

- **Zoom In**: `Ctrl/Cmd + Plus`
- **Zoom Out**: `Ctrl/Cmd + Minus`
- **Reset**: `Ctrl/Cmd + 0`

Handled by `useZoomShortcuts.ts` hook.

## Testing

### Unit Tests

Located in `Aura.Web/src/constants/__tests__/zoom.test.ts`:

- ✅ Verifies pixel-based clamp expression generation
- ✅ Tests zoom clamping (min/max enforcement)
- ✅ Validates localStorage persistence
- ✅ Checks zoom increment/decrement logic
- ✅ Ensures reset returns to 100%

Run tests:
```bash
cd Aura.Web
npm test -- src/constants/__tests__/zoom.test.ts
```

### Manual Testing

Use the test page to verify zoom behavior:

```bash
# Open in browser
open zoom-test.html
# Or
python3 -m http.server 8000
# Then navigate to http://localhost:8000/zoom-test.html
```

**Test checklist**:
- [ ] Zoom In button increases UI size
- [ ] Zoom Out button decreases UI size
- [ ] Reset button returns to 100%
- [ ] Keyboard shortcuts work (Ctrl+Plus/Minus/0)
- [ ] Zoom persists after page reload
- [ ] No console errors

### Electron Desktop Testing

1. Build the desktop app:
   ```bash
   cd Aura.Desktop
   npm run build
   npm run package
   ```

2. Launch the packaged app

3. Test menu items:
   - **View > Zoom In** - UI should visibly increase in size
   - **View > Zoom Out** - UI should visibly decrease in size
   - **View > Reset Zoom** - UI should return to base size (100%)

4. Test keyboard shortcuts:
   - `Ctrl+Plus` or `Cmd+Plus` - Zoom in
   - `Ctrl+-` or `Cmd+-` - Zoom out
   - `Ctrl+0` or `Cmd+0` - Reset zoom

5. Verify persistence:
   - Set zoom to 120%
   - Quit and relaunch app
   - Verify UI is still at 120%

## Debugging

### Enable Debug Logging

Debug logging is automatically enabled in development mode:

```typescript
if (import.meta.env.DEV) {
  console.log(`[Zoom] Applied ${clamped}% (multiplier: ${multiplier.toFixed(2)}), CSS: ${clampValue}`);
}
```

### Inspect CSS Variables

Open DevTools console and run:

```javascript
// Get current zoom
localStorage.getItem('aura-ui-zoom')

// Get CSS variable value
getComputedStyle(document.documentElement).getPropertyValue('--aura-base-font-size')

// Manually set zoom
document.documentElement.style.setProperty('--aura-base-font-size', 'clamp(25.2px, calc(0.63vw + 21px), 30.8px)')
```

### Common Issues

**Issue**: Zoom changes but UI doesn't update
- **Cause**: CSS not using `--aura-base-font-size` variable
- **Fix**: Ensure `html { font-size: var(--aura-base-font-size) }` in global.css

**Issue**: Zoom resets on page load
- **Cause**: localStorage not persisting
- **Fix**: Check browser privacy settings, ensure localStorage is enabled

**Issue**: Floating point precision errors in tests
- **Cause**: JavaScript floating point arithmetic
- **Fix**: Use `roundTo()` helper to round values to 1-2 decimal places

## Future Enhancements

Potential improvements:

1. **Responsive breakpoints**: Different zoom ranges for mobile/tablet/desktop
2. **Accessibility presets**: Quick zoom levels for visually impaired users
3. **Per-component zoom**: Allow certain components to ignore global zoom
4. **Smooth transitions**: Animate zoom changes for better UX
5. **Zoom indicator**: Visual feedback showing current zoom level

## References

- [MDN: CSS clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Related Files

- `Aura.Web/src/constants/zoom.ts` - Core zoom implementation
- `Aura.Web/src/constants/__tests__/zoom.test.ts` - Unit tests
- `Aura.Web/src/main.tsx` - Early zoom initialization
- `Aura.Web/src/styles/global.css` - Base font size definition
- `Aura.Web/src/hooks/useElectronMenuEvents.ts` - Electron menu integration
- `Aura.Web/src/hooks/useZoomShortcuts.ts` - Keyboard shortcuts
- `Aura.Desktop/electron/menu-builder.js` - Electron menu definition
- `Aura.Desktop/electron/menu-command-handler.js` - Menu IPC handling
