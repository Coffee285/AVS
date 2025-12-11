/**
 * TrackResizeHandle Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrackResizeHandle } from '../TrackResizeHandle';
import { useOpenCutTimelineStore } from '../../../../stores/opencutTimeline';

// Mock the timeline store
vi.mock('../../../../stores/opencutTimeline', () => ({
  useOpenCutTimelineStore: vi.fn(),
}));

describe('TrackResizeHandle', () => {
  it('renders resize handle', () => {
    const mockSetTrackHeight = vi.fn();
    vi.mocked(useOpenCutTimelineStore).mockReturnValue({
      setTrackHeight: mockSetTrackHeight,
    } as never);

    render(<TrackResizeHandle trackId="track-1" currentHeight={64} />);

    const handle = screen.getByRole('separator', { name: /resize track/i });
    expect(handle).toBeInTheDocument();
  });

  it('calls setTrackHeight on drag', () => {
    const mockSetTrackHeight = vi.fn();
    vi.mocked(useOpenCutTimelineStore).mockReturnValue({
      setTrackHeight: mockSetTrackHeight,
    } as never);

    render(<TrackResizeHandle trackId="track-1" currentHeight={64} />);

    const handle = screen.getByRole('separator', { name: /resize track/i });

    // Start drag
    fireEvent.mouseDown(handle, { clientY: 100 });

    // Move mouse
    fireEvent.mouseMove(document, { clientY: 120 });

    // Should have called setTrackHeight with new height (64 + 20)
    expect(mockSetTrackHeight).toHaveBeenCalledWith('track-1', 84);

    // End drag
    fireEvent.mouseUp(document);
  });

  it('clamps height between min and max', () => {
    const mockSetTrackHeight = vi.fn();
    vi.mocked(useOpenCutTimelineStore).mockReturnValue({
      setTrackHeight: mockSetTrackHeight,
    } as never);

    render(<TrackResizeHandle trackId="track-1" currentHeight={30} />);

    const handle = screen.getByRole('separator', { name: /resize track/i });

    // Try to drag below minimum (24px)
    fireEvent.mouseDown(handle, { clientY: 100 });
    fireEvent.mouseMove(document, { clientY: 80 }); // Move up 20px, would be 10px total

    // Should be clamped to minimum
    expect(mockSetTrackHeight).toHaveBeenCalledWith('track-1', 24);

    fireEvent.mouseUp(document);
  });
});
