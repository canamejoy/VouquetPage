import { useLayoutEffect, useRef, useState, type Dispatch } from 'react';
import type { EditorAction } from '@/application/editor/actions';
import type { EditorState } from '@/application/editor/state';
import { CATALOG } from '@/domain/catalog';
import { modelPerPixel } from '@/domain/geometry';
import { EditorCanvas } from '@/ui/organisms/EditorCanvas/EditorCanvas';
import { useTransformGesture } from './useTransformGesture';

interface EditorCanvasContainerProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

// Before the first measurement, and where ResizeObserver is missing (jsdom), assume 1 px per unit.
const FALLBACK_MODEL_PER_PIXEL = 1;

/** Connects editor state to the presentational canvas and owns the pointer gestures. */
export function EditorCanvasContainer({ state, dispatch }: EditorCanvasContainerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(FALLBACK_MODEL_PER_PIXEL);
  const handlers = useTransformGesture(state, dispatch, svgRef);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const { left, top, width, height } = svg.getBoundingClientRect();
      if (width > 0 && height > 0) setScale(modelPerPixel({ left, top, width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <EditorCanvas
      ref={svgRef}
      bouquet={state.bouquet}
      catalog={CATALOG}
      selectedId={state.selectedId}
      modelPerPixel={scale}
      {...handlers}
    />
  );
}
