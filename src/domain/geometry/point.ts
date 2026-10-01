export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Model bounds for element anchors (design D2): origin is the binding point, y points down. */
export const MODEL_BOUNDS: Bounds = { minX: -500, maxX: 500, minY: -1000, maxY: 300 };

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function clampToBounds(point: Point, bounds: Bounds = MODEL_BOUNDS): Point {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}
