import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';

const draw = (seed: number, count: number): number[] => {
  const next = mulberry32(seed);
  return Array.from({ length: count }, () => next());
};

describe('mulberry32', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draw(42, 50)).toEqual(draw(42, 50));
  });

  it('pins the first values so the sequence is stable across platforms', () => {
    expect(draw(1, 3)).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
    expect(draw(0, 1)).toEqual([0.26642920868471265]);
  });

  it('gives different sequences for different seeds', () => {
    expect(draw(1, 10)).not.toEqual(draw(2, 10));
  });

  it('keeps every value in [0, 1)', () => {
    for (const seed of [0, 1, 7, 2 ** 31, 2 ** 32 - 1, -5]) {
      for (const value of draw(seed, 500)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
  });

  it('keeps independent generators independent', () => {
    const first = mulberry32(9);
    const second = mulberry32(9);
    const a = [first(), first(), first()];
    second();
    const b = [second(), second()];
    expect(b).toEqual(a.slice(1));
  });

  it('is spread evenly enough to drive jitter', () => {
    const values = draw(123, 4000);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
    const lowerHalf = values.filter((value) => value < 0.5).length;
    expect(lowerHalf).toBeGreaterThan(1900);
    expect(lowerHalf).toBeLessThan(2100);
  });
});
