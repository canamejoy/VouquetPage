import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PreferencesStore } from '@/application/preferences/ports';
import { initialEditorState } from '@/application/editor/state';
import type { Bouquet } from '@/domain/bouquet';
import { AppShell } from './AppShell';
import { PreferenceSwitches } from './PreferenceSwitches';
import { PreferencesProvider } from './PreferencesProvider';

// Rose 6000 + kraft 4000 = 10000 COP, about 2.94 USD.
const bouquet: Bouquet = {
  schemaVersion: 1,
  wrappingId: 'kraft',
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
  ],
};
const empty: Bouquet = { schemaVersion: 1, wrappingId: 'kraft', elements: [] };

const store = (): PreferencesStore => ({
  load: () => ({ language: null, currency: 'COP' }),
  save: vi.fn(),
});

function setup(value: Bouquet, language = 'en-US') {
  render(
    <PreferencesProvider store={store()} browserLanguages={[language]}>
      <PreferenceSwitches />
      <AppShell
        state={initialEditorState(value)}
        header={<header>head</header>}
        palette={<p>palette content</p>}
        canvas={<p>canvas content</p>}
      />
    </PreferencesProvider>,
  );
}

const chip = () => screen.getByRole('button', { name: /^(Summary|Resumen)/ });
const plain = (text: string | null) => text?.replace(/\u00a0/g, ' ');

describe('AppShell structure', () => {
  it('places each slot inside its named landmark', () => {
    setup(bouquet);
    expect(screen.getByText('head')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Palette' })).getByText('palette content'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('main', { name: 'Bouquet canvas' })).getByText('canvas content'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('complementary', { name: 'Summary' })).getByRole('heading', {
        name: 'Summary',
      }),
    ).toBeInTheDocument();
  });
});

describe('summary disclosure', () => {
  it('starts collapsed, showing the total on the control', () => {
    setup(bouquet);
    expect(chip()).toHaveAttribute('aria-expanded', 'false');
    expect(plain(chip().textContent)).toContain('COP 10,000');
  });

  it('expands and collapses the region it controls, from the keyboard too', async () => {
    setup(bouquet);
    const region = document.getElementById(chip().getAttribute('aria-controls') ?? '');
    expect(region).toContainElement(screen.getByRole('heading', { name: 'Summary' }));
    expect(region).toHaveAttribute('data-expanded', 'false');

    chip().focus();
    await userEvent.keyboard('{Enter}');
    expect(chip()).toHaveAttribute('aria-expanded', 'true');
    expect(region).toHaveAttribute('data-expanded', 'true');

    await userEvent.keyboard(' ');
    expect(chip()).toHaveAttribute('aria-expanded', 'false');
    expect(region).toHaveAttribute('data-expanded', 'false');
  });

  it.each([
    ['en-US', 'USD', 'Summary', 'USD 2.94'],
    ['es-CO', 'USD', 'Resumen', 'USD 2,94'],
  ])(
    'shows the total of the active currency and language (%s, %s)',
    async (lang, cur, name, amount) => {
      setup(bouquet, lang);
      await userEvent.click(screen.getByRole('button', { name: cur }));
      expect(chip()).toHaveTextContent(name);
      expect(plain(chip().textContent)).toContain(amount);
    },
  );
});

describe('empty-canvas hint', () => {
  it('points to the Compositions tab while the bouquet has no elements, wrapping or not', () => {
    setup(empty);
    expect(screen.getByText(/Compositions tab/)).toBeInTheDocument();
  });

  it('is written in the active language', () => {
    setup(empty, 'es-CO');
    expect(screen.getByText(/pestaña Composiciones/)).toBeInTheDocument();
  });

  it('is not shown once the bouquet has an element', () => {
    setup(bouquet);
    expect(screen.queryByText(/Compositions tab/)).toBeNull();
  });
});
