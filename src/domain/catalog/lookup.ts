import { CATALOG } from './data';
import type {
  Catalog,
  ColorId,
  CatalogId,
  CatalogItem,
  FlowerId,
  FlowerItem,
  FoliageId,
  FoliageItem,
  WrappingId,
  WrappingItem,
} from './types';

export function getFlower(id: FlowerId, catalog: Catalog = CATALOG): FlowerItem | undefined {
  return catalog.flowers.find((item) => item.id === id);
}

export function getFoliage(id: FoliageId, catalog: Catalog = CATALOG): FoliageItem | undefined {
  return catalog.foliage.find((item) => item.id === id);
}

export function getWrapping(id: WrappingId, catalog: Catalog = CATALOG): WrappingItem | undefined {
  return catalog.wrappings.find((item) => item.id === id);
}

/** Looks an id up across all categories; ids are unique across them. */
export function getItem(id: CatalogId, catalog: Catalog = CATALOG): CatalogItem | undefined {
  return (
    getFlower(id as FlowerId, catalog) ??
    getFoliage(id as FoliageId, catalog) ??
    getWrapping(id as WrappingId, catalog)
  );
}

/** True only when the flower exists and lists the colour; fixed-colour flowers accept none. */
export function isColorAvailable(
  flowerId: FlowerId,
  colorId: ColorId,
  catalog: Catalog = CATALOG,
): boolean {
  return getFlower(flowerId, catalog)?.colors.includes(colorId) ?? false;
}

/** The first listed colour, or null for fixed-colour or unknown flowers. */
export function defaultColor(flowerId: FlowerId, catalog: Catalog = CATALOG): ColorId | null {
  return getFlower(flowerId, catalog)?.colors[0] ?? null;
}
