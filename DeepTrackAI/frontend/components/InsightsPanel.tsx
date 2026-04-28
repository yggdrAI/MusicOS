import React from 'react';

export default function InsightsPanel() {
  // Placeholder for genre, style, artist similarity, mood
  return (
    <div className="mb-4 p-4 bg-gray-700 rounded">
      <h3 className="font-semibold mb-2">Insights</h3>
      <ul className="text-gray-300">
        <li>Genre: [--]</li>
        <li>Style Similarity: [--]</li>
        <li>Artist: [--]</li>
        <li>Mood: [--]</li>
      </ul>
    </div>
  );
}
