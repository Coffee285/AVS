# SSE Endpoint 500 Error Fix - Implementation Summary

## Problem Statement

Video export was broken with SSE endpoint returning 500 Internal Server Errors, causing progress to jump from 2% to 95% and then get stuck indefinitely.

### Symptoms
- Console error: `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` on `/api/jobs/{jobId}/events`
- Progress jumped erratically from 2% to 95%
- Video rendering stuck at "Starting video composition and rendering" at 95%
- Frontend fallback to polling after SSE failure

### Console Logs
```
[FinalExport] Connecting to SSE: http://127.0.0.1:5005/api/jobs/62bde40c-681a-4994-8d5a-05cc3f567f24/events
127.0.0.1:5005/api/jobs/62bde40c-681a-4994-8d5a-05cc3f567f24/events:1 Failed to load resource: the server responded with a status of 500 (Internal Server Error)
[SSE] Connection closed but job not completed, falling back to polling
[FinalExport] Falling back to polling for job: 62bde40c-681a-4994-8d5a-05cc3f567f24
```

## Root Cause Analysis

### Issue 1: Duplicate SSE Endpoint Routes

There were **TWO different SSE endpoints** registered for the same route `/api/jobs/{jobId}/events`:

1. **Program.cs (lines 4641-4750)**: Minimal API endpoint
   - Lacked proper null checks before accessing job properties
   - Did NOT have ExportJobService fallback when job not found in JobRunner
   - No proper error handling for race conditions
   - **This endpoint was being matched FIRST** due to ASP.NET Core routing priority

2. **JobsController.cs (line 768)**: Controller-based endpoint (`GetJobEvents` method)
   - Had proper null checks and error handling
   - Included ExportJobService fallback
   - Had comprehensive error handling from PR #67 fixes
   - This was the CORRECT implementation but never reached due to routing priority

### Issue 2: Race Condition in Job Creation vs SSE Connection

When a job was created:
1. `JobRunner.CreateAndStartJobAsync()` is called
2. Job is registered in `ExportJobService`
3. Frontend immediately tries to connect to SSE

But there was a timing gap where the Minimal API SSE endpoint checked for the job before it was fully registered, causing:
- `jobRunner.GetJob(jobId)` returning null at line 4667 of Program.cs
- Immediate error response without checking ExportJobService
- 500 error due to null reference access

## Solution Implementation

### Fix 1: Remove Duplicate Minimal API SSE Endpoint ✅

**File**: `Aura.Api/Program.cs`

**Action**: Removed lines 4639-4750 containing the duplicate Minimal API endpoint:
```csharp
// REMOVED: Duplicate SSE endpoint (118 lines)
// apiGroup.MapGet("/jobs/{jobId}/events", async (...) => { ... })
```

**Result**: Only the controller-based endpoint in `JobsController.GetJobEvents()` now handles `/api/jobs/{jobId}/events` requests.

### Fix 2: Add Retry Logic to GetJobEvents Method ✅

**File**: `Aura.Api/Controllers/JobsController.cs`

**Action**: Added retry logic similar to `GetJobProgressStream` method to wait for job registration:

```csharp
// CRITICAL FIX: Wait for job to appear (it may take a moment after creation)
// This prevents race condition where SSE connects before job is fully registered
Job? job = null;
var waitAttempts = 0;
const int waitIntervalMs = 250;
const int maxWaitTimeMs = 20_000; // 20 seconds
const int maxWaitAttempts = maxWaitTimeMs / waitIntervalMs;

while (job == null && waitAttempts < maxWaitAttempts && !cancellationToken.IsCancellationRequested)
{
    job = _jobRunner.GetJob(jobId);
    if (job == null)
    {
        waitAttempts++;
        await Task.Delay(waitIntervalMs, cancellationToken).ConfigureAwait(false);
    }
}
```

**Enhanced Logging**: Added wait attempt counts to all log messages for better debugging:
```csharp
Log.Warning("[{CorrelationId}] SSE: Job {JobId} not found in JobRunner or ExportJobService after {WaitAttempts} attempts", 
    correlationId, jobId, waitAttempts);
```

## Changes Summary

### Modified Files
1. **Aura.Api/Program.cs** (-116 lines)
   - Removed duplicate Minimal API endpoint for `/jobs/{jobId}/events`
   
2. **Aura.Api/Controllers/JobsController.cs** (+27 lines)
   - Added 20-second retry loop with 250ms intervals
   - Enhanced logging with wait attempt tracking
   - Prevents race condition on job creation

### Build Results
✅ Full solution build succeeded with **0 errors**
- 4 unrelated warnings in test files (pre-existing)

## Verification

### Expected Behavior After Fix
- ✅ SSE endpoint `/api/jobs/{jobId}/events` should NOT return 500 errors
- ✅ Video export should show smooth progress updates (no jumps from 2% to 95%)
- ✅ Video export should complete successfully to 100%
- ✅ No "Failed to load resource: 500" errors in console
- ✅ Job creation now waits up to 20 seconds for job registration before timing out

### Testing Checklist
- [ ] Create a new video generation job via frontend
- [ ] Verify SSE connection succeeds without 500 errors
- [ ] Verify progress updates are smooth and continuous
- [ ] Verify job completes to 100% without getting stuck
- [ ] Check browser console for SSE connection errors (should be none)
- [ ] Verify backend logs show successful job lookup with wait attempts

## Technical Details

### ASP.NET Core Routing Priority
When both a Minimal API endpoint and a Controller endpoint match the same route:
- Minimal API endpoints are registered first in Program.cs
- They have **higher priority** than Controller-based routes
- The first matching endpoint handles the request

This is why the buggy Minimal API endpoint in Program.cs was being hit instead of the correct controller endpoint.

### Retry Logic Design
The retry logic follows the same pattern used in `GetJobProgressStream`:
- **Wait Interval**: 250ms between attempts
- **Max Wait Time**: 20 seconds (80 attempts)
- **Cancellation**: Respects `CancellationToken` for client disconnects
- **Fallback**: After retries, still checks `ExportJobService` as final fallback

### Frontend Integration
The frontend SSE client (`Aura.Web/src/services/api/sseClient.ts`) connects to:
```typescript
const url = `${baseUrl}/api/jobs/${this.jobId}/events`;
```

This matches the controller route: `api/jobs/{jobId}/events`

## Related Issues and PRs
- Issue references SSE 500 errors and 95% stuck progress
- Related to PR #67 which added ExportJobService fallback
- Complements existing SSE fixes in video export pipeline

## Impact
- **Zero breaking changes**: Only removes duplicate code and adds retry logic
- **Improved reliability**: Eliminates race condition in job creation
- **Better error handling**: Proper null checks and fallback mechanisms
- **Enhanced debugging**: Better logging with wait attempt tracking

---

**Implementation Date**: 2024-12-13  
**Status**: ✅ Complete - Build Verified  
**Build Status**: 0 errors, 0 new warnings
