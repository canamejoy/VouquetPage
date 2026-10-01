import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ColorId } from '@/domain/catalog';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { SelectionToolbar } from './SelectionToolbar';

type Props = Parameters<typeof SelectionToolbar>[0];

function setup(overrides: Partial<Props> = {}, language: Language = 'en') {
  const handlers = {
    onRotate: vi.fn(),
    onScale: vi.fn(),
    onReorder: vi.fn(),
    onRecolor: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <I18nContext value={createTranslate(language)}>
      <SelectionToolbar
        side="bottom"
        pointerLocked={false}
        colors={['red', 'blush', 'white']}
        colorId="blush"
        limits={{
          smaller: false,
          larger: false,
          backward: false,
          forward: false,
          duplicate: false,
        }}
        {...handlers}
        {...overrides}
      />
    </I18nContext>,
  );
  return handlers;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('SelectionToolbar', () => {
  it('is a labelled toolbar that exposes its dock side', () => {
    setup({ side: 'top' });
    const toolbar = screen.getByRole('toolbar', { name: 'Selection tools' });
    expect(toolbar).toHaveAttribute('data-side', 'top');
  });

  it.each([
    ['Rotate left', 'onRotate', -1],
    ['Rotate right', 'onRotate', 1],
    ['Smaller', 'onScale', -1],
    ['Larger', 'onScale', 1],
    ['Send backward', 'onReorder', 'backward'],
    ['Bring forward', 'onReorder', 'forward'],
  ] as const)('%s calls %s with %s', async (name, handler, arg) => {
    const handlers = setup();
    await userEvent.click(button(name));
    expect(handlers[handler]).toHaveBeenCalledExactlyOnceWith(arg);
  });

  it('activates duplicate and delete by keyboard', async () => {
    const handlers = setup();
    button('Duplicate').focus();
    await userEvent.keyboard('{Enter}');
    button('Delete').focus();
    await userEvent.keyboard(' ');
    expect(handlers.onDuplicate).toHaveBeenCalledOnce();
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });

  it.each([
    ['smaller', 'Smaller'],
    ['larger', 'Larger'],
    ['backward', 'Send backward'],
    ['forward', 'Bring forward'],
    ['duplicate', 'Duplicate'],
  ] as const)('disables %s when its limit is reached', (key, name) => {
    setup({
      limits: {
        smaller: false,
        larger: false,
        backward: false,
        forward: false,
        duplicate: false,
        [key]: true,
      },
    });
    expect(button(name)).toBeDisabled();
    expect(button('Delete')).toBeEnabled();
  });

  it('lists exactly the available colours as pressed-state swatches', async () => {
    const handlers = setup();
    const group = screen.getByRole('group', { name: 'Colour' });
    const names = within(group)
      .getAllByRole('button')
      .map((swatch) => swatch.getAttribute('aria-label'));
    expect(names).toEqual(['Red', 'Blush', 'White']);
    expect(within(group).getByRole('button', { name: 'Blush' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(group).getByRole('button', { name: 'Red' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await userEvent.click(within(group).getByRole('button', { name: 'Red' }));
    expect(handlers.onRecolor).toHaveBeenCalledExactlyOnceWith('red' satisfies ColorId);
  });

  it('shows no swatches without available colours', () => {
    setup({ colors: [], colorId: null });
    expect(screen.queryByRole('group', { name: 'Colour' })).toBeNull();
  });

  it('localizes the swatch names', () => {
    setup({}, 'es');
    expect(screen.getByRole('button', { name: 'Rojo' })).toBeInTheDocument();
  });

  it('marks itself inert for pointer events while a gesture runs (pointerLocked)', () => {
    setup({ pointerLocked: true });
    expect(screen.getByRole('toolbar', { hidden: true })).toHaveAttribute(
      'data-pointer-locked',
      'true',
    );
  });
});
