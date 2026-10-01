import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Bouquet } from '@/domain/bouquet';
import type { EditorAction } from '@/application/editor/actions';
import { initialEditorState } from '@/application/editor/state';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { EditorCanvasContainer } from './EditorCanvasContainer';

const bouquet: Bouquet = {
  schemaVersion: 1,
  wrappingId: null,
  elements: [
    {
      id: 'a',
      kind: 'flower',
      catalogId: 'rose',
      colorId: 'red',
      position: { x: -120, y: -400 },
      rotation: 30,
      scale: 1.5,
    },
    {
      id: 'b',
      kind: 'foliage',
      catalogId: 'fern',
      position: { x: 60, y: -300 },
      rotation: 0,
      scale: 1,
    },
  ],
};

// Stubbed rect: 500x650 px at (100, 50) gives 0.5 px per model unit, so the 1000x1300 viewBox fits exactly.
const toClient = (model: { x: number; y: number }) => ({
  clientX: 100 + (model.x + 500) * 0.5,
  clientY: 50 + (model.y + 1000) * 0.5,
});

const pointer = (model: { x: number; y: number }, pointerId = 1) => ({
  ...toClient(model),
  pointerId,
});

let dispatch: ReturnType<typeof vi.fn<(action: EditorAction) => void>>;

function setup(selectedId: string | null = null) {
  dispatch = vi.fn<(action: EditorAction) => void>();
  render(
    <I18nContext value={createTranslate('en')}>
      <EditorCanvasContainer
        state={{ ...initialEditorState(bouquet), selectedId }}
        dispatch={dispatch}
      />
    </I18nContext>,
  );
  return screen.getByRole('group');
}

const transforms = () =>
  dispatch.mock.calls.map(([action]) => action).filter((a) => a.type === 'element/transform');

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(100, 50, 500, 650),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('background', () => {
  it('disables browser touch scrolling on the canvas', () => {
    const svg = setup();
    expect(svg).toHaveStyle({ touchAction: 'none' });
  });

  it('deselects on a press on empty background', () => {
    const svg = setup('a');
    fireEvent.pointerDown(svg.querySelector('[data-layer="background"]')!, pointer({ x: 0, y: 0 }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'element/select', id: null });
  });

  it('deselects on a press in the letterbox, which lands on the svg itself', () => {
    const svg = setup('a');
    fireEvent.pointerDown(svg, pointer({ x: 0, y: 0 }));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'element/select', id: null });
  });
});

describe('move', () => {
  it('selects the pressed element and captures the pointer without changing the transform', () => {
    const svg = setup();
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /rose/i }),
      pointer({ x: -120, y: -400 }, 4),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'element/select', id: 'a' });
    expect(svg.hasPointerCapture(4)).toBe(true);
    fireEvent.pointerUp(svg, pointer({ x: -120, y: -400 }, 4));
    expect(transforms()).toEqual([]);
    expect(svg.hasPointerCapture(4)).toBe(false);
  });

  it('moves the anchor by the pointer delta in model units and clamps to the bounds', () => {
    const svg = setup();
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /rose/i }),
      pointer({ x: -100, y: -380 }),
    );
    fireEvent.pointerMove(svg, pointer({ x: -50, y: -360 }));
    fireEvent.pointerMove(svg, pointer({ x: -2000, y: 2000 }));
    expect(transforms()).toEqual([
      { type: 'element/transform', id: 'a', change: { position: { x: -70, y: -380 } } },
      { type: 'element/transform', id: 'a', change: { position: { x: -500, y: 300 } } },
    ]);
  });

  it.each(['pointerUp', 'pointerCancel'] as const)(
    '%s ends the gesture and releases capture',
    (end) => {
      const svg = setup();
      fireEvent.pointerDown(
        screen.getByRole('button', { name: /rose/i }),
        pointer({ x: -120, y: -400 }),
      );
      fireEvent[end](svg, pointer({ x: -120, y: -400 }));
      expect(svg.hasPointerCapture(1)).toBe(false);
      fireEvent.pointerMove(svg, pointer({ x: 0, y: 0 }));
      expect(transforms()).toEqual([]);
    },
  );

  it('ignores a second pointer during a gesture', () => {
    const svg = setup();
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /rose/i }),
      pointer({ x: -120, y: -400 }, 1),
    );
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /fern/i }),
      pointer({ x: 60, y: -300 }, 2),
    );
    fireEvent.pointerMove(svg, pointer({ x: 0, y: 0 }, 2));
    fireEvent.pointerUp(svg, pointer({ x: 0, y: 0 }, 2));
    expect(dispatch).toHaveBeenCalledTimes(1);
    fireEvent.pointerMove(svg, pointer({ x: -100, y: -400 }, 1));
    expect(transforms()).toHaveLength(1);
    expect(transforms()[0]).toMatchObject({ id: 'a' });
  });
});

describe('handles', () => {
  const handle = (svg: HTMLElement, kind: 'scale' | 'rotate') =>
    svg.querySelector(`[data-handle="${kind}"]`)!;

  it('rotates about the anchor and reports normalized degrees', () => {
    const svg = setup('a');
    // Press straight above the anchor, then sweep to straight right: +90 degrees clockwise.
    fireEvent.pointerDown(handle(svg, 'rotate'), pointer({ x: -120, y: -600 }));
    fireEvent.pointerMove(svg, pointer({ x: 80, y: -400 }));
    expect(transforms()).toEqual([
      { type: 'element/transform', id: 'a', change: { rotation: 120 } },
    ]);
  });

  it('scales uniformly by the distance ratio and clamps to the allowed range', () => {
    const svg = setup('a');
    fireEvent.pointerDown(handle(svg, 'scale'), pointer({ x: -20, y: -400 }));
    fireEvent.pointerMove(svg, pointer({ x: 30, y: -400 }));
    fireEvent.pointerMove(svg, pointer({ x: 5000, y: -400 }));
    fireEvent.pointerMove(svg, pointer({ x: -119, y: -400 }));
    expect(transforms().map((a) => a.change)).toEqual([
      { scale: 2.25 },
      { scale: 2.5 },
      { scale: 0.4 },
    ]);
  });

  it('never changes another element', () => {
    const svg = setup('a');
    fireEvent.pointerDown(handle(svg, 'scale'), pointer({ x: -20, y: -400 }));
    fireEvent.pointerMove(svg, pointer({ x: 30, y: -400 }));
    expect(transforms().every((a) => a.id === 'a')).toBe(true);
  });
});
