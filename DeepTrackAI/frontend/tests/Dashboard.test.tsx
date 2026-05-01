import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard';

describe('Dashboard', () => {
  it('renders dashboard sections', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Waveform Visualizer/i)).toBeInTheDocument();
    expect(screen.getByText(/Stem Player/i)).toBeInTheDocument();
    expect(screen.getByText(/Lyrics Viewer/i)).toBeInTheDocument();
    expect(screen.getByText(/Beat & BPM/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights/i)).toBeInTheDocument();
  });
});
