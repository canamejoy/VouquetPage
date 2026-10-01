import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import type { Catalog } from '../catalog';
import { canonicalItems } from './order';
import type { FlowerRef, FoliageRef } from './types';

const flower = (
  catalogId: FlowerRef['catalogId'],
  colorId: FlowerRef['colorId'] = null,
): FlowerRef => ({
  kind: 'flower',
  catalogId,
  colorId,
});
const foliage = (catalogId: FoliageRef['catalogId']): FoliageRef => ({
  kind: 'foliage',
  catalogId,
});

describe('canonicalItems', () => {
  it('splits flowers and foliage', () => {
    const result = canonicalItems(
      [foliage('fern'), flower('rose', 'red'), foliage('olive')],
      CATALOG,
    );
    expect(result.flowers.map((item) => item.catalogId)).toEqual(['rose']);
    expect(result.foliage.map((item) => item.catalogId)).toEqual(['fern', 'olive']);
  });

  it('sorts flowers by descending catalog area', () => {
    const items = [
      'lavender',
      'tulip',
      'carnation',
      'rose',
      'gerbera',
      'lily',
      'peony',
      'sunflower',
    ] as const;
    const result = canonicalItems(
      items.map((id) => flower(id)),
      CATALOG,
    );
    expect(result.flowers.map((item) => item.catalogId)).toEqual([
      'sunflower',
      'peony',
      'lily',
      'gerbera',
      'rose',
      'carnation',
      'tulip',
      'lavender',
    ]);
  });

  it('breaks an area tie by catalog order', () => {
    const tied: Catalog = {
      ...CATALOG,
      flowers: [
        { kind: 'flower', id: 'tulip', priceCop: 1, size: { width: 100, height: 100 }, colors: [] },
        { kind: 'flower', id: 'rose', priceCop: 1, size: { width: 50, height: 200 }, colors: [] },
      ],
    };
    const result = canonicalItems([flower('rose'), flower('tulip')], tied);
    expect(result.flowers.map((item) => item.catalogId)).toEqual(['tulip', 'rose']);
  });

  it('orders the colours of one flower by the flower colour list', () => {
    const result = canonicalItems(
      [flower('rose', 'white'), flower('rose', 'red'), flower('rose', 'blush')],
      CATALOG,
    );
    expect(result.flowers.map((item) => item.colorId)).toEqual(['red', 'blush', 'white']);
  });

  it('keeps the original bouquet order for identical flowers', () => {
    const first = flower('rose', 'red');
    const second = flower('rose', 'red');
    const result = canonicalItems([first, second], CATALOG);
    expect(result.flowers[0]).toBe(first);
    expect(result.flowers[1]).toBe(second);
  });

  it('puts unknown flowers last', () => {
    const unknown = flower('rose', 'red');
    const empty: Catalog = {
      ...CATALOG,
      flowers: CATALOG.flowers.filter((item) => item.id !== 'rose'),
    };
    const result = canonicalItems([unknown, flower('lavender')], empty);
    expect(result.flowers.map((item) => item.catalogId)).toEqual(['lavender', 'rose']);
  });

  it('sorts foliage by catalog order, then bouquet order', () => {
    const firstFern = foliage('fern');
    const secondFern = foliage('fern');
    const result = canonicalItems(
      [foliage('dusty-miller'), firstFern, foliage('eucalyptus'), secondFern, foliage('ruscus')],
      CATALOG,
    );
    expect(result.foliage.map((item) => item.catalogId)).toEqual([
      'eucalyptus',
      'ruscus',
      'fern',
      'fern',
      'dusty-miller',
    ]);
    expect(result.foliage[2]).toBe(firstFern);
    expect(result.foliage[3]).toBe(secondFern);
  });

  it('does not modify the input', () => {
    const items = [flower('lavender'), flower('sunflower')];
    canonicalItems(items, CATALOG);
    expect(items.map((item) => item.catalogId)).toEqual(['lavender', 'sunflower']);
  });

  it('handles no items', () => {
    expect(canonicalItems([], CATALOG)).toEqual({ flowers: [], foliage: [] });
  });
});
