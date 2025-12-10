/**
 * useDoubleClick Hook
 *
 * Distinguishes between single and double clicks on the same element.
 * Useful for implementing professional NLE behaviors where single-click selects
 * and double-click performs an action.
 */

import { useCallback, useRef } from 'react';

export interface UseDoubleClickOptions {
  onSingleClick?: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  delay?: number;
}

/**
 * Hook to handle single and double click events distinctly.
 *
 * @param options - Configuration options
 * @param options.onSingleClick - Callback for single click (optional)
 * @param options.onDoubleClick - Callback for double click (required)
 * @param options.delay - Delay in ms to distinguish between clicks (default: 250)
 * @returns Click handler function
 *
 * @example
 * ```tsx
 * const handleClick = useDoubleClick({
 *   onSingleClick: (e) => selectItem(item.id),
 *   onDoubleClick: (e) => openItem(item.id),
 * });
 *
 * <div onClick={handleClick}>Item</div>
 * ```
 */
export function useDoubleClick({
  onSingleClick,
  onDoubleClick,
  delay = 250,
}: UseDoubleClickOptions) {
  const clickCount = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      clickCount.current += 1;

      if (clickCount.current === 1) {
        timerRef.current = setTimeout(() => {
          if (clickCount.current === 1) {
            onSingleClick?.(e);
          }
          clickCount.current = 0;
        }, delay);
      } else if (clickCount.current === 2) {
        if (timerRef.current) clearTimeout(timerRef.current);
        clickCount.current = 0;
        onDoubleClick(e);
      }
    },
    [onSingleClick, onDoubleClick, delay]
  );

  return handleClick;
}
