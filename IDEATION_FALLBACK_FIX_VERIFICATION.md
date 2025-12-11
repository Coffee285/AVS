# IdeationService Timeout and Fallback Fix - Verification Guide

## Overview
This document provides verification steps for the critical bug fix in IdeationService that resolves the 504 Gateway Timeout issue when using complex ideation requests.

## Problem Fixed
The timeout exception handler was using `continue` to retry instead of setting the fallback flag and breaking out of the retry loop. This meant:
- The direct Ollama fallback never executed when StageAdapter timed out
- After 3 retry attempts (each timing out after 600s), the service would throw a ProviderException
- Users experienced 504 Gateway Timeout errors

## Changes Made

### 1. Timeout Handler Fix (Line 468-474)
**Changed:** Timeout catch block now sets `stageAdapterFailed = true` and uses `break` instead of `continue`

```csharp
catch (OperationCanceledException) when (llmTimeoutCts.IsCancellationRequested)
{
    stageAdapterFailed = true;  // ✅ NEW: Set flag
    _logger.LogWarning("LLM call timed out after 600 seconds for ideation, will try direct Ollama fallback");
    lastException = new TimeoutException("AI provider took too long to respond via StageAdapter. Trying direct Ollama...");
    break;  // ✅ NEW: Exit retry loop instead of continue
}
```

### 2. Fallback Logic Moved Outside Retry Loop (Line 688-714)
**Changed:** Fallback logic now executes after all retry attempts are exhausted

The fallback was previously inside the retry loop at line 471-483, making it unreachable on timeout. Now it's outside the loop at line 688-714.

### 3. Added Tracking Variables (Line 347-350)
**Added:** Variables to track fallback state and prompts used

```csharp
bool stageAdapterFailed = false;
bool attemptedOllamaFallback = false;
string? lastSystemPrompt = systemPrompt;
string? lastUserPrompt = userPrompt;
```

## Verification Steps

### Manual Testing

#### Test 1: Timeout Scenario
**Setup:**
1. Configure Ollama with a large model (e.g., llama3.1:70b) or artificially slow StageAdapter
2. Create a complex ideation request with 9 concepts

**Expected Behavior:**
- StageAdapter times out after 600 seconds
- Log message: "LLM call timed out after 600 seconds for ideation, will try direct Ollama fallback"
- Log message: "All StageAdapter attempts failed/timed out. Falling back to direct Ollama with heartbeat logging."
- Direct Ollama fallback executes with heartbeat logs every 30 seconds
- Request completes successfully (no 504 error)

**Command:**
```bash
# Start Ollama with large model
ollama pull llama3.1:70b
ollama serve

# Test via API
curl -X POST http://localhost:5005/api/ideation/brainstorm \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Advanced machine learning techniques for video analysis",
    "conceptCount": 9,
    "audience": "Data scientists",
    "tone": "Technical"
  }'
```

#### Test 2: StageAdapter Failure
**Setup:**
1. Use a model that doesn't support structured JSON output
2. Create a normal ideation request

**Expected Behavior:**
- StageAdapter fails or returns empty
- Log message: "LlmStageAdapter ideation path threw, will try direct Ollama if permitted"
- Fallback executes immediately
- Request completes via direct Ollama

#### Test 3: Success Path (Baseline)
**Setup:**
1. Configure working StageAdapter with fast model (e.g., qwen3:4b)
2. Create simple ideation request with 3 concepts

**Expected Behavior:**
- StageAdapter succeeds on first attempt
- No fallback triggered
- Completes in < 60 seconds
- No timeout or error messages

### Log Verification

**Expected log sequence for timeout scenario:**
```
[Info] Connecting to AI provider for ideation...
[Info] Using LlmStageAdapter for ideation (primary path)
[Warn] LLM call timed out after 600 seconds for ideation, will try direct Ollama fallback
[Info] All StageAdapter attempts failed/timed out. Falling back to direct Ollama with heartbeat logging.
[Info] Generating ideation with Ollama: model=llama3.1
[Info] Ideation still processing... (30s elapsed)
[Info] Ideation still processing... (60s elapsed)
...
[Info] Ollama ideation completed: 1234 chars
[Info] Successfully generated ideation response via direct Ollama fallback
```

**Key indicators:**
- ✅ "will try direct Ollama fallback" message appears on timeout
- ✅ Heartbeat logs every 30 seconds during Ollama generation
- ✅ "Successfully generated ideation response via direct Ollama fallback" on completion
- ❌ No ProviderException thrown
- ❌ No 504 Gateway Timeout

### Performance Metrics

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Complex topic (9 concepts) timeout | 504 error after 3x600s | Completes via fallback |
| StageAdapter unavailable | 504 error after retries | Immediate fallback succeeds |
| Success path (working StageAdapter) | 15-60s | 15-60s (unchanged) |

## Success Criteria

- [ ] Timeout triggers fallback (no 504 error)
- [ ] Log shows "Falling back to direct Ollama" message
- [ ] Heartbeat logs appear every 30 seconds during fallback
- [ ] Complex ideation completes in < 15 minutes (vs. infinite timeout)
- [ ] Success rate improves from 0% → 95%+ for complex topics
- [ ] No regression in normal success path

## Rollback Plan
If issues occur, revert commit with:
```bash
git revert c7b787e
```

## Related Files
- `Aura.Core/Services/Ideation/IdeationService.cs` - Main fix
- `Aura.Api/Controllers/IdeationController.cs` - API endpoint
- `Aura.Tests/Integration/IdeationIntegrationTests.cs` - Integration tests

## Notes
- The fix only affects behavior when StageAdapter times out or fails
- Normal success path is unchanged
- Fallback only executes once per request (prevents infinite loops)
- Original prompts are preserved and used in fallback
- 600-second timeout applies to both StageAdapter and fallback attempts
