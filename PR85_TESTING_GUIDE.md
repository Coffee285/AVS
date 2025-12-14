# PR 85 Testing Guide

**Purpose**: Verify that the video generation pipeline fixes in PR 85 work correctly in runtime scenarios.

## Test Prerequisites

- Windows environment (required for Windows Desktop App testing framework)
- .NET 8 SDK installed
- FFmpeg available in PATH or configured
- At least one LLM provider configured (OpenAI, Anthropic, Ollama, etc.)
- Optional: TTS provider configured (ElevenLabs, PlayHT, etc.)

## Unit Tests

### Run All Related Tests
```bash
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~VideoOrchestrator|FullyQualifiedName~FfmpegVideoComposer|FullyQualifiedName~JobRunner" --logger "console;verbosity=normal"
```

### Specific Test Categories

#### 1. VideoOrchestrator Validation Tests
```bash
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~VideoOrchestratorValidation" --logger "console;verbosity=normal"
```

**Expected**: All tests should pass, validating:
- Narration path resolution from multiple sources
- Proper error handling for missing narration
- Recovery callback behavior

#### 2. FfmpegVideoComposer Validation Tests
```bash
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~FfmpegVideoComposerValidation" --logger "console;verbosity=normal"
```

**Expected**: All tests should pass, validating:
- Timeline prerequisite checks
- Scene validation
- Narration file validation
- Asset validation logic

#### 3. JobRunner Tests
```bash
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~JobRunner" --logger "console;verbosity=normal"
```

**Expected**: All tests should pass, validating:
- Output path validation
- Fail-fast behavior
- Error code assignment

## Integration Test Scenarios

### Scenario 1: Successful Video Generation (Happy Path)
**Objective**: Verify complete pipeline works end-to-end

**Steps**:
1. Configure valid LLM provider (e.g., Ollama with llama3.2)
2. Configure valid TTS provider (or use Windows SAPI fallback)
3. Start application
4. Click "Quick Demo" button
5. Monitor progress via logs and UI

**Expected Behavior**:
- Progress advances through all stages: 0% → 15% → 35% → 65% → 85% → 100%
- Logs show:
  - `[Composition] Narration path resolution` with valid path
  - `[FFMPEG-PRECHECK] Starting timeline validation`
  - `[FFMPEG-PRECHECK] All timeline prerequisites validated successfully`
  - `[FFMPEG-START] RenderAsync called`
  - FFmpeg progress logs with frame/time information
- Job completes at 100% with valid OutputPath
- Video file exists at OutputPath and is playable

### Scenario 2: TTS Failure with Silent Audio Fallback
**Objective**: Verify recovery mechanism works when TTS fails

**Setup**:
1. Configure LLM provider (valid)
2. Configure TTS provider with invalid API key (to force failure)
3. Ensure silent audio fallback is enabled

**Steps**:
1. Start video generation
2. Monitor logs when TTS stage runs

**Expected Behavior**:
- TTS fails (expected)
- Log shows: `[Recovery] Audio fallback stored: sourceKey=audio*, path=<path>, using canonical 'audio' key for lookups`
- Composition stage shows: `[Composition] Narration path resolution: state.NarrationPath=NULL, RecoveryResults=<path>, ...`
- ValidateTimelinePrerequisites passes with recovered audio
- Render completes successfully with silent audio

**Failure Indicators** (if PR 85 NOT implemented):
- Job stuck at 95%
- OutputPath remains null
- No FFmpeg execution logs
- No `[Recovery] Audio fallback stored` log

### Scenario 3: Missing Narration File (Should Fail Fast)
**Objective**: Verify fail-fast when narration file is missing

**Setup**: This scenario requires code instrumentation or file deletion at precise timing

**Expected Behavior**:
- ValidateTimelinePrerequisites throws exception:
  ```
  Cannot render: Narration file not found at '<path>'.
  TTS provider may have returned a path but failed to create the file.
  ```
- Job fails with clear error message
- No FFmpeg execution attempted
- Error code: E305-OUTPUT_NULL or composition failure

### Scenario 4: Zero Scenes (Should Fail Fast)
**Objective**: Verify fail-fast when timeline has no scenes

**Expected Behavior**:
- ValidateTimelinePrerequisites throws exception:
  ```
  Cannot render: Timeline has zero scenes.
  This indicates a failure in script parsing or scene generation.
  ```
- Job fails immediately
- No FFmpeg execution attempted

### Scenario 5: All Assets Missing (Should Fail Fast)
**Objective**: Verify fail-fast when all scene assets are missing

**Expected Behavior**:
- ValidateTimelinePrerequisites throws exception:
  ```
  Cannot render: ALL X scenes have missing visual assets.
  Image generation must complete before rendering.
  ```
- Job fails with specific missing asset details
- No FFmpeg execution attempted

### Scenario 6: Partial Missing Assets (Should Succeed with Warning)
**Objective**: Verify render proceeds when some assets exist

**Expected Behavior**:
- Warning logs: `[FFMPEG-PRECHECK] X/Y scenes have missing assets: ...`
- Warning log: `Proceeding with Z valid assets despite X missing. FFmpeg may use black frames for missing visuals.`
- Render completes successfully
- Video may have black frames for missing scenes

### Scenario 7: Null Output Path Detection
**Objective**: Verify JobRunner catches null output path

**Setup**: This would require forcing orchestrator to return null output

**Expected Behavior**:
- JobRunner detects: `if (string.IsNullOrEmpty(renderOutputPath))`
- Job fails with error code E305-OUTPUT_NULL
- Error message: `Video generation completed but no output file was produced.`
- Suggested actions displayed to user

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Backup any test database/files
- [ ] Clear logs directory
- [ ] Note current FFmpeg version: `ffmpeg -version`
- [ ] Verify disk space available (>1GB recommended)

### Test Execution
- [ ] Run Scenario 1 (Happy Path) - **MUST PASS**
- [ ] Run Scenario 2 (TTS Fallback) - **MUST PASS**
- [ ] Observe logs for all expected diagnostic markers
- [ ] Verify no "stuck at 95%" issues occur
- [ ] Verify OutputPath is always set when job completes

### Post-Test Validation
- [ ] Check output video file exists
- [ ] Play output video (should have audio + visuals)
- [ ] Review logs for any unexpected errors
- [ ] Verify temp files cleaned up

## Log Markers to Look For

### Success Indicators
```
[Composition] Narration path resolution: state.NarrationPath=<path>, RecoveryResults=<path>, Closure=<path>, Final=<path>
[Composition] Prerequisites validated. Scenes: X, NarrationPath: <path>
[JobId] [FFMPEG-PRECHECK] Starting timeline validation
[JobId] [FFMPEG-PRECHECK] Timeline scenes count: X
[JobId] [FFMPEG-PRECHECK] Narration path: <path>
[JobId] [FFMPEG-PRECHECK] Narration file validated: XXXXX bytes
[JobId] [FFMPEG-PRECHECK] Scene assets: X valid, Y missing/invalid
[JobId] [FFMPEG-PRECHECK] All timeline prerequisites validated successfully
[FFMPEG-START] RenderAsync called for job <id> at HH:mm:ss.fff
[JOB-RESULT-RECEIVED] Orchestrator returned for job <id> at HH:mm:ss.fff. OutputPath: <path>, File exists: True
```

### Recovery Indicators
```
[Recovery] Audio fallback stored: sourceKey=audio*, path=<path>, using canonical 'audio' key for lookups
```

### Failure Indicators (Expected in error scenarios)
```
[FFMPEG-PRECHECK] FAILED: Cannot render: Timeline has zero scenes.
[FFMPEG-PRECHECK] FAILED: Cannot render: Narration audio path is null or empty.
[FFMPEG-PRECHECK] FAILED: Cannot render: Narration file not found at '<path>'.
[FFMPEG-PRECHECK] FAILED: Cannot render: Narration file is too small (X bytes).
[FFMPEG-PRECHECK] FAILED: Cannot render: ALL X scenes have missing visual assets.
[Job {JobId}] Video generation completed but no output file was produced.
```

## Automated Test Script (PowerShell)

```powershell
# Run comprehensive PR 85 validation tests
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PR 85 Validation Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Build verification
Write-Host "`nTest 1: Build Verification" -ForegroundColor Yellow
dotnet build Aura.sln -c Release
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build PASSED" -ForegroundColor Green

# Test 2: VideoOrchestrator tests
Write-Host "`nTest 2: VideoOrchestrator Validation Tests" -ForegroundColor Yellow
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~VideoOrchestratorValidation" --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ VideoOrchestrator tests FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "✅ VideoOrchestrator tests PASSED" -ForegroundColor Green

# Test 3: FfmpegVideoComposer tests
Write-Host "`nTest 3: FfmpegVideoComposer Validation Tests" -ForegroundColor Yellow
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~FfmpegVideoComposerValidation" --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ FfmpegVideoComposer tests FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "✅ FfmpegVideoComposer tests PASSED" -ForegroundColor Green

# Test 4: JobRunner tests
Write-Host "`nTest 4: JobRunner Tests" -ForegroundColor Yellow
dotnet test Aura.Tests/Aura.Tests.csproj --filter "FullyQualifiedName~JobRunner" --logger "console;verbosity=minimal"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ JobRunner tests FAILED" -ForegroundColor Red
    exit 1
}
Write-Host "✅ JobRunner tests PASSED" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ ALL PR 85 TESTS PASSED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
```

Save as `Test-PR85.ps1` and run:
```powershell
.\Test-PR85.ps1
```

## Troubleshooting

### Test Failures

#### "Microsoft.WindowsDesktop.App not found"
**Cause**: Tests require Windows Desktop App framework  
**Solution**: Run tests on Windows machine, or skip tests requiring WPF

#### Tests timeout
**Cause**: FFmpeg execution taking too long  
**Solution**: 
- Verify FFmpeg is in PATH
- Check system resources
- Increase test timeout values

#### "No LLM provider configured"
**Cause**: Application settings missing provider config  
**Solution**: Configure at least one LLM provider in appsettings.json

### Runtime Issues

#### Job still stuck at 95%
**Check**:
1. Is PR 85 actually deployed? Check git log: `git log --oneline --grep="85"`
2. Are there any exceptions in logs before 95%?
3. Is FFmpeg path valid? Check logs for FFmpeg resolution
4. Are all prerequisite validations passing?

#### E305-OUTPUT_NULL error
**This is expected behavior** when prerequisites fail. Check earlier logs for:
- TTS failures without recovery
- Missing narration file
- Zero scenes
- All assets missing

#### E305-OUTPUT_NOT_FOUND error
**Indicates FFmpeg completed but file not found**. Check:
- FFmpeg logs for encoding errors
- Disk space
- File permissions
- Output directory exists

## Success Criteria

PR 85 is considered successfully validated when:

- [x] All unit tests pass
- [x] Scenario 1 (Happy Path) completes with video output
- [x] Scenario 2 (TTS Fallback) shows recovery logs and completes
- [x] Scenarios 3-5 fail fast with clear error messages (expected behavior)
- [x] No jobs stuck at 95% with null OutputPath
- [x] All diagnostic log markers present
- [x] Video files are created and playable

## Reporting Issues

If tests fail or issues are found, report with:

1. **Scenario**: Which test scenario
2. **Observed**: What actually happened
3. **Expected**: What should have happened
4. **Logs**: Relevant log excerpts (include timestamps)
5. **Environment**: OS, .NET version, FFmpeg version
6. **Config**: LLM/TTS providers configured

---

**Last Updated**: December 14, 2025  
**PR**: #85 - Fix Video Generation Pipeline  
**Status**: Ready for Testing
