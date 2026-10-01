import { useRef, type Dispatch, type PointerEvent, type RefObject } from 'react';
import type { EditorAction } from '@/application/editor/actions';
import type { EditorState } from '@/application/editor/state';
import {
  clientToModel,
  moveGesture,
  rotateGesture,
  scaleGesture,
  type GestureStart,
  type Point,
  type Viewport,
} from '@/domain/geometry';
import type { HandleKind } from '@/ui/organisms/EditorCanvas/SelectionOverlay';

type Mode = 'move' | HandleKind;

interface Gesture {
  mode: Mode;
  id: string;
  pointerId: number;
  start: GestureStart;
  viewport: Viewport;
}

type SvgPointerEvent = PointerEvent<SVGElement>;

/**
 * Turns pointer events on the canvas into `element/select` and `element/transform` actions (D1).
 * The rect is measured when the gesture starts, so page scrolling never leaves it stale; the
 * page cannot scroll mid-gesture because the canvas sets `touch-action: none`.
 */
export function useTransformGesture(
  state: EditorState,
  dispatch: Dispatch<EditorAction>,
  svgRef: RefObject<SVGSVGElement | null>,
  /** Called with true when a gesture starts and false when it ends, for the toolbar lock. */
  onGesturingChange?: (gesturing: boolean) => void,
) {
  const gesture = useRef<Gesture | null>(null);

  const begin = (mode: Mode, id: string, event: SvgPointerEvent) => {
    const svg = svgRef.current;
    const element = state.bouquet.elements.find((candidate) => candidate.id === id);
    if (gesture.current || !svg || !element) return;
    const rect = svg.getBoundingClientRect();
    const viewport = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const { position, rotation, scale } = element;
    const pointer = clientToModel({ x: event.clientX, y: event.clientY }, viewport);
    // Captured on the svg, not the pressed node: handles re-render as the scale changes.
    svg.setPointerCapture(event.pointerId);
    gesture.current = {
      mode,
      id,
      pointerId: event.pointerId,
      start: { pointer, position, rotation, scale },
      viewport,
    };
    onGesturingChange?.(true);
  };

  const transformFor = (g: Gesture, pointer: Point): EditorAction => ({
    type: 'element/transform',
    id: g.id,
    change:
      g.mode === 'move'
        ? { position: moveGesture(g.start, pointer) }
        : g.mode === 'rotate'
          ? { rotation: rotateGesture(g.start, pointer) }
          : { scale: scaleGesture(g.start, pointer) },
  });

  const end = (event: SvgPointerEvent) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    svgRef.current?.releasePointerCapture(event.pointerId);
    gesture.current = null;
    onGesturingChange?.(false);
  };

  return {
    onBackgroundPointerDown: () => {
      if (!gesture.current) dispatch({ type: 'element/select', id: null });
    },
    onElementPointerDown: (id: string, event: SvgPointerEvent) => {
      if (gesture.current) return;
      dispatch({ type: 'element/select', id });
      begin('move', id, event);
    },
    onHandlePointerDown: (kind: HandleKind, event: SvgPointerEvent) => {
      if (state.selectedId) begin(kind, state.selectedId, event);
    },
    onPointerMove: (event: SvgPointerEvent) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      const pointer = clientToModel({ x: event.clientX, y: event.clientY }, g.viewport);
      dispatch(transformFor(g, pointer));
    },
    onPointerUp: end,
    onPointerCancel: end,
  };
}
