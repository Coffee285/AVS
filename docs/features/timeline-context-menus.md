# Timeline Context Menus

## Overview

Rich context menus for timeline elements in the OpenCut video editor, providing quick access to common editing operations. Context menus appear on right-click and include keyboard shortcuts for power users.

## Features

### Clip Context Menu

Right-clicking on a clip shows a menu with the following actions:

- **Cut** (⌘X) - Cut clip to clipboard
- **Copy** (⌘C) - Copy clip to clipboard
- **Paste** (⌘V) - Paste from clipboard at current position
- **Split at Playhead** (S) - Split clip at playhead position
- **Duplicate** (⌘D) - Create a duplicate of the clip
- **Enable/Disable** - Toggle clip visibility (sets opacity to 0/100)
- **Delete** (⌫) - Remove clip from timeline
- **Properties...** - Open properties panel for clip

### Track Context Menu

Right-clicking on a track header shows:

- **Paste** (⌘V) - Paste from clipboard to this track
- **Add Marker** - Add a marker at cursor position
- **Insert Time...** - Insert time gap and ripple clips
- **Delete All Gaps** - Remove all gaps on the track
- **Add Track Above** - Insert new track above current
- **Add Track Below** - Insert new track below current
- **Delete Track** - Remove the track
- **Rename Track...** - Prompt to rename track
- **Lock/Unlock Track** - Toggle track lock state
- **Hide/Show Track** - Toggle track visibility

### Empty Track Area Context Menu

Right-clicking on empty space in a track shows:

- **Paste** (⌘V) - Paste from clipboard at cursor position
- **Add Marker** - Add a marker at cursor position
- **Insert Time...** - Insert time gap and ripple clips
- **Delete All Gaps** - Remove all gaps on the track

### Transition Context Menu

Right-clicking on a transition shows:

- **Edit Transition...** - Open transition editor
- **Remove Transition** - Delete the transition
- **Replace Transition...** - Change transition type

## Clipboard Operations

The clipboard store (`opencutClipboard.ts`) manages cut/copy/paste operations:

### Copy
- Copies selected clip(s) to clipboard
- Maintains all clip properties
- Can be pasted multiple times
- Original clips remain on timeline

### Cut
- Moves selected clip(s) to clipboard
- Marks clips for removal on paste
- Can only be pasted once
- Original clips removed after paste

### Paste
- Pastes clipboard content to specified track and time
- Maintains relative timing for multiple clips
- Adjusts start times based on paste position
- Preserves all clip properties

## Keyboard Accessibility

The context menus are fully keyboard accessible:

- **Escape** - Close the menu
- **Arrow Keys** - Navigate menu items (handled by Fluent UI)
- **Enter** - Activate selected menu item (handled by Fluent UI)
- **Keyboard Shortcuts** - Displayed next to menu items for quick reference

## Disabled States

Menu items can be disabled with explanatory tooltips:

- **Paste** - Disabled when clipboard is empty
  - Tooltip: "Clipboard is empty"
- Other items may be conditionally disabled based on context

## Implementation Details

### Architecture

```
TimelineContextMenu.tsx          - Main context menu component
  ├── Uses opencutClipboard.ts  - Clipboard store for cut/copy/paste
  ├── Uses opencutTimeline.ts   - Timeline store for clip operations
  ├── Uses opencutPlayback.ts   - Playback store for current time
  ├── Uses opencutTransitions.ts - Transition operations
  └── Uses opencutMarkers.ts     - Marker operations
```

### State Management

- **Clipboard State** - Managed by `useOpenCutClipboardStore`
  - `content` - Array of copied/cut clips
  - `operation` - 'copy' | 'cut' | null
  - `hasContent` - Boolean flag for UI state
  - `cutClipIds` - IDs of clips to remove on paste

- **Context Menu State** - Managed in Timeline.tsx
  - `contextMenuOpen` - Boolean visibility flag
  - `contextMenuPosition` - { x, y } screen coordinates
  - `contextMenuTarget` - Target type and IDs

### Integration with Timeline

The Timeline component (`Timeline.tsx`) integrates context menus:

1. **Context Menu Handlers**
   - `handleContextMenu` - Opens menu on right-click
   - `handleCloseContextMenu` - Closes menu
   - Passes type, position, and target info to menu component

2. **Right-Click Events**
   - Clips: `onContextMenu={(e) => handleContextMenu(e, 'clip', clip.id, clip.trackId)}`
   - Tracks: `onContextMenu={(e) => handleContextMenu(e, 'track', undefined, track.id)}`
   - Empty areas: Same as tracks

3. **Click-Outside Handling**
   - Automatically closes menu when clicking outside
   - Implemented via document event listener

## Usage Examples

### Basic Clip Operations

```typescript
// User right-clicks on a clip
// Context menu appears at cursor position
// User clicks "Copy"
clipboardStore.copy('clip-id');

// User right-clicks on empty track area at time 10s
// User clicks "Paste"
clipboardStore.paste('track-id', 10);
```

### Track Management

```typescript
// User right-clicks on track header
// User clicks "Add Track Above"
const newTrackId = timelineStore.addTrack(track.type);
// Track is reordered to appear above current track
timelineStore.reorderTracks([...reorderedIds]);
```

### Keyboard Shortcuts

```typescript
// User presses Cmd+C while clip is selected
clipboardStore.copy(selectedClipIds);

// User presses Cmd+V while timeline focused
clipboardStore.paste(currentTrackId, currentTime);
```

## Testing

### Clipboard Store Tests

Location: `src/stores/__tests__/opencutClipboard.test.ts`

Covers:
- Initial state verification
- Copy operation (single and multiple clips)
- Cut operation (single and multiple clips)
- Paste operation (maintaining timing, removing cut clips)
- Clear operation
- Empty clipboard handling
- Edge cases (non-existent clips, empty arrays)

### Context Menu Component Tests

Location: `src/components/OpenCut/Timeline/__tests__/TimelineContextMenu.test.tsx`

Covers:
- Clip menu rendering and actions
- Track menu rendering and actions
- Empty area menu rendering
- Transition menu rendering
- Keyboard accessibility (Escape to close)
- Disabled state handling
- Menu positioning

## Best Practices

1. **Always provide keyboard shortcuts** - Display shortcuts next to menu items
2. **Show disabled reasons** - Use tooltips to explain why items are disabled
3. **Context-aware menus** - Show only relevant actions for the target
4. **Maintain relative timing** - When pasting multiple clips, preserve gaps
5. **Save snapshots** - Create undo points before destructive operations
6. **Close after action** - Menus should close after executing an action

## Future Enhancements

Potential improvements for future releases:

- Multi-select context menu (operations on multiple clips)
- Submenu for speed adjustments (0.25x, 0.5x, 1x, 2x, 4x)
- Recent transitions in transition menu
- Custom marker types in marker submenu
- Clip color/label options
- Audio effects submenu
- Video effects submenu
- Transform presets submenu

## Related Documentation

- [Timeline Architecture](../architecture/timeline.md)
- [Keyboard Shortcuts](../user-guide/keyboard-shortcuts.md)
- [Clipboard System](../architecture/clipboard.md)
- [Undo/Redo System](../architecture/undo-redo.md)
