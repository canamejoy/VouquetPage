import { describe, expect, it } from 'vitest';
import { roundAnchor, roundRotation, roundScale } from './rounding';

describe('roundAnchor', () => {
  it('rounds both coordinates to integers', () => {
    expect(roundAnchor({ x: 10.4, y: -540.6 })).toEqual({ x: 10, y: -541 });
  });

  it('clamps to the model bounds as a last guard', () => {
    expect(roundAnchor({ x: 900.2, y: -1200 })).toEqual({ x: 500, y: -1000 });
    expect(roundAnchor({ x: -900, y: 400 })).toEqual({ x: -500, y: 300 });
  });
});

describe('roundRotation', () => {
  it('rounds to an integer and normalizes to [0, 360)', () => {
    expect(roundRotation(59.6)).toBe(60);
    expect(roundRotation(-30)).toBe(330);
    expect(roundRotation(725)).toBe(5);
  });

  it('never returns 360 after rounding', () => {
    expect(roundRotation(359.6)).toBe(0);
  });
});

describe('roundScale', () => {
  it('rounds to two decimals', () => {
    expect(roundScale(0.8765)).toBe(0.88);
    expect(roundScale(1)).toBe(1);
  });

  it('clamps to the scale limits', () => {
    expect(roundScale(0.1)).toBe(0.4);
    expect(roundScale(9)).toBe(2.5);
  });
});
