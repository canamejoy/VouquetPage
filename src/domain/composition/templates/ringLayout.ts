import type { Point } from '../../geometry';
import { canonicalItems } from '../order';
import type { RingSlot } from '../rings';
import {
  flowerRingCount,
  foliageOuterRing,
  ringPoint,
  ringScale,
  ringSlots,
  ringSpacing,
} from '../rings';
import type { CompositionGenerator, ItemRef } from '../types';
import { placeItem } from './shared';

export interface RingLayout {
  centre: Point;
  dMax: number;
  rLimit: number;
  factor: number;
}

/**
 * Round and Compact differ only in these numbers. Flowers fill the centre slot and rings
 * `1..K`, foliage takes whole rings `K+1..T`, and everything points away from the centre.
 * Output is foliage first, then flowers from the outermost slot to the focal one.
 */
export function ringGenerator({ centre, dMax, rLimit, factor }: RingLayout): CompositionGenerator {
  return ({ items, catalog }) => {
    const { flowers, foliage } = canonicalItems(items, catalog);
    const flowerRings = flowerRingCount(flowers.length);
    const spacing = ringSpacing(foliageOuterRing(flowerRings, foliage.length), dMax, rLimit);
    const scale = ringScale(factor, spacing, dMax);
    const place = (list: readonly ItemRef[], slots: RingSlot[]) =>
      list.flatMap((item, index) => {
        const slot = slots[index];
        return slot ? [placeItem(item, ringPoint(centre, slot, spacing), slot.angle, scale)] : [];
      });
    const foliagePlacements = place(foliage, ringSlots(foliage.length, flowerRings + 1, false));
    const flowerPlacements = place(flowers, ringSlots(flowers.length, 1, true));
    return [...foliagePlacements, ...flowerPlacements.reverse()];
  };
}
