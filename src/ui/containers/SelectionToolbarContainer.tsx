import { useState, type Dispatch } from 'react';
import type { EditorAction } from '@/application/editor/actions';
import {
  selectCanAdd,
  selectLayerPosition,
  selectSelectedElement,
} from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import { getFlower } from '@/domain/catalog';
import { dockSide, SCALE_MAX, SCALE_MIN, type DockSide } from '@/domain/geometry';
import { SelectionToolbar } from '@/ui/organisms/SelectionToolbar/SelectionToolbar';

interface SelectionToolbarContainerProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  /** True while a canvas gesture runs: the toolbar keeps its dock side and ignores pointer events. */
  gesturing: boolean;
}

const ROTATE_STEP_DEGREES = 15;
const SCALE_STEP = 0.1;

/** Connects the selected element to the presentational toolbar; renders nothing without a selection. */
export function SelectionToolbarContainer({
  state,
  dispatch,
  gesturing,
}: SelectionToolbarContainerProps) {
  const element = selectSelectedElement(state);
  const layer = selectLayerPosition(state);
  const side = element ? dockSide(element.position) : null;
  const [docked, setDocked] = useState<DockSide | null>(side);
  // Derived state: the side follows the anchor except while a gesture is moving it.
  if (!gesturing && side !== docked) setDocked(side);

  if (!element || !layer) return null;
  const { id } = element;
  const colors = element.kind === 'flower' ? (getFlower(element.catalogId)?.colors ?? []) : [];

  return (
    <SelectionToolbar
      side={docked ?? dockSide(element.position)}
      pointerLocked={gesturing}
      colors={colors}
      colorId={element.kind === 'flower' ? element.colorId : null}
      limits={{
        smaller: element.scale <= SCALE_MIN,
        larger: element.scale >= SCALE_MAX,
        backward: layer.position === 1,
        forward: layer.position === layer.count,
        duplicate: !selectCanAdd(state),
      }}
      onRotate={(direction) =>
        dispatch({
          type: 'element/transform',
          id,
          change: { rotation: element.rotation + direction * ROTATE_STEP_DEGREES },
        })
      }
      onScale={(direction) =>
        dispatch({
          type: 'element/transform',
          id,
          // Rounded so repeated 0.1 steps do not accumulate floating-point noise.
          change: { scale: Math.round((element.scale + direction * SCALE_STEP) * 100) / 100 },
        })
      }
      onReorder={(direction) => dispatch({ type: 'element/reorder', id, direction })}
      onRecolor={(colorId) => dispatch({ type: 'element/recolor', id, colorId })}
      onDuplicate={() => dispatch({ type: 'element/duplicate', id })}
      onDelete={() => dispatch({ type: 'element/delete', id })}
    />
  );
}
