# FFmpeg Execution Fix - Diagnostic Implementation

## Problem Statement

Video generation jobs get stuck at 95% progress with `outputPath: null`. The issue manifests as:

1. Job logs show: "Starting video composition and rendering..."
2. **NO FFmpeg logs appear after this message**
3. No files created in FFmpeg temp directory
4. Job never completes - stuck indefinitely at 95%
5. Audio task may fail, but pipeline continues

## Root Cause Analysis

The key insight is that **FFmpeg is never actually being called**. The log "Starting video composition and rendering..." appears (line 2231 in VideoOrchestrator.cs), but the diagnostic log "[FFMPEG-START]" (line 108 in FfmpegVideoComposer.cs) never appears.

This means the code is **blocking or throwing an exception somewhere between lines 2231-2360** in VideoOrchestrator.cs, before the call to `_videoComposer.RenderAsync()`.

## Potential Causes Identified

### 1. **Task Timeout Too Short (LIKELY)**
- Default `TaskTimeout` is 5 minutes (OrchestratorOptions.cs line 69)
- Default `BatchTimeout` is 15 minutes (OrchestratorOptions.cs line 74)
- Video rendering (especially HD/4K) can take 10-30 minutes
- If timeout is hit, task is marked as "TimedOut" but job may appear stuck at 95%

### 2. **Audio Recovery Path Not Propagating**
- Audio task fails → Recovery creates silent audio
- Recovery path stored in `recoveryResultsCallback[node.TaskId]`
- Composition task checks multiple sources for narration path
- If ALL sources are null → InvalidOperationException thrown
- Exception may be caught somewhere without proper logging

### 3. **Image Provider Missing or Returning Empty Assets**
- If `resolvedImageProvider == null` → Now throws exception (fixed)
- If image tasks return empty arrays → `sceneAssets` has entries but empty
- FFmpeg validation should catch this (validAssetCount == 0)
- But if validation is never reached, job just hangs

### 4. **Silent Exception Swallowing**
- Exception thrown in composition task validation
- Caught by task executor at line 576 in VideoGenerationOrchestrator.cs
- Logged as "[Task failed]" but job may not transition to Failed state
- Job appears stuck instead of failed

### 5. **File I/O Blocking**
- `File.Exists()` call at line 2248 could hang if:
  - File path is on network drive
  - File is locked by another process
  - Antivirus is scanning the file
- Unlikely but possible

## Fixes Implemented

### 1. Enhanced Diagnostic Logging (16 Checkpoints)

Added comprehensive logging throughout composition task flow to identify exact blocking point:

```
[COMPOSITION-STAGE-1]  - Message "Starting composition" logged
[COMPOSITION-STAGE-2]  - 70% mark transition
[COMPOSITION-STAGE-3]  - About to validate narration file
[COMPOSITION-STAGE-4]  - Calling File.Exists()
[COMPOSITION-STAGE-5]  - File.Exists() returned
[COMPOSITION-STAGE-6]  - Getting FileInfo
[COMPOSITION-STAGE-7]  - Checking file size
[COMPOSITION-STAGE-8]  - About to validate scene assets
[COMPOSITION-STAGE-9]  - Scene assets validated
[COMPOSITION-STAGE-10] - Creating timeline
[COMPOSITION-STAGE-11] - Timeline created
[COMPOSITION-STAGE-12] - Preparing FFmpeg render
[COMPOSITION-STAGE-13] - Beginning FFmpeg render
[COMPOSITION-STAGE-14] - RenderSpec logged
[COMPOSITION-STAGE-15] - About to call RenderAsync
[COMPOSITION-STAGE-16] - Making actual call
```

**Purpose**: Identify where execution stops. If we see STAGE-15 but NOT [FFMPEG-START], we know the RenderAsync call is blocking.

### 2. Audio Recovery Improvements

**File**: `Aura.Core/Services/Generation/VideoGenerationOrchestrator.cs`

- Store recovery result with both task ID and "audio" key (line 797-799)
- Defensive: Store narration path in RecoveryResults even on success (line 2077)
- Enhanced logging shows all available narration sources (line 2165-2176)

**Result**: Composition task has multiple fallback paths to find narration file.

### 3. Image Provider Validation

**File**: `Aura.Core/Orchestrator/VideoOrchestrator.cs`

- Throw exception if `resolvedImageProvider == null` (line 2083-2091)
- Enhanced `ValidateSceneAssets` to detect empty asset arrays (line 2583-2600)
- Log warnings for scenes with empty assets

**Result**: Fail-fast if no image provider available instead of silently continuing.

### 4. Improved Null Checking

- Check if `_videoComposer` is null before calling RenderAsync (line 2368-2373)
- Explicit error message if composer is null

**Result**: Clear error instead of NullReferenceException.

## Next Steps - CRITICAL

### Step 1: Run a Job and Collect Diagnostic Logs

Run a quick demo or full generation job and monitor logs for the COMPOSITION-STAGE checkpoints. Identify which checkpoint is the LAST one logged before the hang.

**Expected outcomes:**

1. **If we see STAGE-15 but NOT STAGE-16**: The call to RenderAsync is blocking (before the actual method call)
2. **If we see STAGE-16 but NOT [FFMPEG-START]**: RenderAsync is called but hangs immediately
3. **If we see [FFMPEG-START] but no further FFmpeg logs**: FFmpeg command building or execution is hanging
4. **If we see neither STAGE-15 nor later**: Validation is throwing an exception that's being swallowed

### Step 2: Fix the Identified Issue

Based on diagnostic output:

#### If timeout is the issue:
```csharp
// In OrchestratorOptions or configuration
TaskTimeout = TimeSpan.FromMinutes(30),  // Increase from 5 to 30
BatchTimeout = TimeSpan.FromMinutes(60), // Increase from 15 to 60
```

#### If narration path is null:
- Check audio recovery logs
- Verify silent audio generation succeeded
- Check state.RecoveryResults contains "audio" key

#### If validation throws:
- Check ValidateSceneAssets output
- Check FFmpeg ValidateTimelinePrerequisites output
- Add try-catch with explicit logging

#### If File.Exists hangs:
- Add timeout wrapper around File.Exists
- Check if path is on network drive
- Add logging before/after every File I/O operation

### Step 3: Increase Timeouts for Video Rendering

Video rendering is resource-intensive and can take significant time:

**Recommended timeout increases:**

```csharp
// For composition task specifically
var compositionTimeout = TimeSpan.FromMinutes(45); // Up from 5 min

// For batch containing composition
var batchTimeout = TimeSpan.FromHours(1.5); // Up from 15 min
```

**Implementation options:**

1. **Option A**: Modify OrchestratorOptions defaults (affects all jobs)
2. **Option B**: Special case composition task with longer timeout
3. **Option C**: Make timeout configurable per task type

### Step 4: Ensure Proper Error Propagation

The composition task is critical. If it fails, the job MUST transition to Failed state, not remain stuck.

**Check:**
- Exception handling in VideoGenerationOrchestrator.ExecuteBatchAsync (line 576)
- OrchestrationResult failure handling in VideoOrchestrator (line 628)
- JobRunner completion logic (line 805)

## Testing Checklist

After fixes are applied:

- [ ] Quick Demo completes successfully
- [ ] Full generation with custom brief completes
- [ ] Job progresses past 95% to 100%
- [ ] `outputPath` is populated in final response
- [ ] Video file exists and is playable
- [ ] Audio failure triggers recovery and uses silent audio
- [ ] Image failure triggers placeholders
- [ ] Composition task completes within timeout
- [ ] FFmpeg logs appear showing actual rendering
- [ ] Job completes even if some visual tasks fail
- [ ] Error cases properly transition to Failed state

## Code Changes Summary

**Files Modified:**
1. `Aura.Core/Orchestrator/VideoOrchestrator.cs` - 16 diagnostic checkpoints, improved validation
2. `Aura.Core/Services/Generation/VideoGenerationOrchestrator.cs` - Audio recovery improvements

**Lines Changed:** ~110 lines across 2 files

**Build Status:** ✅ Successful (4 warnings, 0 errors)

**Breaking Changes:** None - all changes are additive (logging and validation)

## Commit History

1. `17add77` - Initial plan
2. `31050e1` - Add comprehensive diagnostic logging to trace composition task execution flow

## Conclusion

This fix adds comprehensive diagnostic logging to identify the exact point where video generation hangs. The most likely cause is task timeout (5 minutes is too short for video rendering). Once diagnostic logs identify the blocking point, the appropriate fix can be applied (likely increasing timeouts for composition task).

**Critical:** These changes are diagnostic in nature. The actual fix depends on what the diagnostic logs reveal when a job is run.
