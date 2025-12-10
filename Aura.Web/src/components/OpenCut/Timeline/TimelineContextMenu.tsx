/**
 * Timeline Context Menu Component
 *
 * Provides rich context menus for timeline elements:
 * - Clip context menu: Cut, Copy, Paste, Delete, Split, Duplicate, Properties, etc.
 * - Track context menu: Add Track, Delete Track, Lock, Mute, etc.
 * - Empty track context menu: Paste, Add Marker, Insert Time
 * - Transition context menu: Edit, Remove, Replace
 *
 * Includes keyboard accessibility and disabled state tooltips.
 */

import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Divider,
  Tooltip,
} from '@fluentui/react-components';
import {
  Cut24Regular,
  Copy24Regular,
  Clipboard24Regular,
  Delete24Regular,
  DocumentCopy24Regular,
  Settings24Regular,
  Add24Regular,
  LockClosed24Regular,
  LockOpen24Regular,
  Speaker224Regular,
  SpeakerMute24Regular,
  ArrowSplit24Regular,
  Flag24Regular,
  TimeAndWeather24Regular,
  Edit24Regular,
  Dismiss24Regular,
  ArrowSwap24Regular,
} from '@fluentui/react-icons';
import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useOpenCutClipboardStore } from '../../../stores/opencutClipboard';
import { useOpenCutTimelineStore, type TimelineClip } from '../../../stores/opencutTimeline';
import { useOpenCutPlaybackStore } from '../../../stores/opencutPlayback';
import { useOpenCutTransitionsStore } from '../../../stores/opencutTransitions';
import { useOpenCutMarkersStore } from '../../../stores/opencutMarkers';

export interface TimelineContextMenuProps {
  /** Menu type determines available actions */
  type: 'clip' | 'track' | 'empty' | 'transition';
  /** Screen position for menu */
  position: { x: number; y: number };
  /** ID of target (clip, track, or transition) */
  targetId?: string;
  /** Track ID (for empty track areas) */
  trackId?: string;
  /** Time position in timeline (for time-based operations) */
  time?: number;
  /** Whether menu is open */
  open: boolean;
  /** Callback when menu should close */
  onClose: () => void;
}

export const TimelineContextMenu: FC<TimelineContextMenuProps> = ({
  type,
  position,
  targetId,
  trackId,
  time,
  open,
  onClose,
}) => {
  const timelineStore = useOpenCutTimelineStore();
  const playbackStore = useOpenCutPlaybackStore();
  const clipboardStore = useOpenCutClipboardStore();
  const transitionsStore = useOpenCutTransitionsStore();
  const markersStore = useOpenCutMarkersStore();

  // Get context entities
  const clip = targetId && type === 'clip' ? timelineStore.getClipById(targetId) : undefined;
  const track = trackId ? timelineStore.getTrackById(trackId) : undefined;
  const transition =
    targetId && type === 'transition'
      ? transitionsStore.transitions.find((t) => t.id === targetId)
      : undefined;

  const currentTime = playbackStore.currentTime;
  const hasClipboard = clipboardStore.hasContent;

  // Close menu on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Clip actions
  const handleCut = useCallback(() => {
    if (clip) {
      clipboardStore.cut(clip.id);
      onClose();
    }
  }, [clip, clipboardStore, onClose]);

  const handleCopy = useCallback(() => {
    if (clip) {
      clipboardStore.copy(clip.id);
      onClose();
    }
  }, [clip, clipboardStore, onClose]);

  const handlePaste = useCallback(() => {
    const pasteTrackId = trackId || clip?.trackId;
    const pasteTime = time ?? currentTime;
    if (pasteTrackId) {
      clipboardStore.paste(pasteTrackId, pasteTime);
      onClose();
    }
  }, [trackId, clip, time, currentTime, clipboardStore, onClose]);

  const handleDelete = useCallback(() => {
    if (clip) {
      timelineStore.removeClip(clip.id);
      onClose();
    }
  }, [clip, timelineStore, onClose]);

  const handleSplit = useCallback(() => {
    if (clip) {
      timelineStore.splitClip(clip.id, currentTime);
      onClose();
    }
  }, [clip, currentTime, timelineStore, onClose]);

  const handleDuplicate = useCallback(() => {
    if (clip) {
      timelineStore.duplicateClip(clip.id);
      onClose();
    }
  }, [clip, timelineStore, onClose]);

  const handleDisable = useCallback(() => {
    if (clip) {
      // Disable by setting opacity to 0
      timelineStore.updateClipTransform(clip.id, { opacity: clip.transform.opacity === 0 ? 100 : 0 });
      onClose();
    }
  }, [clip, timelineStore, onClose]);

  const handleProperties = useCallback(() => {
    if (clip) {
      timelineStore.selectClip(clip.id, false);
      // Properties panel will show automatically when clip is selected
      onClose();
    }
  }, [clip, timelineStore, onClose]);

  // Track actions
  const handleAddTrackAbove = useCallback(() => {
    if (track) {
      const newTrackId = timelineStore.addTrack(track.type);
      // Move new track above current track
      const tracks = timelineStore.tracks;
      const currentIndex = tracks.findIndex((t) => t.id === track.id);
      if (currentIndex !== -1) {
        const reorderedIds = tracks.map((t) => t.id);
        const newTrackIndex = reorderedIds.indexOf(newTrackId);
        if (newTrackIndex !== -1) {
          reorderedIds.splice(newTrackIndex, 1);
          reorderedIds.splice(currentIndex, 0, newTrackId);
          timelineStore.reorderTracks(reorderedIds);
        }
      }
      onClose();
    }
  }, [track, timelineStore, onClose]);

  const handleAddTrackBelow = useCallback(() => {
    if (track) {
      const newTrackId = timelineStore.addTrack(track.type);
      // Move new track below current track
      const tracks = timelineStore.tracks;
      const currentIndex = tracks.findIndex((t) => t.id === track.id);
      if (currentIndex !== -1) {
        const reorderedIds = tracks.map((t) => t.id);
        const newTrackIndex = reorderedIds.indexOf(newTrackId);
        if (newTrackIndex !== -1) {
          reorderedIds.splice(newTrackIndex, 1);
          reorderedIds.splice(currentIndex + 1, 0, newTrackId);
          timelineStore.reorderTracks(reorderedIds);
        }
      }
      onClose();
    }
  }, [track, timelineStore, onClose]);

  const handleDeleteTrack = useCallback(() => {
    if (track) {
      timelineStore.removeTrack(track.id);
      onClose();
    }
  }, [track, timelineStore, onClose]);

  const handleRenameTrack = useCallback(() => {
    if (track) {
      const newName = prompt('Enter new track name:', track.name);
      if (newName && newName.trim()) {
        timelineStore.updateTrack(track.id, { name: newName.trim() });
      }
      onClose();
    }
  }, [track, timelineStore, onClose]);

  const handleLockTrack = useCallback(() => {
    if (track) {
      timelineStore.lockTrack(track.id, !track.locked);
      onClose();
    }
  }, [track, timelineStore, onClose]);

  const handleHideTrack = useCallback(() => {
    if (track) {
      timelineStore.updateTrack(track.id, { visible: !track.visible });
      onClose();
    }
  }, [track, timelineStore, onClose]);

  // Empty track actions
  const handleAddMarker = useCallback(() => {
    const markerTime = time ?? currentTime;
    markersStore.addMarker(markerTime);
    onClose();
  }, [time, currentTime, markersStore, onClose]);

  const handleInsertTime = useCallback(() => {
    if (trackId) {
      const insertTime = time ?? currentTime;
      const duration = parseFloat(prompt('Duration to insert (seconds):', '1') || '1');
      if (!isNaN(duration) && duration > 0) {
        timelineStore.rippleInsert(trackId, insertTime, duration);
      }
      onClose();
    }
  }, [trackId, time, currentTime, timelineStore, onClose]);

  const handleDeleteGap = useCallback(() => {
    if (trackId) {
      timelineStore.closeAllGaps(trackId);
      onClose();
    }
  }, [trackId, timelineStore, onClose]);

  // Transition actions
  const handleEditTransition = useCallback(() => {
    if (transition) {
      transitionsStore.selectTransition(transition.id);
      // Transition editor panel will show automatically
      onClose();
    }
  }, [transition, transitionsStore, onClose]);

  const handleRemoveTransition = useCallback(() => {
    if (transition) {
      transitionsStore.removeTransition(transition.id);
      onClose();
    }
  }, [transition, transitionsStore, onClose]);

  const handleReplaceTransition = useCallback(() => {
    if (transition) {
      // For now, just toggle between cross-dissolve and fade-to-black
      const newType = transition.type === 'cross-dissolve' ? 'fade-to-black' : 'cross-dissolve';
      transitionsStore.updateTransition(transition.id, { type: newType });
      onClose();
    }
  }, [transition, transitionsStore, onClose]);

  // Render menu items based on type
  const renderMenuItems = () => {
    switch (type) {
      case 'clip':
        return (
          <>
            <MenuItem icon={<Cut24Regular />} onClick={handleCut}>
              Cut
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘X</span>
            </MenuItem>
            <MenuItem icon={<Copy24Regular />} onClick={handleCopy}>
              Copy
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘C</span>
            </MenuItem>
            <Tooltip
              content={!hasClipboard ? 'Clipboard is empty' : 'Paste clip at current position'}
              relationship="label"
            >
              <MenuItem
                icon={<Clipboard24Regular />}
                onClick={handlePaste}
                disabled={!hasClipboard}
              >
                Paste
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘V</span>
              </MenuItem>
            </Tooltip>
            <Divider />
            <MenuItem icon={<ArrowSplit24Regular />} onClick={handleSplit}>
              Split at Playhead
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>S</span>
            </MenuItem>
            <MenuItem icon={<DocumentCopy24Regular />} onClick={handleDuplicate}>
              Duplicate
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘D</span>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDisable}>
              {clip?.transform.opacity === 0 ? 'Enable' : 'Disable'}
            </MenuItem>
            <MenuItem icon={<Delete24Regular />} onClick={handleDelete}>
              Delete
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌫</span>
            </MenuItem>
            <Divider />
            <MenuItem icon={<Settings24Regular />} onClick={handleProperties}>
              Properties...
            </MenuItem>
          </>
        );

      case 'track':
        return (
          <>
            <Tooltip
              content={!hasClipboard ? 'Clipboard is empty' : 'Paste clip at cursor position'}
              relationship="label"
            >
              <MenuItem
                icon={<Clipboard24Regular />}
                onClick={handlePaste}
                disabled={!hasClipboard}
              >
                Paste
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘V</span>
              </MenuItem>
            </Tooltip>
            <MenuItem icon={<Flag24Regular />} onClick={handleAddMarker}>
              Add Marker
            </MenuItem>
            <MenuItem icon={<TimeAndWeather24Regular />} onClick={handleInsertTime}>
              Insert Time...
            </MenuItem>
            <MenuItem onClick={handleDeleteGap}>Delete All Gaps</MenuItem>
            <Divider />
            <MenuItem icon={<Add24Regular />} onClick={handleAddTrackAbove}>
              Add Track Above
            </MenuItem>
            <MenuItem icon={<Add24Regular />} onClick={handleAddTrackBelow}>
              Add Track Below
            </MenuItem>
            <MenuItem icon={<Delete24Regular />} onClick={handleDeleteTrack}>
              Delete Track
            </MenuItem>
            <Divider />
            <MenuItem icon={<Edit24Regular />} onClick={handleRenameTrack}>
              Rename Track...
            </MenuItem>
            <MenuItem
              icon={track?.locked ? <LockClosed24Regular /> : <LockOpen24Regular />}
              onClick={handleLockTrack}
            >
              {track?.locked ? 'Unlock Track' : 'Lock Track'}
            </MenuItem>
            <MenuItem onClick={handleHideTrack}>
              {track?.visible === false ? 'Show Track' : 'Hide Track'}
            </MenuItem>
          </>
        );

      case 'empty':
        return (
          <>
            <Tooltip
              content={!hasClipboard ? 'Clipboard is empty' : 'Paste clip at cursor position'}
              relationship="label"
            >
              <MenuItem
                icon={<Clipboard24Regular />}
                onClick={handlePaste}
                disabled={!hasClipboard}
              >
                Paste
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>⌘V</span>
              </MenuItem>
            </Tooltip>
            <MenuItem icon={<Flag24Regular />} onClick={handleAddMarker}>
              Add Marker
            </MenuItem>
            <MenuItem icon={<TimeAndWeather24Regular />} onClick={handleInsertTime}>
              Insert Time...
            </MenuItem>
            <MenuItem onClick={handleDeleteGap}>Delete All Gaps</MenuItem>
          </>
        );

      case 'transition':
        return (
          <>
            <MenuItem icon={<Edit24Regular />} onClick={handleEditTransition}>
              Edit Transition...
            </MenuItem>
            <MenuItem icon={<Dismiss24Regular />} onClick={handleRemoveTransition}>
              Remove Transition
            </MenuItem>
            <MenuItem icon={<ArrowSwap24Regular />} onClick={handleReplaceTransition}>
              Replace Transition...
            </MenuItem>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Menu
      open={open}
      onOpenChange={(e, data) => {
        if (!data.open) {
          onClose();
        }
      }}
    >
      <MenuTrigger disableButtonEnhancement>
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>{renderMenuItems()}</MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default TimelineContextMenu;
