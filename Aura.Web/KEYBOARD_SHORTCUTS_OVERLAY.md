# Keyboard Shortcuts Discovery Overlay

## Overview

The Keyboard Shortcuts Discovery Overlay is a feature in the OpenCut video editor that helps users discover and learn available keyboard shortcuts. It's accessible via the `?` key or `Cmd/Ctrl + /`.

## Features

### Quick Access
- **Press `?`** - Opens the keyboard shortcuts overlay
- **Press `Cmd + /` (Mac) or `Ctrl + /` (Windows/Linux)** - Alternative way to open the overlay
- **Press `Escape`** - Closes the overlay
- **Click outside** - Closes the overlay

### Organized Display
Shortcuts are organized into 6 categories:
- **Playback** - Play, pause, navigation, JKL controls
- **Clips** - Splitting, deleting, duplicating, marking
- **Timeline** - Zooming, markers, navigation
- **Selection** - Selecting and deselecting clips
- **View** - Panel toggles, layout reset
- **File** - Save, export, undo, redo

### Search Functionality
- Real-time search as you type
- Searches across:
  - Shortcut descriptions (e.g., "split")
  - Key names (e.g., "space")
  - Category names (e.g., "playback")
- Case-insensitive
- Shows empty state when no results found

### Platform Awareness
- Automatically detects operating system
- Shows `⌘` on macOS
- Shows `Ctrl` on Windows and Linux
- No configuration needed

## Implementation

### Architecture

```
constants/
  keyboardShortcuts.ts        # Centralized shortcut definitions

components/OpenCut/
  KeyboardShortcutsOverlay.tsx # Main overlay component
  OpenCutEditor.tsx            # Integration point
  
hooks/
  useOpenCutKeyboardHandler.ts # Keyboard event handling
```

### Key Components

#### 1. Shortcuts Data (`constants/keyboardShortcuts.ts`)
```typescript
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'play-pause',
    keys: ['Space'],
    description: 'Play / Pause',
    category: 'playback',
  },
  // ... more shortcuts
];
```

#### 2. Overlay Component (`KeyboardShortcutsOverlay.tsx`)
- Fluent UI Dialog component
- Searchable shortcuts list
- Categorized display
- Responsive grid layout
- Keyboard-styled key badges

#### 3. Keyboard Handler (`useOpenCutKeyboardHandler.ts`)
- Intercepts `?` and `Cmd/Ctrl + /` keys
- Calls `onShowKeyboardShortcuts` callback
- Prevents default browser behavior

#### 4. Editor Integration (`OpenCutEditor.tsx`)
- Manages overlay visibility state
- Passes callback to keyboard handler
- Renders overlay component

## Usage

### For Users

1. Open the OpenCut editor
2. Press `?` or `Cmd/Ctrl + /`
3. Browse or search for shortcuts
4. Press Escape or click outside to close

### For Developers

#### Adding New Shortcuts

Edit `Aura.Web/src/constants/keyboardShortcuts.ts`:

```typescript
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // ... existing shortcuts
  {
    id: 'my-new-shortcut',
    keys: ['⌘', 'K'], // Use ⌘ for Cmd/Ctrl
    description: 'My New Feature',
    category: 'view', // Choose appropriate category
  },
];
```

#### Category Options
- `'playback'` - Playback controls
- `'timeline'` - Timeline operations
- `'clips'` - Clip manipulation
- `'selection'` - Selection operations
- `'view'` - UI and view controls
- `'file'` - File operations

#### Key Notation
- Use `⌘` for platform-agnostic Cmd/Ctrl key
- Use descriptive names: `'Space'`, `'Enter'`, `'Escape'`
- Use arrows: `'←'`, `'→'`, `'↑'`, `'↓'`
- Use modifier names: `'Shift'`, `'Alt'`

## Testing

### Unit Tests

Run the test suite:
```bash
npm test
```

Test files:
- `src/constants/__tests__/keyboardShortcuts.test.ts`
- `src/components/OpenCut/__tests__/KeyboardShortcutsOverlay.test.tsx`

### Manual Testing Checklist

- [ ] Press `?` - overlay opens
- [ ] Press `Cmd/Ctrl + /` - overlay opens
- [ ] Search for "split" - only split shortcut shown
- [ ] Search for "playback" - playback category shown
- [ ] Clear search - all shortcuts shown
- [ ] Press Escape - overlay closes
- [ ] Click outside overlay - overlay closes
- [ ] Verify platform-specific keys (Cmd on Mac, Ctrl on Windows)
- [ ] Test on different screen sizes - responsive grid works
- [ ] Verify all listed shortcuts actually work

## Design

### UI Components
- **Dialog Surface** - 900px max width, 85vh max height
- **Search Input** - Auto-focused on open
- **Category Sections** - Clear visual hierarchy
- **Key Badges** - Keyboard-style appearance with borders and shadows
- **Responsive Grid** - 2-column layout on large screens, single column on small

### Styling
- Uses Fluent UI design tokens
- Matches OpenCut design system
- Consistent spacing and typography
- Smooth transitions and hover effects

## Future Enhancements

Potential improvements:
- [ ] Settings option to show shortcuts in tooltips
- [ ] Help → Keyboard Shortcuts menu item
- [ ] Customizable keybindings
- [ ] Print/export shortcuts reference
- [ ] Animated key press demonstrations
- [ ] Conflict detection for custom bindings

## Related Files

- `Aura.Web/src/stores/opencutKeybindings.ts` - Keybinding store (internal implementation)
- `Aura.Web/src/hooks/useOpenCutKeyboardHandler.ts` - Keyboard event handler
- `Aura.Web/src/components/OpenCut/OpenCutEditor.tsx` - Main editor component

## Support

For issues or questions:
1. Check existing keyboard shortcuts in the overlay
2. Review this documentation
3. Open an issue on GitHub with the `keyboard-shortcuts` label
