/**
 * useZoom Hook
 * 
 * Provides access to current zoom level and zoom state.
 * Components can use this to be zoom-aware and adjust their behavior
 * based on the current UI zoom level.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { zoom, isZoomed } = useZoom();
 *   
 *   return (
 *     <div>
 *       Current zoom: {zoom}%
 *       {isZoomed && <p>UI is zoomed</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getCurrentZoom, ZOOM_STORAGE_KEY } from '../constants/zoom';

export interface ZoomState {
  /** Current zoom level (80-180) */
  zoom: number;
  
  /** Whether the UI is zoomed (not at 100%) */
  isZoomed: boolean;
  
  /** Whether the UI is zoomed in (>100%) */
  isZoomedIn: boolean;
  
  /** Whether the UI is zoomed out (<100%) */
  isZoomedOut: boolean;
}

/**
 * Hook to access current zoom state
 * Subscribes to zoom changes via storage events
 */
export function useZoom(): ZoomState {
  const [zoom, setZoom] = useState<number>(getCurrentZoom);

  // Listen for zoom changes (via localStorage storage event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ZOOM_STORAGE_KEY && e.newValue) {
        const newZoom = parseInt(e.newValue, 10);
        if (Number.isFinite(newZoom)) {
          setZoom(newZoom);
        }
      }
    };

    // Also listen for custom zoom change events (for same-window updates)
    const handleZoomChange = () => {
      setZoom(getCurrentZoom());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('zoom-changed', handleZoomChange);

    // Set initial zoom
    setZoom(getCurrentZoom());

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zoom-changed', handleZoomChange);
    };
  }, []);

  return {
    zoom,
    isZoomed: zoom !== 100,
    isZoomedIn: zoom > 100,
    isZoomedOut: zoom < 100,
  };
}

/**
 * Hook to trigger callback when zoom changes
 * Useful for components that need to react to zoom changes
 * 
 * @example
 * ```tsx
 * useZoomChange((newZoom) => {
 *   console.log('Zoom changed to', newZoom);
 *   // Adjust component behavior based on zoom
 * });
 * ```
 */
export function useZoomChange(callback: (zoom: number) => void): void {
  const { zoom } = useZoom();

  useEffect(() => {
    callback(zoom);
  }, [zoom, callback]);
}

/**
 * Hook to get a zoom-aware value
 * Scales a value based on current zoom level
 * 
 * @example
 * ```tsx
 * // Get a size that scales with zoom
 * const scaledSize = useZoomAwareValue(16); // 16px at 100%, 22.4px at 140%
 * ```
 */
export function useZoomAwareValue(baseValue: number): number {
  const { zoom } = useZoom();
  return (baseValue * zoom) / 100;
}

// Helper function to dispatch zoom change event
// This should be called by zoom.ts functions after changing zoom
export function notifyZoomChanged(): void {
  window.dispatchEvent(new Event('zoom-changed'));
}
