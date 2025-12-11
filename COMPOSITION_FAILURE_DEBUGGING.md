# Video Composition Failure - Debugging Guide

## Issue
Video generation shows "100% complete" but composition fails with:
- "Batch completed (9/8 tasks done, 1 tasks failed: composition)"
- No video file created
- Generation appears stuck

## Fixes Applied

### 1. Task Count Overflow Fixed
- **Problem**: Recovery logic could cause task count to exceed total (9/8)
- **Fix**: Clamped processedTasks to totalTasks maximum
- **File**: `Aura.Core/Services/Generation/VideoGenerationOrchestrator.cs`

### 2. Enhanced Diagnostic Logging
- **Problem**: Impossible to determine WHERE composition failed
- **Fix**: Added comprehensive logging at every stage
- **Files**: `Aura.Core/Orchestrator/VideoOrchestrator.cs`

## How to Diagnose the Issue

### Step 1: Run Video Generation
Run the video generation that was failing and collect logs.

### Step 2: Search Logs for Key Markers

#### Check Audio Generation
Look for these log entries:
```
[Audio] Task started - validating prerequisites
[Audio] Prerequisites validated. ParsedScenes: X
[Audio] Starting TTS synthesis for X script lines
[Audio] Performing final validation on narration file: /path/to/audio
[Audio] Narration path stored in state: /path/to/audio
```

**If audio stops before "Narration path stored":**
- TTS synthesis failed
- Check for TTS provider errors
- Should fallback to silent audio (check for fallback messages)

#### Check Composition Start
Look for these log entries:
```
[Composition] Task started - validating prerequisites
[Composition] Prerequisites validated. Scenes: X, NarrationPath: /path/to/audio
```

**If composition never starts:**
- Dependency issue (audio not complete)
- Check batch execution logs

#### Check Narration Validation
```
[Composition] Validating narration file: /path/to/audio
[Composition] Narration file exists: /path/to/audio
[Composition] Checking narration file size
[Composition] Narration file validation passed: /path/to/audio (XXXXX bytes)
```

**If validation fails here:**
- ERROR: Narration file not found → Audio stage didn't produce output
- ERROR: File too small → TTS produced invalid audio
- **Action**: Check if narration file actually exists at the path
- **Action**: Check file size (should be >1KB)

#### Check Scene Assets Validation
```
[Composition] Validating scene assets
[Composition] Scene assets validation passed
```

**If validation fails here:**
- ERROR: Missing required scene assets
- **Action**: Check visual generation logs
- Should use placeholders if images failed

#### Check Timeline Creation
```
[Composition] Creating timeline structure
[Composition] Timeline created successfully. Scenes: X, NarrationPath: /path, SceneAssets: X scenes
```

**If this fails:**
- Internal error creating timeline object
- Check for null reference exceptions

#### Check FFmpeg Execution
```
[Render Start] Beginning FFmpeg render operation
[Render Start] RenderSpec: Resolution=1920x1080, FPS=30, Codec=h264, JobId=XXX
[Render Complete] FFmpeg returned output path: /path/to/video.mp4
```

**If FFmpeg never completes:**
- Check FFmpeg logs in `logs/` directory
- Look for FFmpeg process errors
- Check for invalid input files
- Verify FFmpeg is installed and accessible

**If FFmpeg throws exception:**
- ERROR: [Render FAILED] FFmpeg render threw exception
- Check exception type and message
- Common issues:
  - Invalid codec settings
  - Missing audio/video streams
  - Insufficient disk space
  - FFmpeg not found

#### Check Output Validation
```
[Render Validation] Checking if output file exists: /path/to/video.mp4
[Render Complete] Video rendered successfully to: /path, Size: XXXXX bytes
[Composition Complete] Output path: /path, Exists: true, Length: XXXXX bytes
```

**If validation fails here:**
- ERROR: FFmpeg returned null/empty path → FFmpeg failed silently
- ERROR: Output file does not exist → FFmpeg said it succeeded but didn't create file
- ERROR: Output file is empty → FFmpeg failed during encoding
- **Action**: Check FFmpeg logs for actual error
- **Action**: Verify output directory is writable
- **Action**: Check disk space

## Common Failure Scenarios

### Scenario 1: Narration File Not Found
**Symptoms**:
```
[Composition] Validating narration file: /path/to/audio
ERROR: CRITICAL: Narration file not found at: /path
```

**Diagnosis**:
- Audio generation stage didn't complete
- TTS synthesis failed without proper fallback
- Silent audio fallback also failed

**Fix**:
- Check TTS provider configuration
- Verify SilentWavGenerator is working
- Check for audio stage exceptions

### Scenario 2: FFmpeg Fails Silently
**Symptoms**:
```
[Render Start] Beginning FFmpeg render operation
[Render Complete] FFmpeg returned output path: /path
ERROR: CRITICAL: FFmpeg render completed but output file does not exist
```

**Diagnosis**:
- FFmpeg command executed but failed
- Error not properly propagated
- Check FFmpeg logs

**Fix**:
- Review FFmpeg logs in `logs/ffmpeg/` directory
- Check FFmpeg command validity
- Verify input files (audio, images) exist and are valid

### Scenario 3: Invalid Audio File
**Symptoms**:
```
[Composition] Narration file validation passed
[Render Start] Beginning FFmpeg render operation
ERROR: FFmpeg render threw exception: Invalid audio format
```

**Diagnosis**:
- Audio file exists but is corrupted
- Invalid WAV format
- TTS provider produced incompatible format

**Fix**:
- Enable WAV validation in TTS stage
- Check TTS provider output format
- Verify audio file can be played manually

### Scenario 4: Task Count Mismatch (9/8)
**Symptoms**:
```
Batch completed (9/8 tasks done, 1 tasks failed: composition)
```

**Diagnosis**:
- Recovery logic attempted to recover failed task
- Recovery added task but didn't update total count properly
- **Now Fixed** - task count is clamped to total

**Verification**:
- Look for "Batch results: X succeeded, Y failed. Progress: Z/W"
- Z should never exceed W

## Testing the Fix

### Test 1: Successful Generation
1. Run video generation with working TTS provider
2. Verify logs show complete progression through all stages
3. Verify video file is created
4. Verify task count stays ≤ total (e.g., 8/8, not 9/8)

### Test 2: TTS Fallback
1. Run without TTS provider configured
2. Should see silent audio fallback messages
3. Composition should proceed with silent audio
4. Video should be created (without narration)

### Test 3: Deliberate Failure
1. Configure invalid FFmpeg path
2. Should fail at [Render Start] with clear error
3. Error should indicate FFmpeg not found
4. Should NOT show 100% complete

## Next Actions

1. **Collect Logs**: Run video generation and save complete logs
2. **Search for Markers**: Use the log patterns above to find failure point
3. **Identify Root Cause**: Based on where logs stop, determine the issue
4. **Apply Specific Fix**: Based on root cause, implement targeted fix

## Log Location

- Application logs: Check console output or log files
- FFmpeg logs: `logs/ffmpeg/{jobId}.log`
- Job logs: Look for correlation ID in logs to track specific job

## Success Criteria

✅ Video file created at expected location
✅ Video file size > 0 bytes
✅ Task count never exceeds total (e.g., 8/8, not 9/8)
✅ Clear error messages if something fails
✅ No "stuck at 100%" scenarios

## Contact

If issues persist after following this guide:
1. Collect complete logs from video generation attempt
2. Include the exact error messages from logs
3. Note which log marker is the last one before failure
4. Report to development team with this information
