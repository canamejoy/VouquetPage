import type { FlowerElement, FoliageElement } from '../bouquet';
import type { Catalog, ColorId, FlowerId, FoliageId } from '../catalog';

export type FlowerRef = { kind: 'flower'; catalogId: FlowerId; colorId: ColorId | null };
export type FoliageRef = { kind: 'foliage'; catalogId: FoliageId };

/** One item of a composition: what to place, not where. */
export type ItemRef = FlowerRef | FoliageRef;

/** A placed element without its bouquet-local id; `applyComposition` assigns ids. */
export type ElementPlacement = Omit<FlowerElement, 'id'> | Omit<FoliageElement, 'id'>;

export interface CompositionInput {
  items: readonly ItemRef[];
  catalog: Catalog;
  seed: number;
}

/**
 * The only seam of the composition feature. A generator MUST return exactly one placement per
 * input item (same catalog ids and colours), in back-to-front order, with rounded values, and
 * MUST take all variation from the seed.
 */
export type CompositionGenerator = (input: CompositionInput) => ElementPlacement[];

/** What `applyComposition` needs from a template; the registry entries of later slices satisfy it. */
export interface CompositionTemplate {
  id: string;
  seed: number;
  defaultItems: readonly ItemRef[];
  generate: CompositionGenerator;
}
