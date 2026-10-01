import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/domain/catalog';
import { MODEL_BOUNDS } from '@/domain/geometry';
import { extent, renderIllustration, SHAPES } from './svg.testutil';
import { wrappingIllustrations } from './wrappings';

const wrappings = CATALOG.wrappings;
const HEX = /^#[0-9a-f]{3,6}$/i;

describe('wrapping illustration registry', () => {
  it('has exactly one back and front pair per catalog wrapping', () => {
    expect(Object.keys(wrappingIllustrations).sort()).toEqual(wrappings.map((w) => w.id).sort());
  });
});

describe.each(wrappings)('$id illustration', ({ id }) => {
  const parts = ['Back', 'Front'] as const;

  it.each(parts)('renders a decorative %s group of at most about 14 shapes', (part) => {
    const group = renderIllustration(id, wrappingIllustrations[id][part]);
    const count = group.querySelectorAll(SHAPES).length;
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(14);
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.querySelectorAll('[transform]')).toHaveLength(0);
  });

  it.each(parts)('draws its %s inside the model bounds with fixed colours', (part) => {
    const shapes = [
      ...renderIllustration(id, wrappingIllustrations[id][part]).querySelectorAll(SHAPES),
    ];
    const xs = shapes.flatMap((s) => extent(s).x);
    const ys = shapes.flatMap((s) => extent(s).y);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(MODEL_BOUNDS.minX);
    expect(Math.max(...xs)).toBeLessThanOrEqual(MODEL_BOUNDS.maxX);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(MODEL_BOUNDS.minY);
    expect(Math.max(...ys)).toBeLessThanOrEqual(MODEL_BOUNDS.maxY);
    for (const shape of shapes) {
      const fill = shape.getAttribute('fill');
      expect(fill === 'none' ? shape.getAttribute('stroke') : fill).toMatch(HEX);
    }
  });

  it('wraps the binding point: back rises behind the blooms, front sits below them', () => {
    const bounds = (part: 'Back' | 'Front') => {
      const shapes = [
        ...renderIllustration(id, wrappingIllustrations[id][part]).querySelectorAll(SHAPES),
      ];
      const ys = shapes.flatMap((s) => extent(s).y);
      const xs = shapes.flatMap((s) => extent(s).x);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    };
    const back = bounds('Back');
    const front = bounds('Front');
    expect(back.minY).toBeLessThan(front.minY);
    expect(back.minY).toBeGreaterThanOrEqual(-600);
    expect(front.minY).toBeGreaterThanOrEqual(-400);
    expect(back.maxX - back.minX).toBeGreaterThan(500);
    expect(front.maxY).toBeGreaterThan(150);
    expect(front.minX).toBeLessThan(0);
    expect(front.maxX).toBeGreaterThan(0);
  });
});
