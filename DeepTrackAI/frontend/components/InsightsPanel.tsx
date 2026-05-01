import React from 'react';
import { useApp } from '../context/AppContext';

export default function InsightsPanel({ compact = false }: { compact?: boolean }) {
  const { state } = useApp();
  const analysis = state.analysis;

  if (!analysis || compact) {
    return (
      <div className="rail-panel">
        <p className="eyebrow">System pipeline</p>
        <h2>Upload → Process → Analyze → Render</h2>
        <div className="pipeline-list">
          {[
            ['File ingestion', 'Validated audio upload with resilient API handling'],
            ['Audio preprocessing', 'Waveform, duration, sample rate, beat grid'],
            ['Feature extraction', 'Tempo, key, rhythm, spectrum, stems, mix'],
            ['AI analysis', 'Vocals, lyrics, genre, mood, commercial signal'],
            ['UI rendering', 'Structured JSON mapped into stable dashboards'],
          ].map(([title, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const insightCards = [
    ['Vibe fingerprint', analysis.insights.vibe_fingerprint],
    ['Rhyme scheme', analysis.lyrics_analysis.rhyme_scheme],
    ['Mix read', `${analysis.mixing.eq_balance}, ${analysis.mixing.headroom_db} dB headroom`],
    ['Rhythm', analysis.rhythm.pattern],
  ];

  return (
    <div className="rail-panel animate-slideInRight">
      <p className="eyebrow">Executive insight</p>
      <h2>{Math.round(analysis.insights.commercial_viability * 100)}% commercial viability</h2>

      <div className="rail-section">
        <h3>Tags</h3>
        <div className="tag-cloud">
          <span>{analysis.genre.primary}</span>
          <span>{analysis.genre.secondary}</span>
          {analysis.insights.sub_genre_tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </div>

      <div className="rail-section">
        <h3>Readout</h3>
        {insightCards.map(([label, value]) => (
          <div className="rail-readout" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="rail-section">
        <h3>Strengths</h3>
        <ul className="rail-list">
          {analysis.insights.strengths.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="rail-section">
        <h3>Opportunities</h3>
        <ul className="rail-list muted">
          {analysis.insights.opportunities.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}
