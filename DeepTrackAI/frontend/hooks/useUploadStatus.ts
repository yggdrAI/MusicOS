import { useState, useEffect } from 'react';
import axios from 'axios';

export function useUploadStatus(taskId: string | null) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    setStatus('processing');
    setResult(null);
    setError(null);
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/status?taskId=${taskId}`);
        if (res.data.status === 'SUCCESS' || res.data.status === 'done') {
          setStatus('done');
          setResult(res.data.result);
          clearInterval(interval);
        } else if (res.data.status === 'FAILURE' || res.data.status === 'error') {
          setStatus('error');
          setError('Processing failed');
          clearInterval(interval);
        }
      } catch (err: any) {
        setStatus('error');
        setError('Error fetching status');
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [taskId]);

  return { status, result, error };
}
