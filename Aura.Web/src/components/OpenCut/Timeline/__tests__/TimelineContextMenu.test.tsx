/**
 * Timeline Context Menu Component Tests
 *
 * Tests context menu rendering, interactions, and keyboard accessibility.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimelineContextMenu } from '../TimelineContextMenu';
import { useOpenCutClipboardStore } from '../../../../stores/opencutClipboard';
import { useOpenCutTimelineStore } from '../../../../stores/opencutTimeline';
import { useOpenCutPlaybackStore } from '../../../../stores/opencutPlayback';
import { useOpenCutTransitionsStore } from '../../../../stores/opencutTransitions';
import { useOpenCutMarkersStore } from '../../../../stores/opencutMarkers';
import type { TimelineClip } from '../../../../stores/opencutTimeline';

// Mock all stores
vi.mock('../../../../stores/opencutClipboard');
vi.mock('../../../../stores/opencutTimeline');
vi.mock('../../../../stores/opencutPlayback');
vi.mock('../../../../stores/opencutTransitions');
vi.mock('../../../../stores/opencutMarkers');

describe('TimelineContextMenu', () => {
  const mockClip: TimelineClip = {
    id: 'clip-1',
    trackId: 'track-1',
    type: 'video',
    name: 'Test Clip',
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

  const mockTrack = {
    id: 'track-1',
    type: 'video' as const,
    name: 'Video Track 1',
    order: 0,
    height: 56,
    muted: false,
    solo: false,
    locked: false,
    visible: true,
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup clipboard store mock
    vi.mocked(useOpenCutClipboardStore).mockReturnValue({
      hasContent: false,
      content: null,
      operation: null,
      cutClipIds: [],
      copy: vi.fn(),
      cut: vi.fn(),
      paste: vi.fn(),
      clear: vi.fn(),
      getContent: vi.fn(() => null),
      isEmpty: vi.fn(() => true),
    });

    // Setup timeline store mock
    vi.mocked(useOpenCutTimelineStore).mockReturnValue({
      getClipById: vi.fn(() => mockClip),
      getTrackById: vi.fn(() => mockTrack),
      removeClip: vi.fn(),
      splitClip: vi.fn(),
      duplicateClip: vi.fn(),
      updateClipTransform: vi.fn(),
      selectClip: vi.fn(),
      addTrack: vi.fn(() => 'new-track-id'),
      removeTrack: vi.fn(),
      updateTrack: vi.fn(),
      reorderTracks: vi.fn(),
      lockTrack: vi.fn(),
      rippleInsert: vi.fn(),
      closeAllGaps: vi.fn(),
      tracks: [mockTrack],
      clips: [mockClip],
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
    } as unknown as ReturnType<typeof useOpenCutTimelineStore>);

    // Setup playback store mock
    vi.mocked(useOpenCutPlaybackStore).mockReturnValue({
      currentTime: 0,
      isPlaying: false,
      duration: 10,
      volume: 1,
      muted: false,
      previousVolume: 1,
      speed: 1,
      play: vi.fn(),
      pause: vi.fn(),
      toggle: vi.fn(),
      seek: vi.fn(),
      setCurrentTime: vi.fn(),
      setDuration: vi.fn(),
      setVolume: vi.fn(),
      setSpeed: vi.fn(),
      mute: vi.fn(),
      unmute: vi.fn(),
      toggleMute: vi.fn(),
      skipBackward: vi.fn(),
      skipForward: vi.fn(),
      goToStart: vi.fn(),
      goToEnd: vi.fn(),
    });

    // Setup transitions store mock
    vi.mocked(useOpenCutTransitionsStore).mockReturnValue({
      transitions: [],
      selectedTransitionId: null,
      selectTransition: vi.fn(),
      removeTransition: vi.fn(),
      updateTransition: vi.fn(),
    } as unknown as ReturnType<typeof useOpenCutTransitionsStore>);

    // Setup markers store mock
    vi.mocked(useOpenCutMarkersStore).mockReturnValue({
      addMarker: vi.fn(),
    } as unknown as ReturnType<typeof useOpenCutMarkersStore>);
  });

  describe('Clip context menu', () => {
    it('renders clip menu items when type is "clip"', () => {
      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Cut')).toBeDefined();
      expect(screen.getByText('Copy')).toBeDefined();
      expect(screen.getByText('Paste')).toBeDefined();
      expect(screen.getByText('Split at Playhead')).toBeDefined();
      expect(screen.getByText('Duplicate')).toBeDefined();
      expect(screen.getByText('Delete')).toBeDefined();
      expect(screen.getByText('Properties...')).toBeDefined();
    });

    it('disables paste when clipboard is empty', () => {
      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      const pasteItem = screen.getByText('Paste').closest('div');
      expect(pasteItem).toHaveAttribute('aria-disabled', 'true');
    });

    it('enables paste when clipboard has content', () => {
      vi.mocked(useOpenCutClipboardStore).mockReturnValue({
        hasContent: true,
        content: [mockClip],
        operation: 'copy',
        cutClipIds: [],
        copy: vi.fn(),
        cut: vi.fn(),
        paste: vi.fn(),
        clear: vi.fn(),
        getContent: vi.fn(() => [mockClip]),
        isEmpty: vi.fn(() => false),
      });

      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      const pasteItem = screen.getByText('Paste').closest('div');
      expect(pasteItem).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('calls clipboard cut when Cut is clicked', async () => {
      const mockCut = vi.fn();
      vi.mocked(useOpenCutClipboardStore).mockReturnValue({
        hasContent: false,
        content: null,
        operation: null,
        cutClipIds: [],
        copy: vi.fn(),
        cut: mockCut,
        paste: vi.fn(),
        clear: vi.fn(),
        getContent: vi.fn(() => null),
        isEmpty: vi.fn(() => true),
      });

      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      const cutItem = screen.getByText('Cut');
      fireEvent.click(cutItem);

      await waitFor(() => {
        expect(mockCut).toHaveBeenCalledWith('clip-1');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('calls clipboard copy when Copy is clicked', async () => {
      const mockCopy = vi.fn();
      vi.mocked(useOpenCutClipboardStore).mockReturnValue({
        hasContent: false,
        content: null,
        operation: null,
        cutClipIds: [],
        copy: mockCopy,
        cut: vi.fn(),
        paste: vi.fn(),
        clear: vi.fn(),
        getContent: vi.fn(() => null),
        isEmpty: vi.fn(() => true),
      });

      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      const copyItem = screen.getByText('Copy');
      fireEvent.click(copyItem);

      await waitFor(() => {
        expect(mockCopy).toHaveBeenCalledWith('clip-1');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('displays keyboard shortcuts', () => {
      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('⌘X')).toBeDefined();
      expect(screen.getByText('⌘C')).toBeDefined();
      expect(screen.getByText('⌘V')).toBeDefined();
      expect(screen.getByText('S')).toBeDefined();
      expect(screen.getByText('⌘D')).toBeDefined();
      expect(screen.getByText('⌫')).toBeDefined();
    });
  });

  describe('Track context menu', () => {
    it('renders track menu items when type is "track"', () => {
      render(
        <TimelineContextMenu
          type="track"
          position={{ x: 100, y: 100 }}
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Add Marker')).toBeDefined();
      expect(screen.getByText('Insert Time...')).toBeDefined();
      expect(screen.getByText('Delete All Gaps')).toBeDefined();
      expect(screen.getByText('Add Track Above')).toBeDefined();
      expect(screen.getByText('Add Track Below')).toBeDefined();
      expect(screen.getByText('Delete Track')).toBeDefined();
      expect(screen.getByText('Rename Track...')).toBeDefined();
    });

    it('shows lock/unlock based on track state', () => {
      render(
        <TimelineContextMenu
          type="track"
          position={{ x: 100, y: 100 }}
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Lock Track')).toBeDefined();
    });

    it('shows hide/show based on track visibility', () => {
      render(
        <TimelineContextMenu
          type="track"
          position={{ x: 100, y: 100 }}
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Hide Track')).toBeDefined();
    });
  });

  describe('Empty area context menu', () => {
    it('renders empty area menu items when type is "empty"', () => {
      render(
        <TimelineContextMenu
          type="empty"
          position={{ x: 100, y: 100 }}
          trackId="track-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Paste')).toBeDefined();
      expect(screen.getByText('Add Marker')).toBeDefined();
      expect(screen.getByText('Insert Time...')).toBeDefined();
      expect(screen.getByText('Delete All Gaps')).toBeDefined();
    });
  });

  describe('Transition context menu', () => {
    const mockTransition = {
      id: 'transition-1',
      clipId: 'clip-1',
      type: 'cross-dissolve' as const,
      duration: 0.5,
      position: 'end' as const,
      easing: 'linear' as const,
    };

    beforeEach(() => {
      vi.mocked(useOpenCutTransitionsStore).mockReturnValue({
        transitions: [mockTransition],
        selectedTransitionId: null,
        selectTransition: vi.fn(),
        removeTransition: vi.fn(),
        updateTransition: vi.fn(),
      } as unknown as ReturnType<typeof useOpenCutTransitionsStore>);
    });

    it('renders transition menu items when type is "transition"', () => {
      render(
        <TimelineContextMenu
          type="transition"
          position={{ x: 100, y: 100 }}
          targetId="transition-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Edit Transition...')).toBeDefined();
      expect(screen.getByText('Remove Transition')).toBeDefined();
      expect(screen.getByText('Replace Transition...')).toBeDefined();
    });
  });

  describe('Keyboard accessibility', () => {
    it('closes menu when Escape is pressed', async () => {
      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('does not close menu when Escape is pressed and menu is closed', () => {
      render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 100, y: 100 }}
          targetId="clip-1"
          open={false}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Menu positioning', () => {
    it('positions menu at specified coordinates', () => {
      const { container } = render(
        <TimelineContextMenu
          type="clip"
          position={{ x: 250, y: 300 }}
          targetId="clip-1"
          open={true}
          onClose={mockOnClose}
        />
      );

      const trigger = container.querySelector('div[style*="position: fixed"]');
      expect(trigger).toHaveStyle({ left: '250px', top: '300px' });
    });
  });
});
