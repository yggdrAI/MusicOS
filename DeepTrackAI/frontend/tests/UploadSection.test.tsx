import { render, screen } from '@testing-library/react';
import UploadSection from '../components/UploadSection';

describe('UploadSection', () => {
  it('renders upload input', () => {
    render(<UploadSection />);
    expect(screen.getByText(/Upload a Song/i)).toBeInTheDocument();
  });
});
