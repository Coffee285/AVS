# Test File Fixes - Quick Reference Guide

## Overview

8 test files need Timeline constructor updates to include the new `SceneAudioPaths` parameter.

## The Fix

Add `SceneAudioPaths: null,` after the `NarrationPath` parameter in Timeline constructors.

### Before:
```csharp
var timeline = new Timeline(
    Scenes: scenes,
    SceneAssets: assets,
    NarrationPath: "/path/to/audio.wav",
    MusicPath: "",
    SubtitlesPath: null
);
```

### After:
```csharp
var timeline = new Timeline(
    Scenes: scenes,
    SceneAssets: assets,
    NarrationPath: "/path/to/audio.wav",
    SceneAudioPaths: null,  // ADD THIS LINE
    MusicPath: "",
    SubtitlesPath: null
);
```

## Files to Fix

### 1. PacingOptimizerTests.cs (5 instances)
**Lines**: ~38, ~71, ~104, ~138, ~168

### 2. FfmpegVideoComposerValidationTests.cs (3 instances)
**Lines**: ~53, ~97, ~143

### 3. TtsEndpointIntegrationTests.cs (1 instance)
**Line**: ~119

### 4. FFmpegIntegrationTests.cs (1 instance)
**Line**: ~84

### 5. CaptionsIntegrationTests.cs (1 instance)
**Line**: ~37

### 6. Services/Repurposing/ShortsExtractorTests.cs (1 instance)
**Line**: ~137

### 7. Services/Repurposing/RepurposingServiceTests.cs (1 instance)
**Line**: ~220

### 8. Services/Repurposing/BlogGeneratorTests.cs (1 instance)
**Line**: ~167

## Verification

After fixes, run:
```bash
cd /home/runner/work/AVS/AVS
dotnet build Aura.Tests/Aura.Tests.csproj
```

Should complete with 0 errors, 0 warnings.

Then run tests:
```bash
dotnet test Aura.Tests/Aura.Tests.csproj --verbosity normal
```

## Automated Fix Script

If you prefer automation:

```bash
#!/bin/bash
cd /home/runner/work/AVS/AVS/Aura.Tests

# Fix each file
for file in \
  PacingOptimizerTests.cs \
  TtsEndpointIntegrationTests.cs \
  CaptionsIntegrationTests.cs \
  Video/FfmpegVideoComposerValidationTests.cs \
  Integration/FFmpegIntegrationTests.cs \
  Services/Repurposing/ShortsExtractorTests.cs \
  Services/Repurposing/RepurposingServiceTests.cs \
  Services/Repurposing/BlogGeneratorTests.cs
do
  if [ -f "$file" ]; then
    # Use perl for more reliable multi-line replacement
    perl -i -pe 's/(NarrationPath: [^,]+,)\n/$1\n            SceneAudioPaths: null,\n/' "$file"
    echo "Fixed: $file"
  fi
done

echo "All files fixed. Run 'dotnet build' to verify."
```

## Alternative: Manual Fix with VS Code

1. Open each file in VS Code
2. Search for `NarrationPath:` (Ctrl+F)
3. After each match, insert new line: `SceneAudioPaths: null,`
4. Ensure proper indentation (should align with other parameters)
5. Save file
6. Repeat for all 8 files

## Notes

- All instances use `null` for SceneAudioPaths (backward compatibility)
- Future per-scene audio support would populate this dictionary
- Proper indentation matches existing code style (usually 12 spaces or 3 tabs)
- Parameter order: Scenes, SceneAssets, NarrationPath, **SceneAudioPaths**, MusicPath, SubtitlesPath

## Estimated Time

- Manual: ~10 minutes
- Automated script: ~1 minute
- Verification build: ~1 minute

Total: ~12 minutes for complete fix and verification.
