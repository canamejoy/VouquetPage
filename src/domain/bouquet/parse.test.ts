import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import { addElement } from './add';
import { MAX_ELEMENTS } from './limits';
import { setWrapping, transformElement } from './operations';
import { parseBouquet } from './parse';
import { emptyBouquet } from './types';
import type { Bouquet } from './types';

const rose = {
  id: 'e1',
  kind: 'flower',
  catalogId: 'rose',
  colorId: 'red',
  position: { x: 10, y: -200 },
  rotation: 45,
  scale: 1.5,
};
const fern = {
  id: 'e2',
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: -20, y: -100 },
  rotation: 0,
  scale: 1,
};
const sunflower = { ...rose, id: 'e3', catalogId: 'sunflower', colorId: null };

const draft = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  schemaVersion: 1,
  elements: [rose, fern, sunflower],
  wrappingId: 'kraft',
  ...overrides,
});

const withRose = (patch: Record<string, unknown>): unknown =>
  draft({ elements: [{ ...rose, ...patch }] });

describe('parseBouquet: valid data', () => {
  it('round-trips a bouquet built with the operations through JSON', () => {
    let bouquet: Bouquet = emptyBouquet();
    bouquet = addElement(bouquet, 'rose', { x: 10, y: -200 });
    bouquet = addElement(bouquet, 'fern', { x: -20, y: -100 });
    bouquet = addElement(bouquet, 'sunflower', { x: 0, y: 0 });
    bouquet = transformElement(bouquet, 'e1', { rotation: 45, scale: 1.5 });
    bouquet = setWrapping(bouquet, 'burlap');
    expect(parseBouquet(JSON.parse(JSON.stringify(bouquet)))).toEqual(bouquet);
  });

  it('accepts an empty bouquet and a null wrapping', () => {
    expect(parseBouquet(JSON.parse(JSON.stringify(emptyBouquet())))).toEqual(emptyBouquet());
  });

  it('accepts the exact limits: 60 elements, bounds, scale range, rotation 0', () => {
    const edge = (n: number, x: number, y: number, scale: number) => ({
      ...fern,
      id: `e${n}`,
      position: { x, y },
      scale,
    });
    const elements = Array.from({ length: MAX_ELEMENTS }, (_, i) => edge(i + 1, 500, 300, 2.5));
    elements[1] = edge(2, -500, -1000, 0.4);
    expect(parseBouquet(draft({ elements }))?.elements).toHaveLength(MAX_ELEMENTS);
  });

  it('accepts non-contiguous ids that match the pattern', () => {
    const elements = [
      { ...fern, id: 'e7' },
      { ...fern, id: 'e12' },
    ];
    expect(parseBouquet(draft({ elements }))?.elements.map((e) => e.id)).toEqual(['e7', 'e12']);
  });

  it('builds a fresh object and drops unknown properties', () => {
    const parsed = parseBouquet(
      draft({ extra: 1, elements: [{ ...fern, quantity: 3, colorId: 'red' }] }),
    );
    expect(parsed).toEqual({ schemaVersion: 1, elements: [fern], wrappingId: 'kraft' });
  });

  it('uses the catalog passed in', () => {
    const none = { ...CATALOG, flowers: [], wrappings: [] };
    expect(parseBouquet(draft(), none)).toBeNull();
  });
});

describe('parseBouquet: rejections', () => {
  const sparse: unknown[] = [rose];
  sparse[2] = fern;

  const rejected: [string, unknown][] = [
    ['null', null],
    ['a string', 'bouquet'],
    ['an array', []],
    ['a number', 1],
    ['wrong version', draft({ schemaVersion: 2 })],
    ['missing version', { elements: [], wrappingId: null }],
    ['string version', draft({ schemaVersion: '1' })],
    ['elements not an array', draft({ elements: {} })],
    ['missing elements', { schemaVersion: 1, wrappingId: null }],
    [
      'over 60 elements',
      draft({ elements: Array.from({ length: 61 }, (_, i) => ({ ...fern, id: `e${i + 1}` })) }),
    ],
    ['element not an object', draft({ elements: [rose, null] })],
    ['sparse elements', draft({ elements: sparse })],
    ['missing id', withRose({ id: undefined })],
    ['numeric id', withRose({ id: 1 })],
    ['id e0', withRose({ id: 'e0' })],
    ['id with leading zero', withRose({ id: 'e01' })],
    ['id with other prefix', withRose({ id: 'x1' })],
    ['id with trailing text', withRose({ id: 'e1x' })],
    ['id with newline suffix', withRose({ id: 'e1\n' })],
    ['duplicate id', draft({ elements: [rose, { ...fern, id: 'e1' }] })],
    ['unknown kind', withRose({ kind: 'wrapping' })],
    ['unknown catalog id', withRose({ catalogId: 'orchid' })],
    ['flower kind with foliage id', withRose({ catalogId: 'fern' })],
    ['foliage kind with flower id', draft({ elements: [{ ...fern, catalogId: 'rose' }] })],
    ['wrapping id as element', draft({ elements: [{ ...fern, catalogId: 'kraft' }] })],
    ['inherited property name as id', withRose({ catalogId: 'constructor' })],
    ['colour not listed for the flower', withRose({ colorId: 'lavender' })],
    ['unknown colour', withRose({ colorId: 'teal' })],
    ['numeric colour', withRose({ colorId: 3 })],
    ['null colour on a recolourable flower', withRose({ colorId: null })],
    ['missing colour on a recolourable flower', withRose({ colorId: undefined })],
    ['colour on a fixed-colour flower', draft({ elements: [{ ...sunflower, colorId: 'red' }] })],
    ['missing position', withRose({ position: undefined })],
    ['position not an object', withRose({ position: [1, 2] })],
    ['x as string', withRose({ position: { x: '10', y: 0 } })],
    ['x NaN', withRose({ position: { x: Number.NaN, y: 0 } })],
    ['y Infinity', withRose({ position: { x: 0, y: Number.POSITIVE_INFINITY } })],
    ['x above bounds', withRose({ position: { x: 501, y: 0 } })],
    ['x below bounds', withRose({ position: { x: -501, y: 0 } })],
    ['y above bounds', withRose({ position: { x: 0, y: 301 } })],
    ['y below bounds', withRose({ position: { x: 0, y: -1001 } })],
    ['rotation 360', withRose({ rotation: 360 })],
    ['negative rotation', withRose({ rotation: -1 })],
    ['rotation NaN', withRose({ rotation: Number.NaN })],
    ['rotation as string', withRose({ rotation: '45' })],
    ['scale below clamp', withRose({ scale: 0.39 })],
    ['scale above clamp', withRose({ scale: 2.51 })],
    ['scale Infinity', withRose({ scale: Number.POSITIVE_INFINITY })],
    ['scale missing', withRose({ scale: undefined })],
    ['unknown wrapping', draft({ wrappingId: 'gold' })],
    ['flower id as wrapping', draft({ wrappingId: 'rose' })],
    ['wrapping undefined', draft({ wrappingId: undefined })],
    ['wrapping number', draft({ wrappingId: 1 })],
  ];

  it.each(rejected)('returns null for %s', (_name, raw) => {
    expect(parseBouquet(raw)).toBeNull();
  });

  it('rejects the whole draft when only the last element is invalid', () => {
    const elements = [rose, fern, { ...sunflower, scale: 9 }];
    expect(parseBouquet(draft({ elements }))).toBeNull();
  });
});
