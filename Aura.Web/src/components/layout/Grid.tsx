/**
 * Grid Component
 *
 * A responsive grid layout using CSS Grid.
 * Automatically adjusts columns based on available space.
 *
 * Features:
 * - Auto-responsive columns (fills available space)
 * - Fixed column count
 * - Configurable gap using design tokens
 * - Minimum column width support
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * // Auto-responsive grid (fills as many 250px columns as fit)
 * <Grid minColumnWidth="250px" gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Fixed 3-column grid
 * <Grid columns={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 * ```
 */

import React, { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

type SpacingToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface GridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Children elements to arrange in grid */
  children: ReactNode;

  /** Fixed number of columns (overrides minColumnWidth) */
  columns?: number;

  /** Minimum column width for auto-responsive layout */
  minColumnWidth?: string;

  /** Gap between grid items using design tokens */
  gap?: SpacingToken;

  /** Gap between rows (if different from gap) */
  rowGap?: SpacingToken;

  /** Gap between columns (if different from gap) */
  columnGap?: SpacingToken;

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
 * Grid component for responsive layouts
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      columns,
      minColumnWidth = '250px',
      gap = 'md',
      rowGap,
      columnGap,
      className = '',
      style,
      'data-testid': testId,
      ...restProps
    },
    ref
  ) => {
    // Determine grid-template-columns value
    let gridTemplateColumns: string;
    if (columns !== undefined) {
      // Fixed column count
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
    } else {
      // Auto-responsive: fit as many columns as possible
      gridTemplateColumns = `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`;
    }

    const gridStyle: CSSProperties = {
      display: 'grid',
      gridTemplateColumns,
      gap: getSpacingVar(gap),
      ...(rowGap && { rowGap: getSpacingVar(rowGap) }),
      ...(columnGap && { columnGap: getSpacingVar(columnGap) }),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={gridStyle}
        data-testid={testId || 'grid'}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

export default Grid;
