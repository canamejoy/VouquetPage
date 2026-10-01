import { render, screen } from '@testing-library/react';
import { CATALOG, COLOR_HEX } from '@/domain/catalog';
import { COMPOSITIONS } from '@/domain/composition';
import { en } from './en';
import { es } from './es';
import { I18nProvider } from './I18nContext';
import { useT } from './useT';

function Label({ id }: { id: 'summary.estimatedTotal' | 'canvas.elementLabel' }) {
  const t = useT();
  return <p>{t(id, { item: 'Rose', color: 'Red', position: 2, count: 5 })}</p>;
}

describe('dictionaries', () => {
  it('have exactly the same keys in both languages', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('never leave a translation empty', () => {
    for (const dictionary of [en, es]) {
      const values = Object.values(dictionary);
      expect(values.length).toBeGreaterThan(0);
      expect(values.every((value) => value.trim() !== '')).toBe(true);
    }
  });

  it('cover every catalog item, colour and composition by id', () => {
    const expected = [
      ...[...CATALOG.flowers, ...CATALOG.foliage, ...CATALOG.wrappings].map(
        (item) => `catalog.${item.id}`,
      ),
      ...Object.keys(COLOR_HEX).map((id) => `color.${id}`),
      ...COMPOSITIONS.flatMap(({ id }) => [
        `composition.${id}.name`,
        `composition.${id}.description`,
      ]),
    ];
    expect(expected).toHaveLength(18 + 10 + 12);
    for (const key of expected) {
      expect(en).toHaveProperty([key]);
    }
  });
});

describe('useT', () => {
  it('defaults to Spanish without a provider', () => {
    render(<Label id="summary.estimatedTotal" />);
    expect(screen.getByText(es['summary.estimatedTotal'])).toBeInTheDocument();
  });

  it('translates to English inside an English provider', () => {
    render(
      <I18nProvider language="en">
        <Label id="summary.estimatedTotal" />
      </I18nProvider>,
    );
    expect(screen.getByText('Estimated total')).toBeInTheDocument();
  });

  it('interpolates {name} parameters in both languages', () => {
    const { rerender } = render(
      <I18nProvider language="en">
        <Label id="canvas.elementLabel" />
      </I18nProvider>,
    );
    expect(screen.getByText('Rose, Red, layer 2 of 5')).toBeInTheDocument();
    rerender(
      <I18nProvider language="es">
        <Label id="canvas.elementLabel" />
      </I18nProvider>,
    );
    expect(screen.getByText('Rose, Red, capa 2 de 5')).toBeInTheDocument();
  });

  it('keeps the document language in sync with the provider', () => {
    const { rerender } = render(<I18nProvider language="en">{null}</I18nProvider>);
    expect(document.documentElement.lang).toBe('en');
    rerender(<I18nProvider language="es">{null}</I18nProvider>);
    expect(document.documentElement.lang).toBe('es');
  });
});
