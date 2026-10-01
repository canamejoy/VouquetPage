import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { COMPOSITIONS } from '@/domain/composition';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { CompositionPicker } from './CompositionPicker';

function setup(hasArrangement: boolean, language: Language = 'en') {
  const onApply = vi.fn();
  render(
    <I18nContext value={createTranslate(language)}>
      <CompositionPicker
        ids={COMPOSITIONS.map((template) => template.id)}
        hasArrangement={hasArrangement}
        onApply={onApply}
      />
    </I18nContext>,
  );
  return onApply;
}

describe('CompositionPicker', () => {
  it('lists the six templates with name and description and shows the empty hint', () => {
    setup(false);
    expect(screen.getByText('Start with a composition')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Apply/ })).toHaveLength(6);
    expect(screen.getByText('Long stems')).toBeInTheDocument();
    expect(screen.getByText('A tall, slender bunch.')).toBeInTheDocument();
  });

  it('applies at once when the bouquet has no flowers or foliage', async () => {
    const onApply = setup(false);
    await userEvent.click(screen.getByRole('button', { name: 'Apply Cascade' }));
    expect(onApply).toHaveBeenCalledExactlyOnceWith('cascade');
    expect(screen.queryByRole('group', { name: /Replace/ })).toBeNull();
  });

  it('asks inline before replacing an arrangement, and applies only on Confirm', async () => {
    const onApply = setup(true);
    expect(screen.queryByText('Start with a composition')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Apply Wild' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Replace the current arrangement?' })).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onApply).toHaveBeenCalledExactlyOnceWith('wild');
    expect(screen.queryByRole('group', { name: /Replace/ })).toBeNull();
  });

  it('cancels without applying, restoring the picker and its focus', async () => {
    const onApply = setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Apply Wild' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: /Replace/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply Wild' })).toHaveFocus();
    expect(screen.getAllByRole('button', { name: /^Apply/ })).toHaveLength(6);
  });

  it('keeps one confirmation at a time and localizes it', async () => {
    setup(true, 'es');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar Silvestre' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar Cascada' }));
    expect(screen.getAllByRole('group', { name: /^¿Reemplazar/ })).toHaveLength(1);
  });
});
