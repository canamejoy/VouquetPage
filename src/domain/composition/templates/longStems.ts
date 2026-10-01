import { canonicalItems } from '../order';
import type { CompositionGenerator } from '../types';
import { flowerItems, foliageItems, placeItem } from './shared';

/** Columns fill centre-out: 0, +1, -1, +2, -2, +3, -3. */
const COLUMNS = [0, 1, -1, 2, -2, 3, -3];
const COLUMN_SPACING = 62;
const FLOWER_TOP = -900;
const FLOWER_ROW_SPAN = 545;
const MAX_ROW_STEP = 130;
const FOLIAGE_TOP = -620;
const FOLIAGE_TIER_SPAN = 500;
const MAX_TIER_STEP = 120;
const FOLIAGE_PER_TIER = 6;

/** Step between `count` rows or tiers so the last one lands at `span` below the first. */
const stepFor = (count: number, max: number, span: number) =>
  Math.min(max, span / Math.max(count - 1, 1));

/** Tall columns of flowers with foliage tiers below and to the sides; no randomness. */
export const generateLongStems: CompositionGenerator = ({ items, catalog }) => {
  const { flowers, foliage } = canonicalItems(items, catalog);
  const rowStep = stepFor(
    Math.ceil(flowers.length / COLUMNS.length),
    MAX_ROW_STEP,
    FLOWER_ROW_SPAN,
  );
  const tierStep = stepFor(
    Math.ceil(foliage.length / FOLIAGE_PER_TIER),
    MAX_TIER_STEP,
    FOLIAGE_TIER_SPAN,
  );

  const flowerPlacements = flowers.map((item, index) => {
    const column = COLUMNS[index % COLUMNS.length] ?? 0;
    const row = Math.floor(index / COLUMNS.length);
    const stagger = Math.abs(column) % 2 === 1 ? 45 : 0;
    const y = FLOWER_TOP + 70 * Math.abs(column) + stagger + rowStep * row;
    return placeItem(item, { x: COLUMN_SPACING * column, y }, 6 * column, 1);
  });
  const foliagePlacements = foliage.map((item, index) => {
    const side = index % 2 === 0 ? 1 : -1;
    const group = Math.floor(index / 2) % 3;
    const tier = Math.floor(index / FOLIAGE_PER_TIER);
    const point = { x: side * (110 + 105 * group), y: FOLIAGE_TOP + 100 * group + tierStep * tier };
    return placeItem(item, point, side * (18 + 12 * group), 1);
  });
  return [...foliagePlacements, ...flowerPlacements.reverse()];
};

export const LONG_STEMS_DEFAULT_ITEMS = [
  ...flowerItems('lily', 'white', 1),
  ...flowerItems('tulip', 'white', 2),
  ...flowerItems('rose', 'red', 4),
  ...foliageItems('ruscus', 4),
];
