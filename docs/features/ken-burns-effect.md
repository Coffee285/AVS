# Ken Burns Effect Feature

## Overview

The Ken Burns effect is a popular video technique that adds subtle zoom and pan motion to static images, creating a sense of movement and visual interest. This feature is automatically applied to all static images in video compositions.

## Features

### Automatic Application
- Ken Burns effect is applied automatically to all static images during video rendering
- No manual intervention required for basic usage
- Effect is generated using FFmpeg's `zoompan` filter

### Customizable Settings

#### Enable/Disable Toggle
- **Default**: Enabled
- **Purpose**: Allow users to render videos with static images (no motion)
- **Use Case**: When a completely static look is desired for images

#### Intensity Control
- **Range**: 0.0 (no zoom) to 0.3 (dramatic zoom)
- **Default**: 0.1 (subtle, professional look)
- **Step**: 0.05 increments

**Intensity Levels:**
- **0.0 - None**: No zoom effect (static image)
- **0.1 - Subtle**: Professional, gentle zoom (1.0 → 1.1x)
- **0.2 - Medium**: Noticeable motion (1.0 → 1.2x)
- **0.3 - Dramatic**: Strong zoom effect (1.0 → 1.3x)

## Technical Implementation

### Backend (C#)

#### RenderSpec Model
```csharp
public record RenderSpec(
    // ... other properties ...
    bool EnableKenBurns = true,
    double KenBurnsIntensity = 0.1
);
```

#### FFmpeg Filter Generation
The Ken Burns effect is implemented using FFmpeg's `zoompan` filter:

```csharp
// From EffectBuilder.BuildKenBurns
zoompan=z='if(lte(zoom,1.000),1.000,if(gte(zoom,1.100),1.100,zoom+(1.100-1.000)/5.000/30))'
  :x='iw/2-(iw/zoom/2)+(0.500-0.500)*on/5.000/30*iw'
  :y='ih/2-(ih/zoom/2)+(0.500-0.500)*on/5.000/30*ih'
  :d=5.000*30
  :s=1920x1080
  :fps=30
```

**Filter Parameters:**
- `z`: Zoom expression (interpolates from start to end)
- `x`: X-axis pan expression
- `y`: Y-axis pan expression
- `d`: Duration in frames (duration_seconds × fps)
- `s`: Output size (width × height)
- `fps`: Frames per second

#### Enhanced Logging
When Ken Burns is applied, the system logs:
```
Applying Ken Burns effect to scene {Index}: duration={Duration}s, zoom={ZoomStart}->{ZoomEnd}
Ken Burns filter: {Filter}
```

When disabled:
```
Ken Burns disabled for scene {Index}, using static scale
```

### Frontend (TypeScript/React)

#### Export Settings Interface
```typescript
export interface ExportSettings {
  // ... other settings ...
  enableKenBurns?: boolean;
  kenBurnsIntensity?: number;
}
```

#### UI Controls
Located in OpenCut Export Settings panel under "Advanced" section:

1. **Toggle Switch**: "Ken Burns Effect"
   - Enables/disables the effect
   - Default: ON

2. **Intensity Slider**: "Ken Burns Intensity"
   - Only visible when Ken Burns is enabled
   - Range: 0.0 to 0.3, step 0.05
   - Shows text label: "None", "Subtle", "Medium", or "Dramatic"

#### Built-in Presets
All video export presets include Ken Burns by default:
- YouTube 4K (enabled, 0.1 intensity)
- YouTube 1080p (enabled, 0.1 intensity)
- Vertical HD (enabled, 0.1 intensity)
- Square HD (enabled, 0.1 intensity)
- Web 720p (enabled, 0.1 intensity)
- ProRes Master (enabled, 0.1 intensity)
- GIF (not applicable - no Ken Burns)

## Usage Guide

### For End Users

#### Using Default Settings
1. Create or edit a video project with static images
2. Navigate to Export Settings in OpenCut
3. Ken Burns is already enabled with subtle intensity (0.1)
4. Export your video - images will have smooth zoom motion

#### Customizing Ken Burns

**To Disable Ken Burns:**
1. Go to Export Settings → Advanced
2. Toggle OFF "Ken Burns Effect"
3. Images will render as static frames

**To Adjust Intensity:**
1. Go to Export Settings → Advanced
2. Ensure "Ken Burns Effect" is ON
3. Use the "Ken Burns Intensity" slider
4. Choose your preferred level:
   - 0.0: No effect (same as disabled)
   - 0.05-0.1: Subtle professional motion
   - 0.15-0.2: Medium motion for dynamic content
   - 0.25-0.3: Dramatic effect for emphasis

### For Developers

#### Adding Ken Burns to Custom Render Specs
```csharp
var spec = new RenderSpec(
    Res: new Resolution(1920, 1080),
    Container: "mp4",
    VideoBitrateK: 12000,
    AudioBitrateK: 256,
    EnableKenBurns: true,           // Enable Ken Burns
    KenBurnsIntensity: 0.15         // Medium intensity
);
```

#### Checking FFmpeg Command
Look for `zoompan=` in FFmpeg logs:
```
[FFmpeg] -filter_complex "[0:v]zoompan=z='if(lte(zoom,1.000),1.000,if(gte(zoom,1.150)..."
```

#### Verifying in Rendered Video
1. Render a video with static images
2. Check logs for "Applying Ken Burns effect" messages
3. Play the video and observe subtle zoom on images
4. Compare with video rendered with `EnableKenBurns: false`

## Performance Considerations

### Impact on Render Time
- **Minimal overhead**: Ken Burns uses FFmpeg's hardware-accelerated zoompan filter
- **No additional encoding passes**: Applied during the single video composition pass
- **Scales well**: Performance impact is proportional to video resolution and duration

### Recommended Settings by Hardware

**High-end systems (Tier S/A):**
- Can use any intensity without performance impact
- Consider higher intensities (0.2-0.3) for dramatic effect

**Mid-range systems (Tier B/C):**
- Default intensity (0.1) works well
- Slight increase in render time (typically < 5%)

**Low-end systems (Tier D):**
- Consider disabling for faster renders
- Or use lowest intensity (0.05) for minimal overhead

## Testing

### Unit Tests
```csharp
[Theory]
[InlineData(0.0, 1.0)]  // No zoom
[InlineData(0.1, 1.1)]  // Subtle
[InlineData(0.2, 1.2)]  // Medium
[InlineData(0.3, 1.3)]  // Dramatic
public void BuildKenBurns_WithDifferentIntensities_ShouldGenerateCorrectZoomRange(
    double intensity, 
    double expectedZoomEnd)
{
    var result = EffectBuilder.BuildKenBurns(5.0, 30, 1.0, 1.0 + intensity);
    Assert.Contains("zoompan", result);
    Assert.Contains($"{expectedZoomEnd:F3}", result);
}
```

### Manual Testing Checklist
- [ ] Render video with Ken Burns enabled (default 0.1)
- [ ] Verify smooth zoom motion on static images
- [ ] Test with Ken Burns disabled - images should be static
- [ ] Test different intensities (0.0, 0.1, 0.2, 0.3)
- [ ] Verify UI slider updates visual feedback labels
- [ ] Check FFmpeg logs for `zoompan=` filter
- [ ] Verify no performance regression
- [ ] Test with various image resolutions and aspect ratios

## Troubleshooting

### Ken Burns Not Appearing
1. **Check logs**: Look for "Applying Ken Burns effect" messages
2. **Verify settings**: Ensure `EnableKenBurns: true` in RenderSpec
3. **Check image detection**: Verify images are detected (IsImage property)
4. **Inspect FFmpeg command**: Look for `zoompan=` in filter graph

### Unexpected Zoom Amount
1. **Check intensity setting**: Verify `KenBurnsIntensity` value
2. **Calculation**: Zoom end = 1.0 + intensity
3. **Example**: Intensity 0.1 → zoom from 1.0 to 1.1 (10% increase)

### Performance Issues
1. **Lower intensity**: Reduce to 0.05 or disable
2. **Check hardware acceleration**: Ensure NVENC/AMF enabled
3. **Monitor FFmpeg logs**: Check for filter errors

## Future Enhancements

Potential improvements for future releases:
- **Pan direction control**: Allow X/Y pan customization
- **Per-image settings**: Different Ken Burns for each image
- **Custom easing**: Non-linear zoom curves
- **Random variation**: Slight randomness for natural look
- **Preview**: Real-time preview of Ken Burns effect
- **Presets**: "Documentary", "Modern", "Classic" styles

## References

- [FFmpeg zoompan filter documentation](https://ffmpeg.org/ffmpeg-filters.html#zoompan)
- [Ken Burns effect on Wikipedia](https://en.wikipedia.org/wiki/Ken_Burns_effect)
- Aura.Core/Services/FFmpeg/Filters/EffectBuilder.cs
- Aura.Providers/Video/FfmpegVideoComposer.cs
- Aura.Web/src/components/OpenCut/Export/ExportSettings.tsx
