import { describe, expect, it } from 'vitest';
import { dockSide } from './dockSide';

describe('dockSide', () => {
  it.each([
    [-1000, 'bottom'],
    [-351, 'bottom'],
    [-350, 'bottom'],
    [-349, 'top'],
    [0, 'top'],
    [300, 'top'],
  ] as const)('anchor y %i docks to the %s', (y, side) => {
    expect(dockSide({ x: 0, y })).toBe(side);
  });
});
