import { describe, expect, it } from 'vitest';
import { addElement } from './add';
import { deleteElement } from './operations';
import { elementQuantities } from './quantities';
import { emptyBouquet } from './types';
import type { Bouquet } from './types';

const at = { x: 0, y: -100 };

const build = (): Bouquet => {
  let bouquet = emptyBouquet();
  for (const id of ['rose', 'rose', 'tulip', 'fern', 'sunflower', 'sunflower'] as const) {
    bouquet = addElement(bouquet, id, at);
  }
  return bouquet;
};

describe('elementQuantities', () => {
  it('counts elements per catalog item and colour in order of first appearance', () => {
    expect(elementQuantities(build())).toEqual([
      { catalogId: 'rose', colorId: 'red', quantity: 2 },
      { catalogId: 'tulip', colorId: 'red', quantity: 1 },
      { catalogId: 'fern', colorId: null, quantity: 1 },
      { catalogId: 'sunflower', colorId: null, quantity: 2 },
    ]);
  });

  it('separates the same flower in different colours', () => {
    const base = build();
    const recoloured = {
      ...base,
      elements: base.elements.map((e) =>
        e.id === 'e2' && e.kind === 'flower' ? { ...e, colorId: 'white' as const } : e,
      ),
    };
    expect(elementQuantities(recoloured).slice(0, 2)).toEqual([
      { catalogId: 'rose', colorId: 'red', quantity: 1 },
      { catalogId: 'rose', colorId: 'white', quantity: 1 },
    ]);
  });

  it('follows edits: deleting one of two roses leaves a rose quantity of 1', () => {
    const roses = elementQuantities(deleteElement(build(), 'e1')).find(
      (q) => q.catalogId === 'rose',
    );
    expect(roses?.quantity).toBe(1);
  });

  it('is empty only because the bouquet has no elements', () => {
    expect(elementQuantities(addElement(emptyBouquet(), 'rose', at))).toHaveLength(1);
    expect(elementQuantities(emptyBouquet())).toEqual([]);
  });

  it('never stores a quantity field on the bouquet or its elements', () => {
    const bouquet = build();
    expect(Object.keys(bouquet).sort()).toEqual(['elements', 'schemaVersion', 'wrappingId']);
    for (const element of bouquet.elements) {
      expect(Object.keys(element)).not.toContain('quantity');
    }
    expect(bouquet.elements).toHaveLength(6);
  });
});
