import React from 'react';
import { useApp } from '../context/AppContext';

export default function SpectralView({ mode = 'metrics' }: { mode?: 'metrics' | 'spectrum' | 'energy' }) {
  const { state } = useApp();
  const analysis = state.analysis;
  if (!analysis) return null;

  if (mode === 'spectrum') {
    return (
      <div className="glass-card p-5">
        <h3>Frequency spectrum</h3>
        <div className="spectrum-chart">
          {analysis.frequency_spectrum.map((band) => (
            <div key={band.band}>
              <span style={{ height: `${band.value * 100}%` }} />
              <small>{band.band}</small>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'energy') {
    const points = analysis.energy_curve.map((point, index) => {
      const x = (index / Math.max(1, analysis.energy_curve.length - 1)) * 100;
      const y = 100 - point.value * 86;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="glass-card p-5">
        <h3>Energy curve</h3>
        <svg className="energy-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={points} />
        </svg>
      </div>
    );
  }

  const features = [
    ['Spectral centroid', `${analysis.spectral.spectral_centroid?.toFixed(0)} Hz`],
    ['Bandwidth', `${analysis.spectral.spectral_bandwidth?.toFixed(0)} Hz`],
    ['Roll-off', `${analysis.spectral.spectral_rolloff?.toFixed(0)} Hz`],
    ['Stereo width', `${Math.round(analysis.stereo_width * 100)}%`],
    ['Compression', `${Math.round(analysis.mixing.compression * 100)}%`],
    ['Clarity', `${Math.round(analysis.mixing.clarity * 100)}%`],
  ];

  return (
    <div className="glass-card p-5">
      <h3>Mixing and engineering</h3>
      <div className="metric-grid">
        {features.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
