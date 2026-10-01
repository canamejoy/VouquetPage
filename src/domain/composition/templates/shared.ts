import type { ColorId, FlowerId, FoliageId } from '../../catalog';
import type { Point } from '../../geometry';
import { roundAnchor, roundRotation, roundScale } from '../rounding';
import type { ElementPlacement, FlowerRef, ItemRef } from '../types';

/** The placement of `item` with rounded anchor, rotation and scale. */
export function placeItem(
  item: ItemRef,
  position: Point,
  rotation: number,
  scale: number,
): ElementPlacement {
  const common = {
    position: roundAnchor(position),
    rotation: roundRotation(rotation),
    scale: roundScale(scale),
  };
  return item.kind === 'flower'
    ? { kind: 'flower', catalogId: item.catalogId, colorId: item.colorId, ...common }
    : { kind: 'foliage', catalogId: item.catalogId, ...common };
}

/** `count` copies of one flower, for default item sets. */
export const flowerItems = (
  catalogId: FlowerId,
  colorId: ColorId | null,
  count: number,
): FlowerRef[] => Array.from({ length: count }, () => ({ kind: 'flower', catalogId, colorId }));

/** `count` copies of one foliage, for default item sets. */
export const foliageItems = (catalogId: FoliageId, count: number): ItemRef[] =>
  Array.from({ length: count }, () => ({ kind: 'foliage', catalogId }));
