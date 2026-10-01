import { CATALOG, getFlower, getFoliage, getWrapping } from '../catalog';
import type { Catalog, ColorId, FlowerId, FoliageId, WrappingId } from '../catalog';
import { MODEL_BOUNDS, SCALE_MAX, SCALE_MIN } from '../geometry';
import type { Point } from '../geometry';
import { ID_PATTERN } from './ids';
import { MAX_ELEMENTS } from './limits';
import type { Bouquet, BouquetElement } from './types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function parsePosition(raw: unknown): Point | null {
  if (!isRecord(raw)) return null;
  const { x, y } = raw;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  const inside =
    x >= MODEL_BOUNDS.minX &&
    x <= MODEL_BOUNDS.maxX &&
    y >= MODEL_BOUNDS.minY &&
    y <= MODEL_BOUNDS.maxY;
  return inside ? { x, y } : null;
}

function parseElement(raw: unknown, catalog: Catalog): BouquetElement | null {
  if (!isRecord(raw)) return null;
  const { id, kind, catalogId, colorId, rotation, scale } = raw;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return null;
  const position = parsePosition(raw.position);
  if (!position) return null;
  if (!isFiniteNumber(rotation) || rotation < 0 || rotation >= 360) return null;
  if (!isFiniteNumber(scale) || scale < SCALE_MIN || scale > SCALE_MAX) return null;
  const base = { id, position, rotation, scale };

  if (kind === 'foliage') {
    if (typeof catalogId !== 'string' || !getFoliage(catalogId as FoliageId, catalog)) return null;
    return { ...base, kind, catalogId: catalogId as FoliageId };
  }
  if (kind === 'flower') {
    if (typeof catalogId !== 'string') return null;
    const flower = getFlower(catalogId as FlowerId, catalog);
    if (!flower) return null;
    if (flower.colors.length === 0) {
      return colorId === null ? { ...base, kind, catalogId: flower.id, colorId: null } : null;
    }
    if (typeof colorId !== 'string' || !flower.colors.includes(colorId as ColorId)) return null;
    return { ...base, kind, catalogId: flower.id, colorId: colorId as ColorId };
  }
  return null;
}

/**
 * Validates untrusted data (a parsed draft) against the catalog. All-or-nothing: returns a fresh
 * `Bouquet` only when every field is valid, otherwise `null`, with no partial salvage. Unknown
 * extra properties are dropped, never copied through. Mirrors the invariants of the element
 * operations (design D2).
 */
export function parseBouquet(raw: unknown, catalog: Catalog = CATALOG): Bouquet | null {
  if (!isRecord(raw) || raw.schemaVersion !== 1) return null;
  const { elements: rawElements, wrappingId } = raw;
  if (!Array.isArray(rawElements) || rawElements.length > MAX_ELEMENTS) return null;

  const elements: BouquetElement[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < rawElements.length; index += 1) {
    const element = parseElement(rawElements[index], catalog);
    if (!element || seen.has(element.id)) return null;
    seen.add(element.id);
    elements.push(element);
  }

  if (wrappingId === null) return { schemaVersion: 1, elements, wrappingId: null };
  if (typeof wrappingId !== 'string' || !getWrapping(wrappingId as WrappingId, catalog)) {
    return null;
  }
  return { schemaVersion: 1, elements, wrappingId: wrappingId as WrappingId };
}
