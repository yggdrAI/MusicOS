import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { exportData, getErrorMessage } from '../utils/api';

type ExportFmt = 'midi' | 'chords' | 'drums' | 'summary';

const formats: Array<{ id: ExportFmt; label: string; icon: string; desc: string }> = [
  { id: 'midi', label: 'MIDI melody', icon: '♪', desc: 'Note sequence with pitch, velocity, and timing data' },
  { id: 'chords', label: 'Chord progression', icon: '♫', desc: 'Detected chord changes mapped to song sections' },
  { id: 'drums', label: 'Drum pattern', icon: '⊞', desc: '16-step kick/snare/hihat grid at detected BPM' },
  { id: 'summary', label: 'Analysis summary', icon: '▤', desc: 'Full report with strengths and recommendations' },
];

export default function ProducerTools() {
  const { state } = useApp();
  const [selected, setSelected] = useState<ExportFmt>('chords');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const songId = state.currentSongId;

  const run = useCallback(async (fmt: ExportFmt) => {
    if (!songId) return;
    setSelected(fmt);
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await exportData(songId, fmt);
      if (res.success) setData(res.data);
      else setError(res.error || 'Export failed');
    } catch (err) { setError(getErrorMessage(err)); }
    setLoading(false);
  }, [songId]);

  if (!state.analysis) return null;

  return (
    <div className="producer-tools animate-fadeIn">
      <div className="analysis-hero">
        <div>
          <p className="eyebrow">Producer toolkit</p>
          <h2>Export & production data</h2>
          <p>Extract MIDI, chord progressions, drum patterns, and analysis reports from your track.</p>
        </div>
      </div>

      <div className="producer-format-grid">
        {formats.map((f) => (
          <button key={f.id} className={`producer-format-card ${selected === f.id ? 'active' : ''}`} onClick={() => run(f.id)}>
            <span className="producer-icon">{f.icon}</span>
            <strong>{f.label}</strong>
            <span>{f.desc}</span>
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--accent-tertiary)', padding: 12 }}>{error}</p>}
      {loading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Exporting…</div>}

      {data && !loading && (
        <div className="glass-card" style={{ padding: 20 }}>
          {selected === 'chords' && (
            <>
              <h3>Chord progression — {data.key}</h3>
              <p style={{ color: 'var(--accent-primary)', fontSize: 20, fontWeight: 800, margin: '12px 0' }}>{data.progression}</p>
              <div className="section-timeline" style={{ marginTop: 12 }}>
                {data.sections?.map((s: any) => (
                  <div key={s.label} style={{ flex: 1, background: 'var(--accent-primary)', opacity: 0.7, minWidth: 32 }}>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {selected === 'drums' && (
            <>
              <h3>Drum pattern — {data.bpm} BPM ({data.time_signature})</h3>
              <div className="drum-grid">
                <div className="drum-label-col">
                  {['Kick', 'Snare', 'Hi-hat', 'Open hat'].map((l) => <span key={l}>{l}</span>)}
                </div>
                <div className="drum-steps">
                  {data.pattern?.map((step: any) => (
                    <div key={step.beat} className="drum-col">
                      <span className={`drum-cell ${step.kick ? 'on' : ''}`} />
                      <span className={`drum-cell ${step.snare ? 'on' : ''}`} />
                      <span className={`drum-cell ${step.hihat ? 'on' : ''}`} />
                      <span className={`drum-cell ${step.open_hat ? 'on' : ''}`} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selected === 'midi' && (
            <>
              <h3>MIDI data — {data.key} at {data.bpm} BPM</h3>
              <div className="midi-roll">
                {data.notes?.slice(0, 24).map((n: any, i: number) => (
                  <div key={i} className="midi-note" style={{ left: `${(n.start / 16) * 100}%`, bottom: `${((n.pitch - 60) / 12) * 100}%`, width: `${(n.duration / 16) * 100}%`, opacity: n.velocity / 100 }} />
                ))}
              </div>
            </>
          )}

          {selected === 'summary' && (
            <>
              <h3>{data.filename}</h3>
              <dl className="detail-list">
                <div><dt>Genre</dt><dd>{data.genre?.primary} / {data.genre?.secondary}</dd></div>
                <div><dt>Mood</dt><dd>{data.mood?.primary} / {data.mood?.secondary}</dd></div>
                <div><dt>BPM / Key</dt><dd>{data.bpm} / {data.key}</dd></div>
                <div><dt>Viability</dt><dd>{Math.round(data.commercial_viability * 100)}%</dd></div>
              </dl>
              <div style={{ marginTop: 16 }}>
                <h3>Strengths</h3>
                <ul className="rail-list">{data.strengths?.map((s: string) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div style={{ marginTop: 16 }}>
                <h3>Opportunities</h3>
                <ul className="rail-list muted">{data.opportunities?.map((s: string) => <li key={s}>{s}</li>)}</ul>
              </div>
            </>
          )}

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn-ghost" onClick={() => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selected}_export.json`; a.click(); }}>
              Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
