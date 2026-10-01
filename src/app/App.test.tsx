import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTOSAVE_DELAY_MS } from '@/application/draft/autosave';
import { emptyBouquet, type Bouquet } from '@/domain/bouquet';
import { DRAFT_KEY } from '@/infrastructure/local-storage/draftStore';
import {
  createFakeStorage,
  createThrowingStorage,
} from '@/infrastructure/local-storage/fakeStorage.testing';
import { App } from './App';

const draft: Bouquet = {
  schemaVersion: 1,
  wrappingId: 'kraft',
  elements: [
    {
      id: 'e1',
      kind: 'flower',
      catalogId: 'rose',
      colorId: 'red',
      position: { x: 0, y: -300 },
      rotation: 0,
      scale: 1,
    },
  ],
};

const storedDraft = (bouquet: Bouquet) => ({ [DRAFT_KEY]: JSON.stringify(bouquet) });
const savedDraft = (storage: Storage) => JSON.parse(storage.getItem(DRAFT_KEY) ?? 'null');

const canvas = () => screen.getByRole('group', { name: 'Bouquet canvas' });
const rose = () => within(canvas()).getByRole('button', { name: /^Rose/ });
const roseOrNull = () => within(canvas()).queryByRole('button', { name: /^Rose/ });
const total = () => screen.getByText('Estimated total').nextElementSibling;

const press = (name: string, role = 'button') => fireEvent.click(screen.getByRole(role, { name }));

/** Adds a rose through the palette, the way a user does. */
function addRose() {
  press('Flowers', 'tab');
  press('Rose');
}

// Fake timers drive the autosave debounce; user-event would hang on them, so clicks use fireEvent.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('App structure', () => {
  it('renders the header, palette, canvas and summary as named landmarks', () => {
    render(<App storage={createFakeStorage()} />);
    expect(screen.getByRole('banner')).toHaveTextContent('VOUQUET');
    expect(screen.getByRole('heading', { level: 1, name: 'VOUQUET' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Palette' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('main', { name: 'Bouquet canvas' })).getByRole('group', {
        name: 'Bouquet canvas',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Summary' })).toBeInTheDocument();
  });
});

describe('editing', () => {
  it('shows an added element on the canvas and in the summary, then empties it on delete', () => {
    render(<App storage={createFakeStorage()} />);
    expect(total()).toHaveTextContent('COP 0');
    addRose();
    expect(rose()).toBeInTheDocument();
    expect(total()).not.toHaveTextContent('COP 0');

    // The reducer selects a newly added element, so its toolbar is already showing.
    const toolbar = screen.getByRole('toolbar', { name: 'Selection tools' });
    expect(toolbar).toHaveAttribute('data-side');
    fireEvent.click(within(toolbar).getByRole('button', { name: 'Delete' }));
    expect(roseOrNull()).toBeNull();
    expect(screen.getByText('Your bouquet is empty.')).toBeInTheDocument();
  });

  it('locks the toolbar while a canvas gesture runs and unlocks it afterwards', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 500, 650),
    );
    render(<App storage={createFakeStorage(storedDraft(draft))} />);
    fireEvent.pointerDown(rose(), { pointerId: 1, clientX: 250, clientY: 350 });
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('data-pointer-locked', 'true');
    fireEvent.pointerUp(canvas(), { pointerId: 1 });
    expect(toolbar).toHaveAttribute('data-pointer-locked', 'false');
    vi.restoreAllMocks();
  });
});

describe('New bouquet', () => {
  it('asks inline and keeps everything when cancelled', () => {
    render(<App storage={createFakeStorage(storedDraft(draft))} />);
    press('New bouquet');
    expect(screen.getByRole('group', { name: 'Discard the current bouquet?' })).toBeVisible();
    press('Cancel');
    expect(rose()).toBeInTheDocument();
    expect(total()).not.toHaveTextContent('COP 0');
  });

  it('empties the bouquet and clears the wrapping on confirm', () => {
    const storage = createFakeStorage(storedDraft(draft));
    render(<App storage={storage} />);
    press('New bouquet');
    press('Confirm');
    expect(roseOrNull()).toBeNull();
    expect(screen.getByText('Your bouquet is empty.')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(savedDraft(storage)).toMatchObject({ wrappingId: null, elements: [] });
  });

  it('also asks for a bouquet that holds only a wrapping, and is unavailable when empty', () => {
    const { unmount } = render(
      <App storage={createFakeStorage(storedDraft({ ...emptyBouquet(), wrappingId: 'kraft' }))} />,
    );
    press('New bouquet');
    expect(screen.getByRole('group', { name: 'Discard the current bouquet?' })).toBeVisible();
    unmount();
    render(<App storage={createFakeStorage()} />);
    expect(screen.getByRole('button', { name: 'New bouquet' })).toBeDisabled();
  });
});

describe('draft', () => {
  it('saves after the debounce and a fresh mount restores it', () => {
    const storage = createFakeStorage();
    const { unmount } = render(<App storage={storage} />);
    addRose();
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(savedDraft(storage).elements).toHaveLength(1);
    unmount();

    render(<App storage={storage} />);
    expect(rose()).toBeInTheDocument();
    expect(total()).not.toHaveTextContent('COP 0');
  });

  it('flushes a pending save when the page is hidden', () => {
    const storage = createFakeStorage();
    render(<App storage={storage} />);
    addRose();
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(savedDraft(storage).elements).toHaveLength(1);
  });

  it.each([
    ['unparsable JSON', '{nope'],
    ['an unknown version', JSON.stringify({ ...draft, schemaVersion: 99 })],
  ])('starts empty without errors for %s', (_name, stored) => {
    const storage = createFakeStorage({ [DRAFT_KEY]: stored });
    render(<App storage={storage} />);
    expect(screen.getByText('Your bouquet is empty.')).toBeInTheDocument();
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
  });

  it.each([
    ['throws on every call', createThrowingStorage()],
    ['is unavailable', null],
  ])('still renders and works when storage %s', (_name, storage) => {
    render(<App storage={storage} />);
    addRose();
    expect(rose()).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS));
    expect(total()).not.toHaveTextContent('COP 0');
  });
});

describe('preferences', () => {
  it('remembers the language and currency across a remount', () => {
    const storage = createFakeStorage();
    const { unmount } = render(<App storage={storage} />);
    press('USD');
    press('Español');
    expect(document.documentElement.lang).toBe('es');
    unmount();

    render(<App storage={storage} />);
    expect(screen.getByRole('button', { name: 'Nuevo ramo' })).toBeInTheDocument();
    expect(screen.getByText('Total estimado').nextElementSibling).toHaveTextContent('USD');
    expect(document.documentElement.lang).toBe('es');
  });
});
