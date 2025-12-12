/**
 * Spacer Component
 *
 * An explicit spacing element for creating gaps in layouts.
 * Useful for adding space without modifying parent container gaps.
 *
 * Features:
 * - Vertical or horizontal spacing
 * - Uses design system spacing tokens
 * - Minimal and focused
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * // Add vertical space between sections
 * <Section1 />
 * <Spacer size="xl" />
 * <Section2 />
 *
 * // Add horizontal space inline
 * <Button>Cancel</Button>
 * <Spacer size="md" direction="horizontal" />
 * <Button>Save</Button>
 * ```
 */

import React, { forwardRef } from 'react';
import type { HTMLAttributes, CSSProperties } from 'react';

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

type Direction = 'vertical' | 'horizontal';

export interface SpacerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  /** Size of the spacer using design system tokens */
  size: SpacingToken;

  /** Direction of spacing */
  direction?: Direction;

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
 * Spacer component for explicit spacing
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, direction = 'vertical', className = '', style, 'data-testid': testId, ...restProps }, ref) => {
    const spacerStyle: CSSProperties = {
      width: direction === 'horizontal' ? getSpacingVar(size) : undefined,
      height: direction === 'vertical' ? getSpacingVar(size) : undefined,
      flexShrink: 0,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={spacerStyle}
        data-testid={testId || 'spacer'}
        aria-hidden="true"
        {...restProps}
      />
    );
  }
);

Spacer.displayName = 'Spacer';

export default Spacer;
