import React from 'react';
import { useApp } from '../context/AppContext';

export default function StemPlayer() {
  const { state } = useApp();
  const stems = state.analysis?.stems;
  if (!stems) return null;

  return (
    <div className="glass-card p-5">
      <h3>Instrument and stem balance</h3>
      <div className="stem-list">
        {Object.entries(stems).map(([key, stem]) => (
          <div key={key}>
            <div>
              <strong>{key}</strong>
              <span>{Math.round(stem.level * 100)}%</span>
            </div>
            <i><b style={{ width: `${stem.level * 100}%` }} /></i>
          </div>
        ))}
      </div>
      <div className="instrument-grid">
        {state.analysis?.instruments.map((instrument) => (
          <span key={instrument.name}>{instrument.name} {Math.round(instrument.confidence * 100)}%</span>
        ))}
      </div>
    </div>
  );
}
