import type { CompositionGenerator } from '../types';
import { ringGenerator } from './ringLayout';
import { flowerItems, foliageItems } from './shared';

export const generateCompact: CompositionGenerator = ringGenerator({
  centre: { x: 0, y: -540 },
  dMax: 115,
  rLimit: 300,
  factor: 0.8,
});

export const COMPACT_DEFAULT_ITEMS = [
  ...flowerItems('rose', 'white', 1),
  ...flowerItems('rose', 'peach', 6),
  ...flowerItems('carnation', 'white', 5),
  ...flowerItems('carnation', 'pink', 4),
  ...foliageItems('ruscus', 6),
];
