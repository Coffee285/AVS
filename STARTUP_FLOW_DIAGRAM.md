# Backend Startup Flow with Diagnostic Logging

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION STARTUP SEQUENCE                         │
│                     (With Diagnostic Logging)                            │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: STARTUP DIAGNOSTICS SERVICE (Non-Blocking)
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ === STARTUP DIAGNOSTICS SERVICE: StartAsync ENTRY ===               │
  │ >>> DIAGNOSTICS: Environment, .NET Version, OS, Machine             │
  │ >>> DIAGNOSTICS: Thread ID: X, Process ID: Y                        │
  │ >>> DIAGNOSTICS: Checking FFmpeg availability                       │
  │ >>> DIAGNOSTICS: FFmpeg available (checked in 125ms)                │
  │ === STARTUP DIAGNOSTICS SERVICE: StartAsync EXIT - 180ms ===        │
  └─────────────────────────────────────────────────────────────────────┘
  ⏱️  Expected: 150-200ms
  ⚠️  If hangs here: Check FFmpeg path or process spawn issues


Step 2: STARTUP INITIALIZATION SERVICE (Blocking - Critical)
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ === STARTUP INIT SERVICE: StartAsync ENTRY ===                      │
  │ >>> STARTUP INIT: Thread ID: X, Process ID: Y                       │
  │                                                                      │
  │ ┌──────────────────────────────────────────────────────────────┐  │
  │ │ Step 1: Database Connectivity (Timeout: 10s, Non-Critical)   │  │
  │ │     >>> Creating scope for database connectivity check        │  │
  │ │     >>> Resolving AuraDbContext                               │  │
  │ │     >>> Calling CanConnectAsync                               │  │
  │ │     >>> CanConnectAsync returned: True                        │  │
  │ │ >>> Step 'Database Connectivity' COMPLETED in 245ms           │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │ ┌──────────────────────────────────────────────────────────────┐  │
  │ │ Step 2: Required Directories (Timeout: 10s, CRITICAL)        │  │
  │ │     >>> Resolving ProviderSettings                            │  │
  │ │     >>> Getting directory paths                               │  │
  │ │     >>> Creating directories if they don't exist              │  │
  │ │     >>> All required directories verified                     │  │
  │ │ >>> Step 'Required Directories' COMPLETED in 25ms             │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │ ┌──────────────────────────────────────────────────────────────┐  │
  │ │ Step 3: FFmpeg Availability (Timeout: 10s, Non-Critical)     │  │
  │ │     >>> Resolving IFfmpegLocator                              │  │
  │ │     >>> Calling GetEffectiveFfmpegPathAsync                   │  │
  │ │     >>> FFmpeg path: C:\ffmpeg\bin\ffmpeg.exe                 │  │
  │ │ >>> Step 'FFmpeg Availability' COMPLETED in 120ms             │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │ ┌──────────────────────────────────────────────────────────────┐  │
  │ │ Step 4: AI Services (Timeout: 10s, Non-Critical)             │  │
  │ │     >>> Checking if ILlmProvider is available                 │  │
  │ │     >>> ILlmProvider available: True                          │  │
  │ │ >>> Step 'AI Services' COMPLETED in 15ms                      │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │ === STARTUP INIT SERVICE: COMPLETE ===                              │
  │ >>> STARTUP INIT: Total time: 405ms, Successful: 4/4               │
  │ === STARTUP INIT SERVICE: StartAsync EXIT ===                       │
  └─────────────────────────────────────────────────────────────────────┘
  ⏱️  Expected: 400-800ms
  ⚠️  If hangs here: Check last step message - that's where it hung


Step 3: DATABASE INITIALIZATION (Blocking - Critical)
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ === PROGRAM.CS: Database Initialization Starting ===                │
  │ >>> PROGRAM.CS: Thread ID: X                                        │
  │                                                                      │
  │ >>> PROGRAM.CS: Step 1 - Resolving DatabaseInitializationService   │
  │ >>> PROGRAM.CS: Step 1 COMPLETE - Service resolved in 5ms          │
  │                                                                      │
  │ >>> PROGRAM.CS: Step 2 - Calling InitializeAsync (60s timeout)     │
  │                                                                      │
  │ ┌──────────────────────────────────────────────────────────────┐  │
  │ │ >>> DATABASE INIT: Starting database initialization          │  │
  │ │ >>> DATABASE INIT: Database path: ...\Aura\aura.db           │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 1 - Checking path writability        │  │
  │ │ >>> DATABASE INIT: Step 1 COMPLETE - Path writable (15ms)    │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 2 - Checking if database exists      │  │
  │ │ >>> DATABASE INIT: Step 2 COMPLETE - Database exists: True   │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 3 - Creating service scope           │  │
  │ │ >>> DATABASE INIT: Step 3 COMPLETE - Scope created (2ms)     │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 4 - Resolving AuraDbContext          │  │
  │ │ >>> DATABASE INIT: Step 4 COMPLETE - Context resolved (1ms)  │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 5 - Applying migrations              │  │
  │ │     >>> Checking for pending migrations...                    │  │
  │ │     >>> Pending migrations check completed in 45ms - Found 0  │  │
  │ │     >>> No pending migrations to apply                        │  │
  │ │ >>> DATABASE INIT: Step 5 COMPLETE - Migrations applied (45ms)│ │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 6 - Configuring WAL mode             │  │
  │ │     >>> Configuring PRAGMA journal_mode=WAL                   │  │
  │ │     >>> Configuring PRAGMA synchronous=NORMAL                 │  │
  │ │     >>> Configuring PRAGMA page_size=4096                     │  │
  │ │     >>> Configuring PRAGMA cache_size=-64000                  │  │
  │ │     >>> Configuring PRAGMA temp_store=MEMORY                  │  │
  │ │     >>> Configuring PRAGMA locking_mode=NORMAL                │  │
  │ │     >>> SQLite settings configured in 120ms                   │  │
  │ │ >>> DATABASE INIT: Step 6 COMPLETE - WAL mode enabled (120ms)│  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: Step 7 - Checking database integrity      │  │
  │ │     >>> Opening database connection for integrity check       │  │
  │ │     >>> Connection opened, executing PRAGMA integrity_check   │  │
  │ │     >>> Database integrity check PASSED in 250ms              │  │
  │ │ >>> DATABASE INIT: Step 7 COMPLETE - Integrity check (250ms) │  │
  │ │                                                               │  │
  │ │ >>> DATABASE INIT: COMPLETED SUCCESSFULLY in 850ms            │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │ >>> PROGRAM.CS: Step 2 COMPLETE - InitializeAsync returned in 850ms│
  │                                                                      │
  │ >>> PROGRAM.CS: Step 3 - Initializing configuration system         │
  │ >>> PROGRAM.CS: Step 3 COMPLETE - Configuration initialized (120ms)│
  │                                                                      │
  │ >>> PROGRAM.CS: Step 4 - Validating configuration persistence      │
  │     >>> Loading user settings                                       │
  │     >>> Settings loaded in 30ms                                     │
  │     >>> User settings loaded and validated successfully             │
  │ >>> PROGRAM.CS: Step 4 COMPLETE - Configuration validated (45ms)   │
  │                                                                      │
  │ === PROGRAM.CS: Database Initialization COMPLETE - 1020ms ===       │
  └─────────────────────────────────────────────────────────────────────┘
  ⏱️  Expected: 500-1500ms (varies with migrations)
  ⚠️  If hangs here: Check last DATABASE INIT step - likely DB lock/corruption
  🚨 TIMEOUT: If exceeds 60 seconds, logs error and continues with degraded mode


Step 4: SYSTEM PROMPT INITIALIZER (Blocking)
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ === SYSTEM PROMPT INITIALIZER: StartAsync ENTRY ===                 │
  │ >>> PROMPT INIT: Creating system templates                          │
  │ >>> PROMPT INIT: Created 5 system templates                         │
  │ >>> PROMPT INIT: Checking for existing template: Default Script Gen │
  │ >>> PROMPT INIT: Template already exists (check took 45ms)          │
  │ ... (4 more templates) ...                                          │
  │ === SYSTEM PROMPT INITIALIZER: COMPLETE - 320ms, Templates: 5 ===   │
  └─────────────────────────────────────────────────────────────────────┘
  ⏱️  Expected: 200-500ms
  ⚠️  If hangs here: Database issue - check DB connection/locks


Step 5: BACKGROUND SERVICES (Non-Blocking)
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ === OLLAMA DETECTION SERVICE: StartAsync ENTRY ===                  │
  │ >>> OLLAMA DETECT: Starting background detection (fire-and-forget)  │
  │ >>> OLLAMA DETECT: Setting up periodic refresh timer (15s interval) │
  │ === OLLAMA DETECTION SERVICE: StartAsync EXIT - 5ms (non-blocking) ═│
  │                                                                      │
  │ [LlmPrewarmService, ProviderWarmupService, etc. all start in bgnd]  │
  └─────────────────────────────────────────────────────────────────────┘
  ⏱️  Expected: <10ms each (fire-and-forget)
  ℹ️  These services run in background and don't block startup


Step 6: APPLICATION READY
═══════════════════════════════════════════════════════════════════════════
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Application started. Press Ctrl+C to shut down.                     │
  │ Listening on: http://localhost:5005                                 │
  └─────────────────────────────────────────────────────────────────────┘
  ✅ TOTAL STARTUP TIME: 2-4 seconds (normal)


═══════════════════════════════════════════════════════════════════════════
                            TROUBLESHOOTING GUIDE
═══════════════════════════════════════════════════════════════════════════

🔍 IF STARTUP HANGS:

1. Find the last log message with >>> prefix
2. That's where the hang occurred
3. Look for patterns:

   ❌ DATABASE INIT never completes Step X
      → Database file locked or corrupted
      → Solution: Delete database file and restart

   ❌ "DATABASE INITIALIZATION TIMED OUT after 60000ms"
      → Database operations hanging (lock/corruption)
      → Solution: Delete database file

   ❌ STARTUP INIT Step X shows STARTING but never COMPLETED
      → Service initialization hanging
      → Check the specific service logs for details

   ❌ No "Application started" message after 30 seconds
      → Check last >>> message to identify hang point
      → Review thread dumps if deadlock suspected

📊 SEARCH COMMANDS:

# Find where it hung (last message before silence)
grep ">>>" logs/aura-*.log | tail -20

# Check database timing
grep "DATABASE INIT" logs/aura-*.log

# Find all service timings
grep "Total time:" logs/aura-*.log

# Detect timeout errors
grep "TIMED OUT" logs/aura-*.log


✅ HEALTHY STARTUP INDICATORS:

✓ All steps show both STARTING and COMPLETED
✓ Database init completes in <2 seconds
✓ All services complete in <5 seconds total
✓ "Application started" message appears
✓ No timeout or error messages
