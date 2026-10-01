import { describe, expect, it } from 'vitest';
import { defaultAnchor } from './defaultAnchor';
import { MODEL_BOUNDS } from './point';

const BASE = { x: 0, y: -540 };
// The design rounds 34 * sqrt(23) = 163.06 down to 163.
const MAX_OFFSET = 34 * Math.sqrt(23);

describe('defaultAnchor', () => {
  it('starts on the base anchor for the first element', () => {
    expect(defaultAnchor(0)).toEqual(BASE);
  });

  it('follows the golden-angle spiral r = 34 * sqrt(k)', () => {
    const { x, y } = defaultAnchor(4);
    const theta = (4 * 137.508 * Math.PI) / 180;
    expect(x).toBeCloseTo(68 * Math.cos(theta), 6);
    expect(y).toBeCloseTo(-540 + 68 * Math.sin(theta), 6);
  });

  it('never repeats the previous position within a cycle and wraps every 24 elements', () => {
    const cycle = Array.from({ length: 24 }, (_, count) => defaultAnchor(count));
    expect(new Set(cycle.map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`)).size).toBe(24);
    expect(defaultAnchor(24)).toEqual(defaultAnchor(0));
    expect(defaultAnchor(59)).toEqual(defaultAnchor(11));
  });

  it('stays within about 163 units of the base and inside the model bounds', () => {
    for (let count = 0; count < 60; count += 1) {
      const { x, y } = defaultAnchor(count);
      expect(Math.hypot(x - BASE.x, y - BASE.y)).toBeLessThanOrEqual(MAX_OFFSET);
      expect(x).toBeGreaterThanOrEqual(MODEL_BOUNDS.minX);
      expect(x).toBeLessThanOrEqual(MODEL_BOUNDS.maxX);
      expect(y).toBeGreaterThanOrEqual(MODEL_BOUNDS.minY);
      expect(y).toBeLessThanOrEqual(MODEL_BOUNDS.maxY);
    }
  });
});
