import React, { useCallback, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function UploadZone() {
  const { state, uploadFile } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewBars, setPreviewBars] = useState<number[]>([]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('audio/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        const step = Math.max(1, Math.floor(bytes.length / 56));
        const bars = Array.from({ length: 56 }, (_, index) => {
          const chunk = bytes.slice(index * step, index * step + step);
          const avg = chunk.reduce((sum, byte) => sum + Math.abs(byte - 128), 0) / Math.max(1, chunk.length);
          return Math.max(0.12, Math.min(1, avg / 64));
        });
        setPreviewBars(bars);
      };
      reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
      uploadFile(file);
    },
    [uploadFile]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const isUploading = ['uploading', 'processing', 'analyzing', 'rendering'].includes(state.uploadStatus);
  const isError = state.uploadStatus === 'error';
  const stages = ['Uploading', 'Audio preprocessing', 'AI analysis', 'Rendering insights'];

  return (
    <div className="w-full animate-fadeInUp">
      <div
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isUploading && inputRef.current?.click()}
        style={{ cursor: isUploading ? 'default' : 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div className="animate-fadeIn">
            <div className="flex justify-center mb-4">
              <div className="upload-spinner">
                <div />
              </div>
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {state.uploadStage}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              {state.currentFilename}
            </p>
            <div className="preview-wave mb-6" aria-label="Waveform preview">
              {(previewBars.length ? previewBars : Array.from({ length: 56 }, (_, index) => ((index % 9) + 2) / 12)).map(
                (bar, index) => (
                  <span
                    key={index}
                    className="preview-wave-bar"
                    style={{ height: `${Math.max(10, bar * 52)}px`, animationDelay: `${index * 18}ms` }}
                  />
                )
              )}
            </div>
            <div className="progress-bar w-full max-w-md mx-auto">
              <div className="progress-bar-fill" style={{ width: `${state.uploadProgress}%` }} />
            </div>
            <div className="stage-row">
              {stages.map((stage) => (
                <span key={stage} className={state.uploadStage === stage ? 'active' : ''}>
                  {stage}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-5">
              <div className="upload-glyph animate-breathe">
                <span>{isError ? '!' : '♪'}</span>
              </div>
            </div>

            <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {isError ? 'Upload failed' : 'Drop your track here'}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {isError ? state.error : 'MP3, WAV, FLAC. Audio, vocal, lyric, mix, and commercial analysis.'}
            </p>

            <button className="btn-primary">
              <span>↑</span>
              Choose file
            </button>

            <div className="upload-feature-grid">
              {['Tempo and key', 'Stem intelligence', 'Lyrics and flow', 'Mix insights'].map((feature) => (
                <span key={feature} className="upload-feature">
                  <span>✓</span> {feature}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
