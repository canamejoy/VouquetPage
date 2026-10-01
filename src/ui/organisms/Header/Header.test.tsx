import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate } from '@/ui/i18n/translate';
import { Header } from './Header';

function setup(canDiscard: boolean, language: 'en' | 'es' = 'en') {
  const onNewBouquet = vi.fn();
  render(
    <I18nContext value={createTranslate(language)}>
      <Header canDiscard={canDiscard} onNewBouquet={onNewBouquet}>
        <span>switches</span>
      </Header>
    </I18nContext>,
  );
  return onNewBouquet;
}

const newBouquet = () => screen.getByRole('button', { name: 'New bouquet' });

describe('Header', () => {
  it('is the banner with the product name as the page heading and the given switches', () => {
    setup(true);
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'VOUQUET' }),
    );
    expect(screen.getByText('switches')).toBeInTheDocument();
  });

  it('labels the action in the active language', () => {
    setup(true, 'es');
    expect(screen.getByRole('button', { name: 'Nuevo ramo' })).toBeEnabled();
  });

  it('has nothing to discard on an empty bouquet, so the action is unavailable', async () => {
    const onNewBouquet = setup(false);
    expect(newBouquet()).toBeDisabled();
    await userEvent.click(newBouquet());
    expect(screen.queryByRole('group')).toBeNull();
    expect(onNewBouquet).not.toHaveBeenCalled();
  });

  it('asks inline in place of the action and keeps the bouquet when cancelled', async () => {
    const onNewBouquet = setup(true);
    await userEvent.click(newBouquet());
    expect(screen.getByRole('group', { name: 'Discard the current bouquet?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New bouquet' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onNewBouquet).not.toHaveBeenCalled();
    expect(newBouquet()).toBeEnabled();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('discards once on confirm and closes the question', async () => {
    const onNewBouquet = setup(true);
    await userEvent.click(newBouquet());
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onNewBouquet).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('group')).toBeNull();
  });
});
