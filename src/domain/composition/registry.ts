import { generateAsymmetric, ASYMMETRIC_DEFAULT_ITEMS } from './templates/asymmetric';
import { CASCADE_DEFAULT_ITEMS, generateCascade } from './templates/cascade';
import { COMPACT_DEFAULT_ITEMS, generateCompact } from './templates/compact';
import { generateLongStems, LONG_STEMS_DEFAULT_ITEMS } from './templates/longStems';
import { generateRound, ROUND_DEFAULT_ITEMS } from './templates/round';
import { generateWild, WILD_DEFAULT_ITEMS } from './templates/wild';
import type { CompositionTemplate } from './types';

/**
 * The six templates, in the order the UI lists them. Display names and descriptions are not
 * stored here: the UI derives their dictionary keys from `id`.
 */
export const COMPOSITIONS: readonly CompositionTemplate[] = [
  { id: 'round', seed: 1, defaultItems: ROUND_DEFAULT_ITEMS, generate: generateRound },
  { id: 'compact', seed: 2, defaultItems: COMPACT_DEFAULT_ITEMS, generate: generateCompact },
  {
    id: 'asymmetric',
    seed: 3,
    defaultItems: ASYMMETRIC_DEFAULT_ITEMS,
    generate: generateAsymmetric,
  },
  { id: 'wild', seed: 4, defaultItems: WILD_DEFAULT_ITEMS, generate: generateWild },
  {
    id: 'long-stems',
    seed: 5,
    defaultItems: LONG_STEMS_DEFAULT_ITEMS,
    generate: generateLongStems,
  },
  { id: 'cascade', seed: 6, defaultItems: CASCADE_DEFAULT_ITEMS, generate: generateCascade },
];
