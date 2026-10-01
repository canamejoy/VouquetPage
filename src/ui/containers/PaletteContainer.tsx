import type { Dispatch } from 'react';
import type { EditorAction } from '@/application/editor/actions';
import { selectCanAdd } from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import { CATALOG } from '@/domain/catalog';
import { COMPOSITIONS } from '@/domain/composition';
import { defaultAnchor } from '@/domain/geometry';
import { Palette } from '@/ui/organisms/Palette/Palette';
import type { PaletteDrag } from './usePaletteDrag';

interface PaletteContainerProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  drag: PaletteDrag;
}

const compositionIds = COMPOSITIONS.map((template) => template.id);

/** Connects editor state to the presentational palette; a tap adds at the golden-angle anchor and a drag adds at the pointer. */
export function PaletteContainer({ state, dispatch, drag }: PaletteContainerProps) {
  const { elements, wrappingId } = state.bouquet;
  return (
    <Palette
      catalog={CATALOG}
      compositionIds={compositionIds}
      wrappingId={wrappingId}
      hasArrangement={elements.length > 0}
      canAdd={selectCanAdd(state)}
      onAdd={(catalogId) => {
        if (drag.consumeDragClick()) return;
        dispatch({ type: 'element/add', catalogId, position: defaultAnchor(elements.length) });
      }}
      onDragStart={drag.onTilePointerDown}
      onSelectWrapping={(id) => dispatch({ type: 'wrapping/set', wrappingId: id })}
      onApplyComposition={(compositionId) => dispatch({ type: 'composition/apply', compositionId })}
    />
  );
}
