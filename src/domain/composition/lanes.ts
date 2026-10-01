import type { Point } from '../geometry';

export interface QuadraticBezier {
  start: Point;
  control: Point;
  end: Point;
}

/** Distance between neighbouring lanes in model units. */
export const LANE_SPACING = 70;
const MAX_LANES = 3;
const ITEMS_PER_LANE = 6;

/** A placement along a lane: `angle` is the curve tangent in degrees clockwise from up. */
export interface LaneSlot {
  lane: number;
  t: number;
  offset: number;
  point: Point;
  angle: number;
}

/** `L = min(3, ceil(c / 6))` lanes for `c` items. */
export const laneCount = (items: number): number =>
  Math.min(MAX_LANES, Math.ceil(items / ITEMS_PER_LANE));

export function bezierPoint(curve: QuadraticBezier, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * curve.start.x + 2 * u * t * curve.control.x + t * t * curve.end.x,
    y: u * u * curve.start.y + 2 * u * t * curve.control.y + t * t * curve.end.y,
  };
}

function tangent(curve: QuadraticBezier, t: number): Point {
  const u = 1 - t;
  return {
    x: 2 * u * (curve.control.x - curve.start.x) + 2 * t * (curve.end.x - curve.control.x),
    y: 2 * u * (curve.control.y - curve.start.y) + 2 * t * (curve.end.y - curve.control.y),
  };
}

/** Tangent direction in degrees clockwise from up, in [0, 360). A degenerate curve gives 0. */
export function bezierTangentAngle(curve: QuadraticBezier, t: number): number {
  const { x, y } = tangent(curve, t);
  if (x === 0 && y === 0) return 0;
  const degrees = (Math.atan2(x, -y) * 180) / Math.PI;
  return degrees < 0 ? degrees + 360 : degrees;
}

/** Point at `t` moved `offset` units sideways; positive offsets are clockwise of the travel direction. */
export function bezierOffsetPoint(curve: QuadraticBezier, t: number, offset: number): Point {
  const point = bezierPoint(curve, t);
  const { x, y } = tangent(curve, t);
  const length = Math.hypot(x, y);
  if (length === 0) return point;
  return { x: point.x - (y / length) * offset, y: point.y + (x / length) * offset };
}

/**
 * Slots for `count` items on lanes along `curve` over `[t0, t1]`. Item `j` takes lane `j mod L`
 * at step `floor(j / L)` of `S = ceil(count / L)`; with one step it sits at the range midpoint.
 * Lanes are centred on the curve: lane `l` has offset `(l - (L - 1) / 2) * laneSpacing`.
 */
export function laneSlots(
  count: number,
  curve: QuadraticBezier,
  range: readonly [number, number],
  laneSpacing: number = LANE_SPACING,
): LaneSlot[] {
  const lanes = laneCount(count);
  const steps = Math.ceil(count / Math.max(lanes, 1));
  const [t0, t1] = range;
  return Array.from({ length: count }, (_, j) => {
    const lane = j % lanes;
    const step = Math.floor(j / lanes);
    const t = steps === 1 ? (t0 + t1) / 2 : t0 + ((t1 - t0) * step) / (steps - 1);
    const offset = (lane - (lanes - 1) / 2) * laneSpacing;
    return {
      lane,
      t,
      offset,
      point: bezierOffsetPoint(curve, t, offset),
      angle: bezierTangentAngle(curve, t),
    };
  });
}
