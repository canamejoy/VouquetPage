import { CATALOG, isColorAvailable } from '../catalog';
import type { Catalog, ColorId } from '../catalog';
import { clamp, clampToBounds, normalizeAngle, SCALE_MAX, SCALE_MIN } from '../geometry';
import type { Point } from '../geometry';
import type { Bouquet, BouquetElement } from './types';

export interface ElementTransform {
  position?: Point;
  rotation?: number;
  scale?: number;
}

const replaceAt = (bouquet: Bouquet, index: number, element: BouquetElement): Bouquet => ({
  ...bouquet,
  elements: bouquet.elements.map((current, i) => (i === index ? element : current)),
});

/** Sets any of anchor, rotation and scale, each clamped or normalized. Unknown id is a no-op. */
export function transformElement(bouquet: Bouquet, id: string, change: ElementTransform): Bouquet {
  const index = bouquet.elements.findIndex((element) => element.id === id);
  const current = bouquet.elements[index];
  if (!current) return bouquet;
  return replaceAt(bouquet, index, {
    ...current,
    position: change.position ? clampToBounds(change.position) : current.position,
    rotation: change.rotation === undefined ? current.rotation : normalizeAngle(change.rotation),
    scale: change.scale === undefined ? current.scale : clamp(change.scale, SCALE_MIN, SCALE_MAX),
  });
}

/** Sets a flower colour. No-op for foliage, unknown ids and colours outside the flower's list. */
export function recolorElement(
  bouquet: Bouquet,
  id: string,
  colorId: ColorId,
  catalog: Catalog = CATALOG,
): Bouquet {
  const index = bouquet.elements.findIndex((element) => element.id === id);
  const current = bouquet.elements[index];
  if (current?.kind !== 'flower') return bouquet;
  if (!isColorAvailable(current.catalogId, colorId, catalog)) return bouquet;
  return replaceAt(bouquet, index, { ...current, colorId });
}

/** Removes an element. No-op for an unknown id. */
export function deleteElement(bouquet: Bouquet, id: string): Bouquet {
  if (!bouquet.elements.some((element) => element.id === id)) return bouquet;
  return { ...bouquet, elements: bouquet.elements.filter((element) => element.id !== id) };
}
