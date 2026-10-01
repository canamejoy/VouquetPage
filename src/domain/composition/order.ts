import type { Catalog } from '../catalog';
import type { FlowerRef, FoliageRef, ItemRef } from './types';

const isFlower = (item: ItemRef): item is FlowerRef => item.kind === 'flower';
const isFoliage = (item: ItemRef): item is FoliageRef => item.kind === 'foliage';

const rankOf = (index: number, size: number): number => (index === -1 ? size : index);

/**
 * Canonical order of design D4. Flowers: descending catalog area, then catalog order, then the
 * flower's colour order, then original order (the first flower is the focal one). Foliage:
 * catalog order, then original order. Unknown ids sort last. Returns the same item objects.
 */
export function canonicalItems(
  items: readonly ItemRef[],
  catalog: Catalog,
): { flowers: FlowerRef[]; foliage: FoliageRef[] } {
  const flowers = items
    .filter(isFlower)
    .map((item, original) => {
      const index = catalog.flowers.findIndex((entry) => entry.id === item.catalogId);
      const entry = catalog.flowers[index];
      const colorIndex = entry && item.colorId ? entry.colors.indexOf(item.colorId) : -1;
      return {
        item,
        original,
        area: entry ? entry.size.width * entry.size.height : 0,
        catalogIndex: rankOf(index, catalog.flowers.length),
        colorIndex,
      };
    })
    .sort(
      (a, b) =>
        b.area - a.area ||
        a.catalogIndex - b.catalogIndex ||
        a.colorIndex - b.colorIndex ||
        a.original - b.original,
    )
    .map((entry) => entry.item);

  const foliage = items
    .filter(isFoliage)
    .map((item, original) => ({
      item,
      original,
      catalogIndex: rankOf(
        catalog.foliage.findIndex((entry) => entry.id === item.catalogId),
        catalog.foliage.length,
      ),
    }))
    .sort((a, b) => a.catalogIndex - b.catalogIndex || a.original - b.original)
    .map((entry) => entry.item);

  return { flowers, foliage };
}
