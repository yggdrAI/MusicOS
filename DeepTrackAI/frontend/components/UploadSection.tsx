import React, { useRef, useState } from 'react';
import axios from 'axios';

export default function UploadSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / (p.total || 1)))
      });
      setSuccess('Upload successful!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2">Upload a Song</h2>
      <input
        type="file"
        accept="audio/*"
        ref={fileInput}
        onChange={handleFileChange}
        className="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        disabled={uploading}
      />
      {uploading && <div className="mt-2 text-blue-400">Uploading... {progress}%</div>}
      {error && <div className="mt-2 text-red-400">{error}</div>}
      {success && <div className="mt-2 text-green-400">{success}</div>}
    </div>
  );
}
