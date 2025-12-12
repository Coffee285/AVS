/**
 * Container Component
 *
 * A centered container with max-width constraint and consistent padding.
 * Used to wrap page content and maintain readable line lengths.
 *
 * Features:
 * - Configurable max-width from design system tokens
 * - Responsive padding
 * - Automatic centering
 * - TypeScript strict mode compatible
 *
 * @example
 * ```tsx
 * // Standard page container
 * <Container maxWidth="lg" padding="lg">
 *   <PageContent />
 * </Container>
 *
 * // Full-width container with no padding
 * <Container maxWidth="full" padding="none">
 *   <FullBleedContent />
 * </Container>
 * ```
 */

import React, { forwardRef } from 'react';
import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

type PaddingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Children elements */
  children: ReactNode;

  /** Maximum width constraint */
  maxWidth?: ContainerSize;

  /** Padding on left/right */
  padding?: PaddingSize;

  /** Additional CSS classes */
  className?: string;

  /** Custom inline styles (discouraged, prefer className) */
  style?: CSSProperties;

  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Get max-width value from size token
 */
function getMaxWidthValue(size: ContainerSize): string {
  if (size === 'full') return '100%';
  return `var(--container-${size})`;
}

/**
 * Get padding value from size token
 */
function getPaddingValue(size: PaddingSize): string {
  if (size === 'none') return '0';
  return `var(--space-${size})`;
}

/**
 * Container component for page content
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      maxWidth = 'lg',
      padding = 'lg',
      className = '',
      style,
      'data-testid': testId,
      ...restProps
    },
    ref
  ) => {
    const containerStyle: CSSProperties = {
      width: '100%',
      maxWidth: getMaxWidthValue(maxWidth),
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: getPaddingValue(padding),
      paddingRight: getPaddingValue(padding),
      ...style,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyle}
        data-testid={testId || 'container'}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;
