import { clientToModel, modelPerPixel } from './viewport';
import { normalizeAngle } from './angle';
import { MODEL_BOUNDS, clampToBounds } from './point';
import type { Viewport } from './viewport';

// viewBox "-500 -1000 1000 1300", preserveAspectRatio xMidYMid meet.
const exact: Viewport = { left: 0, top: 0, width: 500, height: 650 }; // scale 0.5, no letterbox
const wide: Viewport = { left: 100, top: 50, width: 1500, height: 650 }; // height-bound: 0.5, 500 px side bars
const tall: Viewport = { left: 0, top: 0, width: 500, height: 1300 }; // width-bound: 0.5, 325 px top bar

describe('modelPerPixel', () => {
  it('is the inverse of the meet scale when the viewport matches the aspect ratio', () => {
    expect(modelPerPixel(exact)).toBeCloseTo(2, 10);
  });

  it('uses the smaller scale axis when the viewport is wider than the viewBox', () => {
    expect(modelPerPixel(wide)).toBeCloseTo(2, 10);
  });

  it('uses the smaller scale axis when the viewport is taller than the viewBox', () => {
    expect(modelPerPixel(tall)).toBeCloseTo(2, 10);
  });
});

describe('clientToModel', () => {
  it('maps the viewport corners to the viewBox corners without letterboxing', () => {
    expect(clientToModel({ x: 0, y: 0 }, exact)).toEqual({ x: -500, y: -1000 });
    expect(clientToModel({ x: 500, y: 650 }, exact)).toEqual({ x: 500, y: 300 });
  });

  it('maps the viewport centre to the middle of the viewBox', () => {
    expect(clientToModel({ x: 250, y: 325 }, exact)).toEqual({ x: 0, y: -350 });
  });

  it('accounts for the viewport offset on the page', () => {
    // wide: left 100, top 50, side bars 500 px each, content starts at client x 600
    expect(clientToModel({ x: 600, y: 50 }, wide)).toEqual({ x: -500, y: -1000 });
    expect(clientToModel({ x: 1100, y: 700 }, wide)).toEqual({ x: 500, y: 300 });
  });

  it('shifts the origin by the top bar when the viewport is taller than the viewBox', () => {
    // tall: scale 0.5, content 500 x 650 centred, top bar 325 px
    expect(clientToModel({ x: 0, y: 325 }, tall)).toEqual({ x: -500, y: -1000 });
    expect(clientToModel({ x: 250, y: 650 }, tall)).toEqual({ x: 0, y: -350 });
  });

  it('returns coordinates outside the bounds for points in the letterbox', () => {
    expect(clientToModel({ x: 100, y: 50 }, wide)).toEqual({ x: -1500, y: -1000 });
  });
});

describe('normalizeAngle', () => {
  it.each([
    [0, 0],
    [90, 90],
    [359.5, 359.5],
    [360, 0],
    [725, 5],
    [-1, 359],
    [-360, 0],
    [-725, 355],
  ])('normalizes %f to %f', (input, expected) => {
    expect(normalizeAngle(input)).toBeCloseTo(expected, 10);
  });

  it('never returns 360 or negative zero', () => {
    expect(normalizeAngle(-1e-15)).toBe(0);
    expect(Object.is(normalizeAngle(-0), 0)).toBe(true);
    expect(Object.is(normalizeAngle(-360), 0)).toBe(true);
  });
});

describe('clampToBounds', () => {
  it('declares the model bounds from the design', () => {
    expect(MODEL_BOUNDS).toEqual({ minX: -500, maxX: 500, minY: -1000, maxY: 300 });
  });

  it('keeps a point that is already inside', () => {
    expect(clampToBounds({ x: 12, y: -40 })).toEqual({ x: 12, y: -40 });
  });

  it('moves each axis to the nearest edge independently', () => {
    expect(clampToBounds({ x: -900, y: 20 })).toEqual({ x: -500, y: 20 });
    expect(clampToBounds({ x: 900, y: -2000 })).toEqual({ x: 500, y: -1000 });
    expect(clampToBounds({ x: 0, y: 999 })).toEqual({ x: 0, y: 300 });
  });
});
