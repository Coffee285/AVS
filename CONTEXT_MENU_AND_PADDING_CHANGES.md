# Context Menu and Preview Padding Changes

## Summary
This PR implements two key improvements to the OpenCut video editor:
1. **Global browser context menu prevention** - Ensures only specialized NLE-style menus appear
2. **Reduced preview padding** - Maximizes canvas space from 16px to 4px padding

## Changes Made

### 1. Design Tokens (`Aura.Web/src/styles/designTokens.ts`)
```typescript
// BEFORE
containerPadding: '16px',

// AFTER  
containerPadding: '4px',
```
**Impact**: 12px more space on each side (24px total width increase for preview canvas)

### 2. Preview Panel (`Aura.Web/src/components/OpenCut/PreviewPanel.tsx`)
```typescript
// BEFORE
const padding = 16;

// AFTER
const padding = 4;
```
**Impact**: Ensures the calculatePreviewDimensions function uses the new minimal padding

### 3. OpenCut Editor (`Aura.Web/src/components/OpenCut/OpenCutEditor.tsx`)
```typescript
// ADDED: Global context menu prevention
const handleContextMenu = useCallback((e: React.MouseEvent) => {
  // Only prevent if no specialized context menu handler has already handled it
  // Child components with custom menus will stopPropagation
  if (e.defaultPrevented) return;
  e.preventDefault();
}, []);

return (
  <div className={styles.root} onContextMenu={handleContextMenu}>
```
**Impact**: Prevents generic browser context menus throughout the editor while respecting specialized menus

## Context Menu Architecture

### Existing Specialized Menus (Unchanged)
The following components already have professional NLE-style context menus:

1. **PreviewPanel** (`BaseContextMenu`)
   - Play/Pause
   - Loop playback
   - Playback speed (25%, 50%, 100%, 200%, 400%)
   - Export/Copy frame
   - Frame stepping
   - Zoom controls
   - Safe areas/timecode/grid toggles
   - Quality settings
   - Fullscreen

2. **Timeline** (`TimelineContextMenu`)
   - **For clips**: Cut, Copy, Paste, Split, Duplicate, Delete, Properties
   - **For tracks**: Add/Delete track, Rename, Lock, Hide, Paste
   - **For transitions**: Edit, Remove, Replace

3. **MediaPanel** (`BaseContextMenu`)
   - Add to Timeline
   - Reveal in Finder/Explorer
   - Rename
   - Replace Footage
   - Make Offline/Relink
   - Export Frame/Audio/Clip
   - Properties
   - Delete

4. **KeyframeEditor**
   - Context menu for keyframe operations

### New Global Prevention
The new `handleContextMenu` in OpenCutEditor:
- Catches context menu events that bubble up from areas without specialized menus
- Prevents the generic browser context menu from appearing
- Respects `e.defaultPrevented` to allow child components with specialized menus to work normally

## Visual Impact

### Preview Padding Reduction
**Before (16px padding)**:
```
┌─────────────────────────────────────┐
│                                     │ ← 16px padding
│   ┌─────────────────────────────┐   │
│   │                             │   │
│16px     VIDEO CANVAS         16px  │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │ ← 16px padding
└─────────────────────────────────────┘
```

**After (4px padding)**:
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │ ← 4px padding
│  │                               │  │
│4px      VIDEO CANVAS           4px │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Result**: 
- 24px more canvas width (12px per side)
- 24px more canvas height (12px top/bottom)
- Maintains proper aspect ratio fitting
- More space for video preview content

### Context Menu Behavior
**Before**: 
- Some areas might show browser's default "Reload", "Back", "Inspect" menu
- Inconsistent UX with specialized NLE menus

**After**:
- Right-click on preview → NLE preview menu (zoom, playback, export options)
- Right-click on timeline → NLE timeline menu (clip/track operations)
- Right-click on media → NLE media menu (file operations)
- Right-click on empty panels → No menu (clean, professional)
- Consistent professional video editing experience

## Testing

### Manual Testing Steps
1. **Preview Context Menu**:
   - Right-click on video preview → Should show specialized preview menu
   - Verify: Play/Pause, Zoom, Export Frame, etc.

2. **Timeline Context Menu**:
   - Right-click on clip → Should show clip operations menu
   - Right-click on track header → Should show track operations menu
   - Right-click on empty track area → Should show paste/marker menu

3. **Media Context Menu**:
   - Right-click on media item → Should show media operations menu
   - Verify: Add to Timeline, Rename, Delete, etc.

4. **Empty Areas**:
   - Right-click on panel backgrounds → Should show NO menu
   - Verify browser menu does NOT appear

5. **Preview Canvas Space**:
   - Open OpenCut editor
   - Observe video preview has minimal padding
   - Compare with previous version if available

### Build Validation
```bash
✓ npm run build       # Build succeeded
✓ npx tsc --noEmit    # Type checking passed
✓ npx eslint          # Linting passed (pre-existing warnings only)
```

## Technical Details

### Event Propagation
The global context menu handler uses a smart approach:
```typescript
if (e.defaultPrevented) return;
e.preventDefault();
```
This means:
- Child components with specialized menus call `e.preventDefault()` first
- The global handler sees `e.defaultPrevented === true` and does nothing
- Only unhandled context menu events get prevented globally

### Padding Calculation
The padding is used in aspect ratio calculations:
```typescript
const availableWidth = container.width - padding * 2;
const availableHeight = container.height - padding * 2;
```
Reducing from 16px to 4px gives:
- 24px more width for fitting video
- 24px more height for fitting video
- Better use of screen real estate

## Compatibility

### Browser Compatibility
- Works in all modern browsers
- Event handling follows standard DOM patterns
- No breaking changes to existing functionality

### Component Compatibility
- All existing context menus continue to work
- No changes to context menu component APIs
- Backward compatible with all OpenCut components

## Related Files
- `Aura.Web/src/components/OpenCut/ContextMenu/BaseContextMenu.tsx` - Base context menu component
- `Aura.Web/src/components/OpenCut/ContextMenu/ContextMenuItem.tsx` - Menu item component
- `Aura.Web/src/components/OpenCut/Timeline/TimelineContextMenu.tsx` - Timeline-specific menus
- `Aura.Web/src/styles/designTokens.ts` - Design system tokens

## Design Philosophy
These changes align with professional NLE (Non-Linear Editor) standards:
- **Maximized workspace**: Every pixel counts in video editing
- **Consistent interactions**: Professional editors never show browser menus
- **Specialized tools**: Context-specific menus for different editor areas
- **Clean UX**: No accidental browser menu triggers
