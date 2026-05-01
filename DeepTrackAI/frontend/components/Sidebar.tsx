import React from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { id: 'home', label: 'Analyze', icon: 'A' },
  { id: 'studio', label: 'Studio', icon: 'S' },
  { id: 'reports', label: 'Reports', icon: 'R' },
];

export default function Sidebar() {
  const { state, goHome, openStudio } = useApp();

  return (
    <aside className="sidebar">
      <button className="brand" onClick={goHome}>
        <span>M</span>
        <strong>MusicOS</strong>
        <em>AI</em>
      </button>

      <nav>
        <p className="eyebrow">Workspace</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.id === 'home' ? goHome : item.id === 'studio' ? openStudio : undefined}
            className={state.view === item.id ? 'active' : ''}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {state.analysis && (
        <section className="recent-track">
          <p className="eyebrow">Current track</p>
          <strong>{state.currentFilename || state.analysis.filename}</strong>
          <span>{state.analysis.bpm} BPM / {state.analysis.key}</span>
        </section>
      )}

      <section className="sidebar-footer">
        <span>Pipeline health</span>
        <strong>{state.uploadStatus === 'error' ? 'Needs attention' : 'Operational'}</strong>
      </section>
    </aside>
  );
}
