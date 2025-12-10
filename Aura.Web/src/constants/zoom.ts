/**
 * Zoom constants for UI scaling
 * Used across ZoomControls, menu items, and keyboard shortcuts
 */

export const MIN_ZOOM = 80;
export const MAX_ZOOM = 180;
export const DEFAULT_ZOOM = 140;
export const STEP = 10;
export const ZOOM_STORAGE_KEY = 'aura-ui-zoom';

/**
 * Apply zoom level to the document
 */
export function applyZoom(zoom: number): void {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  document.documentElement.style.setProperty('--aura-base-font-size', `${clamped}%`);
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get current zoom level from localStorage or return default
 */
export function getCurrentZoom(): number {
  try {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : DEFAULT_ZOOM;
    return Number.isFinite(parsed) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsed)) : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM;
  }
}

/**
 * Zoom in by STEP amount
 */
export function zoomIn(): number {
  const current = getCurrentZoom();
  const newZoom = Math.min(MAX_ZOOM, current + STEP);
  applyZoom(newZoom);
  return newZoom;
}

/**
 * Zoom out by STEP amount
 */
export function zoomOut(): number {
  const current = getCurrentZoom();
  const newZoom = Math.max(MIN_ZOOM, current - STEP);
  applyZoom(newZoom);
  return newZoom;
}

/**
 * Reset zoom to 100% (actual size)
 */
export function resetZoom(): number {
  const resetValue = 100;
  applyZoom(resetValue);
  return resetValue;
}

/**
 * Set zoom to optimal default (140%)
 */
export function setOptimalZoom(): number {
  applyZoom(DEFAULT_ZOOM);
  return DEFAULT_ZOOM;
}
