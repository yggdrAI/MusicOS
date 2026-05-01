import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UploadZone from '../components/UploadZone';
import { AppProvider } from '../context/AppContext';

describe('UploadZone', () => {
  it('renders upload controls and capability chips', () => {
    const html = renderToStaticMarkup(
      <AppProvider>
        <UploadZone />
      </AppProvider>
    );

    expect(html.includes('Choose file')).toBeTruthy();
    expect(html.includes('Tempo and key')).toBeTruthy();
    expect(html.includes('Lyrics and flow')).toBeTruthy();
  });
});
