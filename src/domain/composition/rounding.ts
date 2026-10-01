import { clampToBounds, normalizeAngle, SCALE_MAX, SCALE_MIN, clamp } from '../geometry';
import type { Point } from '../geometry';

/** Integer anchor, clamped to the model bounds as the last guard of every generator. */
export function roundAnchor(point: Point): Point {
  return clampToBounds({ x: Math.round(point.x), y: Math.round(point.y) });
}

/** Integer rotation in [0, 360). */
export function roundRotation(degrees: number): number {
  return Math.round(normalizeAngle(degrees)) % 360;
}

/** Scale with two decimals, kept inside the scale limits. */
export function roundScale(scale: number): number {
  return clamp(Math.round(scale * 100) / 100, SCALE_MIN, SCALE_MAX);
}
