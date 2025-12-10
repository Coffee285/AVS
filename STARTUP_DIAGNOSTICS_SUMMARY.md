# Backend Startup Diagnostics Implementation

## Summary

This document describes the comprehensive diagnostic logging system added to identify and resolve backend startup timeout issues.

## Problem Statement

The application was experiencing startup hangs where:
- Backend showed "Starting Backend Server..." in logs
- Frontend timed out after 45 seconds waiting for backend
- Backend startup appeared to hang indefinitely
- No specific error messages were logged to identify the hanging component

## Solution: Comprehensive Startup Logging

We've added detailed timing and progress logging throughout the startup sequence to identify exactly where the application hangs during startup.

## Changes Made

### 1. Database Initialization Service (`Aura.Core/Services/DatabaseInitializationService.cs`)

**Enhanced with:**
- Step-by-step logging with timing for each database operation
- Detailed progress messages prefixed with `>>> DATABASE INIT:`
- Timing for each phase:
  - Path writability check
  - Database file existence check
  - Service scope creation
  - DbContext resolution
  - Migration application
  - WAL mode configuration
  - Integrity checks
- Command timeout (30 seconds) for PRAGMA integrity_check
- Total duration logging

**Log Pattern Example:**
```
>>> DATABASE INIT: Starting database initialization
>>> DATABASE INIT: Database path: C:\Users\...\Aura\aura.db
>>> DATABASE INIT: Step 1 - Checking path writability
>>> DATABASE INIT: Step 1 COMPLETE - Path writable: True (15ms)
>>> DATABASE INIT: Step 2 - Checking if database file exists
>>> DATABASE INIT: Step 2 COMPLETE - Database exists: True
>>> DATABASE INIT: Step 3 - Creating service scope
>>> DATABASE INIT: Step 3 COMPLETE - Scope created (2ms)
...
>>> DATABASE INIT: COMPLETED SUCCESSFULLY in 850ms
```

### 2. Program.cs Database Initialization Section

**Enhanced with:**
- 60-second timeout protection on database initialization
- Step-by-step logging for service resolution and initialization
- Thread ID logging
- Timing for each configuration step
- Detailed error logging with elapsed time

**Key Features:**
- Timeout enforcement using `Task.WhenAny` pattern
- Logs exact time when timeout occurs
- Application continues with degraded functionality if database init fails

**Log Pattern Example:**
```
=== PROGRAM.CS: Database Initialization Starting ===
>>> PROGRAM.CS: Thread ID: 1
>>> PROGRAM.CS: Step 1 - Resolving DatabaseInitializationService
>>> PROGRAM.CS: Step 1 COMPLETE - Service resolved in 5ms
>>> PROGRAM.CS: Step 2 - Calling InitializeAsync with 60 second timeout
>>> PROGRAM.CS: Step 2 COMPLETE - InitializeAsync returned in 850ms
>>> PROGRAM.CS: Step 3 - Initializing configuration system
>>> PROGRAM.CS: Step 3 COMPLETE - Configuration system initialized in 120ms
>>> PROGRAM.CS: Step 4 - Validating configuration persistence
>>> PROGRAM.CS: Step 4 COMPLETE - Configuration validated in 45ms
=== PROGRAM.CS: Database Initialization COMPLETE - Total time: 1020ms ===
```

### 3. StartupInitializationService (`Aura.Api/HostedServices/StartupInitializationService.cs`)

**Enhanced with:**
- Service-level entry/exit logging
- Thread and Process ID logging
- Per-step timing and status logging
- Enhanced error messages with timing
- Clear indication of critical vs non-critical failures

**Initialization Steps Tracked:**
1. Database Connectivity (10s timeout, non-critical)
2. Required Directories (10s timeout, critical)
3. FFmpeg Availability (10s timeout, non-critical)
4. AI Services (10s timeout, non-critical)

**Log Pattern Example:**
```
=== STARTUP INIT SERVICE: StartAsync ENTRY ===
>>> STARTUP INIT: Thread ID: 1, Process ID: 12345
>>> STARTUP INIT: Step 'Database Connectivity' STARTING (Critical: False, Timeout: 10s)
        >>> Creating scope for database connectivity check
        >>> Resolving AuraDbContext
        >>> Calling CanConnectAsync
        >>> CanConnectAsync returned: True
>>> STARTUP INIT: Step 'Database Connectivity' COMPLETED successfully in 245ms
...
=== STARTUP INIT SERVICE: COMPLETE ===
>>> STARTUP INIT: Total time: 1234ms, Successful: 4/4
=== STARTUP INIT SERVICE: StartAsync EXIT ===
```

### 4. StartupDiagnosticsService (`Aura.Api/HostedServices/StartupDiagnosticsService.cs`)

**Enhanced with:**
- Total service timing
- Thread and Process ID
- FFmpeg check timing
- Entry/exit markers

**Log Pattern Example:**
```
=== STARTUP DIAGNOSTICS SERVICE: StartAsync ENTRY ===
>>> DIAGNOSTICS: Environment: Production
>>> DIAGNOSTICS: .NET Version: 8.0.0
>>> DIAGNOSTICS: Thread ID: 1, Process ID: 12345
>>> DIAGNOSTICS: Checking FFmpeg availability
>>> DIAGNOSTICS: FFmpeg available at ffmpeg (checked in 125ms)
=== STARTUP DIAGNOSTICS SERVICE: StartAsync EXIT - Total time: 180ms ===
```

### 5. SystemPromptInitializer (`Aura.Api/HostedServices/SystemPromptInitializer.cs`)

**Enhanced with:**
- Per-template timing for database lookups and creation
- Total initialization time
- Clear progress indicators

**Log Pattern Example:**
```
=== SYSTEM PROMPT INITIALIZER: StartAsync ENTRY ===
>>> PROMPT INIT: Creating system templates
>>> PROMPT INIT: Created 5 system templates
>>> PROMPT INIT: Checking for existing template: Default Script Generator
>>> PROMPT INIT: Template already exists: Default Script Generator (check took 45ms)
...
=== SYSTEM PROMPT INITIALIZER: COMPLETE - Total time: 320ms, Templates: 5 ===
```

### 6. OllamaDetectionService (`Aura.Core/Services/Providers/OllamaDetectionService.cs`)

**Enhanced with:**
- Entry/exit timing
- Background task status logging
- Timer setup confirmation

**Log Pattern Example:**
```
=== OLLAMA DETECTION SERVICE: StartAsync ENTRY ===
>>> OLLAMA DETECT: Starting background detection (fire-and-forget)
>>> OLLAMA DETECT: Setting up periodic refresh timer (interval: 15s)
=== OLLAMA DETECTION SERVICE: StartAsync EXIT - 5ms (non-blocking) ===
```

## Diagnostic Log Markers

All diagnostic logs use consistent prefixes for easy searching:

- `=== SERVICE NAME: ===` - Major service boundaries
- `>>> SERVICE:` - High-level steps within a service
- `    >>>` - Sub-steps or detailed operations

## Benefits

1. **Precise Identification**: Logs show exactly which step is hanging with millisecond precision
2. **Timeout Protection**: 60-second timeout on database initialization prevents infinite hangs
3. **Non-Blocking Confirmation**: Services that run in background clearly log they're non-blocking
4. **Thread Tracking**: Thread and Process IDs help identify deadlocks
5. **Performance Baseline**: Normal startup times are now measurable for comparison

## Expected Startup Sequence

With healthy system, logs should show:

```
=== STARTUP DIAGNOSTICS SERVICE: StartAsync ENTRY ===
    (150-200ms)
=== STARTUP DIAGNOSTICS SERVICE: StartAsync EXIT - Total time: ~180ms ===

=== STARTUP INIT SERVICE: StartAsync ENTRY ===
    (1000-2000ms for all 4 steps)
=== STARTUP INIT SERVICE: StartAsync EXIT ===

=== PROGRAM.CS: Database Initialization Starting ===
    (500-1500ms depending on migrations)
=== PROGRAM.CS: Database Initialization COMPLETE - Total time: ~1000ms ===

=== SYSTEM PROMPT INITIALIZER: StartAsync ENTRY ===
    (200-500ms)
=== SYSTEM PROMPT INITIALIZER: COMPLETE - Total time: ~320ms ===

=== OLLAMA DETECTION SERVICE: StartAsync ENTRY ===
    (5-10ms, non-blocking)
=== OLLAMA DETECTION SERVICE: StartAsync EXIT - ~5ms (non-blocking) ===

Application started. Press Ctrl+C to shut down.
```

**Total Expected Startup Time**: 2-4 seconds for all critical services

## Troubleshooting Guide

### If Startup Hangs

1. **Check last log message** - This is where the hang occurred
2. **Look for timing** - If a step shows "STARTING" but no "COMPLETE", that's the culprit
3. **Check for timeout messages** - Database timeout after 60s indicates database lock/corruption

### Common Issues Identified

- **Database hang**: `>>> DATABASE INIT: Step X` never completes
  - **Solution**: Delete database file and restart
  
- **Database timeout**: `>>> PROGRAM.CS: DATABASE INITIALIZATION TIMED OUT after 60000ms`
  - **Solution**: Database file is locked or corrupted
  
- **Hosted service hang**: Service shows "ENTRY" but never "EXIT"
  - **Solution**: Check thread dumps, look for deadlocks

### Log Search Commands

```bash
# Find where startup hung (last log before silence)
grep ">>>" logs/aura-*.log | tail -20

# Check database initialization timing
grep "DATABASE INIT" logs/aura-*.log

# Check all service timings
grep "Total time:" logs/aura-*.log

# Find timeout errors
grep "TIMED OUT" logs/aura-*.log
```

## Testing Performed

- ✅ Build verification (Release configuration)
- ✅ No compilation errors or warnings
- ✅ Logging follows project conventions (structured logging with Serilog)
- ✅ All timeout protections in place
- ✅ Non-blocking services confirmed

## Files Modified

1. `Aura.Core/Services/DatabaseInitializationService.cs`
2. `Aura.Api/Program.cs`
3. `Aura.Api/HostedServices/StartupInitializationService.cs`
4. `Aura.Api/HostedServices/StartupDiagnosticsService.cs`
5. `Aura.Api/HostedServices/SystemPromptInitializer.cs`
6. `Aura.Core/Services/Providers/OllamaDetectionService.cs`

## Next Steps for Users

1. **Clear existing state** (if fresh start needed):
   ```bash
   # Windows
   rmdir /s /q %LOCALAPPDATA%\Aura
   
   # Linux/Mac
   rm -rf ~/.local/share/Aura
   ```

2. **Start the backend**:
   ```bash
   dotnet run --project Aura.Api
   ```

3. **Monitor logs** for the diagnostic messages

4. **Expected outcome**:
   - All services complete within 2-4 seconds
   - "Application started. Press Ctrl+C to shut down." appears
   - No timeout errors
   - Frontend connects successfully

5. **If timeout occurs**:
   - Check the last log message (indicates hang location)
   - Report the specific step that timed out
   - Include full logs for analysis

## Conclusion

This comprehensive diagnostic system provides complete visibility into the startup sequence, allowing rapid identification of any hanging component. The timeout protection ensures the application won't hang indefinitely, and detailed logging pinpoints the exact cause of any startup issues.
