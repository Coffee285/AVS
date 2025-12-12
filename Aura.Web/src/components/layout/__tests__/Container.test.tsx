/**
 * Tests for Container Component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Container } from '../Container';

describe('Container', () => {
  it('renders children', () => {
    render(
      <Container>
        <div>Content</div>
      </Container>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies default max-width (lg)', () => {
    render(
      <Container>
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({ maxWidth: 'var(--container-lg)' });
  });

  it('applies custom max-width', () => {
    render(
      <Container maxWidth="xl">
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({ maxWidth: 'var(--container-xl)' });
  });

  it('applies full width when specified', () => {
    render(
      <Container maxWidth="full">
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({ maxWidth: '100%' });
  });

  it('applies default padding (lg)', () => {
    render(
      <Container>
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({
      paddingLeft: 'var(--space-lg)',
      paddingRight: 'var(--space-lg)',
    });
  });

  it('applies custom padding', () => {
    render(
      <Container padding="xl">
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({
      paddingLeft: 'var(--space-xl)',
      paddingRight: 'var(--space-xl)',
    });
  });

  it('applies no padding when specified', () => {
    render(
      <Container padding="none">
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({
      paddingLeft: '0',
      paddingRight: '0',
    });
  });

  it('centers content with auto margins', () => {
    render(
      <Container>
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveStyle({
      marginLeft: 'auto',
      marginRight: 'auto',
    });
  });

  it('accepts custom className', () => {
    render(
      <Container className="custom-class">
        <div>Test</div>
      </Container>
    );

    const container = screen.getByTestId('container');
    expect(container).toHaveClass('custom-class');
  });

  it('accepts custom test ID', () => {
    render(
      <Container data-testid="custom-container">
        <div>Test</div>
      </Container>
    );

    expect(screen.getByTestId('custom-container')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Container ref={ref}>
        <div>Test</div>
      </Container>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
