import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DragGhost } from './DragGhost';

describe('DragGhost', () => {
  it('draws the item art at the pointer, hidden from assistive technology', () => {
    render(<DragGhost catalogId="rose" x={120} y={80} />);
    const ghost = screen.getByTestId('drag-ghost');
    expect(ghost).toHaveAttribute('aria-hidden', 'true');
    expect(ghost).toHaveStyle({ left: '120px', top: '80px' });
    expect(ghost.querySelector('path, g, ellipse, circle')).not.toBeNull();
  });
});
