import { CATALOG } from '../catalog';
import type { Catalog } from '../catalog';
import type { CompositionTemplate, ItemRef } from '../composition/types';
import { clampToBounds } from '../geometry';
import type { Bouquet, BouquetElement } from './types';

const itemOf = (element: BouquetElement): ItemRef =>
  element.kind === 'flower'
    ? { kind: 'flower', catalogId: element.catalogId, colorId: element.colorId }
    : { kind: 'foliage', catalogId: element.catalogId };

/**
 * Replaces the flower and foliage arrangement with the template's layout of the bouquet's own
 * items, keeping the wrapping. A bouquet without flowers or foliage (a wrapping-only bouquet
 * included) gets the template's default items. Ids are `e1..eN` in output order, the result never
 * has more elements than the items received, and anchors are clamped to the model bounds.
 * The inline confirmation belongs to the UI, not here.
 */
export function applyComposition(
  bouquet: Bouquet,
  template: CompositionTemplate,
  catalog: Catalog = CATALOG,
): Bouquet {
  const items: readonly ItemRef[] =
    bouquet.elements.length === 0 ? template.defaultItems : bouquet.elements.map(itemOf);
  const placements = template.generate({ items, catalog, seed: template.seed });
  const elements = placements.slice(0, items.length).map((placement, index): BouquetElement => ({
    ...placement,
    id: `e${index + 1}`,
    position: clampToBounds(placement.position),
  }));
  return { schemaVersion: 1, elements, wrappingId: bouquet.wrappingId };
}
