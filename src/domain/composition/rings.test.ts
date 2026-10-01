import { describe, expect, it } from 'vitest';
import { MODEL_BOUNDS } from '../geometry';
import {
  flowerRingCount,
  foliageOuterRing,
  ringPoint,
  ringScale,
  ringSlots,
  ringSpacing,
} from './rings';

describe('flowerRingCount', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [7, 1],
    [8, 2],
    [19, 2],
    [20, 3],
    [37, 3],
    [38, 4],
    [60, 4],
  ])('%i flowers need %i rings', (flowers, rings) => {
    expect(flowerRingCount(flowers)).toBe(rings);
  });
});

describe('foliageOuterRing', () => {
  it.each([
    [0, 0, 0],
    [0, 1, 1],
    [0, 6, 1],
    [0, 7, 2],
    [0, 59, 4],
    [1, 12, 2],
    [1, 13, 3],
    [3, 40, 5],
  ])('after %i flower rings, %i foliage items end on ring %i', (flowerRings, foliage, outer) => {
    expect(foliageOuterRing(flowerRings, foliage)).toBe(outer);
  });

  it('never needs more than five rings for any split of 60 items', () => {
    for (let flowers = 0; flowers <= 60; flowers += 1) {
      const outer = foliageOuterRing(flowerRingCount(flowers), 60 - flowers);
      expect(outer).toBeLessThanOrEqual(5);
    }
  });
});

describe('ringSpacing', () => {
  it('uses dMax without dividing by zero when there are no rings', () => {
    expect(ringSpacing(0, 145, 440)).toBe(145);
  });

  it('shrinks the spacing so the outer ring stays within the limit', () => {
    expect(ringSpacing(2, 145, 440)).toBe(145);
    expect(ringSpacing(4, 145, 440)).toBe(110);
    expect(ringSpacing(5, 145, 440)).toBe(88);
    expect(ringSpacing(5, 115, 300)).toBe(60);
  });
});

describe('ringSlots', () => {
  it('returns nothing for no items', () => {
    expect(ringSlots(0, 1, true)).toEqual([]);
  });

  it('puts a single item at the centre', () => {
    expect(ringSlots(1, 1, true)).toEqual([{ ring: 0, angle: 0 }]);
  });

  it('fills ring one with six slots starting at 0 degrees', () => {
    const slots = ringSlots(7, 1, true);
    expect(slots[0]).toEqual({ ring: 0, angle: 0 });
    expect(slots.slice(1).map((slot) => slot.angle)).toEqual([0, 60, 120, 180, 240, 300]);
  });

  it('spreads a partly filled odd ring evenly from 0 degrees', () => {
    const slots = ringSlots(4, 1, true);
    expect(slots.slice(1).map((slot) => slot.angle)).toEqual([0, 120, 240]);
  });

  it('spreads a partly filled even ring evenly from half a step', () => {
    const slots = ringSlots(9, 1, true);
    expect(slots.slice(7)).toEqual([
      { ring: 2, angle: 90 },
      { ring: 2, angle: 270 },
    ]);
  });

  it('starts foliage on its own first ring and never uses the centre', () => {
    expect(ringSlots(3, 2, false)).toEqual([
      { ring: 2, angle: 60 },
      { ring: 2, angle: 180 },
      { ring: 2, angle: 300 },
    ]);
  });

  it('overflows into the next ring after a full one', () => {
    const slots = ringSlots(13, 1, false);
    expect(slots.filter((slot) => slot.ring === 1)).toHaveLength(6);
    expect(slots.filter((slot) => slot.ring === 2)).toHaveLength(7);
  });

  it('never places more than 6k slots on ring k and returns exactly count slots', () => {
    for (const count of [1, 5, 6, 7, 18, 19, 37, 38, 60]) {
      const slots = ringSlots(count, 1, true);
      expect(slots).toHaveLength(count);
      for (let ring = 1; ring <= 5; ring += 1) {
        expect(slots.filter((slot) => slot.ring === ring).length).toBeLessThanOrEqual(6 * ring);
      }
    }
  });
});

describe('ringPoint', () => {
  const centre = { x: 0, y: -540 };

  it('returns the centre for ring zero', () => {
    expect(ringPoint(centre, { ring: 0, angle: 0 }, 100)).toEqual(centre);
  });

  it('measures angles clockwise from up at radius ring times d', () => {
    const up = ringPoint(centre, { ring: 1, angle: 0 }, 100);
    expect(up.x).toBeCloseTo(0);
    expect(up.y).toBeCloseTo(-640);
    const right = ringPoint(centre, { ring: 2, angle: 90 }, 100);
    expect(right.x).toBeCloseTo(200);
    expect(right.y).toBeCloseTo(-540);
  });
});

describe('ringScale', () => {
  it('scales the template factor by the spacing ratio', () => {
    expect(ringScale(1, 145, 145)).toBe(1);
    expect(ringScale(0.8, 115, 115)).toBe(0.8);
  });

  it('applies the 0.4 floor after the template factor', () => {
    expect(ringScale(0.8, 60, 115)).toBe(0.42);
    expect(ringScale(0.8, 30, 115)).toBe(0.4);
  });
});

describe('ring system envelope', () => {
  const centre = { x: 0, y: -540 };

  it.each([
    ['Round', 145, 440],
    ['Compact', 115, 300],
  ])(
    '%s keeps every anchor inside the bounds for every split of up to 60 items',
    (_name, dMax, rLimit) => {
      for (let flowers = 0; flowers <= 60; flowers += 1) {
        for (let foliage = 0; foliage <= 60 - flowers; foliage += 1) {
          if (flowers + foliage === 0) continue;
          const rings = flowerRingCount(flowers);
          const outer = foliageOuterRing(rings, foliage);
          const d = ringSpacing(outer, dMax, rLimit);
          const slots = [...ringSlots(flowers, 1, true), ...ringSlots(foliage, rings + 1, false)];
          expect(slots).toHaveLength(flowers + foliage);
          for (const slot of slots) {
            const point = ringPoint(centre, slot, d);
            expect(Math.hypot(point.x - centre.x, point.y - centre.y)).toBeLessThanOrEqual(
              rLimit + 1e-9,
            );
            expect(point.x).toBeGreaterThanOrEqual(MODEL_BOUNDS.minX);
            expect(point.x).toBeLessThanOrEqual(MODEL_BOUNDS.maxX);
            expect(point.y).toBeGreaterThanOrEqual(MODEL_BOUNDS.minY);
            expect(point.y).toBeLessThanOrEqual(MODEL_BOUNDS.maxY);
          }
        }
      }
    },
  );
});
