/**
 * Tests for Stack Component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Stack } from '../Stack';

describe('Stack', () => {
  it('renders children', () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies vertical direction by default', () => {
    render(
      <Stack>
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ flexDirection: 'column' });
  });

  it('applies horizontal direction when specified', () => {
    render(
      <Stack direction="horizontal">
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ flexDirection: 'row' });
  });

  it('applies correct gap using design tokens', () => {
    render(
      <Stack gap="lg">
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ gap: 'var(--space-lg)' });
  });

  it('applies custom alignment', () => {
    render(
      <Stack align="center">
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ alignItems: 'center' });
  });

  it('applies custom justification', () => {
    render(
      <Stack justify="space-between">
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ justifyContent: 'space-between' });
  });

  it('enables wrapping when wrap prop is true', () => {
    render(
      <Stack wrap>
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ flexWrap: 'wrap' });
  });

  it('applies fill style when fill prop is true', () => {
    render(
      <Stack fill>
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveStyle({ flex: 1 });
  });

  it('accepts custom className', () => {
    render(
      <Stack className="custom-class">
        <div>Test</div>
      </Stack>
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('custom-class');
  });

  it('accepts custom test ID', () => {
    render(
      <Stack data-testid="custom-stack">
        <div>Test</div>
      </Stack>
    );

    expect(screen.getByTestId('custom-stack')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Stack ref={ref}>
        <div>Test</div>
      </Stack>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
