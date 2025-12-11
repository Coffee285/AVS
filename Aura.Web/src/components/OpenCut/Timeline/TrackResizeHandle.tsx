/**
 * TrackResizeHandle Component
 *
 * Provides a draggable handle for resizing individual timeline tracks.
 * Allows users to adjust track height by dragging the bottom edge.
 */

import { makeStyles, tokens } from '@fluentui/react-components';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { openCutTokens } from '../../../styles/designTokens';
import { useOpenCutTimelineStore } from '../../../stores/opencutTimeline';

interface TrackResizeHandleProps {
  trackId: string;
  currentHeight: number;
}

const useStyles = makeStyles({
  resizeHandle: {
    position: 'absolute',
    bottom: '-3px',
    left: 0,
    right: 0,
    height: '6px',
    cursor: 'ns-resize',
    zIndex: 10,
    transition: `background-color ${openCutTokens.animation.duration.fast} ${openCutTokens.animation.easing.easeOut}`,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  resizeHandleActive: {
    backgroundColor: tokens.colorBrandStroke1,
  },
});

export const TrackResizeHandle: FC<TrackResizeHandleProps> = ({ trackId, currentHeight }) => {
  const styles = useStyles();
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const { setTrackHeight } = useOpenCutTimelineStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      startY.current = e.clientY;
      startHeight.current = currentHeight;
    },
    [currentHeight]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(24, Math.min(120, startHeight.current + deltaY));
      setTrackHeight(trackId, newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, trackId, setTrackHeight]);

  return (
    <div
      className={`${styles.resizeHandle} ${isDragging ? styles.resizeHandleActive : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-label="Resize track"
      aria-orientation="horizontal"
    />
  );
};

export default TrackResizeHandle;
