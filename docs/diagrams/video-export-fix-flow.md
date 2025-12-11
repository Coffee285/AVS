# Video Export 95% Fix - Flow Diagram

## Summary

This diagram illustrates how the fix bridges JobRunner and ExportJobService to resolve the "stuck at 95%" issue.

**Problem**: Two separate job tracking systems didn't communicate
**Solution**: Sync terminal states from JobRunner to ExportJobService

## Verification

See `docs/fix-verification-video-export-95.md` for complete verification guide.
