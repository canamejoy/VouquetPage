import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Preferences, PreferencesStore } from '@/application/preferences/ports';
import { useT } from '@/ui/i18n/useT';
import { PreferencesProvider, usePreferences } from './PreferencesProvider';

function Probe() {
  const { language, currency, setLanguage, setCurrency } = usePreferences();
  const t = useT();
  return (
    <>
      <output>{`${language} ${currency} ${t('summary.title')}`}</output>
      <button onClick={() => setLanguage('en')}>en</button>
      <button onClick={() => setCurrency('USD')}>usd</button>
    </>
  );
}

function setup(store: PreferencesStore, browserLanguages: readonly string[] = []) {
  render(
    <PreferencesProvider store={store} browserLanguages={browserLanguages}>
      <Probe />
    </PreferencesProvider>,
  );
}

const storeOf = (stored: Preferences) => ({ load: () => stored, save: vi.fn() });

describe('PreferencesProvider', () => {
  it.each([
    [{ language: null, currency: 'COP' }, ['fr-FR'], 'es COP Resumen'],
    [{ language: null, currency: 'COP' }, ['fr-FR', 'en-GB'], 'en COP Summary'],
    [{ language: 'es', currency: 'USD' }, ['en-US'], 'es USD Resumen'],
  ] as const)('starts from %j and browser %j as "%s"', (stored, browser, expected) => {
    setup(storeOf(stored), browser);
    expect(screen.getByRole('status')).toHaveTextContent(expected);
  });

  it('applies and saves each change together with the other preference', async () => {
    const store = storeOf({ language: null, currency: 'COP' });
    setup(store, ['es']);
    await userEvent.click(screen.getByRole('button', { name: 'usd' }));
    expect(store.save).toHaveBeenLastCalledWith({ language: null, currency: 'USD' });
    await userEvent.click(screen.getByRole('button', { name: 'en' }));
    expect(store.save).toHaveBeenLastCalledWith({ language: 'en', currency: 'USD' });
    expect(screen.getByRole('status')).toHaveTextContent('en USD Summary');
    expect(document.documentElement.lang).toBe('en');
  });

  it('survives a store that throws on load and save', async () => {
    const store: PreferencesStore = {
      load: () => {
        throw new Error('blocked');
      },
      save: () => {
        throw new Error('full');
      },
    };
    setup(store, ['en']);
    expect(screen.getByRole('status')).toHaveTextContent('en COP Summary');
    await userEvent.click(screen.getByRole('button', { name: 'usd' }));
    expect(screen.getByRole('status')).toHaveTextContent('en USD Summary');
  });

  it('treats a store that returns invalid values as nothing stored', () => {
    const invalid = { language: 'fr', currency: 'EUR' } as unknown as Preferences;
    setup(storeOf(invalid), ['en']);
    expect(screen.getByRole('status')).toHaveTextContent('en COP Summary');
  });
});
