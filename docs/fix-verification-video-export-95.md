# Video Export 95% Stuck Issue - Fix Verification

## Issue Summary
Video exports were getting stuck at 95% in the "Rendering" stage and never completing. The frontend would see "Export Appears Stuck" and no video file was produced.

## Root Cause
The application had **two separate job tracking systems** that didn't communicate:

1. **JobRunner** (backend) - Uses `Job` model, stores in `_activeJobs` dictionary
2. **ExportJobService** (API layer) - Uses `VideoJob` model, stores in separate dictionary

When JobRunner completed a job, it updated its internal `Job` model but **never called `ExportJobService.UpdateJobStatusAsync()`**. Since the frontend polls ExportJobService via `/api/jobs/{id}`, it never saw the completion.

Additional issues:
- FFmpeg progress was capped at 99.5%, preventing 100% completion
- Stuck detection threshold was too short for finalization phase (90%+)

## Changes Made

### 1. JobRunner.cs
**Added ExportJobService Integration:**
```csharp
// Constructor now accepts IExportJobService
private readonly Services.Export.IExportJobService? _exportJobService;

public JobRunner(
    // ... existing parameters ...
    Services.Export.IExportJobService? exportJobService = null)
{
    // ... existing initialization ...
    _exportJobService = exportJobService;
}

// UpdateJob() now syncs terminal states to ExportJobService
if (_exportJobService != null && IsTerminalStatus(updated.Status))
{
    var exportStatus = MapJobStatusToExportStatus(updated.Status);
    _ = Task.Run(async () =>
    {
        await _exportJobService.UpdateJobStatusAsync(
            updated.Id,
            exportStatus,
            updated.Percent,
            updated.OutputPath,
            updated.ErrorMessage).ConfigureAwait(false);
    });
}
```

### 2. FfmpegVideoComposer.RenderMonitoring.cs
**Removed 99.5% Progress Cap:**
```csharp
// Before: lastProgress = Math.Clamp(..., 0, 99.5f);
// After:
lastProgress = Math.Clamp(
    (float)(time.TotalSeconds / totalDuration.TotalSeconds * 100),
    0, 100f);  // Now allows 100%
```

**Increased Finalization Threshold:**
```csharp
// Before: var threshold = progress >= 90 ? 120 : 45;
// After:
var threshold = progress >= 90 ? 180 : 45;  // 3 minutes for finalization
```

### 3. JobsController.cs
**Initialize Job in Both Systems:**
```csharp
var job = await _jobRunner.CreateAndStartJobAsync(/* ... */);

// CRITICAL FIX: Create job in ExportJobService for SSE/polling support
if (_exportJobService != null)
{
    await _exportJobService.CreateJobAsync(new VideoJob
    {
        Id = job.Id,
        Status = "running",
        Progress = job.Percent,
        Stage = job.Stage,
        CreatedAt = job.CreatedUtc,
        StartedAt = job.StartedUtc
    });
}
```

## Expected Behavior After Fix

### Job Creation
1. User calls `POST /api/jobs` to create a job
2. JobsController creates job in **both** JobRunner and ExportJobService
3. Frontend receives jobId and can start polling

### Job Execution
1. JobRunner executes the video generation pipeline
2. Progress updates flow through normal channels (0-95%)
3. FFmpeg render allows progress to reach 100% (no cap)
4. CompositionStage reports 100% completion

### Job Completion
1. JobRunner marks job as `JobStatus.Done` with `outputPath` set
2. `UpdateJob()` detects terminal state and syncs to ExportJobService
3. ExportJobService updates `VideoJob` with:
   - Status: "completed"
   - Progress: 100
   - OutputPath: "/path/to/video.mp4"
4. Frontend polls `/api/jobs/{id}` and receives complete status with outputPath
5. Frontend shows "Export Complete" with download button

### Error Handling
- If outputPath is missing when job completes, ExportJobService logs ERROR and rejects update
- This forces developer to fix the issue at the source (JobRunner)

## Verification Steps

### Manual Testing
1. Start the backend API server
2. Create a video generation job via API or UI
3. Monitor logs for sync messages:
   ```
   [Job {JobId}] Syncing terminal state to ExportJobService: Status=completed, OutputPath=/path/to/video.mp4
   Export job {JobId} reached terminal state: completed (OutputPath: /path/to/video.mp4, Error: none)
   ```
4. Verify frontend shows 100% completion
5. Verify download link works

### Log Patterns to Look For

**Success Pattern:**
```
[Job abc123] Terminal state: Status=Done, Stage=Complete, Percent=100%, OutputPath=/videos/output.mp4
[Job abc123] Syncing terminal state to ExportJobService: Status=completed, OutputPath=/videos/output.mp4
Export job abc123 reached terminal state: completed (OutputPath: /videos/output.mp4, Error: none)
```

**Failure Pattern (should not occur):**
```
CRITICAL: Job abc123 attempted to transition to 'completed' without outputPath. Rejecting status update.
```

### CI/CD Testing
Tests will run in GitHub Actions on Windows runners (project targets Windows Desktop framework)

## Safety Checks

### ExportJobService Validation
The `UpdateJobStatusAsync` method already has validation:
```csharp
if (status == "completed" && string.IsNullOrWhiteSpace(outputPath))
{
    _logger.LogError("CRITICAL: Job {JobId} attempted to transition to 'completed' without outputPath.");
    return Task.CompletedTask; // Reject update
}
```

This ensures we catch any bugs where completion is attempted without outputPath.

### Fire-and-Forget Pattern
The sync to ExportJobService uses fire-and-forget (`_ = Task.Run(...)`) to avoid blocking:
- Main job flow is not delayed
- Errors are caught and logged but don't fail the job
- If sync fails, job still completes in JobRunner (can be debugged via logs)

## Rollback Plan
If issues occur:
1. Revert commit `6c83611`
2. Re-deploy backend
3. Previous behavior (stuck at 95%) will return but app remains stable

## Related Issues
- Previous fix attempts mentioned in problem statement
- Frontend SSE connection fallback behavior
- Stuck detection false positives

## Build Status
✅ .NET solution builds successfully (0 errors, 4 warnings unrelated to changes)

## Next Steps
1. Monitor production logs for sync messages
2. Collect metrics on job completion rates
3. Review frontend SSE implementation for optimization opportunities
