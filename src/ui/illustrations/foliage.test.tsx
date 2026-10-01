import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/domain/catalog';
import { foliageIllustrations } from './foliage';
import { extent, renderIllustration, SHAPES } from './svg.testutil';

const foliage = CATALOG.foliage;

describe('foliage illustration registry', () => {
  it('has exactly one illustration per catalog foliage item', () => {
    expect(Object.keys(foliageIllustrations).sort()).toEqual(foliage.map((f) => f.id).sort());
  });
});

describe.each(foliage)('$id illustration', ({ id, size }) => {
  const render = () => renderIllustration(id, foliageIllustrations[id]);

  it('renders one decorative group of at most about 12 shapes', () => {
    const group = render();
    const count = group.querySelectorAll(SHAPES).length;
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(12);
    expect(group.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws inside its catalog size, centred on the origin, without transforms', () => {
    const group = render();
    expect(group.querySelectorAll('[transform]')).toHaveLength(0);
    const shapes = [...group.querySelectorAll(SHAPES)];
    const xs = shapes.flatMap((s) => extent(s).x);
    const ys = shapes.flatMap((s) => extent(s).y);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-size.width / 2);
    expect(Math.max(...xs)).toBeLessThanOrEqual(size.width / 2);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-size.height / 2);
    expect(Math.max(...ys)).toBeLessThanOrEqual(size.height / 2);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(size.width * 0.6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(size.height * 0.6);
  });

  it('hard-codes at least three of its own colours and ignores currentColor', () => {
    const shapes = [...render().querySelectorAll(SHAPES)];
    for (const shape of shapes) {
      expect(shape.getAttribute('fill')).toMatch(/^#[0-9a-f]{3,6}$/i);
    }
    expect(new Set(shapes.map((s) => s.getAttribute('fill'))).size).toBeGreaterThanOrEqual(3);
  });
});
