import { describe, expect, it } from 'vitest';
import { emptyBouquet, MAX_ELEMENTS } from '@/domain/bouquet';
import type { Bouquet } from '@/domain/bouquet';
import { MODEL_BOUNDS } from '@/domain/geometry';
import type { EditorAction } from './actions';
import { editorReducer } from './reducer';
import { initialEditorState } from './state';
import type { EditorState } from './state';

const run = (state: EditorState, ...actions: EditorAction[]): EditorState =>
  actions.reduce(editorReducer, state);

const add = (catalogId: 'rose' | 'eucalyptus' | 'tulip' = 'rose') =>
  ({ type: 'element/add', catalogId, position: { x: 10, y: -20 } }) as EditorAction;

const ids = (state: EditorState) => state.bouquet.elements.map((element) => element.id);

describe('initialEditorState', () => {
  it('starts empty with nothing selected, or from a restored bouquet', () => {
    expect(initialEditorState()).toEqual({ bouquet: emptyBouquet(), selectedId: null });
    const restored: Bouquet = { ...emptyBouquet(), wrappingId: 'kraft' };
    expect(initialEditorState(restored)).toEqual({ bouquet: restored, selectedId: null });
  });
});

describe('element/add', () => {
  it('adds on top with the default colour, clamped, and selects the new element', () => {
    const state = run(initialEditorState(), add(), {
      type: 'element/add',
      catalogId: 'eucalyptus',
      position: { x: 9999, y: 0 },
    });
    expect(ids(state)).toEqual(['e1', 'e2']);
    expect(state.selectedId).toBe('e2');
    expect(state.bouquet.elements[0]).toMatchObject({ kind: 'flower', colorId: 'red' });
    expect(state.bouquet.elements[1]?.position.x).toBe(MODEL_BOUNDS.maxX);
  });

  it('is a no-op at the element limit and for an unknown catalog id', () => {
    let full = initialEditorState();
    for (let i = 0; i < MAX_ELEMENTS; i += 1) full = run(full, add());
    expect(full.bouquet.elements).toHaveLength(MAX_ELEMENTS);
    expect(run(full, add())).toBe(full);
    const state = run(initialEditorState(), add());
    const bad = { type: 'element/add', catalogId: 'nope', position: { x: 0, y: 0 } };
    expect(run(state, bad as unknown as EditorAction)).toBe(state);
  });
});

describe('element/select', () => {
  const state = run(initialEditorState(), add(), add());

  it('selects an existing id, deselects with null', () => {
    expect(run(state, { type: 'element/select', id: 'e1' }).selectedId).toBe('e1');
    expect(run(state, { type: 'element/select', id: null }).selectedId).toBeNull();
  });

  it('is a no-op for the current selection and for an unknown id', () => {
    expect(run(state, { type: 'element/select', id: 'e2' })).toBe(state);
    expect(run(state, { type: 'element/select', id: 'e99' })).toBe(state);
  });
});

describe('element/transform', () => {
  const state = run(initialEditorState(), add());

  it('sets anchor, rotation and scale clamped or normalized and keeps the selection', () => {
    const next = run(state, {
      type: 'element/transform',
      id: 'e1',
      change: { position: { x: 9999, y: 0 }, rotation: 370, scale: 99 },
    });
    expect(next.bouquet.elements[0]).toMatchObject({ rotation: 10 });
    expect(next.bouquet.elements[0]?.position.x).toBe(MODEL_BOUNDS.maxX);
    expect(next.bouquet.elements[0]?.scale).toBeLessThan(99);
    expect(next.selectedId).toBe('e1');
  });

  it('is a no-op for an unknown id', () => {
    expect(run(state, { type: 'element/transform', id: 'e9', change: { scale: 1.2 } })).toBe(state);
  });
});

describe('element/recolor', () => {
  const state = run(initialEditorState(), add('rose'), add('eucalyptus'));

  it('sets an available colour', () => {
    const next = run(state, { type: 'element/recolor', id: 'e1', colorId: 'white' });
    expect(next.bouquet.elements[0]).toMatchObject({ colorId: 'white' });
  });

  it.each([
    ['a colour outside the flower list', 'e1', 'yellow'],
    ['foliage', 'e2', 'white'],
    ['an unknown id', 'e9', 'white'],
  ] as const)('is a no-op for %s', (_label, id, colorId) => {
    expect(run(state, { type: 'element/recolor', id, colorId })).toBe(state);
  });
});

describe('element/duplicate', () => {
  it('inserts the copy directly above the original and selects it', () => {
    const state = run(initialEditorState(), add(), add('tulip'), add('rose'));
    const next = run(state, { type: 'element/duplicate', id: 'e1' });
    expect(next.bouquet.elements.map((element) => element.catalogId)).toEqual([
      'rose',
      'rose',
      'tulip',
      'rose',
    ]);
    expect(next.selectedId).toBe(next.bouquet.elements[1]?.id);
    expect(next.selectedId).not.toBe('e1');
    expect(next.bouquet.elements[1]?.position).toEqual({ x: 50, y: 20 });
  });

  it('is a no-op for an unknown id and at the limit', () => {
    let full = initialEditorState();
    for (let i = 0; i < MAX_ELEMENTS; i += 1) full = run(full, add());
    expect(run(full, { type: 'element/duplicate', id: 'e1' })).toBe(full);
    const state = run(initialEditorState(), add());
    expect(run(state, { type: 'element/duplicate', id: 'e9' })).toBe(state);
  });
});

describe('element/delete', () => {
  const state = run(initialEditorState(), add(), add(), add());

  it('clears the selection only when the selected element is deleted', () => {
    expect(state.selectedId).toBe('e3');
    const other = run(state, { type: 'element/delete', id: 'e1' });
    expect(ids(other)).toEqual(['e2', 'e3']);
    expect(other.selectedId).toBe('e3');
    const selected = run(state, { type: 'element/delete', id: 'e3' });
    expect(ids(selected)).toEqual(['e1', 'e2']);
    expect(selected.selectedId).toBeNull();
  });

  it('is a no-op for an unknown id', () => {
    expect(run(state, { type: 'element/delete', id: 'e9' })).toBe(state);
  });
});

describe('element/reorder', () => {
  const state = run(initialEditorState(), add(), add(), add());

  it.each([
    ['forward', 'e1', ['e2', 'e1', 'e3']],
    ['backward', 'e3', ['e1', 'e3', 'e2']],
    ['front', 'e1', ['e2', 'e3', 'e1']],
    ['back', 'e3', ['e3', 'e1', 'e2']],
  ] as const)('%s moves the element and keeps the selection', (direction, id, expected) => {
    const next = run(state, { type: 'element/reorder', id, direction });
    expect(ids(next)).toEqual(expected);
    expect(next.selectedId).toBe('e3');
  });

  it.each([
    ['forward', 'e3'],
    ['front', 'e3'],
    ['backward', 'e1'],
    ['back', 'e1'],
    ['forward', 'e9'],
  ] as const)('%s is a no-op at the ends and for an unknown id (%s)', (direction, id) => {
    expect(run(state, { type: 'element/reorder', id, direction })).toBe(state);
  });
});

describe('wrapping/set', () => {
  it('sets and clears the wrapping without touching elements or selection', () => {
    const state = run(initialEditorState(), add());
    const wrapped = run(state, { type: 'wrapping/set', wrappingId: 'kraft' });
    expect(wrapped.bouquet.wrappingId).toBe('kraft');
    expect(wrapped.bouquet.elements).toBe(state.bouquet.elements);
    expect(wrapped.selectedId).toBe('e1');
    expect(run(wrapped, { type: 'wrapping/set', wrappingId: null }).bouquet.wrappingId).toBeNull();
  });

  it('is a no-op for an unknown wrapping', () => {
    const state = initialEditorState();
    const bad = { type: 'wrapping/set', wrappingId: 'nope' } as unknown as EditorAction;
    expect(run(state, bad)).toBe(state);
  });
});

describe('composition/apply', () => {
  it('rearranges the items, keeps the wrapping and clears the selection', () => {
    const state = run(initialEditorState(), add(), add('tulip'), {
      type: 'wrapping/set',
      wrappingId: 'kraft',
    });
    const next = run(state, { type: 'composition/apply', compositionId: 'round' });
    expect(next.bouquet.elements.map((element) => element.catalogId).sort()).toEqual([
      'rose',
      'tulip',
    ]);
    expect(next.bouquet.wrappingId).toBe('kraft');
    expect(next.selectedId).toBeNull();
  });

  it('uses the default items on an empty bouquet and stays editable afterwards', () => {
    const next = run(initialEditorState(), { type: 'composition/apply', compositionId: 'cascade' });
    expect(next.bouquet.elements.length).toBeGreaterThan(0);
    const edited = run(
      next,
      { type: 'element/select', id: 'e1' },
      { type: 'element/delete', id: 'e1' },
      add(),
    );
    expect(edited.bouquet.elements).toHaveLength(next.bouquet.elements.length);
  });

  it('is a no-op for an unknown composition', () => {
    const state = run(initialEditorState(), add());
    const bad = { type: 'composition/apply', compositionId: 'nope' } as unknown as EditorAction;
    expect(run(state, bad)).toBe(state);
  });
});

describe('bouquet/clear', () => {
  it('removes elements, wrapping and selection', () => {
    const state = run(initialEditorState(), add(), {
      type: 'wrapping/set',
      wrappingId: 'kraft',
    });
    expect(run(state, { type: 'bouquet/clear' })).toEqual(initialEditorState());
  });

  it('is a no-op on an already empty state', () => {
    const state = initialEditorState();
    expect(run(state, { type: 'bouquet/clear' })).toBe(state);
  });
});

describe('manual-only flow', () => {
  it('adds and moves items freely without any composition', () => {
    const state = run(
      initialEditorState(),
      add('rose'),
      { type: 'element/transform', id: 'e1', change: { position: { x: -120, y: 80 } } },
      add('eucalyptus'),
      { type: 'element/transform', id: 'e2', change: { position: { x: 60, y: -150 }, scale: 1.4 } },
      { type: 'element/select', id: null },
    );
    expect(state.bouquet.elements).toMatchObject([
      { id: 'e1', position: { x: -120, y: 80 } },
      { id: 'e2', position: { x: 60, y: -150 }, scale: 1.4 },
    ]);
    expect(state.selectedId).toBeNull();
  });
});
