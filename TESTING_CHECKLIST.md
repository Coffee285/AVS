# Video Export Fix - Testing Checklist

## Pre-Testing Setup

- [ ] Pull the latest changes from `copilot/fix-video-export-stuck-issue` branch
- [ ] Rebuild the solution: `dotnet build -c Release`
- [ ] Verify build succeeds with 0 errors
- [ ] Start the backend API server
- [ ] Start the frontend development server

## Basic Functionality Test

### Test 1: Standard Video Generation (1080p, 60 seconds)

- [ ] Navigate to video creation wizard
- [ ] Enter topic: "Introduction to AI"
- [ ] Set duration: 60 seconds
- [ ] Select resolution: 1080p (1920x1080)
- [ ] Select frame rate: 30 fps
- [ ] Click "Generate Video"

**Expected Results:**
- [ ] Job starts and shows "Queued" → "Running"
- [ ] Progress updates smoothly from 0% to 100%
- [ ] Progress reaches 95% during rendering phase
- [ ] **CRITICAL**: Progress continues past 95% to 100%
- [ ] No "Export Appears Stuck" warning appears
- [ ] Job status transitions to "completed" within 3 minutes of reaching 95%
- [ ] "Export Complete" message is displayed
- [ ] Download button becomes available
- [ ] Video file downloads successfully
- [ ] Video plays correctly in media player

**Logs to Check:**
```
✅ [JobId={JobId}] Progress reported as 100%, render finalized
✅ Render verified and finalized: {Path} ({MB} MB)
Job {JobId} completed successfully. Output: {OutputPath}
```

## Edge Case Tests

### Test 2: Short Video (10 seconds)

- [ ] Create video with 10-second duration
- [ ] Same settings as Test 1 otherwise
- [ ] Verify completes without stuck warnings
- [ ] Verify progress reaches 100%
- [ ] Verify download works

### Test 3: Long Video (5 minutes)

- [ ] Create video with 5-minute duration
- [ ] Monitor finalization phase (95-100%)
- [ ] Verify adequate time given (up to 3 minutes at 95%+)
- [ ] Verify no timeout occurs
- [ ] Verify completion and download

### Test 4: High Resolution (4K)

- [ ] Create video at 3840x2160 (4K)
- [ ] Duration: 30 seconds
- [ ] Monitor finalization time
- [ ] Verify no stuck detection triggered
- [ ] Verify completion

### Test 5: Complex Video (Subtitles + Transitions)

- [ ] Enable subtitle burn-in
- [ ] Include multiple scenes with transitions
- [ ] Monitor finalization phase
- [ ] Verify extended muxing time is tolerated
- [ ] Verify completion

## Negative Tests

### Test 6: Verify Stuck Detection Still Works

- [ ] Intentionally interrupt FFmpeg process (if possible)
- [ ] OR wait for stuck detection at early stage (< 90%)
- [ ] Verify stuck detection activates after 120s at < 90%
- [ ] Verify stuck detection activates after 180s at 90%+

## Progress Monitoring Tests

### Test 7: Monitor SSE Events

- [ ] Open browser developer tools → Network tab
- [ ] Start video generation
- [ ] Find SSE connection to `/api/jobs/{id}/events`
- [ ] Verify events received:
  - `step-progress` events throughout render
  - `step-status` events for stage transitions
  - **CRITICAL**: `job-completed` event when 100% reached
- [ ] Verify final event has `progress: 100` and `status: "completed"`

### Test 8: Monitor API Polling

- [ ] Disable SSE in frontend (if possible) or monitor polling fallback
- [ ] Generate video
- [ ] Monitor GET `/api/jobs/{id}` requests
- [ ] Verify final response shows:
  ```json
  {
    "status": "completed",
    "percent": 100,
    "outputPath": "/path/to/video.mp4"
  }
  ```

## Backend Log Verification

### Critical Logs to Find

Search backend logs for these patterns:

**Progress Reporting:**
```
[JobId={id}] Progress reported as 100%, render finalized
```

**File Verification:**
```
Render verified and finalized: {path} ({MB} MB)
```

**Job Completion:**
```
Job {id} completed successfully. Output: {path}
```

**No Stuck Warnings (at 95%+):**
```
Should NOT see: "Job appears stuck: Rendering at 95% for 73s"
```

**Finalization Phase:**
```
FFmpeg HEARTBEAT: JobId={id}, Progress=95%+
FFmpeg HEARTBEAT: JobId={id}, Progress=100%
```

## Frontend Verification

### UI Elements to Check

- [ ] Progress bar fills completely (100%)
- [ ] Status text shows "Export Complete" or "Completed"
- [ ] Download button is enabled and clickable
- [ ] No error messages displayed
- [ ] No timeout warnings displayed
- [ ] Video thumbnail shown (if applicable)

### Console Verification

Open browser console and verify:

- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] SSE connection established (or polling active)
- [ ] Final progress event received with 100%
- [ ] Job status updated to "completed"

## Performance Metrics

Record these metrics for comparison:

| Test | Resolution | Duration | Time at 95% | Total Time | Success? |
|------|-----------|----------|-------------|------------|----------|
| 1    | 1080p     | 60s      | ___s        | ___s       | ☐        |
| 2    | 720p      | 10s      | ___s        | ___s       | ☐        |
| 3    | 1080p     | 5min     | ___s        | ___s       | ☐        |
| 4    | 4K        | 30s      | ___s        | ___s       | ☐        |
| 5    | 1080p+sub | 60s      | ___s        | ___s       | ☐        |

**Expected Metrics:**
- Time at 95%: 10-180 seconds (depending on complexity)
- No stuck warnings at 95%+
- All tests complete successfully

## Success Criteria

✅ **Fix is successful if:**

1. **All 8 tests pass** without stuck warnings
2. **Progress reaches 100%** in all tests
3. **Jobs complete** with status "completed"
4. **Videos download** and play correctly
5. **No false positives** in stuck detection
6. **Finalization time** < 3 minutes for standard videos
7. **Logs confirm** 100% progress reported
8. **Frontend displays** completion correctly

❌ **Fix has issues if:**

1. Any test fails to reach 100%
2. Stuck warnings appear during finalization (95%+)
3. Jobs timeout after 3 minutes at 95%+
4. Download button doesn't appear
5. Videos are corrupted or incomplete
6. Logs don't show 100% progress

## Reporting Results

When reporting test results, include:

1. **Test Summary**: How many tests passed/failed
2. **Specific Failures**: Which tests failed and why
3. **Log Excerpts**: Key log messages from failed tests
4. **Timing Data**: Actual time spent in finalization
5. **Browser/OS**: Environment information
6. **Video Files**: Links to generated videos (if possible)

## Rollback Plan

If issues are found:

1. Document the specific failure
2. Check logs for error messages
3. Revert to previous commit: `git checkout main`
4. Report issues in PR comments with test results
5. Wait for updated fix

## Notes

- **Finalization Time**: 10-180 seconds is normal for 95-100%
- **FFmpeg Operations**: Muxing, packet flushing, trailer writing occur at end
- **No Progress Updates**: Normal during finalization, not a hang
- **Threshold Changes**: 180s timeout at 90%+ (was 120s), 120s in FFmpeg monitor (was 45s)
