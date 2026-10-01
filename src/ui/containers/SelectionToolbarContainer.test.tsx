import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorAction } from '@/application/editor/actions';
import { editorReducer } from '@/application/editor/reducer';
import { initialEditorState, type EditorState } from '@/application/editor/state';
import { MAX_ELEMENTS, type BouquetElement } from '@/domain/bouquet';
import { SCALE_MAX, SCALE_MIN } from '@/domain/geometry';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { SelectionToolbarContainer } from './SelectionToolbarContainer';

const rose = (overrides: Partial<BouquetElement> = {}): BouquetElement =>
  ({
    id: 'a',
    kind: 'flower',
    catalogId: 'rose',
    colorId: 'red',
    position: { x: 0, y: -600 },
    rotation: 350,
    scale: 1,
    ...overrides,
  }) as BouquetElement;

const fern = (id: string): BouquetElement => ({
  id,
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: 0, y: -600 },
  rotation: 0,
  scale: 1,
});

const stateWith = (elements: BouquetElement[], selectedId: string | null = 'a'): EditorState => ({
  ...initialEditorState({ schemaVersion: 1, wrappingId: null, elements }),
  selectedId,
});

let dispatch: ReturnType<typeof vi.fn<(action: EditorAction) => void>>;

const ui = (state: EditorState, gesturing = false) => (
  <I18nContext value={createTranslate('en')}>
    <SelectionToolbarContainer state={state} dispatch={dispatch} gesturing={gesturing} />
  </I18nContext>
);

function setup(state: EditorState) {
  dispatch = vi.fn<(action: EditorAction) => void>();
  return render(ui(state));
}

beforeEach(() => vi.clearAllMocks());

describe('SelectionToolbarContainer actions', () => {
  it('renders only when an element is selected', () => {
    setup(stateWith([rose()], null));
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it.each([
    ['Rotate left', { rotation: 335 }],
    ['Rotate right', { rotation: 365 }],
    ['Smaller', { scale: 0.9 }],
    ['Larger', { scale: 1.1 }],
  ])('%s dispatches a transform of the design step', async (name, change) => {
    setup(stateWith([rose()]));
    await userEvent.click(screen.getByRole('button', { name }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/transform',
      id: 'a',
      change,
    });
  });

  it('rounds repeated scale steps to two decimals', async () => {
    setup(stateWith([rose({ scale: 1.2 })]));
    await userEvent.click(screen.getByRole('button', { name: 'Larger' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'element/transform',
      id: 'a',
      change: { scale: 1.3 },
    });
  });

  it.each([
    ['Send backward', 'backward'],
    ['Bring forward', 'forward'],
  ])('%s dispatches a reorder', async (name, direction) => {
    setup(stateWith([fern('z'), rose(), fern('y')]));
    await userEvent.click(screen.getByRole('button', { name }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'element/reorder',
      id: 'a',
      direction,
    });
  });

  it.each([
    ['Duplicate', 'element/duplicate'],
    ['Delete', 'element/delete'],
  ])('%s dispatches %s', async (name, type) => {
    setup(stateWith([rose()]));
    await userEvent.click(screen.getByRole('button', { name }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type, id: 'a' });
  });
});

describe('SelectionToolbarContainer limits', () => {
  it.each([
    [SCALE_MIN, 'Smaller'],
    [SCALE_MAX, 'Larger'],
  ])('disables the scale button at the limit %s', (scale, name) => {
    setup(stateWith([rose({ scale })]));
    expect(screen.getByRole('button', { name })).toBeDisabled();
  });

  it('disables the layer buttons at the ends of the order', () => {
    const { unmount } = setup(stateWith([rose(), fern('z')]));
    expect(screen.getByRole('button', { name: 'Send backward' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bring forward' })).toBeEnabled();
    unmount();
    setup(stateWith([fern('z'), rose()]));
    expect(screen.getByRole('button', { name: 'Bring forward' })).toBeDisabled();
  });

  it('disables duplicate at the element limit', () => {
    const others = Array.from({ length: MAX_ELEMENTS - 1 }, (_, i) => fern(`f${i}`));
    setup(stateWith([rose(), ...others]));
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
  });
});

describe('SelectionToolbarContainer colours', () => {
  it('offers the available colours of a recolourable flower and recolours it', async () => {
    function Harness() {
      const [state, act] = useReducer(editorReducer, stateWith([rose()]));
      return (
        <I18nContext value={createTranslate('en')}>
          <SelectionToolbarContainer state={state} dispatch={act} gesturing={false} />
          <output>
            {state.bouquet.elements[0]?.kind === 'flower' && state.bouquet.elements[0].colorId}
          </output>
        </I18nContext>
      );
    }
    render(<Harness />);
    const names = screen
      .getAllByRole('button', { pressed: false })
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual(['Blush', 'White', 'Peach', 'Burgundy']);
    expect(screen.getByRole('button', { name: 'Red', pressed: true })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Burgundy' }));
    expect(screen.getByRole('status')).toHaveTextContent('burgundy');
    expect(screen.getByRole('button', { name: 'Burgundy', pressed: true })).toBeInTheDocument();
  });

  it.each([
    ['foliage', fern('a')],
    [
      'a fixed-colour flower',
      rose({ catalogId: 'lavender', colorId: null } as Partial<BouquetElement>),
    ],
  ])('shows no swatches for %s', (_label, element) => {
    setup(stateWith([element]));
    expect(screen.queryByRole('group', { name: 'Colour' })).toBeNull();
  });
});

describe('SelectionToolbarContainer docking', () => {
  it.each([
    [-600, 'bottom'],
    [-100, 'top'],
  ])('docks an anchor at y %i to the %s', (y, side) => {
    setup(stateWith([rose({ position: { x: 0, y } })]));
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-side', side);
  });

  it('keeps its side and locks pointer events during a gesture', () => {
    dispatch = vi.fn();
    const { rerender } = render(ui(stateWith([rose({ position: { x: 0, y: -600 } })])));
    rerender(ui(stateWith([rose({ position: { x: 0, y: -100 } })]), true));
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('data-side', 'bottom');
    expect(toolbar).toHaveAttribute('data-pointer-locked', 'true');
    rerender(ui(stateWith([rose({ position: { x: 0, y: -100 } })])));
    expect(toolbar).toHaveAttribute('data-side', 'top');
  });
});
