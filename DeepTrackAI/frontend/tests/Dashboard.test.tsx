import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from '../pages';
import { AppProvider } from '../context/AppContext';

describe('Dashboard shell', () => {
  it('renders the production upload workspace and pipeline rail', () => {
    const html = renderToStaticMarkup(
      <AppProvider>
        <Home />
      </AppProvider>
    );

    expect(html.includes('DeepTrack AI')).toBeTruthy();
    expect(html.includes('Drop your track here')).toBeTruthy();
    expect(html.includes('System pipeline')).toBeTruthy();
    expect(html.includes('Live pipeline')).toBeTruthy();
  });
});
