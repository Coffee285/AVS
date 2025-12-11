# SSE Progress Sync Fix - Verification Guide

## Problem Statement

Video generation was failing with SSE connection timeout. The frontend would connect to `/api/jobs/{jobId}/progress/stream` but receive no progress updates, timing out after 30 seconds and falling back to polling.

## Root Cause

The `JobRunner` in `Aura.Core/Orchestrator/JobRunner.cs` was only syncing job state to `ExportJobService` when jobs reached **terminal states** (completed, failed, cancelled). During the **running state**, progress updates (0%, 10%, 25%, etc.) were never synced to `ExportJobService`.

This meant:
1. Frontend SSE client connects to `/api/jobs/{jobId}/progress/stream`
2. SSE endpoint subscribes to `ExportJobService` for updates
3. `ExportJobService` has the job but never receives progress updates
4. SSE stream has no data to send to frontend
5. After 30 seconds, frontend times out and falls back to polling

## Fix Implementation

### Change 1: Real-time Progress Sync (JobRunner.cs, line ~1094-1155)

**Before:**
```csharp
// CRITICAL FIX: Sync terminal states SYNCHRONOUSLY to avoid race condition
if (_exportJobService != null && IsTerminalStatus(updated.Status))
{
    // Only synced on completion/failure/cancellation
    _exportJobService.UpdateJobStatusAsync(...).GetAwaiter().GetResult();
}
```

**After:**
```csharp
// CRITICAL FIX: Sync ALL updates (not just terminal states) to ExportJobService
if (_exportJobService != null)
{
    var isTerminal = IsTerminalStatus(updated.Status);
    
    if (isTerminal)
    {
        // Terminal states: Synchronous blocking to prevent race conditions
        _exportJobService.UpdateJobStatusAsync(...).GetAwaiter().GetResult();
    }
    else
    {
        // Running states: Async fire-and-forget for real-time updates
        _ = _exportJobService.UpdateJobProgressAsync(
            updated.Id,
            updated.Percent,
            updated.Stage);
    }
}
```

**Impact:**
- Progress updates (10%, 25%, 50%, etc.) now sync to `ExportJobService` in real-time
- SSE endpoint has continuous data to stream to frontend
- No more 30-second timeout

### Change 2: Improved Job Registration (JobsController.cs, line ~223-250)

**Before:**
```csharp
await _exportJobService.CreateJobAsync(new VideoJob
{
    Status = "running",  // Hardcoded, incorrect for queued jobs
    ...
});
```

**After:**
```csharp
var exportStatus = MapJobStatus(job.Status.ToString());  // Proper mapping
await _exportJobService.CreateJobAsync(new VideoJob
{
    Status = exportStatus,  // Correct status (queued/running/etc.)
    ...
});
Log.Error(ex, "FAILED to initialize job - SSE will not work!");  // Better error visibility
```

**Impact:**
- Jobs registered with correct initial status
- Better error logging for debugging
- Clearer warnings when `ExportJobService` is unavailable

## How to Verify the Fix

### Manual Test (Windows)

1. **Start the backend:**
   ```bash
   cd Aura.Api
   dotnet run --no-build -c Release
   ```

2. **Start the frontend:**
   ```bash
   cd Aura.Web
   npm run dev
   ```

3. **Open browser DevTools** (F12) and go to Network tab

4. **Start a video generation** from the UI (use Quick Demo or full wizard)

5. **Look for SSE connection:**
   - Filter by "EventStream" or look for `/api/jobs/.../progress/stream`
   - Connection should establish immediately (within 1-2 seconds)
   - You should see continuous `job-progress` events with increasing percent values

6. **Check browser console logs:**
   - Should see: `[FinalExport] Connecting to SSE: http://...`
   - Should see: `[SSE] Connection established - receiving progress updates`
   - Should see: `[SSE] Progress update: 10%, 25%, 50%, etc.`
   - Should NOT see: `SSE connection timed out after 30 seconds`

7. **Check backend logs:**
   - Should see: `Job {JobId} initialized in ExportJobService with status queued`
   - Should see frequent: `Updated export job {JobId} progress to X% - {Stage}`
   - Should NOT see: `FAILED to initialize job`

### Expected Results

✅ **Success Indicators:**
- SSE connection establishes in <2 seconds
- Progress updates appear continuously (10%, 25%, 50%, 75%, 100%)
- No timeout or fallback to polling
- Video completes successfully with output file

❌ **Failure Indicators:**
- SSE connection times out after 30 seconds
- Frontend falls back to polling
- Log message: `FAILED to initialize job {JobId} in ExportJobService`
- No progress updates in SSE stream

### Automated Test (Future Enhancement)

Create an E2E test in `Aura.E2E/`:

```csharp
[Fact]
public async Task VideoGeneration_Should_StreamProgressViaSSE()
{
    // 1. Create job via API
    var jobResponse = await CreateJobAsync(...);
    var jobId = jobResponse.JobId;
    
    // 2. Connect to SSE endpoint
    var sseUrl = $"http://localhost:5005/api/jobs/{jobId}/progress/stream";
    var progressUpdates = new List<int>();
    
    using var sse = new ServerSentEventsClient(sseUrl);
    sse.OnEvent += (type, data) =>
    {
        if (type == "job-progress")
        {
            var progress = JsonDocument.Parse(data)
                .RootElement
                .GetProperty("percent")
                .GetInt32();
            progressUpdates.Add(progress);
        }
    };
    
    await sse.ConnectAsync();
    
    // 3. Wait for completion (with timeout)
    await Task.Delay(TimeSpan.FromMinutes(2));
    
    // 4. Verify we received progress updates
    Assert.NotEmpty(progressUpdates);
    Assert.Contains(progressUpdates, p => p >= 25);
    Assert.Contains(progressUpdates, p => p >= 50);
    Assert.Contains(progressUpdates, p => p >= 75);
    Assert.Equal(100, progressUpdates.Last());
}
```

## Architecture Diagram

```
Frontend (FinalExport.tsx)
    |
    | HTTP GET /api/jobs/{id}/progress/stream
    |
    v
API (JobsController.cs) - SSE Endpoint
    |
    | Subscribes to: ExportJobService.SubscribeToJobUpdatesAsync()
    |
    v
ExportJobService (in-memory)
    ^
    |
    | UpdateJobProgressAsync() called by JobRunner
    |
    |
JobRunner.UpdateJob()
    ^
    |
    | Progress events from VideoOrchestrator
    |
VideoOrchestrator.GenerateVideoAsync()
```

**Critical Path:**
1. VideoOrchestrator reports progress → JobRunner
2. JobRunner.UpdateJob() → ExportJobService.UpdateJobProgressAsync() ✅ **NEW!**
3. ExportJobService notifies subscribers
4. SSE endpoint streams to frontend
5. Frontend updates UI in real-time

## Related Files

- `Aura.Core/Orchestrator/JobRunner.cs` - Progress sync implementation
- `Aura.Api/Controllers/JobsController.cs` - Job creation and SSE endpoint
- `Aura.Core/Services/Export/ExportJobService.cs` - In-memory job store with subscriptions
- `Aura.Web/src/components/VideoWizard/steps/FinalExport.tsx` - Frontend SSE client
- `Aura.Web/src/services/wizardService.ts` - Job creation API calls

## Rollback Plan

If this fix causes issues:

1. **Revert commit** `da09005` (Fix SSE progress sync)
2. **Restore old behavior** where only terminal states sync
3. **Frontend will fall back to polling** (already implemented)

The polling fallback is robust and was working before, so reverting is safe.

## Performance Considerations

**Fire-and-forget async calls:** Progress updates use `_ = UpdateJobProgressAsync()` which doesn't await the result. This prevents blocking the JobRunner but means errors are silent.

**Mitigation:** Errors are logged in `UpdateJobProgressAsync` itself, so they won't be completely lost.

**Frequency:** Progress updates typically occur every 1-5 seconds during active processing. This is low enough to not cause performance issues.

**Alternative (if issues arise):** Batch updates using a buffer:
```csharp
private readonly ConcurrentQueue<(string jobId, int percent, string stage)> _updateQueue = new();
// Background task processes queue every 500ms
```

## Success Metrics

After deploying this fix:

1. **SSE connection success rate** should be >95% (was 0% before)
2. **Average time to first progress update** should be <2 seconds
3. **Polling fallback usage** should decrease to <5% of requests
4. **User-reported SSE timeout errors** should drop to zero

## Additional Notes

- The fix maintains backward compatibility with polling
- SSE endpoint still has 20-second wait for job registration (should be adequate)
- Terminal state sync remains synchronous to prevent race conditions
- No frontend changes required - fix is entirely backend
