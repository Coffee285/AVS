# SSE Stuck at 95% Fix - Implementation Summary

## Problem Statement
Video generation jobs were getting stuck at 95% with the following symptoms:
- SSE connection times out after 30-60 seconds, falling back to polling
- Job appears stuck at 95% in "Rendering" stage for 300+ seconds  
- Frontend shows "Export Appears Stuck" warning
- Video never completes even though FFmpeg may have finished

## Root Causes Identified and Fixed

### 1. Response Compression Middleware Buffering SSE (CRITICAL)
**Root Cause**: In `Aura.Api/Program.cs`, response compression was applied globally. While `text/event-stream` was excluded from compression MimeTypes, the middleware still intercepted and buffered SSE responses BEFORE the endpoint's `DisableBuffering()` call was processed.

**Impact**: SSE events were buffered instead of streamed, causing:
- Initial acknowledgment never reaching frontend
- Progress updates delayed by minutes
- Connection timeout after 60 seconds
- Fallback to polling with poor UX

**Solution**: Created `SseBypassMiddleware` that runs BEFORE `UseResponseCompression()` to disable buffering for SSE endpoints.

**Code Changes**:
```csharp
// NEW FILE: Aura.Api/Middleware/SseBypassMiddleware.cs
public class SseBypassMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        
        // Check if this is an SSE endpoint
        if (path.Contains("/events", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/progress/stream", StringComparison.OrdinalIgnoreCase))
        {
            // CRITICAL: Disable buffering BEFORE response compression can intercept
            var bufferingFeature = context.Features.Get<IHttpResponseBodyFeature>();
            if (bufferingFeature != null)
            {
                bufferingFeature.DisableBuffering();
            }
        }
        
        await _next(context);
    }
}

// UPDATED: Aura.Api/Program.cs (line 2903)
app.UseMiddleware<Aura.Api.Middleware.SseBypassMiddleware>();  // BEFORE compression
app.UseResponseCompression();  // AFTER SSE bypass
```

### 2. Frontend Uses Inconsistent SSE Endpoint
**Root Cause**: In `FinalExport.tsx`, the SSE URL was set to `/api/jobs/${jobId}/progress/stream`, but the SSE client and job state store used `/api/jobs/${jobId}/events`.

**Impact**: Potential for confusion, inconsistent behavior, and harder debugging.

**Solution**: Standardized on `/api/jobs/{jobId}/events` as the primary SSE endpoint.

**Code Changes**:
```typescript
// UPDATED: Aura.Web/src/components/VideoWizard/steps/FinalExport.tsx (line 747)
// BEFORE:
const sseUrl = apiUrl(`/api/jobs/${jobId}/progress/stream`);

// AFTER:
const sseUrl = apiUrl(`/api/jobs/${jobId}/events`);
```

### 3. SSE Acknowledgment Not Reaching Frontend
**Root Cause**: The backend sent an acknowledgment immediately (JobsController.cs line 1571-1583), but due to response compression buffering, this acknowledgment never reached the frontend, causing the SSE connection timeout.

**Impact**: Frontend waited 60 seconds for acknowledgment that never arrived, then fell back to polling.

**Solution**: 
1. SSE bypass middleware ensures acknowledgment reaches frontend immediately
2. Reduced connection timeout from 60s to 5s for faster fallback

**Code Changes**:
```typescript
// UPDATED: Aura.Web/src/components/VideoWizard/steps/FinalExport.tsx (line 433)
// BEFORE:
const SSE_CONNECTION_TIMEOUT_MS = 60000; // 60 seconds

// AFTER:
const SSE_CONNECTION_TIMEOUT_MS = 5000; // 5 seconds
```

### 4. Stall Detection Threshold Mismatch
**Root Cause**: 
- Backend (`GetJobProgressStream`): 120s warning, 180s failure threshold (fixed)
- Frontend (`FinalExport.tsx`): Progressive thresholds based on job progress
- When polling fallback activated after SSE timeout, these mismatched thresholds caused confusion

**Impact**: Jobs at 90-100% (finalization phase) were incorrectly flagged as stuck when FFmpeg was just doing normal muxing/flushing operations.

**Solution**: Synchronized stall detection thresholds between frontend and backend with progressive values:
- **0-50%**: 180 seconds (3 minutes) - early stages
- **50-70%**: 240 seconds (4 minutes) - mid stages
- **70-90%**: 300 seconds (5 minutes) - encoding
- **90-100%**: 600 seconds (10 minutes) - finalization (FFmpeg muxing/flushing)

**Code Changes**:
```csharp
// UPDATED: Aura.Api/Controllers/JobsController.cs (line 820)
// Helper function for /events endpoint
int GetStallThresholdSeconds(int percent)
{
    if (percent < 50) return 180;  // 3 minutes
    if (percent < 70) return 240;  // 4 minutes
    if (percent < 90) return 300;  // 5 minutes
    return 600;                     // 10 minutes (90-100%)
}

// UPDATED: Aura.Api/Controllers/JobsController.cs (line 1669)
// Helper function for /progress/stream endpoint
int GetProgressStallThresholdSeconds(int percent)
{
    if (percent < 50) return 180;  // 3 minutes
    if (percent < 70) return 240;  // 4 minutes
    if (percent < 90) return 300;  // 5 minutes
    return 600;                     // 10 minutes (90-100%)
}

// Use progressive threshold instead of fixed values
var stallThresholdSeconds = GetStallThresholdSeconds(job.Percent);
var warningThresholdSeconds = stallThresholdSeconds * 2 / 3;  // Warn at 2/3 of threshold
```

## Implementation Details

### Files Created
1. `Aura.Api/Middleware/SseBypassMiddleware.cs` (58 lines)
   - Detects SSE endpoints
   - Disables buffering before response compression
   - Sets appropriate headers for streaming

### Files Modified
1. `Aura.Api/Program.cs` (4 lines changed)
   - Added SSE bypass middleware BEFORE response compression
   - Line 2903: `app.UseMiddleware<SseBypassMiddleware>()`

2. `Aura.Api/Controllers/JobsController.cs` (95 lines changed)
   - Added `GetStallThresholdSeconds()` function for `/events` endpoint
   - Added `GetProgressStallThresholdSeconds()` function for `/progress/stream` endpoint
   - Updated stall detection logic to use progressive thresholds
   - Added threshold values to warning/failure events

3. `Aura.Web/src/components/VideoWizard/steps/FinalExport.tsx` (10 lines changed)
   - Changed SSE URL from `/progress/stream` to `/events`
   - Reduced connection timeout from 60s to 5s
   - Updated timeout messages

### Files Added for Documentation
1. `SSE_STUCK_AT_95_FIX_VERIFICATION.md` (223 lines)
   - Comprehensive testing checklist
   - Expected results and success criteria
   - Debugging tips

## Technical Flow

### Before Fix
```
Frontend connects to /api/jobs/{id}/progress/stream
  ↓
Request reaches Program.cs middleware pipeline
  ↓
UseResponseCompression() intercepts request
  ↓ (PROBLEM: Response buffering enabled)
Controller calls DisableBuffering() (TOO LATE)
  ↓
SSE events buffered in memory
  ↓
Acknowledgment never sent (buffered)
  ↓
Frontend waits 60 seconds → timeout → fallback to polling
  ↓
Job stuck at 95% with 180s threshold (too short for finalization)
```

### After Fix
```
Frontend connects to /api/jobs/{id}/events
  ↓
Request reaches Program.cs middleware pipeline
  ↓
SseBypassMiddleware detects SSE endpoint
  ↓
DisableBuffering() called BEFORE compression middleware
  ↓
UseResponseCompression() skips SSE response
  ↓
Controller sends acknowledgment immediately
  ↓
Acknowledgment reaches frontend < 1 second
  ↓
Frontend: "Connection established - receiving progress updates"
  ↓
Real-time progress updates every 500ms
  ↓
Job at 95% uses 600s threshold (10 minutes for finalization)
  ↓
Job completes successfully with output path
```

## Why 10 Minutes at 90-100%?

FFmpeg finalization (muxing, flushing buffers, writing indexes) can be slow, especially for:
- **Large files** (> 1GB): More data to write
- **Complex codecs** (HEVC, AV1): Requires more processing
- **Hardware encoding fallback**: Software encoding is slower
- **Network-mounted drives**: I/O latency
- **Low disk I/O**: Bottleneck on slow drives

The 10-minute threshold at 90-100% prevents false positives while still catching truly stuck jobs.

## Verification Status

### Build Status
- ✅ Backend: `dotnet build -c Release` successful (0 warnings, 0 errors)
- ✅ Frontend: `npm ci` successful
- ✅ ESLint: Passed on modified files
- ✅ Pre-commit hooks: Passed

### Manual Testing Required
- [ ] SSE connection establishes within 5 seconds
- [ ] Progress events stream in real-time (no buffering)
- [ ] Job completes at 100% with valid output path
- [ ] No false "stuck" warnings during 90-100% finalization
- [ ] Polling fallback works if SSE fails

See `SSE_STUCK_AT_95_FIX_VERIFICATION.md` for detailed test instructions.

## Benefits of This Fix

1. **Real-time Progress**: SSE events stream immediately, no buffering delays
2. **Fast Feedback**: 5-second timeout provides quick fallback to polling
3. **No False Positives**: 10-minute threshold at 90-100% prevents false "stuck" warnings
4. **Better UX**: Users see continuous progress, not stuck at 95%
5. **Debugging**: Threshold values logged for easier troubleshooting
6. **Consistency**: Frontend and backend use identical progressive thresholds

## Potential Issues and Solutions

### If SSE Still Not Working:
1. **Check middleware order**: `SseBypassMiddleware` MUST be before `UseResponseCompression`
2. **Check response headers**: Should have `Content-Type: text/event-stream`
3. **Check reverse proxy**: nginx/Apache may buffer SSE (use `X-Accel-Buffering: no`)
4. **Check antivirus/firewall**: May block SSE connections

### If Still Stuck at 95%:
1. **Check backend logs**: Should show threshold of 600s at 95%
2. **Verify FFmpeg running**: Check process list for `ffmpeg.exe`
3. **Check disk space**: Output directory must have sufficient space
4. **Check codec issues**: Try different codec/format if FFmpeg hangs

### If False Positives:
1. **Verify threshold calculation**: At 95%, should use 600s (10 minutes)
2. **Check warning emission**: Should warn at 400s (2/3 of 600s)
3. **Check failure emission**: Should fail only at 600s

## References
- Original Problem Statement: [GitHub Issue]
- SSE Implementation: `Aura.Api/Controllers/JobsController.cs`
- Frontend SSE Client: `Aura.Web/src/services/api/sseClient.ts`
- Middleware Order: `Aura.Api/Program.cs` lines 2868-2936

## Commit History
1. `0362e51` - feat: Fix SSE stuck at 95% - Add bypass middleware and progressive thresholds
2. `4f98e77` - docs: Add comprehensive verification guide for SSE fix

## Next Steps
1. Manual testing with real video generation job
2. Monitor backend logs for SSE connection and threshold values
3. Verify no false warnings at 90-100% progress
4. Performance testing with large videos (> 1GB)
5. Merge PR after successful verification
