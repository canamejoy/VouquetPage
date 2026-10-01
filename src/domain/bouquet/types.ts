import type { ColorId, FlowerId, FoliageId, WrappingId } from '../catalog';
import type { Point } from '../geometry';

/** `position` is the element anchor (bloom or sprig centre), in model units. */
interface ElementBase {
  id: string;
  position: Point;
  rotation: number;
  scale: number;
}

/** `colorId` is null for fixed-colour flowers. */
export interface FlowerElement extends ElementBase {
  kind: 'flower';
  catalogId: FlowerId;
  colorId: ColorId | null;
}

export interface FoliageElement extends ElementBase {
  kind: 'foliage';
  catalogId: FoliageId;
}

export type BouquetElement = FlowerElement | FoliageElement;

/** Array order is depth: index 0 is the back. The wrapping has no geometry of its own. */
export interface Bouquet {
  schemaVersion: 1;
  elements: BouquetElement[];
  wrappingId: WrappingId | null;
}

export const emptyBouquet = (): Bouquet => ({ schemaVersion: 1, elements: [], wrappingId: null });
