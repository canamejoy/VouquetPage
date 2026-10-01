import {
  addElement,
  applyComposition,
  clearBouquet,
  deleteElement,
  duplicateElement,
  recolorElement,
  reorderElement,
  setWrapping,
  transformElement,
} from '@/domain/bouquet';
import type { Bouquet } from '@/domain/bouquet';
import { COMPOSITIONS } from '@/domain/composition';
import type { EditorAction } from './actions';
import type { EditorState } from './state';

/** Keeps the selection and returns the same state when the domain operation changed nothing. */
const withBouquet = (state: EditorState, bouquet: Bouquet): EditorState =>
  bouquet === state.bouquet ? state : { ...state, bouquet };

/** The one place that decides which element an add or a duplicate selects. */
const withSelection = (state: EditorState, bouquet: Bouquet, selectedId: string | null) =>
  bouquet === state.bouquet ? state : { bouquet, selectedId };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { bouquet } = state;
  switch (action.type) {
    case 'element/add': {
      const next = addElement(bouquet, action.catalogId, action.position);
      return withSelection(state, next, next.elements.at(-1)?.id ?? null);
    }
    case 'element/select': {
      const known = action.id === null || bouquet.elements.some((e) => e.id === action.id);
      return known && action.id !== state.selectedId ? { ...state, selectedId: action.id } : state;
    }
    case 'element/transform':
      return withBouquet(state, transformElement(bouquet, action.id, action.change));
    case 'element/recolor':
      return withBouquet(state, recolorElement(bouquet, action.id, action.colorId));
    case 'element/duplicate': {
      const next = duplicateElement(bouquet, action.id);
      const index = bouquet.elements.findIndex((e) => e.id === action.id);
      return withSelection(state, next, next.elements[index + 1]?.id ?? null);
    }
    case 'element/delete': {
      const next = deleteElement(bouquet, action.id);
      if (next === bouquet) return state;
      return {
        bouquet: next,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    }
    case 'element/reorder':
      return withBouquet(state, reorderElement(bouquet, action.id, action.direction));
    case 'wrapping/set':
      return withBouquet(state, setWrapping(bouquet, action.wrappingId));
    case 'composition/apply': {
      const template = COMPOSITIONS.find((t) => t.id === action.compositionId);
      return template ? { bouquet: applyComposition(bouquet, template), selectedId: null } : state;
    }
    case 'bouquet/clear': {
      const empty = bouquet.elements.length === 0 && bouquet.wrappingId === null;
      return empty && state.selectedId === null
        ? state
        : { bouquet: clearBouquet(), selectedId: null };
    }
  }
}
