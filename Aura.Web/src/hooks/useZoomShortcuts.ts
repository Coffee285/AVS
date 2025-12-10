/**
 * Hook for global zoom keyboard shortcuts
 * Handles Ctrl+Plus, Ctrl+Minus, Ctrl+0 for zoom control
 */

import { useEffect, useCallback } from 'react';
import { zoomIn, zoomOut, resetZoom, setOptimalZoom } from '../constants/zoom';

export function useZoomShortcuts() {
  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    resetZoom();
  }, []);

  const handleOptimalZoom = useCallback(() => {
    setOptimalZoom();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support both Windows (Ctrl) and Mac (Cmd)
      if (e.ctrlKey || e.metaKey) {
        // Zoom In: Ctrl/Cmd + Plus or Ctrl/Cmd + =
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();

          // Ctrl+Shift+Plus jumps to optimal (140%)
          if (e.shiftKey) {
            handleOptimalZoom();
          } else {
            handleZoomIn();
          }
        }
        // Zoom Out: Ctrl/Cmd + Minus
        else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        }
        // Reset Zoom: Ctrl/Cmd + 0
        else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleZoomIn, handleZoomOut, handleResetZoom, handleOptimalZoom]);
}
