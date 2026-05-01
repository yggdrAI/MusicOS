import React from 'react';
import { useApp } from '../context/AppContext';
import WaveformVisualizer from './WaveformVisualizer';
import StatsGrid from './StatsGrid';
import StemPlayer from './StemPlayer';
import LyricsViewer from './LyricsViewer';
import SpectralView from './SpectralView';
import CompareMode from './CompareMode';
import AIExplainPanel from './AIExplainPanel';
import ProducerTools from './ProducerTools';
import SongFingerprint from './SongFingerprint';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'production', label: 'Production' },
  { id: 'vocals', label: 'Vocals' },
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'explain', label: 'AI Explain' },
  { id: 'producer', label: 'Producer' },
  { id: 'fingerprint', label: 'DNA' },
  { id: 'compare', label: 'Compare' },
];

function ScoreRing({ value, label }: { value: number; label: string }) {
  const degrees = Math.round(value * 360);
  return (
    <div className="score-ring" style={{ background: `conic-gradient(var(--accent-primary) ${degrees}deg, var(--bg-elevated) 0deg)` }}>
      <div>
        <strong>{Math.round(value * 100)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function AnalysisDashboard() {
  const { state, dispatch, goHome } = useApp();
  const analysis = state.analysis;

  if (!analysis) {
    return (
      <div className="empty-state">
        <h2>No analysis loaded</h2>
        <button className="btn-primary" onClick={goHome}>Upload a track</button>
      </div>
    );
  }

  // Compare is always accessible, even without analysis
  if (state.activeTab === 'compare') {
    return (
      <div className="dashboard animate-fadeIn">
        <div className="tab-strip">
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-item ${state.activeTab === tab.id ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}>
              {tab.label}
            </button>
          ))}
        </div>
        <CompareMode />
      </div>
    );
  }

  return (
    <div className="dashboard animate-fadeIn">
      <section className="analysis-hero">
        <div>
          <p className="eyebrow">{analysis.genre.primary} / {analysis.genre.secondary}</p>
          <h2>{state.currentFilename || analysis.filename}</h2>
          <p>
            {analysis.bpm} BPM · {analysis.key} · {Math.floor(analysis.duration / 60)}:
            {String(Math.floor(analysis.duration % 60)).padStart(2, '0')} · {analysis.insights.vibe_fingerprint}
          </p>
        </div>
        <div className="hero-actions">
          <ScoreRing value={analysis.insights.commercial_viability} label="viability" />
          <button className="btn-ghost" onClick={goHome}>New analysis</button>
        </div>
      </section>

      <div className="tab-strip">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${state.activeTab === tab.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {state.activeTab === 'overview' && (
        <div className="dashboard-stack">
          <StatsGrid />
          <WaveformVisualizer />
          <div className="analysis-card-grid">
            <SpectralView mode="spectrum" />
            <SpectralView mode="energy" />
          </div>
        </div>
      )}

      {state.activeTab === 'production' && (
        <div className="dashboard-stack">
          <div className="analysis-card-grid">
            <StemPlayer />
            <SpectralView mode="metrics" />
          </div>
          <WaveformVisualizer />
        </div>
      )}

      {state.activeTab === 'vocals' && (
        <div className="dashboard-stack">
          <div className="analysis-card-grid">
            <div className="glass-card" style={{ padding: 20 }}>
              <h3>Vocal intelligence</h3>
              {[
                ['Presence', analysis.vocals.presence],
                ['Clarity', analysis.vocals.clarity],
                ['Pitch accuracy', analysis.vocals.pitch_accuracy],
                ['Autotune likelihood', analysis.vocals.autotune],
              ].map(([label, value]) => (
                <div className="metric-row" key={label as string}>
                  <span>{label}</span>
                  <div><i style={{ width: `${Number(value) * 100}%` }} /></div>
                  <strong>{Math.round(Number(value) * 100)}%</strong>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3>Flow analysis</h3>
              <dl className="detail-list">
                <div><dt>Cadence</dt><dd>{analysis.vocals.cadence}</dd></div>
                <div><dt>Bar structure</dt><dd>{analysis.vocals.bar_structure}</dd></div>
                <div><dt>Flow</dt><dd>{analysis.vocals.flow}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {state.activeTab === 'lyrics' && (
        <div className="dashboard-stack">
          <LyricsViewer />
        </div>
      )}

      {state.activeTab === 'explain' && <AIExplainPanel />}
      {state.activeTab === 'producer' && <ProducerTools />}
      {state.activeTab === 'fingerprint' && <SongFingerprint />}
    </div>
  );
}
