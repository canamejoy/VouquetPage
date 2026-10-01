import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorAction } from '@/application/editor/actions';
import { initialEditorState } from '@/application/editor/state';
import type { EditorState } from '@/application/editor/state';
import { MAX_ELEMENTS } from '@/domain/bouquet';
import type { BouquetElement } from '@/domain/bouquet';
import { defaultAnchor } from '@/domain/geometry';
import { DragGhost } from '@/ui/molecules/DragGhost';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { EditorCanvasContainer } from './EditorCanvasContainer';
import { PaletteContainer } from './PaletteContainer';
import { usePaletteDrag } from './usePaletteDrag';

const fern = (index: number): BouquetElement => ({
  id: `e${index}`,
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: 0, y: -400 },
  rotation: 0,
  scale: 1,
});

const stateWith = (count: number): EditorState =>
  initialEditorState({
    schemaVersion: 1,
    wrappingId: null,
    elements: Array.from({ length: count }, (_, index) => fern(index)),
  });

let dispatch: ReturnType<typeof vi.fn<(action: EditorAction) => void>>;

/** Composes the two containers the way the app wiring does: one hook, one shared SVG ref. */
function Harness({ state }: { state: EditorState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = usePaletteDrag(state, dispatch, svgRef);
  return (
    <>
      <EditorCanvasContainer state={state} dispatch={dispatch} svgRef={svgRef} />
      <PaletteContainer state={state} dispatch={dispatch} drag={drag} />
      {drag.ghost && <DragGhost {...drag.ghost} />}
    </>
  );
}

// The SVG rect: scale 0.5 without letterbox, so model = 2 * client - (500, 1000).
const SVG_RECT = { left: 0, top: 0, width: 500, height: 650 };
const WIDE_RECT = { left: 0, top: 0, width: 1500, height: 650 };

function setup(state: EditorState, rect = SVG_RECT) {
  dispatch = vi.fn<(action: EditorAction) => void>();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
  render(
    <I18nContext value={createTranslate('en')}>
      <Harness state={state} />
    </I18nContext>,
  );
  return screen.getByRole('button', { name: 'Rose' });
}

const press = (tile: Element, x: number, y: number) =>
  fireEvent.pointerDown(tile, { pointerId: 1, button: 0, clientX: x, clientY: y });
const move = (x: number, y: number) =>
  fireEvent.pointerMove(document.body, { pointerId: 1, clientX: x, clientY: y });
const release = (x: number, y: number) =>
  fireEvent.pointerUp(document.body, { pointerId: 1, clientX: x, clientY: y });
const ghost = () => screen.queryByTestId('drag-ghost');

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('palette drag', () => {
  it('keeps a press that moves 8 px or less a tap and adds exactly once', () => {
    const tile = setup(stateWith(2));
    press(tile, 100, 100);
    move(105, 105);
    expect(ghost()).toBeNull();
    release(105, 105);
    fireEvent.click(tile);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/add',
      catalogId: 'rose',
      position: defaultAnchor(2),
    });
  });

  it('shows a decorative ghost that follows the pointer once movement passes 8 px', () => {
    const tile = setup(stateWith(1));
    press(tile, 100, 100);
    move(120, 100);
    expect(ghost()).toHaveAttribute('aria-hidden', 'true');
    expect(ghost()).toHaveStyle({ left: '120px', top: '100px' });
    move(200, 240);
    expect(ghost()).toHaveStyle({ left: '200px', top: '240px' });
  });

  it('adds one element at the pointer when released inside the SVG, without a second tap-add', () => {
    const tile = setup(stateWith(1));
    press(tile, 20, 20);
    move(250, 325);
    release(250, 325);
    fireEvent.click(tile);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/add',
      catalogId: 'rose',
      position: { x: 0, y: -350 },
    });
    expect(ghost()).toBeNull();
  });

  it('clamps a drop in the letterbox to the model bounds', () => {
    const tile = setup(stateWith(1), WIDE_RECT);
    press(tile, 20, 20);
    move(100, 325);
    release(100, 325);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/add',
      catalogId: 'rose',
      position: { x: -500, y: -350 },
    });
  });

  it('adds nothing when released outside the SVG', () => {
    const tile = setup(stateWith(1));
    press(tile, 20, 20);
    move(700, 325);
    release(700, 325);
    expect(dispatch).not.toHaveBeenCalled();
    expect(ghost()).toBeNull();
  });

  it.each([
    ['pointercancel', () => fireEvent.pointerCancel(document.body, { pointerId: 1 })],
    ['Escape', () => fireEvent.keyDown(document.body, { key: 'Escape' })],
  ])('cancels on %s with nothing added and no ghost left', (_name, cancel) => {
    const tile = setup(stateWith(1));
    press(tile, 20, 20);
    move(250, 325);
    cancel();
    expect(ghost()).toBeNull();
    release(250, 325);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not start a drag at the element limit', () => {
    const tile = setup(stateWith(MAX_ELEMENTS));
    press(tile, 20, 20);
    move(250, 325);
    expect(ghost()).toBeNull();
    release(250, 325);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not make wrapping tiles draggable', () => {
    setup(stateWith(1));
    fireEvent.click(screen.getByRole('tab', { name: 'Wrapping' }));
    const tile = screen.getByRole('button', { name: 'Burlap' });
    press(tile, 20, 20);
    move(250, 325);
    expect(ghost()).toBeNull();
    release(250, 325);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('lets a tap after a drag add normally', () => {
    const tile = setup(stateWith(1));
    press(tile, 20, 20);
    move(700, 325);
    release(700, 325);
    press(tile, 20, 20);
    release(20, 20);
    fireEvent.click(tile);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/add',
      catalogId: 'rose',
      position: defaultAnchor(1),
    });
  });
});
