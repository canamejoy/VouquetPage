import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedSwitch } from './SegmentedSwitch';

const options = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

describe('SegmentedSwitch', () => {
  it('renders a labelled group with the current option pressed', () => {
    render(<SegmentedSwitch label="Language" options={options} value="en" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the chosen value by click and keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedSwitch label="Language" options={options} value="en" onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Español' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(onChange).toHaveBeenNthCalledWith(1, 'es');
    expect(onChange).toHaveBeenNthCalledWith(2, 'es');
  });

  it('does not report a change when the pressed option is chosen again', async () => {
    const onChange = vi.fn();
    render(<SegmentedSwitch label="Language" options={options} value="en" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
