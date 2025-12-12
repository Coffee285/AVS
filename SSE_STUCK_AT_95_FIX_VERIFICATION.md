# SSE Stuck at 95% Fix - Verification Guide

## Problem Fixed
Video generation jobs were getting stuck at 95% due to response compression middleware buffering SSE events, preventing real-time progress updates from reaching the frontend.

## Root Causes Addressed

### 1. ✅ Response Compression Buffering SSE Events
**Problem**: Response compression middleware intercepted SSE responses even though `text/event-stream` was excluded from compression MimeTypes. The middleware still buffered responses before the controller's `DisableBuffering()` call.

**Solution**: Created `SseBypassMiddleware` that runs BEFORE `UseResponseCompression()` and disables buffering for SSE endpoints.

**Verification**:
- Check middleware order in `Aura.Api/Program.cs` lines 2903-2907
- Middleware order: `UseMiddleware<SseBypassMiddleware>()` → `UseResponseCompression()`
- Log output should show: `[Debug] SSE endpoint detected: /api/jobs/{id}/events - disabling buffering`

### 2. ✅ Frontend Using Inconsistent SSE Endpoint
**Problem**: `FinalExport.tsx` used `/api/jobs/{id}/progress/stream` while job state store used `/api/jobs/{id}/events`

**Solution**: Standardized frontend to use `/events` endpoint exclusively

**Verification**:
- Check `FinalExport.tsx` line 747: `const sseUrl = apiUrl(\`/api/jobs/${jobId}/events\`);`
- Browser DevTools Network tab should show connection to `/api/jobs/{id}/events`
- No requests to `/api/jobs/{id}/progress/stream` from FinalExport component

### 3. ✅ SSE Acknowledgment Not Reaching Frontend
**Problem**: Backend sent acknowledgment immediately, but response compression buffering prevented it from reaching frontend within 60 seconds

**Solution**: 
- SSE bypass middleware ensures acknowledgment reaches frontend immediately
- Reduced timeout from 60s to 5s for faster fallback

**Verification**:
- Console should show `[SSE] Connection established - receiving progress updates` within 5 seconds
- If not, should show `[FinalExport] SSE acknowledgment not received within 5s, falling back to polling`
- Check browser DevTools Console for SSE connection messages

### 4. ✅ Stall Detection Threshold Mismatch
**Problem**: Backend used 120s/180s thresholds while frontend used progressive thresholds, causing confusion during 90-100% finalization

**Solution**: Synchronized progressive thresholds between backend and frontend:
- 0-50%: 180 seconds (3 minutes)
- 50-70%: 240 seconds (4 minutes)
- 70-90%: 300 seconds (5 minutes)
- 90-100%: 600 seconds (10 minutes) ← CRITICAL for finalization

**Verification**:
- Check `JobsController.cs` line 820: `GetStallThresholdSeconds()` function
- Check `JobsController.cs` line 1669: `GetProgressStallThresholdSeconds()` function
- Check `FinalExport.tsx` line 1098: `getStuckThreshold()` function in `fallbackToPolling`
- At 95%, should NOT emit stuck warning for 10 minutes (600 seconds)
- Logs should show: `no progress for Xs (threshold: 600s)` at 90%+

## Testing Checklist

### Pre-Test: Verify Build
```bash
# Backend
cd Aura.Api
dotnet build -c Release
# Should succeed with 0 warnings, 0 errors

# Frontend
cd ../Aura.Web
npm ci
npm run typecheck
# May have warnings in unrelated files, but FinalExport.tsx should be clean
```

### Test 1: SSE Connection Establishes Quickly (< 5 seconds)
**Steps**:
1. Start backend: `dotnet run --project Aura.Api`
2. Start frontend: `cd Aura.Web && npm run dev`
3. Navigate to video wizard and start a video generation job
4. Open Browser DevTools → Console

**Expected Results**:
- Within 5 seconds: `[SSE] Connection established - receiving progress updates`
- NO message: `SSE connection not established after 60000ms`
- Backend logs: `[Debug] SSE endpoint detected: /api/jobs/{id}/events`

**Pass Criteria**: SSE connection established within 5 seconds

---

### Test 2: Progress Events Stream in Real-Time
**Steps**:
1. Start a video generation job
2. Monitor Browser DevTools → Console
3. Watch for progress updates

**Expected Results**:
- Progress updates appear every 1-2 seconds: `[SSE] Progress update: 15% Brief`
- NO long gaps (> 10 seconds) between updates
- Progress goes smoothly: 0% → 20% → 40% → 60% → 80% → 95% → 100%

**Pass Criteria**: Continuous progress updates with no buffering delays

---

### Test 3: Job Completes at 100% with Output Path
**Steps**:
1. Start a video generation job
2. Wait for completion (or monitor existing job)
3. Check final SSE event

**Expected Results**:
- Console shows: `[SSE] Job completed: {status: "completed", outputPath: "..."}`
- Output path is NOT null/undefined
- Job reaches 100% before completion event
- Download button appears with valid video file

**Pass Criteria**: Job completes with valid output path at 100%

---

### Test 4: No False "Export Appears Stuck" Warnings at 90-100%
**Steps**:
1. Start a video generation job
2. Monitor progress at 90-95% range
3. Wait up to 10 minutes at 95%

**Expected Results**:
- At 95%, NO warning for first 10 minutes (600 seconds)
- If stuck for > 400 seconds (2/3 of 600s): Warning appears but job continues
- If stuck for > 600 seconds: Job marked as failed
- Backend logs show: `threshold: 600s` for jobs at 90%+

**Pass Criteria**: No false positives during normal finalization (FFmpeg muxing)

---

### Test 5: Polling Fallback Works if SSE Fails
**Steps**:
1. Simulate SSE failure (disable SSE in browser or block endpoint)
2. Start a video generation job

**Expected Results**:
- After 5 seconds: `SSE acknowledgment not received within 5s, falling back to polling`
- Job continues via HTTP polling
- Progress updates still appear (via polling instead of SSE)
- Job completes successfully

**Pass Criteria**: Graceful fallback to polling when SSE unavailable

---

## Success Indicators

### Backend Logs Should Show:
```
[Debug] SSE endpoint detected: /api/jobs/{id}/events - disabling buffering
[Info] SSE stream requested for job {id}, reconnect=false, lastEventId=none
[Info] Job {id} appears stalled at 95% (stage: Rendering) - no progress for 420s (threshold: 600s)
```

### Frontend Console Should Show:
```
[FinalExport] Connecting to SSE: http://localhost:5005/api/jobs/{id}/events
[SSE] Connection established - receiving progress updates
[SSE] Progress update: 95% Rendering
[SSE] Job completed: {status: "completed", outputPath: "/path/to/video.mp4"}
```

### Browser DevTools Network Tab:
- Request to `/api/jobs/{id}/events` with type `eventsource`
- Response type: `text/event-stream`
- No buffering delay (events appear in real-time)

## Files Modified

1. **NEW**: `Aura.Api/Middleware/SseBypassMiddleware.cs` - SSE buffering bypass
2. **UPDATED**: `Aura.Api/Program.cs` - Middleware order (line 2903)
3. **UPDATED**: `Aura.Api/Controllers/JobsController.cs` - Progressive thresholds (lines 820, 1669)
4. **UPDATED**: `Aura.Web/src/components/VideoWizard/steps/FinalExport.tsx` - Endpoint URL, 5s timeout (lines 433, 747)

## Debugging Tips

### If SSE Still Not Working:
1. Check middleware order in Program.cs - SseBypassMiddleware MUST be before UseResponseCompression
2. Check response headers in DevTools - should have `Content-Type: text/event-stream`
3. Check for buffering in nginx/reverse proxy (if applicable)
4. Verify no antivirus/firewall blocking SSE connections

### If Still Stuck at 95%:
1. Check backend logs for stall threshold (should be 600s at 95%)
2. Verify FFmpeg is actually running (check process list)
3. Check disk space for output directory
4. Verify no codec/format issues causing FFmpeg to hang

### If False Positives at 95%:
1. Verify threshold calculation: at 95%, should use 600s threshold
2. Check warning emission: should warn at 400s (2/3 of 600s)
3. Verify failure emission: should fail at 600s only

## Related Issues
- Video Export 95% Stuck Issue (root cause analysis)
- SSE Progress Tracking (original SSE implementation)
- Progressive Thresholds (frontend implementation)

## Additional Notes

**Why 10 minutes at 90-100%?**
FFmpeg finalization (muxing, flushing buffers, writing indexes) can be slow, especially for:
- Large files (> 1GB)
- Complex codecs (HEVC, AV1)
- Hardware encoding fallback to software
- Network-mounted drives
- Low disk I/O

**Why 5-second SSE timeout?**
- SSE acknowledgment should be immediate (< 1 second in normal conditions)
- 5 seconds allows for network latency and server load
- Faster fallback to polling reduces user wait time
- Previous 60-second timeout was too long, causing poor UX

**Why progressive thresholds?**
- Early stages (0-50%) complete quickly, 3 minutes is generous
- Mid stages (50-70%) involve TTS/images, 4 minutes reasonable
- Encoding (70-90%) is CPU/GPU intensive, 5 minutes necessary
- Finalization (90-100%) can be unpredictable, 10 minutes safe
