import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { expect } from 'vitest';

export const SHAPES = 'path, ellipse, circle, rect, polygon';

export function renderIllustration(name: string, Illustration: ComponentType) {
  const { container } = render(
    <svg>
      <Illustration />
    </svg>,
  );
  const group = container.querySelector('svg > g');
  if (!group) throw new Error(`${name} did not render a <g>`);
  return group;
}

/** Axis-aligned extent of one shape. Paths use absolute coordinates only, so numbers pair up. */
export function extent(shape: Element): { x: number[]; y: number[] } {
  const num = (name: string) => Number(shape.getAttribute(name) ?? 0);
  if (shape.tagName === 'ellipse' || shape.tagName === 'circle') {
    const rx = num(shape.tagName === 'circle' ? 'r' : 'rx');
    const ry = num(shape.tagName === 'circle' ? 'r' : 'ry');
    return { x: [num('cx') - rx, num('cx') + rx], y: [num('cy') - ry, num('cy') + ry] };
  }
  const d = shape.getAttribute('d') ?? '';
  expect(d).not.toMatch(/[a-z]/); // relative commands would break the pairing below
  const values = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  return {
    x: values.filter((_, i) => i % 2 === 0),
    y: values.filter((_, i) => i % 2 === 1),
  };
}
