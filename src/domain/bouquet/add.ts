import { CATALOG, defaultColor, getFlower, getFoliage } from '../catalog';
import type { Catalog, FlowerId, FoliageId } from '../catalog';
import { clampToBounds } from '../geometry';
import type { Point } from '../geometry';
import { nextElementId } from './ids';
import { MAX_ELEMENTS } from './limits';
import type { Bouquet, BouquetElement } from './types';

/**
 * Appends a flower or foliage element on top with the anchor clamped to the bounds. Returns the
 * same bouquet at the element limit or for an id that is not a flower or foliage.
 */
export function addElement(
  bouquet: Bouquet,
  catalogId: FlowerId | FoliageId,
  position: Point,
  catalog: Catalog = CATALOG,
): Bouquet {
  if (bouquet.elements.length >= MAX_ELEMENTS) return bouquet;
  const base = {
    id: nextElementId(bouquet.elements),
    position: clampToBounds(position),
    rotation: 0,
    scale: 1,
  };
  let element: BouquetElement;
  if (getFlower(catalogId as FlowerId, catalog)) {
    element = {
      ...base,
      kind: 'flower',
      catalogId: catalogId as FlowerId,
      colorId: defaultColor(catalogId as FlowerId, catalog),
    };
  } else if (getFoliage(catalogId as FoliageId, catalog)) {
    element = { ...base, kind: 'foliage', catalogId: catalogId as FoliageId };
  } else {
    return bouquet;
  }
  return { ...bouquet, elements: [...bouquet.elements, element] };
}
