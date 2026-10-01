import { normalizeAngle } from './angle';
import { clamp, clampToBounds } from './point';
import type { Point } from './point';

/** Snapshot taken at pointerdown. The anchor is `position`; every gesture is relative to it. */
export interface GestureStart {
  pointer: Point;
  position: Point;
  rotation: number;
  scale: number;
}

export const SCALE_MIN = 0.4;
export const SCALE_MAX = 2.5;

/** Anchor follows the pointer delta, clamped to the model bounds. */
export function moveGesture(start: GestureStart, pointer: Point): Point {
  return clampToBounds({
    x: start.position.x + pointer.x - start.pointer.x,
    y: start.position.y + pointer.y - start.pointer.y,
  });
}

// Degrees clockwise from "up" (negative y) about `origin`; y grows downwards.
const bearing = (origin: Point, target: Point): number =>
  (Math.atan2(target.x - origin.x, origin.y - target.y) * 180) / Math.PI;

/** Starting rotation plus the angle swept about the anchor, normalized to [0, 360). */
export function rotateGesture(start: GestureStart, pointer: Point): number {
  const swept = bearing(start.position, pointer) - bearing(start.position, start.pointer);
  return normalizeAngle(start.rotation + swept);
}

/** Starting scale times the distance ratio about the anchor, clamped to [SCALE_MIN, SCALE_MAX]. */
export function scaleGesture(start: GestureStart, pointer: Point): number {
  const startDistance = Math.hypot(
    start.pointer.x - start.position.x,
    start.pointer.y - start.position.y,
  );
  if (startDistance === 0) return start.scale;
  const distance = Math.hypot(pointer.x - start.position.x, pointer.y - start.position.y);
  return clamp(start.scale * (distance / startDistance), SCALE_MIN, SCALE_MAX);
}
