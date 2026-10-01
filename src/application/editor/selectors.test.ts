import { describe, expect, it } from 'vitest';
import { MAX_ELEMENTS } from '@/domain/bouquet';
import { summarize } from '@/domain/pricing';
import type { EditorAction } from './actions';
import { editorReducer } from './reducer';
import {
  selectCanAdd,
  selectLayerPosition,
  selectSelectedElement,
  selectSummary,
} from './selectors';
import { initialEditorState } from './state';

const add = { type: 'element/add', catalogId: 'rose', position: { x: 0, y: 0 } } as const;
const run = (...actions: EditorAction[]) => actions.reduce(editorReducer, initialEditorState());

describe('selectSelectedElement and selectLayerPosition', () => {
  it('return null when nothing is selected', () => {
    const state = run(add, { type: 'element/select', id: null });
    expect(selectSelectedElement(state)).toBeNull();
    expect(selectLayerPosition(state)).toBeNull();
  });

  it('return the selected element and its 1-based position from the back', () => {
    const state = run(add, add, add, { type: 'element/select', id: 'e2' });
    expect(selectSelectedElement(state)?.id).toBe('e2');
    expect(selectLayerPosition(state)).toEqual({ position: 2, count: 3 });
  });
});

describe('selectCanAdd', () => {
  it('is false only at the element limit', () => {
    const almost = Array.from({ length: MAX_ELEMENTS - 1 }, () => add);
    expect(selectCanAdd(run(...almost))).toBe(true);
    expect(selectCanAdd(run(...almost, add))).toBe(false);
  });
});

describe('selectSummary', () => {
  it('summarizes the bouquet', () => {
    const state = run(add, { type: 'wrapping/set', wrappingId: 'kraft' });
    expect(selectSummary(state)).toEqual(summarize(state.bouquet));
  });
});
