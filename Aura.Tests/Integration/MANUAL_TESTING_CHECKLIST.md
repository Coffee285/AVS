# Manual Testing Checklist for Aura Video Studio

This checklist documents manual verification scenarios for features that complement automated integration tests.

## Video Generation

### Basic Generation
- [ ] Create video with 5 scenes - completes to 100%
  - Steps: Use default settings, create brief, generate video
  - Expected: Progress reaches 100%, video file generated
  - Verify: Video file exists, plays correctly

- [ ] Create video with 11 scenes - does NOT get stuck at 79%
  - Steps: Create brief requiring ~11 scenes (adjust duration/content)
  - Expected: Progress smoothly transitions through 79% without stalling
  - Verify: Monitor progress bar, check for steady updates

- [ ] Create video with 20 scenes - completes without memory errors
  - Steps: Create longer video requiring 20+ scenes
  - Expected: Completes successfully, no out-of-memory errors
  - Verify: Check browser console for ERR_INSUFFICIENT_RESOURCES

- [ ] Cancel video generation mid-progress - cancels cleanly
  - Steps: Start generation, click cancel after 30 seconds
  - Expected: Job status changes to cancelled, resources cleaned up
  - Verify: Temp files deleted, no zombie processes

### Resource Management
- [ ] Check browser console - no ERR_INSUFFICIENT_RESOURCES
  - Steps: Generate multiple videos in sequence
  - Expected: No resource exhaustion errors
  - Verify: Browser console clean, memory usage stable

- [ ] Generate multiple videos sequentially
  - Steps: Create 3+ videos one after another
  - Expected: Each completes successfully
  - Verify: No performance degradation over time

## Placeholder Fallback

### Image Provider Fallback
- [ ] Disable all image providers - video still generates with placeholders
  - Steps: Configure system with no image providers available
  - Expected: Video generation completes with placeholder images
  - Verify: Video renders, placeholders visible

- [ ] Placeholder images have correct resolution (1920x1080)
  - Steps: Generate video with placeholders, examine output
  - Expected: Placeholders match target resolution
  - Verify: Check video properties, visual inspection

- [ ] Placeholder images have readable text
  - Steps: View generated video with placeholders
  - Expected: Scene numbers/descriptions readable
  - Verify: Text is clear and legible at full screen

## Ideation

### Performance Tests
- [ ] With Ollama running - completes within 30 seconds
  - Steps: Start Ollama, request 3-5 concepts
  - Expected: Response within 30 seconds
  - Verify: Check response time in network tab

- [ ] With Ollama stopped - fails fast with clear error
  - Steps: Stop Ollama service, request concepts
  - Expected: Error response within 15 seconds
  - Verify: Error message is user-friendly

### Error Messaging
- [ ] Error message includes suggestions
  - Steps: Trigger ideation with no provider
  - Expected: Error includes actionable suggestions
  - Verify: Message mentions "Start Ollama" or alternatives

- [ ] Progress visible in UI during generation
  - Steps: Request concepts, observe UI
  - Expected: Loading indicator or progress shown
  - Verify: UI doesn't appear frozen

## Localization

### Translation Performance
- [ ] Progress bar updates during translation
  - Steps: Translate script to different language
  - Expected: Progress indicator updates smoothly
  - Verify: No frozen UI during translation

- [ ] 10+ scene project translates in reasonable time
  - Steps: Create large project, translate
  - Expected: Completes within 2-3 minutes
  - Verify: No timeout errors

- [ ] UI never appears frozen
  - Steps: Perform various translation operations
  - Expected: UI remains responsive throughout
  - Verify: Can click other UI elements during translation

## Captions

### Caption Export
- [ ] Export with burn-in - captions visible in video
  - Steps: Enable burn-in option, export video
  - Expected: Captions rendered directly in video
  - Verify: Play video, captions visible

- [ ] Export without burn-in - .srt file generated
  - Steps: Disable burn-in, export video
  - Expected: Separate .srt subtitle file created
  - Verify: File exists, can be loaded in media player

### Caption Accuracy
- [ ] Caption timing matches audio
  - Steps: Play video with captions
  - Expected: Captions sync with spoken words
  - Verify: No noticeable delay or desync

- [ ] Caption text accuracy
  - Steps: Compare captions to audio
  - Expected: Text matches spoken content
  - Verify: Minimal transcription errors

## Ken Burns Effect

### Animation Quality
- [ ] Static images have subtle zoom effect
  - Steps: Generate video, observe images
  - Expected: Gentle zoom/pan animation on images
  - Verify: Motion is smooth and professional

- [ ] Ken Burns can be disabled
  - Steps: Disable Ken Burns in settings
  - Expected: Images remain static
  - Verify: No zoom or pan animation

- [ ] Intensity slider works
  - Steps: Adjust intensity slider (0.0 - 1.0)
  - Expected: Animation intensity changes accordingly
  - Verify: Low values = subtle, high values = dramatic

## Error Handling

### Graceful Degradation
- [ ] Invalid brief handled gracefully
  - Steps: Submit empty or invalid brief
  - Expected: Clear validation error message
  - Verify: No system crash, user can correct

- [ ] Network interruption during generation
  - Steps: Disconnect network mid-generation
  - Expected: Error message, option to retry
  - Verify: Can resume or restart job

- [ ] Disk space exhausted
  - Steps: Fill disk to near capacity
  - Expected: Clear error about disk space
  - Verify: System doesn't crash, job fails gracefully

## Performance Benchmarks

### Response Time Targets
- [ ] API validation endpoint responds < 2 seconds
  - Steps: Call /api/video/validate
  - Expected: Response within 2 seconds
  - Verify: Check network timing

- [ ] Job status check responds < 500ms
  - Steps: Poll /api/video/status/{jobId}
  - Expected: Response within 500ms
  - Verify: Fast enough for real-time updates

- [ ] SSE progress events sent every 1-2 seconds
  - Steps: Monitor SSE stream during generation
  - Expected: Regular updates, no long gaps
  - Verify: Event frequency consistent

## Browser Compatibility

### Supported Browsers
- [ ] Chrome/Edge (Chromium) - all features work
  - Steps: Test full workflow in Chrome/Edge
  - Expected: No compatibility issues
  - Verify: All features functional

- [ ] Firefox - all features work
  - Steps: Test full workflow in Firefox
  - Expected: No compatibility issues
  - Verify: All features functional

- [ ] Safari (if applicable) - core features work
  - Steps: Test basic workflow in Safari
  - Expected: Video generation works
  - Verify: Major features functional

## Notes for Testers

1. **Environment Setup**: Ensure FFmpeg is installed and in PATH
2. **Provider Configuration**: Configure at least one TTS provider and LLM provider
3. **Disk Space**: Keep at least 5GB free for video generation
4. **Network**: Some tests require internet connection for cloud providers
5. **Timing**: Some operations may take longer on slower hardware
6. **Logs**: Check application logs for detailed error information

## Test Results Summary

Date: ___________
Tester: ___________
Environment: ___________

Total Tests: ___________
Passed: ___________
Failed: ___________
Skipped: ___________

Critical Issues Found: ___________

Notes:
___________________________________________
___________________________________________
___________________________________________
