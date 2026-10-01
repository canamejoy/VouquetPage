import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  it('exposes its message through a polite status region', () => {
    const { rerender } = render(<LiveRegion message="Rose deleted" />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Rose deleted');
    expect(region).toHaveAttribute('aria-live', 'polite');
    rerender(<LiveRegion message="" />);
    expect(region).toBeEmptyDOMElement();
  });
});
