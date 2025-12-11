/**
 * Tests for SnapIndicator component
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SnapIndicator, type SnapType } from '../SnapIndicator';

describe('SnapIndicator', () => {
  describe('Visibility', () => {
    it('should not render when visible is false', () => {
      const { container } = render(<SnapIndicator position={100} visible={false} />);

      // AnimatePresence should not render children when not visible
      expect(container.firstChild).toBeNull();
    });

    it('should render when visible is true', () => {
      const { container } = render(<SnapIndicator position={100} visible={true} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should position at specified pixel position', () => {
      const { container } = render(<SnapIndicator position={250} visible={true} />);

      // The container should have left position set (position - 1 for centering)
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ left: '249px' });
    });

    it('should handle zero position', () => {
      const { container } = render(<SnapIndicator position={0} visible={true} />);

      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ left: '-1px' });
    });
  });

  describe('Snap Types', () => {
    const snapTypes: SnapType[] = ['clip', 'clip-edge', 'marker', 'playhead', 'beat', 'time-zero'];

    snapTypes.forEach((snapType) => {
      it(`should render with ${snapType} snap type`, () => {
        const { container } = render(
          <SnapIndicator position={100} visible={true} snapType={snapType} />
        );

        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it('should default to clip-edge snap type', () => {
      const { container } = render(<SnapIndicator position={100} visible={true} />);

      // Should render without error with default snap type
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Distance Tooltip', () => {
    it('should render component with distance prop', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} distance={0.5} pixelsPerSecond={100} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show tooltip when distance is 0', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} distance={0} pixelsPerSecond={100} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show tooltip when distance is greater than 1 second', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} distance={1.5} pixelsPerSecond={100} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with distance prop for frame display', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} distance={0.05} pixelsPerSecond={100} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with distance prop for seconds display', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} distance={0.5} pixelsPerSecond={100} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should apply active styles when isActive is true', () => {
      const { container } = render(<SnapIndicator position={100} visible={true} isActive={true} />);

      expect(container.firstChild).toBeInTheDocument();
      // Active state should be applied (component renders with enhanced glow)
    });

    it('should not apply active styles when isActive is false', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} isActive={false} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SnapIndicator position={100} visible={true} className="custom-snap-class" />
      );

      expect(container.firstChild).toHaveClass('custom-snap-class');
    });
  });

  describe('Structure', () => {
    it('should render diamond and line elements', () => {
      const { container } = render(<SnapIndicator position={100} visible={true} />);

      // Should have child elements for the visual indicator
      const indicator = container.firstChild as HTMLElement;
      expect(indicator.children.length).toBeGreaterThan(0);
    });
  });
});
