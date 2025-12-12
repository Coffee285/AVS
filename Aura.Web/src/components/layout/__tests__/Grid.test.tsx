/**
 * Tests for Grid Component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Grid } from '../Grid';

describe('Grid', () => {
  it('renders children', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies auto-responsive columns by default', () => {
    render(
      <Grid>
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    });
  });

  it('applies fixed column count when specified', () => {
    render(
      <Grid columns={3}>
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(3, 1fr)',
    });
  });

  it('applies custom minimum column width', () => {
    render(
      <Grid minColumnWidth="300px">
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    });
  });

  it('applies correct gap using design tokens', () => {
    render(
      <Grid gap="lg">
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({ gap: 'var(--space-lg)' });
  });

  it('applies custom row gap', () => {
    render(
      <Grid rowGap="xl">
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({ rowGap: 'var(--space-xl)' });
  });

  it('applies custom column gap', () => {
    render(
      <Grid columnGap="sm">
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({ columnGap: 'var(--space-sm)' });
  });

  it('accepts custom className', () => {
    render(
      <Grid className="custom-class">
        <div>Test</div>
      </Grid>
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('custom-class');
  });

  it('accepts custom test ID', () => {
    render(
      <Grid data-testid="custom-grid">
        <div>Test</div>
      </Grid>
    );

    expect(screen.getByTestId('custom-grid')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Grid ref={ref}>
        <div>Test</div>
      </Grid>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
