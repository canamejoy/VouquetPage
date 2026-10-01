import type { Point } from '@/domain/geometry';

/**
 * Stem from an element anchor to the binding point at the origin. The control point sits halfway
 * down and 70 percent of the way across, so the stem leaves the bloom nearly upright and bends
 * toward the binding. Derived at render time; stems are never stored (design D1).
 */
export function stemPath(anchor: Point): string {
  return `M ${anchor.x} ${anchor.y} Q ${anchor.x * 0.7} ${anchor.y * 0.5} 0 0`;
}
