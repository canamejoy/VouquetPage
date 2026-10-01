import { emptyBouquet } from '@/domain/bouquet';
import type { Bouquet } from '@/domain/bouquet';

/** `selectedId` is an element id or null. The wrapping is never selectable. */
export interface EditorState {
  bouquet: Bouquet;
  selectedId: string | null;
}

/** The restored draft is the initial state, so there is no load action. */
export const initialEditorState = (bouquet: Bouquet = emptyBouquet()): EditorState => ({
  bouquet,
  selectedId: null,
});
