import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorAction } from '@/application/editor/actions';
import { initialEditorState } from '@/application/editor/state';
import type { EditorState } from '@/application/editor/state';
import { MAX_ELEMENTS } from '@/domain/bouquet';
import type { Bouquet, BouquetElement } from '@/domain/bouquet';
import { defaultAnchor } from '@/domain/geometry';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { PaletteContainer } from './PaletteContainer';

const fern = (index: number): BouquetElement => ({
  id: `e${index}`,
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: 0, y: -400 },
  rotation: 0,
  scale: 1,
});

const stateWith = (count: number, wrappingId: Bouquet['wrappingId'] = null): EditorState =>
  initialEditorState({
    schemaVersion: 1,
    wrappingId,
    elements: Array.from({ length: count }, (_, index) => fern(index)),
  });

const noDrag = { ghost: null, onTilePointerDown: vi.fn(), consumeDragClick: () => false };

let dispatch: ReturnType<typeof vi.fn<(action: EditorAction) => void>>;

function setup(state: EditorState) {
  dispatch = vi.fn<(action: EditorAction) => void>();
  render(
    <I18nContext value={createTranslate('en')}>
      <PaletteContainer state={state} dispatch={dispatch} drag={noDrag} />
    </I18nContext>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('PaletteContainer', () => {
  it.each([1, 2, 7])(
    'adds a tapped flower at the tap-add position for %i elements',
    async (count) => {
      setup(stateWith(count));
      await userEvent.click(screen.getByRole('button', { name: 'Rose' }));
      expect(dispatch).toHaveBeenCalledExactlyOnceWith({
        type: 'element/add',
        catalogId: 'rose',
        position: defaultAnchor(count),
      });
    },
  );

  it('dispatches nothing at the element limit', async () => {
    setup(stateWith(MAX_ELEMENTS));
    const tile = screen.getByRole('button', { name: 'Rose' });
    expect(tile).toBeDisabled();
    await userEvent.click(tile);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('sets and clears the wrapping and shows the current one', async () => {
    setup(stateWith(0, 'blush'));
    await userEvent.click(screen.getByRole('tab', { name: 'Wrapping' }));
    expect(screen.getByRole('button', { name: 'Blush paper' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Burlap' }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'wrapping/set', wrappingId: 'burlap' });
    await userEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'wrapping/set', wrappingId: null });
  });

  it('applies a composition at once when only a wrapping is present', async () => {
    setup(stateWith(0, 'kraft'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply Round' }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'composition/apply',
      compositionId: 'round',
    });
  });

  it('confirms before replacing an arrangement and dispatches nothing on Cancel', async () => {
    setup(stateWith(3));
    await userEvent.click(screen.getByRole('tab', { name: 'Compositions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply Round' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dispatch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Apply Round' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'composition/apply',
      compositionId: 'round',
    });
  });
});
