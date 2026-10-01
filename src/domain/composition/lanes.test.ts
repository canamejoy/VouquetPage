import { describe, expect, it } from 'vitest';
import { bezierOffsetPoint, bezierPoint, bezierTangentAngle, laneCount, laneSlots } from './lanes';
import type { QuadraticBezier } from './lanes';

/** With the control point at the midpoint, the curve is the segment traversed at constant speed. */
const line: QuadraticBezier = {
  start: { x: 0, y: 0 },
  control: { x: 50, y: 0 },
  end: { x: 100, y: 0 },
};
const bend: QuadraticBezier = {
  start: { x: 0, y: 0 },
  control: { x: 0, y: -100 },
  end: { x: 100, y: -100 },
};

describe('laneCount', () => {
  it.each([
    [0, 0],
    [1, 1],
    [6, 1],
    [7, 2],
    [12, 2],
    [13, 3],
    [60, 3],
  ])('%i items use %i lanes', (items, lanes) => {
    expect(laneCount(items)).toBe(lanes);
  });
});

describe('bezier helpers', () => {
  it('evaluates the curve', () => {
    expect(bezierPoint(line, 0.25)).toEqual({ x: 25, y: 0 });
    expect(bezierPoint(bend, 0)).toEqual({ x: 0, y: 0 });
    expect(bezierPoint(bend, 1)).toEqual({ x: 100, y: -100 });
  });

  it('gives the tangent as degrees clockwise from up', () => {
    expect(bezierTangentAngle(line, 0.5)).toBeCloseTo(90);
    expect(bezierTangentAngle(bend, 0)).toBeCloseTo(0);
    expect(bezierTangentAngle(bend, 1)).toBeCloseTo(90);
  });

  it('offsets to the clockwise side of the travel direction', () => {
    const point = bezierOffsetPoint(line, 0.5, 70);
    expect(point.x).toBeCloseTo(50);
    expect(point.y).toBeCloseTo(70);
    const other = bezierOffsetPoint(line, 0.5, -70);
    expect(other.y).toBeCloseTo(-70);
  });

  it('survives a degenerate curve without NaN', () => {
    const dot: QuadraticBezier = {
      start: { x: 5, y: 5 },
      control: { x: 5, y: 5 },
      end: { x: 5, y: 5 },
    };
    expect(bezierTangentAngle(dot, 0.5)).toBe(0);
    expect(bezierOffsetPoint(dot, 0.5, 70)).toEqual({ x: 5, y: 5 });
  });
});

describe('laneSlots', () => {
  it('returns nothing for no items', () => {
    expect(laneSlots(0, line, [0, 1])).toEqual([]);
  });

  it('puts a single item at the middle of the range on the curve', () => {
    const [slot] = laneSlots(1, line, [0.3, 1]);
    expect(slot?.t).toBeCloseTo(0.65);
    expect(slot?.lane).toBe(0);
    expect(slot?.offset).toBe(0);
    expect(slot?.point.x).toBeCloseTo(65);
    expect(slot?.point.y).toBeCloseTo(0);
  });

  it('uses one lane up to six items, spread over the whole range', () => {
    const slots = laneSlots(6, line, [0, 1]);
    expect(slots.map((slot) => slot.t)).toEqual(
      [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => expect.closeTo(t)),
    );
    expect(new Set(slots.map((slot) => slot.lane))).toEqual(new Set([0]));
  });

  it('uses two lanes 70 units apart, centred on the curve, for seven items', () => {
    const slots = laneSlots(7, line, [0, 1]);
    expect(slots.map((slot) => slot.lane)).toEqual([0, 1, 0, 1, 0, 1, 0]);
    expect(slots[0]?.offset).toBe(-35);
    expect(slots[1]?.offset).toBe(35);
    expect(slots[0]?.point.y).toBeCloseTo(-35);
    expect(slots[1]?.point.y).toBeCloseTo(35);
    // S = ceil(7 / 2) = 4 steps: items 0 and 1 share step 0, items 2 and 3 share step 1.
    expect(slots[2]?.t).toBeCloseTo(1 / 3);
    expect(slots[3]?.t).toBeCloseTo(1 / 3);
    expect(slots[6]?.t).toBeCloseTo(1);
  });

  it('uses three lanes at -70, 0 and 70 from thirteen items on', () => {
    const slots = laneSlots(13, line, [0, 1]);
    expect(slots.slice(0, 3).map((slot) => slot.offset)).toEqual([-70, 0, 70]);
    // S = ceil(13 / 3) = 5 steps.
    expect(slots[12]?.t).toBeCloseTo(1);
    expect(slots[3]?.t).toBeCloseTo(0.25);
  });

  it('caps at three lanes for sixty items', () => {
    const slots = laneSlots(60, line, [0.2, 0.9]);
    expect(slots).toHaveLength(60);
    expect(new Set(slots.map((slot) => slot.lane))).toEqual(new Set([0, 1, 2]));
    expect(slots[0]?.t).toBeCloseTo(0.2);
    expect(slots[59]?.t).toBeCloseTo(0.9);
  });

  it('honours a custom lane spacing', () => {
    const slots = laneSlots(7, line, [0, 1], 120);
    expect(slots[0]?.offset).toBe(-60);
    expect(slots[1]?.offset).toBe(60);
  });

  it('reports the tangent angle at each slot for rotating along the curve', () => {
    const slots = laneSlots(2, bend, [0, 1]);
    expect(slots[0]?.angle).toBeCloseTo(0);
    expect(slots[1]?.angle).toBeCloseTo(90);
  });
});
