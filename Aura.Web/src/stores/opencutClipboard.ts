/**
 * OpenCut Clipboard Store
 *
 * Manages clipboard operations for timeline clips including cut, copy, and paste.
 * Follows professional NLE patterns for clip management.
 */

import { create } from 'zustand';
import type { TimelineClip } from './opencutTimeline';

/** Clipboard operation type */
export type ClipboardOperation = 'copy' | 'cut' | null;

/** Clipboard state */
export interface OpenCutClipboardState {
  /** Clips currently in clipboard */
  content: TimelineClip[] | null;
  /** Operation type (copy or cut) */
  operation: ClipboardOperation;
  /** Whether clipboard has content */
  hasContent: boolean;
  /** Original track IDs for cut operation (to remove clips after paste) */
  cutClipIds: string[];
}

/** Clipboard actions */
export interface OpenCutClipboardActions {
  /** Copy clips to clipboard by IDs */
  copy: (clipIds: string | string[]) => void;
  /** Cut clips to clipboard by IDs */
  cut: (clipIds: string | string[]) => void;
  /** Paste clips to specified track at specified time */
  paste: (trackId: string, time: number) => void;
  /** Clear clipboard */
  clear: () => void;
  /** Get clipboard content */
  getContent: () => TimelineClip[] | null;
  /** Check if clipboard has content */
  isEmpty: () => boolean;
}

export type OpenCutClipboardStore = OpenCutClipboardState & OpenCutClipboardActions;

export const useOpenCutClipboardStore = create<OpenCutClipboardStore>((set, get) => ({
  content: null,
  operation: null,
  hasContent: false,
  cutClipIds: [],

  copy: (clipIds: string | string[]) => {
    const ids = Array.isArray(clipIds) ? clipIds : [clipIds];
    if (ids.length === 0) return;

    // Import timeline store dynamically
    import('./opencutTimeline').then(({ useOpenCutTimelineStore }) => {
      const clips: TimelineClip[] = [];
      ids.forEach((id) => {
        const clip = useOpenCutTimelineStore.getState().getClipById(id);
        if (clip) {
          clips.push({ ...clip });
        }
      });

      if (clips.length === 0) {
        console.warn('No clips found for copy operation');
        return;
      }

      set({
        content: clips,
        operation: 'copy',
        hasContent: true,
        cutClipIds: [],
      });
    }).catch((error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to access timeline store:', errorObj.message);
    });
  },

  cut: (clipIds: string | string[]) => {
    const ids = Array.isArray(clipIds) ? clipIds : [clipIds];
    if (ids.length === 0) return;

    // Import timeline store dynamically
    import('./opencutTimeline').then(({ useOpenCutTimelineStore }) => {
      const clips: TimelineClip[] = [];
      ids.forEach((id) => {
        const clip = useOpenCutTimelineStore.getState().getClipById(id);
        if (clip) {
          clips.push({ ...clip });
        }
      });

      if (clips.length === 0) {
        console.warn('No clips found for cut operation');
        return;
      }

      set({
        content: clips,
        operation: 'cut',
        hasContent: true,
        cutClipIds: ids,
      });
    }).catch((error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to access timeline store:', errorObj.message);
    });
  },

  paste: (trackId: string, time: number) => {
    const state = get();
    if (!state.content || state.content.length === 0) {
      console.warn('Clipboard is empty, cannot paste');
      return;
    }

    // Import timeline store dynamically
    import('./opencutTimeline').then(({ useOpenCutTimelineStore }) => {
      const timelineState = useOpenCutTimelineStore.getState();

      // Calculate time offset (paste at specified time, maintaining relative positions)
      const sortedClips = [...state.content!].sort((a, b) => a.startTime - b.startTime);
      const firstClipStartTime = sortedClips[0].startTime;
      const timeOffset = time - firstClipStartTime;

      // Save snapshot before paste
      timelineState.saveSnapshot(state.operation === 'cut' ? 'Cut and paste clips' : 'Paste clips');

      // If this was a cut operation, remove original clips
      if (state.operation === 'cut' && state.cutClipIds.length > 0) {
        state.cutClipIds.forEach((id) => {
          timelineState.removeClip(id);
        });
      }

      // Add clips with adjusted positions
      sortedClips.forEach((clip) => {
        const newClip: Omit<TimelineClip, 'id'> = {
          ...clip,
          trackId,
          startTime: clip.startTime + timeOffset,
        };
        timelineState.addClip(newClip);
      });

      // Clear clipboard if it was a cut operation
      if (state.operation === 'cut') {
        set({
          content: null,
          operation: null,
          hasContent: false,
          cutClipIds: [],
        });
      }
    }).catch((error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to access timeline store:', errorObj.message);
    });
  },

  clear: () => {
    set({
      content: null,
      operation: null,
      hasContent: false,
      cutClipIds: [],
    });
  },

  getContent: () => {
    return get().content;
  },

  isEmpty: () => {
    return !get().hasContent || get().content === null || get().content.length === 0;
  },
}));
