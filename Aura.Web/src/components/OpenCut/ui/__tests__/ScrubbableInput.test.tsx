/**
 * ScrubbableInput Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ScrubbableInput } from '../ScrubbableInput';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<FluentProvider theme={webLightTheme}>{component}</FluentProvider>);
};

describe('ScrubbableInput', () => {
  it('renders with value and label', () => {
    const handleChange = vi.fn();
    renderWithProvider(<ScrubbableInput value={100} onChange={handleChange} label="Scale" />);

    expect(screen.getByText('Scale')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    const handleChange = vi.fn();
    renderWithProvider(
      <ScrubbableInput value={50} onChange={handleChange} suffix="%" label="Opacity" />
    );

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('calls onChange when value is dragged', () => {
    const handleChange = vi.fn();
    renderWithProvider(<ScrubbableInput value={100} onChange={handleChange} step={10} />);

    const valueElement = screen.getByRole('slider');

    fireEvent.mouseDown(valueElement, { clientX: 100 });
    expect(document.body.style.cursor).toBe('ew-resize');

    fireEvent.mouseMove(document, { clientX: 110 });

    fireEvent.mouseUp(document);
    expect(document.body.style.cursor).toBe('');

    expect(handleChange).toHaveBeenCalled();
  });

  it('respects min and max constraints', () => {
    const handleChange = vi.fn();
    renderWithProvider(
      <ScrubbableInput value={50} onChange={handleChange} min={0} max={100} step={1} />
    );

    const valueElement = screen.getByRole('slider');

    fireEvent.mouseDown(valueElement, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 200 });
    fireEvent.mouseUp(document);

    const lastCallValue = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCallValue).toBeLessThanOrEqual(100);
  });

  it('applies correct aria attributes', () => {
    const handleChange = vi.fn();
    renderWithProvider(
      <ScrubbableInput value={50} onChange={handleChange} min={0} max={100} label="Brightness" />
    );

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-label', 'Brightness');
  });
});
