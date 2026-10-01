import { MAX_ELEMENTS } from '@/domain/bouquet';
import type { BouquetElement } from '@/domain/bouquet';
import { summarize } from '@/domain/pricing';
import type { Summary } from '@/domain/pricing';
import type { EditorState } from './state';

export const selectSelectedElement = (state: EditorState): BouquetElement | null =>
  state.bouquet.elements.find((element) => element.id === state.selectedId) ?? null;

/** 1-based position counted from the back (1 is the back), or null without a selection. */
export const selectLayerPosition = (
  state: EditorState,
): { position: number; count: number } | null => {
  const index = state.bouquet.elements.findIndex((element) => element.id === state.selectedId);
  return index < 0 ? null : { position: index + 1, count: state.bouquet.elements.length };
};

export const selectCanAdd = (state: EditorState): boolean =>
  state.bouquet.elements.length < MAX_ELEMENTS;

/** Whether "New bouquet" would discard anything: `bouquet/clear` also resets the wrapping. */
export const selectHasContent = (state: EditorState): boolean =>
  state.bouquet.elements.length > 0 || state.bouquet.wrappingId !== null;

export const selectSummary = (state: EditorState): Summary => summarize(state.bouquet);
