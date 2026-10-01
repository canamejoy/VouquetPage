import { clampToBounds } from './point';
import type { Point } from './point';

const BASE_ANCHOR: Point = { x: 0, y: -540 };
const GOLDEN_ANGLE = (137.508 * Math.PI) / 180;
const SPIRAL_STEP = 34;
const SPIRAL_CYCLE = 24;

/**
 * Where a tapped palette item lands (design D1): a golden-angle spiral around the base anchor, so
 * successive taps never stack exactly. `elementCount` is how many elements the bouquet already has.
 * The offset is at most 34 * sqrt(23), about 163 units; the clamp is a guard, not an expected case.
 */
export function defaultAnchor(elementCount: number): Point {
  const k = elementCount % SPIRAL_CYCLE;
  const radius = SPIRAL_STEP * Math.sqrt(k);
  return clampToBounds({
    x: BASE_ANCHOR.x + radius * Math.cos(k * GOLDEN_ANGLE),
    y: BASE_ANCHOR.y + radius * Math.sin(k * GOLDEN_ANGLE),
  });
}
