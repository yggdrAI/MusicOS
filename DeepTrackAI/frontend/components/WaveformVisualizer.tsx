import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function WaveformVisualizer() {
  const { state } = useApp();
  const [playing, setPlaying] = useState(false);
  const analysis = state.analysis;
  const bars = useMemo(() => {
    const waveform = analysis?.waveform || [];
    if (!waveform.length) return [];
    const target = 96;
    const step = Math.max(1, Math.floor(waveform.length / target));
    return waveform.filter((_, index) => index % step === 0).slice(0, target);
  }, [analysis?.waveform]);

  if (!analysis) return null;

  return (
    <div className="glass-card p-5">
      <div className="card-heading">
        <div>
          <h3>Waveform and beat timeline</h3>
          <p>
            {Math.floor(analysis.duration / 60)}:{String(Math.floor(analysis.duration % 60)).padStart(2, '0')} ·{' '}
            {(analysis.sample_rate / 1000).toFixed(1)} kHz · {analysis.channels} channel
          </p>
        </div>
        <button className="icon-button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause preview' : 'Play preview'}>
          {playing ? 'II' : '▶'}
        </button>
      </div>

      <div className="waveform">
        {bars.map((value, index) => (
          <span
            key={index}
            className={playing ? 'playing' : ''}
            style={{
              height: `${Math.max(8, value * 100)}%`,
              animationDelay: `${index * 12}ms`,
            }}
          />
        ))}
      </div>

      <div className="section-timeline">
        {analysis.sections.map((section) => {
          const width = ((section.end - section.start) / analysis.duration) * 100;
          return (
            <div key={`${section.label}-${section.start}`} style={{ width: `${Math.max(2, width)}%`, background: section.color }}>
              <span>{section.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
