import { describe, expect, it } from 'vitest';
import { MODEL_BOUNDS, SCALE_MAX, SCALE_MIN } from '../geometry';
import { addElement } from './add';
import { nextElementId } from './ids';
import { MAX_ELEMENTS } from './limits';
import {
  clearBouquet,
  deleteElement,
  duplicateElement,
  recolorElement,
  reorderElement,
  setWrapping,
  transformElement,
} from './operations';
import { emptyBouquet } from './types';
import type { Bouquet, BouquetElement, FlowerElement } from './types';

const flower = (id: string, overrides: Partial<FlowerElement> = {}): FlowerElement => ({
  id,
  kind: 'flower',
  catalogId: 'rose',
  colorId: 'red',
  position: { x: 0, y: -200 },
  rotation: 0,
  scale: 1,
  ...overrides,
});

const withElements = (elements: BouquetElement[]): Bouquet => ({ ...emptyBouquet(), elements });

const fullBouquet = (): Bouquet =>
  withElements(Array.from({ length: MAX_ELEMENTS }, (_, i) => flower(`e${i + 1}`)));

const only = (bouquet: Bouquet): BouquetElement => {
  expect(bouquet.elements).toHaveLength(1);
  return bouquet.elements[0] as BouquetElement;
};

describe('emptyBouquet', () => {
  it('is version 1 with no elements and no wrapping', () => {
    expect(emptyBouquet()).toEqual({ schemaVersion: 1, elements: [], wrappingId: null });
  });
});

describe('nextElementId', () => {
  it('starts at e1 for an empty list', () => {
    expect(nextElementId([])).toBe('e1');
  });

  it('uses the maximum numeric suffix plus one, not the length', () => {
    expect(nextElementId([flower('e3'), flower('e1')])).toBe('e4');
  });

  it('ignores ids that do not match e{n}', () => {
    expect(nextElementId([flower('e2'), flower('x9'), flower('e07')])).toBe('e3');
  });
});

describe('addElement', () => {
  it('adds a flower with defaults, its default colour and the next id', () => {
    const next = addElement(emptyBouquet(), 'rose', { x: 10, y: -300 });
    expect(next.elements).toEqual([
      {
        id: 'e1',
        kind: 'flower',
        catalogId: 'rose',
        colorId: 'red',
        position: { x: 10, y: -300 },
        rotation: 0,
        scale: 1,
      },
    ]);
  });

  it('adds foliage without a colour field', () => {
    const element = only(addElement(emptyBouquet(), 'fern', { x: 0, y: -100 }));
    expect(element).toEqual({
      id: 'e1',
      kind: 'foliage',
      catalogId: 'fern',
      position: { x: 0, y: -100 },
      rotation: 0,
      scale: 1,
    });
    expect('colorId' in element).toBe(false);
  });

  it('uses a null colour for a fixed-colour flower', () => {
    const element = only(addElement(emptyBouquet(), 'sunflower', { x: 0, y: 0 }));
    expect(element).toMatchObject({ catalogId: 'sunflower', colorId: null });
  });

  it('appends on top and assigns max suffix plus one', () => {
    const base = withElements([flower('e2'), flower('e5')]);
    const next = addElement(base, 'tulip', { x: 0, y: 0 });
    expect(next.elements.map((e) => e.id)).toEqual(['e2', 'e5', 'e6']);
    expect(next.elements[2]).toMatchObject({ catalogId: 'tulip', colorId: 'red' });
  });

  it('clamps the anchor to the model bounds', () => {
    const next = addElement(emptyBouquet(), 'rose', { x: 900, y: -5000 });
    expect(only(next).position).toEqual({ x: MODEL_BOUNDS.maxX, y: MODEL_BOUNDS.minY });
    const other = addElement(emptyBouquet(), 'rose', { x: -900, y: 5000 });
    expect(only(other).position).toEqual({ x: MODEL_BOUNDS.minX, y: MODEL_BOUNDS.maxY });
  });

  it('does not mutate the input bouquet', () => {
    const base = emptyBouquet();
    addElement(base, 'rose', { x: 0, y: 0 });
    expect(base.elements).toEqual([]);
  });

  it('leaves the bouquet unchanged at the limit', () => {
    const full = fullBouquet();
    expect(addElement(full, 'rose', { x: 0, y: 0 })).toBe(full);
  });

  it('still adds at 59 elements and reaches the limit', () => {
    const almost = withElements(full59());
    expect(addElement(almost, 'rose', { x: 0, y: 0 }).elements).toHaveLength(MAX_ELEMENTS);
  });

  it('ignores a wrapping id', () => {
    const base = emptyBouquet();
    expect(addElement(base, 'kraft' as never, { x: 0, y: 0 })).toBe(base);
  });
});

function full59(): BouquetElement[] {
  return fullBouquet().elements.slice(0, MAX_ELEMENTS - 1);
}

describe('transformElement', () => {
  const base = withElements([flower('e1'), flower('e2')]);

  it('moves the anchor and clamps it to the bounds', () => {
    const moved = transformElement(base, 'e1', { position: { x: 120, y: -400 } });
    expect(moved.elements[0]?.position).toEqual({ x: 120, y: -400 });
    const clamped = transformElement(base, 'e1', { position: { x: 800, y: 900 } });
    expect(clamped.elements[0]?.position).toEqual({ x: MODEL_BOUNDS.maxX, y: MODEL_BOUNDS.maxY });
  });

  it('normalizes rotation to [0, 360)', () => {
    expect(transformElement(base, 'e1', { rotation: 370 }).elements[0]?.rotation).toBe(10);
    expect(transformElement(base, 'e1', { rotation: -90 }).elements[0]?.rotation).toBe(270);
  });

  it('clamps scale to the documented limits', () => {
    expect(transformElement(base, 'e1', { scale: 9 }).elements[0]?.scale).toBe(SCALE_MAX);
    expect(transformElement(base, 'e1', { scale: 0.01 }).elements[0]?.scale).toBe(SCALE_MIN);
    expect(transformElement(base, 'e1', { scale: 1.5 }).elements[0]?.scale).toBe(1.5);
  });

  it('applies only the given fields and leaves other elements alone', () => {
    const next = transformElement(base, 'e1', { rotation: 45 });
    expect(next.elements[0]).toEqual({ ...flower('e1'), rotation: 45 });
    expect(next.elements[1]).toBe(base.elements[1]);
  });

  it('returns the same bouquet for an unknown id', () => {
    expect(transformElement(base, 'e9', { rotation: 45 })).toBe(base);
  });
});

describe('recolorElement', () => {
  const base = withElements([
    flower('e1'),
    flower('e2', { catalogId: 'sunflower', colorId: null }),
  ]);

  it('sets a colour from the flower list', () => {
    expect((recolorElement(base, 'e1', 'burgundy').elements[0] as FlowerElement).colorId).toBe(
      'burgundy',
    );
  });

  it('is a no-op for a colour outside the list', () => {
    expect(recolorElement(base, 'e1', 'yellow')).toBe(base);
  });

  it('is a no-op for a fixed-colour flower', () => {
    expect(recolorElement(base, 'e2', 'red')).toBe(base);
  });

  it('is a no-op for foliage and unknown ids', () => {
    const withFern = addElement(base, 'fern', { x: 0, y: 0 });
    expect(recolorElement(withFern, 'e3', 'red')).toBe(withFern);
    expect(recolorElement(base, 'e9', 'red')).toBe(base);
  });
});

describe('deleteElement', () => {
  const base = withElements([flower('e1'), flower('e2'), flower('e3')]);

  it('removes only the given element', () => {
    expect(deleteElement(base, 'e2').elements.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('is a no-op for an unknown id', () => {
    expect(deleteElement(base, 'e9')).toBe(base);
  });
});

describe('duplicateElement', () => {
  it('inserts a copy directly above the original with a new id and a 40/40 offset', () => {
    const base = withElements([flower('e1'), flower('e2', { catalogId: 'tulip' })]);
    const next = duplicateElement(base, 'e1');
    expect(next.elements.map((e) => e.id)).toEqual(['e1', 'e3', 'e2']);
    expect(next.elements[1]).toEqual({ ...flower('e1'), id: 'e3', position: { x: 40, y: -160 } });
  });

  it('keeps colour, rotation and scale and clamps the offset anchor', () => {
    const base = withElements([
      flower('e1', { position: { x: 490, y: 290 }, rotation: 30, scale: 2, colorId: 'white' }),
    ]);
    expect(duplicateElement(base, 'e1').elements[1]).toEqual({
      ...base.elements[0],
      id: 'e2',
      position: { x: MODEL_BOUNDS.maxX, y: MODEL_BOUNDS.maxY },
    });
  });

  it('copies foliage', () => {
    const base = addElement(emptyBouquet(), 'fern', { x: 0, y: 0 });
    expect(duplicateElement(base, 'e1').elements[1]).toMatchObject({
      id: 'e2',
      kind: 'foliage',
      catalogId: 'fern',
    });
  });

  it('leaves the bouquet unchanged at the limit', () => {
    const full = fullBouquet();
    expect(duplicateElement(full, 'e1')).toBe(full);
  });

  it('is a no-op for an unknown id', () => {
    const base = withElements([flower('e1')]);
    expect(duplicateElement(base, 'e9')).toBe(base);
  });
});

describe('reorderElement', () => {
  const abc = withElements([flower('A'), flower('B'), flower('C')]);
  const order = (bouquet: Bouquet): string[] => bouquet.elements.map((e) => e.id);

  it('brings an element forward one step', () => {
    expect(order(reorderElement(abc, 'A', 'forward'))).toEqual(['B', 'A', 'C']);
  });

  it('sends an element backward one step', () => {
    expect(order(reorderElement(abc, 'C', 'backward'))).toEqual(['A', 'C', 'B']);
  });

  it('moves an element to the front or the back', () => {
    expect(order(reorderElement(abc, 'A', 'front'))).toEqual(['B', 'C', 'A']);
    expect(order(reorderElement(abc, 'C', 'back'))).toEqual(['C', 'A', 'B']);
  });

  it('is a no-op at the ends', () => {
    expect(reorderElement(abc, 'C', 'forward')).toBe(abc);
    expect(reorderElement(abc, 'C', 'front')).toBe(abc);
    expect(reorderElement(abc, 'A', 'backward')).toBe(abc);
    expect(reorderElement(abc, 'A', 'back')).toBe(abc);
  });

  it('is a no-op for an unknown id', () => {
    expect(reorderElement(abc, 'Z', 'front')).toBe(abc);
  });
});

describe('setWrapping', () => {
  const base = { ...withElements([flower('e1')]), wrappingId: 'kraft' as const };

  it('replaces the previous wrapping and keeps the elements', () => {
    const next = setWrapping(base, 'ivory');
    expect(next.wrappingId).toBe('ivory');
    expect(next.elements).toBe(base.elements);
  });

  it('clears the wrapping with null and keeps the elements', () => {
    const next = setWrapping(base, null);
    expect(next.wrappingId).toBeNull();
    expect(next.elements).toBe(base.elements);
  });

  it('is a no-op for an id that is not a wrapping', () => {
    expect(setWrapping(base, 'rose' as never)).toBe(base);
  });
});

describe('clearBouquet', () => {
  it('returns an empty bouquet without wrapping', () => {
    expect(clearBouquet()).toEqual({ schemaVersion: 1, elements: [], wrappingId: null });
  });
});
