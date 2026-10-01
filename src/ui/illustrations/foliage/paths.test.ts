import { describe, expect, it } from 'vitest';
import { leaf, pinnate, rib } from './paths';

const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

describe('leaf', () => {
  it('emits one closed absolute subpath that reaches its tip', () => {
    const d = leaf(0, 0, 0, 40, 10);
    expect(d).toBe(d.toUpperCase());
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.endsWith('Z')).toBe(true);
    expect(Math.min(...numbers(d).filter((_, i) => i % 2 === 1))).toBe(-40); // 0 degrees is up
  });

  it('turns clockwise with the angle', () => {
    const xs = numbers(leaf(0, 0, 90, 40, 10)).filter((_, i) => i % 2 === 0);
    expect(Math.max(...xs)).toBe(40);
  });

  it('puts a round leaf control point nearer its base than a pointed one', () => {
    const along = (d: string) => Math.abs(numbers(d)[3] ?? 0); // y of the first control point
    expect(along(leaf(0, 0, 0, 40, 10, true))).toBeLessThan(along(leaf(0, 0, 0, 40, 10)));
  });
});

describe('rib', () => {
  it('is a closed tapered strip from the base to the tip', () => {
    const d = rib(0, 0, 0, 100, 3);
    expect(d.match(/M/g)).toHaveLength(1);
    expect(Math.min(...numbers(d).filter((_, i) => i % 2 === 1))).toBe(-100);
  });
});

describe('pinnate', () => {
  const base = {
    x: 0,
    y: 100,
    angle: 0,
    length: 100,
    pairs: 4,
    leafLength: () => 30,
    leafWidth: () => 8,
    spread: () => 60,
  };

  it('draws a leaf per side per pair, or one per pair when alternating', () => {
    expect(pinnate(base).match(/M/g)).toHaveLength(8);
    expect(pinnate({ ...base, alternate: true }).match(/M/g)).toHaveLength(4);
  });

  it('adds a terminal leaf and shrinks every leaf with `shrink`', () => {
    expect(pinnate({ ...base, tip: true }).match(/M/g)).toHaveLength(9);
    const reach = (d: string) =>
      Math.max(
        ...numbers(d)
          .filter((_, i) => i % 2 === 0)
          .map(Math.abs),
      );
    expect(reach(pinnate({ ...base, shrink: 0.5 }))).toBeLessThan(reach(pinnate(base)));
  });
});
