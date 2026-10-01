import { useEffect, useReducer, useRef, type Dispatch } from 'react';
import { createDraftAutosave } from '@/application/draft/autosave';
import type { DraftStore } from '@/application/draft/ports';
import type { EditorAction } from '@/application/editor/actions';
import { editorReducer } from '@/application/editor/reducer';
import { initialEditorState, type EditorState } from '@/application/editor/state';

/** The editor state, started from the stored draft and autosaved after every bouquet change (D8). */
export function useDraftEditor(draftStore: DraftStore): [EditorState, Dispatch<EditorAction>] {
  const [state, dispatch] = useReducer(editorReducer, draftStore, (store) =>
    initialEditorState(store.load() ?? undefined),
  );
  const restored = useRef(state.bouquet);
  const autosave = useRef<ReturnType<typeof createDraftAutosave> | null>(null);

  useEffect(() => {
    const instance = createDraftAutosave(draftStore);
    autosave.current = instance;
    return () => {
      instance.dispose();
      autosave.current = null;
    };
  }, [draftStore]);

  useEffect(() => {
    // Selecting or deselecting keeps the bouquet reference, and the restored draft needs no rewrite.
    if (state.bouquet !== restored.current) autosave.current?.schedule(state.bouquet);
  }, [state.bouquet]);

  return [state, dispatch];
}
