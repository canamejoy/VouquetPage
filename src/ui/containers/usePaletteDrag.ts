import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
  type RefObject,
} from 'react';
import type { EditorAction } from '@/application/editor/actions';
import { selectCanAdd } from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import type { FlowerId, FoliageId } from '@/domain/catalog';
import { dropPosition } from '@/domain/geometry';
import type { DragGhostProps } from '@/ui/molecules/DragGhost';

/** Movement in client pixels beyond which a press on a tile becomes a drag (design D1). */
const DRAG_THRESHOLD_PX = 8;

type CatalogId = FlowerId | FoliageId;

export interface PaletteDrag {
  /** Props for `DragGhost` while a drag is in progress, otherwise null. */
  ghost: DragGhostProps | null;
  /** Start tracking a press on a flower or foliage tile. */
  onTilePointerDown: (catalogId: CatalogId, event: PointerEvent) => void;
  /** True once after a drag ended, so the click that follows it does not also tap-add. */
  consumeDragClick: () => boolean;
}

interface Press {
  catalogId: CatalogId;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
}

/**
 * Drag from a palette tile onto the design area, with a ghost that follows the pointer (D1).
 * Called by the parent that owns the SVG ref and passed to both containers, so the palette and
 * the canvas share the drag without a Context. Pointer events only: HTML5 drag and drop does not
 * work on touch.
 */
export function usePaletteDrag(
  state: EditorState,
  dispatch: Dispatch<EditorAction>,
  svgRef: RefObject<SVGSVGElement | null>,
): PaletteDrag {
  const [ghost, setGhost] = useState<DragGhostProps | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const draggedClick = useRef(false);

  useEffect(() => () => stop.current?.(), []);

  const onTilePointerDown = (catalogId: CatalogId, event: PointerEvent) => {
    if (event.button !== 0 || !selectCanAdd(state)) return;
    stop.current?.();
    draggedClick.current = false;
    const press: Press = {
      catalogId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('keydown', onKey);
      stop.current = null;
      setGhost(null);
    };
    const onMove = (move: globalThis.PointerEvent) => {
      if (move.pointerId !== press.pointerId) return;
      if (
        !press.dragging &&
        Math.hypot(move.clientX - press.startX, move.clientY - press.startY) <= DRAG_THRESHOLD_PX
      ) {
        return;
      }
      press.dragging = true;
      setGhost({ catalogId, x: move.clientX, y: move.clientY });
    };
    const onUp = (up: globalThis.PointerEvent) => {
      if (up.pointerId !== press.pointerId) return;
      if (press.dragging) {
        draggedClick.current = true;
        const rect = svgRef.current?.getBoundingClientRect();
        const position = rect && dropPosition({ x: up.clientX, y: up.clientY }, rect);
        if (position) dispatch({ type: 'element/add', catalogId, position });
      }
      finish();
    };
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== 'Escape') return;
      draggedClick.current = press.dragging;
      finish();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('keydown', onKey);
    stop.current = finish;
  };

  const consumeDragClick = () => {
    const was = draggedClick.current;
    draggedClick.current = false;
    return was;
  };

  return { ghost, onTilePointerDown, consumeDragClick };
}
