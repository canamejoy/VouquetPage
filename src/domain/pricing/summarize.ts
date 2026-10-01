import { elementQuantities } from '../bouquet';
import type { Bouquet } from '../bouquet';
import { CATALOG, getItem } from '../catalog';
import type { Catalog, CatalogId, CatalogItem, ColorId } from '../catalog';
import { allocateUsdCents, toUsdCents } from './usd';

export type SummaryGroupKind = 'flowers' | 'foliage' | 'wrapping';

export interface SummaryLine {
  catalogId: CatalogId;
  colorId: ColorId | null;
  quantity: number;
  unitCop: number;
  lineCop: number;
  lineUsdCents: number;
}

export interface SummaryGroup {
  kind: SummaryGroupKind;
  lines: SummaryLine[];
}

/** Amounts are integers: whole COP and US cents. Formatting belongs to the UI edge. */
export interface Summary {
  groups: SummaryGroup[];
  totalCop: number;
  totalUsdCents: number;
}

const GROUP_ORDER: readonly SummaryGroupKind[] = ['flowers', 'foliage', 'wrapping'];

const GROUP_OF: Record<CatalogItem['kind'], SummaryGroupKind> = {
  flower: 'flowers',
  foliage: 'foliage',
  wrapping: 'wrapping',
};

interface Entry {
  item: CatalogItem;
  colorId: ColorId | null;
  quantity: number;
}

/** Position of an item in its own catalog list; the order lines appear in. */
function catalogIndex(item: CatalogItem, catalog: Catalog): number {
  const list =
    item.kind === 'flower'
      ? catalog.flowers
      : item.kind === 'foliage'
        ? catalog.foliage
        : catalog.wrappings;
  return list.findIndex((candidate) => candidate.id === item.id);
}

/** Position of a colour in the flower's colour list; null and unlisted colours come last. */
function colorIndex(item: CatalogItem, colorId: ColorId | null): number {
  if (item.kind !== 'flower' || colorId === null) return Number.MAX_SAFE_INTEGER;
  const index = item.colors.indexOf(colorId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Grouped summary derived from the structured bouquet (never from rendering). Groups are
 * flowers, foliage and wrapping with empty groups omitted. Lines are keyed by
 * `(catalogId, colorId)` in catalog order, colours in the flower's colour order. The USD line
 * amounts are allocated over all lines in that same order, so they sum to `totalUsdCents`.
 * Ids the catalog does not know are skipped.
 */
export function summarize(bouquet: Bouquet, catalog: Catalog = CATALOG): Summary {
  const entries: Entry[] = [];
  for (const { catalogId, colorId, quantity } of elementQuantities(bouquet)) {
    const item = getItem(catalogId, catalog);
    if (item) entries.push({ item, colorId, quantity });
  }
  if (bouquet.wrappingId !== null) {
    const item = getItem(bouquet.wrappingId, catalog);
    if (item) entries.push({ item, colorId: null, quantity: 1 });
  }

  const ordered = GROUP_ORDER.flatMap((kind) =>
    entries
      .filter((entry) => GROUP_OF[entry.item.kind] === kind)
      .sort(
        (a, b) =>
          catalogIndex(a.item, catalog) - catalogIndex(b.item, catalog) ||
          colorIndex(a.item, a.colorId) - colorIndex(b.item, b.colorId),
      ),
  );

  const linesCop = ordered.map((entry) => entry.item.priceCop * entry.quantity);
  const linesUsd = allocateUsdCents(linesCop);
  const totalCop = linesCop.reduce((sum, cop) => sum + cop, 0);

  const groups: SummaryGroup[] = [];
  ordered.forEach((entry, index) => {
    const kind = GROUP_OF[entry.item.kind];
    let group = groups[groups.length - 1];
    if (group?.kind !== kind) {
      group = { kind, lines: [] };
      groups.push(group);
    }
    group.lines.push({
      catalogId: entry.item.id,
      colorId: entry.colorId,
      quantity: entry.quantity,
      unitCop: entry.item.priceCop,
      lineCop: linesCop[index] ?? 0,
      lineUsdCents: linesUsd[index] ?? 0,
    });
  });

  return { groups, totalCop, totalUsdCents: toUsdCents(totalCop) };
}
