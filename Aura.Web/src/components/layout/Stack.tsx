/**
 * Stack Component
 *
 * A flexible layout component for arranging children in a vertical or horizontal stack.
 * Uses CSS Flexbox with consistent spacing from the design system.
 *
 * Features:
 * - Vertical or horizontal direction
 * - Configurable gap using design tokens
 * - Alignment and justification options
 * - Wrapping support
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * // Vertical stack with medium gap
 * <Stack direction="vertical" gap="md">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Stack>
 *
 * // Horizontal stack with space-between
 * <Stack direction="horizontal" gap="sm" justify="space-between">
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </Stack>
 * ```
 */

import React, { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type FlexDirection = 'vertical' | 'horizontal';

type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

type FlexJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Children elements to stack */
  children: ReactNode;

  /** Stack direction */
  direction?: FlexDirection;

  /** Gap between children using design system tokens */
  gap?: SpacingToken;

  /** Alignment of children on the cross axis */
  align?: FlexAlign;

  /** Justification of children on the main axis */
  justify?: FlexJustify;

  /** Whether children should wrap */
  wrap?: boolean;

  /** Whether to fill available space */
  fill?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Custom inline styles (discouraged, prefer className) */
  style?: CSSProperties;

  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Convert design token to CSS variable
 */
function getSpacingVar(token: SpacingToken): string {
  return `var(--space-${token})`;
}

/**
 * Convert FlexAlign to CSS value
 */
function getAlignValue(align: FlexAlign): string {
  const map: Record<FlexAlign, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  };
  return map[align];
}

/**
 * Convert FlexJustify to CSS value
 */
function getJustifyValue(justify: FlexJustify): string {
  const map: Record<FlexJustify, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  };
  return map[justify];
}

/**
 * Stack component for flexible layouts
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      direction = 'vertical',
      gap = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      fill = false,
      className = '',
      style,
      'data-testid': testId,
      ...restProps
    },
    ref
  ) => {
    const flexDirection = direction === 'vertical' ? 'column' : 'row';

    const stackStyle: CSSProperties = {
      display: 'flex',
      flexDirection,
      gap: getSpacingVar(gap),
      alignItems: getAlignValue(align),
      justifyContent: getJustifyValue(justify),
      flexWrap: wrap ? 'wrap' : 'nowrap',
      ...(fill && { flex: 1, minWidth: 0, minHeight: 0 }),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={stackStyle}
        data-testid={testId || 'stack'}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

export default Stack;
