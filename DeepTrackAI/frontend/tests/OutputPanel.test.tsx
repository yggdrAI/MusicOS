import { render, screen } from '@testing-library/react';
import OutputPanel from '../components/OutputPanel';

describe('OutputPanel', () => {
  it('renders output when result is present', () => {
    render(<OutputPanel result={{ tempo: 120, key: 'C' }} />);
    expect(screen.getByText(/Analysis Output/i)).toBeInTheDocument();
    expect(screen.getByText(/tempo/)).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });
});
