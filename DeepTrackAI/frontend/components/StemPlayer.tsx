import React from 'react';

export default function StemPlayer() {
  // Placeholder for stem toggles
  return (
    <div className="mb-4 p-4 bg-gray-700 rounded">
      <h3 className="font-semibold mb-2">Stem Player</h3>
      <div className="flex gap-2">
        <button className="bg-blue-600 px-3 py-1 rounded">Vocals</button>
        <button className="bg-blue-600 px-3 py-1 rounded">Drums</button>
        <button className="bg-blue-600 px-3 py-1 rounded">Bass</button>
        <button className="bg-blue-600 px-3 py-1 rounded">Instruments</button>
      </div>
    </div>
  );
}
