import React from 'react';
import { useApp } from '../context/AppContext';

export default function StatsGrid() {
  const { state } = useApp();
  const analysis = state.analysis;
  if (!analysis) return null;

  const stats = [
    ['BPM', analysis.bpm, 'Tempo'],
    ['Key', analysis.key, 'Detected scale'],
    ['Energy', `${Math.round(analysis.energy * 100)}%`, analysis.mood.primary],
    ['Dance', `${Math.round(analysis.danceability * 100)}%`, 'Groove factor'],
    ['Swing', `${Math.round(analysis.swing * 100)}%`, analysis.rhythm.pattern],
    ['Width', `${Math.round(analysis.stereo_width * 100)}%`, 'Stereo image'],
  ];

  return (
    <div className="stats-grid stagger-children">
      {stats.map(([label, value, sub]) => (
        <div key={label} className="stat-card">
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{sub}</small>
        </div>
      ))}
    </div>
  );
}
