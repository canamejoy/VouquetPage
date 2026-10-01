import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import type { Point } from '../geometry';
import { generateLongStems, LONG_STEMS_DEFAULT_ITEMS } from './templates/longStems';
import { generateWild, WILD_DEFAULT_ITEMS } from './templates/wild';
import type { CompositionGenerator, ElementPlacement, ItemRef } from './types';

const SEED = 11;
const C: Point = { x: 0, y: -540 };

/** `flowers` flowers then `foliage` foliage items, cycling through the catalog. */
function itemsOf(flowers: number, foliage: number): ItemRef[] {
  const out: ItemRef[] = [];
  for (let i = 0; i < flowers; i += 1) {
    const entry = CATALOG.flowers[i % CATALOG.flowers.length];
    if (!entry) throw new Error('empty catalog');
    out.push({ kind: 'flower', catalogId: entry.id, colorId: entry.colors[0] ?? null });
  }
  for (let i = 0; i < foliage; i += 1) {
    const entry = CATALOG.foliage[i % CATALOG.foliage.length];
    if (!entry) throw new Error('empty catalog');
    out.push({ kind: 'foliage', catalogId: entry.id });
  }
  return out;
}

const SPLITS: [number, number][] = [
  [1, 0],
  [0, 1],
  [2, 0],
  [1, 1],
  [7, 0],
  [20, 40],
  [40, 20],
  [60, 0],
  [0, 60],
  [1, 59],
];

const run = (generate: CompositionGenerator, items: readonly ItemRef[], seed = SEED) =>
  generate({ items, catalog: CATALOG, seed });

const keyOf = (item: { kind: string; catalogId: string; colorId?: string | null }) =>
  `${item.kind}/${item.catalogId}/${'colorId' in item ? item.colorId : ''}`;

/** Anchors outside these envelopes would mean the final clamp (or a broken rule) moved them. */
const ENVELOPES = [
  {
    name: 'Wild',
    generate: generateWild,
    // Spiral radius below 430 plus jitter 26 per axis; one unit of integer rounding.
    inside: ({ position: { x, y } }: ElementPlacement) =>
      Math.abs(x - C.x) <= 457 && Math.abs(y - C.y) <= 457,
  },
  {
    name: 'Long stems',
    generate: generateLongStems,
    inside: (p: ElementPlacement) =>
      p.kind === 'flower'
        ? Math.abs(p.position.x) <= 186 && p.position.y >= -900 && p.position.y <= -100
        : Math.abs(p.position.x) <= 320 && p.position.y <= 80,
  },
];

describe.each(ENVELOPES)('$name', ({ generate, inside }) => {
  it.each(SPLITS)('places one item per input inside its envelope for (%i, %i)', (n, m) => {
    const items = itemsOf(n, m);
    const placements = run(generate, items);
    expect(placements).toHaveLength(n + m);
    expect(placements.map(keyOf).sort()).toEqual(items.map(keyOf).sort());
    expect(placements.every(inside)).toBe(true);
  });

  it('stays inside the envelope for every item count from 1 to 60 and every split', () => {
    for (let total = 1; total <= 60; total += 1) {
      for (let n = 0; n <= total; n += 1) {
        expect(run(generate, itemsOf(n, total - n)).every(inside)).toBe(true);
      }
    }
  });

  it('is deterministic and puts foliage first, then flowers', () => {
    const items = itemsOf(5, 4);
    const first = run(generate, items);
    expect(first).toEqual(run(generate, items));
    expect(first.slice(0, 4).every((p) => p.kind === 'foliage')).toBe(true);
    expect(first.slice(4).every((p) => p.kind === 'flower')).toBe(true);
  });
});

describe('Wild', () => {
  it('gives different layouts for two seeds', () => {
    const items = itemsOf(8, 5);
    expect(run(generateWild, items, 3)).not.toEqual(run(generateWild, items, 4));
  });
});

describe('Long stems, default set', () => {
  it('keeps every flower within abs(x) <= 200 and y <= -600', () => {
    const flowers = run(generateLongStems, LONG_STEMS_DEFAULT_ITEMS).filter(
      (p) => p.kind === 'flower',
    );
    expect(flowers).toHaveLength(7);
    for (const { position } of flowers) {
      expect(Math.abs(position.x)).toBeLessThanOrEqual(200);
      expect(position.y).toBeLessThanOrEqual(-600);
    }
  });
});

const describePlacements = (placements: ElementPlacement[]) =>
  placements.map(
    (p) =>
      `${p.catalogId}${'colorId' in p && p.colorId ? `:${p.colorId}` : ''} ${p.position.x},${p.position.y} r${p.rotation} s${p.scale}`,
  );

describe('golden layouts of the default sets', () => {
  it('Wild', () => {
    expect(describePlacements(run(generateWild, WILD_DEFAULT_ITEMS))).toMatchInlineSnapshot(`
      [
        "fern -251,-769 r334 s1",
        "fern 359,-519 r96 s0.99",
        "eucalyptus -265,-341 r238 s1.01",
        "olive 73,-878 r350 s0.8",
        "olive 214,-220 r166 s0.89",
        "fern -366,-607 r261 s1.01",
        "eucalyptus 315,-718 r67 s0.95",
        "carnation:pink -9,-210 r178 s0.97",
        "lavender 219,-786 r21 s0.91",
        "lavender -300,-512 r238 s0.96",
        "rose:peach 243,-378 r129 s1.12",
        "carnation:pink -67,-819 r5 s1.12",
        "rose:peach -155,-301 r191 s1",
        "sunflower 249,-625 r56 s1.09",
        "gerbera:orange -211,-649 r285 s1.05",
        "tulip:yellow 86,-325 r135 s0.89",
        "gerbera:orange 52,-751 r44 s1",
        "gerbera:orange -185,-432 r250 s0.79",
        "carnation:pink 205,-490 r94 s0.96",
        "sunflower -79,-696 r306 s0.76",
        "rose:peach -24,-363 r208 s0.81",
        "lavender 94,-614 r55 s0.89",
        "tulip:yellow -143,-538 r265 s1.14",
        "tulip:yellow 77,-481 r125 s1",
        "sunflower 4,-598 r15 s1.09",
      ]
    `);
  });

  it('Long stems', () => {
    expect(describePlacements(run(generateLongStems, LONG_STEMS_DEFAULT_ITEMS)))
      .toMatchInlineSnapshot(`
      [
        "ruscus 110,-620 r18 s1",
        "ruscus -110,-620 r342 s1",
        "ruscus 215,-520 r30 s1",
        "ruscus -215,-520 r330 s1",
        "tulip:white -186,-645 r342 s1",
        "tulip:white 186,-645 r18 s1",
        "rose:red -124,-760 r348 s1",
        "rose:red 124,-760 r12 s1",
        "rose:red -62,-785 r354 s1",
        "rose:red 62,-785 r6 s1",
        "lily:white 0,-900 r0 s1",
      ]
    `);
  });
});
