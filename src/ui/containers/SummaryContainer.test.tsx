import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PreferencesStore } from '@/application/preferences/ports';
import { initialEditorState } from '@/application/editor/state';
import type { Bouquet, BouquetElement } from '@/domain/bouquet';
import { PreferenceSwitches } from './PreferenceSwitches';
import { PreferencesProvider } from './PreferencesProvider';
import { SummaryContainer } from './SummaryContainer';

const flower = (id: string, catalogId: 'rose' | 'peony', colorId: 'red'): BouquetElement => ({
  id,
  kind: 'flower',
  catalogId,
  colorId,
  position: { x: 0, y: -400 },
  rotation: 0,
  scale: 1,
});

// Rose 6000 x1, peony 12000 x2, kraft 4000: 34000 COP, exactly 10 USD.
const exact: Bouquet = {
  schemaVersion: 1,
  wrappingId: 'kraft',
  elements: [flower('a', 'rose', 'red'), flower('b', 'peony', 'red'), flower('c', 'peony', 'red')],
};
// Rose 6000 + kraft 4000 + fern 2000: lines that do not convert to whole cents.
const uneven: Bouquet = {
  schemaVersion: 1,
  wrappingId: 'kraft',
  elements: [
    flower('a', 'rose', 'red'),
    {
      id: 'f',
      kind: 'foliage',
      catalogId: 'fern',
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: 1,
    },
  ],
};

const emptyStore = (): PreferencesStore => ({
  load: () => ({ language: null, currency: 'COP' }),
  save: vi.fn(),
});

function setup(bouquet: Bouquet, store = emptyStore(), browser: string[] = ['en-US']) {
  render(
    <PreferencesProvider store={store} browserLanguages={browser}>
      <PreferenceSwitches />
      <SummaryContainer state={initialEditorState(bouquet)} />
    </PreferencesProvider>,
  );
  return store;
}

describe('SummaryContainer', () => {
  it('shows COP amounts by default, with the empty state at zero', () => {
    setup({ schemaVersion: 1, elements: [], wrappingId: null });
    expect(screen.getByText('Your bouquet is empty.')).toBeInTheDocument();
    expect(screen.getByText(`COP 0`)).toBeInTheDocument();
  });

  it.each([
    ['en', 'COP', `COP 34,000`],
    ['en', 'USD', `USD 10.00`],
    ['es', 'COP', `COP 34.000`],
    ['es', 'USD', `USD 10,00`],
  ] as const)('formats the total in %s and %s', async (language, currency, total) => {
    setup(exact, emptyStore(), [language]);
    await userEvent.click(screen.getByRole('button', { name: currency }));
    const label = language === 'en' ? 'Estimated total' : 'Total estimado';
    // formatMoney puts a non-breaking space after the code; it is pinned in formatMoney.test.ts.
    expect(screen.getByText(label).nextElementSibling?.textContent?.replace(/\u00a0/g, ' ')).toBe(
      total,
    );
  });

  it('keeps displayed USD lines summing to the displayed total', async () => {
    setup(uneven);
    await userEvent.click(screen.getByRole('button', { name: 'USD' }));
    const cents = (text: string | null) => Math.round(Number(text?.replace(/[^\d.]/g, '')) * 100);
    const lines = screen.getAllByRole('listitem').map((item) => item.lastElementChild?.textContent);
    const total = screen.getByText('Estimated total').nextElementSibling?.textContent;
    expect(lines).toHaveLength(3);
    expect(lines.reduce((sum, line) => sum + cents(line ?? null), 0)).toBe(cents(total ?? null));
  });

  it('changes the language, labels and number formatting, and remembers both choices', async () => {
    const store = setup(exact);
    await userEvent.click(screen.getByRole('button', { name: 'Español' }));
    expect(screen.getByText('Total estimado')).toBeInTheDocument();
    expect(screen.getByText('Precios de muestra, solo con fines de demostración.')).toBeVisible();
    expect(screen.getByText(`COP 34.000`)).toBeInTheDocument();
    const [group] = screen.getAllByRole('group', { name: 'Moneda' });
    await userEvent.click(within(group as HTMLElement).getByRole('button', { name: 'USD' }));
    expect(store.save).toHaveBeenLastCalledWith({ language: 'es', currency: 'USD' });
  });

  it('starts in the stored currency', () => {
    setup(exact, { load: () => ({ language: 'en', currency: 'USD' }), save: vi.fn() });
    expect(screen.getByText(`USD 10.00`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'USD' })).toHaveAttribute('aria-pressed', 'true');
  });
});
