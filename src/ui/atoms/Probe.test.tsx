import { render, screen } from '@testing-library/react';
import { Probe } from './Probe';

describe('Probe', () => {
  it('renders a heading with the given title', () => {
    render(<Probe title="VOUQUET" />);
    expect(screen.getByRole('heading', { name: 'VOUQUET' })).toBeInTheDocument();
  });

  it('renders a different title when the prop changes', () => {
    render(<Probe title="Bouquet editor" />);
    expect(screen.getByRole('heading', { name: 'Bouquet editor' })).toHaveTextContent(
      'Bouquet editor',
    );
    expect(screen.queryByRole('heading', { name: 'VOUQUET' })).toBeNull();
  });
});
