import type { ColorId } from './colors';

export type { ColorId } from './colors';

export type FlowerId =
  'rose' | 'tulip' | 'peony' | 'carnation' | 'gerbera' | 'lily' | 'sunflower' | 'lavender';
export type FoliageId = 'eucalyptus' | 'ruscus' | 'fern' | 'olive' | 'dusty-miller';
export type WrappingId = 'kraft' | 'ivory' | 'blush' | 'charcoal' | 'burlap';
export type CatalogId = FlowerId | FoliageId | WrappingId;

export interface Size {
  width: number;
  height: number;
}

/** `colors: []` means a fixed colour; otherwise the first entry is the default. */
export interface FlowerItem {
  kind: 'flower';
  id: FlowerId;
  priceCop: number;
  size: Size;
  colors: readonly ColorId[];
}

export interface FoliageItem {
  kind: 'foliage';
  id: FoliageId;
  priceCop: number;
  size: Size;
}

export interface WrappingItem {
  kind: 'wrapping';
  id: WrappingId;
  priceCop: number;
}

export type CatalogItem = FlowerItem | FoliageItem | WrappingItem;

export interface Catalog {
  flowers: readonly FlowerItem[];
  foliage: readonly FoliageItem[];
  wrappings: readonly WrappingItem[];
}
