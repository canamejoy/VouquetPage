import type { Point } from '../../geometry';
import { bezierPoint, bezierTangentAngle, laneSlots } from '../lanes';
import type { QuadraticBezier } from '../lanes';
import { canonicalItems } from '../order';
import { flowerRingCount, ringPoint, ringScale, ringSlots, ringSpacing } from '../rings';
import { mulberry32 } from '../rng';
import type { CompositionGenerator, ItemRef } from '../types';
import { flowerItems, foliageItems, placeItem } from './shared';

const DOME: Point = { x: -40, y: -610 };
const DOME_SHARE = 0.6;
const DOME_D_MAX = 150;
const DOME_R_LIMIT = 300;
const FLOWER_TRAIL: QuadraticBezier = {
  start: { x: 110, y: -480 },
  control: { x: 300, y: -300 },
  end: { x: 320, y: 140 },
};
const FOLIAGE_TRAIL: QuadraticBezier = {
  start: { x: 140, y: -420 },
  control: { x: 330, y: -220 },
  end: { x: 330, y: 240 },
};
const FOLIAGE_TRAIL_RANGE = [0.2, 1] as const;
const FAN_HALF_ANGLE = 60;
const FAN_MARGIN = 100;
const FAN_MAX_RADIUS = 380;
const ANCHOR_JITTER = 8;

/** Where an item goes before the seeded jitter. */
interface Spot {
  item: ItemRef;
  point: Point;
  angle: number;
  scale: number;
}

/**
 * Flowers form a dome with a trail running down the right; foliage fans out behind the dome and
 * the rest follows a second trail. Draw order: x then y per element, flowers first.
 */
export const generateCascade: CompositionGenerator = ({ items, catalog, seed }) => {
  const rng = mulberry32(seed);
  const { flowers, foliage } = canonicalItems(items, catalog);

  const domeCount = Math.ceil(flowers.length * DOME_SHARE);
  const domeRings = flowerRingCount(domeCount);
  const spacing = ringSpacing(domeRings, DOME_D_MAX, DOME_R_LIMIT);
  const domeScale = ringScale(1, spacing, DOME_D_MAX);
  const domeSpots: Spot[] = ringSlots(domeCount, 1, true).flatMap((slot, index) => {
    const item = flowers[index];
    return item
      ? [{ item, point: ringPoint(DOME, slot, spacing), angle: slot.angle, scale: domeScale }]
      : [];
  });
  const trailSpots: Spot[] = laneSlots(flowers.length - domeCount, FLOWER_TRAIL, [0, 1]).flatMap(
    (slot, index) => {
      const item = flowers[domeCount + index];
      return item
        ? [{ item, point: slot.point, angle: slot.angle, scale: 0.95 - 0.35 * slot.t }]
        : [];
    },
  );

  const fanCount = Math.ceil(foliage.length / 2);
  const fanRadius = Math.min(domeRings * spacing + FAN_MARGIN, FAN_MAX_RADIUS);
  const fanSpots: Spot[] = foliage.slice(0, fanCount).map((item, index) => {
    const angle =
      fanCount === 1 ? 0 : -FAN_HALF_ANGLE + (2 * FAN_HALF_ANGLE * index) / (fanCount - 1);
    return {
      item,
      point: ringPoint(DOME, { ring: 1, angle }, fanRadius),
      angle,
      scale: 1,
    };
  });
  const sideCount = foliage.length - fanCount;
  const [t0, t1] = FOLIAGE_TRAIL_RANGE;
  const sideSpots: Spot[] = foliage.slice(fanCount).map((item, index) => {
    const t = sideCount === 1 ? (t0 + t1) / 2 : t0 + ((t1 - t0) * index) / (sideCount - 1);
    return {
      item,
      point: bezierPoint(FOLIAGE_TRAIL, t),
      angle: bezierTangentAngle(FOLIAGE_TRAIL, t),
      scale: 1,
    };
  });

  const jittered = ({ item, point, angle, scale }: Spot) => {
    const dx = (rng() * 2 - 1) * ANCHOR_JITTER;
    const dy = (rng() * 2 - 1) * ANCHOR_JITTER;
    return placeItem(item, { x: point.x + dx, y: point.y + dy }, angle, scale);
  };
  const flowerPlacements = [...domeSpots, ...trailSpots].map(jittered);
  const foliagePlacements = [...fanSpots, ...sideSpots].map(jittered);
  return [...foliagePlacements, ...flowerPlacements.reverse()];
};

export const CASCADE_DEFAULT_ITEMS = [
  ...flowerItems('lily', 'white', 1),
  ...flowerItems('rose', 'white', 5),
  ...flowerItems('rose', 'blush', 4),
  ...flowerItems('carnation', 'white', 2),
  ...flowerItems('tulip', 'white', 1),
  ...foliageItems('fern', 3),
  ...foliageItems('ruscus', 4),
];
