import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it } from 'vitest';
import { editorReducer } from '@/application/editor/reducer';
import { initialEditorState, type EditorState } from '@/application/editor/state';
import type { Bouquet } from '@/domain/bouquet';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { EditorCanvasContainer } from '../EditorCanvasContainer';

const bouquet: Bouquet = {
  schemaVersion: 1,
  wrappingId: null,
  elements: [
    {
      id: 'a',
      kind: 'flower',
      catalogId: 'rose',
      colorId: 'red',
      position: { x: 0, y: -400 },
      rotation: 0,
      scale: 1,
    },
    {
      id: 'b',
      kind: 'foliage',
      catalogId: 'fern',
      position: { x: 500, y: -300 },
      rotation: 0,
      scale: 1,
    },
  ],
};

let latest: EditorState;

function Harness() {
  const [state, dispatch] = useReducer(editorReducer, initialEditorState(bouquet));
  latest = state;
  return <EditorCanvasContainer state={state} dispatch={dispatch} />;
}

const setup = (language: Language = 'en') =>
  render(
    <I18nContext value={createTranslate(language)}>
      <Harness />
    </I18nContext>,
  );

const element = (name: RegExp) => screen.getByRole('button', { name });
const status = () => screen.getByRole('status');

describe('focus selects', () => {
  it('selects an element when the keyboard focuses it', async () => {
    setup();
    await userEvent.tab();
    expect(latest.selectedId).toBe('a');
    await userEvent.tab();
    expect(latest.selectedId).toBe('b');
  });
});

describe('shortcuts through the canvas', () => {
  it('moves the focused element and announces it', async () => {
    setup();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Shift>}{ArrowDown}{/Shift}');
    expect(latest.bouquet.elements[0]?.position).toEqual({ x: 10, y: -350 });
    expect(status()).toHaveTextContent('Rose moved to 10, -350');
  });

  it.each([
    ['en', 'r', 'Rose rotated to 15 degrees'],
    ['es', 'r', 'Se giró Rosa a 15 grados'],
    ['en', '-', 'Rose resized to 90 percent'],
    ['en', ']', 'Rose moved to layer 2 of 2'],
    ['en', '{Control>}d{/Control}', 'Rose duplicated'],
    ['en', '{Delete}', 'Rose deleted'],
  ] as const)('%s %s announces %s', async (language, keys, text) => {
    setup(language);
    await userEvent.tab();
    await userEvent.keyboard(keys);
    expect(status()).toHaveTextContent(text);
  });

  it('does not move or announce an element already at the bounds', async () => {
    setup();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(latest.bouquet.elements[1]?.position.x).toBe(500);
    expect(status()).toBeEmptyDOMElement();
    await userEvent.keyboard('{ArrowLeft}');
    expect(status()).toHaveTextContent('Fern moved to 490, -300');
  });

  it('prevents default only for keys it handles', async () => {
    setup();
    await userEvent.tab();
    const focused = element(/Rose/);
    expect(fireEvent.keyDown(focused, { key: 'ArrowLeft' })).toBe(false);
    expect(fireEvent.keyDown(focused, { key: 'd', ctrlKey: true })).toBe(false);
    expect(fireEvent.keyDown(focused, { key: 'r', ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(focused, { key: 'x' })).toBe(true);
  });
});

describe('focus after actions', () => {
  it('deselects on Escape and keeps focus on the element', async () => {
    setup();
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(latest.selectedId).toBeNull();
    expect(element(/Rose/)).toHaveFocus();
  });

  it('moves focus to the canvas after a delete so it is not lost', async () => {
    setup();
    await userEvent.tab();
    await userEvent.keyboard('{Delete}');
    expect(latest.bouquet.elements.map((e) => e.id)).toEqual(['b']);
    expect(screen.getByRole('group', { name: 'Bouquet canvas' })).toHaveFocus();
  });

  it('moves focus to the copy after a duplicate', async () => {
    setup();
    await userEvent.tab();
    await userEvent.keyboard('{Control>}d{/Control}');
    expect(latest.bouquet.elements).toHaveLength(3);
    expect(latest.selectedId).toBe(latest.bouquet.elements[1]?.id);
    expect(screen.getByRole('button', { name: /Rose.*layer 2 of 3/ })).toHaveFocus();
  });
});
