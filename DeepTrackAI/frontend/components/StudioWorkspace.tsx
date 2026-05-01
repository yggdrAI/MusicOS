import React, { useCallback, useMemo, useRef, useState } from 'react';
import { exportProject, GeneratedMusic, generateBeat, getErrorMessage, improveSong } from '../utils/api';
import { useApp } from '../context/AppContext';

type TrackKind = 'audio' | 'midi' | 'drum' | 'vocal';
type EffectKey = 'eq' | 'reverb' | 'delay' | 'compression' | 'distortion' | 'chorus' | 'limiter';

interface Clip {
  id: string;
  name: string;
  start: number;
  length: number;
  color: string;
}

interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  volume: number;
  pan: number;
  armed: boolean;
  muted: boolean;
  clips: Clip[];
}

const initialPattern = [
  { id: 'Kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
  { id: 'Snare', steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] },
  { id: 'Hat', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] },
  { id: 'Open', steps: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false] },
];

const defaultTracks: Track[] = [
  { id: 'drums', name: 'Drum Rack', kind: 'drum', volume: 0.86, pan: 0, armed: false, muted: false, clips: [{ id: 'c1', name: 'Pattern A', start: 0, length: 16, color: '#1ed760' }] },
  { id: 'bass', name: 'Sub Bass', kind: 'midi', volume: 0.74, pan: -0.08, armed: false, muted: false, clips: [{ id: 'c2', name: 'Bassline', start: 4, length: 12, color: '#38bdf8' }] },
  { id: 'keys', name: 'Hybrid Piano', kind: 'midi', volume: 0.62, pan: 0.12, armed: false, muted: false, clips: [{ id: 'c3', name: 'Chords', start: 8, length: 16, color: '#7c5cfc' }] },
  { id: 'vocal', name: 'Vocal Take', kind: 'vocal', volume: 0.92, pan: 0, armed: true, muted: false, clips: [] },
];

const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export default function StudioWorkspace() {
  const { state } = useApp();
  const [bpm, setBpm] = useState(state.analysis?.bpm || 124);
  const [tracks, setTracks] = useState(defaultTracks);
  const [pattern, setPattern] = useState(initialPattern);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState('');
  const [aiMusic, setAiMusic] = useState<GeneratedMusic | null>(null);
  const [aiStatus, setAiStatus] = useState('');
  const [effects, setEffects] = useState<Record<EffectKey, number>>({
    eq: 48,
    reverb: 24,
    delay: 18,
    compression: 55,
    distortion: 8,
    chorus: 22,
    limiter: 82,
  });
  const audioContext = useRef<AudioContext | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  const bars = useMemo(() => Array.from({ length: 32 }, (_, i) => i), []);

  const ensureAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  }, []);

  const playClick = useCallback((step: number) => {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const activeRows = pattern.filter((row) => row.steps[step % 16]);
    activeRows.forEach((row, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const freq = row.id === 'Kick' ? 72 : row.id === 'Snare' ? 190 : row.id === 'Hat' ? 7200 : 4200;
      osc.frequency.value = freq;
      osc.type = row.id === 'Kick' ? 'sine' : 'square';
      filter.type = row.id === 'Kick' ? 'lowpass' : 'highpass';
      filter.frequency.value = row.id === 'Kick' ? 180 : 1800;
      gain.gain.setValueAtTime(row.id === 'Kick' ? 0.22 : 0.07, now + index * 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    });
  }, [ensureAudio, pattern]);

  const togglePlayback = useCallback(() => {
    if (playing) {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      setPlaying(false);
      return;
    }
    ensureAudio().resume();
    setPlaying(true);
    timer.current = window.setInterval(() => {
      setPlayhead((current) => {
        const next = (current + 1) % 32;
        playClick(next);
        return next;
      });
    }, (60 / bpm / 4) * 1000);
  }, [bpm, ensureAudio, playClick, playing]);

  const toggleStep = (rowIndex: number, stepIndex: number) => {
    setPattern((rows) => rows.map((row, i) => i === rowIndex ? { ...row, steps: row.steps.map((on, s) => s === stepIndex ? !on : on) } : row));
  };

  const updateTrack = (trackId: string, patch: Partial<Track>) => {
    setTracks((items) => items.map((track) => track.id === trackId ? { ...track, ...patch } : track));
  };

  const startRecording = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setTracks((items) => items.map((track) => track.id === 'vocal' ? {
          ...track,
          clips: [...track.clips, { id: `take-${Date.now()}`, name: `Vocal take ${track.clips.length + 1}`, start: playhead, length: 8, color: '#f472b6' }],
        } : track));
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      setMicError(getErrorMessage(error) || 'Microphone permission was denied.');
    }
  };

  const stopRecording = () => {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(false);
  };

  const runGeneration = async () => {
    setAiStatus('Generating arrangement...');
    try {
      const response = await generateBeat({ genre: state.analysis?.genre.primary || 'Pop', bpm, mood: state.analysis?.mood.primary || 'Energetic', key: state.analysis?.key || 'C Major' });
      if (response.success) {
        setAiMusic(response.data);
        setPattern((rows) => rows.map((row) => ({
          ...row,
          steps: response.data.drum_pattern.map((step) => row.id === 'Kick' ? step.kick : row.id === 'Snare' ? step.snare : row.id === 'Hat' ? step.hihat : step.open_hat),
        })));
        setAiStatus('AI generated drums, bass, melody, chords, and arrangement.');
      } else {
        setAiStatus(response.error || 'Generation failed.');
      }
    } catch (error) {
      setAiStatus(getErrorMessage(error));
    }
  };

  const runImprove = async () => {
    if (!state.currentSongId) {
      setAiStatus('Upload a song first to run mix and songwriting critique.');
      return;
    }
    setAiStatus('Analyzing song for improvement opportunities...');
    try {
      const response = await improveSong(state.currentSongId);
      setAiStatus(response.success ? response.data.summary : response.error || 'Improve failed.');
    } catch (error) {
      setAiStatus(getErrorMessage(error));
    }
  };

  const runExport = async () => {
    setAiStatus('Rendering project manifest...');
    try {
      const response = await exportProject({ bpm, tracks, pattern, effects, ai_music: aiMusic });
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'musicos-project-export.json';
        a.click();
        setAiStatus('Project export is ready with stems, MIDI, and mix settings.');
      } else {
        setAiStatus(response.error || 'Export failed.');
      }
    } catch (error) {
      setAiStatus(getErrorMessage(error));
    }
  };

  return (
    <div className="studio-shell animate-fadeIn">
      <section className="transport-bar">
        <button className={playing ? 'transport-button active' : 'transport-button'} onClick={togglePlayback}>{playing ? 'Pause' : 'Play'}</button>
        <button className={recording ? 'transport-button record active' : 'transport-button record'} onClick={recording ? stopRecording : startRecording}>{recording ? 'Stop rec' : 'Record'}</button>
        <label>BPM <input type="number" min={55} max={220} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} /></label>
        <span>{state.analysis?.key || 'C Major'} / 4 tracks / 32 bars</span>
      </section>

      {micError && <div className="studio-alert">{micError}</div>}

      <section className="daw-grid">
        <div className="track-lane-panel">
          <div className="timeline-ruler">
            {bars.map((bar) => <span key={bar} className={playhead === bar ? 'active' : ''}>{bar + 1}</span>)}
          </div>
          {tracks.map((track) => (
            <div className="track-row" key={track.id}>
              <div className="track-header">
                <strong>{track.name}</strong>
                <small>{track.kind.toUpperCase()}</small>
                <div className="track-actions">
                  <button className={track.armed ? 'mini active' : 'mini'} onClick={() => updateTrack(track.id, { armed: !track.armed })}>Arm</button>
                  <button className={track.muted ? 'mini active' : 'mini'} onClick={() => updateTrack(track.id, { muted: !track.muted })}>Mute</button>
                </div>
              </div>
              <div className="clip-lane">
                <i style={{ left: `${(playhead / 32) * 100}%` }} />
                {track.clips.map((clip) => (
                  <button
                    key={clip.id}
                    className="clip-block"
                    style={{ left: `${(clip.start / 32) * 100}%`, width: `${(clip.length / 32) * 100}%`, background: clip.color }}
                  >
                    {clip.name}
                  </button>
                ))}
              </div>
              <div className="mixer-strip">
                <label>Vol <input type="range" min={0} max={1} step={0.01} value={track.volume} onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) })} /></label>
                <label>Pan <input type="range" min={-1} max={1} step={0.01} value={track.pan} onChange={(e) => updateTrack(track.id, { pan: Number(e.target.value) })} /></label>
              </div>
            </div>
          ))}
        </div>

        <aside className="ai-studio-panel">
          <p className="eyebrow">AI co-producer</p>
          <h2>Generate, improve, export.</h2>
          <div className="studio-button-grid">
            <button className="btn-primary" onClick={runGeneration}>AI Beat</button>
            <button className="btn-ghost" onClick={runImprove}>Improve Song</button>
            <button className="btn-ghost" onClick={runExport}>Export</button>
          </div>
          <p>{aiStatus || 'Ready to generate a beat, suggest a hook, tighten the mix, or export the project.'}</p>
          {aiMusic && (
            <dl className="detail-list">
              <div><dt>Chords</dt><dd>{aiMusic.chords.join(' - ')}</dd></div>
              <div><dt>Bass notes</dt><dd>{aiMusic.bassline.slice(0, 8).map((n) => n.note).join(' ')}</dd></div>
              <div><dt>Melody</dt><dd>{aiMusic.melody.slice(0, 8).map((n) => n.note).join(' ')}</dd></div>
            </dl>
          )}
        </aside>
      </section>

      <section className="studio-lower-grid">
        <div className="glass-card studio-card">
          <h3>Step Sequencer</h3>
          <div className="sequencer">
            {pattern.map((row, rowIndex) => (
              <React.Fragment key={row.id}>
                <strong>{row.id}</strong>
                {row.steps.map((on, stepIndex) => (
                  <button key={stepIndex} className={on ? 'seq-step on' : 'seq-step'} onClick={() => toggleStep(rowIndex, stepIndex)} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="glass-card studio-card">
          <h3>Piano Roll</h3>
          <div className="piano-roll-editor">
            {notes.map((note, row) => (
              <React.Fragment key={note}>
                <span>{note}</span>
                {bars.slice(0, 16).map((bar) => (
                  <button key={`${note}-${bar}`} className={(bar + row) % 5 === 0 ? 'piano-cell on' : 'piano-cell'} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="glass-card studio-card">
          <h3>DSP Rack</h3>
          <div className="effects-grid">
            {(Object.keys(effects) as EffectKey[]).map((key) => (
              <label key={key}>
                <span>{key}</span>
                <input type="range" min={0} max={100} value={effects[key]} onChange={(event) => setEffects((current) => ({ ...current, [key]: Number(event.target.value) }))} />
                <strong>{effects[key]}</strong>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
