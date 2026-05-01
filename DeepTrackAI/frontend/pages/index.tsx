import Head from 'next/head';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import UploadZone from '../components/UploadZone';
import AnalysisDashboard from '../components/AnalysisDashboard';
import InsightsPanel from '../components/InsightsPanel';
import StudioWorkspace from '../components/StudioWorkspace';

export default function Home() {
  const { state } = useApp();

  return (
    <>
      <Head>
        <title>MusicOS - AI Music Operating System</title>
        <meta
          name="description"
          content="AI music intelligence for tempo, key, stems, vocals, lyrics, mix quality, and commercial insights."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="product-shell">
        <Sidebar />

        <main className="workspace">
          <header className="topbar">
            <div>
              <p className="eyebrow">AI music operating system</p>
              <h1>{state.view === 'studio' ? 'Creation Studio' : state.view === 'analysis' ? state.currentFilename || 'Analysis' : 'MusicOS'}</h1>
            </div>
            <div className="status-pill">
              <span />
              Live pipeline
            </div>
          </header>

          {state.view === 'studio' ? (
            <StudioWorkspace />
          ) : state.view === 'home' ? (
            <section className="home-grid">
              <div className="intro-panel">
                <p className="eyebrow">Upload to insight</p>
                <h2>Analyze songs deeply, build tracks in the browser, and export production-ready ideas.</h2>
                <p>
                  MusicOS combines audio analysis, lyric intelligence, Web Audio editing, AI beat generation,
                  vocal capture, mix guidance, song DNA, and project export in one integrated workspace.
                </p>
              </div>
              <UploadZone />
              <div className="pipeline-strip">
                {['Ingest', 'Preprocess', 'Extract', 'Analyze', 'Render'].map((step, index) => (
                  <div key={step}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <AnalysisDashboard />
          )}
        </main>

        <aside className="insight-rail">
          <InsightsPanel compact={state.view === 'home'} />
        </aside>
      </div>
    </>
  );
}
