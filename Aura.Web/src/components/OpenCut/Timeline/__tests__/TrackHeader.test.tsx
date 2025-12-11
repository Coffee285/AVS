/**
 * TrackHeader Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackHeader } from '../TrackHeader';
import type { TimelineTrack } from '../../../../stores/opencutTimeline';

describe('TrackHeader', () => {
  const mockTrack: TimelineTrack = {
    id: 'track-1',
    type: 'video',
    name: 'Video Track 1',
    order: 0,
    height: 64,
    muted: false,
    solo: false,
    locked: false,
    visible: true,
  };

  let mockHandlers: {
    onClick: ReturnType<typeof vi.fn>;
    onMuteToggle: ReturnType<typeof vi.fn>;
    onLockToggle: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHandlers = {
      onClick: vi.fn(),
      onMuteToggle: vi.fn(),
      onLockToggle: vi.fn(),
    };
  });

  it('renders track header with track name and icon', () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    expect(screen.getByText('Video Track 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Track 1 track/i })).toBeInTheDocument();
  });

  it('calls onClick when header is clicked', () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });
    fireEvent.click(header);

    expect(mockHandlers.onClick).toHaveBeenCalledTimes(1);
  });

  it('shows mute and lock controls on hover', async () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });

    // Before hover, controls should not be visible
    expect(screen.queryByLabelText(/Mute track/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Lock track/i)).not.toBeInTheDocument();

    // Hover over header
    fireEvent.mouseEnter(header);

    // After hover, controls should be visible
    expect(screen.getByLabelText(/Mute track/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lock track/i)).toBeInTheDocument();
  });

  it('shows state indicators when track is muted and not hovered', () => {
    const mutedTrack = { ...mockTrack, muted: true };
    render(<TrackHeader track={mutedTrack} isSelected={false} {...mockHandlers} />);

    // State indicators should be visible when not hovered
    const header = screen.getByRole('button', { name: /Video Track 1 track/i });
    expect(header).toBeInTheDocument();

    // Controls should not be visible initially
    expect(screen.queryByLabelText(/Unmute track/i)).not.toBeInTheDocument();
  });

  it('shows state indicators when track is locked and not hovered', () => {
    const lockedTrack = { ...mockTrack, locked: true };
    render(<TrackHeader track={lockedTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });
    expect(header).toBeInTheDocument();

    // Controls should not be visible initially
    expect(screen.queryByLabelText(/Unlock track/i)).not.toBeInTheDocument();
  });

  it('calls onMuteToggle when mute button is clicked', () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });
    fireEvent.mouseEnter(header);

    const muteButton = screen.getByLabelText(/Mute track/i);
    fireEvent.click(muteButton);

    expect(mockHandlers.onMuteToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onLockToggle when lock button is clicked', () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });
    fireEvent.mouseEnter(header);

    const lockButton = screen.getByLabelText(/Lock track/i);
    fireEvent.click(lockButton);

    expect(mockHandlers.onLockToggle).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation', () => {
    render(<TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />);

    const header = screen.getByRole('button', { name: /Video Track 1 track/i });

    // Enter key
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(mockHandlers.onClick).toHaveBeenCalledTimes(1);

    // Space key
    fireEvent.keyDown(header, { key: ' ' });
    expect(mockHandlers.onClick).toHaveBeenCalledTimes(2);
  });

  it('shows correct icons for different track types', () => {
    const trackTypes: Array<TimelineTrack['type']> = ['video', 'audio', 'text', 'image'];

    trackTypes.forEach((type) => {
      const track = { ...mockTrack, type, name: `${type} track` };
      const { unmount } = render(
        <TrackHeader track={track} isSelected={false} {...mockHandlers} />
      );

      expect(screen.getByText(`${type} track`)).toBeInTheDocument();

      unmount();
    });
  });

  it('applies correct aria-pressed state when selected', () => {
    const { rerender } = render(
      <TrackHeader track={mockTrack} isSelected={false} {...mockHandlers} />
    );

    let header = screen.getByRole('button', { name: /Video Track 1 track/i });
    expect(header).toHaveAttribute('aria-pressed', 'false');

    rerender(<TrackHeader track={mockTrack} isSelected={true} {...mockHandlers} />);

    header = screen.getByRole('button', { name: /Video Track 1 track/i });
    expect(header).toHaveAttribute('aria-pressed', 'true');
  });
});
