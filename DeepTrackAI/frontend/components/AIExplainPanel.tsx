import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { explainLyrics, ExplainResult, getErrorMessage } from '../utils/api';

export default function AIExplainPanel() {
  const { state } = useApp();
  const [data, setData] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const songId = state.currentSongId;

  const run = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    setError('');
    try {
      const res = await explainLyrics(songId);
      if (res.success && res.data) setData(res.data);
      else setError(res.error || 'Explain failed');
    } catch (err) { setError(getErrorMessage(err)); }
    setLoading(false);
  }, [songId]);

  if (!state.analysis) return null;

  return (
    <div className="explain-panel animate-fadeIn">
      <div className="analysis-hero">
        <div>
          <p className="eyebrow">AI explain mode</p>
          <h2>Lyrics meaning breakdown</h2>
          <p>Get line-by-line interpretation, literary device detection, metaphor analysis, and cultural context.</p>
        </div>
        <div className="hero-actions">
          <button className="btn-primary" onClick={run} disabled={loading || !songId}>
            {loading ? 'Analyzing…' : data ? 'Re-analyze' : 'Explain lyrics'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent-tertiary)', padding: '12px 0' }}>{error}</p>}

      {data && (
        <div className="dashboard-stack">
          <div className="glass-card" style={{ padding: 20 }}>
            <h3>Overall theme</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.overall_theme}</p>
            <div style={{ marginTop: 12 }}>
              <span className="status-pill compact"><span />{data.sentiment_arc}</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <h3>Line-by-line breakdown</h3>
            <div className="explain-lines">
              {data.line_explanations.map((line, i) => (
                <div key={i} className="explain-line">
                  <q style={{ color: 'var(--accent-primary)', fontStyle: 'italic', display: 'block', marginBottom: 6 }}>{line.line}</q>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{line.meaning}</p>
                  <div className="tag-cloud" style={{ marginTop: 8 }}>
                    {line.devices.map((d) => <span key={d}>{d}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.metaphor_breakdown.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3>Metaphor breakdown</h3>
              <dl className="detail-list">
                {data.metaphor_breakdown.map((m) => (
                  <div key={m.phrase}>
                    <dt>{m.phrase}</dt>
                    <dd>{m.explanation}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
