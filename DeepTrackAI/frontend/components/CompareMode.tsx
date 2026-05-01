import React, { useState, useRef, useCallback } from 'react';
import { compareSongs, ComparisonResult, getErrorMessage } from '../utils/api';

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function CompareMode() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');
  const refA = useRef<HTMLInputElement>(null);
  const refB = useRef<HTMLInputElement>(null);

  const run = useCallback(async () => {
    if (!fileA || !fileB) return;
    setStatus('loading');
    setError('');
    try {
      const res = await compareSongs(fileA, fileB);
      if (res.success && res.data) { setResult(res.data); setStatus('done'); }
      else { setError(res.error || 'Comparison failed'); setStatus('error'); }
    } catch (err) { setError(getErrorMessage(err)); setStatus('error'); }
  }, [fileA, fileB]);

  const metrics: Array<{ key: string; label: string; fmt: (v: number) => string }> = [
    { key: 'bpm', label: 'BPM', fmt: (v) => String(Math.round(v)) },
    { key: 'energy', label: 'Energy', fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'danceability', label: 'Danceability', fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'loudness', label: 'Loudness', fmt: (v) => `${v.toFixed(1)} dB` },
    { key: 'valence', label: 'Valence', fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'commercial_viability', label: 'Viability', fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'vocal_presence', label: 'Vocals', fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'stereo_width', label: 'Width', fmt: (v) => `${Math.round(v * 100)}%` },
  ];

  if (status === 'done' && result) {
    return (
      <div className="compare-results animate-fadeIn">
        <div className="compare-header">
          <div className="compare-track-label"><span className="compare-dot a" />{result.track_a.filename}</div>
          <strong>vs</strong>
          <div className="compare-track-label"><span className="compare-dot b" />{result.track_b.filename}</div>
        </div>
        <div className="compare-grid">
          {metrics.map(({ key, label, fmt }) => {
            const a = (result.track_a as any)[key] as number;
            const b = (result.track_b as any)[key] as number;
            const delta = result.deltas[key];
            const maxVal = Math.max(Math.abs(a), Math.abs(b), 1);
            return (
              <div className="compare-row" key={key}>
                <span className="compare-val a">{fmt(a)}</span>
                <div className="compare-bar-wrap">
                  <span className="compare-label">{label}</span>
                  <div className="compare-bars">
                    <div className="compare-bar a" style={{ width: `${(Math.abs(a) / maxVal) * 100}%` }} />
                    <div className="compare-bar b" style={{ width: `${(Math.abs(b) / maxVal) * 100}%` }} />
                  </div>
                  {delta !== null && <span className="compare-delta">{delta > 0 ? '+' : ''}{key === 'bpm' || key === 'loudness' ? delta.toFixed(1) : `${Math.round(delta * 100)}%`}</span>}
                </div>
                <span className="compare-val b">{fmt(b)}</span>
              </div>
            );
          })}
        </div>
        <div className="compare-verdict glass-card">
          <strong>Verdict</strong>
          <p>{result.verdict}</p>
        </div>
        <button className="btn-ghost" onClick={() => { setStatus('idle'); setResult(null); setFileA(null); setFileB(null); }}>Compare again</button>
      </div>
    );
  }

  return (
    <div className="compare-upload animate-fadeInUp">
      <div className="analysis-hero">
        <div>
          <p className="eyebrow">Song comparison</p>
          <h2>Compare two tracks</h2>
          <p>Upload two audio files to see a side-by-side breakdown of BPM, energy, vocals, production quality, and commercial potential.</p>
        </div>
      </div>
      <div className="compare-drop-row">
        {[{ file: fileA, set: setFileA, ref: refA, label: 'Track A' }, { file: fileB, set: setFileB, ref: refB, label: 'Track B' }].map((slot) => (
          <div
            key={slot.label}
            className={`drop-zone compare-drop ${slot.file ? 'active' : ''}`}
            onClick={() => slot.ref.current?.click()}
          >
            <input ref={slot.ref} type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) slot.set(e.target.files[0]); }} />
            <div className="upload-glyph" style={{ width: 48, height: 48, fontSize: 22 }}><span>{slot.file ? '✓' : '♪'}</span></div>
            <strong style={{ color: 'var(--text-primary)', marginTop: 10 }}>{slot.file ? slot.file.name : slot.label}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{slot.file ? `${(slot.file.size / 1048576).toFixed(1)} MB` : 'Click to choose'}</span>
          </div>
        ))}
      </div>
      {error && <p style={{ color: 'var(--accent-tertiary)', textAlign: 'center' }}>{error}</p>}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn-primary" disabled={!fileA || !fileB || status === 'loading'} onClick={run}>
          {status === 'loading' ? 'Analyzing…' : 'Compare tracks'}
        </button>
      </div>
    </div>
  );
}
