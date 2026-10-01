import { render, screen, within } from '@testing-library/react';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { SummaryPanel, type SummaryPanelGroup } from './SummaryPanel';

const groups: SummaryPanelGroup[] = [
  {
    kind: 'flowers',
    lines: [
      { catalogId: 'rose', colorId: 'red', quantity: 2, amount: 'COP 12,000' },
      { catalogId: 'tulip', colorId: 'white', quantity: 1, amount: 'COP 5,000' },
    ],
  },
  {
    kind: 'foliage',
    lines: [{ catalogId: 'fern', colorId: null, quantity: 1, amount: 'COP 2,000' }],
  },
  {
    kind: 'wrapping',
    lines: [{ catalogId: 'kraft', colorId: null, quantity: 1, amount: 'COP 4,000' }],
  },
];

function setup(language: Language, props: { groups: SummaryPanelGroup[]; total: string }) {
  render(
    <I18nContext value={createTranslate(language)}>
      <SummaryPanel {...props} />
    </I18nContext>,
  );
}

describe('SummaryPanel', () => {
  it('lists the groups in order with localized names, colours, quantities and amounts', () => {
    setup('en', { groups, total: 'COP 23,000' });
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Flowers', 'Foliage', 'Wrapping']);
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual([
      'Rose, Redx2COP 12,000',
      'Tulip, Whitex1COP 5,000',
      'Fernx1COP 2,000',
      'Kraft paperx1COP 4,000',
    ]);
  });

  it.each([
    ['en', 'Estimated total', 'Sample prices, for demonstration only.', 'Flowers'],
    ['es', 'Total estimado', 'Precios de muestra, solo con fines de demostración.', 'Flores'],
  ] as const)(
    'shows one total, the notice and the title in %s',
    (language, label, notice, group) => {
      setup(language, { groups, total: 'COP 23,000' });
      expect(screen.getAllByText(label)).toHaveLength(1);
      expect(screen.getByText('COP 23,000')).toBeInTheDocument();
      expect(screen.getByText(notice)).toBeVisible();
      expect(screen.getByRole('heading', { level: 3, name: group })).toBeInTheDocument();
    },
  );

  it('shows the empty state and the zero total for an empty bouquet', () => {
    setup('en', { groups: [], total: 'COP 0' });
    expect(screen.getByText('Your bouquet is empty.')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    const total = screen.getByText('Estimated total').parentElement as HTMLElement;
    expect(within(total).getByText('COP 0')).toBeInTheDocument();
  });
});
