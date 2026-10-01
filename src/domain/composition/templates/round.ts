import type { CompositionGenerator } from '../types';
import { ringGenerator } from './ringLayout';
import { flowerItems, foliageItems } from './shared';

export const generateRound: CompositionGenerator = ringGenerator({
  centre: { x: 0, y: -540 },
  dMax: 145,
  rLimit: 440,
  factor: 1,
});

export const ROUND_DEFAULT_ITEMS = [
  ...flowerItems('peony', 'blush', 1),
  ...flowerItems('rose', 'blush', 6),
  ...flowerItems('rose', 'white', 5),
  ...flowerItems('carnation', 'pink', 5),
  ...foliageItems('eucalyptus', 8),
];
