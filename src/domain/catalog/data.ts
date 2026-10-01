import type { Catalog } from './types';

/**
 * Catalog data (design D3). Order is the display and tie-break order used by later slices.
 * Display names are not stored here: they come from the dictionary (`catalog.<id>`).
 * SAMPLE DATA: every price is a made-up whole-COP integer for the MVP, not a real price.
 * COP as the base currency is a recorded assumption pending user confirmation (task U5).
 */
export const CATALOG: Catalog = {
  flowers: [
    {
      kind: 'flower',
      id: 'rose',
      priceCop: 6000,
      size: { width: 150, height: 150 },
      colors: ['red', 'blush', 'white', 'peach', 'burgundy'],
    },
    {
      kind: 'flower',
      id: 'tulip',
      priceCop: 5000,
      size: { width: 110, height: 150 },
      colors: ['red', 'yellow', 'pink', 'white', 'purple'],
    },
    {
      kind: 'flower',
      id: 'peony',
      priceCop: 12000,
      size: { width: 190, height: 190 },
      colors: ['blush', 'coral', 'white'],
    },
    {
      kind: 'flower',
      id: 'carnation',
      priceCop: 3000,
      size: { width: 130, height: 130 },
      colors: ['red', 'pink', 'white'],
    },
    {
      kind: 'flower',
      id: 'gerbera',
      priceCop: 4500,
      size: { width: 160, height: 160 },
      colors: ['orange', 'pink', 'yellow', 'red'],
    },
    {
      kind: 'flower',
      id: 'lily',
      priceCop: 9000,
      size: { width: 180, height: 180 },
      colors: ['white', 'pink', 'orange'],
    },
    {
      kind: 'flower',
      id: 'sunflower',
      priceCop: 7000,
      size: { width: 200, height: 200 },
      colors: [],
    },
    {
      kind: 'flower',
      id: 'lavender',
      priceCop: 3500,
      size: { width: 60, height: 220 },
      colors: [],
    },
  ],
  foliage: [
    { kind: 'foliage', id: 'eucalyptus', priceCop: 3000, size: { width: 160, height: 260 } },
    { kind: 'foliage', id: 'ruscus', priceCop: 2500, size: { width: 120, height: 260 } },
    { kind: 'foliage', id: 'fern', priceCop: 2000, size: { width: 180, height: 280 } },
    { kind: 'foliage', id: 'olive', priceCop: 3500, size: { width: 130, height: 250 } },
    { kind: 'foliage', id: 'dusty-miller', priceCop: 3000, size: { width: 170, height: 190 } },
  ],
  wrappings: [
    { kind: 'wrapping', id: 'kraft', priceCop: 4000 },
    { kind: 'wrapping', id: 'ivory', priceCop: 5000 },
    { kind: 'wrapping', id: 'blush', priceCop: 7000 },
    { kind: 'wrapping', id: 'charcoal', priceCop: 7000 },
    { kind: 'wrapping', id: 'burlap', priceCop: 6000 },
  ],
};
