import React, { useState } from 'react';
import UploadSection from './UploadSection';
import Dashboard from './Dashboard';
import OutputPanel from './OutputPanel';
import { useUploadStatus } from '../hooks/useUploadStatus';

export default function IntegrationRoot() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const { status, result, error } = useUploadStatus(taskId);

  return (
    <>
      <UploadSection />
      {/* In a real app, pass setTaskId to UploadSection and update on upload */}
      <Dashboard />
      <OutputPanel result={result} />
      {status === 'processing' && <div className="text-blue-400 mt-4">Processing...</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
    </>
  );
}
