import { describe, expect, it } from 'vitest';
import { CATALOG } from '../catalog';
import type { Point } from '../geometry';
import { generateCompact, COMPACT_DEFAULT_ITEMS } from './templates/compact';
import { generateRound, ROUND_DEFAULT_ITEMS } from './templates/round';
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

const distanceFrom = (centre: Point, placement: ElementPlacement) =>
  Math.hypot(placement.position.x - centre.x, placement.position.y - centre.y);

/** Anchors outside these envelopes would mean the final clamp (or a broken rule) moved them. */
const ENVELOPES = [
  {
    name: 'Round',
    generate: generateRound,
    inside: (p: ElementPlacement) => distanceFrom(C, p) <= 441,
  },
  {
    name: 'Compact',
    generate: generateCompact,
    inside: (p: ElementPlacement) => distanceFrom(C, p) <= 301,
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

describe('Round and Compact', () => {
  it('differ for two or more items', () => {
    for (const [n, m] of [
      [2, 0],
      [0, 2],
      [1, 1],
      [12, 0],
      [20, 40],
    ] as const) {
      const items = itemsOf(n, m);
      const anchors = (generate: CompositionGenerator) =>
        run(generate, items).map((p) => p.position);
      expect(anchors(generateRound)).not.toEqual(anchors(generateCompact));
    }
  });

  it('place the single focal flower at C', () => {
    const items = itemsOf(1, 0);
    expect(run(generateRound, items)[0]?.position).toEqual(C);
    expect(run(generateCompact, items)[0]?.position).toEqual(C);
  });

  it('scale by the template factor and the ring spacing (0.8 x 60 / 115 = 0.42 at T = 5)', () => {
    const scales = (generate: CompositionGenerator, n: number, m = 0) => [
      ...new Set(run(generate, itemsOf(n, m)).map((p) => p.scale)),
    ];
    expect(scales(generateRound, 2)).toEqual([1]);
    expect(scales(generateCompact, 2)).toEqual([0.8]);
    expect(scales(generateCompact, 20, 40)).toEqual([0.42]);
  });
});

describe('Round, default set', () => {
  it('mirrors its anchors about x = 0', () => {
    const anchors = run(generateRound, ROUND_DEFAULT_ITEMS).map((p) => p.position);
    const mirrored = anchors.map(({ x, y }) => ({ x: x === 0 ? 0 : -x, y }));
    const order = (a: Point, b: Point) => a.x - b.x || a.y - b.y;
    expect([...mirrored].sort(order)).toEqual([...anchors].sort(order));
  });
});

const describePlacements = (placements: ElementPlacement[]) =>
  placements.map(
    (p) =>
      `${p.catalogId}${'colorId' in p && p.colorId ? `:${p.colorId}` : ''} ${p.position.x},${p.position.y} r${p.rotation} s${p.scale}`,
  );

describe('golden layouts of the default sets', () => {
  it('Round', () => {
    expect(describePlacements(run(generateRound, ROUND_DEFAULT_ITEMS))).toMatchInlineSnapshot(`
      [
        "eucalyptus 0,-975 r0 s1",
        "eucalyptus 308,-848 r45 s1",
        "eucalyptus 435,-540 r90 s1",
        "eucalyptus 308,-232 r135 s1",
        "eucalyptus 0,-105 r180 s1",
        "eucalyptus -308,-232 r225 s1",
        "eucalyptus -435,-540 r270 s1",
        "eucalyptus -308,-848 r315 s1",
        "carnation:pink -90,-816 r342 s1",
        "carnation:pink -235,-710 r306 s1",
        "carnation:pink -290,-540 r270 s1",
        "carnation:pink -235,-370 r234 s1",
        "carnation:pink -90,-264 r198 s1",
        "rose:white 90,-264 r162 s1",
        "rose:white 235,-370 r126 s1",
        "rose:white 290,-540 r90 s1",
        "rose:white 235,-710 r54 s1",
        "rose:white 90,-816 r18 s1",
        "rose:blush -126,-612 r300 s1",
        "rose:blush -126,-467 r240 s1",
        "rose:blush 0,-395 r180 s1",
        "rose:blush 126,-467 r120 s1",
        "rose:blush 126,-612 r60 s1",
        "rose:blush 0,-685 r0 s1",
        "peony:blush 0,-540 r0 s1",
      ]
    `);
  });

  it('Compact', () => {
    expect(describePlacements(run(generateCompact, COMPACT_DEFAULT_ITEMS))).toMatchInlineSnapshot(`
      [
        "ruscus 0,-840 r0 s0.7",
        "ruscus 260,-690 r60 s0.7",
        "ruscus 260,-390 r120 s0.7",
        "ruscus 0,-240 r180 s0.7",
        "ruscus -260,-390 r240 s0.7",
        "ruscus -260,-690 r300 s0.7",
        "carnation:white -68,-728 r340 s0.7",
        "carnation:white -173,-640 r300 s0.7",
        "carnation:white -197,-505 r260 s0.7",
        "carnation:white -129,-387 r220 s0.7",
        "carnation:white 0,-340 r180 s0.7",
        "carnation:pink 129,-387 r140 s0.7",
        "carnation:pink 197,-505 r100 s0.7",
        "carnation:pink 173,-640 r60 s0.7",
        "carnation:pink 68,-728 r20 s0.7",
        "rose:peach -87,-590 r300 s0.7",
        "rose:peach -87,-490 r240 s0.7",
        "rose:peach 0,-440 r180 s0.7",
        "rose:peach 87,-490 r120 s0.7",
        "rose:peach 87,-590 r60 s0.7",
        "rose:peach 0,-640 r0 s0.7",
        "rose:white 0,-540 r0 s0.7",
      ]
    `);
  });
});
