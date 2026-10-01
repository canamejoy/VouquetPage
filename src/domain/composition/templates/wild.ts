import type { Point } from '../../geometry';
import { canonicalItems } from '../order';
import { mulberry32 } from '../rng';
import type { Rng } from '../rng';
import type { CompositionGenerator } from '../types';
import { flowerItems, foliageItems, placeItem } from './shared';

const CENTRE: Point = { x: 0, y: -540 };
const GOLDEN_ANGLE = 137.508;
const MAX_SPACING = 76;
const SPIRAL_RADIUS = 430;
const ANCHOR_JITTER = 26;
const ROTATION_JITTER = 25;
const SCALE_RANGE = [0.75, 1.15] as const;

/** Seeded Fisher-Yates over a copy; consumes `length - 1` draws. */
function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = out[i];
    out[i] = out[j] as T;
    out[j] = swap as T;
  }
  return out;
}

/**
 * One phyllotaxis spiral over all items: flowers take the inner indices and foliage the outer
 * ones, each group after a seeded shuffle. Draw order: both shuffles, then per element x, y,
 * scale and rotation, flowers first.
 */
export const generateWild: CompositionGenerator = ({ items, catalog, seed }) => {
  const rng = mulberry32(seed);
  const canonical = canonicalItems(items, catalog);
  const flowers = shuffled(canonical.flowers, rng);
  const foliage = shuffled(canonical.foliage, rng);
  const spacing = Math.min(MAX_SPACING, SPIRAL_RADIUS / Math.sqrt(items.length));

  const placements = [...flowers, ...foliage].map((item, index) => {
    const radius = spacing * Math.sqrt(index + 0.5);
    const angle = index * GOLDEN_ANGLE;
    const radians = (angle * Math.PI) / 180;
    const dx = (rng() * 2 - 1) * ANCHOR_JITTER;
    const dy = (rng() * 2 - 1) * ANCHOR_JITTER;
    const scale = SCALE_RANGE[0] + rng() * (SCALE_RANGE[1] - SCALE_RANGE[0]);
    const turn = (rng() * 2 - 1) * ROTATION_JITTER;
    return placeItem(
      item,
      {
        x: CENTRE.x + radius * Math.sin(radians) + dx,
        y: CENTRE.y - radius * Math.cos(radians) + dy,
      },
      angle + turn,
      scale,
    );
  });
  const flowerPlacements = placements.slice(0, flowers.length);
  return [...placements.slice(flowers.length), ...flowerPlacements.reverse()];
};

export const WILD_DEFAULT_ITEMS = [
  ...flowerItems('gerbera', 'orange', 3),
  ...flowerItems('lavender', null, 3),
  ...flowerItems('rose', 'peach', 3),
  ...flowerItems('tulip', 'yellow', 3),
  ...flowerItems('carnation', 'pink', 3),
  ...flowerItems('sunflower', null, 3),
  ...foliageItems('fern', 3),
  ...foliageItems('eucalyptus', 2),
  ...foliageItems('olive', 2),
];
