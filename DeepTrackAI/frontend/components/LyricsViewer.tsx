import React from 'react';
import { useApp } from '../context/AppContext';

export default function LyricsViewer() {
  const { state } = useApp();
  const analysis = state.analysis;
  if (!analysis) return null;

  return (
    <div className="analysis-card-grid">
      <div className="glass-card p-5">
        <div className="card-heading">
          <div>
            <h3>Lyrics transcript</h3>
            <p>{analysis.lyrics_analysis.sentiment} / {analysis.lyrics_analysis.emotion}</p>
          </div>
          <span className="status-pill compact">AI transcribed</span>
        </div>
        <div className="lyrics-block">
          {analysis.lyrics_analysis.transcript.split('\n').map((line, index) => (
            <p key={index}>{line || '\u00A0'}</p>
          ))}
        </div>
      </div>
      <div className="glass-card p-5">
        <h3>Lyric intelligence</h3>
        <dl className="detail-list">
          <div><dt>Rhyme scheme</dt><dd>{analysis.lyrics_analysis.rhyme_scheme}</dd></div>
          <div><dt>Multi-syllable density</dt><dd>{Math.round(analysis.lyrics_analysis.multi_syllable_density * 100)}%</dd></div>
          <div><dt>Punchlines</dt><dd>{analysis.lyrics_analysis.punchlines.join(', ')}</dd></div>
          <div><dt>Metaphors</dt><dd>{analysis.lyrics_analysis.metaphors.join(', ')}</dd></div>
        </dl>
        <div className="density-chart">
          {analysis.lyrics_analysis.lyric_density.map((item) => (
            <div key={item.section}>
              <span>{item.section}</span>
              <i><b style={{ width: `${item.density * 100}%` }} /></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
