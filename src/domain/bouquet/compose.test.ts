import { describe, expect, it, vi } from 'vitest';
import { CATALOG } from '../catalog';
import type { Catalog } from '../catalog';
import type {
  CompositionGenerator,
  CompositionTemplate,
  ElementPlacement,
  ItemRef,
} from '../composition/types';
import { applyComposition } from './compose';
import type { Bouquet, BouquetElement } from './types';

const rowPlacement = (item: ItemRef, index: number, seed: number): ElementPlacement =>
  item.kind === 'flower'
    ? {
        kind: 'flower',
        catalogId: item.catalogId,
        colorId: item.colorId,
        position: { x: index * 10, y: -500 },
        rotation: seed,
        scale: 1,
      }
    : {
        kind: 'foliage',
        catalogId: item.catalogId,
        position: { x: index * 10, y: -500 },
        rotation: seed,
        scale: 1,
      };

const rowGenerator: CompositionGenerator = ({ items, seed }) =>
  items.map((item, index) => rowPlacement(item, index, seed));

const DEFAULT_ITEMS: readonly ItemRef[] = [
  { kind: 'flower', catalogId: 'peony', colorId: 'blush' },
  { kind: 'flower', catalogId: 'rose', colorId: 'white' },
  { kind: 'foliage', catalogId: 'eucalyptus' },
];

const template = (generate: CompositionGenerator = rowGenerator): CompositionTemplate => ({
  id: 'row',
  seed: 7,
  defaultItems: DEFAULT_ITEMS,
  generate,
});

const flower = (
  id: string,
  catalogId: 'rose' | 'tulip',
  colorId: 'red' | 'pink',
): BouquetElement => ({
  id,
  kind: 'flower',
  catalogId,
  colorId,
  position: { x: 300, y: 200 },
  rotation: 45,
  scale: 1.5,
});

const foliage = (id: string): BouquetElement => ({
  id,
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: -300, y: 100 },
  rotation: 10,
  scale: 0.8,
});

const bouquet = (
  elements: BouquetElement[],
  wrappingId: Bouquet['wrappingId'] = 'kraft',
): Bouquet => ({
  schemaVersion: 1,
  elements,
  wrappingId,
});

describe('applyComposition', () => {
  it('asks the generator for exactly the bouquet items, in bouquet order, with catalog and seed', () => {
    const generate = vi.fn<CompositionGenerator>(rowGenerator);
    applyComposition(
      bouquet([flower('e4', 'rose', 'red'), foliage('e9'), flower('e2', 'tulip', 'pink')]),
      template(generate),
    );
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith({
      items: [
        { kind: 'flower', catalogId: 'rose', colorId: 'red' },
        { kind: 'foliage', catalogId: 'fern' },
        { kind: 'flower', catalogId: 'tulip', colorId: 'pink' },
      ],
      catalog: CATALOG,
      seed: 7,
    });
  });

  it('passes a custom catalog through to the generator', () => {
    const generate = vi.fn<CompositionGenerator>(rowGenerator);
    const custom: Catalog = { ...CATALOG, wrappings: [] };
    applyComposition(bouquet([foliage('e1')]), template(generate), custom);
    expect(generate.mock.calls[0]?.[0].catalog).toBe(custom);
  });

  it('replaces the arrangement and assigns ids e1..eN in output order', () => {
    const result = applyComposition(
      bouquet([flower('e7', 'rose', 'red'), foliage('e3'), flower('e5', 'tulip', 'pink')]),
      template(),
    );
    expect(result.elements.map((element) => element.id)).toEqual(['e1', 'e2', 'e3']);
    expect(result.elements.map((element) => element.position.x)).toEqual([0, 10, 20]);
    expect(result.elements.map((element) => element.rotation)).toEqual([7, 7, 7]);
    expect(result.elements[1]).toMatchObject({ kind: 'foliage', catalogId: 'fern' });
  });

  it('keeps the chosen wrapping, including none', () => {
    expect(applyComposition(bouquet([foliage('e1')], 'burlap'), template()).wrappingId).toBe(
      'burlap',
    );
    expect(applyComposition(bouquet([foliage('e1')], null), template()).wrappingId).toBeNull();
  });

  it('produces as many elements as it received', () => {
    const elements = [flower('e1', 'rose', 'red'), foliage('e2'), foliage('e3'), foliage('e4')];
    expect(applyComposition(bouquet(elements), template()).elements).toHaveLength(4);
  });

  it('uses the default items for an empty bouquet and keeps its absent wrapping', () => {
    const result = applyComposition(bouquet([], null), template());
    expect(result.elements).toHaveLength(DEFAULT_ITEMS.length);
    expect(result.elements.map((element) => element.catalogId)).toEqual([
      'peony',
      'rose',
      'eucalyptus',
    ]);
    expect(result.elements.map((element) => element.id)).toEqual(['e1', 'e2', 'e3']);
    expect(result.wrappingId).toBeNull();
  });

  it('counts a wrapping-only bouquet as empty: default items, wrapping kept', () => {
    const result = applyComposition(bouquet([], 'ivory'), template());
    expect(result.elements).toHaveLength(DEFAULT_ITEMS.length);
    expect(result.wrappingId).toBe('ivory');
  });

  it('never returns more elements than it received', () => {
    const greedy: CompositionGenerator = (input) => [
      ...rowGenerator(input),
      ...rowGenerator(input),
    ];
    expect(
      applyComposition(bouquet([flower('e1', 'rose', 'red')]), template(greedy)).elements,
    ).toHaveLength(1);
    expect(applyComposition(bouquet([]), template(greedy)).elements).toHaveLength(
      DEFAULT_ITEMS.length,
    );
  });

  it('clamps anchors to the model bounds as a last guard', () => {
    const wild: CompositionGenerator = ({ items }) =>
      items.map((item, index) => ({
        ...rowPlacement(item, index, 0),
        position: { x: 900, y: -1500 },
      }));
    const result = applyComposition(bouquet([foliage('e1')]), template(wild));
    expect(result.elements[0]?.position).toEqual({ x: 500, y: -1000 });
  });

  it('is deterministic and does not modify its input', () => {
    const input = bouquet([flower('e1', 'rose', 'red'), foliage('e2')]);
    const snapshot = structuredClone(input);
    const first = applyComposition(input, template());
    const second = applyComposition(input, template());
    expect(first).toEqual(second);
    expect(input).toEqual(snapshot);
  });

  it('returns an ordinary bouquet', () => {
    const result = applyComposition(bouquet([flower('e1', 'rose', 'red')]), template());
    expect(result.schemaVersion).toBe(1);
  });
});
