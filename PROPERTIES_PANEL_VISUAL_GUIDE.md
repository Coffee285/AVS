# Properties Panel - Visual Guide

## Before and After Comparison

### BEFORE - No Selection State
```
┌──────────────────────────────┐
│  ⚙️  Properties               │
├──────────────────────────────┤
│                              │
│        📄                    │
│                              │
│     No selection             │
│                              │
│  Select an element on the    │
│  timeline or in the media    │
│  library to view its         │
│  properties                  │
│                              │
│                              │
└──────────────────────────────┘
```

### AFTER - No Selection State (Enhanced)
```
┌──────────────────────────────┐
│  ⚙️  Properties               │
├──────────────────────────────┤
│                              │
│  ▼ Project                   │
│  ├─ Resolution: 1920 × 1080  │
│  ├─ Frame Rate: 30 fps       │
│  ├─ Duration: 0:00           │
│  └─ Aspect Ratio: 1920:1080  │
│                              │
│  ▼ Playback                  │
│  ├─ Quality: [Full ▼]        │
│  └─ Loop: ⭘                  │
│                              │
│  ▼ Quick Access              │
│  ├─ [⚙️  Project Settings...] │
│  └─ [💾  Save Project]        │
│                              │
└──────────────────────────────┘
```

### WITH Selection State (Clip Selected)
```
┌──────────────────────────────┐
│  ⚙️  Properties               │
├──────────────────────────────┤
│  [Media Thumbnail]           │
│                              │
│  ▶ File Information          │
│  ├─ Name: clip_001.mp4       │
│  ├─ Type: Video              │
│  ├─ Size: 45.2 MB            │
│  ├─ Duration: 0:10           │
│  └─ Resolution: 1920 × 1080  │
│                              │
│  ▼ Transform                 │
│  ├─ Scale:  X [100%] Y [100%]│
│  │           🔗  ◆            │
│  ├─ Position: X [0px] Y [0px]│
│  │           ◆                │
│  ├─ Rotation: ━━●━━ 0° 🔄 ◆  │
│  ├─ Opacity:  ━━━━● 100%  ◆  │
│  ├─ Anchor:  X [50%] Y [50%] │
│  └─ Blend: [Normal ▼]        │
│                              │
│  ▼ Audio                     │
│  ├─ Volume:   ━━━━● 0.0 dB   │
│  ├─ Pan:   L ━━●━━ R  0      │
│  ├─ Fade In:  ━●━━━ 0.0s     │
│  ├─ Fade Out: ━●━━━ 0.0s     │
│  └─ Mute: ⭘                  │
│                              │
│  ... (more sections)         │
└──────────────────────────────┘
```

## Key UI Elements

### Collapsible Sections
```
▼ Section Title (Expanded)
  Content here...

▶ Section Title (Collapsed)
```

The chevron rotates smoothly (200ms ease-out animation) when toggling.

### ScrubbableInput Component
```
Label       [100%]
            ↕️ 
         (draggable)
```

**Interaction:**
1. **Hover**: Background lightens
2. **Click & Drag Left**: Value decreases
3. **Click & Drag Right**: Value increases
4. **During Drag**: 
   - Cursor changes to ⟷ (ew-resize)
   - Background changes to brand color
   - Text changes to white

**Example Values:**
- `100` with suffix `%` → displays as "100%"
- `0` with suffix `px` → displays as "0px"
- `1920` with no suffix → displays as "1920"

### Property Rows
```
Label Name       Value Display
├─ 56px min ─┤ └─ flex 1 ─┘

Examples:
Resolution      1920 × 1080
Frame Rate      30 fps
Opacity         ━━━━● 100%  ◆
```

### Dropdowns
```
Quality         [Full ▼]
                ├─ 1/4
                ├─ 1/2
                └─ Full (selected)
```

### Toggle Switches
```
Loop            ⭘  (off)
Loop            ⬤  (on)
```

### Action Buttons
```
┌──────────────────────────────┐
│  ⚙️  Project Settings...      │
└──────────────────────────────┘
┌──────────────────────────────┐
│  💾  Save Project             │
└──────────────────────────────┘
```

## Visual Hierarchy

### Spacing
- **Panel Padding**: 12px (md)
- **Section Padding**: 12px (md)
- **Item Spacing**: 8px (sm)
- **Group Spacing**: 4px (xs)

### Typography
- **Panel Title**: 18px, semibold
- **Section Title**: 12px (200), semibold
- **Labels**: 11px (sm), regular, foreground3
- **Values**: 11px (sm), regular, foreground2
- **Monospace Values**: SF Mono, 11px

### Colors
- **Background**: neutralBackground2 (panel)
- **Section Background**: neutralBackground3
- **Labels**: neutralForeground3 (muted)
- **Values**: neutralForeground2 (normal)
- **Active Scrubbable**: brandBackground
- **Borders**: neutralStroke3

### Icons
- **Panel Header**: 18px
- **Section Chevrons**: 16px
- **Action Buttons**: 16px
- **Transform Icons**: 24px

## Animation Details

### Section Expand/Collapse
```
Duration: 200ms
Easing: ease-out
Properties animated:
  - height: 0 → auto
  - opacity: 0 → 1
```

### Chevron Rotation
```
Duration: 150ms (fast)
Easing: ease-out
Transform: rotate(0deg) → rotate(90deg)
```

### ScrubbableInput Drag
```
Hover:
  - Background: neutralBackground4
  - Transition: 150ms

Active Drag:
  - Background: brandBackground
  - Text Color: white (onBrand)
  - Cursor: ew-resize
  - Instant change (no transition)
```

## Responsive Behavior

The Properties Panel maintains a fixed width but adapts content:

1. **No Selection**: Minimal content, shows essentials
2. **Selection**: Expands vertically to show all properties
3. **Scrolling**: Content area scrolls when properties exceed height
4. **Sections**: Can collapse to save vertical space

## Accessibility Features

### ARIA Attributes
```tsx
// ScrubbableInput
role="slider"
aria-label="Property name"
aria-valuenow={currentValue}
aria-valuemin={min}
aria-valuemax={max}
tabIndex={0}

// Section Headers
type="button"
onClick={toggleSection}

// Switches
role="switch"
aria-checked={isOn}
```

### Keyboard Support
- **Tab**: Navigate between controls
- **Enter/Space**: Toggle switches and buttons
- **Arrow Keys**: (Future) Adjust ScrubbableInput values

### Screen Readers
- All interactive elements have descriptive labels
- State changes announced automatically
- Logical reading order maintained

## Design Tokens Used

```typescript
// Spacing
openCutTokens.spacing.xs  // 4px
openCutTokens.spacing.sm  // 8px
openCutTokens.spacing.md  // 12px
openCutTokens.spacing.lg  // 16px

// Radius
openCutTokens.radius.sm   // 4px
openCutTokens.radius.md   // 8px

// Animation
openCutTokens.animation.duration.fast   // 150ms
openCutTokens.animation.duration.normal // 200ms
openCutTokens.animation.easing.easeOut  // ease-out

// Typography
openCutTokens.typography.fontSize.xs  // 10px
openCutTokens.typography.fontSize.sm  // 11px
openCutTokens.typography.fontFamily.mono // SF Mono
```

## State Management

The Properties Panel integrates with these Zustand stores:

```typescript
useOpenCutProjectStore()   // Project settings
useOpenCutTimelineStore()  // Timeline data, duration
useOpenCutMediaStore()     // Selected media
useOpenCutPlaybackStore()  // Playback state
useOpenCutKeyframesStore() // Keyframe data
// ... and others for specific features
```

## Future Enhancements

### Potential Additions
1. **Right-click context menus** on property labels
2. **Copy/paste property values** between clips
3. **Property presets** for common configurations
4. **History slider** to undo/redo property changes
5. **Property search/filter** for large property lists
6. **Custom property groups** user can configure
7. **Property locking** to prevent accidental changes
8. **Batch editing** of multiple selected clips

### ScrubbableInput Enhancements
1. **Double-click to edit** text directly
2. **Shift+Drag** for fine adjustment (10x precision)
3. **Ctrl+Drag** for coarse adjustment (10x speed)
4. **Mouse wheel** to adjust value
5. **Unit conversion** (px ↔ %, deg ↔ rad)
6. **Expression support** (e.g., "100/2" → 50)

## Conclusion

The enhanced Properties Panel provides a professional, contextual interface that maximizes screen real estate efficiency while maintaining excellent usability. The combination of always-visible project properties, smooth animations, and interactive controls creates a polished editing experience consistent with professional NLE applications.
