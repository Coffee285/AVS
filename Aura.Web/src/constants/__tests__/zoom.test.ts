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
    it('should set CSS custom property to the provided zoom level', () => {
      applyZoom(120);
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      expect(value).toBe('120%');
    });

    it('should persist zoom level to localStorage', () => {
      applyZoom(130);
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe('130');
    });

    it('should clamp zoom to minimum value', () => {
      applyZoom(50); // Below MIN_ZOOM (80)
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      expect(value).toBe(`${MIN_ZOOM}%`);
      expect(localStorage.getItem(ZOOM_STORAGE_KEY)).toBe(String(MIN_ZOOM));
    });

    it('should clamp zoom to maximum value', () => {
      applyZoom(200); // Above MAX_ZOOM (180)
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      expect(value).toBe(`${MAX_ZOOM}%`);
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

    it('should update CSS custom property to 100%', () => {
      applyZoom(180);
      resetZoom();
      const value = document.documentElement.style.getPropertyValue('--aura-base-font-size');
      expect(value).toBe('100%');
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
