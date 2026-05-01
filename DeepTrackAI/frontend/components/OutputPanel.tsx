import React from 'react';
import { formatOutput } from '../utils/formatOutput';

export default function OutputPanel({ result }: { result: any }) {
  if (!result) return null;
  return (
    <div className="mt-8 p-4 bg-gray-800 rounded text-sm overflow-x-auto">
      <h3 className="font-semibold mb-2">Analysis Output</h3>
      <pre className="text-green-300 whitespace-pre-wrap">{formatOutput(result)}</pre>
    </div>
  );
}
