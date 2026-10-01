import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { InlineConfirm } from './InlineConfirm';

function setup(language: 'en' | 'es' = 'en') {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <I18nContext value={createTranslate(language)}>
      <InlineConfirm message="Replace it?" onConfirm={onConfirm} onCancel={onCancel} />
    </I18nContext>,
  );
  return { onConfirm, onCancel };
}

describe('InlineConfirm', () => {
  it('is a labelled group, not a dialog, and moves focus to Confirm without trapping it', async () => {
    setup();
    expect(screen.getByRole('group', { name: 'Replace it?' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('calls the matching callback, with localized button labels', async () => {
    const { onConfirm, onCancel } = setup('es');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
