import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { IconButton } from './IconButton';
import { iconNames } from './icons';

describe('IconButton', () => {
  it.each([
    ['rotateLeft', 'Girar a la izquierda'],
    ['delete', 'Eliminar'],
  ] as const)('is named by the localized label for %s', (icon, name) => {
    render(<IconButton icon={icon} onClick={() => {}} />);
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });

  it('follows the active language', () => {
    render(
      <I18nContext value={createTranslate('en')}>
        <IconButton icon="duplicate" onClick={() => {}} />
      </I18nContext>,
    );
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
  });

  it('keeps the icon decorative so the name is not announced twice', () => {
    const { container } = render(<IconButton icon="larger" onClick={() => {}} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('activates by click and keyboard, and not while disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<IconButton icon="smaller" onClick={onClick} />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(2);
    rerender(<IconButton icon="smaller" disabled onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('draws a distinct non-empty icon for every name', () => {
    const drawings = iconNames.map((icon) => {
      const { container, unmount } = render(<IconButton icon={icon} onClick={() => {}} />);
      const markup = container.querySelector('svg')?.innerHTML ?? '';
      unmount();
      return markup;
    });
    expect(iconNames).toHaveLength(8);
    expect(drawings.every((markup) => markup.length > 0)).toBe(true);
    expect(new Set(drawings).size).toBe(iconNames.length);
  });
});
