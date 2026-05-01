import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getFingerprint, FingerprintResult, getErrorMessage } from '../utils/api';

export default function SongFingerprint() {
  const { state } = useApp();
  const [data, setData] = useState<FingerprintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const songId = state.currentSongId;

  const run = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getFingerprint(songId);
      if (res.success && res.data) setData(res.data);
      else setError(res.error || 'Fingerprint failed');
    } catch (err) { setError(getErrorMessage(err)); }
    setLoading(false);
  }, [songId]);

  if (!state.analysis) return null;

  return (
    <div className="fingerprint-panel animate-fadeIn">
      <div className="analysis-hero">
        <div>
          <p className="eyebrow">Song DNA</p>
          <h2>Fingerprint & similarity</h2>
          <p>Generate a unique embedding vector for this track and find acoustically similar songs in your library.</p>
        </div>
        <div className="hero-actions">
          <button className="btn-primary" onClick={run} disabled={loading || !songId}>
            {loading ? 'Computing…' : data ? 'Regenerate' : 'Generate fingerprint'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--accent-tertiary)', padding: '12px 0' }}>{error}</p>}

      {data && (
        <div className="dashboard-stack">
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="card-heading">
              <div>
                <h3>Embedding vector</h3>
                <p>{data.dimensions} dimensions · hash {data.fingerprint_hash}</p>
              </div>
              <span className="status-pill compact">DNA</span>
            </div>
            <div className="fingerprint-viz">
              {data.embedding.map((v, i) => (
                <div
                  key={i}
                  className="fp-bar"
                  style={{
                    height: `${Math.abs(v) * 100}%`,
                    background: v >= 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                    opacity: 0.4 + Math.abs(v) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          {data.similar_songs.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3>Similar songs in library</h3>
              <div className="similar-list">
                {data.similar_songs.map((song) => (
                  <div key={song.song_id} className="similar-row">
                    <strong>{song.filename}</strong>
                    <div className="similar-bar-wrap">
                      <div className="similar-bar" style={{ width: `${song.similarity * 100}%` }} />
                    </div>
                    <span>{Math.round(song.similarity * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.similar_songs.length === 0 && (
            <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Upload more tracks to discover similarities.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
