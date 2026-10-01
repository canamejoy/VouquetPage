import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/domain/catalog';
import { flowerIllustrations } from './flowers';

const SHAPES = 'path, ellipse, circle, rect, polygon';

function renderFlower(id: keyof typeof flowerIllustrations) {
  const Flower = flowerIllustrations[id];
  const { container } = render(
    <svg>
      <Flower />
    </svg>,
  );
  const group = container.querySelector('svg > g');
  if (!group) throw new Error(`${id} did not render a <g>`);
  return group;
}

/** Axis-aligned extent of one shape. Paths use absolute coordinates only, so numbers pair up. */
function extent(shape: Element): { x: number[]; y: number[] } {
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

const flowers = CATALOG.flowers;

// D3 says "about 12". The carnation needs more: its fringed petals are drawn in three tiers.
const MAX_SHAPES: Partial<Record<string, number>> = { carnation: 14 };

describe('flower illustration registry', () => {
  it('has exactly one illustration per catalog flower', () => {
    expect(Object.keys(flowerIllustrations).sort()).toEqual(flowers.map((f) => f.id).sort());
  });
});

describe.each(flowers)('$id illustration', ({ id, size, colors }) => {
  it('renders one decorative group of at most about 12 shapes', () => {
    const group = renderFlower(id);
    const count = group.querySelectorAll(SHAPES).length;
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(MAX_SHAPES[id] ?? 12);
    expect(group.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws inside its catalog size, centred on the origin, without transforms', () => {
    const group = renderFlower(id);
    expect(group.querySelectorAll('[transform]')).toHaveLength(0);
    const shapes = [...group.querySelectorAll(SHAPES)];
    const xs = shapes.flatMap((s) => extent(s).x);
    const ys = shapes.flatMap((s) => extent(s).y);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-size.width / 2);
    expect(Math.max(...xs)).toBeLessThanOrEqual(size.width / 2);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-size.height / 2);
    expect(Math.max(...ys)).toBeLessThanOrEqual(size.height / 2);
    // Fills most of the box, so the canvas scale matches the catalog size.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(size.width * 0.6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(size.height * 0.6);
  });

  if (colors.length > 0) {
    it('takes its colour from currentColor and shades it with translucent overlays', () => {
      const shapes = [...renderFlower(id).querySelectorAll(SHAPES)];
      const fills = shapes.map((s) => s.getAttribute('fill'));
      expect(fills).toContain('currentColor');
      const overlays = shapes.filter((s) => s.getAttribute('fill') !== 'currentColor');
      expect(overlays.length).toBeGreaterThan(0);
      for (const overlay of overlays) {
        expect(['#000', '#fff']).toContain(overlay.getAttribute('fill'));
        expect(Number(overlay.getAttribute('fill-opacity'))).toBeLessThan(1);
      }
      // Without a dark overlay the lightest colour (white) would lose its petal structure.
      expect(overlays.some((s) => s.getAttribute('fill') === '#000')).toBe(true);
    });
  } else {
    it('hard-codes its own colours and ignores currentColor', () => {
      const shapes = [...renderFlower(id).querySelectorAll(SHAPES)];
      for (const shape of shapes) {
        expect(shape.getAttribute('fill')).toMatch(/^#[0-9a-f]{3,6}$/i);
      }
      const distinct = new Set(shapes.map((s) => s.getAttribute('fill')));
      expect(distinct.size).toBeGreaterThanOrEqual(3);
    });
  }
});
