import type { Point } from '../../geometry';
import { bezierOffsetPoint, bezierTangentAngle, laneSlots } from '../lanes';
import type { QuadraticBezier } from '../lanes';
import { canonicalItems } from '../order';
import { mulberry32 } from '../rng';
import type { CompositionGenerator, ItemRef } from '../types';
import { flowerItems, foliageItems, placeItem } from './shared';

const FOCAL: Point = { x: -110, y: -480 };
const LONG_ARM: QuadraticBezier = {
  start: FOCAL,
  control: { x: 120, y: -740 },
  end: { x: 320, y: -860 },
};
const SHORT_ARM: QuadraticBezier = {
  start: FOCAL,
  control: { x: -260, y: -520 },
  end: { x: -330, y: -380 },
};
const LONG_RANGE = [0.3, 1] as const;
const SHORT_RANGE = [0.5, 1] as const;
const FOLIAGE_OFFSET = 120;
const ANCHOR_JITTER = 10;
const ROTATION_JITTER = 8;

/** Where an item goes before the seeded jitter: anchor, rotation and scale. */
interface Spot {
  item: ItemRef;
  point: Point;
  angle: number;
  scale: number;
}

const longScale = (t: number) => 1 - 0.35 * t;
const shortScale = () => 0.9;

/** Focal flowers: one at F, two beside it, three on a triangle of radius 90 (angles clockwise from up). */
function focalSpots(flowers: readonly ItemRef[]): Spot[] {
  const offsets: Record<number, Point[]> = {
    1: [{ x: 0, y: 0 }],
    2: [
      { x: -60, y: 0 },
      { x: 60, y: 0 },
    ],
    3: [0, 120, 240].map((degrees) => ({
      x: 90 * Math.sin((degrees * Math.PI) / 180),
      y: -90 * Math.cos((degrees * Math.PI) / 180),
    })),
  };
  const angles: Record<number, number[]> = { 1: [0], 2: [270, 90], 3: [0, 120, 240] };
  return flowers.flatMap((item, index) => {
    const offset = offsets[flowers.length]?.[index];
    const angle = angles[flowers.length]?.[index];
    if (!offset || angle === undefined) return [];
    return [{ item, point: { x: FOCAL.x + offset.x, y: FOCAL.y + offset.y }, angle, scale: 1 }];
  });
}

function laneSpots(
  items: readonly ItemRef[],
  curve: QuadraticBezier,
  range: readonly [number, number],
  scaleAt: (t: number) => number,
): Spot[] {
  return laneSlots(items.length, curve, range).flatMap((slot, index) => {
    const item = items[index];
    return item ? [{ item, point: slot.point, angle: slot.angle, scale: scaleAt(slot.t) }] : [];
  });
}

/** Single file along the arm, alternating sides by `FOLIAGE_OFFSET`. */
function fileSpots(
  items: readonly ItemRef[],
  curve: QuadraticBezier,
  [t0, t1]: readonly [number, number],
  scaleAt: (t: number) => number,
): Spot[] {
  return items.map((item, index) => {
    const t = items.length === 1 ? (t0 + t1) / 2 : t0 + ((t1 - t0) * index) / (items.length - 1);
    const offset = index % 2 === 0 ? FOLIAGE_OFFSET : -FOLIAGE_OFFSET;
    return {
      item,
      point: bezierOffsetPoint(curve, t, offset),
      angle: bezierTangentAngle(curve, t),
      scale: scaleAt(t),
    };
  });
}

/** Two thirds (rounded up) go on the long arm, the rest on the short arm. */
const splitArms = <T>(items: readonly T[]): [T[], T[]] => {
  const longCount = Math.ceil((items.length * 2) / 3);
  return [items.slice(0, longCount), items.slice(longCount)];
};

export const generateAsymmetric: CompositionGenerator = ({ items, catalog, seed }) => {
  const rng = mulberry32(seed);
  const jittered = ({ item, point, angle, scale }: Spot) => {
    const dx = (rng() * 2 - 1) * ANCHOR_JITTER;
    const dy = (rng() * 2 - 1) * ANCHOR_JITTER;
    const turn = (rng() * 2 - 1) * ROTATION_JITTER;
    return placeItem(item, { x: point.x + dx, y: point.y + dy }, angle + turn, scale);
  };

  const { flowers, foliage } = canonicalItems(items, catalog);
  const focalCount = Math.min(flowers.length, 3);
  const [longFlowers, shortFlowers] = splitArms(flowers.slice(focalCount));
  const [longFoliage, shortFoliage] = splitArms(foliage);

  const flowerPlacements = [
    ...focalSpots(flowers.slice(0, focalCount)),
    ...laneSpots(longFlowers, LONG_ARM, LONG_RANGE, longScale),
    ...laneSpots(shortFlowers, SHORT_ARM, SHORT_RANGE, shortScale),
  ].map(jittered);
  const foliagePlacements = [
    ...fileSpots(longFoliage, LONG_ARM, LONG_RANGE, longScale),
    ...fileSpots(shortFoliage, SHORT_ARM, SHORT_RANGE, shortScale),
  ].map(jittered);

  return [...foliagePlacements, ...flowerPlacements.reverse()];
};

export const ASYMMETRIC_DEFAULT_ITEMS = [
  ...flowerItems('peony', 'blush', 1),
  ...flowerItems('rose', 'blush', 2),
  ...flowerItems('lily', 'white', 2),
  ...flowerItems('tulip', 'pink', 5),
  ...foliageItems('eucalyptus', 4),
  ...foliageItems('olive', 2),
];
