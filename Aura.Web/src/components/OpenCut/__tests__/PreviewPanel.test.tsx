/**
 * PreviewPanel Component Tests
 *
 * Tests for intelligent preview aspect ratio and scaling functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewPanel } from '../PreviewPanel';

// Mock stores
vi.mock('../../../stores/opencutMedia', () => ({
  useOpenCutMediaStore: () => ({
    getMediaById: vi.fn(),
  }),
}));

vi.mock('../../../stores/opencutPlayback', () => ({
  useOpenCutPlaybackStore: () => ({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    setDuration: vi.fn(),
    setCurrentTime: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  }),
}));

vi.mock('../../../stores/opencutProject', () => ({
  useOpenCutProjectStore: () => ({
    activeProject: {
      id: 'test-project',
      name: 'Test Project',
      canvasWidth: 1920,
      canvasHeight: 1080,
      fps: 30,
      backgroundColor: '#000000',
      backgroundType: 'solid',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}));

vi.mock('../../../stores/opencutTimeline', () => ({
  useOpenCutTimelineStore: () => ({
    tracks: [],
    clips: [],
  }),
}));

// Mock child components
vi.mock('../Captions', () => ({
  CaptionPreview: () => <div data-testid="caption-preview">Caption Preview</div>,
}));

vi.mock('../Export', () => ({
  ExportDialog: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="export-dialog">{trigger}</div>
  ),
}));

vi.mock('../PlaybackControls', () => ({
  PlaybackControls: () => <div data-testid="playback-controls">Playback Controls</div>,
}));

describe('PreviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<PreviewPanel />);
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });

    it('should show empty state when no content', () => {
      render(<PreviewPanel />);
      expect(screen.getByText('Add media to preview')).toBeInTheDocument();
    });

    it('should render zoom controls', () => {
      render(<PreviewPanel />);

      // Check for zoom buttons
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
      expect(screen.getByLabelText('Fit to window')).toBeInTheDocument();
    });

    it('should render toolbar controls', () => {
      render(<PreviewPanel />);

      expect(screen.getByLabelText('Toggle safe area guides')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle timecode overlay')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle loop playback')).toBeInTheDocument();
      expect(screen.getByLabelText('Preview quality')).toBeInTheDocument();
    });

    it('should show loading state when isLoading prop is true', () => {
      render(<PreviewPanel isLoading={true} />);
      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display compact empty state with correct styling', () => {
      render(<PreviewPanel />);

      const emptyStateText = screen.getByText('Add media to preview');
      expect(emptyStateText).toBeInTheDocument();

      // Verify it's using the compact text size (200)
      expect(emptyStateText).toHaveClass(/placeholderText/);
    });
  });

  describe('Zoom Modes', () => {
    it('should display "Fit" as default zoom level', () => {
      render(<PreviewPanel />);
      expect(screen.getByText('Fit')).toBeInTheDocument();
    });
  });

  describe('Aspect Ratio Display', () => {
    it('should show aspect ratio label', () => {
      render(<PreviewPanel />);
      expect(screen.getByText('16:9')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render all child components', () => {
      render(<PreviewPanel />);

      expect(screen.getByTestId('caption-preview')).toBeInTheDocument();
      expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });
  });
});
