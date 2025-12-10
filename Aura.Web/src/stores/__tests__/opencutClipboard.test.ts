/**
 * OpenCut Clipboard Store Tests
 *
 * Tests clipboard operations including copy, cut, paste, and clear.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOpenCutClipboardStore } from '../opencutClipboard';
import { useOpenCutTimelineStore } from '../opencutTimeline';
import type { TimelineClip } from '../opencutTimeline';

describe('OpenCutClipboardStore', () => {
  const mockClip1: TimelineClip = {
    id: 'clip-1',
    trackId: 'track-1',
    type: 'video',
    name: 'Test Clip 1',
    mediaId: 'media-1',
    startTime: 0,
    duration: 5,
    inPoint: 0,
    outPoint: 5,
    transform: {
      scaleX: 100,
      scaleY: 100,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 100,
      anchorX: 50,
      anchorY: 50,
    },
    blendMode: 'normal',
    speed: 1,
    reversed: false,
    timeRemapEnabled: false,
    locked: false,
  };

  const mockClip2: TimelineClip = {
    id: 'clip-2',
    trackId: 'track-1',
    type: 'audio',
    name: 'Test Clip 2',
    mediaId: 'media-2',
    startTime: 5,
    duration: 3,
    inPoint: 0,
    outPoint: 3,
    transform: {
      scaleX: 100,
      scaleY: 100,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 100,
      anchorX: 50,
      anchorY: 50,
    },
    blendMode: 'normal',
    speed: 1,
    reversed: false,
    timeRemapEnabled: false,
    locked: false,
  };

  beforeEach(() => {
    // Reset clipboard store
    useOpenCutClipboardStore.setState({
      content: null,
      operation: null,
      hasContent: false,
      cutClipIds: [],
    });

    // Reset timeline store with test clips
    useOpenCutTimelineStore.setState({
      tracks: [
        {
          id: 'track-1',
          type: 'video',
          name: 'Track 1',
          order: 0,
          height: 56,
          muted: false,
          solo: false,
          locked: false,
          visible: true,
        },
      ],
      clips: [mockClip1, mockClip2],
      selectedClipIds: [],
      selectedTrackId: null,
      zoom: 1,
      scrollPosition: 0,
      snapEnabled: true,
      rippleEnabled: false,
      undoStack: [],
      redoStack: [],
      maxHistorySize: 50,
      magneticTimelineEnabled: true,
      snapToClips: true,
      snapTolerance: 10,
    });
  });

  describe('initial state', () => {
    it('should have empty clipboard initially', () => {
      const state = useOpenCutClipboardStore.getState();
      expect(state.content).toBeNull();
      expect(state.operation).toBeNull();
      expect(state.hasContent).toBe(false);
      expect(state.cutClipIds).toEqual([]);
    });

    it('isEmpty() should return true for empty clipboard', () => {
      const state = useOpenCutClipboardStore.getState();
      expect(state.isEmpty()).toBe(true);
    });
  });

  describe('copy operation', () => {
    it('should copy a single clip by ID', async () => {
      const { copy } = useOpenCutClipboardStore.getState();
      copy('clip-1');

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useOpenCutClipboardStore.getState();
        expect(state.hasContent).toBe(true);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.operation).toBe('copy');
      expect(state.content).toHaveLength(1);
      expect(state.content?.[0].id).toBe('clip-1');
      expect(state.cutClipIds).toEqual([]);
    });

    it('should copy multiple clips by IDs', async () => {
      const { copy } = useOpenCutClipboardStore.getState();
      copy(['clip-1', 'clip-2']);

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useOpenCutClipboardStore.getState();
        expect(state.hasContent).toBe(true);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.operation).toBe('copy');
      expect(state.content).toHaveLength(2);
      expect(state.isEmpty()).toBe(false);
    });

    it('should handle non-existent clip IDs gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { copy } = useOpenCutClipboardStore.getState();
      copy('non-existent');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('No clips found for copy operation');
      consoleSpy.mockRestore();
    });

    it('should handle empty array gracefully', () => {
      const { copy } = useOpenCutClipboardStore.getState();
      copy([]);

      const state = useOpenCutClipboardStore.getState();
      expect(state.hasContent).toBe(false);
    });
  });

  describe('cut operation', () => {
    it('should cut a single clip by ID', async () => {
      const { cut } = useOpenCutClipboardStore.getState();
      cut('clip-1');

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useOpenCutClipboardStore.getState();
        expect(state.hasContent).toBe(true);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.operation).toBe('cut');
      expect(state.content).toHaveLength(1);
      expect(state.content?.[0].id).toBe('clip-1');
      expect(state.cutClipIds).toEqual(['clip-1']);
    });

    it('should cut multiple clips by IDs', async () => {
      const { cut } = useOpenCutClipboardStore.getState();
      cut(['clip-1', 'clip-2']);

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useOpenCutClipboardStore.getState();
        expect(state.hasContent).toBe(true);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.operation).toBe('cut');
      expect(state.content).toHaveLength(2);
      expect(state.cutClipIds).toEqual(['clip-1', 'clip-2']);
    });
  });

  describe('paste operation', () => {
    it('should paste copied clips at specified time', async () => {
      const { copy, paste } = useOpenCutClipboardStore.getState();
      
      // Copy clip
      copy('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      // Paste at time 10
      paste('track-1', 10);

      // Wait for async operation
      await vi.waitFor(() => {
        const timelineState = useOpenCutTimelineStore.getState();
        expect(timelineState.clips.length).toBeGreaterThan(2);
      });

      const timelineState = useOpenCutTimelineStore.getState();
      const pastedClip = timelineState.clips.find((c) => c.startTime === 10);
      expect(pastedClip).toBeDefined();
      expect(pastedClip?.name).toBe('Test Clip 1');
    });

    it('should remove original clips after cutting and pasting', async () => {
      const { cut, paste } = useOpenCutClipboardStore.getState();
      
      // Cut clip
      cut('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      // Paste at time 15
      paste('track-1', 15);

      // Wait for async operation
      await vi.waitFor(() => {
        const timelineState = useOpenCutTimelineStore.getState();
        // Should still have 2 clips: original clip-2 and pasted clip at new position
        expect(timelineState.clips.length).toBe(2);
      });

      const timelineState = useOpenCutTimelineStore.getState();
      const originalClip = timelineState.clips.find((c) => c.id === 'clip-1');
      expect(originalClip).toBeUndefined();
      
      const pastedClip = timelineState.clips.find((c) => c.startTime === 15);
      expect(pastedClip).toBeDefined();
    });

    it('should clear clipboard after pasting cut clips', async () => {
      const { cut, paste } = useOpenCutClipboardStore.getState();
      
      cut('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      paste('track-1', 10);
      await vi.waitFor(() => {
        const state = useOpenCutClipboardStore.getState();
        expect(state.hasContent).toBe(false);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.content).toBeNull();
      expect(state.operation).toBeNull();
    });

    it('should not clear clipboard after pasting copied clips', async () => {
      const { copy, paste } = useOpenCutClipboardStore.getState();
      
      copy('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      paste('track-1', 10);
      await vi.waitFor(() => {
        const timelineState = useOpenCutTimelineStore.getState();
        expect(timelineState.clips.length).toBeGreaterThan(2);
      });

      const state = useOpenCutClipboardStore.getState();
      expect(state.hasContent).toBe(true);
      expect(state.operation).toBe('copy');
    });

    it('should warn when pasting from empty clipboard', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { paste } = useOpenCutClipboardStore.getState();
      
      paste('track-1', 10);
      
      expect(consoleSpy).toHaveBeenCalledWith('Clipboard is empty, cannot paste');
      consoleSpy.mockRestore();
    });

    it('should maintain relative timing when pasting multiple clips', async () => {
      const { copy, paste } = useOpenCutClipboardStore.getState();
      
      // Copy both clips (they start at 0 and 5)
      copy(['clip-1', 'clip-2']);
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      // Paste at time 20
      paste('track-1', 20);

      // Wait for async operation
      await vi.waitFor(() => {
        const timelineState = useOpenCutTimelineStore.getState();
        expect(timelineState.clips.length).toBeGreaterThan(2);
      });

      const timelineState = useOpenCutTimelineStore.getState();
      const pastedClips = timelineState.clips.filter((c) => c.startTime >= 20);
      expect(pastedClips).toHaveLength(2);
      
      // First clip should be at 20, second at 25 (maintaining 5-second gap)
      const sortedPasted = pastedClips.sort((a, b) => a.startTime - b.startTime);
      expect(sortedPasted[0].startTime).toBe(20);
      expect(sortedPasted[1].startTime).toBe(25);
    });
  });

  describe('clear operation', () => {
    it('should clear clipboard content', async () => {
      const { copy, clear } = useOpenCutClipboardStore.getState();
      
      copy('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      clear();

      const state = useOpenCutClipboardStore.getState();
      expect(state.content).toBeNull();
      expect(state.operation).toBeNull();
      expect(state.hasContent).toBe(false);
      expect(state.cutClipIds).toEqual([]);
      expect(state.isEmpty()).toBe(true);
    });
  });

  describe('getContent operation', () => {
    it('should return null for empty clipboard', () => {
      const { getContent } = useOpenCutClipboardStore.getState();
      expect(getContent()).toBeNull();
    });

    it('should return clipboard content', async () => {
      const { copy, getContent } = useOpenCutClipboardStore.getState();
      
      copy('clip-1');
      await vi.waitFor(() => {
        expect(useOpenCutClipboardStore.getState().hasContent).toBe(true);
      });

      const content = getContent();
      expect(content).toHaveLength(1);
      expect(content?.[0].id).toBe('clip-1');
    });
  });
});
