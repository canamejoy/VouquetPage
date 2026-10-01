import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('is a native button named by its children and defaults to type button', () => {
    render(<Button>Confirm</Button>);
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveAttribute('type', 'button');
  });

  it('activates on click, Enter and Space', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Apply</Button>);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not activate while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Apply
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
