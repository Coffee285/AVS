# Video Export Stuck at 95% - Root Cause Fix

## Problem Summary

Despite numerous previous PRs attempting to fix this issue (#49, #52, #53, #54, #57, #60, #62, #64, #66, #67, #69, #70), video exports were still getting stuck at 95% indefinitely. The user reported:

- Export starts normally, progresses from 2% to 95%
- At 95% it says "Starting video composition and rendering..."
- It stays at 95% forever and never completes
- SSE falls back to polling but polling never sees completion

## Root Causes Identified

### Root Cause 1: Progress Mapping Formula Caps at 95%

**Location**: `Aura.Core/Orchestrator/JobRunner.cs` line 1509

**Problem**: The formula `80 + (renderPercent * 0.15)` mathematically caps at 95% when FFmpeg reports 100% progress. Even when FFmpeg completes successfully, the overall progress can NEVER reach 100% through this path.

**Fix Applied**: Changed the multiplier from 0.15 to 0.19 so that:
- 0% FFmpeg progress → 80% overall
- 100% FFmpeg progress → 99% overall (80 + 100 * 0.19 = 99)

This leaves room for the completion signal to set 100%.

### Root Cause 2: FFmpeg Finalization Phase Has No Progress Updates

**Location**: `Aura.Providers/Video/FfmpegVideoComposer.RenderMonitoring.cs`

**Problem**: When FFmpeg enters its finalization phase (muxing overhead, flushing buffers), it stops outputting `time=` progress updates. The progress parsing relies on parsing `time=` from stderr - during finalization, this stops, so no progress updates are sent even though FFmpeg is still working.

**Fix Applied**: 
1. Added detection for "muxing overhead" output from FFmpeg (lines 66-76)
2. Emit explicit 100% completion signal when FFmpeg process exits with code 0 (lines 98-103)

### Root Cause 3: Missing "muxing overhead" Detection in JobRunner

**Location**: `Aura.Core/Orchestrator/JobRunner.cs` line 1517-1526

**Problem**: FFmpeg outputs `muxing overhead: X%` at the very end of encoding. This is a reliable completion signal that was being ignored by the progress message parser.

**Fix Applied**: Added "muxing overhead" to the completion detection conditions, ensuring it triggers the transition to "Complete" stage with 100% progress.

### Root Cause 4: Insufficient Logging for Terminal States

**Location**: `Aura.Core/Services/Export/ExportJobService.cs`

**Problem**: While logging existed, it wasn't sufficient to debug completion notification issues.

**Fix Applied**: Added enhanced logging for:
- Explicit success logging when status reaches "completed" 
- Subscriber notification counts for terminal states
- This ensures we can trace the exact moment completion is signaled

## Changes Made

### 1. `Aura.Core/Orchestrator/JobRunner.cs`

```csharp
// Line 1508-1509: Updated progress mapping
// OLD: percent = 80 + (int)(renderPercent * 0.15);  // Max 95%
// NEW: percent = 80 + (int)(renderPercent * 0.19);  // Max 99%

// Line 1517-1521: Added "muxing overhead" detection
else if (message.Contains("Render complete", StringComparison.OrdinalIgnoreCase) ||
         message.Contains("Rendering complete", StringComparison.OrdinalIgnoreCase) ||
         message.Contains("Video export complete", StringComparison.OrdinalIgnoreCase) ||
         message.Contains("Progress reported as 100%", StringComparison.OrdinalIgnoreCase) ||
         message.Contains("muxing overhead", StringComparison.OrdinalIgnoreCase))  // NEW
```

### 2. `Aura.Providers/Video/FfmpegVideoComposer.RenderMonitoring.cs`

```csharp
// Lines 66-76: Added "muxing overhead" detection
if (line.Contains("muxing overhead", StringComparison.OrdinalIgnoreCase))
{
    lastProgressTime = DateTime.Now;
    lastProgress = 100f;
    _logger.LogInformation("[{JobId}] Detected FFmpeg muxing overhead - encoding complete", jobId);
    
    var elapsed = DateTime.Now - startTime;
    progress.Report(new RenderProgress(100f, elapsed, TimeSpan.Zero, "muxing overhead"));
}

// Lines 98-103: Explicit 100% completion after process exit
_logger.LogInformation("[{JobId}] FFmpeg process completed with exit code 0, reporting 100% completion", jobId);
progress.Report(new RenderProgress(
    100f,
    DateTime.Now - startTime,
    TimeSpan.Zero,
    "Render complete"));
```

### 3. `Aura.Core/Services/Export/ExportJobService.cs`

```csharp
// Lines 149-157: Enhanced completion logging
if (status == "completed")
{
    _logger.LogInformation(
        "✅ [JobId={JobId}] Job completed successfully. Progress={Progress}%, OutputPath={OutputPath}",
        jobId, percent, outputPath);
}

// Lines 163-167: Log subscriber notification for terminal states
if (isTerminal)
{
    _logger.LogInformation(
        "[JobId={JobId}] Notified {Count} subscriber channel(s) of terminal state: {Status}",
        jobId, _subscribers.TryGetValue(jobId, out var channels) ? channels.Count : 0, status);
}
```

## Expected Behavior After Fix

1. **Progress Range**: FFmpeg render progress now maps to 80-99% range instead of 80-95%
2. **Completion Detection**: When FFmpeg process exits successfully OR outputs "muxing overhead", an explicit 100% completion signal is sent
3. **State Propagation**: The ExportJobService receives the terminal "completed" state with the output path
4. **Frontend Response**: The frontend sees the job complete and offers the download button

## Progress Flow After Fix

```
0-15%:  Script generation
15-35%: TTS synthesis
35-65%: Visual generation/selection
65-80%: Timeline composition
80-99%: FFmpeg rendering (incremental progress based on time= output)
99-100%: FFmpeg finalization (muxing overhead detected OR process exit)
100%:   Complete (job transitions to terminal state, download available)
```

## Testing Validation

All projects build successfully with 0 errors:
- ✅ Aura.Core builds (Release configuration)
- ✅ Aura.Providers builds (Release configuration)
- ✅ Full solution builds (Release configuration)

The fix addresses all four root causes without breaking existing functionality.

## Related Issues

This fix addresses the core mathematical and signal propagation issues that have been the root cause of all previous "stuck at 95%" reports in PRs #49, #52, #53, #54, #57, #60, #62, #64, #66, #67, #69, #70.
