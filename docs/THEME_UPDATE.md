# Professional Dark Theme Implementation

## Overview
This update implements a professional dark theme for the OpenCut video editor that matches industry standards like Adobe Premiere Pro and DaVinci Resolve.

## Key Changes

### 1. Layered Background System
The new color system uses depth-based backgrounds where darker colors indicate deeper layers:

- `#0d0d0d` - Deepest (behind everything)
- `#141414` - Deep (main app background)
- `#1a1a1a` - Surface (panels)
- `#222222` - Elevated (cards, menus)
- `#2a2a2a` - Highlight (hover states)

### 2. Subtle Borders
Replaced harsh visible borders with subtle transparent borders:

- Subtle: `rgba(255, 255, 255, 0.06)`
- Default: `rgba(255, 255, 255, 0.10)`
- Strong: `rgba(255, 255, 255, 0.15)`

### 3. Clip Colors with Gradients
Timeline clips now feature rich gradients for visual depth:

**Video Clips:**
- Gradient: `linear-gradient(180deg, #4a7c9b 0%, #3a6277 100%)`
- Border: `#5a8caa`

**Audio Clips:**
- Gradient: `linear-gradient(180deg, #5a9b5e 0%, #4a7f4d 100%)`
- Border: `#6aab6e`

**Text Clips:**
- Gradient: `linear-gradient(180deg, #9b7a5a 0%, #7f6349 100%)`
- Border: `#ab8a6a`

**Image Clips:**
- Gradient: `linear-gradient(180deg, #7a5a9b 0%, #634980 100%)`
- Border: `#8a6aab`

### 4. Selection Glow Effect
Selected items now have a subtle animated glow:

```css
@keyframes selectionGlow {
  0%, 100% {
    box-shadow: 0 0 0 2px #5c9eff;
  }
  50% {
    box-shadow: 0 0 0 2px #5c9eff, 0 0 12px #5c9eff;
  }
}
```

### 5. Depth Through Shadows
Panels and elements use shadows for depth instead of borders:

- Clips: `0 1px 3px rgba(0, 0, 0, 0.3)`
- Hover: `0 2px 8px rgba(0, 0, 0, 0.4)`
- Selected: `0 0 0 2px #5c9eff, 0 2px 12px rgba(92, 158, 255, 0.3)`

### 6. Accent Color
Professional blue accent for interactions:

- Primary: `#5c9eff`
- Secondary: `#3d7bd9`
- Subtle: `rgba(92, 158, 255, 0.15)`

### 7. Foreground Colors
Hierarchical text colors:

- Primary: `#e8e8e8` (main text)
- Secondary: `#a0a0a0` (secondary text)
- Tertiary: `#666666` (disabled/hints)
- Inverse: `#0d0d0d` (on accent colors)

## Files Modified

1. **`Aura.Web/src/styles/designTokens.ts`**
   - Added complete professional color palette
   - Organized into bg, fg, border, accent, clips sections
   - Maintained backward compatibility

2. **`Aura.Web/src/styles/openCutTheme.ts`**
   - Updated panel styles with new depth system
   - Enhanced timeline clip styles with gradients
   - Added selectionGlow keyframe animation

3. **`Aura.Web/src/components/OpenCut/Timeline.tsx`**
   - Updated all color references to use new tokens
   - Applied gradient backgrounds to clips
   - Enhanced selection states with glow effect

## Benefits

- **Professional appearance** matching Adobe Premiere Pro
- **Better visual hierarchy** through layered backgrounds
- **Reduced eye strain** with subtle borders
- **Rich clip appearance** with gradients
- **Clear focus states** with subtle glow
- **Consistent hover states** across all elements
- **Improved depth perception** using shadows

## Demo

A visual demonstration is available at:
`Aura.Web/public/theme-demo.html`

This standalone HTML file showcases:
- Background layer system
- Timeline with gradient clips
- Interactive states
- Panel depth
- Selection glow animation

## Testing

All changes have been validated:
- ✅ TypeScript compilation successful
- ✅ ESLint checks passed (no new warnings)
- ✅ Build completed successfully
- ✅ No placeholder markers added
- ✅ Backward compatible with existing components

## Next Steps

Future enhancements could include:
- Apply theme to remaining panels
- Add dark theme toggle support
- Implement theme persistence
- Create light theme variant
