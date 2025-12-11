/**
 * Toast Progress Animation Tests
 *
 * Tests for smooth CSS-based progress bar animation
 * with pause/resume functionality
 */

import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useNotifications, NotificationsToaster } from '../components/Notifications/Toasts';

// Wrapper with FluentProvider and Toaster
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FluentProvider theme={webLightTheme}>
    {children}
    <NotificationsToaster toasterId="notifications-toaster" />
  </FluentProvider>
);

describe('Toast Progress Animation', () => {
  it('should create toast with timeout for auto-dismiss', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    const toastId = result.current.showSuccessToast({
      title: 'Test Success',
      message: 'Success message',
      timeout: 5000,
    });

    // Toast should be created with an ID
    expect(toastId).toBeDefined();
    expect(typeof toastId).toBe('string');
  });

  it('should create success toast without timeout', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    const toastId = result.current.showSuccessToast({
      title: 'Test Success',
      message: 'Success message',
      timeout: 0, // No auto-dismiss
    });

    expect(toastId).toBeDefined();
  });

  it('should create error toast with timeout', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    const toastId = result.current.showFailureToast({
      title: 'Test Error',
      message: 'Error message',
      timeout: 5000,
    });

    expect(toastId).toBeDefined();
  });

  it('should support custom timeout values', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Short timeout
    const toast1 = result.current.showSuccessToast({
      title: 'Quick Toast',
      message: 'Dismisses quickly',
      timeout: 1000,
    });

    // Long timeout
    const toast2 = result.current.showSuccessToast({
      title: 'Slow Toast',
      message: 'Dismisses slowly',
      timeout: 10000,
    });

    expect(toast1).toBeDefined();
    expect(toast2).toBeDefined();
    // IDs should be unique (different timestamps or random suffixes)
    expect(typeof toast1).toBe('string');
    expect(typeof toast2).toBe('string');
  });

  it('should verify no setInterval is used for progress animation', () => {
    // This test ensures we're using CSS animation instead of JS setInterval
    // We mock setInterval to track if it's called
    const originalSetInterval = global.setInterval;
    const setIntervalSpy = vi.fn(originalSetInterval);
    global.setInterval = setIntervalSpy as typeof setInterval;

    const { result } = renderHook(() => useNotifications(), { wrapper });

    result.current.showSuccessToast({
      title: 'Test',
      message: 'Message',
      timeout: 5000,
    });

    // setInterval should NOT be called for progress updates
    // (it may be called by FluentUI or other libraries, but not by our toast component)
    // The key is that we're not creating intervals every 100ms for progress
    expect(setIntervalSpy).not.toHaveBeenCalled();

    global.setInterval = originalSetInterval;
  });
});

describe('Toast Progress Animation - Reduced Motion', () => {
  it('should support reduced motion preference detection', () => {
    // Mock matchMedia to simulate reduced motion preference
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });

    const toastId = result.current.showSuccessToast({
      title: 'Test',
      message: 'Message',
      timeout: 5000,
    });

    // Toast should still be created with reduced motion
    expect(toastId).toBeDefined();
  });
});
