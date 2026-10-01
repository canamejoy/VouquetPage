import { CATALOG, getWrapping, isColorAvailable } from '../catalog';
import type { Catalog, ColorId, WrappingId } from '../catalog';
import { clamp, clampToBounds, normalizeAngle, SCALE_MAX, SCALE_MIN } from '../geometry';
import type { Point } from '../geometry';
import { nextElementId } from './ids';
import { DUPLICATE_OFFSET, MAX_ELEMENTS } from './limits';
import { emptyBouquet } from './types';
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

/** Inserts a copy directly above the original, offset and clamped. No-op at the limit. */
export function duplicateElement(bouquet: Bouquet, id: string): Bouquet {
  if (bouquet.elements.length >= MAX_ELEMENTS) return bouquet;
  const index = bouquet.elements.findIndex((element) => element.id === id);
  const original = bouquet.elements[index];
  if (!original) return bouquet;
  const copy: BouquetElement = {
    ...original,
    id: nextElementId(bouquet.elements),
    position: clampToBounds({
      x: original.position.x + DUPLICATE_OFFSET,
      y: original.position.y + DUPLICATE_OFFSET,
    }),
  };
  const elements = [...bouquet.elements];
  elements.splice(index + 1, 0, copy);
  return { ...bouquet, elements };
}

/** Removes an element. No-op for an unknown id. */
export function deleteElement(bouquet: Bouquet, id: string): Bouquet {
  if (!bouquet.elements.some((element) => element.id === id)) return bouquet;
  return { ...bouquet, elements: bouquet.elements.filter((element) => element.id !== id) };
}

export type ReorderDirection = 'forward' | 'backward' | 'front' | 'back';

/** Moves an element in the depth order. No-op at the ends and for unknown ids. */
export function reorderElement(bouquet: Bouquet, id: string, direction: ReorderDirection): Bouquet {
  const from = bouquet.elements.findIndex((element) => element.id === id);
  if (from < 0) return bouquet;
  const last = bouquet.elements.length - 1;
  const target = {
    forward: Math.min(from + 1, last),
    backward: Math.max(from - 1, 0),
    front: last,
    back: 0,
  }[direction];
  if (target === from) return bouquet;
  const elements = [...bouquet.elements];
  const [moved] = elements.splice(from, 1);
  elements.splice(target, 0, moved as BouquetElement);
  return { ...bouquet, elements };
}

/** Sets or clears (null) the wrapping; elements are untouched. Unknown ids are a no-op. */
export function setWrapping(
  bouquet: Bouquet,
  wrappingId: WrappingId | null,
  catalog: Catalog = CATALOG,
): Bouquet {
  if (wrappingId !== null && !getWrapping(wrappingId, catalog)) return bouquet;
  return { ...bouquet, wrappingId };
}

/** "New bouquet": no elements and no wrapping. */
export const clearBouquet = (): Bouquet => emptyBouquet();
