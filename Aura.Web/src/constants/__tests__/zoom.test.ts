/**
 * Tests for zoom functionality
 * Ensures UI zoom controls work correctly with proper bounds and persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  applyZoom,
  getCurrentZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  setOptimalZoom,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  STEP,
  ZOOM_STORAGE_KEY,
} from '../zoom';

describe('Zoom Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset CSS custom property
    document.documentElement.style.removeProperty('--aura-base-font-size');
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    document.documentElement.style.removeProperty('--aura-base-font-size');
  });

  describe('applyZoom', () => {
    it('should set CSS custom property with pixel-based clamp expression', () => {
      applyZoom(100);
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      // At 100%, multiplier is 1.0, so values are: clamp(18px, calc(0.45vw + 15px), 22px)
      expect(value).toBe('clamp(18px, calc(0.45vw + 15px), 22px)');
    });

    it('should scale clamp values proportionally with zoom', () => {
      applyZoom(120);
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      // At 120%, multiplier is 1.2, rounded values: clamp(21.6px, calc(0.54vw + 18px), 26.4px)
      expect(value).toContain('clamp(');
      expect(value).toContain('21.6px');
      expect(value).toContain('0.54vw');
      expect(value).toContain('18px');
      expect(value).toContain('26.4px');
    });

    it('should persist zoom level to localStorage', () => {
      applyZoom(130);
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe('130');
    });

    it('should clamp zoom to minimum value', () => {
      applyZoom(50); // Below MIN_ZOOM (80)
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      // At 80%, multiplier is 0.8, rounded values: clamp(14.4px, calc(0.36vw + 12px), 17.6px)
      expect(value).toContain('clamp(');
      expect(value).toContain('14.4px');
      expect(value).toContain('0.36vw');
      expect(value).toContain('12px');
      expect(value).toContain('17.6px');
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe(String(MIN_ZOOM));
    });

    it('should clamp zoom to maximum value', () => {
      applyZoom(200); // Above MAX_ZOOM (180)
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      // At 180%, multiplier is 1.8, so: clamp(32.4px, calc(0.81vw + 27px), 39.6px)
      expect(value).toBe('clamp(32.4px, calc(0.81vw + 27px), 39.6px)');
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe(String(MAX_ZOOM));
    });
  });

  describe('getCurrentZoom', () => {
    it('should return DEFAULT_ZOOM when localStorage is empty', () => {
      const zoom = getCurrentZoom();
      expect(zoom).toBe(DEFAULT_ZOOM);
    });

    it('should return stored zoom level from localStorage', () => {
      localStorage.setItem(ZOOM_STORAGE_KEY, '150');
      const zoom = getCurrentZoom();
      expect(zoom).toBe(150);
    });

    it('should clamp stored value to valid range', () => {
      localStorage.setItem(ZOOM_STORAGE_KEY, '250'); // Above MAX_ZOOM
      const zoom = getCurrentZoom();
      expect(zoom).toBe(MAX_ZOOM);
    });

    it('should return DEFAULT_ZOOM for invalid stored values', () => {
      localStorage.setItem(ZOOM_STORAGE_KEY, 'invalid');
      const zoom = getCurrentZoom();
      expect(zoom).toBe(DEFAULT_ZOOM);
    });
  });

  describe('zoomIn', () => {
    it('should increase zoom by STEP amount', () => {
      applyZoom(100);
      const newZoom = zoomIn();
      expect(newZoom).toBe(100 + STEP);
      expect(getCurrentZoom()).toBe(100 + STEP);
    });

    it('should not exceed MAX_ZOOM', () => {
      applyZoom(MAX_ZOOM);
      const newZoom = zoomIn();
      expect(newZoom).toBe(MAX_ZOOM);
    });

    it('should properly increment from current zoom level', () => {
      applyZoom(120);
      const newZoom = zoomIn();
      expect(newZoom).toBe(130);
    });
  });

  describe('zoomOut', () => {
    it('should decrease zoom by STEP amount', () => {
      applyZoom(100);
      const newZoom = zoomOut();
      expect(newZoom).toBe(100 - STEP);
      expect(getCurrentZoom()).toBe(100 - STEP);
    });

    it('should not go below MIN_ZOOM', () => {
      applyZoom(MIN_ZOOM);
      const newZoom = zoomOut();
      expect(newZoom).toBe(MIN_ZOOM);
    });

    it('should properly decrement from current zoom level', () => {
      applyZoom(120);
      const newZoom = zoomOut();
      expect(newZoom).toBe(110);
    });
  });

  describe('resetZoom', () => {
    it('should reset zoom to 100%', () => {
      applyZoom(150);
      const newZoom = resetZoom();
      expect(newZoom).toBe(100);
      expect(getCurrentZoom()).toBe(100);
    });

    it('should update CSS custom property with base clamp values', () => {
      applyZoom(180);
      resetZoom();
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      // At 100%, should use base values: clamp(18px, calc(0.45vw + 15px), 22px)
      expect(value).toBe('clamp(18px, calc(0.45vw + 15px), 22px)');
    });
  });

  describe('setOptimalZoom', () => {
    it('should set zoom to DEFAULT_ZOOM', () => {
      applyZoom(100);
      const newZoom = setOptimalZoom();
      expect(newZoom).toBe(DEFAULT_ZOOM);
      expect(getCurrentZoom()).toBe(DEFAULT_ZOOM);
    });
  });

  describe('Zoom Persistence', () => {
    it('should persist zoom across function calls', () => {
      zoomIn();
      const zoom1 = getCurrentZoom();
      zoomIn();
      const zoom2 = getCurrentZoom();
      expect(zoom2).toBe(zoom1 + STEP);
    });

    it('should persist zoom to localStorage', () => {
      applyZoom(125);
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe('125');

      // Simulate app restart by getting zoom from localStorage
      const restoredZoom = getCurrentZoom();
      expect(restoredZoom).toBe(125);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple zoom in operations at max', () => {
      applyZoom(MAX_ZOOM - STEP);
      zoomIn(); // Should reach MAX_ZOOM
      const zoom1 = getCurrentZoom();
      zoomIn(); // Should stay at MAX_ZOOM
      const zoom2 = getCurrentZoom();
      expect(zoom1).toBe(MAX_ZOOM);
      expect(zoom2).toBe(MAX_ZOOM);
    });

    it('should handle multiple zoom out operations at min', () => {
      applyZoom(MIN_ZOOM + STEP);
      zoomOut(); // Should reach MIN_ZOOM
      const zoom1 = getCurrentZoom();
      zoomOut(); // Should stay at MIN_ZOOM
      const zoom2 = getCurrentZoom();
      expect(zoom1).toBe(MIN_ZOOM);
      expect(zoom2).toBe(MIN_ZOOM);
    });
  });
});
