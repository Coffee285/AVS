/**
 * Unit tests for useDoubleClick hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDoubleClick } from '../useDoubleClick';

describe('useDoubleClick', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call onDoubleClick on double click', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    act(() => {
      result.current(mockEvent);
      result.current(mockEvent);
    });

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onSingleClick).not.toHaveBeenCalled();
  });

  it('should call onSingleClick after delay on single click', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    act(() => {
      result.current(mockEvent);
    });

    expect(onSingleClick).not.toHaveBeenCalled();
    expect(onDoubleClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSingleClick).toHaveBeenCalledTimes(1);
    expect(onDoubleClick).not.toHaveBeenCalled();
  });

  it('should not call onSingleClick if double-clicked before delay', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onDoubleClick).toHaveBeenCalledTimes(1);
    expect(onSingleClick).not.toHaveBeenCalled();
  });

  it('should work without onSingleClick callback', () => {
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onDoubleClick).not.toHaveBeenCalled();
  });

  it('should use custom delay', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 500,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSingleClick).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSingleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple double-clicks in sequence', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    // First double-click
    act(() => {
      result.current(mockEvent);
      result.current(mockEvent);
    });

    expect(onDoubleClick).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Second double-click
    act(() => {
      result.current(mockEvent);
      result.current(mockEvent);
    });

    expect(onDoubleClick).toHaveBeenCalledTimes(2);
    expect(onSingleClick).not.toHaveBeenCalled();
  });

  it('should reset click count after successful single click', () => {
    const onSingleClick = vi.fn();
    const onDoubleClick = vi.fn();
    const { result } = renderHook(() =>
      useDoubleClick({
        onSingleClick,
        onDoubleClick,
        delay: 250,
      })
    );

    const mockEvent = { clientX: 0, clientY: 0 } as React.MouseEvent;

    // First single click
    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSingleClick).toHaveBeenCalledTimes(1);

    // Second single click
    act(() => {
      result.current(mockEvent);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onSingleClick).toHaveBeenCalledTimes(2);
    expect(onDoubleClick).not.toHaveBeenCalled();
  });
});
