import { describe, expect, it } from 'vitest';
import { COLOR_HEX } from './colors';
import { CATALOG } from './data';
import {
  defaultColor,
  getFlower,
  getFoliage,
  getItem,
  getWrapping,
  isColorAvailable,
} from './lookup';
import type { ColorId } from './types';

describe('catalog size and categories', () => {
  it('has 8 flowers, 5 foliage and 5 wrappings', () => {
    expect(CATALOG.flowers).toHaveLength(8);
    expect(CATALOG.foliage).toHaveLength(5);
    expect(CATALOG.wrappings).toHaveLength(5);
  });

  it('uses unique ids across all categories', () => {
    const ids = [...CATALOG.flowers, ...CATALOG.foliage, ...CATALOG.wrappings].map((i) => i.id);
    expect(new Set(ids).size).toBe(18);
  });

  it('gives every item a positive integer sample price in whole COP', () => {
    const items = [...CATALOG.flowers, ...CATALOG.foliage, ...CATALOG.wrappings];
    for (const item of items) {
      expect(Number.isInteger(item.priceCop)).toBe(true);
      expect(item.priceCop).toBeGreaterThan(0);
    }
  });

  it('gives flowers and foliage a positive size', () => {
    for (const item of [...CATALOG.flowers, ...CATALOG.foliage]) {
      expect(item.size.width).toBeGreaterThan(0);
      expect(item.size.height).toBeGreaterThan(0);
    }
  });

  it('pins the sample prices from the design', () => {
    expect(CATALOG.flowers.map((f) => [f.id, f.priceCop])).toEqual([
      ['rose', 6000],
      ['tulip', 5000],
      ['peony', 12000],
      ['carnation', 3000],
      ['gerbera', 4500],
      ['lily', 9000],
      ['sunflower', 7000],
      ['lavender', 3500],
    ]);
    expect(CATALOG.foliage.map((f) => [f.id, f.priceCop])).toEqual([
      ['eucalyptus', 3000],
      ['ruscus', 2500],
      ['fern', 2000],
      ['olive', 3500],
      ['dusty-miller', 3000],
    ]);
    expect(CATALOG.wrappings.map((w) => [w.id, w.priceCop])).toEqual([
      ['kraft', 4000],
      ['ivory', 5000],
      ['blush', 7000],
      ['charcoal', 7000],
      ['burlap', 6000],
    ]);
  });

  it('pins the sizes from the design', () => {
    expect(getFlower('rose')?.size).toEqual({ width: 150, height: 150 });
    expect(getFlower('lavender')?.size).toEqual({ width: 60, height: 220 });
    expect(getFoliage('fern')?.size).toEqual({ width: 180, height: 280 });
  });
});

describe('per-flower colour availability', () => {
  it('lists at least two distinct colours for every recolourable flower', () => {
    for (const flower of CATALOG.flowers) {
      if (flower.colors.length === 0) continue;
      expect(flower.colors.length).toBeGreaterThanOrEqual(2);
      expect(new Set(flower.colors).size).toBe(flower.colors.length);
    }
  });

  it('uses the first colour as the default', () => {
    expect(getFlower('rose')?.colors[0]).toBe('red');
    expect(getFlower('peony')?.colors[0]).toBe('blush');
  });

  it('lists no colours for sunflower and lavender', () => {
    expect(getFlower('sunflower')?.colors).toEqual([]);
    expect(getFlower('lavender')?.colors).toEqual([]);
  });

  it('lists the rose colours from the design', () => {
    expect(getFlower('rose')?.colors).toEqual(['red', 'blush', 'white', 'peach', 'burgundy']);
  });

  it('defines a hex value for every colour used by a flower', () => {
    const used = new Set<ColorId>(CATALOG.flowers.flatMap((f) => f.colors));
    for (const color of used) expect(COLOR_HEX[color]).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('pins the shared hex values from the design', () => {
    expect(COLOR_HEX).toEqual({
      red: '#B3262E',
      blush: '#E8B7B9',
      white: '#F7F2EA',
      peach: '#F2B58C',
      burgundy: '#6E1F2E',
      yellow: '#EDC84A',
      pink: '#DE7FA0',
      purple: '#7E5AA6',
      coral: '#EE7A62',
      orange: '#E88A2E',
    });
  });
});

describe('lookup by id', () => {
  it('finds an item of each kind', () => {
    expect(getItem('rose')?.kind).toBe('flower');
    expect(getItem('dusty-miller')?.kind).toBe('foliage');
    expect(getItem('kraft')?.kind).toBe('wrapping');
  });

  it('returns undefined for an unknown id', () => {
    expect(getItem('plastic' as never)).toBeUndefined();
    expect(getFlower('fern' as never)).toBeUndefined();
    expect(getFoliage('rose' as never)).toBeUndefined();
    expect(getWrapping('rose' as never)).toBeUndefined();
  });

  it('resolves every id of every category', () => {
    for (const item of [...CATALOG.flowers, ...CATALOG.foliage, ...CATALOG.wrappings]) {
      expect(getItem(item.id)).toBe(item);
    }
  });
});

describe('recolour availability', () => {
  it('accepts a colour in the flower list', () => {
    expect(isColorAvailable('rose', 'burgundy')).toBe(true);
    expect(isColorAvailable('peony', 'coral')).toBe(true);
  });

  it('rejects a colour outside the flower list', () => {
    expect(isColorAvailable('rose', 'purple')).toBe(false);
    expect(isColorAvailable('peony', 'red')).toBe(false);
  });

  it('rejects every colour for fixed-colour flowers', () => {
    expect(isColorAvailable('sunflower', 'yellow')).toBe(false);
    expect(isColorAvailable('lavender', 'purple')).toBe(false);
  });

  it('rejects an unknown flower', () => {
    expect(isColorAvailable('fern' as never, 'red')).toBe(false);
  });

  it('returns the first colour as default, or null for fixed-colour flowers', () => {
    expect(defaultColor('rose')).toBe('red');
    expect(defaultColor('gerbera')).toBe('orange');
    expect(defaultColor('sunflower')).toBeNull();
    expect(defaultColor('fern' as never)).toBeNull();
  });
});
