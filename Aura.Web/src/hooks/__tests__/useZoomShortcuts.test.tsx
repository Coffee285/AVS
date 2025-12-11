/**
 * Tests for useZoomShortcuts hook
 * Ensures keyboard shortcuts for zoom controls work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useZoomShortcuts } from '../useZoomShortcuts';
import * as zoomModule from '../../constants/zoom';

describe('useZoomShortcuts', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    document.documentElement.style.removeProperty('--aura-base-font-size');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--aura-base-font-size');
  });

  it('should call zoomIn when Ctrl+Plus is pressed', () => {
    const zoomInSpy = vi.spyOn(zoomModule, 'zoomIn');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(zoomInSpy).toHaveBeenCalled();
    zoomInSpy.mockRestore();
  });

  it('should call zoomIn when Ctrl+= is pressed', () => {
    const zoomInSpy = vi.spyOn(zoomModule, 'zoomIn');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '=',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(zoomInSpy).toHaveBeenCalled();
    zoomInSpy.mockRestore();
  });

  it('should call zoomOut when Ctrl+Minus is pressed', () => {
    const zoomOutSpy = vi.spyOn(zoomModule, 'zoomOut');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '-',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(zoomOutSpy).toHaveBeenCalled();
    zoomOutSpy.mockRestore();
  });

  it('should call resetZoom when Ctrl+0 is pressed', () => {
    const resetZoomSpy = vi.spyOn(zoomModule, 'resetZoom');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '0',
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(resetZoomSpy).toHaveBeenCalled();
    resetZoomSpy.mockRestore();
  });

  it('should call setOptimalZoom when Ctrl+Shift+Plus is pressed', () => {
    const setOptimalZoomSpy = vi.spyOn(zoomModule, 'setOptimalZoom');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(setOptimalZoomSpy).toHaveBeenCalled();
    setOptimalZoomSpy.mockRestore();
  });

  it('should work with Meta key (macOS)', () => {
    const zoomInSpy = vi.spyOn(zoomModule, 'zoomIn');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      metaKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(zoomInSpy).toHaveBeenCalled();
    zoomInSpy.mockRestore();
  });

  it('should prevent default browser zoom behavior', () => {
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not trigger zoom without Ctrl or Meta key', () => {
    const zoomInSpy = vi.spyOn(zoomModule, 'zoomIn');
    renderHook(() => useZoomShortcuts());

    const event = new KeyboardEvent('keydown', {
      key: '+',
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(zoomInSpy).not.toHaveBeenCalled();
    zoomInSpy.mockRestore();
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useZoomShortcuts());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
