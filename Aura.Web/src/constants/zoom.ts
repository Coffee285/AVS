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
 * Round to avoid floating point precision issues
 */
function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Apply zoom level to the document
 * Converts zoom percentage to pixel-based clamp expression
 */
export function applyZoom(zoom: number): void {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  // Convert zoom percentage to pixel multiplier
  const multiplier = clamped / 100;

  // Base clamp values from global.css: clamp(18px, calc(0.45vw + 15px), 22px)
  // Round values to avoid floating point precision issues
  const minPx = roundTo(18 * multiplier);
  const maxPx = roundTo(22 * multiplier);
  const vwCoeff = roundTo(0.45 * multiplier, 2);
  const vwBase = roundTo(15 * multiplier);

  // Generate clamp expression that scales with zoom
  const clampValue = `clamp(${minPx}px, calc(${vwCoeff}vw + ${vwBase}px), ${maxPx}px)`;

  document.documentElement.style.setProperty('--aura-base-font-size', clampValue);

  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(clamped));
  } catch {
    // Ignore storage errors
  }

  if (import.meta.env.DEV) {
    console.log(
      `[Zoom] Applied ${clamped}% (multiplier: ${multiplier.toFixed(2)}), CSS: ${clampValue}`
    );
  }

  // Notify listeners of zoom change
  window.dispatchEvent(new Event('zoom-changed'));
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
