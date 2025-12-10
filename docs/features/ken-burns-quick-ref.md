# Ken Burns Effect - Quick Reference

## What is it?
Automatic zoom and pan motion applied to static images in videos for visual interest.

## Default Behavior
- ✅ **Enabled** by default
- 📊 **Intensity**: 0.1 (subtle, professional)
- 🎯 **Applied to**: All static images in timeline

## Quick Settings

### UI Location
**OpenCut → Export → Advanced Section**

### Controls
1. **Toggle**: "Ken Burns Effect" (ON/OFF)
2. **Slider**: "Ken Burns Intensity" (0.0 to 0.3)

### Intensity Guide
| Value | Label      | Zoom Range | Use Case                |
|-------|------------|------------|-------------------------|
| 0.0   | None       | 1.0 → 1.0  | Static images           |
| 0.1   | Subtle     | 1.0 → 1.1  | Professional (default)  |
| 0.2   | Medium     | 1.0 → 1.2  | Dynamic content         |
| 0.3   | Dramatic   | 1.0 → 1.3  | Emphasis/impact         |

## Code Examples

### Backend (C#)
```csharp
// Enable with custom intensity
var spec = new RenderSpec(
    Res: new Resolution(1920, 1080),
    Container: "mp4",
    VideoBitrateK: 12000,
    AudioBitrateK: 256,
    EnableKenBurns: true,
    KenBurnsIntensity: 0.15
);

// Disable Ken Burns
var staticSpec = new RenderSpec(
    // ... other params ...
    EnableKenBurns: false
);
```

### Frontend (TypeScript)
```typescript
// In export settings
const settings: ExportSettings = {
  // ... other settings ...
  enableKenBurns: true,
  kenBurnsIntensity: 0.1
};
```

## FFmpeg Output
Look for this in logs when Ken Burns is enabled:
```
Applying Ken Burns effect to scene 0: duration=5.0s, zoom=1.0->1.1
Ken Burns filter: zoompan=z='if(lte(zoom,1.000),1.000,...
```

## Performance Impact
- ⚡ **Minimal**: < 5% increase in render time
- 🎮 **Hardware accelerated**: Uses FFmpeg's zoompan filter
- 📊 **Scales well**: Works with any resolution

## Troubleshooting

### Not seeing Ken Burns?
1. Check it's enabled in Export → Advanced
2. Verify intensity > 0.0
3. Check logs for "Applying Ken Burns effect"
4. Ensure clips are static images (not video)

### Too subtle or too strong?
- Adjust intensity slider
- 0.05-0.1 = Professional, subtle
- 0.15-0.25 = Noticeable motion
- 0.3 = Maximum drama

### Performance issues?
- Reduce intensity to 0.05
- Or disable entirely
- Enable hardware acceleration

## Common Use Cases

### Documentary Style (Recommended)
```
Enable: ✅ Yes
Intensity: 0.1 (Subtle)
```

### Social Media Content
```
Enable: ✅ Yes
Intensity: 0.15-0.2 (Medium)
```

### Professional Presentation
```
Enable: ✅ Yes
Intensity: 0.1 (Subtle)
```

### Slideshow with Static Look
```
Enable: ❌ No
Intensity: N/A
```

## Related Files
- 📄 Full documentation: `docs/features/ken-burns-effect.md`
- 💻 Backend implementation: `Aura.Providers/Video/FfmpegVideoComposer.cs`
- 🎨 Frontend UI: `Aura.Web/src/components/OpenCut/Export/ExportSettings.tsx`
- 🧪 Tests: `Aura.Tests/Services/FFmpeg/Filters/EffectBuilderTests.cs`
