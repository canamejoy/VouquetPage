import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATALOG } from '@/domain/catalog';
import { COMPOSITIONS } from '@/domain/composition';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { Palette } from './Palette';

const compositionIds = COMPOSITIONS.map((template) => template.id);

interface Options {
  language?: Language;
  hasArrangement?: boolean;
  canAdd?: boolean;
}

function setup({ language = 'en', hasArrangement = false, canAdd = true }: Options = {}) {
  const handlers = {
    onAdd: vi.fn(),
    onApplyComposition: vi.fn(),
  };
  render(
    <I18nContext value={createTranslate(language)}>
      <Palette
        catalog={CATALOG}
        compositionIds={compositionIds}
        hasArrangement={hasArrangement}
        canAdd={canAdd}
        {...handlers}
      />
    </I18nContext>,
  );
  return handlers;
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Palette tabs', () => {
  it('is a tablist whose default tab depends on whether the bouquet has flowers or foliage', () => {
    setup();
    expect(screen.getByRole('tablist', { name: 'Palette' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Compositions',
      'Flowers',
      'Foliage',
    ]);
    expect(tab('Compositions')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Compositions' })).toBeInTheDocument();
  });

  it('opens on Flowers once the bouquet has an arrangement', () => {
    setup({ hasArrangement: true });
    expect(tab('Flowers')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Rose' })).toBeInTheDocument();
  });

  it('moves between tabs with the arrow, Home and End keys (one tab stop)', async () => {
    setup();
    await userEvent.tab();
    expect(tab('Compositions')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Flowers')).toHaveFocus();
    expect(tab('Flowers')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Compositions')).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{End}');
    expect(tab('Foliage')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Compositions')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(tab('Foliage')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(tab('Compositions')).toHaveFocus();
  });

  it('localizes the tabs and item names', async () => {
    setup({ language: 'es', hasArrangement: true });
    expect(screen.getByRole('tab', { name: 'Flores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rosa' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Follaje' }));
    expect(screen.getByRole('button', { name: 'Helecho' })).toBeInTheDocument();
  });
});

describe('Palette add', () => {
  it.each([
    ['Flowers', 'Rose', 'rose'],
    ['Foliage', 'Fern', 'fern'],
  ])('tapping a tile in %s adds that item', async (tabName, tile, catalogId) => {
    const { onAdd } = setup({ hasArrangement: true });
    await userEvent.click(tab(tabName));
    await userEvent.click(screen.getByRole('button', { name: tile }));
    expect(onAdd).toHaveBeenCalledExactlyOnceWith(catalogId);
  });

  it('lists every flower and foliage item of the catalog as a tile', async () => {
    setup({ hasArrangement: true });
    expect(within(screen.getByRole('tabpanel')).getAllByRole('button')).toHaveLength(8);
    await userEvent.click(tab('Foliage'));
    expect(within(screen.getByRole('tabpanel')).getAllByRole('button')).toHaveLength(5);
  });

  it('makes tiles unavailable and adds nothing when the bouquet is full', async () => {
    const { onAdd } = setup({ hasArrangement: true, canAdd: false });
    const tile = screen.getByRole('button', { name: 'Rose' });
    expect(tile).toBeDisabled();
    await userEvent.click(tile);
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('Palette compositions tab', () => {
  it('mounts the composition picker and forwards an applied template', async () => {
    const { onApplyComposition } = setup();
    expect(screen.getByText('Start with a composition')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Apply Cascade' }));
    expect(onApplyComposition).toHaveBeenCalledExactlyOnceWith('cascade');
  });
});
