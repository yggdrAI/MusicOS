import React from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import StemPlayer from './StemPlayer';
import LyricsViewer from './LyricsViewer';
import BeatBPMDisplay from './BeatBPMDisplay';
import InsightsPanel from './InsightsPanel';

export default function Dashboard() {
  // In a real app, this would be driven by state/context after upload/analysis
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <div>
        <WaveformVisualizer />
        <StemPlayer />
      </div>
      <div>
        <LyricsViewer />
        <BeatBPMDisplay />
        <InsightsPanel />
      </div>
    </div>
  );
}
