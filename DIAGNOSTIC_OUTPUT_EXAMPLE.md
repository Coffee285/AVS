# Diagnostic Output Example for 95% Stuck Issue

This document shows the expected diagnostic output when tracking the 95% stuck issue. All diagnostic messages include:
- Timestamp in `HH:mm:ss.fff` format (millisecond precision)
- Thread ID to detect threading issues
- `[DIAGNOSTIC]` prefix for easy filtering

## Expected Output Timeline

### Normal Flow (Job Completes Successfully)

```
Backend Console:
[DIAGNOSTIC] [15:48:45.120] [Thread 15] [Job abc123] UpdateJob called (95%)
[DIAGNOSTIC] [15:48:45.121] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=running, Percent=95, OutputPath=NULL
[DIAGNOSTIC] [15:48:45.121] [Thread 15] About to notify 1 subscriber(s)
[DIAGNOSTIC] [15:48:45.122] [Thread 15] Notified subscribers
[DIAGNOSTIC] [15:48:45.122] [Thread 15] SSE sending update: JobId=abc123, Status=running, Percent=95

[DIAGNOSTIC] [15:48:46.500] [Thread 15] [Job abc123] UpdateJob called (96%)
[DIAGNOSTIC] [15:48:47.800] [Thread 15] [Job abc123] UpdateJob called (97%)
[DIAGNOSTIC] [15:48:49.200] [Thread 15] [Job abc123] UpdateJob called (98%)
[DIAGNOSTIC] [15:48:50.500] [Thread 15] [Job abc123] UpdateJob called (99%)

[DIAGNOSTIC] [15:48:52.100] [Thread 15] [Job abc123] Orchestrator returned successfully, about to force completion
[DIAGNOSTIC] [15:48:52.101] [Thread 15] [Job abc123] UpdateJob called (100%)
[DIAGNOSTIC] [15:48:52.102] [Thread 15] [Job abc123] About to sync terminal state 'completed' to ExportJobService (100%)
[DIAGNOSTIC] [15:48:52.103] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=completed, Percent=100, OutputPath=/path/to/video.mp4
[DIAGNOSTIC] [15:48:52.103] [Thread 15] About to notify 1 subscriber(s)
[DIAGNOSTIC] [15:48:52.104] [Thread 15] Notified subscribers
[DIAGNOSTIC] [15:48:52.104] [Thread 15] SSE sending update: JobId=abc123, Status=completed, Percent=100
[DIAGNOSTIC] [15:48:52.105] [Thread 15] SSE closing stream for terminal state: completed
[DIAGNOSTIC] [15:48:52.106] [Thread 15] [Job abc123] Synced terminal state to ExportJobService (100%)
[DIAGNOSTIC] [15:48:52.107] [Thread 15] [Job abc123] Forced completion - job should be Done/100%

[DIAGNOSTIC] [15:48:52.200] [Thread 22] Polling request for job abc123: Status=Done, Percent=100, OutputPath=/path/to/video.mp4

Frontend Console:
[DIAGNOSTIC] [2025-12-13T15:48:45.122Z] SSE progress event received: {status: "running", percent: 95, stage: "Rendering", outputPath: null}
[DIAGNOSTIC] [2025-12-13T15:48:46.501Z] SSE progress event received: {status: "running", percent: 96, stage: "Rendering", outputPath: null}
[DIAGNOSTIC] [2025-12-13T15:48:52.105Z] SSE job-completed event received: {status: "completed", percent: 100, stage: "Complete", outputPath: "/path/to/video.mp4"}
```

---

### Bug Scenario 1: Job Never Reaches ExportJobService

```
Backend Console:
[DIAGNOSTIC] [15:48:45.120] [Thread 15] [Job abc123] UpdateJob called (95%)
[DIAGNOSTIC] [15:48:52.100] [Thread 15] [Job abc123] Orchestrator returned successfully, about to force completion
[DIAGNOSTIC] [15:48:52.101] [Thread 15] [Job abc123] UpdateJob called (100%)
[DIAGNOSTIC] [15:48:52.102] [Thread 15] [Job abc123] About to sync terminal state 'completed' to ExportJobService (100%)
[DIAGNOSTIC] [15:48:52.103] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=completed, Percent=100, OutputPath=/path/to/video.mp4
[DIAGNOSTIC] [15:48:52.103] [Thread 15] Job abc123 NOT FOUND in ExportJobService._jobs dictionary!  ← BUG FOUND!

Frontend Console:
[DIAGNOSTIC] [2025-12-13T15:48:45.122Z] SSE progress event received: {status: "running", percent: 95, stage: "Rendering", outputPath: null}
[Never receives 100% update because ExportJobService doesn't have the job]
```

---

### Bug Scenario 2: No SSE Subscribers

```
Backend Console:
[DIAGNOSTIC] [15:48:45.120] [Thread 15] [Job abc123] UpdateJob called (95%)
[DIAGNOSTIC] [15:48:45.121] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=running, Percent=95, OutputPath=NULL
[DIAGNOSTIC] [15:48:45.121] [Thread 15] About to notify 0 subscriber(s)  ← NO SUBSCRIBERS!
[DIAGNOSTIC] [15:48:45.122] [Thread 15] Notified subscribers

[DIAGNOSTIC] [15:48:52.100] [Thread 15] [Job abc123] Orchestrator returned successfully, about to force completion
[DIAGNOSTIC] [15:48:52.103] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=completed, Percent=100, OutputPath=/path/to/video.mp4
[DIAGNOSTIC] [15:48:52.103] [Thread 15] About to notify 0 subscriber(s)  ← STILL NO SUBSCRIBERS!

Frontend Console:
[SSE never connected or disconnected prematurely]
[Polling shows stuck at 95%]
```

---

### Bug Scenario 3: Threading/Race Condition

```
Backend Console:
[DIAGNOSTIC] [15:48:45.120] [Thread 15] [Job abc123] UpdateJob called (95%)
[DIAGNOSTIC] [15:48:52.100] [Thread 15] [Job abc123] Orchestrator returned successfully, about to force completion
[DIAGNOSTIC] [15:48:52.101] [Thread 15] [Job abc123] UpdateJob called (100%)
[DIAGNOSTIC] [15:48:52.102] [Thread 15] [Job abc123] About to sync terminal state 'completed' to ExportJobService (100%)
[DIAGNOSTIC] [15:48:52.103] [Thread 22] Polling request for job abc123: Status=Running, Percent=95, OutputPath=NULL  ← POLL SEES OLD STATE!
[DIAGNOSTIC] [15:48:52.104] [Thread 15] ExportJobService.UpdateJobStatusAsync called: JobId=abc123, Status=completed, Percent=100, OutputPath=/path/to/video.mp4
[DIAGNOSTIC] [15:48:52.300] [Thread 23] Polling request for job abc123: Status=Done, Percent=100, OutputPath=/path/to/video.mp4  ← NOW IT SEES IT
```

---

## How to Analyze the Logs

1. **Set backend logging to Warning level** in `appsettings.json`:
   ```json
   "Logging": {
     "LogLevel": {
       "Default": "Warning"
     }
   }
   ```

2. **Reproduce the 95% stuck issue** by creating and exporting a video

3. **Search for diagnostic messages**:
   - Backend: Search for `[DIAGNOSTIC]` in console or log files
   - Frontend: Open browser DevTools Console (F12) and search for `[DIAGNOSTIC]`

4. **Analyze the timeline**:
   - Check if job reaches 100% in JobRunner
   - Check if ExportJobService receives the 100% update
   - Check if ExportJobService has subscribers
   - Check if SSE sends the completion event
   - Check if polling sees the completed state
   - Look for thread ID patterns (different threads might indicate race conditions)

5. **Compare timestamps** to identify bottlenecks:
   - Large gaps between events indicate where the delay occurs
   - Thread ID mismatches might indicate synchronization issues

## Common Issues to Look For

1. **Job not found**: `Job {JobId} NOT FOUND in ExportJobService._jobs dictionary!`
   - Cause: Job was never registered in ExportJobService
   - Fix: Ensure CreateJobAsync is called when job is created

2. **No subscribers**: `About to notify 0 subscriber(s)`
   - Cause: SSE never connected or disconnected prematurely
   - Fix: Check SSE connection establishment and keep-alive

3. **Race condition**: Thread IDs change rapidly around critical sections
   - Cause: Multiple threads updating job state simultaneously
   - Fix: Add proper locking or use synchronous updates

4. **Stuck at orchestrator**: Gap between UpdateJob(95%) and "Orchestrator returned"
   - Cause: FFmpeg render hanging or slow finalization
   - Fix: Investigate FFmpeg process and timeout settings

5. **Polling sees stale data**: Polling shows old state after UpdateJob(100%)
   - Cause: State not properly synchronized to ExportJobService
   - Fix: Verify synchronous update and state persistence
