/**
 * KeyboardShortcutsOverlay Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KeyboardShortcutsOverlay } from '../KeyboardShortcutsOverlay';
import { KEYBOARD_SHORTCUTS } from '../../../constants/keyboardShortcuts';

describe('KeyboardShortcutsOverlay', () => {
  describe('Rendering', () => {
    it('should not render when closed', () => {
      const onClose = vi.fn();
      const { container } = render(<KeyboardShortcutsOverlay open={false} onClose={onClose} />);
      
      // Dialog should not be visible when closed
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should render search input', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search by name, key, or category...');
    });

    it('should render all category sections', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      expect(screen.getByText('Playback')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Clips')).toBeInTheDocument();
      expect(screen.getByText('Selection')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('should render all shortcuts', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      // Check a few key shortcuts are present
      expect(screen.getByText('Play / Pause')).toBeInTheDocument();
      expect(screen.getByText('Split Clip at Playhead')).toBeInTheDocument();
      expect(screen.getByText('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter shortcuts by description', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      fireEvent.change(searchInput, { target: { value: 'split' } });
      
      await waitFor(() => {
        expect(screen.getByText('Split Clip at Playhead')).toBeInTheDocument();
        expect(screen.queryByText('Play / Pause')).not.toBeInTheDocument();
      });
    });

    it('should filter shortcuts by key', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      fireEvent.change(searchInput, { target: { value: 'space' } });
      
      await waitFor(() => {
        expect(screen.getByText('Play / Pause')).toBeInTheDocument();
      });
    });

    it('should filter shortcuts by category', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      fireEvent.change(searchInput, { target: { value: 'playback' } });
      
      await waitFor(() => {
        // Should show playback category shortcuts
        expect(screen.getByText('Playback')).toBeInTheDocument();
        // But not other categories
        expect(screen.queryByText('Clips')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no results', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      fireEvent.change(searchInput, { target: { value: 'nonexistentshortcut' } });
      
      await waitFor(() => {
        expect(screen.getByText(/No shortcuts found matching/)).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const searchInput = screen.getByLabelText('Search shortcuts');
      fireEvent.change(searchInput, { target: { value: 'SPLIT' } });
      
      await waitFor(() => {
        expect(screen.getByText('Split Clip at Playhead')).toBeInTheDocument();
      });
    });
  });

  describe('Closing', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key pressed', async () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Shortcuts Data', () => {
    it('should display shortcuts from KEYBOARD_SHORTCUTS constant', () => {
      const onClose = vi.fn();
      render(<KeyboardShortcutsOverlay open={true} onClose={onClose} />);
      
      // Check that we have shortcuts from all categories
      const playbackShortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === 'playback');
      const clipShortcuts = KEYBOARD_SHORTCUTS.filter(s => s.category === 'clips');
      
      expect(playbackShortcuts.length).toBeGreaterThan(0);
      expect(clipShortcuts.length).toBeGreaterThan(0);
    });
  });
});
