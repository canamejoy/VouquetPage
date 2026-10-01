import type { Point } from '../geometry';
import { roundScale } from './rounding';

/** A position on the ring system: `ring` 0 is the centre, `angle` is degrees clockwise from up. */
export interface RingSlot {
  ring: number;
  angle: number;
}

const ringCapacity = (ring: number): number => 6 * ring;

/** Rings flowers need around the centre slot: slot 0 plus rings 1..K. Zero for one flower or none. */
export function flowerRingCount(flowers: number): number {
  let rings = 0;
  let capacity = 1;
  while (capacity < flowers) {
    rings += 1;
    capacity += ringCapacity(rings);
  }
  return rings;
}

/** Outermost ring T when foliage fills whole rings `flowerRings + 1..T`. Equals `flowerRings` without foliage. */
export function foliageOuterRing(flowerRings: number, foliage: number): number {
  let ring = flowerRings;
  let remaining = foliage;
  while (remaining > 0) {
    ring += 1;
    remaining -= ringCapacity(ring);
  }
  return ring;
}

/** Spacing `d` between rings; `max(T, 1)` keeps a lone centre item from dividing by zero. */
export function ringSpacing(outerRing: number, dMax: number, rLimit: number): number {
  return Math.min(dMax, rLimit / Math.max(outerRing, 1));
}

/**
 * Slots for `count` items filling rings from `firstRing` outward (slot 0 first when `withCentre`).
 * A partly filled ring spreads its actual count evenly, starting at 0 degrees on odd rings and
 * at half a step on even rings.
 */
export function ringSlots(count: number, firstRing: number, withCentre: boolean): RingSlot[] {
  const slots: RingSlot[] = [];
  let remaining = count;
  if (withCentre && remaining > 0) {
    slots.push({ ring: 0, angle: 0 });
    remaining -= 1;
  }
  for (let ring = firstRing; remaining > 0; ring += 1) {
    const inRing = Math.min(ringCapacity(ring), remaining);
    const step = 360 / inRing;
    const start = ring % 2 === 1 ? 0 : step / 2;
    for (let index = 0; index < inRing; index += 1) {
      slots.push({ ring, angle: start + index * step });
    }
    remaining -= inRing;
  }
  return slots;
}

/** Unrounded point for a slot at radius `ring * d` from `centre`. */
export function ringPoint(centre: Point, slot: RingSlot, d: number): Point {
  const radius = slot.ring * d;
  const radians = (slot.angle * Math.PI) / 180;
  return { x: centre.x + radius * Math.sin(radians), y: centre.y - radius * Math.cos(radians) };
}

/** `max(0.4, factor * d / dMax)`: the floor applies after the template factor. Rounded to two decimals. */
export function ringScale(factor: number, d: number, dMax: number): number {
  return roundScale(Math.max(0.4, (factor * d) / dMax));
}
